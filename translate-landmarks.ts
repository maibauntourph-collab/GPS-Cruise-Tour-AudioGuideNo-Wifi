/**
 * translate-landmarks.ts
 * landmarks.translations에 5개 언어 추가 (en 기반)
 * 번역 대상: name, description, detailedDescription (narration 제외)
 * 실행: npx tsx translate-landmarks.ts
 * 재시작: npx tsx translate-landmarks.ts --resume
 */

import Anthropic from "@anthropic-ai/sdk";
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import * as fs from "fs";
dotenv.config();

const sql = neon(process.env.DATABASE_URL!);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TARGET_LANGUAGES: Record<string, string> = {
  "zh-CN": "Simplified Chinese",
  "zh-TW": "Traditional Chinese",
  "ja":    "Japanese",
  "es":    "Spanish",
  "it":    "Italian",
};

const LANG_CODES = Object.keys(TARGET_LANGUAGES);
const PROGRESS_FILE = "./translate-progress.json";

function loadProgress(): Set<string> {
  try {
    const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
    return new Set(data.completed || []);
  } catch {
    return new Set();
  }
}

function saveProgress(completed: Set<string>) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ completed: [...completed] }));
}

async function translateToAllLanguages(
  name: string,
  description: string,
  detailedDescription: string
): Promise<Record<string, any>> {

  const langList = LANG_CODES.map((code) => code + "=" + TARGET_LANGUAGES[code]).join(", ");

  // detailedDescription 500자 제한 (JSON 잘림 방지)
  const shortDesc = detailedDescription.slice(0, 500);

  const promptLines = [
    "Translate this tourism content into 5 languages: " + langList,
    "",
    "Return ONLY a JSON object (no markdown, no extra text):",
    "{",
    '  "zh-CN": {"name":"...","description":"...","detailedDescription":"..."},',
    '  "zh-TW": {"name":"...","description":"...","detailedDescription":"..."},',
    '  "ja":    {"name":"...","description":"...","detailedDescription":"..."},',
    '  "es":    {"name":"...","description":"...","detailedDescription":"..."},',
    '  "it":    {"name":"...","description":"...","detailedDescription":"..."}',
    "}",
    "",
    "SOURCE (English):",
    "name: " + name,
    "description: " + description,
    "detailedDescription: " + shortDesc,
    "",
    "Rules:",
    "- Keep proper nouns (place/brand names) unchanged",
    "- Natural tourist-guide tone",
    "- If detailedDescription is empty, use empty string",
    "- Output ONLY the JSON, nothing else",
  ];

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 16000,
    messages: [{ role: "user", content: promptLines.join("\n") }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("JSON not found in response");
  return JSON.parse(jsonMatch[0]);
}

async function main() {
  const isResume = process.argv.includes("--resume");
  const completed = isResume ? loadProgress() : new Set<string>();

  if (isResume) {
    console.log("\n📂 이어서 실행 (완료: " + completed.size + "개)\n");
  }

  const landmarks = await sql`
    SELECT id, name, city_id, translations
    FROM landmarks
    WHERE translations IS NOT NULL
    ORDER BY city_id, id
  `;

  const total = landmarks.length;
  let successCount = completed.size;
  let failStreak = 0;

  console.log("\n🌍 번역 시작: 총 " + total + "개");
  console.log("대상 언어: " + LANG_CODES.join(", "));
  console.log("━".repeat(50));

  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i];

    if (completed.has(lm.id)) {
      continue;
    }

    try {
      const translations =
        typeof lm.translations === "string"
          ? JSON.parse(lm.translations)
          : lm.translations;

      const en = translations?.en;
      if (!en?.name) {
        console.log("  ⚠️  [" + (i + 1) + "/" + total + "] " + lm.id + ": en 없음, 스킵");
        continue;
      }

      console.log("  🔄 [" + (i + 1) + "/" + total + "] " + lm.city_id + " / " + lm.name);

      const translated = await translateToAllLanguages(
        en.name,
        en.description || "",
        en.detailedDescription || ""
      );

      const newTranslations = { en, ...translated };

      await sql`
        UPDATE landmarks
        SET translations = ${JSON.stringify(newTranslations)}::json,
            updated_at = NOW()
        WHERE id = ${lm.id}
      `;

      successCount++;
      failStreak = 0;
      completed.add(lm.id);
      saveProgress(completed);

      console.log("  ✅ 완료 " + successCount + "/" + total);

      await new Promise((r) => setTimeout(r, 800));

    } catch (err: any) {
      failStreak++;
      console.error("  ❌ 실패 [" + lm.id + "]: " + err.message);

      if (failStreak >= 5) {
        console.error("\n⛔ 연속 실패 5회. 중단.");
        console.log("💡 재실행: npx tsx translate-landmarks.ts --resume");
        break;
      }

      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  console.log("\n" + "━".repeat(50));
  console.log("✅ 완료: " + successCount + "개");
  console.log("📊 생성 번역: " + successCount * LANG_CODES.length + "개");
}

async function verify() {
  const result = await sql`
    SELECT
      city_id,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE translations::jsonb ? 'zh-CN') as has_zh,
      COUNT(*) FILTER (WHERE translations::jsonb ? 'ja') as has_ja,
      COUNT(*) FILTER (WHERE translations::jsonb ? 'es') as has_es,
      COUNT(*) FILTER (WHERE translations::jsonb ? 'it') as has_it
    FROM landmarks
    GROUP BY city_id
    ORDER BY city_id
  `;
  console.log("\n📊 번역 현황:\n");
  console.table(result);
}

const args = process.argv.slice(2);
if (args.includes("--verify")) {
  verify().catch(console.error);
} else {
  main().catch(console.error);
}

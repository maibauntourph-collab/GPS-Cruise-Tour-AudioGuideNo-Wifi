/**
 * translate-landmarks.ts
 * landmarks.translations에 23개 언어 추가 (en 기반)
 * 
 * 번역 대상: name, description, detailedDescription (narration 제외)
 * API: Claude claude-sonnet-4-20250514 (1 landmark = 1 API 호출로 23개 언어 동시)
 * 
 * 실행: npx tsx translate-landmarks.ts
 * 재시작: npx tsx translate-landmarks.ts --resume  (중단된 곳부터)
 */

import Anthropic from "@anthropic-ai/sdk";
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import * as fs from "fs";
dotenv.config();

const sql = neon(process.env.DATABASE_URL!);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ============================================================
// 24개 언어 목록 (en 포함)
// ============================================================
const TARGET_LANGUAGES: Record<string, string> = {
  "zh-CN": "Simplified Chinese (简体中文)",
  "zh-TW": "Traditional Chinese (繁體中文)",
  "ko":    "Korean (한국어)",
  "ja":    "Japanese (日本語)",
  "fr":    "French (Français)",
  "es":    "Spanish (Español)",
  "de":    "German (Deutsch)",
  "it":    "Italian (Italiano)",
  "pt":    "Portuguese (Português)",
  "ru":    "Russian (Русский)",
  "ar":    "Arabic (العربية)",
  "th":    "Thai (ภาษาไทย)",
  "vi":    "Vietnamese (Tiếng Việt)",
  "id":    "Indonesian (Bahasa Indonesia)",
  "ms":    "Malay (Bahasa Melayu)",
  "nl":    "Dutch (Nederlands)",
  "pl":    "Polish (Polski)",
  "sv":    "Swedish (Svenska)",
  "da":    "Danish (Dansk)",
  "no":    "Norwegian (Norsk)",
  "fi":    "Finnish (Suomi)",
  "tr":    "Turkish (Türkçe)",
  "hi":    "Hindi (हिन्दी)",
};

const LANG_CODES = Object.keys(TARGET_LANGUAGES);

// ============================================================
// 진행 상태 저장 (중단 후 재시작용)
// ============================================================
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

// ============================================================
// Claude API로 23개 언어 동시 번역 (1회 호출)
// ============================================================
async function translateToAllLanguages(enData: {
  name: string;
  description: string;
  detailedDescription?: string;
}): Promise<Record<string, { name: string; description: string; detailedDescription?: string }>> {

  const langList = LANG_CODES.map(
    code => `- "${code}": ${TARGET_LANGUAGES[code]}`
  ).join("\n");

  const prompt = `Translate the following tourism content into exactly these ${LANG_CODES.length} languages.

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "zh-CN": { "name": "...", "description": "...", "detailedDescription": "..." },
  "zh-TW": { "name": "...", "description": "...", "detailedDescription": "..." },
  ... (all ${LANG_CODES.length} languages)
}

Target languages:
${langList}

Source content (English):
- name: ${enData.name}
- description: ${enData.description}
- detailedDescription: ${enData.detailedDescription || ""}

Rules:
- Keep proper nouns (place names, brand names) in original form
- Use natural, fluent tourist-guide tone
- detailedDescription can be omitted from JSON if source is empty
- Return ONLY the JSON object, nothing else`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  
  // JSON 파싱
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("JSON not found in response");
  
  return JSON.parse(jsonMatch[0]);
}

// ============================================================
// 메인 실행
// ============================================================
async function main() {
  const isResume = process.argv.includes("--resume");
  const completed = isResume ? loadProgress() : new Set<string>();
  
  if (isResume) {
    console.log(`\n📂 이어서 실행 (완료: ${completed.size}개)\n`);
  }

  // 번역 필요한 landmarks 조회
  const landmarks = await sql`
    SELECT id, name, city_id, translations
    FROM landmarks
    WHERE translations IS NOT NULL
    ORDER BY city_id, id
  `;

  const total = landmarks.length;
  let successCount = completed.size;
  let failCount = 0;

  console.log(`\n🌍 번역 시작: 총 ${total}개 landmarks\n`);
  console.log(`대상 언어: ${LANG_CODES.length}개`);
  console.log(`번역 필드: name, description, detailedDescription\n`);
  console.log("━".repeat(50));

  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i];

    // 이미 완료된 건 스킵
    if (completed.has(lm.id)) {
      console.log(`  ⏭️  스킵 [${i+1}/${total}] ${lm.id}`);
      continue;
    }

    try {
      // 기존 translations 파싱
      const translations = typeof lm.translations === "string"
        ? JSON.parse(lm.translations)
        : lm.translations;

      const en = translations?.en;
      if (!en?.name) {
        console.log(`  ⚠️  [${i+1}/${total}] ${lm.id}: en 데이터 없음, 스킵`);
        continue;
      }

      console.log(`  🔄 [${i+1}/${total}] ${lm.city_id} / ${lm.name}`);

      // Claude API로 23개 언어 동시 번역
      const translated = await translateToAllLanguages({
        name: en.name,
        description: en.description || "",
        detailedDescription: en.detailedDescription || "",
      });

      // 기존 en + 번역 결과 합치기
      const newTranslations = {
        en, // 기존 en 유지 (narration 포함)
        ...translated,
      };

      // DB 업데이트
      await sql`
        UPDATE landmarks
        SET 
          translations = ${JSON.stringify(newTranslations)}::json,
          updated_at = NOW()
        WHERE id = ${lm.id}
      `;

      successCount++;
      completed.add(lm.id);
      saveProgress(completed); // 매번 저장 (중단 대비)

      console.log(`  ✅ 완료 (${successCount}/${total - completed.size + successCount})`);

      // Rate limit 방지 (1초 대기)
      await new Promise(r => setTimeout(r, 1000));

    } catch (err: any) {
      failCount++;
      console.error(`  ❌ 실패 [${lm.id}]:`, err.message);
      
      // 연속 3회 실패시 중단
      if (failCount >= 3) {
        console.error("\n⛔ 연속 실패 3회. 중단합니다.");
        console.log("💡 --resume 옵션으로 이어서 실행하세요: npx tsx translate-landmarks.ts --resume");
        break;
      }
      
      // 실패 후 5초 대기
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  // 결과 리포트
  console.log("\n" + "━".repeat(50));
  console.log(`✅ 완료: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  console.log(`📊 총 생성 번역: ${successCount * LANG_CODES.length}개`);
  
  if (failCount === 0) {
    fs.unlinkSync(PROGRESS_FILE).toString;
    console.log("\n🎉 전체 완료! progress 파일 삭제됨.");
  } else {
    console.log("\n💡 실패 항목 재실행: npx tsx translate-landmarks.ts --resume");
  }
}

// ============================================================
// 완료 현황 확인용
// ============================================================
async function verify() {
  const result = await sql`
    SELECT 
      city_id,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE translations::jsonb ? 'ko') as has_ko,
      COUNT(*) FILTER (WHERE translations::jsonb ? 'zh-CN') as has_zh,
      COUNT(*) FILTER (WHERE translations::jsonb ? 'ja') as has_ja,
      COUNT(*) FILTER (WHERE translations::jsonb ? 'fr') as has_fr
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

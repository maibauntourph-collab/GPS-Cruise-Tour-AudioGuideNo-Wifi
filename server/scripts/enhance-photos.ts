// [학습 권고: 비주얼 스토리텔링의 자동화 - Designer Kim]
// 1. 타겟팅: 사진이 아예 없거나 빈 배열인 랜드마크를 최우선 리뉴얼 대상으로 정합니다.
// 2. 프롬프트 엔지니어링: 랜드마크의 이름과 설명을 조합하여 DALL-E 3가 이해하기 쉬운 고품질 프롬프트를 생성합니다.
// 3. 다운로드 및 저장: 생성된 이미지 URL을 로컬 서버(public/images/generated)에 저장하여 오프라인에서도 접근 가능하게 합니다.
// 4. DB 동기화: 저장된 로컬 이미지 경로를 DB에 업데이트하여 프론트엔드에서 즉시 노출되도록 합니다.

import dotenv from "dotenv";
dotenv.config({ path: process.cwd() + "/.env" });
import { db } from "../db";
import { landmarks as landmarksTable } from "../../shared/schema";
import { eq, sql } from "drizzle-orm";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { finished } from "stream/promises";

// [적요] OpenAI API 설정: DALL-E 3 모델을 호출하기 위해 사용합니다.
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
    console.error("❌ OpenAI API 키가 누락되었습니다.");
    process.exit(1);
}
const openai = new OpenAI({ apiKey });

// [적요] 이미지 저장소 설정: 클라이언트에서 접근 가능한 public 폴더 내부에 자동 생성된 이미지를 보관합니다.
const GENERATED_DIR = path.join(process.cwd(), "client", "public", "images", "generated");

// [적요] 범용 이미지 다운로더: 원격 URL의 이미지를 로컬 파일 시스템으로 안전하게 스트리밍 다운로드합니다.
async function downloadImage(url: string, filepath: string) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`이미지 다운로드 실패: ${res.statusText}`);
    if (!res.body) throw new Error("응답 본문이 없습니다.");

    const fileStream = fs.createWriteStream(filepath);
    // @ts-ignore - Node 18+ 환경의 native fetch body 처리
    await finished(Readable.fromWeb(res.body).pipe(fileStream));
}

async function enhancePhotos() {
    console.log("📸 [Designer Kim] DALL-E 3 기반 이미지 리뉴얼 세션을 시작합니다...");

    // [적요] 디렉토리 확인: 이미지를 저장할 폴더가 없으면 자동으로 생성합니다.
    if (!fs.existsSync(GENERATED_DIR)) {
        fs.mkdirSync(GENERATED_DIR, { recursive: true });
    }

    // [적요] 전수 조사 결과 연동: 사진이 없는 랜드마크를 DB에서 쿼리합니다.
    const targets = await db.select().from(landmarksTable).where(
        sql`json_array_length(${landmarksTable.photos}) = 0 OR ${landmarksTable.photos} IS NULL`
    );

    console.log(`🎯 사진 리뉴얼이 필요한 랜드마크: ${targets.length}개.`);

    let successCount = 0;

    for (const landmark of targets) {
        console.log(`\n⏳ 작업 중: ${landmark.name} (${landmark.id})...`);

        try {
            // [적요] 스타일 가이드 적용: 8k 화질, 시네마틱 조명 등 전문적인 키워드를 조합합니다.
            const prompt = `A breathtaking, premium photo of ${landmark.name}, ${landmark.description?.substring(0, 50) || "historic landmark"}, high quality, 8k resolution, vibrant colors, cinematic lighting, photorealistic, travel photography masterpiece.`;

            console.log(`   🎨 DALL-E 3 이미지 생성 요청 중...`);

            const response = await openai.images.generate({
                model: "dall-e-3",
                prompt: prompt,
                n: 1,
                size: "1024x1024",
                quality: "standard",
                response_format: "url",
            });

            const imageUrl = response.data[0].url;
            if (!imageUrl) throw new Error("이미지 URL을 반환받지 못했습니다.");

            // [적요] 고유 파일명 생성: ID와 타임스탬프를 조합하여 파일명 충돌을 방지합니다.
            const filename = `${landmark.id}_${Date.now()}.jpg`;
            const localPath = path.join(GENERATED_DIR, filename);
            const dbPath = `/images/generated/${filename}`;

            console.log(`   ⬇️ 로컬 저장소로 다운로드 중...`);
            await downloadImage(imageUrl, localPath);

            // [적요] DB 최종 승인: 생성된 로컬 이미지 경로를 photos 컬렉션의 첫 번째 항목으로 등록합니다.
            await db.update(landmarksTable)
                .set({
                    photos: [dbPath],
                    updatedAt: new Date()
                })
                .where(eq(landmarksTable.id, landmark.id));

            console.log(`   ✅ DB 업데이트 완료: ${dbPath}`);
            successCount++;

        } catch (error: any) {
            if (error?.status === 429) {
                console.error("❌ API 한도 초과(Quota exceeded). 작업을 중단합니다.");
                break;
            }
            console.error(`   ❌ ${landmark.name} 이미지 생성 실패:`, error.message);
        }

        // [적요] 부하 조절: API 속도 제한을 고려하여 5초간 휴식합니다.
        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log(`\n✨ 세션 종료. 성공: ${successCount} / ${targets.length}`);
}

enhancePhotos().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});

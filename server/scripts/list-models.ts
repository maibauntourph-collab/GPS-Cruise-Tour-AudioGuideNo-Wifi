
import dotenv from "dotenv";
dotenv.config({ path: process.cwd() + "/.env" });

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        const fs = await import('fs');
        fs.writeFileSync('gemini_models_debug.json', JSON.stringify(data, null, 2));
        console.log("✅ 모델 리스트가 'gemini_models_debug.json'에 저장되었습니다.");
    } catch (error) {
        console.error("❌ 모델 조회 실패:", error);
    }
}

listModels().then(() => process.exit(0));

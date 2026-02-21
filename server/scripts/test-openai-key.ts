
import dotenv from "dotenv";
dotenv.config({ path: process.cwd() + "/.env" });
import OpenAI from "openai";

async function testKey() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error("❌ No API Key found in .env");
        return;
    }
    console.log(`🔑 Testing API Key: ${apiKey.slice(0, 10)}...`);

    const openai = new OpenAI({ apiKey });

    try {
        console.log("📡 Sending request to OpenAI...");
        const models = await openai.models.list();
        console.log("✅ Success! Available models:", models.data.map(m => m.id).slice(0, 5));
    } catch (error: any) {
        console.error("❌ Failed:");
        console.error("   Status:", error.status);
        console.error("   Code:", error.code);
        console.error("   Type:", error.type);
        console.error("   Message:", error.message);
    }
}

testKey();

import dotenv from "dotenv";
dotenv.config({ path: process.cwd() + "/.env" });
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

async function runTest() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error("❌ API key missing");
        return;
    }
    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        const modelName = "gemini-2.0-flash-exp"; // Try the base exp model
        console.log(`Testing image generation with ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = "Please generate a high-quality photo of a simple wooden table on a white background. Return the image data inline.";
        const result = await model.generateContent(prompt);
        const response = await result.response;

        fs.writeFileSync("server/scripts/gemini_response_debug.json", JSON.stringify(response, null, 2));
        console.log("Full response dumped to server/scripts/gemini_response_debug.json");

        const candidate = response.candidates ? response.candidates[0] : null;
        if (candidate && candidate.content && candidate.content.parts) {
            const parts = candidate.content.parts;
            const hasImage = parts.some(p => p.inlineData);
            console.log("Has Image Part:", hasImage);
            if (hasImage) {
                console.log("✅ Image Data Found!");
            } else {
                console.log("❌ No Image Part. Text response:", response.text());
            }
        }
    } catch (e: any) {
        console.error("Error during generation:", e.message);
    }
}

runTest();

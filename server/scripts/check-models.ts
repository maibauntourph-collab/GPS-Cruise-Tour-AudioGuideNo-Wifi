import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
dotenv.config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY not found");
        return;
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        // Note: listModels is usually on the genAI instance or requires a specific client
        // In the @google/generative-ai SDK, there isn't a direct listModels on the high-level class easily.
        // We can try to see if a simple generateContent works with 'gemini-1.5-flash-latest'
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const result = await model.generateContent("test");
        console.log("SUCCESS with gemini-1.5-flash-latest:", result.response.text());
    } catch (e: any) {
        console.error("FAILED with gemini-1.5-flash-latest:", e.message);

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent("test");
            console.log("SUCCESS with gemini-1.5-flash:", result.response.text());
        } catch (e2: any) {
            console.error("FAILED with gemini-1.5-flash:", e2.message);
        }
    }
}

listModels();

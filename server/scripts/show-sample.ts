import { db } from "../db";
import { landmarks } from "@shared/schema";
import { eq } from "drizzle-orm";

async function show() {
    const [l] = await db.select().from(landmarks).where(eq(landmarks.id, 'paris_item_82'));
    console.log("=== 파리 샘플 내레이션 ===\n");
    console.log(l.narration);
    process.exit(0);
}
show().catch(console.error);

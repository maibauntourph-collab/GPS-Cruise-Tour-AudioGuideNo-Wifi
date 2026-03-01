import "dotenv/config";
import { db } from "../db";
import { landmarks } from "@shared/schema";
import { eq } from "drizzle-orm";
import fs from "fs";

async function dump() {
    const [l] = await db.select().from(landmarks).where(eq(landmarks.id, 'paris_item_82'));
    fs.writeFileSync("paris_sample.txt", l.narration);
    process.exit(0);
}
dump().catch(console.dir);

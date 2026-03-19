
import { db } from "../db";
import { landmarks } from "../../shared/schema";

async function listLandmarks() {
    const allLandmarks = await db.select().from(landmarks);
    console.log(JSON.stringify(allLandmarks, null, 2));
}

listLandmarks().then(() => process.exit(0));

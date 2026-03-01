import { db } from "../db";
import { landmarks } from "../../shared/schema";

async function extractMissingImages() {
    try {
        const allLandmarks = await db.select().from(landmarks);

        const missingDetails: Array<{ id: string, name: string, cityId: string }> = [];

        for (const lm of allLandmarks) {
            const photos = lm.photos as string[] | null;
            if (
                !photos ||
                photos.length === 0 ||
                photos.some(p => p.includes('placeholder.png'))
            ) {
                missingDetails.push({
                    id: lm.id,
                    name: lm.translations?.ko?.name || lm.name,
                    cityId: lm.cityId
                });
            }
        }

        const first10 = missingDetails.slice(0, 10);
        console.log(JSON.stringify(first10, null, 2));

    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit(0);
    }
}

extractMissingImages();

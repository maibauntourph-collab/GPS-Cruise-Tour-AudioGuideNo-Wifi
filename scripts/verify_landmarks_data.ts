
// import { db } from "../server/db"; // Comment out
// import { landmarks } from "../shared/schema"; // Comment out
// import { eq } from "drizzle-orm"; // Comment out

import { NEW_LANDMARKS } from "../server/data/landmarks_expansion";

async function verify() {
    try {
        console.log(`Loaded ${NEW_LANDMARKS.length} new landmarks from expansion file.`);

        const jeju = NEW_LANDMARKS.filter(l => l.cityId === 'jeju');
        console.log(`Jeju landmarks count: ${jeju.length} (Expected 6)`);

        if (jeju.length !== 6) {
            console.error("Verification Failed: Jeju landmarks count mismatch.");
            process.exit(1);
        }

        console.log("Verification Passed: landmarks_expansion.ts is valid and importable.");
    } catch (err) {
        console.error("Verification Error:", err);
        process.exit(1);
    }
}

verify();

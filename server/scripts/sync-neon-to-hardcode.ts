import { db } from '../db';
import * as schema from '../../shared/schema';
import fs from 'fs';
import path from 'path';

async function sync() {
    console.log('Fetching data from Neon DB...');
    const allLandmarks = await db.query.landmarks.findMany();

    // Format dates appropriately
    const formattedLandmarks = allLandmarks.map(landmark => {
        return {
            ...landmark,
            createdAt: landmark.createdAt ? landmark.createdAt.toISOString() : null,
            updatedAt: landmark.updatedAt ? landmark.updatedAt.toISOString() : null,
        };
    });

    const content = `import { type Landmark } from "../../shared/schema";\n\nexport const LANDMARKS: Landmark[] = ${JSON.stringify(formattedLandmarks, null, 2)};\n`;

    const outputPath = path.join(process.cwd(), 'server', 'data', 'landmarks.ts');
    fs.writeFileSync(outputPath, content, 'utf-8');
    console.log(`Successfully synced ${allLandmarks.length} landmarks to ${outputPath}`);
    process.exit(0);
}

sync().catch(e => {
    console.error('Error during sync:', e);
    process.exit(1);
});

import fs from 'fs';
import path from 'path';

const storagePath = path.join(process.cwd(), 'server', 'storage.ts');
const landmarksOutputPath = path.join(process.cwd(), 'server', 'data', 'landmarks.ts');

const content = fs.readFileSync(storagePath, 'utf-8');
const lines = content.split('\n');

// LANDMARKS start at line 635 (0-indexed 634)
// LANDMARKS end at line 7938 (0-indexed 7937)
const landmarksLines = lines.slice(634, 7938);

const outputContent = `import { type Landmark } from "../../shared/schema";

export const LANDMARKS: Landmark[] = [
${landmarksLines.slice(1).join('\n')}
`;

fs.writeFileSync(landmarksOutputPath, outputContent);
console.log('Successfully extracted LANDMARKS to server/data/landmarks.ts');

// Extract IDs for the user list
const idPattern = /id:\s*'([^']+)'/g;
const ids: string[] = [];
let match;
const landmarkText = landmarksLines.join('\n');
while ((match = idPattern.exec(landmarkText)) !== null) {
    ids.push(match[1]);
}

console.log('Extracted Landmark IDs:', ids.join(', '));
fs.writeFileSync(path.join(process.cwd(), 'extracted_landmark_ids.json'), JSON.stringify(ids, null, 2));

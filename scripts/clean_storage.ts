import fs from 'fs';
import path from 'path';

const storagePath = path.join(process.cwd(), 'server', 'storage.ts');
const content = fs.readFileSync(storagePath, 'utf-8');
const lines = content.split('\n');

// 1. Add imports at the top
let newLines = [...lines];
newLines.splice(5, 0, "import { CITIES } from './data/cities';", "import { LANDMARKS } from './data/landmarks';");

// Adjust indices because we added 2 lines at index 5
// original 66 (index 65) -> now 68 (index 67)
// original 7938 (index 7937) -> now 7940 (index 7939)

// 2. Remove CITIES (originally 66-634)
// and LANDMARKS (originally 635-7938)
// Total range: 66 to 7938 (inclusive)
// In the NEW array (with 2 extra lines at top):
// starts at 67 (index 67) ends at 7939 (index 7939)

const startIdx = 67; // original index 65 + 2
const endIdx = 7939; // original index 7937 + 2

newLines.splice(startIdx, endIdx - startIdx + 1, "// Hardcoded CITIES and LANDMARKS moved to separate files in server/data/");

fs.writeFileSync(storagePath, newLines.join('\n'));
console.log('Successfully cleaned storage.ts and removed hardcoded data');

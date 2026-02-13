
import * as fs from 'fs';
import * as path from 'path';

const storagePath = path.join(process.cwd(), 'server', 'storage.ts');
const content = fs.readFileSync(storagePath, 'utf-8');

// Find the LANDMARKS array definition
const startMarker = 'const LANDMARKS: Landmark[] = [';
const startIndex = content.indexOf(startMarker);

if (startIndex === -1) {
    console.error('Could not find LANDMARKS array start');
    process.exit(1);
}

// Simple parser: find objects with id, cityId, name
// We can't eval the code directly because it has imports and types.
// We will use regex to find objects.

const landmarks: any[] = [];
// Regex to match objects like:
// {
//   id: 'colosseum',
//   cityId: 'rome',
//   name: 'Colosseum',
// ...
// }

const idRegex = /id:\s*'([^']+)'/g;
const cityIdRegex = /cityId:\s*'([^']+)'/g;
const nameRegex = /name:\s*'([^']+)'/g;

// We need to iterate carefully.
// Let's just split by "{" inside the array block.

const arrayContent = content.substring(startIndex + startMarker.length);
// Rough split by objects
const validObjects = [];

// A safer way: scan line by line
const lines = arrayContent.split('\n');
let currentObject: any = {};
let inObject = false;

for (const line of lines) {
    if (line.trim().startsWith('const ')) break; // End of LANDMARKS

    if (line.includes('{')) {
        inObject = true;
        currentObject = {};
    }

    const idMatch = line.match(/id:\s*'([^']+)'/);
    if (idMatch) currentObject.id = idMatch[1];

    const cityIdMatch = line.match(/cityId:\s*'([^']+)'/);
    if (cityIdMatch) currentObject.cityId = cityIdMatch[1];

    const nameMatch = line.match(/name:\s*'([^']+)'/);
    if (nameMatch) currentObject.name = nameMatch[1];

    if (line.includes('}')) {
        if (currentObject.id && currentObject.name && currentObject.cityId) {
            validObjects.push(currentObject);
        }
        inObject = false;
    }
}

console.log(JSON.stringify(validObjects, null, 2));

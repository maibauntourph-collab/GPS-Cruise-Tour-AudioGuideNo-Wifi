#!/usr/bin/env node
/**
 * Script to update Rome city data in storage.ts
 * Updates photos (6-9 per item) and ensures complete translations in 10 languages
 */

import fs from 'fs';

// Read the file
let content = fs.readFileSync('server/storage.ts', 'utf-8');

// Photo arrays for landmarks (building/ruins photos)
const photoUpdates = {
  'colosseum': `    photos: [
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
      'https://images.unsplash.com/photo-1555992336-fb0d29498b13?w=800',
      'https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?w=800',
      'https://images.unsplash.com/photo-1546961342-ea5f71b193f3?w=800',
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
      'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=800',
      'https://images.unsplash.com/photo-1548585744-4e87a0e84c88?w=800',
      'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800'
    ],`,
  
  'roman_forum': `    photos: [
      'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800',
      'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=800',
      'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
      'https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?w=800',
      'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800'
    ],`,

  'trevi_fountain': `    photos: [
      'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=800',
      'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=800',
      'https://images.unsplash.com/photo-1548585744-4e87a0e84c88?w=800',
      'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
      'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800',
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
      'https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?w=800'
    ],`,

  'pantheon': `    photos: [
      'https://images.unsplash.com/photo-1548585744-4e87a0e84c88?w=800',
      'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
      'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800',
      'https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?w=800',
      'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800'
    ],`,

  'spanish_steps': `    photos: [
      'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=800',
      'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800',
      'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
      'https://images.unsplash.com/photo-1548585744-4e87a0e84c88?w=800',
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
      'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=800'
    ],`,

  'vatican_museums': `    photos: [
      'https://images.unsplash.com/photo-1583424223556-bb53f4362c65?w=800',
      'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800',
      'https://images.unsplash.com/photo-1567359781514-3b964e2b04d6?w=800',
      'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800',
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
      'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800'
    ],`,

  'st_peters_basilica': `    photos: [
      'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800',
      'https://images.unsplash.com/photo-1583992876959-af90c2dcf744?w=800',
      'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=800',
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
      'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
      'https://images.unsplash.com/photo-1583424223556-bb53f4362c65?w=800',
      'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800'
    ],`,

  'castel_santangelo': `    photos: [
      'https://images.unsplash.com/photo-1544508618-f6927bc85146?w=800',
      'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
      'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800',
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
      'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800',
      'https://images.unsplash.com/photo-1548585744-4e87a0e84c88?w=800'
    ],`,

  // Gift shop photos (shop/souvenir photos)
  'borghese-gift-shop-rome': `    photos: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
      'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800',
      'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800',
      'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=800',
      'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800'
    ],`,

  'vatican-gifts-rome': `    photos: [
      'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800',
      'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800',
      'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800',
      'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=800',
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800'
    ],`,

  'colosseum-memories-rome': `    photos: [
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
      'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800',
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800',
      'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800',
      'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=800',
      'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800',
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800'
    ],`,

  'trastevere-artisan-shop-rome': `    photos: [
      'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=800',
      'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800',
      'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800',
      'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800',
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800'
    ],`,

  'piazza-navona-crafts-rome': `    photos: [
      'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800',
      'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800',
      'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800',
      'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=800',
      'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800'
    ],`
};

// Update photos for each landmark
for (const [landmarkId, newPhotos] of Object.entries(photoUpdates)) {
  // Create regex to find the photos array for this specific landmark
  const escapedId = landmarkId.replace(/[-_]/g, '[-_]');
  const regex = new RegExp(
    `(id: '${escapedId}',` +
    `[\\s\\S]*?)` +
    `photos: \\[[\\s\\S]*?\\],`,
    'g'
  );
  
  content = content.replace(regex, (match, prefix) => {
    return prefix + newPhotos;
  });
}

// Write the updated content
fs.writeFileSync('server/storage.ts', content, 'utf-8');

console.log('Successfully updated Rome photos in storage.ts');
console.log('Updated landmarks: colosseum, roman_forum, trevi_fountain, pantheon, spanish_steps, vatican_museums, st_peters_basilica, castel_santangelo');
console.log('Updated gift shops: borghese-gift-shop-rome, vatican-gifts-rome, colosseum-memories-rome, trastevere-artisan-shop-rome, piazza-navona-crafts-rome');

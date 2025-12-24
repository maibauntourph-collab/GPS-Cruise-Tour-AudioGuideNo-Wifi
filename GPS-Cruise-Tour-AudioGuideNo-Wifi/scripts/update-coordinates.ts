import fs from 'fs';
import path from 'path';

const CORRECT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Rome Landmarks
  'colosseum': { lat: 41.890251, lng: 12.492373 },
  'roman_forum': { lat: 41.892464, lng: 12.485325 },
  'trevi_fountain': { lat: 41.900932, lng: 12.483313 },
  'pantheon': { lat: 41.898609, lng: 12.476873 },
  'spanish_steps': { lat: 41.905991, lng: 12.482775 },
  'vatican_museums': { lat: 41.906487, lng: 12.453641 },
  'st_peters_basilica': { lat: 41.902168, lng: 12.453937 },
  'castel_santangelo': { lat: 41.903065, lng: 12.466276 },
  
  // Paris Landmarks
  'eiffel_tower': { lat: 48.858093, lng: 2.294694 },
  'louvre': { lat: 48.860294, lng: 2.338629 },
  'notre_dame': { lat: 48.852966, lng: 2.349902 },
  'arc_triomphe': { lat: 48.873787, lng: 2.295047 },
  'sacre_coeur': { lat: 48.886452, lng: 2.343121 },
  'versailles': { lat: 48.804865, lng: 2.120355 },
  'musee_dorsay': { lat: 48.860000, lng: 2.326561 },
  
  // London Landmarks
  'big_ben': { lat: 51.500786, lng: -0.124681 },
  'tower_bridge': { lat: 51.505500, lng: -0.075300 },
  'buckingham_palace': { lat: 51.501476, lng: -0.140634 },
  'london_eye': { lat: 51.503399, lng: -0.119519 },
  'westminster_abbey': { lat: 51.499361, lng: -0.127305 },
  'british_museum': { lat: 51.519413, lng: -0.126957 },
  'st_pauls_cathedral': { lat: 51.513845, lng: -0.098351 },
  
  // Amsterdam Landmarks
  'anne_frank_house': { lat: 52.375218, lng: 4.883977 },
  'rijksmuseum': { lat: 52.359998, lng: 4.885218 },
  
  // Barcelona Landmarks
  'sagrada_familia': { lat: 41.403629, lng: 2.174356 },
  'park_guell': { lat: 41.414495, lng: 2.152694 },
  'casa_batllo': { lat: 41.391638, lng: 2.164993 },
  
  // Brussels Landmarks
  'atomium': { lat: 50.894941, lng: 4.341555 },
  'grand_place': { lat: 50.846574, lng: 4.352310 },
  
  // Prague Landmarks
  'charles_bridge': { lat: 50.086389, lng: 14.411389 },
  'prague_castle': { lat: 50.090833, lng: 14.400556 },
  'old_town_square': { lat: 50.087465, lng: 14.421254 },
  
  // Budapest Landmarks
  'parliament_building': { lat: 47.507222, lng: 19.045556 },
  'chain_bridge': { lat: 47.498611, lng: 19.042778 },
  
  // Warsaw Landmarks
  'warsaw_old_town': { lat: 52.249722, lng: 21.011944 },
  'palace_of_culture': { lat: 52.231667, lng: 21.005833 },
  
  // Stockholm Landmarks
  'vasa_museum': { lat: 59.327939, lng: 18.091573 },
  'gamla_stan': { lat: 59.325000, lng: 18.070833 },
  
  // Copenhagen Landmarks
  'little_mermaid': { lat: 55.692871, lng: 12.599291 },
  'nyhavn': { lat: 55.680087, lng: 12.590611 },
  'tivoli_gardens': { lat: 55.673686, lng: 12.568105 },
  
  // Oslo Landmarks
  'viking_ship_museum': { lat: 59.904722, lng: 10.684167 },
  'oslo_opera_house': { lat: 59.907222, lng: 10.753333 },
  
  // Alaska Landmarks
  'denali_national_park': { lat: 63.129700, lng: -151.197400 },
  'mendenhall_glacier': { lat: 58.441667, lng: -134.545833 },
  'alaska_wildlife_center': { lat: 60.821359, lng: -148.978592 },
  'anchorage_museum': { lat: 61.217649, lng: -149.886149 },
  'kenai_fjords': { lat: 59.909722, lng: -149.642778 },
  'northern_lights_point': { lat: 64.837778, lng: -147.716389 },
  'glacier_bay': { lat: 58.665806, lng: -136.900208 },
  
  // Singapore Landmarks
  'marina-bay-sands': { lat: 1.283700, lng: 103.860700 },
  'merlion-park': { lat: 1.286915, lng: 103.854520 },
  'gardens-by-the-bay': { lat: 1.281563, lng: 103.863560 },
  'singapore-flyer': { lat: 1.289250, lng: 103.863000 },
  'chinatown-heritage-centre': { lat: 1.283611, lng: 103.844167 },
  'national-museum-singapore': { lat: 1.296667, lng: 103.848611 },
  'sentosa-island': { lat: 1.249404, lng: 103.830321 },
  
  // Cebu Landmarks
  'magellans-cross': { lat: 10.293475, lng: 123.901984 },
  'basilica-santo-nino': { lat: 10.293889, lng: 123.902778 },
  'fort-san-pedro': { lat: 10.292222, lng: 123.905556 },
  'tops-lookout': { lat: 10.350278, lng: 123.817500 },
  'taoist-temple-cebu': { lat: 10.346667, lng: 123.879444 },
  'cebu-heritage-monument': { lat: 10.294167, lng: 123.897778 },
  'sirao-flower-garden': { lat: 10.386111, lng: 123.824722 },
  
  // Penang Landmarks
  'kek-lok-si-temple': { lat: 5.399167, lng: 100.272500 },
  'fort-cornwallis': { lat: 5.421667, lng: 100.345000 },
  'khoo-kongsi': { lat: 5.416389, lng: 100.336667 },
  'penang-hill': { lat: 5.422778, lng: 100.268611 },
  'george-town-unesco-site': { lat: 5.414167, lng: 100.328611 },
  'pinang-peranakan-mansion': { lat: 5.420278, lng: 100.338611 },
  'penang-national-park': { lat: 5.460000, lng: 100.203333 },
  
  // Kuala Lumpur Landmarks
  'petronas-towers': { lat: 3.157764, lng: 101.711861 },
  'batu-caves': { lat: 3.237222, lng: 101.683889 },
  'thean-hou-temple': { lat: 3.122500, lng: 101.686111 },
  'kl-tower': { lat: 3.152778, lng: 101.703611 },
  'central-market-kl': { lat: 3.145833, lng: 101.695000 },
  
  // Phuket Landmarks
  'big-buddha-phuket': { lat: 7.827582, lng: 98.312842 },
  'patong-beach': { lat: 7.895000, lng: 98.296111 },
  'wat-chalong': { lat: 7.845556, lng: 98.337778 },
  'karon-viewpoint': { lat: 7.820833, lng: 98.307500 },
  'old-phuket-town': { lat: 7.883889, lng: 98.389444 },
  'phi-phi-islands': { lat: 7.740833, lng: 98.778333 },
};

async function updateCoordinates() {
  const storagePath = path.join(__dirname, '../server/storage.ts');
  let content = fs.readFileSync(storagePath, 'utf-8');
  
  let updatedCount = 0;
  
  for (const [landmarkId, coords] of Object.entries(CORRECT_COORDINATES)) {
    const idPattern = new RegExp(`(id:\\s*['"]${landmarkId}['"][\\s\\S]*?lat:\\s*)([\\d.-]+)`, 'g');
    const lngPattern = new RegExp(`(id:\\s*['"]${landmarkId}['"][\\s\\S]*?lng:\\s*)([\\d.-]+)`, 'g');
    
    const originalContent = content;
    
    content = content.replace(idPattern, (match, prefix, oldLat) => {
      return `${prefix}${coords.lat}`;
    });
    
    content = content.replace(lngPattern, (match, prefix, oldLng) => {
      return `${prefix}${coords.lng}`;
    });
    
    if (content !== originalContent) {
      updatedCount++;
      console.log(`Updated coordinates for ${landmarkId}: (${coords.lat}, ${coords.lng})`);
    }
  }
  
  fs.writeFileSync(storagePath, content);
  console.log(`\nTotal landmarks updated: ${updatedCount}`);
}

updateCoordinates().catch(console.error);

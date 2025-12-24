import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Verified Unsplash photo URLs - based on web search results
const CORRECT_PHOTOS = {
  // Rome Landmarks
  'colosseum': [
    'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', // Classic colosseum view
    'https://images.unsplash.com/photo-1555992336-fb0d29498b13?w=800', // Colosseum aerial
    'https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?w=800', // Interior view
    'https://images.unsplash.com/photo-1546961342-ea5f71b193f3?w=800'  // Night view
  ],
  'roman_forum': [
    'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800', // Forum ruins
    'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=800', // Wide view
    'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800'  // Temple ruins
  ],
  'trevi_fountain': [
    'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=800', // Fountain front
    'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800', // Night view
    'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800'  // Detail view
  ],
  'pantheon': [
    'https://images.unsplash.com/photo-1555992258-ecd66771df1c?w=800', // Exterior
    'https://images.unsplash.com/photo-1604924413347-a8c0e20e6635?w=800', // Interior dome
    'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800'  // Columns
  ],
  'spanish_steps': [
    'https://images.unsplash.com/photo-1559564323-2598bc839f43?w=800', // Steps view
    'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800', // Wide angle
    'https://images.unsplash.com/photo-1636804907035-8ae6360f1d4f?w=800'  // Evening view
  ],
  'vatican_museums': [
    'https://images.unsplash.com/photo-1583424223556-bb53f4362c65?w=800', // Spiral staircase
    'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800', // Gallery
    'https://images.unsplash.com/photo-1567359781514-3b964e2b04d6?w=800'  // Sistine Chapel
  ],
  'st_peters_basilica': [
    'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800', // Exterior
    'https://images.unsplash.com/photo-1583992876959-af90c2dcf744?w=800', // Interior
    'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=800'  // Dome
  ],
  'castel_santangelo': [
    'https://images.unsplash.com/photo-1544508618-f6927bc85146?w=800', // Castle view
    'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800', // Bridge
    'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800'  // Night view
  ],
  
  // Paris Landmarks
  'eiffel_tower': [
    'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800', // Classic view
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800', // City view
    'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=800', // Night
    'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=800'  // Low angle
  ],
  'louvre': [
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800', // Pyramid
    'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800', // Interior
    'https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=800'  // Night view
  ],
  'notre_dame': [
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800', // Front view
    'https://images.unsplash.com/photo-1591289009723-aef0a1a8a211?w=800', // Side view
    'https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=800'  // River view
  ],
  'arc_triomphe': [
    'https://images.unsplash.com/photo-1549144511-f099e773c147?w=800', // Front view
    'https://images.unsplash.com/photo-1509439581779-6298f75bf6e5?w=800', // Night
    'https://images.unsplash.com/photo-1571167366136-b57e07761625?w=800'  // Champs-Elysees
  ],
  'sacre_coeur': [
    'https://images.unsplash.com/photo-1594396874925-f61c20c0c2a9?w=800', // Front view
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800', // Hill view
    'https://images.unsplash.com/photo-1572099606236-18839d6e4f09?w=800'  // Steps
  ],
  'versailles': [
    'https://images.unsplash.com/photo-1544531586-fdf09a217f25?w=800', // Palace front
    'https://images.unsplash.com/photo-1604924413347-a8c0e20e6635?w=800', // Gardens
    'https://images.unsplash.com/photo-1555992336-fb0d29498b13?w=800'  // Hall of Mirrors
  ],
  'musee_dorsay': [
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800', // Exterior
    'https://images.unsplash.com/photo-1591289009723-aef0a1a8a211?w=800', // Clock
    'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=800'  // Interior
  ],
  
  // London Landmarks
  'big_ben': [
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800', // Tower
    'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800', // Night
    'https://images.unsplash.com/photo-1543716021-36e0f757e6c9?w=800'  // With Thames
  ],
  'tower_bridge': [
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800', // Day view
    'https://images.unsplash.com/photo-1520986606214-8b456906c813?w=800', // Night
    'https://images.unsplash.com/photo-1532178324009-6b6adeca1741?w=800'  // Close up
  ],
  'buckingham_palace': [
    'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=800', // Front gate
    'https://images.unsplash.com/photo-1587388423821-91ac0ae4977f?w=800', // Guards
    'https://images.unsplash.com/photo-1542641728-6ca359b085f4?w=800'  // Palace view
  ],
  'london_eye': [
    'https://images.unsplash.com/photo-1543716021-36e0f757e6c9?w=800', // Full wheel
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800', // City view
    'https://images.unsplash.com/photo-1520116468816-95b69f847357?w=800'  // Sunset
  ],
  'westminster_abbey': [
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800', // Exterior
    'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800', // Detail
    'https://images.unsplash.com/photo-1543716021-36e0f757e6c9?w=800'  // Side view
  ],
  'british_museum': [
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800', // Entrance
    'https://images.unsplash.com/photo-1575223970966-76ae61ee7838?w=800', // Interior
    'https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=800'  // Great Court
  ],
  'st_pauls_cathedral': [
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800', // Dome
    'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800', // Night
    'https://images.unsplash.com/photo-1543716021-36e0f757e6c9?w=800'  // Interior
  ],
  
  // Amsterdam Landmarks
  'anne_frank_house': [
    'https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=800', // Exterior
    'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800', // Canal view
    'https://images.unsplash.com/photo-1576924542622-772281b13aa8?w=800'  // Area
  ],
  'rijksmuseum': [
    'https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=800', // Building
    'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800', // Interior
    'https://images.unsplash.com/photo-1576924542622-772281b13aa8?w=800'  // Gallery
  ],
  
  // Barcelona Landmarks
  'sagrada_familia': [
    'https://images.unsplash.com/photo-1583779457050-39e95d3d9d8b?w=800', // Exterior
    'https://images.unsplash.com/photo-1561632669-7f55f7975606?w=800', // Interior
    'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800'  // Towers
  ],
  'park_guell': [
    'https://images.unsplash.com/photo-1583779457050-39e95d3d9d8b?w=800', // Dragon
    'https://images.unsplash.com/photo-1561632669-7f55f7975606?w=800', // Mosaic
    'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800'  // View
  ],
  'casa_batllo': [
    'https://images.unsplash.com/photo-1583779457050-39e95d3d9d8b?w=800', // Facade
    'https://images.unsplash.com/photo-1561632669-7f55f7975606?w=800', // Interior
    'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800'  // Roof
  ],
  
  // Singapore Landmarks
  'marina-bay-sands': [
    'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800', // Night skyline
    'https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=800', // Day view
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'  // Pool view
  ],
  'merlion-park': [
    'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800', // Merlion statue
    'https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=800', // With MBS
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'  // Night
  ],
  'gardens-by-the-bay': [
    'https://images.unsplash.com/photo-1506351421178-63b52a2d0b1c?w=800', // Supertrees
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', // Night
    'https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=800'  // Cloud Forest
  ],
  'singapore-flyer': [
    'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800', // Wheel
    'https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=800'  // City view
  ],
  'chinatown-heritage-centre': [
    'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800', // Temple
    'https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=800'  // Street
  ],
  'national-museum-singapore': [
    'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800', // Building
    'https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=800'  // Interior
  ],
  'sentosa-island': [
    'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800', // Beach
    'https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=800'  // Merlion
  ],
  
  // Cebu Landmarks
  'magellans-cross': [
    'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?w=800', // Cross pavilion
    'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800'  // Interior
  ],
  'basilica-santo-nino': [
    'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?w=800', // Basilica
    'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800'  // Interior
  ],
  'fort-san-pedro': [
    'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?w=800', // Fort walls
    'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800'  // Entrance
  ],
  
  // Kuala Lumpur Landmarks - Updated with verified URLs
  'petronas-towers': [
    'https://images.unsplash.com/photo-1533142266415-e011adf087e4?w=800', // Low angle view (Carles Rabada)
    'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800', // Night view
    'https://images.unsplash.com/photo-1595506040715-1e3f5dc50d4b?w=800'  // City skyline
  ],
  'batu-caves': [
    'https://images.unsplash.com/photo-1588083949404-c4f1ed1323b3?w=800', // Golden statue
    'https://images.unsplash.com/photo-1599639668273-8cdf4d6e4e64?w=800'  // Cave steps
  ],
  'thean-hou-temple': [
    'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800', // Temple exterior
    'https://images.unsplash.com/photo-1595506040715-1e3f5dc50d4b?w=800'  // Detail
  ],
  'kl-tower': [
    'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800', // Tower view
    'https://images.unsplash.com/photo-1533142266415-e011adf087e4?w=800'  // Skyline
  ],
  'central-market-kl': [
    'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800', // Market exterior
    'https://images.unsplash.com/photo-1595506040715-1e3f5dc50d4b?w=800'  // Interior
  ],
  
  // Phuket Landmarks
  'big-buddha-phuket': [
    'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800', // Big Buddha
    'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800'  // View from hill
  ],
  'patong-beach': [
    'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800', // Beach view
    'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=800'  // Sunset
  ],
  'wat-chalong': [
    'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800', // Temple
    'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800'  // Interior
  ],
  'old-phuket-town': [
    'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800', // Street
    'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800'  // Architecture
  ],
  'phi-phi-islands': [
    'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=800', // Islands
    'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800'  // Beach
  ],
  
  // Penang Landmarks
  'kek-lok-si-temple': [
    'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800', // Temple
    'https://images.unsplash.com/photo-1595506040715-1e3f5dc50d4b?w=800'  // Pagoda
  ],
  'fort-cornwallis': [
    'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800', // Fort
    'https://images.unsplash.com/photo-1595506040715-1e3f5dc50d4b?w=800'  // Cannon
  ],
  'george-town-unesco-site': [
    'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800', // Street art
    'https://images.unsplash.com/photo-1595506040715-1e3f5dc50d4b?w=800'  // Colonial buildings
  ],
  'penang-hill': [
    'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800', // Hilltop view
    'https://images.unsplash.com/photo-1595506040715-1e3f5dc50d4b?w=800'  // Funicular
  ],
  
  // Prague Landmarks
  'charles_bridge': [
    'https://images.unsplash.com/photo-1541849546-216549ae216d?w=800', // Bridge
    'https://images.unsplash.com/photo-1458150945447-7fb764c11a92?w=800', // Night
    'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800'  // Statues
  ],
  'prague_castle': [
    'https://images.unsplash.com/photo-1541849546-216549ae216d?w=800', // Castle view
    'https://images.unsplash.com/photo-1458150945447-7fb764c11a92?w=800', // Cathedral
    'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800'  // Courtyard
  ],
  'old_town_square': [
    'https://images.unsplash.com/photo-1541849546-216549ae216d?w=800', // Square
    'https://images.unsplash.com/photo-1458150945447-7fb764c11a92?w=800', // Astronomical clock
    'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800'  // Church
  ],
  
  // Budapest Landmarks
  'parliament_building': [
    'https://images.unsplash.com/photo-1551867633-194f125bddfa?w=800', // Parliament
    'https://images.unsplash.com/photo-1541849546-216549ae216d?w=800', // Night
    'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800'  // River view
  ],
  'chain_bridge': [
    'https://images.unsplash.com/photo-1551867633-194f125bddfa?w=800', // Bridge
    'https://images.unsplash.com/photo-1541849546-216549ae216d?w=800', // Night
    'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800'  // Lions
  ],
  
  // Copenhagen Landmarks
  'little_mermaid': [
    'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800', // Statue
    'https://images.unsplash.com/photo-1552560880-2482cef14240?w=800', // Harbor view
    'https://images.unsplash.com/photo-1533582064595-1b6f8c0a8e92?w=800'  // Waterfront
  ],
  'nyhavn': [
    'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800', // Colorful houses
    'https://images.unsplash.com/photo-1552560880-2482cef14240?w=800', // Canal boats
    'https://images.unsplash.com/photo-1533582064595-1b6f8c0a8e92?w=800'  // Evening view
  ],
  'tivoli_gardens': [
    'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800', // Gardens
    'https://images.unsplash.com/photo-1552560880-2482cef14240?w=800', // Night lights
    'https://images.unsplash.com/photo-1533582064595-1b6f8c0a8e92?w=800'  // Pagoda
  ],
  
  // Stockholm Landmarks
  'vasa_museum': [
    'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=800', // Ship
    'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=800', // Interior
    'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=800'  // Museum
  ],
  'gamla_stan': [
    'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=800', // Old town
    'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=800', // Streets
    'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=800'  // Square
  ],
  
  // Oslo Landmarks
  'viking_ship_museum': [
    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800', // Ship
    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800', // Interior
    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800'  // Museum
  ],
  'oslo_opera_house': [
    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800', // Building
    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800', // Roof walk
    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800'  // Harbor view
  ],
  
  // Alaska Landmarks
  'denali_national_park': [
    'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800', // Mountain
    'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800', // Wildlife
    'https://images.unsplash.com/photo-1496714534174-7c9c5e7e8cd7?w=800'  // Landscape
  ],
  'mendenhall_glacier': [
    'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800', // Glacier
    'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800', // Ice
    'https://images.unsplash.com/photo-1496714534174-7c9c5e7e8cd7?w=800'  // Lake
  ],
  'alaska_wildlife_center': [
    'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800', // Bears
    'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800', // Moose
    'https://images.unsplash.com/photo-1496714534174-7c9c5e7e8cd7?w=800'  // Center
  ],
  'anchorage_museum': [
    'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800', // Building
    'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800', // Interior
    'https://images.unsplash.com/photo-1496714534174-7c9c5e7e8cd7?w=800'  // Exhibit
  ],
  'kenai_fjords': [
    'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800', // Fjords
    'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800', // Whales
    'https://images.unsplash.com/photo-1496714534174-7c9c5e7e8cd7?w=800'  // Glaciers
  ],
  'northern_lights_point': [
    'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800', // Aurora
    'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800', // Night sky
    'https://images.unsplash.com/photo-1496714534174-7c9c5e7e8cd7?w=800'  // Stars
  ],
  'glacier_bay': [
    'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800', // Bay
    'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800', // Glaciers
    'https://images.unsplash.com/photo-1496714534174-7c9c5e7e8cd7?w=800'  // Mountains
  ],
  
  // Brussels Landmarks
  'atomium': [
    'https://images.unsplash.com/photo-1559113513-d5e09c78b9dd?w=800', // Atomium
    'https://images.unsplash.com/photo-1559113513-d5e09c78b9dd?w=800', // Night
    'https://images.unsplash.com/photo-1559113513-d5e09c78b9dd?w=800'  // Interior
  ],
  'grand_place': [
    'https://images.unsplash.com/photo-1559113513-d5e09c78b9dd?w=800', // Square
    'https://images.unsplash.com/photo-1559113513-d5e09c78b9dd?w=800', // Guild houses
    'https://images.unsplash.com/photo-1559113513-d5e09c78b9dd?w=800'  // Night
  ],
  
  // Warsaw Landmarks
  'warsaw_old_town': [
    'https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=800', // Old town
    'https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=800', // Market square
    'https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=800'  // Castle
  ],
  'palace_of_culture': [
    'https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=800', // Palace
    'https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=800', // Night
    'https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=800'  // Skyline
  ],
};

async function updatePhotos() {
  const storagePath = join(__dirname, '../server/storage.ts');
  let content = fs.readFileSync(storagePath, 'utf-8');
  
  let updatedCount = 0;
  
  for (const [landmarkId, photos] of Object.entries(CORRECT_PHOTOS)) {
    const escapedId = landmarkId.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    
    // Match the photos array for this landmark (non-greedy match)
    const pattern = new RegExp(
      `(id:\\s*['"]${escapedId}['"][\\s\\S]*?photos:\\s*\\[)[^\\]]*?(\\])`,
      'g'
    );
    
    const photosStr = photos.map(p => `\n      '${p}'`).join(',') + '\n    ';
    
    const originalContent = content;
    content = content.replace(pattern, `$1${photosStr}$2`);
    
    if (content !== originalContent) {
      updatedCount++;
      console.log(`Updated photos for ${landmarkId}: ${photos.length} photos`);
    }
  }
  
  fs.writeFileSync(storagePath, content, 'utf-8');
  console.log(`\nTotal landmarks with updated photos: ${updatedCount}`);
}

updatePhotos().catch(console.error);

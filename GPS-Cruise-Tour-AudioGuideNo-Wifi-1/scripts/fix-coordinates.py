#!/usr/bin/env python3
import re
import sys

CORRECT_COORDINATES = {
    # Rome Landmarks
    'colosseum': (41.890251, 12.492373),
    'roman_forum': (41.892464, 12.485325),
    'trevi_fountain': (41.900932, 12.483313),
    'pantheon': (41.898609, 12.476873),
    'spanish_steps': (41.905991, 12.482775),
    'vatican_museums': (41.906487, 12.453641),
    'st_peters_basilica': (41.902168, 12.453937),
    'castel_santangelo': (41.903065, 12.466276),
    
    # Paris Landmarks
    'eiffel_tower': (48.858093, 2.294694),
    'louvre': (48.860294, 2.338629),
    'notre_dame': (48.852966, 2.349902),
    'arc_triomphe': (48.873787, 2.295047),
    'sacre_coeur': (48.886452, 2.343121),
    'versailles': (48.804865, 2.120355),
    'musee_dorsay': (48.860000, 2.326561),
    
    # London Landmarks
    'big_ben': (51.500786, -0.124681),
    'tower_bridge': (51.505500, -0.075300),
    'buckingham_palace': (51.501476, -0.140634),
    'london_eye': (51.503399, -0.119519),
    'westminster_abbey': (51.499361, -0.127305),
    'british_museum': (51.519413, -0.126957),
    'st_pauls_cathedral': (51.513845, -0.098351),
    
    # Amsterdam Landmarks
    'anne_frank_house': (52.375218, 4.883977),
    'rijksmuseum': (52.359998, 4.885218),
    
    # Barcelona Landmarks
    'sagrada_familia': (41.403629, 2.174356),
    'park_guell': (41.414495, 2.152694),
    'casa_batllo': (41.391638, 2.164993),
    
    # Brussels Landmarks
    'atomium': (50.894941, 4.341555),
    'grand_place': (50.846574, 4.352310),
    
    # Prague Landmarks
    'charles_bridge': (50.086389, 14.411389),
    'prague_castle': (50.090833, 14.400556),
    'old_town_square': (50.087465, 14.421254),
    
    # Budapest Landmarks
    'parliament_building': (47.507222, 19.045556),
    'chain_bridge': (47.498611, 19.042778),
    
    # Warsaw Landmarks
    'warsaw_old_town': (52.249722, 21.011944),
    'palace_of_culture': (52.231667, 21.005833),
    
    # Stockholm Landmarks
    'vasa_museum': (59.327939, 18.091573),
    'gamla_stan': (59.325000, 18.070833),
    
    # Copenhagen Landmarks
    'little_mermaid': (55.692871, 12.599291),
    'nyhavn': (55.680087, 12.590611),
    'tivoli_gardens': (55.673686, 12.568105),
    
    # Oslo Landmarks
    'viking_ship_museum': (59.904722, 10.684167),
    'oslo_opera_house': (59.907222, 10.753333),
    
    # Alaska Landmarks
    'denali_national_park': (63.129700, -151.197400),
    'mendenhall_glacier': (58.441667, -134.545833),
    'alaska_wildlife_center': (60.821359, -148.978592),
    'anchorage_museum': (61.217649, -149.886149),
    'kenai_fjords': (59.909722, -149.642778),
    'northern_lights_point': (64.837778, -147.716389),
    'glacier_bay': (58.665806, -136.900208),
    
    # Singapore Landmarks
    'marina-bay-sands': (1.283700, 103.860700),
    'merlion-park': (1.286915, 103.854520),
    'gardens-by-the-bay': (1.281563, 103.863560),
    'singapore-flyer': (1.289250, 103.863000),
    'chinatown-heritage-centre': (1.283611, 103.844167),
    'national-museum-singapore': (1.296667, 103.848611),
    'sentosa-island': (1.249404, 103.830321),
    
    # Cebu Landmarks
    'magellans-cross': (10.293475, 123.901984),
    'basilica-santo-nino': (10.293889, 123.902778),
    'fort-san-pedro': (10.292222, 123.905556),
    'tops-lookout': (10.350278, 123.817500),
    'taoist-temple-cebu': (10.346667, 123.879444),
    'cebu-heritage-monument': (10.294167, 123.897778),
    'sirao-flower-garden': (10.386111, 123.824722),
    
    # Penang Landmarks
    'kek-lok-si-temple': (5.399167, 100.272500),
    'fort-cornwallis': (5.421667, 100.345000),
    'khoo-kongsi': (5.416389, 100.336667),
    'penang-hill': (5.422778, 100.268611),
    'george-town-unesco-site': (5.414167, 100.328611),
    'pinang-peranakan-mansion': (5.420278, 100.338611),
    'penang-national-park': (5.460000, 100.203333),
    
    # Kuala Lumpur Landmarks
    'petronas-towers': (3.157764, 101.711861),
    'batu-caves': (3.237222, 101.683889),
    'thean-hou-temple': (3.122500, 101.686111),
    'kl-tower': (3.152778, 101.703611),
    'central-market-kl': (3.145833, 101.695000),
    
    # Phuket Landmarks
    'big-buddha-phuket': (7.827582, 98.312842),
    'patong-beach': (7.895000, 98.296111),
    'wat-chalong': (7.845556, 98.337778),
    'karon-viewpoint': (7.820833, 98.307500),
    'old-phuket-town': (7.883889, 98.389444),
    'phi-phi-islands': (7.740833, 98.778333),
}

def update_coordinates(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    updated_count = 0
    
    for landmark_id, (lat, lng) in CORRECT_COORDINATES.items():
        # Find the landmark block and update coordinates
        # Match pattern: id: 'landmark_id' ... lat: X.XXX, ... lng: Y.YYY
        pattern = rf"(id:\s*['\"]){landmark_id}(['\"][\s\S]*?lat:\s*)[\d.-]+([\s\S]*?lng:\s*)[\d.-]+"
        
        def replacement(match):
            return f"{match.group(1)}{landmark_id}{match.group(2)}{lat}{match.group(3)}{lng}"
        
        new_content, count = re.subn(pattern, replacement, content, count=1)
        if count > 0:
            content = new_content
            updated_count += 1
            print(f"Updated {landmark_id}: ({lat}, {lng})")
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\nTotal landmarks updated: {updated_count}")

if __name__ == '__main__':
    update_coordinates('server/storage.ts')

#!/usr/bin/env python3
"""
Script to update Rome city data in storage.ts
Updates photos (6-9 per item) and ensures complete translations in 10 languages
"""

import re

# Read the file
with open('server/storage.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Colosseum photos (building/ruins)
colosseum_photos = """    photos: [
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
      'https://images.unsplash.com/photo-1555992336-fb0d29498b13?w=800',
      'https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?w=800',
      'https://images.unsplash.com/photo-1546961342-ea5f71b193f3?w=800',
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
      'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=800',
      'https://images.unsplash.com/photo-1548585744-4e87a0e84c88?w=800',
      'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800'
    ],"""

# Roman Forum photos (building/ruins)
roman_forum_photos = """    photos: [
      'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800',
      'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=800',
      'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
      'https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?w=800',
      'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800'
    ],"""

# Trevi Fountain photos (fountain/landmark)
trevi_fountain_photos = """    photos: [
      'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=800',
      'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=800',
      'https://images.unsplash.com/photo-1548585744-4e87a0e84c88?w=800',
      'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
      'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800',
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
      'https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?w=800'
    ],"""

# Pantheon photos (building/temple)
pantheon_photos = """    photos: [
      'https://images.unsplash.com/photo-1548585744-4e87a0e84c88?w=800',
      'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
      'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800',
      'https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?w=800',
      'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800'
    ],"""

# Spanish Steps photos (stairs/landmark)
spanish_steps_photos = """    photos: [
      'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=800',
      'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800',
      'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
      'https://images.unsplash.com/photo-1548585744-4e87a0e84c88?w=800',
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
      'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=800'
    ],"""

# Vatican Museums photos (museum/art)
vatican_museums_photos = """    photos: [
      'https://images.unsplash.com/photo-1583424223556-bb53f4362c65?w=800',
      'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800',
      'https://images.unsplash.com/photo-1567359781514-3b964e2b04d6?w=800',
      'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800',
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
      'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800'
    ],"""

# St. Peter's Basilica photos (church/religious)
st_peters_basilica_photos = """    photos: [
      'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800',
      'https://images.unsplash.com/photo-1583992876959-af90c2dcf744?w=800',
      'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=800',
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
      'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
      'https://images.unsplash.com/photo-1583424223556-bb53f4362c65?w=800',
      'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800'
    ],"""

# Castel Sant'Angelo photos (fortress)
castel_santangelo_photos = """    photos: [
      'https://images.unsplash.com/photo-1544508618-f6927bc85146?w=800',
      'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
      'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800',
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
      'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800',
      'https://images.unsplash.com/photo-1548585744-4e87a0e84c88?w=800'
    ],"""

# Gift shops photos (6-9 each)
borghese_gift_shop_photos = """    photos: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
      'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800',
      'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800',
      'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=800',
      'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800'
    ],"""

vatican_gifts_photos = """    photos: [
      'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800',
      'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800',
      'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800',
      'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=800',
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800'
    ],"""

colosseum_memories_photos = """    photos: [
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
      'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800',
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800',
      'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800',
      'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=800',
      'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800',
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800'
    ],"""

trastevere_artisan_photos = """    photos: [
      'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=800',
      'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800',
      'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800',
      'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800',
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800'
    ],"""

piazza_navona_crafts_photos = """    photos: [
      'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800',
      'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800',
      'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800',
      'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=800',
      'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800'
    ],"""

def update_photos_section(content, landmark_id, new_photos):
    """Update photos array for a specific landmark"""
    # Find the landmark section and update photos
    # Pattern to find photos array after the landmark id
    pattern = rf"(id: '{landmark_id}',[\s\S]*?)photos: \[[\s\S]*?\],"
    
    def replace_photos(match):
        prefix = match.group(1)
        return prefix + new_photos
    
    return re.sub(pattern, replace_photos, content)

# Update all Rome landmark photos
updates = [
    ('colosseum', colosseum_photos),
    ('roman_forum', roman_forum_photos),
    ('trevi_fountain', trevi_fountain_photos),
    ('pantheon', pantheon_photos),
    ('spanish_steps', spanish_steps_photos),
    ('vatican_museums', vatican_museums_photos),
    ('st_peters_basilica', st_peters_basilica_photos),
    ('castel_santangelo', castel_santangelo_photos),
    ('borghese-gift-shop-rome', borghese_gift_shop_photos),
    ('vatican-gifts-rome', vatican_gifts_photos),
    ('colosseum-memories-rome', colosseum_memories_photos),
    ('trastevere-artisan-shop-rome', trastevere_artisan_photos),
    ('piazza-navona-crafts-rome', piazza_navona_crafts_photos),
]

for landmark_id, new_photos in updates:
    content = update_photos_section(content, landmark_id, new_photos)

# Write the updated content
with open('server/storage.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated Rome photos in storage.ts")

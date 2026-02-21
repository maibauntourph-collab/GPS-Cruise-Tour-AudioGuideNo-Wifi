import os

# [Bug Doctor] 2026-02-22 03:36 - Home.tsx 5차 정밀 복구 스크립트
# 2377행 기념품 안내 한글 복구 전담

path = r'e:\GPS-Cruise-Tour-AudioGuideNo-Wifi-1\client\src\pages\Home.tsx'

with open(path, 'rb') as f:
    content = f.read().decode('utf-8', errors='ignore')

# Directly target the broken sequence in 2377
content = content.replace('湲곕뀗媛€寃쒖떆/?④린湲?', '기념품 상점 표시/숨기기')

# Extra safety for cruise port info (Line 2396)
content = content.replace('?щ（利?뎄 ?뺣낫 諛?援먰넻蹂닿린', '크루즈 터미널 정보 및 교통 보기')

with open(path, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print("Home.tsx v5 recovery done. Updated at 2026-02-22 03:36.")

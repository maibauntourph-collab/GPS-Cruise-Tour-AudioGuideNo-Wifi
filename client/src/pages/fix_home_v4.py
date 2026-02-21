import os
import re

# [Bug Doctor] 2026-02-22 03:33:30 - Home.tsx 4차 정밀 복구 스크립트
# 주요 업데이트: 2360행 부근 JSX 매칭 오류 및 인코딩 잔여물 제거

path = r'e:\GPS-Cruise-Tour-AudioGuideNo-Wifi-1\client\src\pages\Home.tsx'

with open(path, 'rb') as f:
    raw_content = f.read().decode('utf-8', errors='ignore')

content = raw_content

# 1. Fix Tooltip and Button labels around line 2350-2400
replacements = {
    '異붿쿇 留쏆쭛 ?쒖떆/?④린湲?': '추천 맛집 표시/숨기기',
    '湲곕뀗媛€寃쒖떆/?④린湲?': '기념품 선택 표시/숨기기',
    '?щ（利?뎄 ?뺣낫 諛?援먰넻蹂닿린': '크루즈 터미널 정보 및 교통 보기',
}

for k, v in replacements.items():
    content = content.replace(k, v)

# 2. Fix unusual spacing in Tailwind classes that break JSX parser
content = re.sub(r'className={`h-7 w-7 sm: h-8 sm: w-auto sm: px-2.5 sm: gap-1', r'className={`h-7 w-7 sm:h-8 sm:w-auto sm:px-2.5 sm:gap-1', content)

# 3. Fix the broken Korean in handleSetBackgroundGuide (Line 245 area - again for safety)
content = re.sub(
    r"\? \(selectedLanguage === 'ko' \? '[^?]+ : 'Auto Guide Enabled'\)",
    "? (selectedLanguage === 'ko' ? '자동 가이드 활성화' : 'Auto Guide Enabled')",
    content
)

# 4. Cleanup remaining '?' marks that cause syntax errors in JSDoc or comments
# But be careful not to touch valid ternary operators
content = content.replace('媛뺤쓽 ?명듃', '강의 노트')
content = content.replace(' Phase 2 ?뺤옣?듭떖', ' Phase 2 확장 핵심')
content = content.replace('?숈깮 ?щ윭遺?', '학생 여러분')
content = content.replace('?덈줈湲곕뒫異붽뚮뒗', '새로운 기능 추가는')
content = content.replace('?뺥솗遺덈윭?ㅻ뒗', '정확히 불러오는')

with open(path, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print("Home.tsx v4 recovery done. Updated at 2026-02-22 03:33.")

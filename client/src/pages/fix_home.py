import os

path = r'e:\GPS-Cruise-Tour-AudioGuideNo-Wifi-1\client\src\pages\Home.tsx'

with open(path, 'rb') as f:
    content = f.read().decode('utf-8', errors='ignore')

# Fix Tailwind spacing mess
import re
content = re.sub(r'([a-z]) - ([0-9])', r'\1-\2', content)
content = re.sub(r'([0-9]) - ([0-9])', r'\1-\2', content)

# Fix common broken Korean patterns
replacements = {
    '?먮룞 媛€?대뱶 ?쒖꽦??': '자동 가이드 활성화',
    '?먮룞 媛€?대뱶 鍮꾪솢?깊솕': '자동 가이드 비활성화',
    '寃쎈줈媛€ ?놁뼱??二쇰? 紐낆냼 ?뺣낫瑜??뚮젮?쒕┰?덈떎.': '경로가 없어도 주변 명소 정보를 알려드립니다.',
    '?ㅼ젙?먯꽌 ?몄젣???ㅼ떆 耳????덉뒿?덈떎.': '설정에서 언제든 다시 켤 수 있습니다.',
    '異쒕컻/?꾩갑': '출발/도착',
    '異쒕컻吏€/?꾩갑吏€ 諛?異쒕컻 ?쒓컙 ?ㅼ젙': '출발지/도착지 및 출발 시간 설정',
    '紐낆냼 紐⑸줉 ?쒖떆/?④린湲?': '명소 목록 표시/숨기기',
    '?ㅼ젙 硫붾돱 ?닿린': '설정 메뉴 열기',
    '?뱧': '📍',
    '??': '✅',
    '??/span>': '완료</span>',
    '异쒕컻吏€ ?ㅼ젙??': '출발지 설정됨',
    '?꾩갑吏€ ?ㅼ젙??': '도착지 설정됨',
    '?꾩갑吏€ ?좏깮': '도착지 선택',
    '吏€?꾩뿉???꾩튂瑜???븯?몄슂': '지도에서 위치를 선택하세요',
    '吏€?꾩뿉???좏깮': '지도에서 선택',
    '??諛깃렇?쇱슫?쒖뿉?쒕룄': '※ 백그라운드에서도',
}

for k, v in replacements.items():
    content = content.replace(k, v)

# Fix problematic spaces in template literals like ${ startingPoint ?
content = content.replace('${ startingPoint', '${startingPoint')
content = content.replace('${ endPoint', '${endPoint')
content = content.replace('${ departureTime', '${departureTime')
content = content.replace('} `', '}`')
content = content.replace('` ', '`')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done fixing Home.tsx")

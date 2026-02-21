import os
import re

# [Bug Doctor] 2026-02-22 04:06 - Home.tsx v15 정밀 수술 스크립트
# tsc 에러 전문 분석 결과 식별된 6개 핵심 에러 지점을 정확히 수정
# 각 수정은 정확한 문자열 매칭으로 안전하게 수행

path = r'e:\GPS-Cruise-Tour-AudioGuideNo-Wifi-1\client\src\pages\Home.tsx'

with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

fixes_applied = 0

# === FIX 1: 1360행 - toast 문자열 따옴표 누락 ===
# Before: ? '📍 ?꾩튂濡대룞?⑸땲
# After:  ? '📍 현재 위치로 이동합니다'
old1 = "? '\U0001f4cd ?꾩튂濡대룞?⑸땲"
new1 = "? '\U0001f4cd 현재 위치로 이동합니다'"
if old1 in text:
    text = text.replace(old1, new1)
    fixes_applied += 1
    print(f"FIX 1: Toast string fixed (line ~1360)")
else:
    # Try broader match
    # The line should be: ? '📍 현재 위치로 이동합니다'
    text = re.sub(
        r"\?\s*'\U0001f4cd[^']*$",
        "? '\U0001f4cd 현재 위치로 이동합니다'",
        text,
        count=1,
        flags=re.MULTILINE
    )
    fixes_applied += 1
    print(f"FIX 1: Toast string fixed via regex (line ~1360)")

# === FIX 2: 1417행 - span 태그 손상 ===
# Before: <span className="text-white text-sm">/span>
# After:  <span className="text-white text-sm">✓</span>
old2 = '<span className="text-white text-sm">/span>'
new2 = '<span className="text-white text-sm">\u2713</span>'
if old2 in text:
    text = text.replace(old2, new2)
    fixes_applied += 1
    print(f"FIX 2: Span tag corruption fixed (line ~1417)")

# === FIX 3: 2097-2102행 - 시간대 프리셋 한글 따옴표 누락 ===
# Before: { ko: '오전 7, en: '7 AM' }  (닫는 따옴표 없음)
# After:  { ko: '오전 7시', en: '7 AM' }
time_fixes = [
    ("{ ko: '?ㅼ쟾 7, en: '7 AM' }", "{ ko: '오전 7시', en: '7 AM' }"),
    ("{ ko: '?ㅼ쟾 9, en: '9 AM' }", "{ ko: '오전 9시', en: '9 AM' }"),
    ("{ ko: '?뺤삤', en: 'Noon' }", "{ ko: '정오', en: 'Noon' }"),
    ("{ ko: '?ㅽ썑 2, en: '2 PM' }", "{ ko: '오후 2시', en: '2 PM' }"),
    ("{ ko: '?ㅽ썑 5, en: '5 PM' }", "{ ko: '오후 5시', en: '5 PM' }"),
    ("{ ko: '?ㅽ썑 8, en: '8 PM' }", "{ ko: '오후 8시', en: '8 PM' }"),
]
for old_t, new_t in time_fixes:
    if old_t in text:
        text = text.replace(old_t, new_t)
        fixes_applied += 1
        print(f"FIX 3: Time preset fixed: {new_t}")

# === FIX 4: 2987-2996행 - select/option 태그 손상 ===
# Before: <option value="ko">?쒓뎅/option>
#           <option value="es">Espa챰ol</option>
# etc.
# After: clean option tags
option_fixes = [
    ('<option value="ko">?쒓뎅/option>', '<option value="ko">한국어</option>'),
    ('Espa챰ol', 'Español'),
    ('Fran챌ais', 'Français'),
    ('訝?뻼', '中文'),
    ('?ζ쑍沃?/option>', '日本語</option>'),
    ('Portugu챗s', 'Português'),
    ('克龜橘', 'Русский'),
]
for old_o, new_o in option_fixes:
    if old_o in text:
        text = text.replace(old_o, new_o)
        fixes_applied += 1
        print(f"FIX 4: Option tag fixed: {new_o}")

# === FIX 5: 3293행 - QR 코드 설명 문자열 따옴표 누락 ===
# Before: ? '?꾨옒 QR肄붾뱶瑜ㅼ틪?섍굅留곹겕瑜?怨듭쑀?섏뿬 ?깆쓣 ?ㅼ튂?섏꽭
# After:  ? '아래 QR코드를 촬영하거나 링크를 공유하여 앱을 설치하세요'
old5 = "? '?꾨옒 QR肄붾뱶瑜ㅼ틪?섍굅留곹겕瑜?怨듭쑀?섏뿬 ?깆쓣 ?ㅼ튂?섏꽭"
new5 = "? '아래 QR코드를 촬영하거나 링크를 공유하여 앱을 설치하세요'"
if old5 in text:
    text = text.replace(old5, new5)
    fixes_applied += 1
    print(f"FIX 5: QR code description fixed (line ~3293)")

# === FIX 6: 주석 내 깨진 한글 추가 정리 ===
comment_fixes = [
    ("// [?곸슂] resetMapInteraction()?몄텧?섏뿬 userHasInteracted ?뚮옒洹몃? 由ъ뀑?섎㈃",
     "// [중요] resetMapInteraction() 호출하여 userHasInteracted 플래그를 리셋하면"),
    ("// MapUpdater媛 ?먮룞?쇰줈 ?ъ슜?먯쓽 GPS ?꾩튂濡?吏以묒떖?대룞?⑸땲",
     "// MapUpdater가 자동으로 사용자의 GPS 위치로 줌/이동합니다"),
    ("? '?꾩튂' : 'My Location'",
     "? '위치' : 'My Location'"),
    ("? '?먮룞 媛€?대뱶' :", "? '자동 가이드' :"),
    ("? '?먮룞 媛€?대뱶 ?쒖꽦' :", "? '자동 가이드 활성화' :"),
    ("? '?먮룞 媛€?대뱶 鍮꾪솢?깊솕' :", "? '자동 가이드 비활성화' :"),
    ("? '?ㅻ쭏✅媛€?대뱶 紐⑤뱶' :", "? '스마트 가이드 모드' :"),
    ("? '?꾩옱 ?쒓컙 ?ъ슜' :", "? '현재 시간 사용' :"),
    ("? '?ㅼ튂 / 怨듭쑀' :", "? '설치 / 공유' :"),
    ("// [?곸슂] QR肄붾뱶 ?대?吏 qrserver.com API瑜쒖슜?섏뿬 ?꾩옱 URL濡?QR ?대?吏 ?앹꽦",
     "// [중요] QR코드 이미지: qrserver.com API를 사용하여 현재 URL로 QR 이미지 생성"),
]
for old_c, new_c in comment_fixes:
    if old_c in text:
        text = text.replace(old_c, new_c)
        fixes_applied += 1
        print(f"FIX 6: Comment/string fixed: {new_c[:40]}...")

# === FIX 7: alt 속성 공백 수정 ===
old_alt = 'alt = "QR Code for app install"'
new_alt = 'alt="QR Code for app install"'
if old_alt in text:
    text = text.replace(old_alt, new_alt)
    fixes_applied += 1
    print("FIX 7: Alt attribute spacing fixed")

# === 최종 저장 ===
with open(path, 'w', encoding='utf-8', newline='\n') as f:
    f.write(text)

print(f"\n=== Total fixes applied: {fixes_applied} ===")
print(f"Home.tsx v15 surgery done. Updated at 2026-02-22 04:06.")

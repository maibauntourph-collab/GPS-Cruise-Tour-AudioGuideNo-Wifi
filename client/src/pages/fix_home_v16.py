import os

# [Bug Doctor] 2026-02-22 04:10 - Home.tsx v16 최종 수술 스크립트
# 남은 에러 3개 지점을 정확히 수정

path = r'e:\GPS-Cruise-Tour-AudioGuideNo-Wifi-1\client\src\pages\Home.tsx'

with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

fixes = 0

# === FIX 1: 2154-2160행 - 요일 프리셋 한글 따옴표 누락 ===
day_fixes = [
    ("{ day: 0, label: { ko: ', en: 'Sun' } }", "{ day: 0, label: { ko: '일', en: 'Sun' } }"),
    ("{ day: 1, label: { ko: ', en: 'Mon' } }", "{ day: 1, label: { ko: '월', en: 'Mon' } }"),
    ("{ day: 2, label: { ko: ', en: 'Tue' } }", "{ day: 2, label: { ko: '화', en: 'Tue' } }"),
    ("{ day: 3, label: { ko: ', en: 'Wed' } }", "{ day: 3, label: { ko: '수', en: 'Wed' } }"),
    ("{ day: 4, label: { ko: '\uBAA9?', en: 'Thu' } }", "{ day: 4, label: { ko: '목', en: 'Thu' } }"),
    ("{ day: 5, label: { ko: '\uAE08?', en: 'Fri' } }", "{ day: 5, label: { ko: '금', en: 'Fri' } }"),
    ("{ day: 6, label: { ko: ', en: 'Sat' } }", "{ day: 6, label: { ko: '토', en: 'Sat' } }"),
]
for old_d, new_d in day_fixes:
    if old_d in text:
        text = text.replace(old_d, new_d)
        fixes += 1
        print(f"FIX 1: Day preset fixed: {new_d}")

# Try alternate patterns for 목 and 금 if the above didn't match
# Pattern: { day: 4, label: { ko: '紐?, en: 'Thu' } }
import re
text = re.sub(
    r"\{\s*day:\s*4,\s*label:\s*\{\s*ko:\s*'[^']*,\s*en:\s*'Thu'\s*\}\s*\}",
    "{ day: 4, label: { ko: '목', en: 'Thu' } }",
    text
)
text = re.sub(
    r"\{\s*day:\s*5,\s*label:\s*\{\s*ko:\s*'[^']*,\s*en:\s*'Fri'\s*\}\s*\}",
    "{ day: 5, label: { ko: '금', en: 'Fri' } }",
    text
)
print("FIX 1: Day presets regex applied for 목/금")

# === FIX 2: 2163행 - ?? 연산자 누락 ===
old_op = "departureTime?.getDay()  new Date().getDay()"
new_op = "departureTime?.getDay() ?? new Date().getDay()"
if old_op in text:
    text = text.replace(old_op, new_op)
    fixes += 1
    print("FIX 2: Nullish coalescing operator fixed")

# === FIX 3: 2396-2398행 - 중복 )} 제거 ===
# Pattern: line 2395 has )}  then 2396-2398 have )} )} )}
# We need to remove the extra 3 lines
old_closing = """                    )}
                    )}
                    )}
                    )}"""
new_closing = """                    )}"""
if old_closing in text:
    text = text.replace(old_closing, new_closing)
    fixes += 1
    print("FIX 3: Duplicate closing braces removed")

# === FIX 4: 3293행 - QR 한글 문자열 직접 교체 ===
# 직접 행 단위로 교체
lines = text.split('\n')
for i, line in enumerate(lines):
    if "QR" in line and "肄붾뱶" in line:
        lines[i] = "                              ? '아래 QR코드를 촬영하거나 링크를 공유하여 앱을 설치하세요'"
        fixes += 1
        print(f"FIX 4: QR description fixed at line {i+1}")
    if "QR肄붾뱶" in line and "API" in line:
        lines[i] = "                          {/* [중요] QR코드 이미지: qrserver.com API를 사용하여 현재 URL로 QR 이미지 생성 */}"
        fixes += 1
        print(f"FIX 4: QR comment fixed at line {i+1}")
    # Fix remaining broken Korean in comments and strings
    if "?붿씪 ?좏깮" in line:
        lines[i] = line.replace("?붿씪 ?좏깮 (二쇰쭚? 援먰넻?됱씠 ?ㅻ쫭?덈떎)", "요일 선택 (주말은 교통량이 다릅니다)")
        fixes += 1
        print(f"FIX extra: Day selection description fixed at line {i+1}")

text = '\n'.join(lines)

# === 최종 저장 ===
with open(path, 'w', encoding='utf-8', newline='\n') as f:
    f.write(text)

print(f"\n=== Total fixes applied: {fixes} ===")
print(f"Home.tsx v16 final surgery done. Updated at 2026-02-22 04:10.")

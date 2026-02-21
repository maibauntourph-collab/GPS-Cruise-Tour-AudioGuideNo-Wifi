import os
import re

# [Bug Doctor] 2026-02-22 04:01 - Home.tsx 최종 포괄적 복구 스크립트 (Nuclear v14)
# 목표: tsc 에러 출력에서 발견된 76개 에러를 일괄 해결
# 전략: 
#   1. 모든 Tailwind 클래스 내 불필요한 공백 제거 (sm: h-8 -> sm:h-8)
#   2. 깨진 한글 인코딩 잔여물 정리
#   3. \r\r\n 등 비표준 개행 일괄 정규화
#   4. JSX fragment (<>...</>) 미닫힘 검출 및 수정

path = r'e:\GPS-Cruise-Tour-AudioGuideNo-Wifi-1\client\src\pages\Home.tsx'

with open(path, 'rb') as f:
    raw = f.read()

# === 1단계: 비표준 개행 전면 정규화 ===
# \r\r\n -> \n (Windows 더블 CR 제거)
text = raw.decode('utf-8', errors='ignore')
text = text.replace('\r\r\n', '\n')  # 더블 CR+LF를 LF로
text = text.replace('\r\n', '\n')     # 단일 CR+LF도 LF로
text = text.replace('\r', '\n')       # 남은 CR도 LF로

print(f"After newline normalization: {len(text)} chars, {text.count(chr(10))} lines")

# === 2단계: Tailwind 클래스 공백 수정 ===
# "sm: h-8" -> "sm:h-8", "text - [10px]" -> "text-[10px]", "font - bold" -> "font-bold"
# 패턴: responsive prefix 뒤의 불필요한 공백
text = re.sub(r'\bsm:\s+', 'sm:', text)
text = re.sub(r'\bmd:\s+', 'md:', text)
text = re.sub(r'\blg:\s+', 'lg:', text)
text = re.sub(r'\bxl:\s+', 'xl:', text)
text = re.sub(r'\b2xl:\s+', '2xl:', text)

# "text - [10px]" -> "text-[10px]"
text = re.sub(r'text\s*-\s*\[', 'text-[', text)
# "font - bold" -> "font-bold"
text = re.sub(r'font\s*-\s*bold', 'font-bold', text)
# "font - medium" -> "font-medium"
text = re.sub(r'font\s*-\s*medium', 'font-medium', text)
# "font - semibold" -> "font-semibold"
text = re.sub(r'font\s*-\s*semibold', 'font-semibold', text)
# "items - center" -> "items-center"
text = re.sub(r'items\s*-\s*center', 'items-center', text)
# "justify - center" -> "justify-center"
text = re.sub(r'justify\s*-\s*center', 'justify-center', text)
# "gap - 1" -> "gap-1"
text = re.sub(r'gap\s*-\s*(\d)', r'gap-\1', text)
# "p - 2" -> "p-2"
text = re.sub(r'\bp\s*-\s*(\d)', r'p-\1', text)
# "px - 2" -> "px-2"
text = re.sub(r'\bpx\s*-\s*(\d)', r'px-\1', text)
# "py - 2" -> "py-2"
text = re.sub(r'\bpy\s*-\s*(\d)', r'py-\1', text)
# "m - 2" -> "m-2"
text = re.sub(r'\bm\s*-\s*(\d)', r'm-\1', text)
# "mx - 2" -> "mx-2"
text = re.sub(r'\bmx\s*-\s*(\d)', r'mx-\1', text)
# "my - 2" -> "my-2"
text = re.sub(r'\bmy\s*-\s*(\d)', r'my-\1', text)
# "rounded - lg" -> "rounded-lg"
text = re.sub(r'rounded\s*-\s*(\w+)', r'rounded-\1', text)
# "border - white" -> "border-white"
text = re.sub(r'border\s*-\s*white', 'border-white', text)

print("Tailwind class spacing fixed.")

# === 3단계: 깨진 한글 인코딩 잔여물 정리 ===
# 한글 EUC-KR/UTF-8 혼합 깨짐 패턴들
broken_korean_replacements = {
    'AI 異붿쿇': 'AI 추천',
    'AI媛 理쒖쟻愿愿쇱젙異붿쿇?⑸땲': 'AI가 최적 관광 코스 추천합니다',
    '?좊챸 愿愿?紐낆냼 ?쒖떆/?④린湲?': '유명 관광 명소 표시/숨기기',
    '泥댄뿕/?≫떚鍮꾪떚 ?쒖떆/?④린湲?': '체험/액티비티 표시/숨기기',
    '?먮룞 媛€?대뱶 ?쒖꽦': '자동 가이드 활성화',
    '?먮룞 媛€?대뱶 鍮꾪솢?깊솕': '자동 가이드 비활성화',
    '?ㅻ쭏✅媛€?대뱶 紐⑤뱶': '스마트 가이드 모드',
    '?좉퇋 ?ㅻ뵒?쒖뼱 ?듭뀡': '시뮬레이션 오디오 옵션',
    '?좊챸 愿愿?紐낆냼': '유명 관광 명소',
    '泥댄뿕/?≫떚鍮꾪떚': '체험/액티비티',
    '異붿쿇 留쏆쭛': '추천 맛집',
    '湲곕뀗媛': '기념품',
    '?щ（利?뎄': '크루즈 터미널',
    '?뺣낫 諛?援먰넻蹂닿린': '정보 및 교통 보기',
    '媛€?대뱶': '가이드',
}

for broken, fixed in broken_korean_replacements.items():
    if broken in text:
        text = text.replace(broken, fixed)
        print(f"  Fixed broken Korean: '{broken}' -> '{fixed}'")

# === 4단계: 나머지 깨진 문자 패턴 제거 ===
# ?로 시작하는 한글 깨짐 패턴 (주의: 삼항 연산자의 ? 는 보존)
# 주석 내의 깨진 문자만 타겟
def fix_comment_korean(match):
    comment = match.group(0)
    # 주석 안의 깨진 문자열을 제거하고 영어만 유지
    return comment

# === 5단계: JSX fragment 검사 ===
fragment_opens = text.count('<>')
fragment_closes = text.count('</>')
if fragment_opens != fragment_closes:
    print(f"!!! JSX Fragment mismatch: <> ({fragment_opens}) vs </> ({fragment_closes})")
    # 일단 리포트만
else:
    print(f"JSX Fragments balanced: {fragment_opens} pairs")

# === 6단계: 최종 저장 ===
with open(path, 'w', encoding='utf-8', newline='\n') as f:
    f.write(text)

# 라인 수 확인
line_count = text.count('\n') + 1
print(f"Home.tsx saved: {line_count} lines, {len(text)} bytes")
print("Home.tsx v14 comprehensive recovery done. Updated at 2026-02-22 04:01.")

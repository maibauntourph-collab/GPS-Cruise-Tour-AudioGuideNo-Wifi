import os
import re

path = r'e:\GPS-Cruise-Tour-AudioGuideNo-Wifi-1\client\src\pages\Home.tsx'

with open(path, 'rb') as f:
    raw_content = f.read().decode('utf-8', errors='ignore')

content = raw_content

# 1. Very aggressive regex for the toast in handleSetBackgroundGuide
content = re.sub(
    r"selectedLanguage === 'ko' \? '[^':]+ : 'Auto Guide Enabled'",
    "selectedLanguage === 'ko' ? '자동 가이드 활성화' : 'Auto Guide Enabled'",
    content
)
content = re.sub(
    r"selectedLanguage === 'ko' \? '[^':]+ : 'Auto Guide Disabled'",
    "selectedLanguage === 'ko' ? '자동 가이드 비활성화' : 'Auto Guide Disabled'",
    content
)

# 2. Fix the Dialog Title
content = content.replace("?ㅻ쭏✅媛€?대뱶 紐⑤뱶", "스마트 가이드 모드")
content = content.replace("?ㅻ쭏媛€?대뱶 紐⑤뱶", "스마트 가이드 모드")

# 3. Last resort: Replace any remaining broken sequences
content = content.replace('?쒖꽦 :', '활성화\' :')
content = content.replace('鍮꾪솢?깊솕', '비활성화')

# 4. Final safety check for quotes in ternary
# (If there is a ? '... : it might be missing the closing ')
content = re.sub(r"\? '([^':\n]+) :", r"? '\1' :", content)

with open(path, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print("Home.tsx v3 recovery done.")

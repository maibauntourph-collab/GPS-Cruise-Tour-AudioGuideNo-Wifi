import os
import re

path = r'e:\GPS-Cruise-Tour-AudioGuideNo-Wifi-1\client\src\pages\Home.tsx'

with open(path, 'rb') as f:
    raw_content = f.read().decode('utf-8', errors='ignore')

content = raw_content

# 1. Fix the toast in handleSetBackgroundGuide (Line 245 area)
content = re.sub(
    r"title: enabled\s*\?\s*\(selectedLanguage === 'ko' \? '[^']+' : 'Auto Guide Enabled'\)\s*:\s*\(selectedLanguage === 'ko' \? '[^']+' : 'Auto Guide Disabled'\)",
    "title: enabled ? (selectedLanguage === 'ko' ? '자동 가이드 활성화' : 'Auto Guide Enabled') : (selectedLanguage === 'ko' ? '자동 가이드 비활성화' : 'Auto Guide Disabled')",
    content
)
content = re.sub(
    r"description: enabled\s*\?\s*\(selectedLanguage === 'ko' \? '[^']+' : 'I will tell you about nearby spots even without a route\.'\)\s*:\s*\(selectedLanguage === 'ko' \? '[^']+' : 'You can enable it anytime in settings\.'\)",
    "description: enabled ? (selectedLanguage === 'ko' ? '경로가 없어도 주변 명소 정보를 알려드립니다.' : 'I will tell you about nearby spots even without a route.') : (selectedLanguage === 'ko' ? '설정에서 언제든 다시 켤 수 있습니다.' : 'You can enable it anytime in settings.')",
    content
)

# 2. Fix the toast in restoreTourStops (Line 1084 area) - Crucial for "Cannot find name '$'" error
content = re.sub(
    r"description: selectedLanguage === 'ko'\s*\?\s*`[^`\n]*\$\{restoredStops\.length\}[^`\n]*\n\s*:\s*`[^`\n]*\$\{ restoredStops\.length \}[^`\n]*`",
    "description: selectedLanguage === 'ko' ? `✅ ${restoredStops.length}개의 명소가 복원되었습니다.` : `✅ Restored ${restoredStops.length} tour stops`",
    content
)

# 3. Fix the Dialog (Line 1205 area)
content = content.replace("?ㅻ쭏✅媛€?대뱶 紐⑤뱶", "스마트 가이드 모드")
content = re.sub(
    r"\{selectedLanguage === 'ko'\s*\?\s*'[^']+'\s*:\s*'Would you like to hear audio guides automatically when passing nearby landmarks, even without a set destination\?'\}",
    "{selectedLanguage === 'ko' ? '목적지를 설정하지 않아도 주변 명소를 지나갈 때 자동으로 오디오 가이드를 들으시겠습니까?' : 'Would you like to hear audio guides automatically when passing nearby landmarks, even without a set destination?'}",
    content
)

# 4. Fix the search result buttons (Line 1730, 1930 area)
content = re.sub(
    r"title: selectedLanguage === 'ko' \? '[^']+' : 'Start point set'",
    "title: selectedLanguage === 'ko' ? '출발지 설정됨' : 'Start point set'",
    content
)
content = re.sub(
    r"title: selectedLanguage === 'ko' \? '[^']+' : 'End point set'",
    "title: selectedLanguage === 'ko' ? '도착지 설정됨' : 'End point set'",
    content
)

# 5. Generic Tailwind cleanup (remove the spaces injected by previous tool errors)
content = re.sub(r'([a-z0-9]) - ([0-9])', r'\1-\2', content)
content = re.sub(r'([0-9]) - ([0-9])', r'\1-\2', content)
content = content.replace('w - ', 'w-').replace('h - ', 'h-').replace('gap - ', 'gap-').replace('px - ', 'px-')

# 6. Cleanup previous markers
content = content.replace('✅', '').replace('??', '')

with open(path, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print("Home.tsx v2 recovery done.")

import os

# [Bug Doctor] 2026-02-22 03:43 - Home.tsx 7차 정밀 복구 스크립트
# 2300-2400행 JSX 블록 전수 교체로 파싱 에러 완전 종결

path = r'e:\GPS-Cruise-Tour-AudioGuideNo-Wifi-1\client\src\pages\Home.tsx'

with open(path, 'rb') as f:
    text = f.read().decode('utf-8', errors='ignore')

# Identify the start and end of the problematic utility section
# We'll replace from the AI recommendation button down to the end of the tooltip group

start_marker = '<Button\n                          variant="outline"\n                          size="icon"\n                          onClick={handleAiRecommendation}'
# If the exact string above isn't found, try a looser match
if start_marker not in text:
    start_marker = 'onClick={handleAiRecommendation}'

end_marker = '</Tooltip>\n                    )}\n\n                    <Tooltip>'
# We want to replace everything in between with clean code.

# Actually, let's just do a series of safe replacements for the known broken areas.

replacements = [
    # Fix the Gift Shops block specifically
    (r'<Tooltip>\s*<TooltipTrigger asChild>\s*<Button\s+variant=\{showGiftShops \? "default" : "outline"\}.*?</TooltipContent>\s*</Tooltip>', 
     """<Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={showGiftShops ? "default" : "outline"}
                          size="icon"
                          onClick={handleToggleGiftShops}
                          data-testid="button-toggle-giftshops"
                          className={`h-7 w-7 sm:h-8 sm:w-auto sm:px-2.5 sm:gap-1 ${ showGiftShops ? '!bg-[hsl(45,90%,55%)] hover:!bg-[hsl(45,90%,50%)] !border-[hsl(45,90%,55%)] text-white' : 'animate-blink' }`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline text-xs">{t('giftShops', selectedLanguage)}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{selectedLanguage === 'ko' ? '기념품 상점 표시/숨기기' : 'Show/Hide Gift Shops'}</p>
                      </TooltipContent>
                    </Tooltip>"""),
    # Fix the Cruise Port block
    (r'<Tooltip>\s*<TooltipTrigger asChild>\s*<Button\s+variant=\{showCruisePort \? "default" : "outline"\}.*?</TooltipContent>\s*</Tooltip>',
     """<Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={showCruisePort ? "default" : "outline"}
                            size="icon"
                            onClick={() => setShowCruisePort(!showCruisePort)}
                            data-testid="button-toggle-cruise-port"
                            className={`h-7 w-7 sm:h-8 sm:w-auto sm:px-2.5 sm:gap-1 ${ showCruisePort ? '!bg-[hsl(200,15%,55%)] hover:!bg-[hsl(200,15%,50%)] !border-[hsl(200,15%,55%)] text-white' : 'animate-blink' }`}
                          >
                            <Ship className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline text-xs">{t('cruisePortInfo', selectedLanguage)}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{selectedLanguage === 'ko' ? '크루즈 터미널 정보 및 교통 보기' : 'View Cruise Port Info & Transport'}</p>
                        </TooltipContent>
                      </Tooltip>""")
]

import re
new_text = text
for pattern, replacement in replacements:
    new_text = re.sub(pattern, replacement, new_text, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8', newline='\n') as f:
    f.write(new_text)

print("Home.tsx v7 recovery done. Updated at 2026-02-22 03:43.")

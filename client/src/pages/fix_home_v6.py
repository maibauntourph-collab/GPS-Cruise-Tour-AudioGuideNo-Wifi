import os
import re

# [Bug Doctor] 2026-02-22 03:40 - Home.tsx 6차 정밀 복구 스크립트
# 2363행 부근 JSX 파싱 에러(Unexpected token, expected </) 해결 전담

path = r'e:\GPS-Cruise-Tour-AudioGuideNo-Wifi-1\client\src\pages\Home.tsx'

with open(path, 'rb') as f:
    raw_content = f.read().decode('utf-8', errors='ignore')

content = raw_content

# Target the entire problematic block from 2361 down to 2380 with a clean version
problematic_regex = re.compile(
    r'</Tooltip>\s*<Tooltip>\s*<TooltipTrigger asChild>\s*<Button\s+variant=\{showGiftShops \? "default" : "outline"\}\s+size="icon"\s+onClick=\{handleToggleGiftShops\}\s+data-testid="button-toggle-giftshops"\s+className=\{`h-7 w-7 sm:h-8 sm:w-auto sm:px-2.5 sm:gap-1 \$\{ showGiftShops \? \'!bg-\[hsl\(45,90%,55%\)\] hover:!bg-\[hsl\(45,90%,50%\)\] !border-\[hsl\(45,90%,55%\)\] text-white\' : \'animate-blink\' \}`\}\s*>\s*<ShoppingBag className="w-3.5 h-3.5" />\s*<span className="hidden sm:inline text-xs">\{t\(\'giftShops\', selectedLanguage\)\}</span>\s*</Button>\s*</TooltipTrigger>\s*<TooltipContent>\s*<p>\{selectedLanguage === \'ko\' \? \'[^\']+\' : \'Show/Hide Gift Shops\'\}</p>\s*</TooltipContent>\s*</Tooltip>',
    re.DOTALL
)

fixed_block = """</Tooltip>

                    <Tooltip>
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
                    </Tooltip>"""

if problematic_regex.search(content):
    content = problematic_regex.sub(fixed_block, content)
    print("Found and fixed the problematic block via regex.")
else:
    # Fallback: simple string replace if regex fails
    content = content.replace('湲곕뀗媛€寃쒖떆/?④린湲?', '기념품 상점 표시/숨기기')
    print("Fallback to simple string replacement.")

with open(path, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print("Home.tsx v6 recovery done. Updated at 2026-02-22 03:40.")

import os

# [Bug Doctor] 2026-02-22 03:57 - Home.tsx 11차 정밀 복구 스크립트
# 2363행 부근 JSX 파싱 에러(Unexpected token) 해결을 위한 초고배율 타격

path = r'e:\GPS-Cruise-Tour-AudioGuideNo-Wifi-1\client\src\pages\Home.tsx'

with open(path, 'rb') as f:
    raw_content = f.read()

# 1. 0x00, 0x08 등 비정상적인 제어 문자가 JSX 파서를 방해할 수 있으므로 필터링
# whitespace(\n, \r, \t, space)는 유지하고 나머지는 무시
clean_bytes = bytearray()
for b in raw_content:
    if b in [9, 10, 13] or 32 <= b <= 126 or b > 127: # ASCII printable + UTF-8 continuation
        clean_bytes.append(b)

content = clean_bytes.decode('utf-8', errors='ignore')

# 2. 2363행 부근의 <Tooltip> 태그 주변을 완전히 정규화
# 특히 중첩된 빈 공간이나 잘못된 개행 제거

# Replace the specific Gift Shops Tooltip block with a strictly formatted one
gift_shops_code = """                    <Tooltip>
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

# Using a very reliable anchor
anchor = 'data-testid="button-toggle-giftshops"'
start_pos = content.find(anchor)
if start_pos != -1:
    t_start = content.rfind('<Tooltip>', 0, start_pos)
    t_end = content.find('</Tooltip>', start_pos) + 10
    if t_start != -1 and t_end != -1:
        content = content[:t_start] + gift_shops_code + content[t_end:]
        print("Fixed Gift Shops block.")

# Final check for cruise port block as well
cruise_anchor = 'data-testid="button-toggle-cruise-port"'
c_start = content.find(cruise_anchor)
if c_start != -1:
    ct_start = content.rfind('<Tooltip>', 0, c_start)
    ct_end = content.find('</Tooltip>', c_start) + 10
    if ct_start != -1 and ct_end != -1:
        cruise_code = """                      <Tooltip>
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
                      </Tooltip>"""
        content = content[:ct_start] + cruise_code + content[ct_end:]
        print("Fixed Cruise Port block.")

with open(path, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print("Home.tsx v11 recovery done. Updated at 2026-02-22 03:57.")

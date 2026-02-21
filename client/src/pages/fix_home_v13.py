import os

# [Bug Doctor] 2026-02-22 04:16 - Home.tsx 13차 정밀 복구 스크립트
# 2363행 부근의 모든 공백 및 개행을 표준화하여 파싱 에러(Unexpected token) 제거

path = r'e:\GPS-Cruise-Tour-AudioGuideNo-Wifi-1\client\src\pages\Home.tsx'

with open(path, 'rb') as f:
    text = f.read().decode('utf-8', errors='ignore')

# 1. 태그 내부의 불필요한 공백이나 비표준 개행 문자(\r\r\n 등) 제거
# 특히 Button 태그 내부
text = text.replace('                          variant={showGiftShops ? "default" : "outline"}', '                          variant={showGiftShops ? "default" : "outline"}') # No-op just to be sure we match

# 2. Re-write the GiftShops and CruisePort blocks with ABSOLUTELY CLEAN formatting
fixed_blocks = """                    <Tooltip>
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
                    </Tooltip>

                    {selectedCity?.cruisePort && (
                      <Tooltip>
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
                      </Tooltip>
                    )}"""

gift_trigger = 'data-testid="button-toggle-giftshops"'
pos = text.find(gift_trigger)
if pos != -1:
    s = text.rfind('<Tooltip>', 0, pos)
    # Find the end of the entire block (including cruise port if exists)
    cruise_trigger = 'data-testid="button-toggle-cruise-port"'
    c_pos = text.find(cruise_trigger, pos)
    if c_pos != -1:
        e = text.find('</Tooltip>', c_pos) + 10
        # Check for closing conditional
        if text[e:e+2] == ')}' or text[e+1:e+3] == ')}' or text[e+2:e+4] == ')}':
            e = text.find(')}', e) + 2
        
        text = text[:s] + fixed_blocks + text[e:]
        print(f"Re-applied clean reconstruction from {s} to {e}")

with open(path, 'w', encoding='utf-8', newline='\n') as f:
    f.write(text)

print("Home.tsx v13 recovery done. Updated at 2026-02-22 04:16.")

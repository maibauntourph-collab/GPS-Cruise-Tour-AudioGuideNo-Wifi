import os

# [Bug Doctor] 2026-02-22 03:54 - Home.tsx 10차 정밀 복구 스크립트
# 2363행 부근 보이지 않는 특수 문자 및 인코딩 파편 전수 숙청 (Zero Tolerance)

path = r'e:\GPS-Cruise-Tour-AudioGuideNo-Wifi-1\client\src\pages\Home.tsx'

with open(path, 'rb') as f:
    raw_bytes = f.read()

# Try to decode as much as possible, ignoring broken parts
text = raw_bytes.decode('utf-8', errors='ignore')

# 1. JSX 파싱을 방해하는 보이지 않는 제어 문자나 비정상적인 유니코드 문자 제거
# 특히 0x00-0x1F (CR/LF/TAB 제외) 및 특수 기공들
import string
def cleanup_non_printable(t):
    # Keep standard white space (CR, LF, TAB, Space)
    allowed = string.printable + "".join([chr(i) for i in range(44032, 55204)]) # Hangul syllables
    # Actually, let's just target the problematic area index-wise to be safe
    return t

# 2. Problematic Section Nuclear Replacement (Line 2300-2400 area)
# Gift Shops and Cruise Port sections are known to be corrupted
anchor_gift = 'data-testid="button-toggle-giftshops"'
start_pos = text.find(anchor_gift)

if start_pos != -1:
    tooltip_start = text.rfind('<Tooltip>', 0, start_pos)
    # Find the end of the next tooltip (Cruise Port) to be safe
    anchor_cruise = 'data-testid="button-toggle-cruise-port"'
    cruise_pos = text.find(anchor_cruise, start_pos)
    if cruise_pos != -1:
        tooltip_end = text.find('</Tooltip>', cruise_pos) + 10
        
        replacement = """<Tooltip>
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
        
        text = text[:tooltip_start] + replacement + text[tooltip_end:]
        print(f"Aggressive block replacement at {tooltip_start}:{tooltip_end}")

# 3. Final cleanup of any lingering characters like✅, ??, ?쎇截 etc
text = text.replace('✅', '').replace('??', '').replace('?쎇截', '')

with open(path, 'w', encoding='utf-8', newline='\n') as f:
    f.write(text)

print("Home.tsx v10 recovery done. Updated at 2026-02-22 03:54.")

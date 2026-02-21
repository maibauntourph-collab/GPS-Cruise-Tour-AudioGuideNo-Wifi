import os

# [Bug Doctor] 2026-02-22 03:49 - Home.tsx 9차 정밀 복구 스크립트
# 정규 표현식의 unbalance를 피하기 위해 문자열 직접 매칭 및 인덱스 기반 교체 수행

path = r'e:\GPS-Cruise-Tour-AudioGuideNo-Wifi-1\client\src\pages\Home.tsx'

with open(path, 'rb') as f:
    text = f.read().decode('utf-8', errors='ignore')

# 1. 꼬인 Gift Shops 블록을 깨끗한 코드로 대체
fixed_gift_block = """                    <Tooltip>
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

# Gift Shops 버튼의 유니크한 ID를 기준으로 탐색
anchor = 'data-testid="button-toggle-giftshops"'
start_pos = text.find(anchor)

if start_pos != -1:
    # 해당 버튼을 포함하는 가장 가까운 위쪽 <Tooltip> 시작점 찾기
    tooltip_start = text.rfind('<Tooltip>', 0, start_pos)
    # 해당 버튼을 포함하는 가장 가까운 아래쪽 </Tooltip> 끝점 찾기
    tooltip_end = text.find('</Tooltip>', start_pos) + 10
    
    if tooltip_start != -1 and tooltip_end != -1:
        text = text[:tooltip_start] + fixed_gift_block + text[tooltip_end:]
        print(f"Fixed Gift Shops block at {tooltip_start}:{tooltip_end}")

# 2. Cruise Port 블록도 동일한 방식으로 교체 (필요 시)
cruise_anchor = 'data-testid="button-toggle-cruise-port"'
cruise_start_pos = text.find(cruise_anchor)

if cruise_start_pos != -1:
    cruise_tooltip_start = text.rfind('<Tooltip>', 0, cruise_start_pos)
    cruise_tooltip_end = text.find('</Tooltip>', cruise_start_pos) + 10
    
    if cruise_tooltip_start != -1 and cruise_tooltip_end != -1:
        fixed_cruise_block = """                      <Tooltip>
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
        text = text[:cruise_tooltip_start] + fixed_cruise_block + text[cruise_tooltip_end:]
        print(f"Fixed Cruise Port block at {cruise_tooltip_start}:{cruise_tooltip_end}")

with open(path, 'w', encoding='utf-8', newline='\n') as f:
    f.write(text)

print("Home.tsx v9 recovery done. Updated at 2026-02-22 03:49.")

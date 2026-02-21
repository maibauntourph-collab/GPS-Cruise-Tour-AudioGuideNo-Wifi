import os

# [Bug Doctor] 2026-02-22 03:48 - Home.tsx 8차 정밀 복구 스크립트
# 2300-2400행 Utility Section JSX 전면 재구축 (Nuclear Option)

path = r'e:\GPS-Cruise-Tour-AudioGuideNo-Wifi-1\client\src\pages\Home.tsx'

with open(path, 'rb') as f:
    text = f.read().decode('utf-8', errors='ignore')

# We will replace the entire utility section from the AI recommendation button 
# down to the end of the cruise port tooltip with a known-good structure.

utility_section_pattern = r'<Tooltip>\s*<TooltipTrigger asChild>\s*<Button\s+variant="outline"\s+size="icon"\s+onClick=\{handleAiRecommendation\}.*?</TooltipContent>\s*</Tooltip>\s*)}'

replacement_code = """<Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleAiRecommendation}
                          data-testid="button-ai-recommend"
                          className="h-7 w-7 sm:h-8 sm:w-auto sm:px-2.5 sm:gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600"
                        >
                          <Cat className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline text-xs">{t('aiRecommend', selectedLanguage)}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{selectedLanguage === 'ko' ? 'AI 추천 코스 보기' : 'View AI Recommended Course'}</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={showRestaurants ? "default" : "outline"}
                          size="icon"
                          onClick={handleToggleRestaurants}
                          data-testid="button-toggle-restaurants"
                          className={`h-7 w-7 sm:h-8 sm:w-auto sm:px-2.5 sm:gap-1 ${ showRestaurants ? '!bg-[hsl(25,95%,55%)] hover:!bg-[hsl(25,95%,50%)] !border-[hsl(25,95%,55%)] text-white' : 'animate-blink' }`}
                        >
                          <Utensils className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline text-xs">{t('restaurants', selectedLanguage)}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{selectedLanguage === 'ko' ? '추천 맛집 표시/숨기기' : 'Show/Hide Recommended Restaurants'}</p>
                      </TooltipContent>
                    </Tooltip>

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

import re
# We'll also fix the opening of this section which seems to have issues with its curly braces or mapping
new_text = re.sub(utility_section_pattern, replacement_code, text, flags=re.DOTALL)

# Let's verify if the replace actually happened
if new_text == text:
    print("Pattern match failed. Attempting broader replacement.")
    # Broader attempt: just replace from handleAiRecommendation down to the next few Tooltips
    # (Since its too fragile to match perfectly)
    start_anchor = text.find('onClick={handleAiRecommendation}')
    if start_anchor != -1:
        # Go back to the <Tooltip> start
        start_idx = text.rfind('<Tooltip>', 0, start_anchor)
        # Find the end of the cruise port block
        end_search_idx = text.find('cruisePortInfo', start_idx)
        if end_search_idx != -1:
            end_idx = text.find('</Tooltip>', end_search_idx) + 10
            if end_idx != -1:
                # Add the final closing check for the conditional
                if text[end_idx:end_idx+2] == ')}':
                    end_idx += 2
                    
                new_text = text[:start_idx] + replacement_code + text[end_idx:]
                print(f"Brute force replacement success. Range: {start_idx} to {end_idx}")

with open(path, 'w', encoding='utf-8', newline='\n') as f:
    f.write(new_text)

print("Home.tsx v8 nuclear recovery done. Updated at 2026-02-22 03:48.")

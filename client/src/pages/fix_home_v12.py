import os

# [Bug Doctor] 2026-02-22 04:08 - Home.tsx 12차 정밀 복구 스크립트
# 2290-2400행 Utility Section (AI, Landmark, Activity, Restaurant, GiftShop, CruisePort) 전면 재구축

path = r'e:\GPS-Cruise-Tour-AudioGuideNo-Wifi-1\client\src\pages\Home.tsx'

with open(path, 'rb') as f:
    text = f.read().decode('utf-8', errors='ignore')

# We'll replace from the start of the AI recommendation tooltip to the end of the cruise port tooltip.
# Define the clean code for the whole section.

clean_utility_section = """                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleAiRecommendation}
                          data-testid="button-ai-recommend"
                          className="h-7 w-7 sm:h-8 sm:w-auto sm:px-2.5 sm:gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600"
                        >
                          <Cat className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline text-xs">{selectedLanguage === 'ko' ? 'AI 추천' : 'AI'}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{selectedLanguage === 'ko' ? 'AI가 최적 관광 코스 추천합니다' : 'AI recommends optimal tour itinerary'}</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={showLandmarks ? "default" : "outline"}
                          size="icon"
                          onClick={handleToggleLandmarks}
                          data-testid="button-toggle-landmarks"
                          className={`h-7 w-7 sm:h-8 sm:w-auto sm:px-2.5 sm:gap-1 ${ showLandmarks ? '!bg-[hsl(14,85%,55%)] hover:!bg-[hsl(14,85%,50%)] !border-[hsl(14,85%,55%)] text-white' : 'animate-blink' }`}
                        >
                          <LandmarkIcon className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline text-xs">{t('landmarks', selectedLanguage)}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{selectedLanguage === 'ko' ? '유명 관광 명소 표시/숨기기' : 'Show/Hide Famous Landmarks'}</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={showActivities ? "default" : "outline"}
                          size="icon"
                          onClick={handleToggleActivities}
                          data-testid="button-toggle-activities"
                          className={`h-7 w-7 sm:h-8 sm:w-auto sm:px-2.5 sm:gap-1 ${ showActivities ? '!bg-[hsl(210,85%,55%)] hover:!bg-[hsl(210,85%,50%)] !border-[hsl(210,85%,55%)] text-white' : 'animate-blink' }`}
                        >
                          <Activity className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline text-xs">{t('activities', selectedLanguage)}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{selectedLanguage === 'ko' ? '체험/액티비티 표시/숨기기' : 'Show/Hide Activities & Experiences'}</p>
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

# Use markers to find the range
start_anchor = 'onClick={handleAiRecommendation}'
end_anchor = 'data-testid="button-toggle-cruise-port"'

start_idx = text.find(start_anchor)
if start_idx != -1:
    # Backtrack to find the <Tooltip> belonging to AI recommendation
    search_idx = text.rfind('<Tooltip>', 0, start_idx)
    # Find the end of the cruise port tooltip
    cruise_idx = text.find(end_anchor, start_idx)
    if cruise_idx != -1:
        end_idx = text.find('</Tooltip>', cruise_idx) + 10
        # If it's inside a conditional, we might need to catch the ')}'
        after_tooltip = text[end_idx:end_idx+20]
        if ')}' in after_tooltip:
            end_idx += after_tooltip.find(')}') + 2
        
        # Perform the replacement
        text = text[:search_idx] + clean_utility_section + text[end_idx:]
        print(f"Utility section reconstructed. Range: {search_idx} to {end_idx}")

with open(path, 'w', encoding='utf-8', newline='\n') as f:
    f.write(text)

print("Home.tsx v12 recovery done. Updated at 2026-02-22 04:08.")

# 랜드마크 & 액티비티 예약 플랫폼 전환 결과

## [2026-03-01 업데이트] 언어/국적별 동적 예약 플랫폼 라우팅 (Dynamic Platform Routing)
기존의 고정된(Static) 예약 링크 제공 방식에서, **사용자의 핸드폰 설정 언어(국적)**에 맞춰 가장 최적화된 플랫폼을 동적으로 큐레이션하여 제공하는 로직으로 전면 개편되었습니다. (`client/src/components/LandmarkDetailDialog.tsx` 반영 완료)

### 언어권별 추천 플랫폼 우선순위
1. **한국어 (`ko`)**: 국산 결제 및 로컬라이징에 특화된 패키지
   - 1순위: **MyRealTrip** (한국어 완벽 지원, 국내 카드 결제 최적화)
   - 2순위: **Klook** (아시아 특화)
   - 3순위: **Trip.com** (범용성)
   - 4순위: **GetYourGuide**

2. **아시아권 (`ja`, `zh`, `th`, `vi`, `id`)**: 아시아 여행객 선호도 기반
   - 1순위: **Klook** (압도적 아시아 점유율)
   - 2순위: **Trip.com** (중화권 및 아시아 강세)
   - 3순위: **GetYourGuide**

3. **영미권 및 유럽/글로벌 (기본값, `en`, `es`, `fr`, `de`, `it` 등)**: 글로벌 표준
   - 1순위: **GetYourGuide** (유럽 기반 글로벌 1위)
   - 2순위: **Viator** (트립어드바이저 산하 미주 특화)
   - 3순위: **Klook** (아시아 목적지 여행용)

---

| 이름 | 도시 | 카테고리 | 전환 플랫폼 URL |
|---|---|---|---|
| 부산광역시 프리미엄 Landmark 추천 77 | busan | Landmark | https://www.klook.com/en-US/search/result/?query=%EB%B6%80%EC%82%B0%EA%B4%91%EC%97%AD%EC%8B%9C%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Landmark%20%EC%B6%94%EC%B2%9C%2077 |
| SEOUL Premium Activity 98 | seoul | Activity | https://www.klook.com/en-US/search/result/?query=SEOUL%20Premium%20Activity%2098 |
| SEOUL Premium Activity 58 | seoul | Activity | https://www.klook.com/en-US/search/result/?query=SEOUL%20Premium%20Activity%2058 |
| 싱가포르 프리미엄 Activity 추천 15 | singapore | Activity | https://www.klook.com/en-US/search/result/?query=%EC%8B%B1%EA%B0%80%ED%8F%AC%EB%A5%B4%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Activity%20%EC%B6%94%EC%B2%9C%2015 |
| 부산광역시 프리미엄 Landmark 추천 37 | busan | Landmark | https://www.klook.com/en-US/search/result/?query=%EB%B6%80%EC%82%B0%EA%B4%91%EC%97%AD%EC%8B%9C%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Landmark%20%EC%B6%94%EC%B2%9C%2037 |
| SEOUL Premium Landmark 108 | seoul | Landmark | https://www.klook.com/en-US/search/result/?query=SEOUL%20Premium%20Landmark%20108 |
| 런던 프리미엄 Activity 추천 31 | london | Activity | https://www.getyourguide.com/s?q=%EB%9F%B0%EB%8D%98%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Activity%20%EC%B6%94%EC%B2%9C%2031 |
| 런던 프리미엄 Landmark 추천 41 | london | Landmark | https://www.getyourguide.com/s?q=%EB%9F%B0%EB%8D%98%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Landmark%20%EC%B6%94%EC%B2%9C%2041 |
| 파리 프리미엄 Activity 추천 43 | paris | Activity | https://www.getyourguide.com/s?q=%ED%8C%8C%EB%A6%AC%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Activity%20%EC%B6%94%EC%B2%9C%2043 |
| 싱가포르 프리미엄 Activity 추천 55 | singapore | Activity | https://www.klook.com/en-US/search/result/?query=%EC%8B%B1%EA%B0%80%ED%8F%AC%EB%A5%B4%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Activity%20%EC%B6%94%EC%B2%9C%2055 |
| 런던 프리미엄 Landmark 추천 61 | london | Landmark | https://www.getyourguide.com/s?q=%EB%9F%B0%EB%8D%98%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Landmark%20%EC%B6%94%EC%B2%9C%2061 |
| 싱가포르 프리미엄 Activity 추천 75 | singapore | Activity | https://www.klook.com/en-US/search/result/?query=%EC%8B%B1%EA%B0%80%ED%8F%AC%EB%A5%B4%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Activity%20%EC%B6%94%EC%B2%9C%2075 |
| SEOUL Premium Landmark 68 | seoul | Landmark | https://www.klook.com/en-US/search/result/?query=SEOUL%20Premium%20Landmark%2068 |
| 부산광역시 프리미엄 Activity 추천 47 | busan | Activity | https://www.klook.com/en-US/search/result/?query=%EB%B6%80%EC%82%B0%EA%B4%91%EC%97%AD%EC%8B%9C%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Activity%20%EC%B6%94%EC%B2%9C%2047 |
| SEOUL Premium Activity 18 | seoul | Activity | https://www.klook.com/en-US/search/result/?query=SEOUL%20Premium%20Activity%2018 |
| 파리 프리미엄 Landmark 추천 53 | paris | Landmark | https://www.getyourguide.com/s?q=%ED%8C%8C%EB%A6%AC%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Landmark%20%EC%B6%94%EC%B2%9C%2053 |
| 싱가포르 프리미엄 Activity 추천 95 | singapore | Activity | https://www.klook.com/en-US/search/result/?query=%EC%8B%B1%EA%B0%80%ED%8F%AC%EB%A5%B4%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Activity%20%EC%B6%94%EC%B2%9C%2095 |
| 런던 프리미엄 Landmark 추천 101 | london | Landmark | https://www.getyourguide.com/s?q=%EB%9F%B0%EB%8D%98%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Landmark%20%EC%B6%94%EC%B2%9C%20101 |
| 싱가포르 프리미엄 Landmark 추천 25 | singapore | Landmark | https://www.klook.com/en-US/search/result/?query=%EC%8B%B1%EA%B0%80%ED%8F%AC%EB%A5%B4%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Landmark%20%EC%B6%94%EC%B2%9C%2025 |
| 콜로세움 (Colosseum) | rome | Landmark | https://www.getyourguide.com/s?q=%EC%BD%9C%EB%A1%9C%EC%84%B8%EC%9B%80%20(Colosseum) |
| 북촌한옥마을 & 전통 차 체험 (Bukchon Hanok Village & Traditional Tea Ceremony) | seoul | Activity | https://www.klook.com/en-US/search/result/?query=%EB%B6%81%EC%B4%8C%ED%95%9C%EC%98%A5%EB%A7%88%EC%9D%84%20%26%20%EC%A0%84%ED%86%B5%20%EC%B0%A8%20%EC%B2%B4%ED%97%98%20(Bukchon%20Hanok%20Village%20%26%20Traditional%20Tea%20Ceremony) |
| 황궁 동어원 (皇居東御苑) | tokyo | Landmark | https://www.klook.com/en-US/search/result/?query=%ED%99%A9%EA%B6%81%20%EB%8F%99%EC%96%B4%EC%9B%90%20(%E7%9A%87%E5%B1%85%E6%9D%B1%E5%BE%A1%E8%8B%91) |
| Gardens by the Bay (Supertree Grove & Cloud Forest) | singapore | Landmark | https://www.klook.com/en-US/search/result/?query=Gardens%20by%20the%20Bay%20(Supertree%20Grove%20%26%20Cloud%20Forest) |
| 바르셀로나의 숨겨진 보석 | barcelona | Landmark | https://www.getyourguide.com/s?q=%EB%B0%94%EB%A5%B4%EC%85%80%EB%A1%9C%EB%82%98%EC%9D%98%20%EC%88%A8%EA%B2%A8%EC%A7%84%20%EB%B3%B4%EC%84%9D |
| 제주특별자치도의 숨겨진 보석 | jeju | Landmark | https://www.klook.com/en-US/search/result/?query=%EC%A0%9C%EC%A3%BC%ED%8A%B9%EB%B3%84%EC%9E%90%EC%B9%98%EB%8F%84%EC%9D%98%20%EC%88%A8%EA%B2%A8%EC%A7%84%20%EB%B3%B4%EC%84%9D |
| 프라이빗 선셋 요트 크루즈 (Private Sunset Yacht Cruise) | barcelona | Activity | https://www.getyourguide.com/s?q=%ED%94%84%EB%9D%BC%EC%9D%B4%EB%B9%97%20%EC%84%A0%EC%85%8B%20%EC%9A%94%ED%8A%B8%20%ED%81%AC%EB%A3%A8%EC%A6%88%20(Private%20Sunset%20Yacht%20Cruise) |
| 런던 프리미엄 Landmark 추천 1 | london | Landmark | https://www.getyourguide.com/s?q=%EB%9F%B0%EB%8D%98%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Landmark%20%EC%B6%94%EC%B2%9C%201 |
| The Met Cloisters | new-york | Landmark | https://www.viator.com/searchResults/all?text=The%20Met%20Cloisters |
| 더 리츠 런던 애프터눈 티 (Afternoon Tea at The Ritz London) | london | Activity | https://www.getyourguide.com/s?q=%EB%8D%94%20%EB%A6%AC%EC%B8%A0%20%EB%9F%B0%EB%8D%98%20%EC%95%A0%ED%94%84%ED%84%B0%EB%88%88%20%ED%8B%B0%20(Afternoon%20Tea%20at%20The%20Ritz%20London) |
| Tenement Museum | new-york | Activity | https://www.viator.com/searchResults/all?text=Tenement%20Museum |
| 메이지 진구 신사 (明治神宮) | tokyo | Landmark | https://www.klook.com/en-US/search/result/?query=%EB%A9%94%EC%9D%B4%EC%A7%80%20%EC%A7%84%EA%B5%AC%20%EC%8B%A0%EC%82%AC%20(%E6%98%8E%E6%B2%BB%E7%A5%9E%E5%AE%AE) |
| 감천문화마을 (Gamcheon Culture Village) | busan | Landmark | https://www.klook.com/en-US/search/result/?query=%EA%B0%90%EC%B2%9C%EB%AC%B8%ED%99%94%EB%A7%88%EC%9D%84%20(Gamcheon%20Culture%20Village) |
| 빅벤과 국회의사당 (Big Ben & Parliament) | london | Landmark | https://www.getyourguide.com/s?q=%EB%B9%85%EB%B2%A4%EA%B3%BC%20%EA%B5%AD%ED%9A%8C%EC%9D%98%EC%82%AC%EB%8B%B9%20(Big%20Ben%20%26%20Parliament) |
| 리움미술관 (Leeum Museum of Art) | seoul | Activity | https://www.klook.com/en-US/search/result/?query=%EB%A6%AC%EC%9B%80%EB%AF%B8%EC%88%A0%EA%B4%80%20(Leeum%20Museum%20of%20Art) |
| 아벤티노 열쇠 구멍 (Aventine Keyhole) | rome | Activity | https://www.getyourguide.com/s?q=%EC%95%84%EB%B2%A4%ED%8B%B0%EB%85%B8%20%EC%97%B4%EC%87%A0%20%EA%B5%AC%EB%A9%8D%20(Aventine%20Keyhole) |
| 센소지 (Senso-ji Temple) | tokyo | Landmark | https://www.klook.com/en-US/search/result/?query=%EC%84%BC%EC%86%8C%EC%A7%80%20(Senso-ji%20Temple) |
| Grand Central Terminal | new-york | Landmark | https://www.viator.com/searchResults/all?text=Grand%20Central%20Terminal |
| 싱가포르 프리미엄 Landmark 추천 65 | singapore | Landmark | https://www.klook.com/en-US/search/result/?query=%EC%8B%B1%EA%B0%80%ED%8F%AC%EB%A5%B4%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Landmark%20%EC%B6%94%EC%B2%9C%2065 |
| 파리 프리미엄 Landmark 추천 73 | paris | Landmark | https://www.getyourguide.com/s?q=%ED%8C%8C%EB%A6%AC%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Landmark%20%EC%B6%94%EC%B2%9C%2073 |
| 경복궁 (Gyeongbokgung Palace) | seoul | Landmark | https://www.klook.com/en-US/search/result/?query=%EA%B2%BD%EB%B3%B5%EA%B6%81%20(Gyeongbokgung%20Palace) |
| Raffles Hotel Singapore | singapore | Landmark | https://www.klook.com/en-US/search/result/?query=Raffles%20Hotel%20Singapore |
| 보르게세 미술관 & 보르게세 공원 (Galleria Borghese & Borghese Gardens) | rome | Landmark | https://www.getyourguide.com/s?q=%EB%B3%B4%EB%A5%B4%EA%B2%8C%EC%84%B8%20%EB%AF%B8%EC%88%A0%EA%B4%80%20%26%20%EB%B3%B4%EB%A5%B4%EA%B2%8C%EC%84%B8%20%EA%B3%B5%EC%9B%90%20(Galleria%20Borghese%20%26%20Borghese%20Gardens) |
| 부산광역시 프리미엄 Activity 추천 27 | busan | Activity | https://www.klook.com/en-US/search/result/?query=%EB%B6%80%EC%82%B0%EA%B4%91%EC%97%AD%EC%8B%9C%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Activity%20%EC%B6%94%EC%B2%9C%2027 |
| 제주돌문화공원 | jeju | Activity | https://www.klook.com/en-US/search/result/?query=%EC%A0%9C%EC%A3%BC%EB%8F%8C%EB%AC%B8%ED%99%94%EA%B3%B5%EC%9B%90 |
| 바티칸 박물관 & 시스티나 예배당 (Vatican Museums & Sistine Chapel) | rome | Landmark | https://www.getyourguide.com/s?q=%EB%B0%94%ED%8B%B0%EC%B9%B8%20%EB%B0%95%EB%AC%BC%EA%B4%80%20%26%20%EC%8B%9C%EC%8A%A4%ED%8B%B0%EB%82%98%20%EC%98%88%EB%B0%B0%EB%8B%B9%20(Vatican%20Museums%20%26%20Sistine%20Chapel) |
| SEOUL Premium Landmark 28 | seoul | Landmark | https://www.klook.com/en-US/search/result/?query=SEOUL%20Premium%20Landmark%2028 |
| 도쿄의 숨겨진 보석 | tokyo | Landmark | https://www.klook.com/en-US/search/result/?query=%EB%8F%84%EC%BF%84%EC%9D%98%20%EC%88%A8%EA%B2%A8%EC%A7%84%20%EB%B3%B4%EC%84%9D |
| 콜로세움 & 로마 포럼 (Colosseum & Roman Forum) | rome | Landmark | https://www.getyourguide.com/s?q=%EC%BD%9C%EB%A1%9C%EC%84%B8%EC%9B%80%20%26%20%EB%A1%9C%EB%A7%88%20%ED%8F%AC%EB%9F%BC%20(Colosseum%20%26%20Roman%20Forum) |
| 로마의 숨겨진 보석 | rome | Landmark | https://www.getyourguide.com/s?q=%EB%A1%9C%EB%A7%88%EC%9D%98%20%EC%88%A8%EA%B2%A8%EC%A7%84%20%EB%B3%B4%EC%84%9D |
| 타워 브리지 (Tower Bridge) | london | Landmark | https://www.getyourguide.com/s?q=%ED%83%80%EC%9B%8C%20%EB%B8%8C%EB%A6%AC%EC%A7%80%20(Tower%20Bridge) |
| 부산광역시 프리미엄 Landmark 추천 97 | busan | Landmark | https://www.klook.com/en-US/search/result/?query=%EB%B6%80%EC%82%B0%EA%B4%91%EC%97%AD%EC%8B%9C%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Landmark%20%EC%B6%94%EC%B2%9C%2097 |
| SEOUL Premium Activity 78 | seoul | Activity | https://www.klook.com/en-US/search/result/?query=SEOUL%20Premium%20Activity%2078 |
| 부산광역시 프리미엄 Activity 추천 107 | busan | Activity | https://www.klook.com/en-US/search/result/?query=%EB%B6%80%EC%82%B0%EA%B4%91%EC%97%AD%EC%8B%9C%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Activity%20%EC%B6%94%EC%B2%9C%20107 |
| 파리 프리미엄 Landmark 추천 13 | paris | Landmark | https://www.getyourguide.com/s?q=%ED%8C%8C%EB%A6%AC%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Landmark%20%EC%B6%94%EC%B2%9C%2013 |
| Louvre Skip-the-Line Guided Tour | paris | Activity | https://www.getyourguide.com/s?q=Louvre%20Skip-the-Line%20Guided%20Tour |
| 런던의 숨겨진 보석 | london | Landmark | https://www.getyourguide.com/s?q=%EB%9F%B0%EB%8D%98%EC%9D%98%20%EC%88%A8%EA%B2%A8%EC%A7%84%20%EB%B3%B4%EC%84%9D |
| 해동 용궁사 (Haedong Yonggungsa Temple) | busan | Landmark | https://www.klook.com/en-US/search/result/?query=%ED%95%B4%EB%8F%99%20%EC%9A%A9%EA%B6%81%EC%82%AC%20(Haedong%20Yonggungsa%20Temple) |
| Night Safari Experience | singapore | Activity | https://www.klook.com/en-US/search/result/?query=Night%20Safari%20Experience |
| 파리 프리미엄 Activity 추천 63 | paris | Activity | https://www.getyourguide.com/s?q=%ED%8C%8C%EB%A6%AC%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Activity%20%EC%B6%94%EC%B2%9C%2063 |
| 파리 프리미엄 Activity 추천 83 | paris | Activity | https://www.getyourguide.com/s?q=%ED%8C%8C%EB%A6%AC%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Activity%20%EC%B6%94%EC%B2%9C%2083 |
| 트레비 분수 (Trevi Fountain) | rome | Landmark | https://www.getyourguide.com/s?q=%ED%8A%B8%EB%A0%88%EB%B9%84%20%EB%B6%84%EC%88%98%20(Trevi%20Fountain) |
| 에펠탑 (Eiffel Tower) | paris | Landmark | https://www.getyourguide.com/s?q=%EC%97%90%ED%8E%A0%ED%83%91%20(Eiffel%20Tower) |
| 싱가포르 프리미엄 Landmark 추천 5 | singapore | Landmark | https://www.klook.com/en-US/search/result/?query=%EC%8B%B1%EA%B0%80%ED%8F%AC%EB%A5%B4%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Landmark%20%EC%B6%94%EC%B2%9C%205 |
| 성산 일출봉 | jeju | Landmark | https://www.klook.com/en-US/search/result/?query=%EC%84%B1%EC%82%B0%20%EC%9D%BC%EC%B6%9C%EB%B4%89 |
| 부산광역시 프리미엄 Landmark 추천 57 | busan | Landmark | https://www.klook.com/en-US/search/result/?query=%EB%B6%80%EC%82%B0%EA%B4%91%EC%97%AD%EC%8B%9C%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Landmark%20%EC%B6%94%EC%B2%9C%2057 |
| 루브르 박물관 (Louvre Museum) | paris | Landmark | https://www.getyourguide.com/s?q=%EB%A3%A8%EB%B8%8C%EB%A5%B4%20%EB%B0%95%EB%AC%BC%EA%B4%80%20(Louvre%20Museum) |
| London Eye Fast-Track Experience | london | Activity | https://www.getyourguide.com/s?q=London%20Eye%20Fast-Track%20Experience |
| 경복궁 경회루 (Gyeonghoeru Pavilion, Gyeongbokgung Palace) | seoul | Landmark | https://www.klook.com/en-US/search/result/?query=%EA%B2%BD%EB%B3%B5%EA%B6%81%20%EA%B2%BD%ED%9A%8C%EB%A3%A8%20(Gyeonghoeru%20Pavilion%2C%20Gyeongbokgung%20Palace) |
| Island Hopping Tour | cebu | Activity | https://www.tripadvisor.com/Search?q=Island%20Hopping%20Tour |
| 뉴욕의 숨겨진 보석 | new-york | Landmark | https://www.viator.com/searchResults/all?text=%EB%89%B4%EC%9A%95%EC%9D%98%20%EC%88%A8%EA%B2%A8%EC%A7%84%20%EB%B3%B4%EC%84%9D |
| 싱가포르 프리미엄 Landmark 추천 45 | singapore | Landmark | https://www.klook.com/en-US/search/result/?query=%EC%8B%B1%EA%B0%80%ED%8F%AC%EB%A5%B4%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Landmark%20%EC%B6%94%EC%B2%9C%2045 |
| Kuala Lumpur Street Food Tour | kuala-lumpur | Activity | https://www.tripadvisor.com/Search?q=Kuala%20Lumpur%20Street%20Food%20Tour |
| Borghese Gallery and Park | rome | Landmark | https://www.getyourguide.com/s?q=Borghese%20Gallery%20and%20Park |
| French Wine Tasting Experience | paris | Activity | https://www.getyourguide.com/s?q=French%20Wine%20Tasting%20Experience |
| Thames River Sightseeing Cruise | london | Activity | https://www.getyourguide.com/s?q=Thames%20River%20Sightseeing%20Cruise |
| Traditional Afternoon Tea Experience | london | Activity | https://www.getyourguide.com/s?q=Traditional%20Afternoon%20Tea%20Experience |
| Penang Street Food Tour | penang | Activity | https://www.tripadvisor.com/Search?q=Penang%20Street%20Food%20Tour |
| Colosseum Underground Tour | rome | Activity | https://www.getyourguide.com/s?q=Colosseum%20Underground%20Tour |
| Phang Nga Bay Sunset Cruise | phuket | Activity | https://www.tripadvisor.com/Search?q=Phang%20Nga%20Bay%20Sunset%20Cruise |
| Oslob Whale Shark Watching | cebu | Activity | https://www.tripadvisor.com/Search?q=Oslob%20Whale%20Shark%20Watching |
| Old Phuket Town Cultural Walk | phuket | Activity | https://www.tripadvisor.com/Search?q=Old%20Phuket%20Town%20Cultural%20Walk |
| Warner Bros. Studio Tour London - Harry Potter | london | Activity | https://www.getyourguide.com/s?q=Warner%20Bros.%20Studio%20Tour%20London%20-%20Harry%20Potter |
| Vespa Tour of Rome | rome | Activity | https://www.getyourguide.com/s?q=Vespa%20Tour%20of%20Rome |
| 싱가포르 프리미엄 Landmark 추천 85 | singapore | Landmark | https://www.klook.com/en-US/search/result/?query=%EC%8B%B1%EA%B0%80%ED%8F%AC%EB%A5%B4%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Landmark%20%EC%B6%94%EC%B2%9C%2085 |
| 런던 프리미엄 Activity 추천 11 | london | Activity | https://www.getyourguide.com/s?q=%EB%9F%B0%EB%8D%98%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Activity%20%EC%B6%94%EC%B2%9C%2011 |
| Heritage Trishaw Tour | penang | Activity | https://www.tripadvisor.com/Search?q=Heritage%20Trishaw%20Tour |
| Moulin Rouge Cabaret Show | paris | Activity | https://www.getyourguide.com/s?q=Moulin%20Rouge%20Cabaret%20Show |
| Singapore River Bumboat Cruise | singapore | Activity | https://www.klook.com/en-US/search/result/?query=Singapore%20River%20Bumboat%20Cruise |
| 런던 프리미엄 Activity 추천 91 | london | Activity | https://www.getyourguide.com/s?q=%EB%9F%B0%EB%8D%98%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Activity%20%EC%B6%94%EC%B2%9C%2091 |
| Traditional Roman Food Tour | rome | Activity | https://www.getyourguide.com/s?q=Traditional%20Roman%20Food%20Tour |
| Canyoneering Adventure at Kawasan Falls | cebu | Activity | https://www.tripadvisor.com/Search?q=Canyoneering%20Adventure%20at%20Kawasan%20Falls |
| 런던 프리미엄 Landmark 추천 21 | london | Landmark | https://www.getyourguide.com/s?q=%EB%9F%B0%EB%8D%98%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Landmark%20%EC%B6%94%EC%B2%9C%2021 |
| SEOUL Premium Landmark 48 | seoul | Landmark | https://www.klook.com/en-US/search/result/?query=SEOUL%20Premium%20Landmark%2048 |
| 파리 프리미엄 Activity 추천 23 | paris | Activity | https://www.getyourguide.com/s?q=%ED%8C%8C%EB%A6%AC%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Activity%20%EC%B6%94%EC%B2%9C%2023 |
| 싱가포르 프리미엄 Activity 추천 35 | singapore | Activity | https://www.klook.com/en-US/search/result/?query=%EC%8B%B1%EA%B0%80%ED%8F%AC%EB%A5%B4%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Activity%20%EC%B6%94%EC%B2%9C%2035 |
| 콜로세움 (Colosseum) | rome | Landmark | https://www.getyourguide.com/s?q=%EC%BD%9C%EB%A1%9C%EC%84%B8%EC%9B%80%20(Colosseum) |
| Gardens by the Bay Light Show | singapore | Activity | https://www.klook.com/en-US/search/result/?query=Gardens%20by%20the%20Bay%20Light%20Show |
| 서울특별시의 숨겨진 보석 | seoul | Landmark | https://www.klook.com/en-US/search/result/?query=%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C%EC%9D%98%20%EC%88%A8%EA%B2%A8%EC%A7%84%20%EB%B3%B4%EC%84%9D |
| SEOUL Premium Landmark 8 | seoul | Landmark | https://www.klook.com/en-US/search/result/?query=SEOUL%20Premium%20Landmark%208 |
| Phi Phi Islands Day Trip | phuket | Activity | https://www.tripadvisor.com/Search?q=Phi%20Phi%20Islands%20Day%20Trip |
| Hawker Center Food Tour | singapore | Activity | https://www.klook.com/en-US/search/result/?query=Hawker%20Center%20Food%20Tour |
| 런던 프리미엄 Landmark 추천 81 | london | Landmark | https://www.getyourguide.com/s?q=%EB%9F%B0%EB%8D%98%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Landmark%20%EC%B6%94%EC%B2%9C%2081 |
| Aquaria KLCC Underwater Experience | kuala-lumpur | Activity | https://www.tripadvisor.com/Search?q=Aquaria%20KLCC%20Underwater%20Experience |
| West End Theatre Show | london | Activity | https://www.getyourguide.com/s?q=West%20End%20Theatre%20Show |
| Georgetown Street Art Tour | penang | Activity | https://www.tripadvisor.com/Search?q=Georgetown%20Street%20Art%20Tour |
| 파리 프리미엄 Activity 추천 103 | paris | Activity | https://www.getyourguide.com/s?q=%ED%8C%8C%EB%A6%AC%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Activity%20%EC%B6%94%EC%B2%9C%20103 |
| 판테온 (Pantheon) | rome | Landmark | https://www.getyourguide.com/s?q=%ED%8C%90%ED%85%8C%EC%98%A8%20(Pantheon) |
| Whale Shark Watching in Oslob | cebu | Activity | https://www.tripadvisor.com/Search?q=Whale%20Shark%20Watching%20in%20Oslob |
| 템스강 프라이빗 선셋 크루즈 (Private Thames River Cruise at Sunset) | london | Activity | https://www.getyourguide.com/s?q=%ED%85%9C%EC%8A%A4%EA%B0%95%20%ED%94%84%EB%9D%BC%EC%9D%B4%EB%B9%97%20%EC%84%A0%EC%85%8B%20%ED%81%AC%EB%A3%A8%EC%A6%88%20(Private%20Thames%20River%20Cruise%20at%20Sunset) |
| 바티칸 박물관 & 시스티나 예배당 프라이빗 이른 아침 투어 (Private Vatican Museums & Sistine Chapel Early Morning Tour) | rome | Activity | https://www.getyourguide.com/s?q=%EB%B0%94%ED%8B%B0%EC%B9%B8%20%EB%B0%95%EB%AC%BC%EA%B4%80%20%26%20%EC%8B%9C%EC%8A%A4%ED%8B%B0%EB%82%98%20%EC%98%88%EB%B0%B0%EB%8B%B9%20%ED%94%84%EB%9D%BC%EC%9D%B4%EB%B9%97%20%EC%9D%B4%EB%A5%B8%20%EC%95%84%EC%B9%A8%20%ED%88%AC%EC%96%B4%20(Private%20Vatican%20Museums%20%26%20Sistine%20Chapel%20Early%20Morning%20Tour) |
| 웨스트민스터 사원 (Westminster Abbey) | london | Landmark | https://www.getyourguide.com/s?q=%EC%9B%A8%EC%8A%A4%ED%8A%B8%EB%AF%BC%EC%8A%A4%ED%84%B0%20%EC%82%AC%EC%9B%90%20(Westminster%20Abbey) |
| 싱가포르 프리미엄 Landmark 추천 105 | singapore | Landmark | https://www.klook.com/en-US/search/result/?query=%EC%8B%B1%EA%B0%80%ED%8F%AC%EB%A5%B4%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Landmark%20%EC%B6%94%EC%B2%9C%20105 |
| Seine River Dinner Cruise | paris | Activity | https://www.getyourguide.com/s?q=Seine%20River%20Dinner%20Cruise |
| National Gallery Singapore | singapore | Activity | https://www.klook.com/en-US/search/result/?query=National%20Gallery%20Singapore |
| 런던 프리미엄 Activity 추천 51 | london | Activity | https://www.getyourguide.com/s?q=%EB%9F%B0%EB%8D%98%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Activity%20%EC%B6%94%EC%B2%9C%2051 |
| 비자림 | jeju | Landmark | https://www.klook.com/en-US/search/result/?query=%EB%B9%84%EC%9E%90%EB%A6%BC |
| Chinatown Night Market Walk | kuala-lumpur | Activity | https://www.tripadvisor.com/Search?q=Chinatown%20Night%20Market%20Walk |
| Thai Cooking Class Experience | phuket | Activity | https://www.tripadvisor.com/Search?q=Thai%20Cooking%20Class%20Experience |
| 런던 프리미엄 Activity 추천 71 | london | Activity | https://www.getyourguide.com/s?q=%EB%9F%B0%EB%8D%98%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Activity%20%EC%B6%94%EC%B2%9C%2071 |
| 시부야 스카이 & 시부야 스크램블 교차로 (渋谷スカイ & 渋谷スクランブル交差点) | tokyo | Activity | https://www.klook.com/en-US/search/result/?query=%EC%8B%9C%EB%B6%80%EC%95%BC%20%EC%8A%A4%EC%B9%B4%EC%9D%B4%20%26%20%EC%8B%9C%EB%B6%80%EC%95%BC%20%EC%8A%A4%ED%81%AC%EB%9E%A8%EB%B8%94%20%EA%B5%90%EC%B0%A8%EB%A1%9C%20(%E6%B8%8B%E8%B0%B7%E3%82%B9%E3%82%AB%E3%82%A4%20%26%20%E6%B8%8B%E8%B0%B7%E3%82%B9%E3%82%AF%E3%83%A9%E3%83%B3%E3%83%96%E3%83%AB%E4%BA%A4%E5%B7%AE%E7%82%B9) |
| 더 판테온, 로마 (The Pantheon, Rome) | rome | Landmark | https://www.getyourguide.com/s?q=%EB%8D%94%20%ED%8C%90%ED%85%8C%EC%98%A8%2C%20%EB%A1%9C%EB%A7%88%20(The%20Pantheon%2C%20Rome) |
| 베르사유 궁전 - 거울의 방 (Galerie des Glaces) | paris | Landmark | https://www.getyourguide.com/s?q=%EB%B2%A0%EB%A5%B4%EC%82%AC%EC%9C%A0%20%EA%B6%81%EC%A0%84%20-%20%EA%B1%B0%EC%9A%B8%EC%9D%98%20%EB%B0%A9%20(Galerie%20des%20Glaces) |
| 요트 드 파리 - 럭셔리 프라이빗 세느강 디너 크루즈 | paris | Activity | https://www.getyourguide.com/s?q=%EC%9A%94%ED%8A%B8%20%EB%93%9C%20%ED%8C%8C%EB%A6%AC%20-%20%EB%9F%AD%EC%85%94%EB%A6%AC%20%ED%94%84%EB%9D%BC%EC%9D%B4%EB%B9%97%20%EC%84%B8%EB%8A%90%EA%B0%95%20%EB%94%94%EB%84%88%20%ED%81%AC%EB%A3%A8%EC%A6%88 |
| Island Hopping Adventure | cebu | Activity | https://www.tripadvisor.com/Search?q=Island%20Hopping%20Adventure |
| Penang Hill Funicular Railway Experience | penang | Activity | https://www.tripadvisor.com/Search?q=Penang%20Hill%20Funicular%20Railway%20Experience |
| Batu Caves Temple Tour | kuala-lumpur | Activity | https://www.tripadvisor.com/Search?q=Batu%20Caves%20Temple%20Tour |
| 파리 프리미엄 Activity 추천 3 | paris | Activity | https://www.getyourguide.com/s?q=%ED%8C%8C%EB%A6%AC%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Activity%20%EC%B6%94%EC%B2%9C%203 |
| 부산광역시의 숨겨진 보석 | busan | Landmark | https://www.klook.com/en-US/search/result/?query=%EB%B6%80%EC%82%B0%EA%B4%91%EC%97%AD%EC%8B%9C%EC%9D%98%20%EC%88%A8%EA%B2%A8%EC%A7%84%20%EB%B3%B4%EC%84%9D |
| 부산광역시 프리미엄 Activity 추천 7 | busan | Activity | https://www.klook.com/en-US/search/result/?query=%EB%B6%80%EC%82%B0%EA%B4%91%EC%97%AD%EC%8B%9C%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Activity%20%EC%B6%94%EC%B2%9C%207 |
| Traditional Nyonya Cooking Class | penang | Activity | https://www.tripadvisor.com/Search?q=Traditional%20Nyonya%20Cooking%20Class |
| 한라산 국립공원 (어승생악 탐방로) | jeju | Landmark | https://www.klook.com/en-US/search/result/?query=%ED%95%9C%EB%9D%BC%EC%82%B0%20%EA%B5%AD%EB%A6%BD%EA%B3%B5%EC%9B%90%20(%EC%96%B4%EC%8A%B9%EC%83%9D%EC%95%85%20%ED%83%90%EB%B0%A9%EB%A1%9C) |
| 부산광역시 프리미엄 Activity 추천 67 | busan | Activity | https://www.klook.com/en-US/search/result/?query=%EB%B6%80%EC%82%B0%EA%B4%91%EC%97%AD%EC%8B%9C%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Activity%20%EC%B6%94%EC%B2%9C%2067 |
| 팀랩 플래닛 도쿄 DMM (teamLab Planets TOKYO DMM) | tokyo | Activity | https://www.klook.com/en-US/search/result/?query=%ED%8C%80%EB%9E%A9%20%ED%94%8C%EB%9E%98%EB%8B%9B%20%EB%8F%84%EC%BF%84%20DMM%20(teamLab%20Planets%20TOKYO%20DMM) |
| Vatican Museums Night Tour | rome | Activity | https://www.getyourguide.com/s?q=Vatican%20Museums%20Night%20Tour |
| 해동용궁사 (Haedong Yonggungsa Temple) | busan | Landmark | https://www.klook.com/en-US/search/result/?query=%ED%95%B4%EB%8F%99%EC%9A%A9%EA%B6%81%EC%82%AC%20(Haedong%20Yonggungsa%20Temple) |
| Batu Caves Cultural Tour | kuala-lumpur | Activity | https://www.tripadvisor.com/Search?q=Batu%20Caves%20Cultural%20Tour |
| Roman Cuisine Cooking Class | rome | Activity | https://www.getyourguide.com/s?q=Roman%20Cuisine%20Cooking%20Class |
| 싱가포르의 숨겨진 보석 | singapore | Landmark | https://www.klook.com/en-US/search/result/?query=%EC%8B%B1%EA%B0%80%ED%8F%AC%EB%A5%B4%EC%9D%98%20%EC%88%A8%EA%B2%A8%EC%A7%84%20%EB%B3%B4%EC%84%9D |
| SEOUL Premium Activity 38 | seoul | Activity | https://www.klook.com/en-US/search/result/?query=SEOUL%20Premium%20Activity%2038 |
| 파리의 숨겨진 보석 | paris | Landmark | https://www.getyourguide.com/s?q=%ED%8C%8C%EB%A6%AC%EC%9D%98%20%EC%88%A8%EA%B2%A8%EC%A7%84%20%EB%B3%B4%EC%84%9D |
| 웨스트민스터 애비 (Westminster Abbey) | london | Landmark | https://www.getyourguide.com/s?q=%EC%9B%A8%EC%8A%A4%ED%8A%B8%EB%AF%BC%EC%8A%A4%ED%84%B0%20%EC%95%A0%EB%B9%84%20(Westminster%20Abbey) |
| 파리 프리미엄 Landmark 추천 33 | paris | Landmark | https://www.getyourguide.com/s?q=%ED%8C%8C%EB%A6%AC%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Landmark%20%EC%B6%94%EC%B2%9C%2033 |
| Spanish Steps | rome | Landmark | https://www.getyourguide.com/s?q=Spanish%20Steps |
| Coral Island Snorkeling Tour | phuket | Activity | https://www.tripadvisor.com/Search?q=Coral%20Island%20Snorkeling%20Tour |
| Gardens by the Bay Night Tour | singapore | Activity | https://www.klook.com/en-US/search/result/?query=Gardens%20by%20the%20Bay%20Night%20Tour |
| Paris Catacombs Tour | paris | Activity | https://www.getyourguide.com/s?q=Paris%20Catacombs%20Tour |
| 부산광역시 프리미엄 Landmark 추천 17 | busan | Landmark | https://www.klook.com/en-US/search/result/?query=%EB%B6%80%EC%82%B0%EA%B4%91%EC%97%AD%EC%8B%9C%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Landmark%20%EC%B6%94%EC%B2%9C%2017 |
| 바티칸 박물관 & 시스티나 예배당 프라이빗 새벽 투어 | rome | Activity | https://www.getyourguide.com/s?q=%EB%B0%94%ED%8B%B0%EC%B9%B8%20%EB%B0%95%EB%AC%BC%EA%B4%80%20%26%20%EC%8B%9C%EC%8A%A4%ED%8B%B0%EB%82%98%20%EC%98%88%EB%B0%B0%EB%8B%B9%20%ED%94%84%EB%9D%BC%EC%9D%B4%EB%B9%97%20%EC%83%88%EB%B2%BD%20%ED%88%AC%EC%96%B4 |
| 사그라다 파밀리아 (Sagrada Familia) | barcelona | Landmark | https://www.getyourguide.com/s?q=%EC%82%AC%EA%B7%B8%EB%9D%BC%EB%8B%A4%20%ED%8C%8C%EB%B0%80%EB%A6%AC%EC%95%84%20(Sagrada%20Familia) |
| 부산광역시 프리미엄 Activity 추천 87 | busan | Activity | https://www.klook.com/en-US/search/result/?query=%EB%B6%80%EC%82%B0%EA%B4%91%EC%97%AD%EC%8B%9C%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Activity%20%EC%B6%94%EC%B2%9C%2087 |
| SEOUL Premium Landmark 88 | seoul | Landmark | https://www.klook.com/en-US/search/result/?query=SEOUL%20Premium%20Landmark%2088 |
| 파리 프리미엄 Landmark 추천 93 | paris | Landmark | https://www.getyourguide.com/s?q=%ED%8C%8C%EB%A6%AC%20%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20Landmark%20%EC%B6%94%EC%B2%9C%2093 |
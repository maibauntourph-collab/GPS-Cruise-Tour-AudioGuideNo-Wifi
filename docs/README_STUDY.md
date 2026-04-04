# 🎓 GPS Cruise Tour App: Hooks 학습 가이드 (Study Guide)

"학생 여러분, 안녕하세요! 우리 프로젝트의 핵심 로직을 담당하는 다양한 **커스텀 훅(Custom Hooks)**들을 완벽하게 이해할 수 있도록 정리해 보았습니다. 각 훅이 어떤 '마법'을 부리는지 차근차근 살펴봅시다."

---

## ⚖️ 네트워크 & 오프라인 관련 (Connectivity)

### 📥 [useOfflineDownload.ts](file:///e:/GPS-Cruise-Tour-AudioGuideNo-Wifi-1/client/src/hooks/useOfflineDownload.ts)
- **설명:** 서버의 데이터를 오프라인에서도 볼 수 있게 로컬 브라우저 저장소에 내려받는 '일괄 다운로드' 훅입니다.
- **최신 업데이트 (Selective Download):** 전체(Global), 유럽(Europe), 아시아(Asia), 단일 국가(Country) 중 선택적으로 데이터를 받을 수 있는 `scope` 로직이 추가되었습니다.
- **학생들을 위한 팁:** 
    1. `scope`에 따라 `cities` 배열을 필터링하여 불필요한 네트워크 요청을 줄입니다.
    2. 이미지는 `batchSize: 5`로 나누어 병렬 처리하되 브라우저 부하를 방지합니다.
    3. `fetch(url, { mode: 'no-cors' })`를 통해 외부 이미지(Unsplash 등)를 안전하게 캐싱합니다.

### 🔌 [useOfflineMode.ts](file:///e:/GPS-Cruise-Tour-AudioGuideNo-Wifi-1/client/src/hooks/useOfflineMode.ts)
- **설명:** 현재 인터넷 상태에 따라 데이터의 출처(서버 vs 로컬DB)를 자동으로 스위칭합니다.
- **학생들을 위한 팁:** 온라인이면 서버에서, 오프라인이면 미리 저장된 로컬DB에서 정보를 꺼내옵니다.

### 🌐 [useOnlineStatus.ts](file:///e:/GPS-Cruise-Tour-AudioGuideNo-Wifi-1/client/src/hooks/useOnlineStatus.ts)
- **설명:** 단순하게 인터넷 연결이 살아있는지 죽었는지만 실시간으로 체크합니다.

---

## ⚙️ 위치 & 탐험 관련 (Location)

### 🛰️ [useGeoLocation.ts](file:///e:/GPS-Cruise-Tour-AudioGuideNo-Wifi-1/client/src/hooks/useGeoLocation.ts)
- **설명:** 사용자의 실시간 GPS 위치를 추적하고 목적지와의 거리를 계산해 줍니다.
- **학생들을 위한 팁:** 브라우저의 `navigator.geolocation` 기능을 React와 연동하는 대표적인 예시입니다.

---

## 📱 장치 및 서비스 (Technical)

### 💻 [use-mobile.tsx](file:///e:/GPS-Cruise-Tour-AudioGuideNo-Wifi-1/client/src/hooks/use-mobile.tsx)
- **설명:** 화면 너비를 보고 현재 모바일 폰인지 PC인지 구별합니다.

### 🚀 [useServiceWorker.ts](file:///e:/GPS-Cruise-Tour-AudioGuideNo-Wifi-1/client/src/hooks/useServiceWorker.ts)
- **설명:** PWA 앱의 핵심인 서비스 워커의 상태(업데이트 유무 등)를 관리합니다.

---

"각 코드 파일 상단에 **[교수님의 한마디]** 혹은 **[수정 적요]**를 추가해 두었으니, 이 가이드와 코드를 함께 보면서 공부하세요!"

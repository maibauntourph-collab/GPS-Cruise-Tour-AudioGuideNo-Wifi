# LandmarkPanel 기능 확장 및 UI 개선 계획

명소 상세 패널(`LandmarkPanel.tsx`)에 외부 정보 링크와 예약 플랫폼 링크를 추가하고, 예약 섹션 아래에 명소에 대한 상세 설명을 배치하는 작업을 진행합니다.

## 제안된 변경 사항

### [Frontend] LandmarkPanel UI/UX 개선

`client/src/components/LandmarkPanel.tsx` 파일을 수정하여 다음 요소들을 추가합니다.

#### [MODIFY] [LandmarkPanel.tsx](file:///e:/GPS-Cruise-Tour-AudioGuideNo-Wifi-1/client/src/components/LandmarkPanel.tsx)

1.  **외부 링크 섹션 (External Links)**:
    - 위치: 대표 사진 섹션 아래, 나레이션 가이드 섹션 위 (제공된 이미지의 스케치 위치)
    - 버튼 3개:
        - **Wikipedia**: `https://ko.wikipedia.org/wiki/검색어` (또는 언어에 따른 위키 링크)
        - **Tourism**: `https://www.google.com/search?q=검색어+관광명소`
        - **Google Search**: `https://www.google.com/search?q=검색어`
    - 디자인: 프리미엄 느낌의 아이콘과 텍스트가 조합된 버튼 레이아웃

2.  **예약 섹션 (Reservation)**:
    - 위치: 기존 "Book Tickets" 섹션을 확장하거나 대체
    - 예약 플랫폼 링크 (5개):
        - 마이리얼트립 (MyRealTrip)
        - 트립닷컴 (Trip.com)
        - 클룩 (Klook)
        - GetYourGuide
        - Viator
    - 검색 로직: 현재 명소 이름 + 플랫폼 명칭을 조합하여 구글 검색 또는 직접 링크 생성

3.  **상세 설명 섹션 (Description under Reservation)**:
    - 위치: 예약 섹션 바로 아래
    - 내용: 명소(Landmark), 활동(Activities), 레스토랑(Restaurant), 쇼핑몰(Shopmall) 등에 대한 상세 텍스트 정보 표시
    - `landmark.detailedDescription` 또는 `historicalInfo` 데이터를 활용하여 풍부한 정보 제공

## 검증 계획

### 수동 테스트 (Manual Verification)

1.  **링크 동작 확인**:
    - 위키백과, 관광 정보, 구글 검색 버튼을 클릭했을 때 해당 명소 이름으로 올바르게 검색되는지 확인합니다.
    - 5개 예약 플랫폼 버튼 클릭 시 구글 검색 결과(플랫폼+명소명)로 잘 연결되는지 확인합니다.
2.  **레이아웃 확인**:
    - 모바일 뷰에서 버튼들이 겹치지 않고 정렬이 잘 되어 있는지 확인합니다.
    - 예약 섹션 하단에 상세 설명이 잘 표시되는지 확인합니다.
3.  **다국어 확인**:
    - 선택된 언어(`selectedLanguage`)에 따라 명소 이름이 검색어에 올바르게 반영되는지 확인합니다.

---
**작업 예정 일시**: 2026-02-25 22:40 (KST)
**담당 에이전트**: Antigravity (Dodari & Designer Kim 협업)

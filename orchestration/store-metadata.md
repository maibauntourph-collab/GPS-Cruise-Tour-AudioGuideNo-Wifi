# Google Play Store 메타데이터 — NoWiFi GPS Audio Tour

## 앱 기본 정보

| 항목 | 내용 |
|---|---|
| 앱 이름 | NoWiFi GPS Audio Tour |
| 패키지명 | com.nowifigps.tours |
| 카테고리 | 여행 (Travel & Local) |
| 콘텐츠 등급 | 전체 이용가 |
| 가격 | 무료 (인앱결제 있음) |

---

## 짧은 설명 (80자 이내)

```
WiFi 없이 즐기는 크루즈 기항지 GPS 오디오 가이드 — 40개 도시, 24개 언어
```

## 전체 설명 (4,000자 이내)

```
🎧 크루즈 여행자를 위한 스마트 오디오 가이드

크루즈 기항지에서 내리면 WiFi가 없어 불안하셨나요?
NoWiFi GPS Audio Tour는 인터넷 연결 없이도 작동하는
GPS 기반 오디오 가이드입니다.

✅ 주요 기능
• GPS 위치 기반 자동 오디오 재생
• 사전 다운로드로 WiFi 없이 사용
• 40개 크루즈 기항지 지원
• 24개 언어 나레이션
• Viator 연계 투어 예약 (최대 56% 절약)
• 오프라인 지도 & 랜드마크 가이드

🗺️ 지원 기항지
지중해: 로마, 바르셀로나, 산토리니, 베네치아, 두브로브니크...
카리브해: 나소, 코수멜, 세인트마틴...
알래스카: 주노, 케치칸, 스캐그웨이...
아시아: 싱가포르, 홍콩, 방콕...

💡 이런 분께 추천
• 크루즈 기항지 자유 여행자
• 비싼 현지 투어 대신 셀프 가이드 원하는 분
• 언어 장벽 없이 여행하고 싶은 분

📱 완전 무료 시작 — 첫 3개 랜드마크 무료 체험
```

---

## 키워드 (ASO)

```
크루즈, 기항지, 오디오가이드, GPS, WiFi없이, 여행, 오프라인,
cruise, port, audio guide, offline, no wifi, travel, shore excursion
```

---

## Task B 실행 단계

### Step 1: PWABuilder로 APK 생성
1. https://www.pwabuilder.com 접속
2. URL 입력: `https://gps-audio-guide-no-wifi.maibauntourph.workers.dev`
3. "Package for Store" → Android 선택
4. APK 다운로드 (서명 포함)

### Step 2: Google Play Console 설정
1. https://play.google.com/console 접속
2. 개발자 계정 생성 ($25 1회 등록비)
3. "앱 만들기" → 위 메타데이터 입력

### Step 3: 스토어 이미지 준비
| 항목 | 크기 | 필수 |
|---|---|---|
| 아이콘 | 512×512 PNG | ✅ |
| 피처드 그래픽 | 1024×500 PNG | ✅ |
| 스크린샷 (폰) | 최소 2장 | ✅ |
| 스크린샷 (태블릿) | 선택 | - |

### Step 4: 심사 제출
- 개인정보처리방침 URL 필요 (Cloudflare Pages에 privacy.html 배포)
- 심사 소요: 3-7일

### Step 5: 완료 후
- Play Store URL을 `orchestration/landing/index.html`의 CONFIG.android에 업데이트
- QR 코드 목적지 URL 확인 (nowifigps.tours 도메인 구매 완료 시)

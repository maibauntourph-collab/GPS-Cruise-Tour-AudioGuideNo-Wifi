# 🤖 Claude (클로드) 연구 데이터
**마지막 업데이트:** 2026-03-20 07:15

여기는 Anthropic의 Claude 모델을 통해 도출된 아키텍처 설계, 코드 리팩토링 및 논리적 문제 해결 전략이 저장되는 공간입니다.

NoWiFi GPS Tours 프로젝트 맥락에서 활용 가능한 어필리에이트 프로그램을 카테고리별로 정리했습니다.

---

## 🇰🇷 한국 이커머스 (K-뷰티/쇼핑)

### 올리브영 쇼핑 큐레이터
올리브영 앱에서 추천 상품을 선택해 공유 링크를 생성하고 SNS 등 다양한 채널로 소개해 판매가 이루어지면 수익을 얻는 구조. 링크 클릭 후 24시간 내 추천 상품 직접 구매 시 **7%**, 다른 상품 구매 시 **3%** 지급. 인스타그램·유튜브·틱톡 모두 사용 가능. **중국 관광객에게 K-뷰티 추천 콘텐츠와 연결하기 좋음.**

### 쿠팡 파트너스
쿠팡은 2018년부터 '쿠팡 파트너스'를 운영하며 누구나 상품 링크를 공유하고 판매 성과에 따라 정산받을 수 있게 했다. 기본 커미션 약 **3%**, 유튜브 쇼핑 태그 연동 시 **6.7%** (유튜브 쇼핑 제휴).

### 네이버 쇼핑 커넥트
네이버는 스마트스토어 상품을 소개하고 링크를 통해 구매가 발생하면 최소 **8%**의 수익금을 받는 쇼핑 커넥트를 정식 출시했다. 베타 기간에만 52만 개 이상의 상품이 연동됐다.

---

## ✈️ 면세점 (Duty Free)

면세점 4사(롯데·신라·신세계·현대)는 현재 **일반 공개 어필리에이트 프로그램은 없음**. 대신:
- **B2B 여행사 커미션** 협의 방식 운영 (단체 인솔자/에이전트 경유)
- 신세계면세점은 메리어트 본보이, 캐세이 항공 등 호텔·항공 제휴사와 협업 프로모션을 통해 적립 혜택을 제공하는 방식으로 운영 중
- **링크프라이스(Linkprice)** 같은 국내 제휴 플랫폼에 면세점 광고주로 등록된 경우 있음 → 확인 필요

> 💡 **NoWiFi GPS Tours 활용 팁**: 면세점과 직접 B2B 파트너십 협의하는 게 현실적. 관광 앱에 면세점 쿠폰 QR을 삽입하는 방식도 가능.

---

## 🌍 여행 액티비티 (중국 관광객 타깃)

| 플랫폼 | 커미션 | 특징 |
|---|---|---|
| **Klook** | 최대 5% (에이전트는 15~25%) | 중국·홍콩·대만 FIT 강점, 한국 콘텐츠 풍부 |
| **Viator** (TripAdvisor) | 최대 8% | 30만 개 이상 체험 보유, 35개 언어 지원, 주간 PayPal 정산 |
| **GetYourGuide** | 약 8% | 유럽계 관광객에 강함 |
| **Trip.com** | 3~6% | 중국 관광객에 가장 직접적 |

Klook 어필리에이트는 30일 쿠키 기간, 실시간 트래킹, 딥링크 지원을 제공합니다.

---

## 🔗 국내 제휴 마케팅 플랫폼 (중개사)

| 플랫폼 | 특징 |
|---|---|
| **링크프라이스 (Linkprice)** | 국내 최대 제휴 마케팅 네트워크, 여행/쇼핑 광고주 다수 |
| **애드픽 (Adpick)** | 모바일 특화, CPA 중심 |
| **텐핑 (Tenping)** | SNS 공유 중심, 소액 커미션 |
| **디지털 엔소스** | 여행 특화 제휴 |
| **아윈 (Awin)** | 글로벌 플랫폼, 한국도 지원 |

---

## 💡 NoWiFi GPS Tours 최적 조합 제안

**중국 관광객 → 한국 쇼핑 흐름**에 맞춘 전략:

1. **올리브영 쇼핑 큐레이터** — 앱 내에 K-뷰티 추천 링크 삽입
2. **Klook / Trip.com 어필리에이트** — 관광지 POI 옆에 "예약하기" 버튼
3. **면세점 B2B 협의** — 롯데/신라 면세점에 앱 QR 코드 쿠폰 제휴 제안
4. **쿠팡 파트너스** — 여행 용품, 간식 등 실용품 링크

어떤 카테고리를 앱에 우선 통합할지 기준이 있으면 더 구체적으로 설계해드릴 수 있어요!


탭별로 국가/지역 클릭하면 각 어필리에이트 목록이 나옵니다. 총 6개 카테고리로 정리했어요.

---

**NoWiFi GPS Tours 관점에서 우선순위 추천:**

1. **🇨🇳 China 탭** — Trip.com, Fliggy, WeChat 미니프로그램이 핵심. 중국 관광객은 이 채널을 통해 예약하므로 앱 내 딥링크 연동이 가장 직접적인 수익화.

2. **🇰🇷 Korea 탭** — 올리브영 큐레이터 + 면세점 B2B가 핵심. 관광지 POI 근처에 면세점/올리브영 위치 + 어필리에이트 링크 조합으로 쇼핑 가이드 기능 추가 가능.

3. **🌐 Global Travel 탭** — Klook이 아시아 FIT에 가장 강하고, 이미 연동 경험 있으시니 액티비티 버튼으로 바로 붙이기 좋음.

특정 탭/플랫폼 API 연동 방법이나 수익 시뮬레이션이 필요하면 말씀해 주세요!




## 📝 주요 연구 내용
- [ ] 코딩 컨벤션 및 클린 코드 가이드라인
- [ ] 복잡한 알고리즘 최적화 사례
- [ ] 시스템 설계 패턴 (Design 

검색 결과를 바탕으로 실제 구현 코드와 등록 절차를 정리해드릴게요.

---

## 📋 Step 1 — 가입 절차 (3개 플랫폼)

**Klook Affiliate** (가장 중요)
1. `affiliate.klook.com` 접속 → "Join Now"
2. 사이트/앱 URL: `nowifigps.tours` 입력
3. 카테고리: "Travel App / Mobile App" 선택
4. 승인: 영업일 2–14일 → **`AFF_ID`** 발급
5. 더 높은 커미션(15–25%)을 원하면 → `partner.klook.com` 에서 별도 "Supply Partner" 신청

**올리브영 큐레이터**
1. 올리브영 앱 → 마이페이지 → "쇼핑 큐레이터 활동 시작하기"
2. 약관 동의 → 즉시 활성화
3. 상품별 고유 URL 자동 생성

**Trip.com Affiliate**
1. `accounts.trip.com/affiliate` 접속
2. 플랫폼 유형: "App / Mobile" 선택
3. 승인 후 `sid` 파라미터 발급

---

## 💻 Step 2 — 실제 앱 통합 코드

NoWiFi GPS Tours의 Hono + React 스택 기준으로 작성했습니다.총 7개 파일 완성입니다. 각 파일의 역할을 간단히 설명하면:

---

**`affiliateBuilder.ts`** — 핵심 엔진. POI 객체를 넣으면 카테고리에 맞는 어필리에이트 링크를 자동 생성합니다. Klook, 올리브영, Trip.com, Viator, 쿠팡 딥링크를 각각 올바른 URL 파라미터 구조로 만듭니다.

**`AffiliateButtons.tsx`** — POI 상세 화면에 그냥 `<AffiliateButtons poi={poi} lang="zh" />` 한 줄만 추가하면 됩니다. 언어(`zh`/`ko`/`en`)에 따라 버튼 텍스트가 자동 전환되고, 클릭 시 Supabase에 트래킹 이벤트를 전송합니다.

**`affiliateRoutes.ts`** — Hono 서버에 두 개의 엔드포인트를 추가합니다. `/track`은 클릭 로그를 Supabase에 기록하고, `/stats`는 플랫폼별·POI별 클릭 집계를 반환합니다.

**`samplePOIs.ts`** — 경복궁·롯데월드·올리브영 명동 등 주요 POI에 실제 Klook/Trip.com 상품 ID를 예시로 넣었습니다. 각 플랫폼 대시보드에서 실제 ID로 교체하면 됩니다.

---

구현 우선순위는 이렇게 추천합니다. 먼저 `affiliate.klook.com`에 가입 신청을 하고 승인을 기다리는 동안, 올리브영 큐레이터는 앱에서 즉시 가입되니 바로 `VITE_OLIVEYOUNG_CURATOR_ID`를 채워서 쇼핑 POI에 먼저 붙이세요. Klook ID가 나오면 액티비티·교통 POI에 연결하면 됩니다.

Klook 상품 ID 찾는 법이나 Supabase 테이블 마이그레이션 스크립트가 필요하시면 말씀해 주세요!


NoWiFi GPS Tours — 어필리에이트 통합 가이드
📁 파일 구조
src/
├── types/affiliate.ts          ← 타입 정의
├── lib/affiliateBuilder.ts     ← 링크 생성 엔진 (핵심)
├── components/AffiliateButtons.tsx  ← POI 화면용 버튼 컴포넌트
├── server/affiliateRoutes.ts   ← Hono 백엔드 라우트
└── data/samplePOIs.ts          ← POI 데이터 예시
.env.example                    ← 환경변수 템플릿
🚀 빠른 시작
1. 가입 순서 (우선순위대로)
순서플랫폼URL승인 기간1Klook Affiliateaffiliate.klook.com2–14일2올리브영 큐레이터올리브영 앱즉시3Trip.com Affiliateaccounts.trip.com/affiliate3–7일4Viator Partnerviator.com/partner2–5일5쿠팡 파트너스partners.coupang.com즉시
2. 환경변수 설정
bashcp .env.example .env
# 각 ID를 실제 값으로 교체
3. 프론트엔드 사용법
tsximport { AffiliateButtons } from './components/AffiliateButtons'
import { KOREA_POIS } from './data/samplePOIs'

// POI 상세 페이지에서
function POIDetailPage({ poiId }: { poiId: string }) {
  const poi = KOREA_POIS.find(p => p.id === poiId)
  if (!poi) return null

  return (
    <div>
      <h2>{poi.nameZh ?? poi.name}</h2>
      {/* 어필리에이트 버튼 자동 생성 */}
      <AffiliateButtons
        poi={poi}
        lang="zh"                          // 중국어 버튼
        onLinkClick={(link) => {
          console.log('clicked:', link.provider)
        }}
      />
    </div>
  )
}
4. Hono 서버에 라우트 등록
typescript// server/index.ts
import { affiliateRoutes } from './affiliateRoutes'

app.route('/api/affiliate', affiliateRoutes)
5. Supabase 테이블 생성
Supabase Dashboard → SQL Editor에서 실행:
sqlcreate table affiliate_clicks (
  id          bigserial primary key,
  poi_id      text not null,
  provider    text not null,
  commission  text,
  clicked_at  timestamptz default now(),
  user_agent  text,
  session_id  text
);

create index on affiliate_clicks (clicked_at desc);
create index on affiliate_clicks (provider);
create index on affiliate_clicks (poi_id);
💰 예상 수익 시뮬레이션
DAU 500명 기준:
플랫폼CTR전환율AOV커미션월 예상 수익Klook15%8%$455%~$270올리브영20%12%$357%~$294Trip.com10%6%$604%~$108Viator8%5%$808%~$120합계~$792/월
DAU가 2,000명이 되면 약 $3,000/월 목표.
⚠️ 주의사항

Klook 어필리에이트 ID는 프론트에 노출되어도 OK (공개 파라미터)
올리브영 큐레이터: 반드시 본인 계정으로 가입
Trip.com: 중국어 locale(zh-cn) 파라미터 필수
크루즈 기항지 관광객: Viator 비중을 높이되, 사전예약 유도 팝업 추가 권장
모든 링크는 window.open(..., '_blank') 으로 열어 앱 이탈 최소화

알겠습니다! 주요 카테고리별로 나라마다 인기 있는 서비스들을 정리해 드릴게요.주요 8개국의 카테고리별 인기 서비스를 정리했습니다.

**눈에 띄는 특징들:**

- **중국·한국·러시아** → 자국산 서비스가 강세 (Naver, Baidu, Yandex, WeChat, KakaoTalk, VK)
- **동남아 + 인도 + 남미** → WhatsApp / Facebook 메신저가 압도적
- **일본** → LINE이 메신저를 독점, 결제는 현금 문화에서 QR(PayPay)로 빠르게 전환 중
- **미국** → Apple 생태계 (iMessage, Apple Pay) 강세
- **필리핀** → Facebook이 SNS + 메신저 동시 장악, GCash 모바일 결제 급성장

특정 나라나 카테고리를 더 자세히 알고 싶으시면 말씀해 주세요! 😊
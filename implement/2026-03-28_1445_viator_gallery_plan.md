# 🎨 Viator API 연동 및 랜드마크 갤러리 고도화 계획 (Landmark Gallery Upgrade)

**날짜:** 2026-03-28 14:45
**담당 에이전트:** Designer Kim (AI 수석 디자이너), Query Master (DB 장인)

---

## 📋 핵심 목표
1. **Viator API 연동**: 제공받은 API Key(`de25d027-3e03-47cb-9c89-196e3e698637`)를 시스템에 안전하게 등록하고, 랜드마크 상세 페이지에서 Viator 상품 사진 5장을 동적으로 불러옵니다.
2. **프리미엄 갤러리 강화**: 랜드마크 상세 다이얼로그(`LandmarkDetailDialog.tsx`)의 사진 갤러리를 개선하여, 클릭 시 'BIG SIZE'로 시원하게 볼 수 있는 고해상도 뷰어 기능을 강화합니다.
3. **오프라인 안정성**: No-WiFi 환경을 고려하여, 온라인 시 캐싱된 이미지가 오프라인에서도 부드럽게 노출되도록 최적화합니다.

---

## 🛠️ 실행 계획 (Execution Plan)

### 1단계: API 키 보안 및 환경 설정 (Query Master)
- `server/env.ts` 및 `.env` 파일에 `VIATOR_API_KEY` 등록.
- `client/src/lib/affiliateConfig.ts`에서 Viator 파트너 ID 업데이트.

### 2단계: 랜드마크 고해상도 뷰어 개선 (Designer Kim)
- `LandmarkDetailDialog.tsx`의 갤러리 섹션을 `PhotoGallery.tsx`와 연동하여 'BIG SIZE' 토글 기능 강화.
- Framer Motion을 이용한 '줌 인/아웃' 애니메이션 및 부드러운 스와이프 인터랙션 적용.
- 5장의 고퀄리티 사진 슬롯 확보 (Viator 데이터 우선 노출).

### 3단계: 백엔드 API 프록시 구축 (Server Park)
- `server/routes.ts`에 Viator 상품 이미지 검색 엔드포인트(`GET /api/viator/photos`) 추가.
- API Key 유출 방지를 위해 서버 측에서 Viator API 호출 후 결과 전달.

---

## 🚀 기대 효과
- **WOW 포인트**: 단순 텍스트 위주 가이드에서 화려한 대형 사진 위주의 '비주얼 가이드'로 업그레이드.
- **예약 유도**: 고해상도 사진을 통해 사용자의 여행 욕구를 자극하고 Viator 제휴 수익 창출 극대화.
- **학생 가이드**: "API 키는 보이지 않는 곳(서버)에 숨기고, 결과는 화려하게(프론트) 보여주는 것이 프로의 기술입니다."

---

> [!IMPORTANT]
> **승인 요청**: 위의 계획대로 Viator API 키 등록 및 갤러리 UI 수정을 진행할까요? 승인해 주시면 즉시 코드를 수정하겠습니다.

*기록자: 도다리 부장 (Antigravity AI)*
*상태: 사용자 승인 대기 중*

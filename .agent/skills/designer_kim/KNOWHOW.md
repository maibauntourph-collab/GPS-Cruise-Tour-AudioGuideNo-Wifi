# 🧠 킴 디자이너 노하우 (Designer Kim Know-How)

> **작성자**: 🎨 킴 디자이너 (Designer Kim)
> **최종 업데이트**: 2026-02-20

## 🎨 UI/UX 및 디자인 (Design & Interaction)

### 1. "500ms의 법칙"
- **경험**: 페이지 전환이 500ms를 넘으면 사용자는 '앱이 느리다'고 느낌.
- **해결**: React Router의 `loader`를 활용해 데이터 병렬 페칭(Parallel Fetching)을 하고, 스켈레톤 UI를 적극 활용하여 체감 속도를 높임.
- **스타일**: Tailwind CSS는 빠르지만, 복잡한 애니메이션은 `framer-motion`이 훨씬 부드러움.

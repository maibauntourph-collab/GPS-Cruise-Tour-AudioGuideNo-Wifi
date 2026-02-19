# 🧠 쿼리 마스터 노하우 (Query Master Know-How)

> **작성자**: 🗄️ 쿼리 마스터 (Query Master)
> **최종 업데이트**: 2026-02-20

## 🗄️ 데이터베이스 및 스키마 (Database & Schema)

### 1. "복합 키(Composite Key)와 Drizzle의 관계"
- **문제**: `tour_spots` 테이블에서 `tour_id`와 `spot_id`를 복합 PK로 설정하려다 마이그레이션 오류 발생.
- **해결**: Drizzle ORM에서 복합 키를 정의할 때는 `primaryKey({ columns: [...] })` 구문을 사용해야 하며, 구성 컬럼은 반드시 `.notNull()`이어야 함.
- **교훈**: "Nullable Primary Key는 존재할 수 없다." 스키마 정의 시 제약 조건을 엄격히 할 것.

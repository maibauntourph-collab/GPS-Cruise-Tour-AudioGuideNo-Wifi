-- ============================================================
-- [Server Park + Dodari 2026-03-25] landmarks 테이블 다국어 확장
-- 학생들에게: ALTER TABLE은 기존 데이터를 유지하면서 컬럼을 추가합니다.
-- IF NOT EXISTS 구문으로 이미 컬럼이 있어도 오류 없이 실행됩니다.
-- ============================================================
-- Neon DB 콘솔 또는 psql에서 실행하세요.
-- 환경변수: NOWIFIGPSTOURS
-- ============================================================

-- STEP 1: 신규 다국어 나레이션 컬럼 추가
-- narration_i18n: TTS 전용 나레이션 텍스트 맵 { "ko": "...", "ja": "..." }
-- description_i18n: UI 표시용 짧은 설명 맵 { "ko": "...", "ja": "..." }
ALTER TABLE landmarks
  ADD COLUMN IF NOT EXISTS narration_i18n JSONB,
  ADD COLUMN IF NOT EXISTS description_i18n JSONB;

-- STEP 2: 기존 translations 컬럼에서 narration_i18n으로 데이터 마이그레이션
-- 학생들에게: jsonb_each()는 JSON 객체를 (key, value) 행들로 펼쳐주는 PostgreSQL 함수입니다.
-- jsonb_object_agg()는 다시 (key, value)들을 하나의 JSON 객체로 모아줍니다.
UPDATE landmarks
SET narration_i18n = (
  SELECT jsonb_object_agg(
    lang_key,
    lang_value->>'narration'
  )
  FROM jsonb_each(translations::jsonb) AS t(lang_key, lang_value)
  WHERE lang_value->>'narration' IS NOT NULL
    AND lang_value->>'narration' != ''
)
WHERE translations IS NOT NULL
  AND translations::text != 'null';

-- STEP 3: 기존 translations 컬럼에서 description_i18n으로 데이터 마이그레이션
UPDATE landmarks
SET description_i18n = (
  SELECT jsonb_object_agg(
    lang_key,
    lang_value->>'description'
  )
  FROM jsonb_each(translations::jsonb) AS t(lang_key, lang_value)
  WHERE lang_value->>'description' IS NOT NULL
    AND lang_value->>'description' != ''
)
WHERE translations IS NOT NULL
  AND translations::text != 'null';

-- STEP 4: 마이그레이션 결과 확인 쿼리 (실행 후 결과 확인용)
SELECT
  id,
  name,
  CASE WHEN narration_i18n IS NOT NULL AND jsonb_typeof(narration_i18n) = 'object' 
       THEN (SELECT string_agg(k, ', ') FROM jsonb_object_keys(narration_i18n) k) 
       ELSE 'EMPTY' END AS available_narration_langs,
  CASE WHEN description_i18n IS NOT NULL AND jsonb_typeof(description_i18n) = 'object' 
       THEN (SELECT string_agg(k, ', ') FROM jsonb_object_keys(description_i18n) k) 
       ELSE 'EMPTY' END AS available_desc_langs
FROM landmarks
WHERE narration_i18n IS NOT NULL OR description_i18n IS NOT NULL
LIMIT 10;

-- ============================================================
-- [교수님 설명] 이 마이그레이션 후 데이터 구조
-- narration_i18n 예시:
-- {
--   "en": "The Colosseum is a marvel of Roman engineering...",
--   "ko": "콜로세움은 로마 공학의 경이로운 산물입니다...",
--   "ja": "コロッセウムはローマ工学の驚異です..."
-- }
-- ============================================================

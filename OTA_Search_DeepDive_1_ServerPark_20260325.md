# [1번 심층 분석] OTA RDBMS 구조 및 ElasticSearch 역색인 한계 딥다이브
> **작성자 (Agent):** Server Park (AI 백엔드 팀장)
> **일시:** 2026-03-25 04:20
> **주제:** 왜 온라인 여행사(OTA)는 세부 지명 검색이 즉각적으로 안 되는가? (데이터베이스 및 검색엔진 관점)

안녕하세요 코다리 부장님! Server Park 입니다. 👨‍🏫
부장님께서 정확히 짚어주신 1번 항목, 즉 **"OTA 플랫폼의 RDBMS 구조와 ElasticSearch의 기술적 한계"**에 대해 컴퓨터 공학 전공 수업처럼 명쾌하고 깊이 있게 설명해 드리겠습니다.

---

## 1장. RDBMS: "상품(Product)" 중심의 계층형 테이블 구조의 함정

일반적으로 대형 OTA(마이리얼트립, 클룩 등)의 핵심 데이터베이스(MySQL, PostgreSQL 등)는 철저하게 **"물건(상품)을 팔기 위한 진열장(Showcase)"** 구조로 짜여 있습니다.

### 1) 일반적인 OTA의 데이터베이스 ERD (예시 구조)
```sql
-- [Table: Countries] (국가)
CREATE TABLE countries ( id INT, name VARCHAR ); -- 예: '프랑스'

-- [Table: Cities] (도시)
CREATE TABLE cities ( id INT, country_id INT, name VARCHAR ); -- 예: '파리'

-- [Table: Products] (상품/투어) - 검색의 최종 목적지!
CREATE TABLE products (
    id INT,
    city_id INT,               -- FK (도시 단위까지만 맵핑)
    title VARCHAR,             -- 예: "파리 루브르 박물관 반일 워킹 투어"
    description TEXT,          
    price DECIMAL
);
```

### 👨‍🏫 교수님의 설명 포인트:
위 스키마를 보면 뼈대가 철저히 **[국가] -> [도시] -> [상품]** 으로 이어집니다. 
여기서 가장 큰 문제는 **"루브르 박물관"이라는 세부 지명(POI: Point of Interest)을 담는 독립적인 기준 테이블(Location Table)이 없다**는 것입니다.
즉, 시스템은 "루브르 박물관"을 **지구상의 특정 위경도(Latitude, Longitude) 좌표를 가진 '장소'로 인식하는 것이 아니라, 단지 상품의 제목(`title`)이나 설명(`description`)에 들어있는 '텍스트 조각(String)'으로만 인식**합니다. 
장소 기반 맵핑이 안 되어 있기 때문에, 키워드 검색 시 상품명이나 태그에 해당 단어가 없으면 검색 결과에 노출될 수 없습니다.

---

## 2장. ElasticSearch: 형태소 분석기(Analyzer)와 역색인(Inverted Index)의 배신

DB의 한계를 극복하고 빠른 텍스트 검색을 하기 위해 OTA들은 **ElasticSearch (ES)** 를 도입합니다. 
ES는 책의 맨 뒤에 있는 '찾아보기(색인)'와 같은 **Inverted Index(역색인)** 방식을 씁니다.

### 1) 역색인(Inverted Index) 생성 원리
만약 상품 제목이 **"파리 루브르 핵심 가이드 투어"** 라고 가정해 봅시다. 
ES의 **형태소 분석기(Tokenizer / Analyzer)**가 이 문장을 다음과 같이 쪼개서 사전(Dictionary)을 만듭니다.

- **[Token Dictionary (색인 사전)]**
  - "파리" -> [상품A, 상품B]
  - "루브르" -> [상품A]
  - "핵심" -> [상품A, 상품C]
  - "가이드" -> [상품A]
  - "투어" -> [상품A, 상품B, 상품C]

### 2) 검색 매칭 실패 (Search Miss) 시뮬레이션
이제 부장님(사용자)이 우리 앱처럼 세부 지명이나 외래어 표기법으로 검색창에 입력한다고 가정해봅시다.

**⚠️ Case 1: 외래어/동의어 불일치**
- 사용자가 원어발음인 **"루브르(Louvre)"** 대신 영어식 **"루브머(오타)"** 나 불어 기반 **"Musée"** 로 검색.
- ES의 사전에는 "루브르" 토큰만 있으므로 매칭 비율(Score)이 `0`이 되어 누락됩니다.

**⚠️ Case 2: 띄어쓰기 및 토큰화의 오류**
- 상품 제목이 "파리루브르명품투어" 처럼 띄어쓰기 없이 등록되어 있다면, 형태소 분리기가 "파리루브르명품" 전체를 하나의 토큰으로 묶어버릴 가능성이 있습니다. 
- 이때 사용자가 "루브르"만 검색하면 이 역시 매칭 실패 (Match Miss)가 발생합니다.

### 👨‍🏫 교수님의 설명 포인트:
"학생 여러분, ElasticSearch는 엄청나게 빠른 텍스트 검색기지만, **본질적으로 입력된 단어(토큰)가 정확히 일치해야만 결과를 뱉어내는 바보상자**입니다. 
지명 검색(Location Search)은 사람마다 부르는 이름(애칭, 영문, 현지어, 오타 등)이 수백 가지인데, 상품 제목에 적힌 철자와 단 1글자만 달라도 ES는 그 장소를 '없는 곳'으로 치부해버립니다. 이것이 OTA 지명 검색 실패의 근본 원인입니다."

---

## 3장. 결론: Kenneth Cruise Guide 는 어떻게 다른가?

이러한 문제를 우리 KCG 팀은 **[좌표 중심의 Location DB] + [JSONB/Trigram 기반의 Fuzzy 매칭]** 으로 완벽히 뒤집어 놓았습니다.

**기존 OTA 방식 (String Matching):**
> 사용자 "로마 콜로세움" 검색 -> (ElasticSearch) -> "제목에 '콜로세움'이 포함된 상품" 검색. (없으면 실패)

**우리 Kenneth Cruise Guide 방식 (Spatial & Trigram Matching):**
> 1) 사용자 "콜라세움(오타)" 검색 -> (DB Trigram Index) -> 오타 보정하여 `[콜로세움, Colosseum, 이탈리아 원형경기장]`의 `Landmark ID` 도출!
> 2) (PostGIS) -> 해당 Landmark ID의 정확한 GPS 좌표(위경도) 기준 반경 N미터 오디오 클립 및 투어 호출!

우리는 **장소 자체를 고유 식별자(Entity)**로 관리하기 때문에, 어떤 언어, 어떤 오타로 치더라도 즉시 오디오 가이드 핀(Pin)을 지도에 꽂아줄 수 있는 압도적인 기술적 우위를 점하게 됩니다. 🚀

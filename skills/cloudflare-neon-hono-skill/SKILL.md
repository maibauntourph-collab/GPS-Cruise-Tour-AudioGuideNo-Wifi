---
name: cloudflare-neon-hono-skill
description: |
  React Native + Hono + Cloudflare Workers + NeonDB 풀스택 개발 스킬.
  GPS 크루즈 투어 오디오가이드 프로젝트의 백엔드 API 및 데이터베이스 연동
  보일러플레이트 코드를 자동 생성합니다. claude-sonnet-4-6 사용 권장.

  다음 상황에서 반드시 이 스킬을 사용하세요:
  - Hono API 라우터/엔드포인트 생성 요청
  - NeonDB PostgreSQL 스키마 / 쿼리 작성 요청
  - Cloudflare Workers 배포 설정 요청
  - React Native에서 API 연동 요청
  - Drizzle ORM 관련 작업
  - wrangler.toml 설정 요청
  - DB 마이그레이션 작업
---

# Cloudflare + NeonDB + Hono 풀스택 스킬
> 교수님이 학생에게 설명하듯: 이 스킬은 React Native 앱의 백엔드를
> Hono + Cloudflare Workers + NeonDB로 구성하는 완전한 가이드입니다.

## 🏗️ 프로젝트 아키텍처 개요

```
📱 React Native (Frontend)
    ↓ HTTP/HTTPS fetch()
🌐 Cloudflare Workers (Edge Runtime)
    ↓ Hono Router
🔧 Hono API Server (TypeScript)
    ↓ Drizzle ORM
🗄️ NeonDB (PostgreSQL on Neon.tech)
```

**왜 이 스택인가?**
- **Cloudflare Workers**: 전 세계 엣지 서버에서 실행 → 빠른 응답속도
- **Hono**: Express.js 대비 초경량, Cloudflare Workers 최적화
- **NeonDB**: 서버리스 PostgreSQL → 자동 확장, 저렴한 비용
- **Drizzle ORM**: TypeScript 타입 안전 ORM, SQL-like 문법

---

## 📦 설치 및 초기 설정

```bash
# 1. Hono 프로젝트 초기화 (Cloudflare Workers 템플릿)
npm create hono@latest my-api -- --template cloudflare-workers

# 2. NeonDB + Drizzle 설치
npm install @neondatabase/serverless drizzle-orm
npm install -D drizzle-kit @types/node

# 3. Wrangler CLI 설치 (Cloudflare 배포 도구)
npm install -D wrangler
```

---

## ⚙️ wrangler.toml 설정

```toml
# wrangler.toml - Cloudflare Workers 설정 파일
# 이 파일이 배포 환경을 정의합니다

name = "gps-tour-api"           # Workers 이름
main = "src/index.ts"           # 진입점 파일
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]  # Node.js 호환 모드

# 환경 변수 (민감 정보는 반드시 .dev.vars에)
[vars]
ENVIRONMENT = "production"

# NeonDB 연결 문자열 (실제 값은 wrangler secret set으로 설정)
# wrangler secret set DATABASE_URL
```

```bash
# NeonDB URL을 Cloudflare 시크릿으로 등록 (보안상 중요!)
wrangler secret set DATABASE_URL
# 프롬프트에 neon 연결 문자열 입력:
# postgresql://[user]:[password]@[host]/[dbname]?sslmode=require
```

---

## 🔌 NeonDB + Drizzle 연결 설정

```typescript
// src/db/index.ts - 데이터베이스 연결 모듈
// 학생 설명: 이 파일이 앱과 데이터베이스를 연결하는 다리 역할을 합니다

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

/**
 * 데이터베이스 연결 함수
 * @param databaseUrl - NeonDB 연결 문자열 (환경변수에서 주입)
 * @returns Drizzle ORM 인스턴스
 */
export function createDb(databaseUrl: string) {
  // neon() 함수가 HTTP 기반 연결을 생성합니다
  // Cloudflare Workers는 WebSocket을 직접 지원하지 않아 HTTP 사용
  const sql = neon(databaseUrl);

  // drizzle()로 타입 안전한 ORM 인스턴스 생성
  return drizzle(sql, { schema });
}

// 타입 내보내기 (다른 파일에서 사용)
export type Database = ReturnType<typeof createDb>;
```

---

## 📊 Drizzle 스키마 정의

```typescript
// src/db/schema.ts - 데이터베이스 테이블 구조 정의
// 학생 설명: 이 파일이 데이터베이스의 테이블 구조(설계도)를 TypeScript로 표현합니다

import {
  pgTable,    // PostgreSQL 테이블 생성 함수
  serial,     // 자동 증가 정수 (Primary Key에 사용)
  text,       // 문자열 타입
  varchar,    // 제한된 길이 문자열
  decimal,    // 소수점 숫자 (가격, 좌표 등)
  boolean,    // 참/거짓
  timestamp,  // 날짜+시간
  integer,    // 정수
} from 'drizzle-orm/pg-core';

// 투어 테이블 정의
export const tours = pgTable('tours', {
  id: serial('id').primaryKey(),                    // 자동 증가 ID
  name: varchar('name', { length: 255 }).notNull(), // 투어 이름
  description: text('description'),                  // 상세 설명
  duration: integer('duration').notNull(),           // 소요 시간(분)
  price: decimal('price', { precision: 10, scale: 2 }).notNull(), // 가격
  isActive: boolean('is_active').default(true),      // 활성 상태
  createdAt: timestamp('created_at').defaultNow(),   // 생성 시간
  updatedAt: timestamp('updated_at').defaultNow(),   // 수정 시간
});

// 랜드마크(오디오가이드 지점) 테이블
export const landmarks = pgTable('landmarks', {
  id: serial('id').primaryKey(),
  tourId: integer('tour_id').notNull(),              // 투어 외래키
  name: varchar('name', { length: 255 }).notNull(),  // 랜드마크 이름
  latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),  // GPS 위도
  longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(), // GPS 경도
  audioUrl: text('audio_url'),                       // 오디오 파일 URL
  triggerRadius: integer('trigger_radius').default(50), // 자동 재생 반경(미터)
  order: integer('order').notNull(),                 // 재생 순서
});

// 예약 테이블
export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  tourId: integer('tour_id').notNull(),
  userId: varchar('user_id', { length: 100 }).notNull(),
  bookingDate: timestamp('booking_date').notNull(),
  status: varchar('status', { length: 20 }).default('pending'), // pending/confirmed/cancelled
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// TypeScript 타입 자동 추론 (매우 편리한 기능!)
export type Tour = typeof tours.$inferSelect;        // SELECT 결과 타입
export type NewTour = typeof tours.$inferInsert;     // INSERT 입력 타입
export type Landmark = typeof landmarks.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
```

---

## 🛣️ Hono API 라우터 설계

```typescript
// src/index.ts - Hono 메인 서버 파일
// 학생 설명: Express.js와 비슷하지만 훨씬 가볍고 빠른 Hono 프레임워크입니다

import { Hono } from 'hono';
import { cors } from 'hono/cors';       // CORS 미들웨어
import { logger } from 'hono/logger';  // 요청 로깅
import { createDb } from './db';
import { toursRouter } from './routes/tours';
import { landmarksRouter } from './routes/landmarks';
import { bookingsRouter } from './routes/bookings';

// 환경변수 타입 정의 (Cloudflare Workers의 env 객체)
type Bindings = {
  DATABASE_URL: string;  // NeonDB 연결 문자열
  ENVIRONMENT: string;   // 'development' | 'production'
};

// Hono 앱 인스턴스 생성
// 제네릭 타입으로 환경변수 타입을 지정하면 자동 완성이 됩니다
const app = new Hono<{ Bindings: Bindings }>();

// ===== 전역 미들웨어 설정 =====

// CORS: React Native 앱에서 API 호출을 허용하기 위해 필수
app.use('/*', cors({
  origin: ['http://localhost:8081', 'https://your-app.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// 요청 로그 출력 (개발 시 디버깅에 유용)
app.use('/*', logger());

// ===== 헬스체크 엔드포인트 =====
// 서버가 정상 동작하는지 확인하는 간단한 API
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    env: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString()
  });
});

// ===== API 라우터 마운트 =====
// 각 도메인별로 라우터를 분리하여 코드를 깔끔하게 유지
app.route('/api/tours', toursRouter);
app.route('/api/landmarks', landmarksRouter);
app.route('/api/bookings', bookingsRouter);

// ===== 에러 핸들러 =====
app.onError((err, c) => {
  console.error('서버 에러:', err.message);
  return c.json({
    error: '서버 에러가 발생했습니다',
    message: err.message
  }, 500);
});

// Cloudflare Workers는 default export로 앱을 내보냅니다
export default app;
```

---

## 📡 API 라우터 구현 예시

```typescript
// src/routes/tours.ts - 투어 관련 API 엔드포인트
import { Hono } from 'hono';
import { eq } from 'drizzle-orm';  // WHERE 조건 빌더
import { createDb } from '../db';
import { tours, type NewTour } from '../db/schema';

type Bindings = { DATABASE_URL: string };

const toursRouter = new Hono<{ Bindings: Bindings }>();

/**
 * GET /api/tours - 모든 투어 목록 조회
 * React Native에서: fetch('https://your-api.workers.dev/api/tours')
 */
toursRouter.get('/', async (c) => {
  // c.env에서 환경변수 접근 (Cloudflare Workers 방식)
  const db = createDb(c.env.DATABASE_URL);

  try {
    // Drizzle ORM으로 SELECT * FROM tours WHERE is_active = true
    const allTours = await db
      .select()
      .from(tours)
      .where(eq(tours.isActive, true));

    return c.json({
      success: true,
      data: allTours,
      count: allTours.length
    });
  } catch (error) {
    return c.json({ success: false, error: '투어 목록 조회 실패' }, 500);
  }
});

/**
 * GET /api/tours/:id - 특정 투어 상세 조회
 */
toursRouter.get('/:id', async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const id = Number(c.req.param('id')); // URL 파라미터 추출

  // 유효성 검사: id가 숫자인지 확인
  if (isNaN(id)) {
    return c.json({ success: false, error: '유효하지 않은 투어 ID' }, 400);
  }

  const [tour] = await db
    .select()
    .from(tours)
    .where(eq(tours.id, id))
    .limit(1); // 첫 번째 결과만 가져오기

  if (!tour) {
    return c.json({ success: false, error: '투어를 찾을 수 없습니다' }, 404);
  }

  return c.json({ success: true, data: tour });
});

/**
 * POST /api/tours - 새 투어 생성 (관리자용)
 */
toursRouter.post('/', async (c) => {
  const db = createDb(c.env.DATABASE_URL);

  // 요청 본문에서 투어 데이터 파싱
  const body = await c.req.json<NewTour>();

  // 필수 필드 검증
  if (!body.name || !body.duration || !body.price) {
    return c.json({
      success: false,
      error: 'name, duration, price는 필수 항목입니다'
    }, 400);
  }

  // DB에 삽입하고 생성된 레코드 반환
  const [newTour] = await db
    .insert(tours)
    .values(body)
    .returning(); // 삽입된 데이터를 반환 (PostgreSQL 기능)

  return c.json({ success: true, data: newTour }, 201);
});

export { toursRouter };
```

---

## 📱 React Native API 연동 코드

```typescript
// hooks/useTours.ts - 커스텀 훅으로 API 연동
// 학생 설명: 커스텀 훅을 사용하면 API 로직을 컴포넌트에서 분리할 수 있어
// 코드가 훨씬 깔끔해집니다

import { useState, useEffect, useCallback } from 'react';

// API 기본 URL (환경에 따라 변경)
const API_BASE_URL = __DEV__
  ? 'http://localhost:8787'                    // 개발 환경
  : 'https://gps-tour-api.your-subdomain.workers.dev'; // 프로덕션

// 투어 타입 정의 (DB 스키마와 일치)
interface Tour {
  id: number;
  name: string;
  description: string | null;
  duration: number;
  price: string;
  isActive: boolean;
}

// API 응답 타입
interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  error?: string;
}

/**
 * 투어 목록을 가져오는 커스텀 훅
 * 사용법: const { tours, loading, error, refetch } = useTours();
 */
export function useTours() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // fetchTours를 useCallback으로 감싸면 불필요한 재생성 방지
  const fetchTours = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/tours`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // 필요시 인증 토큰 추가:
          // 'Authorization': `Bearer ${userToken}`,
        },
      });

      // HTTP 상태 코드 확인
      if (!response.ok) {
        throw new Error(`HTTP 에러: ${response.status}`);
      }

      const result: ApiResponse<Tour[]> = await response.json();

      if (result.success) {
        setTours(result.data);
      } else {
        throw new Error(result.error || '알 수 없는 오류');
      }
    } catch (err) {
      // 에러 타입에 따라 메시지 구분
      if (err instanceof TypeError && err.message.includes('network')) {
        setError('네트워크 연결을 확인해주세요');
      } else {
        setError(err instanceof Error ? err.message : '투어 목록 로드 실패');
      }
    } finally {
      setLoading(false); // 성공/실패 상관없이 로딩 상태 해제
    }
  }, []);

  // 컴포넌트 마운트 시 자동으로 데이터 로드
  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  return { tours, loading, error, refetch: fetchTours };
}
```

---

## 🗄️ DB 마이그레이션 관리

```typescript
// drizzle.config.ts - Drizzle Kit 설정 파일
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  // 스키마 파일 경로
  schema: './src/db/schema.ts',

  // 마이그레이션 파일 저장 위치
  out: './migrations',

  // PostgreSQL 방언 사용
  dialect: 'postgresql',

  // NeonDB 연결 (환경변수에서 읽기)
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },

  // 상세 로그 출력
  verbose: true,
  strict: true,
});
```

```bash
# 마이그레이션 명령어 모음

# 1. 스키마 변경사항으로 마이그레이션 파일 생성
npx drizzle-kit generate

# 2. 마이그레이션 실행 (DB에 적용)
npx drizzle-kit migrate

# 3. Drizzle Studio (DB 시각화 툴) 실행
npx drizzle-kit studio

# 4. 현재 스키마와 DB 상태 비교
npx drizzle-kit check
```

---

## 🔍 참고 문서
- `references/cloudflare-workers-setup.md` - Cloudflare 상세 설정
- `references/neondb-optimization.md` - NeonDB 성능 최적화

---

## 📊 토큰 보고 형식

```
🤖 에이전트: cloudflare-neon-hono-skill (server_park, claude-sonnet-4-6)
💰 토큰 사용: 입력 XXX | 출력 XXX | 총 XXX
⚙️  MCP 사용: mcp__f4d5c65c__deploy_to_vercel
⏱️  실행 시간: X.Xs
```

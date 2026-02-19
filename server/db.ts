// [적요: 데이터베이스 연결 설정 모듈 - Vercel 서버리스 최적화 버전]
// Neon HTTP 방식을 사용하여 Vercel 서버리스 환경에서 안정적으로 동작합니다.
// WebSocket 대신 HTTP를 사용하므로 Cold Start가 빠르고, 연결 실패가 적습니다.
// 환경변수 키: NOWIFIGPSTOURS (단일 키로 통일)

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

// [핵심] 환경변수 키를 NOWIFIGPSTOURS 단일로 통일
const dbUrl = process.env.NOWIFIGPSTOURS;

// [안전장치] 프로덕션 환경에서 DB URL이 누락되면 즉시 에러를 발생시킵니다.
if (!dbUrl) {
  const errorMsg = "[DB] Critical: NOWIFIGPSTOURS is not defined in environment variables.";
  console.error(errorMsg);
  if (process.env.NODE_ENV === 'production') {
    throw new Error(errorMsg);
  }
}

// [적요: Vercel 서버리스 → HTTP 방식 사용 (WebSocket 불필요)]
// neon() 함수는 HTTP 기반 SQL 실행 함수를 반환합니다.
// drizzle()은 이 함수를 감싸서 ORM 기능을 제공합니다.
const sql = neon(dbUrl || "postgresql://localhost:5432/postgres");
export const db = drizzle(sql, { schema });

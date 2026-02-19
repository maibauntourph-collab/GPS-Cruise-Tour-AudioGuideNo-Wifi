import { neonConfig, Pool as NeonPool } from '@neondatabase/serverless';
import { drizzle as drizzleNeon, type NeonDatabase } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleNode, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import ws from "ws";
import * as schema from "@shared/schema";

// [Fix] User has defined the DB URL as NOWIFIGPSTOURS in Vercel. Adding it as a fallback.
const dbUrl = process.env.DATABASE_URL || process.env.NOWIFIGPSTOURS;

// [연구소장 노조: DB 연결 안전장치]
// 배포 환경에서 DATABASE_URL이 누락되어 localhost로 잘못 연결되는 것을 방지합니다.
if (!dbUrl) {
  const errorMsg = "[DB] Critical: DATABASE_URL is not defined in environment variables.";
  console.error(errorMsg);
  if (process.env.NODE_ENV === 'production') {
    throw new Error(errorMsg); // 프로덕션에서는 즉시 중단하여 로그를 남김
  }
}

// [연구소장 노트: 하이브리드 데이터베이스 연결 전략]
// - 로컬 환경 (localhost): 표준 PostgreSQL 드라이버(pg)와 node-postgres를 사용 (웹소켓 불필요)
// - 클라우드 환경 (neon.tech): Neon 서버리스 드라이버와 웹소켓을 사용
let db: NodePgDatabase<typeof schema> | NeonDatabase<typeof schema>;
let pool: pg.Pool | NeonPool;

if (!dbUrl || !dbUrl.includes('neon.tech')) {
  // 로컬 개발 환경 또는 URL 누락 시 기본값 연결 시도
  const finalUrl = dbUrl || "postgresql://localhost:5432/postgres";
  console.log("[DB] Local development/Fallback detected. Connecting to:", finalUrl.split('@').pop());
  const poolNode = new pg.Pool({ connectionString: finalUrl });
  pool = poolNode;
  db = drizzleNode(poolNode, { schema });
} else {
  // Neon 서버리스 환경
  console.log("[DB] Cloud Neon environment detected. Using @neondatabase/serverless with WebSockets.");
  try {
    neonConfig.webSocketConstructor = ws;
    const poolNeon = new NeonPool({ connectionString: dbUrl });
    pool = poolNeon;
    db = drizzleNeon(poolNeon, { schema });
    console.log("[DB] Neon Pool initialized successfully.");
  } catch (error) {
    console.error("[DB] Critical: Failed to initialize Neon Pool:", error);
    throw error;
  }
}

export { db, pool };

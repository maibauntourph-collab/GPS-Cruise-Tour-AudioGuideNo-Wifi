import { neonConfig, Pool as NeonPool } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import ws from "ws";
import * as schema from "@shared/schema";

const dbUrl = process.env.DATABASE_URL || "postgresql://localhost:5432/postgres";

// [연구소장 노트: 하이브리드 데이터베이스 연결 전략]
// - 로컬 환경 (localhost): 표준 PostgreSQL 드라이버(pg)와 node-postgres를 사용 (웹소켓 불필요)
// - 클라우드 환경 (neon.tech): Neon 서버리스 드라이버와 웹소켓을 사용
let db: any;
let pool: any;

if (!dbUrl.includes('neon.tech')) {
  // 로컬 개발 환경
  console.log("[DB] Local development detected. Using node-postgres.");
  pool = new pg.Pool({ connectionString: dbUrl });
  db = drizzleNode({ client: pool, schema });
} else {
  // Neon 서버리스 환경
  console.log("[DB] Cloud Neon environment detected. Using neon-serverless.");
  neonConfig.webSocketConstructor = ws;
  pool = new NeonPool({ connectionString: dbUrl });
  db = drizzleNeon({ client: pool, schema });
}

export { db, pool };

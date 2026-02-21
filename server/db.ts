// [적요: 데이터베이스 연결 설정 모듈 - Vercel 서버리스 최적화 버전]
// Neon HTTP 방식을 사용하여 Vercel 서버리스 환경에서 안정적으로 동작합니다.
// WebSocket 대신 HTTP를 사용하므로 Cold Start가 빠르고, 연결 실패가 적습니다.
// 환경변수 키: NOWIFIGPSTOURS (단일 키로 통일)

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";
import { env } from "./env";

// [적요: Lazy Initialization with Proxy for Workers compatibility]
// Top-level await or immediate execution fails in Workers because env is not yet established.
// We use a Proxy to delay connection until the first actual DB operation (method call).

let dbInstance: any = null;

function getDb() {
  if (dbInstance) return dbInstance;

  const dbUrl = env.NOWIFIGPSTOURS;

  if (!dbUrl) {
    const errorMsg = "[DB] Critical: NOWIFIGPSTOURS is not defined in environment variables.";
    console.error(errorMsg);
    // In production/Workers, this might throw if accessed, but effectively lazy.
    if (env.NODE_ENV === 'production') {
      // We might not want to throw immediately in global scope, strictly inside usage.
    }
  }

  // Fallback for dev/test if env not ready yet but logic shouldn't crash immediately?
  // But neon requires a string.
  const connectionString = dbUrl || "postgresql://localhost:5432/postgres";

  const sql = neon(connectionString);
  dbInstance = drizzle(sql, { schema });
  return dbInstance;
}

// Proxy to make 'db.select()' etc. work seamlessly
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get: (_target, prop) => {
    const instance = getDb();
    return (instance as any)[prop];
  }
});

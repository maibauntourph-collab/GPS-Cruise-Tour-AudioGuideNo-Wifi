import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * [연구소장 노트: 데이터베이스 헬스체크 서비스]
 * 
 * 서버가 구동될 때 DB와의 연결이 물리적으로 살아있는지 확인하는 안전장치입니다.
 * 단순한 URL 존재 여부뿐만 아니라, 실제 쿼리(SELECT 1)를 통해 응답 속도와 상태를 점검합니다.
 */
export class DbCheckService {
       async checkConnection(): Promise<{ status: 'healthy' | 'unhealthy'; latency: number; error?: string }> {
              const start = Date.now();
              try {
                     // 가장 가벼운 쿼리로 연결 확인
                     await db.execute(sql`SELECT 1`);
                     const latency = Date.now() - start;

                     console.log(`[DB Health] Connection is healthy. Latency: ${latency}ms`);
                     return { status: 'healthy', latency };
              } catch (error: any) {
                     console.error("[DB Health] Connection check failed:", error.message);
                     return {
                            status: 'unhealthy',
                            latency: Date.now() - start,
                            error: error.message
                     };
              }
       }
}

export const dbCheckService = new DbCheckService();

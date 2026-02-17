// [연구소장 긴급 수정: 환경 변수 로딩 순서 보정]
// import 대신 require를 사용하여 dotenv를 최상단에서 강제 로드합니다.
require('dotenv').config();

import { pool } from '../server/db';

async function testConnection() {
       console.log("🔍 [V2] DB Connection Diagnostic Start...");

       const dbUrl = process.env.DATABASE_URL;
       if (!dbUrl) {
              console.error("❌ ERROR: DATABASE_URL is STILL MISSING after dotenv.config()");
              process.exit(1);
       }

       const maskedUrl = dbUrl.replace(/:([^@]+)@/, ':****@');
       console.log("Target URL: ", maskedUrl);

       // 환경 감지 로직 재검증
       if (dbUrl.includes('neon.tech')) {
              console.log("✅ Cloud Neon environment detected in DATABASE_URL.");
       } else {
              console.warn("⚠️ DATABASE_URL does not seem to be a Neon URL.");
       }

       try {
              const start = Date.now();
              console.log("⌛ Connecting to database pool...");
              const client = await pool.connect();
              console.log(`✅ Connected successfully in ${Date.now() - start}ms`);

              console.log("📡 Executing test query: SELECT NOW()");
              const res = await client.query('SELECT NOW() as current_time, current_database() as db_name');
              console.log("📊 Query Result:", res.rows[0]);

              client.release();
              console.log("🔓 Client released back to pool.");

              console.log("✨ Diagnostic Complete: DATABASE IS HEALTHY");
              process.exit(0);
       } catch (err: any) {
              console.error("❌ CRITICAL: Database Connection Failed!");
              console.error("Error Message:", err.message);
              process.exit(1);
       }
}

testConnection();

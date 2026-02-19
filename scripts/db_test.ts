import dotenv from 'dotenv';
dotenv.config();

import { pool } from '../server/db';
import { log } from '../server/vite';

async function testConnection() {
       console.log("🔍 DB Connection Diagnostic Start...");
       console.log("Environment: ", process.env.NODE_ENV || 'development');

       if (!process.env.NOWIFIGPSTOURS) {
              console.error("❌ ERROR: NOWIFIGPSTOURS is not defined in .env");
              process.exit(1);
       }

       const maskedUrl = process.env.NOWIFIGPSTOURS.replace(/:([^@]+)@/, ':****@');
       console.log("Target URL: ", maskedUrl);

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
              console.error("Error Name:", err.name);
              console.error("Error Message:", err.message);
              console.error("Error Detail:", err.detail || 'None');
              console.error("Error Stack:", err.stack);

              if (err.message.includes('SSL')) {
                     console.log("💡 TIP: SSL/TLS certificate issue detected. Check PGSSLMODE or sslmode query param.");
              }

              process.exit(1);
       }
}

testConnection();

import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';

async function migrate() {
    const connectionString = process.env.NOWIFIGPSTOURS;
    if (!connectionString) {
        console.error("❌ NOWIFIGPSTOURS 환경변수가 설정되어 있지 않습니다.");
        process.exit(1);
    }

    const client = new Client({
        connectionString,
    });

    try {
        await client.connect();
        console.log("✅ DB 연결 성공");

        const sqlPath = path.resolve('migrations/0001_add_i18n_columns.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log("🚀 마이그레이션 SQL 실행 중...");
        await client.query(sql);
        console.log("✨ 마이그레이션 및 데이터 이관 완료!");

    } catch (err) {
        console.error("❌ 마이그레이션 오류:", err);
    } finally {
        await client.end();
    }
}

migrate();

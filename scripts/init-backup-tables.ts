import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function initHistoricalBackupTables() {
    console.log("🛠️ [Query Master] 날짜별 이력 관리 백업 테이블 구축 시작...");

    try {
        // 기존 테이블 삭제 (구 구조 제거)
        console.log("⚠️ 기존 백업 테이블 정리 중...");
        await db.execute(sql`DROP TABLE IF EXISTS cities_backup;`);
        await db.execute(sql`DROP TABLE IF EXISTS landmarks_backup;`);

        // cities_backup 테이블 생성 (backup_id 추가 및 복합 PK/Serial 활용)
        await db.execute(sql`
            CREATE TABLE cities_backup (
                backup_record_id SERIAL PRIMARY KEY,
                id varchar NOT NULL,
                name varchar NOT NULL,
                country varchar NOT NULL,
                lat double precision NOT NULL,
                lng double precision NOT NULL,
                zoom integer DEFAULT 14,
                cruise_port json,
                landing_content json,
                default_guide_id varchar,
                backup_at timestamp NOT NULL DEFAULT now()
            );
        `);
        console.log("✅ cities_backup (Historical) 테이블 준비 완료.");

        // landmarks_backup 테이블 생성 (backup_id 추가)
        await db.execute(sql`
            CREATE TABLE landmarks_backup (
                backup_record_id SERIAL PRIMARY KEY,
                id varchar NOT NULL,
                city_id varchar NOT NULL,
                name varchar NOT NULL,
                lat double precision NOT NULL,
                lng double precision NOT NULL,
                radius integer NOT NULL,
                narration text NOT NULL,
                description text,
                category varchar,
                detailed_description text,
                photos json,
                historical_info text,
                year_built varchar,
                architect varchar,
                translations json,
                opening_hours varchar,
                price_range varchar,
                cuisine varchar,
                reservation_url varchar,
                phone_number varchar,
                menu_highlights json,
                restaurant_photos json,
                payment_methods json,
                is_premium boolean NOT NULL DEFAULT false,
                price double precision,
                backup_at timestamp NOT NULL DEFAULT now()
            );
        `);
        console.log("✅ landmarks_backup (Historical) 테이블 준비 완료.");

        // update_stats 테이블 생성
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS update_stats (
                id SERIAL PRIMARY KEY,
                date varchar UNIQUE NOT NULL,
                total_countries integer NOT NULL,
                total_regions integer NOT NULL,
                new_countries integer NOT NULL DEFAULT 0,
                new_regions integer NOT NULL DEFAULT 0,
                created_at timestamp NOT NULL DEFAULT now()
            );
        `);
        console.log("✅ update_stats 테이블 준비 완료.");

        console.log("\n🎉 날짜별 이력 관리가 가능한 백업 클러스터 인프라가 재구축되었습니다.");

    } catch (error) {
        console.error("❌ 테이블 생성 중 오류 발생:", error);
    }
}

initHistoricalBackupTables().then(() => process.exit(0)).catch(console.error);

import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function initBackupTables() {
    console.log("🛠️ [Query Master] 백업 테이블 수동 생성 시작...");

    try {
        // cities_backup 테이블 생성
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS cities_backup (
                id varchar PRIMARY KEY,
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
        console.log("✅ cities_backup 테이블 준비 완료.");

        // landmarks_backup 테이블 생성
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS landmarks_backup (
                id varchar PRIMARY KEY,
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
        console.log("✅ landmarks_backup 테이블 준비 완료.");

        console.log("\n🎉 백업 클러스터 인프라가 구축되었습니다.");

    } catch (error) {
        console.error("❌ 테이블 생성 중 오류 발생:", error);
    }
}

initBackupTables().then(() => process.exit(0)).catch(console.error);

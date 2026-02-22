import "dotenv/config";
import { db } from "../server/db";
import { cities, landmarks } from "../shared/schema";
import { sql } from "drizzle-orm";

async function runHistoricalBackup() {
    const today = new Date().toISOString().split('T')[0];
    console.log(`💾 [Query Master] (${today}) Neon DB 날짜별 이력 백업 시작...`);

    try {
        // 1. 도시 데이터 백업 (추가 방식)
        console.log("📍 도시(Cities) 데이터 이력 기록 중...");
        const allCities = await db.select().from(cities);
        if (allCities.length > 0) {
            // 이력 관리이므로 TRUNCATE 하지 않음
            for (const city of allCities) {
                await db.execute(sql`
                    INSERT INTO cities_backup (id, name, country, lat, lng, zoom, cruise_port, landing_content, default_guide_id, backup_at)
                    VALUES (${city.id}, ${city.name}, ${city.country}, ${city.lat}, ${city.lng}, ${city.zoom}, ${JSON.stringify(city.cruisePort)}, ${JSON.stringify(city.landingContent)}, ${city.defaultGuideId}, now())
                `);
            }
        }
        console.log(`✅ ${allCities.length}개의 도시 정보 이력 저장 완료.`);

        // 2. 랜드마크 데이터 백업 (추가 방식)
        console.log("📍 랜드마크(Landmarks) 데이터 이력 기록 중...");
        const allLandmarks = await db.select().from(landmarks);
        if (allLandmarks.length > 0) {
            // 랜드마크는 데이터가 많으므로 루프 내에서 직접 쿼리 (또는 배치 처리)
            for (const l of allLandmarks) {
                await db.execute(sql`
                    INSERT INTO landmarks_backup (
                        id, city_id, name, lat, lng, radius, narration, description, category, 
                        detailed_description, photos, historical_info, year_built, architect, 
                        translations, opening_hours, price_range, cuisine, reservation_url, 
                        phone_number, menu_highlights, restaurant_photos, payment_methods, 
                        is_premium, price, backup_at
                    ) VALUES (
                        ${l.id}, ${l.cityId}, ${l.name}, ${l.lat}, ${l.lng}, ${l.radius}, ${l.narration}, ${l.description}, ${l.category},
                        ${l.detailedDescription}, ${JSON.stringify(l.photos)}, ${l.historicalInfo}, ${l.yearBuilt}, ${l.architect},
                        ${JSON.stringify(l.translations)}, ${l.openingHours}, ${l.priceRange}, ${l.cuisine}, ${l.reservationUrl},
                        ${l.phoneNumber}, ${JSON.stringify(l.menuHighlights)}, ${JSON.stringify(l.restaurantPhotos)}, ${JSON.stringify(l.paymentMethods)},
                        ${l.isPremium}, ${l.price}, now()
                    )
                `);
            }
        }
        console.log(`✅ ${allLandmarks.length}개의 랜드마크 정보 이력 저장 완료.`);

        // 3. 업데이트 통계 기록 (자동화 닥터 기능)
        console.log("📊 [자동화 닥터] 업데이트 통계 산출 중...");
        const countryResult = await db.execute(sql`SELECT count(DISTINCT country) as count FROM cities`);
        const totalCountries = Number(countryResult[0].count);
        const totalRegions = allCities.length;

        // 이전 기록 가져오기 (가장 최신)
        const prevStats = await db.execute(sql`SELECT * FROM update_stats ORDER BY id DESC LIMIT 1`);
        let newCountries = 0;
        let newRegions = 0;

        if (prevStats.length > 0) {
            newCountries = Math.max(0, totalCountries - Number(prevStats[0].total_countries));
            newRegions = Math.max(0, totalRegions - Number(prevStats[0].total_regions));
        }

        await db.execute(sql`
            INSERT INTO update_stats (date, total_countries, total_regions, new_countries, new_regions, created_at)
            VALUES (${today}, ${totalCountries}, ${totalRegions}, ${newCountries}, ${newRegions}, now())
            ON CONFLICT (date) DO UPDATE SET
                total_countries = EXCLUDED.total_countries,
                total_regions = EXCLUDED.total_regions,
                new_countries = EXCLUDED.new_countries,
                new_regions = EXCLUDED.new_regions
        `);

        console.log(`\n🎉 [${today}] 일자 데이터가 백업되었으며, 통계가 기록되었습니다.`);
        console.log(`🌍 현재 총 ${totalCountries}개국, ${totalRegions}개 지역 서비스 중 (오늘 +${newRegions} 지역)`);

    } catch (error) {
        console.error("❌ 백업 중 오류 발생:", error);
    }
}

runHistoricalBackup().then(() => process.exit(0)).catch(console.error);

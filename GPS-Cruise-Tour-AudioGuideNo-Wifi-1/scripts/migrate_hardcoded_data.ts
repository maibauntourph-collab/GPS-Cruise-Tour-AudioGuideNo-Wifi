import "dotenv/config";
import { db } from "../server/db";
import { cities, landmarks } from "../shared/schema";
import { CITIES } from "../server/data/cities";
import { LANDMARKS } from "../server/data/landmarks";
import { sql } from "drizzle-orm";

/**
 * 🛠️ [에이전트 적요]
 * - 서버 박 (Server Park): 인프라 및 실행 흐름 설계 (.env 환경 변수 로드 및 프로세스 종료 관리)
 * - 쿼리 마스터 (Query Master): 데이터 무결성을 위한 Upsert(onConflictDoUpdate) 로직 설계
 */

async function migrateData() {
       console.log("🚀 Starting data migration to Neon DB...");

       // --- [1. 도시 데이터 이관 (Cities Migration)] ---
       // 📍 쿼리 마스터: 부모 테이블인 도시 정보를 먼저 이관하여 참조 무결성을 확보합니다.
       console.log(`📍 Migrating ${CITIES.length} cities...`);
       for (const city of CITIES) {
              try {
                     await db.insert(cities).values({
                            id: city.id,
                            name: city.name,
                            country: city.country,
                            lat: city.lat.toString(), // 쿼리 마스터: Decimal 정밀도 유지를 위해 string 변환
                            lng: city.lng.toString(),
                            zoom: city.zoom,
                            cruisePort: city.cruisePort,
                     }).onConflictDoUpdate({
                            target: cities.id, // 📍 핵심: 이미 동일 ID가 존재할 경우 최신 데이터로 업데이트(Upsert)
                            set: {
                                   name: city.name,
                                   country: city.country,
                                   lat: city.lat.toString(),
                                   lng: city.lng.toString(),
                                   zoom: city.zoom,
                                   cruisePort: city.cruisePort,
                            },
                     });
                     console.log(`✅ City: ${city.name} migrated.`);
              } catch (error) {
                     console.error(`❌ Failed to migrate city ${city.name}:`, error);
              }
       }

       // --- [2. 랜드마크 데이터 이관 (Landmarks Migration)] ---
       // 📍 서버 박: 대량의 랜드마크 데이터를 순차적으로 처리하며 안정적인 DB 트랜잭션을 유지합니다.
       console.log(`🏛️ Migrating ${LANDMARKS.length} landmarks...`);
       for (const landmark of LANDMARKS) {
              try {
                     await db.insert(landmarks).values({
                            id: landmark.id,
                            cityId: landmark.cityId,
                            name: landmark.name,
                            lat: landmark.lat.toString(),
                            lng: landmark.lng.toString(),
                            radius: landmark.radius,
                            narration: landmark.narration,
                            description: landmark.description,
                            category: landmark.category,
                            detailedDescription: landmark.detailedDescription,
                            photos: landmark.photos,
                            historicalInfo: landmark.historicalInfo,
                            yearBuilt: landmark.yearBuilt,
                            architect: landmark.architect,
                            translations: landmark.translations,
                     }).onConflictDoUpdate({
                            target: landmarks.id,
                            set: {
                                   cityId: landmark.cityId,
                                   name: landmark.name,
                                   lat: landmark.lat.toString(),
                                   lng: landmark.lng.toString(),
                                   radius: landmark.radius,
                                   narration: landmark.narration,
                                   description: landmark.description,
                                   category: landmark.category,
                                   detailedDescription: landmark.detailedDescription,
                                   photos: landmark.photos,
                                   historicalInfo: landmark.historicalInfo,
                                   yearBuilt: landmark.yearBuilt,
                                   architect: landmark.architect,
                                   translations: landmark.translations,
                            },
                     });
                     console.log(`✅ Landmark: ${landmark.name} (${landmark.cityId}) migrated.`);
              } catch (error) {
                     console.error(`❌ Failed to migrate landmark ${landmark.name}:`, error);
              }
       }

       console.log("✨ Data migration completed successfully!");
       process.exit(0); // 📍 서버 박: 리소스 회수를 위해 프로세스 명시적 종료
}

migrateData().catch((err) => {
       console.error("💥 Migration failed:", err);
       process.exit(1);
});

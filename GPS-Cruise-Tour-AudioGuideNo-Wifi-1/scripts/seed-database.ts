import { db } from "../server/db";
import { cities, landmarks, dataVersions } from "../shared/schema";

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    console.log('📍 Fetching data from storage...');
    const { storage } = await import('../server/storage');
    
    const allCities = await storage.getCities();
    const allLandmarks = await storage.getLandmarks();

    console.log(`📍 Seeding ${allCities.length} cities...`);
    for (const city of allCities) {
      await db.insert(cities).values({
        id: city.id,
        name: city.name,
        country: city.country,
        lat: city.lat,
        lng: city.lng,
        zoom: city.zoom || 14,
        cruisePort: city.cruisePort || null
      }).onConflictDoUpdate({
        target: cities.id,
        set: {
          name: city.name,
          country: city.country,
          lat: city.lat,
          lng: city.lng,
          zoom: city.zoom || 14,
          cruisePort: city.cruisePort || null,
          updatedAt: new Date()
        }
      });
    }
    console.log(`✅ Seeded ${allCities.length} cities`);

    console.log(`📍 Seeding ${allLandmarks.length} landmarks...`);
    for (const landmark of allLandmarks) {
      await db.insert(landmarks).values({
        id: landmark.id,
        cityId: landmark.cityId,
        name: landmark.name,
        lat: landmark.lat,
        lng: landmark.lng,
        radius: landmark.radius,
        narration: landmark.narration,
        description: landmark.description || null,
        category: landmark.category || null,
        detailedDescription: landmark.detailedDescription || null,
        photos: landmark.photos || null,
        historicalInfo: landmark.historicalInfo || null,
        yearBuilt: landmark.yearBuilt || null,
        architect: landmark.architect || null,
        translations: landmark.translations || null,
        openingHours: landmark.openingHours || null,
        priceRange: landmark.priceRange || null,
        cuisine: landmark.cuisine || null,
        reservationUrl: landmark.reservationUrl || null,
        phoneNumber: landmark.phoneNumber || null,
        menuHighlights: landmark.menuHighlights || null,
        restaurantPhotos: landmark.restaurantPhotos || null,
        paymentMethods: landmark.paymentMethods || null
      }).onConflictDoUpdate({
        target: landmarks.id,
        set: {
          cityId: landmark.cityId,
          name: landmark.name,
          lat: landmark.lat,
          lng: landmark.lng,
          radius: landmark.radius,
          narration: landmark.narration,
          description: landmark.description || null,
          category: landmark.category || null,
          detailedDescription: landmark.detailedDescription || null,
          photos: landmark.photos || null,
          historicalInfo: landmark.historicalInfo || null,
          yearBuilt: landmark.yearBuilt || null,
          architect: landmark.architect || null,
          translations: landmark.translations || null,
          openingHours: landmark.openingHours || null,
          priceRange: landmark.priceRange || null,
          cuisine: landmark.cuisine || null,
          reservationUrl: landmark.reservationUrl || null,
          phoneNumber: landmark.phoneNumber || null,
          menuHighlights: landmark.menuHighlights || null,
          restaurantPhotos: landmark.restaurantPhotos || null,
          paymentMethods: landmark.paymentMethods || null,
          updatedAt: new Date()
        }
      });
    }
    console.log(`✅ Seeded ${allLandmarks.length} landmarks`);

    console.log('📍 Setting data version...');
    await db.insert(dataVersions).values({
      entityType: 'all',
      version: 1
    }).onConflictDoNothing();
    console.log('✅ Data version set');

    // Log summary by city
    const citySummary: Record<string, number> = {};
    for (const landmark of allLandmarks) {
      citySummary[landmark.cityId] = (citySummary[landmark.cityId] || 0) + 1;
    }
    console.log('\n📊 Summary by city:');
    for (const [cityId, count] of Object.entries(citySummary)) {
      console.log(`   ${cityId}: ${count} landmarks`);
    }

    console.log('\n🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

seedDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

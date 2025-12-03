import { db } from "../server/db";
import { cities, landmarks, dataVersions } from "../shared/schema";
import { eq } from "drizzle-orm";

const CITIES_DATA = [
  {
    id: 'rome',
    name: 'Rome',
    country: 'Italy',
    lat: 41.9028,
    lng: 12.4964,
    zoom: 14,
    cruisePort: {
      portName: 'Civitavecchia',
      distanceFromCity: '80km from Rome',
      recommendedDuration: '8-10 hours',
      recommendedLandmarks: ['colosseum', 'trevi_fountain', 'pantheon', 'spanish_steps', 'vatican_museums'],
      tips: 'Book your transport in advance. The train from Civitavecchia to Rome takes about 1 hour. Consider a private shuttle for more flexibility.',
      portCoordinates: { lat: 42.0934, lng: 11.7879 },
      transportOptions: [
        {
          type: 'train',
          name: 'Civitavecchia Express',
          from: 'Civitavecchia Port Station',
          to: 'Roma Termini',
          duration: '50-80 minutes',
          frequency: 'Every 30 minutes',
          price: '€5-15',
          bookingUrl: 'https://www.trenitalia.com',
          tips: 'The port station is a 10-minute shuttle ride from the cruise terminal.',
          translations: {
            en: { name: 'Civitavecchia Express', from: 'Civitavecchia Port Station', to: 'Roma Termini', duration: '50-80 minutes', frequency: 'Every 30 minutes', price: '€5-15', tips: 'The port station is a 10-minute shuttle ride from the cruise terminal.' },
            ko: { name: '치비타베키아 익스프레스', from: '치비타베키아 항구역', to: '로마 테르미니', duration: '50-80분', frequency: '30분 간격', price: '€5-15', tips: '항구역은 크루즈 터미널에서 셔틀로 10분 거리입니다.' },
            it: { name: 'Civitavecchia Express', from: 'Stazione Porto Civitavecchia', to: 'Roma Termini', duration: '50-80 minuti', frequency: 'Ogni 30 minuti', price: '€5-15', tips: 'La stazione portuale è a 10 minuti di navetta dal terminal crociere.' }
          }
        },
        {
          type: 'shuttle',
          name: 'Rome Shore Excursion Shuttle',
          from: 'Civitavecchia Cruise Terminal',
          to: 'Vatican / Spanish Steps',
          duration: '90-120 minutes',
          price: '€20-35 per person',
          bookingUrl: 'https://www.getyourguide.com',
          tips: 'Pre-book online for guaranteed spots. Includes drop-off at key tourist areas.',
          translations: {
            en: { name: 'Rome Shore Excursion Shuttle', from: 'Civitavecchia Cruise Terminal', to: 'Vatican / Spanish Steps', duration: '90-120 minutes', price: '€20-35 per person', tips: 'Pre-book online for guaranteed spots.' },
            ko: { name: '로마 기항지 관광 셔틀', from: '치비타베키아 크루즈 터미널', to: '바티칸 / 스페인 광장', duration: '90-120분', price: '1인당 €20-35', tips: '좌석 확보를 위해 온라인으로 미리 예약하세요.' },
            it: { name: 'Navetta Escursioni Roma', from: 'Terminal Crociere Civitavecchia', to: 'Vaticano / Piazza di Spagna', duration: '90-120 minuti', price: '€20-35 a persona', tips: 'Prenotate online per posti garantiti.' }
          }
        },
        {
          type: 'taxi',
          name: 'Licensed Taxi',
          from: 'Civitavecchia Port',
          to: 'Rome City Center',
          duration: '60-90 minutes',
          price: '€120-150 fixed rate',
          tips: 'Use only official white taxis. Fixed rate to Rome center should be displayed.',
          translations: {
            en: { name: 'Licensed Taxi', from: 'Civitavecchia Port', to: 'Rome City Center', duration: '60-90 minutes', price: '€120-150 fixed rate', tips: 'Use only official white taxis.' },
            ko: { name: '공인 택시', from: '치비타베키아 항구', to: '로마 시내', duration: '60-90분', price: '€120-150 정액', tips: '공식 흰색 택시만 이용하세요.' },
            it: { name: 'Taxi Autorizzato', from: 'Porto Civitavecchia', to: 'Centro Roma', duration: '60-90 minuti', price: '€120-150 tariffa fissa', tips: 'Usate solo taxi bianchi ufficiali.' }
          }
        },
        {
          type: 'rideshare',
          name: 'Uber / Bolt',
          from: 'Civitavecchia Port Area',
          to: 'Rome',
          duration: '60-90 minutes',
          price: '€80-120 estimated',
          tips: 'Download Uber or Bolt app before arrival. Service may be limited at the port.',
          translations: {
            en: { name: 'Uber / Bolt', from: 'Civitavecchia Port Area', to: 'Rome', duration: '60-90 minutes', price: '€80-120 estimated', tips: 'Download Uber or Bolt app before arrival.' },
            ko: { name: 'Uber / Bolt', from: '치비타베키아 항구 지역', to: '로마', duration: '60-90분', price: '€80-120 예상', tips: '도착 전에 Uber 또는 Bolt 앱을 다운로드하세요.' },
            it: { name: 'Uber / Bolt', from: 'Area Porto Civitavecchia', to: 'Roma', duration: '60-90 minuti', price: '€80-120 stimati', tips: 'Scaricate l\'app Uber o Bolt prima dell\'arrivo.' }
          }
        }
      ],
      translations: {
        en: { portName: 'Civitavecchia', distanceFromCity: '80km from Rome', recommendedDuration: '8-10 hours', tips: 'Book your transport in advance. The train takes about 1 hour.' },
        ko: { portName: '치비타베키아', distanceFromCity: '로마에서 80km', recommendedDuration: '8-10시간', tips: '교통편을 미리 예약하세요. 기차로 약 1시간 소요됩니다.' },
        it: { portName: 'Civitavecchia', distanceFromCity: '80km da Roma', recommendedDuration: '8-10 ore', tips: 'Prenotate il trasporto in anticipo. Il treno impiega circa 1 ora.' }
      }
    }
  }
];

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    console.log('📍 Seeding cities...');
    for (const city of CITIES_DATA) {
      await db.insert(cities).values({
        id: city.id,
        name: city.name,
        country: city.country,
        lat: city.lat,
        lng: city.lng,
        zoom: city.zoom,
        cruisePort: city.cruisePort
      }).onConflictDoUpdate({
        target: cities.id,
        set: {
          name: city.name,
          country: city.country,
          lat: city.lat,
          lng: city.lng,
          zoom: city.zoom,
          cruisePort: city.cruisePort,
          updatedAt: new Date()
        }
      });
    }
    console.log(`✅ Seeded ${CITIES_DATA.length} cities`);

    console.log('📍 Fetching landmarks from storage...');
    const { storage } = await import('../server/storage');
    const allLandmarks = await storage.getLandmarks();
    
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

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

seedDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

// [학습 가이드: 외부 라이브러리 및 모듈 임포트]
// Express: 웹 서버 프레임워크 (V3 Stability Path)
// Drizzle-ORM: 데이터베이스 SQL 쿼리를 자바스크립트/타입스크립트 객체처럼 다루게 해주는 도구
// shared/schema: DB 테이블 정의 및 데이터 검증(Zod) 스키마를 프로젝트 전반에서 공유
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVisitedLandmarkSchema, Landmark } from "@shared/schema";
import { generateCityInfo, recommendTourItinerary } from "./lib/gemini";
import { generateAndSaveClovaTTS, CLOVA_VOICES, DEFAULT_CLOVA_VOICE_BY_LANGUAGE, ClovaVoiceId } from "./lib/clova";
import { db } from "./db";
import { cities, landmarks, dataVersions, tourSchedules, groupMembers, users, userIdentities, creatorEarnings, transactions, settlements, marketingContents } from "@shared/schema";
import { eq, desc, or, ilike, sql, count, and } from "drizzle-orm";
import crypto from "crypto";
import multer from "multer";
import * as XLSX from "xlsx";
import * as path from "path";
import * as fs from "fs";
import express from "express";
import Stripe from "stripe";
import { automationService } from "./services/automationService";
import { settlementService } from "./services/settlementService";
import { requireRole } from "./auth";

/**
 * [회계부장 노트: 금융 보안의 제1원칙]
 * 대표님, 결제 시스템을 다룰 때는 API 키 관리가 생명입니다.
 * STRIPE_SECRET_KEY는 절대로 코드에 직접 박으면 안 되고, 환경 변수(.env)로 관리해야 합니다.
 * ⚠️ [정산이 감사 수정] 하드코딩된 테스트 키 폴백을 제거했습니다.
 *    키가 없으면 서버 시작 시 즉시 에러를 발생시켜 보안 사고를 예방합니다.
 */
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("[회계부장 경고] ⚠️ STRIPE_SECRET_KEY 환경변수가 설정되지 않았습니다. 결제 기능이 비활성화됩니다.");
}
if (!process.env.STRIPE_WEBHOOK_SECRET) {
  console.warn("[회계부장 경고] ⚠️ STRIPE_WEBHOOK_SECRET 환경변수가 설정되지 않았습니다. 웹훅 서명 검증이 실패할 수 있습니다.");
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_will_fail", {
  apiVersion: "2023-10-16" as any, // 최신 API 버전을 사용하여 호환성을 확보합니다.
});

import { dbCheckService } from "./services/dbCheckService";

export async function registerRoutes(app: Express): Promise<Server> {
  // [연구소장 노트: 시스템 헬스체크]
  // 외부 모니터링 도구나 배포 플랫폼(Vercel 등)에서 앱의 상태를 점검할 수 있는 엔드포인트입니다.
  app.get("/api/health", async (_req, res) => {
    const health = await dbCheckService.checkConnection();
    res.status(health.status === 'healthy' ? 200 : 503).json(health);
  });

  // [Vercel Debug] 등록된 라우트 확인용 엔드포인트
  app.get("/api/debug-routes", (req, res) => {
    const routes: any[] = [];
    app._router.stack.forEach((middleware: any) => {
      if (middleware.route) { // routes registered directly on the app
        routes.push({
          path: middleware.route.path,
          methods: Object.keys(middleware.route.methods)
        });
      }
    });
    res.json({
      message: "Routes registered successfully",
      totalRoutes: routes.length,
      routes
    });
  });

  // [Vercel Debug] DB 연결 상세 진단 엔드포인트
  // 로컬에서는 되는데 배포 환경에서만 안 될 때, 정확한 에러 원인(DNS, Auth, Timeout 등)을 파악하기 위함입니다.
  app.get("/api/debug/db-connection", async (_req, res) => {
    try {
      const dbUrl = process.env.NOWIFIGPSTOURS;
      const hasDbUrl = !!dbUrl;
      const dbUrlPreview = hasDbUrl
        ? `${dbUrl?.substring(0, 15)}...${dbUrl?.substring(dbUrl.length - 10)}`
        : "Not Set";

      const start = Date.now();
      let connectionResult;
      let errorDetails = null;

      try {
        // 실제 쿼리 실행 시도
        const result = await db.execute(sql`SELECT NOW(), current_database(), current_user, version()`);
        connectionResult = result; // neon-http 결과는 배열 형태로 반환됨
      } catch (err: any) {
        errorDetails = {
          message: err.message,
          code: err.code,
          name: err.name,
          stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
          hint: err.hint // Postgres 에러 힌트
        };
      }

      res.json({
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasDatabaseUrl: hasDbUrl,
          dbUrlPreview: dbUrlPreview,
          isNeon: process.env.NOWIFIGPSTOURS?.includes('neon'),
        },
        connection: {
          success: !errorDetails,
          latency: Date.now() - start,
          result: connectionResult,
          error: errorDetails
        },
        timestamp: new Date().toISOString()
      });
    } catch (criticalError: any) {
      res.status(500).json({ error: "Debug endpoint failed", details: criticalError.message });
    }
  });
  // [적요: 도시 목록 조회 API]
  // 데이터베이스에 저장된 모든 도시 정보를 배열로 반환합니다.
  app.get("/api/cities", async (req, res) => {
    try {
      const cities = await storage.getCities();
      res.json(cities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cities" });
    }
  });

  app.get("/api/cities/:id", async (req, res) => {
    try {
      const city = await storage.getCity(req.params.id);
      if (!city) {
        return res.status(404).json({ error: "City not found" });
      }
      res.json(city);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch city" });
    }
  });

  // [적요: 특정 도시의 랜드마크(명소) 목록 조회 API]
  // 쿼리 파라미터(?cityId=...)가 있으면 해당 도시의 명소만 필터링합니다.
  app.get("/api/landmarks", async (req, res) => {
    try {
      const cityId = req.query.cityId as string | undefined;
      const landmarks = await storage.getLandmarks(cityId);
      res.json(landmarks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch landmarks" });
    }
  });

  app.get("/api/landmarks/:id", async (req, res) => {
    try {
      const landmark = await storage.getLandmark(req.params.id);
      if (!landmark) {
        return res.status(404).json({ error: "Landmark not found" });
      }

      // [적요: 명소 상세와 함께 가이드 리스트 정보도 반환합니다]
      const guides = await storage.getLandmarkGuides(req.params.id);

      res.json({
        ...landmark,
        guides: guides.map(g => ({
          id: g.id,
          userId: g.userId,
          narration: g.narration,
          description: g.description,
          detailedDescription: g.detailedDescription,
          translations: g.translations,
          updatedAt: g.updatedAt
        }))
      });
    } catch (error) {
      console.error("[Landmark Detail Error]", error);
      res.status(500).json({ error: "Failed to fetch landmark" });
    }
  });

  // [적요: 특정 명소의 가이드 목록만 별도 조회]
  app.get("/api/landmarks/:id/guides", async (req, res) => {
    try {
      const guides = await storage.getLandmarkGuides(req.params.id);
      res.json(guides);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch guides" });
    }
  });

  // Visited landmarks routes
  app.post("/api/visited", async (req, res) => {
    try {
      const validatedData = insertVisitedLandmarkSchema.parse(req.body);
      const visited = await storage.markLandmarkVisited(
        validatedData.landmarkId,
        validatedData.sessionId || undefined
      );
      res.json(visited);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid request data" });
      }
      res.status(500).json({ error: "Failed to mark landmark as visited" });
    }
  });

  app.get("/api/visited", async (req, res) => {
    try {
      const sessionId = req.query.sessionId as string | undefined;
      const visited = await storage.getVisitedLandmarks(sessionId);
      res.json(visited);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch visited landmarks" });
    }
  });

  app.get("/api/visited/count", async (req, res) => {
    try {
      const sessionId = req.query.sessionId as string | undefined;
      const count = await storage.getVisitedCount(sessionId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to get visited count" });
    }
  });

  // [적요: 특정 장소 방문 여부 확인 API]
  // 특정 랜드마크를 방문했는지 세션 ID를 기준으로 확인합니다.
  app.get("/api/visited/:landmarkId", async (req, res) => {
    try {
      const sessionId = req.query.sessionId as string | undefined;
      const isVisited = await storage.isLandmarkVisited(req.params.landmarkId, sessionId);
      res.json({ visited: isVisited });
    } catch (error) {
      res.status(500).json({ error: "Failed to check if landmark is visited" });
    }
  });

  // [학습 가이드: 오프라인 패키지 API]
  // 이 시스템의 핵심 기능 중 하나인 '인터넷 없는 GPS 안내'를 위해
  // 특정 도시의 모든 명소와 버전 정보를 하나의 JSON 패키지로 만들어 다운로드하게 해줍니다.
  app.get("/api/offline-package/:cityId", async (req, res) => {
    try {
      const { cityId } = req.params;
      const clientEtag = req.headers['if-none-match'];

      // Fetch city data from database
      const [cityData] = await db.select().from(cities).where(eq(cities.id, cityId));
      if (!cityData) {
        return res.status(404).json({ error: "City not found" });
      }

      // Fetch all landmarks for this city from database
      const cityLandmarks = await db.select().from(landmarks).where(eq(landmarks.cityId, cityId));

      // Get current data version
      const [versionRecord] = await db.select().from(dataVersions).where(eq(dataVersions.entityType, 'all'));
      const version = versionRecord?.version || 1;

      // Create package data
      const packageData = {
        city: {
          id: cityData.id,
          name: cityData.name,
          country: cityData.country,
          lat: cityData.lat,
          lng: cityData.lng,
          zoom: cityData.zoom || 14,
          cruisePort: cityData.cruisePort
        },
        landmarks: cityLandmarks.map(l => ({
          id: l.id,
          cityId: l.cityId,
          name: l.name,
          lat: l.lat,
          lng: l.lng,
          radius: l.radius,
          narration: l.narration,
          description: l.description,
          category: l.category,
          detailedDescription: l.detailedDescription,
          photos: l.photos,
          historicalInfo: l.historicalInfo,
          yearBuilt: l.yearBuilt,
          architect: l.architect,
          translations: l.translations,
          openingHours: l.openingHours,
          priceRange: l.priceRange,
          cuisine: l.cuisine,
          reservationUrl: l.reservationUrl,
          phoneNumber: l.phoneNumber,
          menuHighlights: l.menuHighlights,
          restaurantPhotos: l.restaurantPhotos,
          paymentMethods: l.paymentMethods,
          isPremium: l.isPremium,
          price: l.price
        })),
        version,
        downloadedAt: new Date().toISOString()
      };

      // [교육용 주석: 콘텐츠의 고유 해시(ETag) 생성]
      // 데이터 버전, 도시 ID, 랜드마크 개수 등을 조합하여 데이터 부피를 나타내는 해시를 만듭니다.
      const contentHash = crypto
        .createHash('md5')
        .update(JSON.stringify({ version, cityId, count: cityLandmarks.length }))
        .digest('hex');
      const etag = `"${contentHash}"`;

      // [교육용 주석: ETag를 이용한 캐시 제어]
      // 서버 부하를 줄이기 위해, 데이터 내용이 바뀌지 않았다면 304 Not Modified를 반환하여
      // 클라이언트가 이미 가지고 있는 데이터를 그대로 쓰게 합니다.
      if (clientEtag === etag) {
        return res.status(304).end();
      }

      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', 'private, max-age=3600');
      res.json(packageData);
    } catch (error) {
      console.error("[Offline Package Error]", error);
      res.status(500).json({ error: "Failed to generate offline package" });
    }
  });

  // Get all available cities for offline download
  app.get("/api/offline-package", async (req, res) => {
    try {
      const allCities = await db.select({
        id: cities.id,
        name: cities.name,
        country: cities.country
      }).from(cities);

      // Get landmark counts per city
      const citiesWithStats = await Promise.all(
        allCities.map(async (city) => {
          const cityLandmarks = await db.select().from(landmarks).where(eq(landmarks.cityId, city.id));
          return {
            ...city,
            landmarkCount: cityLandmarks.length
          };
        })
      );

      res.json(citiesWithStats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch available cities" });
    }
  });

  // [Debugging] AI Route exposed without strict admin check to resolve user session issues
  app.post("/api/admin/generate-city-info", async (req, res) => {
    try {
      const { query, language } = req.body;
      if (!query) {
        return res.status(400).json({ error: "City query is required" });
      }

      // Allow basic authenticated users in dev mode
      const session = (req as any).session;
      if ((!session || !session.userId) && process.env.NODE_ENV === 'production') {
        console.warn("[Admin AI] Unauthorized access blocked in production");
        return res.status(401).json({ error: "Unauthorized" });
      }

      console.log(`[Admin AI] Generating info for city: ${query}`);
      const cityInfo = await generateCityInfo(query, language || 'ko');

      res.json(cityInfo);
    } catch (error) {
      console.error('Failed to generate city info:', error);
      res.status(500).json({ error: "Failed to generate city info" });
    }
  });

  // Admin API Routes protected by admin role
  app.use("/api/admin", requireRole("admin"));

  // Admin: Get all cities from database
  app.get("/api/admin/cities", async (req, res) => {
    try {
      const allCities = await db.select().from(cities).orderBy(cities.name);
      res.json(allCities);
    } catch (error) {
      console.warn('[Admin] DB fetch failed for cities, falling back to storage:', error);
      try {
        const fallbackCities = await storage.getCities();
        res.json(fallbackCities);
      } catch (storageError) {
        res.status(500).json({ error: "Failed to fetch cities" });
      }
    }
  });


  // [Moved above admin middleware for debugging]
  // app.post("/api/admin/generate-city-info", ...);

  // Admin: Create a new city
  app.post("/api/admin/cities", async (req, res) => {
    try {
      const { id, name, country, lat, lng, zoom, cruisePort } = req.body;

      if (!id || !name || !country || lat === undefined || lng === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const newCity = await storage.createCity({
        id,
        name,
        country,
        lat,
        lng,
        zoom: zoom || 14,
        cruisePort: cruisePort || null
      });

      res.status(201).json(newCity);
    } catch (error: any) {
      console.error('Admin create city error:', error);
      if (error.code === '23505') {
        return res.status(409).json({ error: "City with this ID already exists" });
      }
      res.status(500).json({ error: "Failed to create city" });
    }
  });

  // Admin: Update a city
  app.put("/api/admin/cities/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, country, lat, lng, zoom, cruisePort } = req.body;

      const [updated] = await db.update(cities)
        .set({
          name,
          country,
          lat,
          lng,
          zoom: zoom || 14,
          cruisePort: cruisePort || null,
          updatedAt: new Date()
        })
        .where(eq(cities.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "City not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error('Admin update city error:', error);
      res.status(500).json({ error: "Failed to update city" });
    }
  });

  // Admin: Delete a city
  app.delete("/api/admin/cities/:id", async (req, res) => {
    try {
      const { id } = req.params;

      // Check if city has landmarks
      const cityLandmarks = await db.select().from(landmarks).where(eq(landmarks.cityId, id));
      if (cityLandmarks.length > 0) {
        return res.status(400).json({
          error: `Cannot delete city with ${cityLandmarks.length} landmarks. Delete landmarks first.`
        });
      }

      const [deleted] = await db.delete(cities).where(eq(cities.id, id)).returning();

      if (!deleted) {
        return res.status(404).json({ error: "City not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Admin delete city error:', error);
      res.status(500).json({ error: "Failed to delete city" });
    }
  });

  // Admin: Get all landmarks from database
  app.get("/api/admin/landmarks", async (req, res) => {
    try {
      const allLandmarks = await db.select().from(landmarks).orderBy(landmarks.name);
      res.json(allLandmarks);
    } catch (error) {
      console.warn('[Admin] DB fetch failed for landmarks, falling back to storage:', error);
      try {
        const cityId = req.query.cityId as string | undefined;
        const fallbackLandmarks = await storage.getLandmarks(cityId);
        res.json(fallbackLandmarks);
      } catch (storageError) {
        res.status(500).json({ error: "Failed to fetch landmarks" });
      }
    }
  });

  // Admin: Create a new landmark
  app.post("/api/admin/landmarks", async (req, res) => {
    try {
      const data = req.body;

      if (!data.id || !data.cityId || !data.name || data.lat === undefined || data.lng === undefined || !data.narration) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const newLandmark = await storage.createLandmark({
        id: data.id,
        cityId: data.cityId,
        name: data.name,
        lat: data.lat,
        lng: data.lng,
        radius: data.radius || 50,
        narration: data.narration,
        description: data.description || null,
        category: data.category || null,
        detailedDescription: data.detailedDescription || null,
        photos: data.photos || null,
        historicalInfo: data.historicalInfo || null,
        yearBuilt: data.yearBuilt || null,
        architect: data.architect || null,
        translations: data.translations || null,
        openingHours: data.openingHours || null,
        priceRange: data.priceRange || null,
        cuisine: data.cuisine || null,
        reservationUrl: data.reservationUrl || null,
        phoneNumber: data.phoneNumber || null,
        menuHighlights: data.menuHighlights || null,
        restaurantPhotos: data.restaurantPhotos || null,
        paymentMethods: data.paymentMethods || null
      });


      // [산업공학박사 팁] 명소 등록이 완료되었으니, 이제 쏭 프로의 마케팅 콘텐츠 생성을 백그라운드에서 시작합니다.
      // await를 붙이지 않아 응답 속도에 영향을 주지 않고 비동기로 처리합니다.
      /**
       * [마케터 쏭의 조언: 자동화는 비즈니스의 혁명입니다!]
       * 학생 여러분, 명소가 등록되자마자 마케팅 문구가 튀어나오는 마법이 여기서 시작됩니다.
       * .catch()를 붙인 이유는, 마케팅 문구 생성에 실패하더라도 
       * 명소 등록 자체가 취소되어서는 안 되기 때문이에요 (비동기 처리의 핵심!).
       */
      automationService.generatePromotionContent(newLandmark as unknown as Landmark).catch(err => {
        console.error("[Dr.'s Engine] 홍보 엔진 작동 중 작은 실수가 있었나봐요! 하지만 명소 등록은 성공입니다:", err);
      });

      res.status(201).json(newLandmark);
    } catch (error: any) {
      console.error('Admin create landmark error:', error);
      if (error.code === '23505') {
        return res.status(409).json({ error: "Landmark with this ID already exists" });
      }
      res.status(500).json({ error: "Failed to create landmark" });
    }
  });

  // Admin: Update a landmark
  app.put("/api/admin/landmarks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;

      const [updated] = await db.update(landmarks)
        .set({
          cityId: data.cityId,
          name: data.name,
          lat: data.lat,
          lng: data.lng,
          radius: data.radius || 50,
          narration: data.narration,
          description: data.description || null,
          category: data.category || null,
          detailedDescription: data.detailedDescription || null,
          photos: data.photos || null,
          historicalInfo: data.historicalInfo || null,
          yearBuilt: data.yearBuilt || null,
          architect: data.architect || null,
          translations: data.translations || null,
          openingHours: data.openingHours || null,
          priceRange: data.priceRange || null,
          cuisine: data.cuisine || null,
          reservationUrl: data.reservationUrl || null,
          phoneNumber: data.phoneNumber || null,
          menuHighlights: data.menuHighlights || null,
          restaurantPhotos: data.restaurantPhotos || null,
          paymentMethods: data.paymentMethods || null,
          isPremium: data.isPremium !== undefined ? data.isPremium : false,
          price: data.price || null,
          updatedAt: new Date()
        })
        .where(eq(landmarks.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Landmark not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error('Admin update landmark error:', error);
      res.status(500).json({ error: "Failed to update landmark" });
    }
  });

  // Admin: Delete a landmark
  app.delete("/api/admin/landmarks/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const [deleted] = await db.delete(landmarks).where(eq(landmarks.id, id)).returning();

      if (!deleted) {
        return res.status(404).json({ error: "Landmark not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Admin delete landmark error:', error);
      res.status(500).json({ error: "Failed to delete landmark" });
    }
  });

  // Admin: Get statistics
  app.get("/api/admin/stats", async (req, res) => {
    try {
      let allCities, allLandmarks;
      try {
        allCities = await db.select().from(cities);
        allLandmarks = await db.select().from(landmarks);
      } catch (dbError) {
        console.warn('[Admin] DB fetch failed for stats, falling back to storage:', dbError);
        allCities = await storage.getCities();
        allLandmarks = await storage.getLandmarks();
      }

      // Group by category
      const categories: Record<string, number> = {};
      for (const l of allLandmarks) {
        const cat = l.category || 'Uncategorized';
        categories[cat] = (categories[cat] || 0) + 1;
      }

      res.json({
        cities: allCities.length,
        landmarks: allLandmarks.length,
        categories
      });
    } catch (error) {
      console.error('Admin stats error:', error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Admin: AI Discover Landmarks
  // [학습 가이드: AI 장소 탐사(Discover) API]
  // 특정 도시 ID를 받아서 OpenAI(GPT)에게 그 도시의 명소와 생생한 이야기를 요청합니다.
  app.get("/api/admin/ai/discover", async (req, res) => {
    try {
      const { cityId } = req.query;
      if (!cityId || typeof cityId !== 'string') {
        return res.status(400).json({ error: "도시 ID(cityId)가 필요합니다." });
      }

      // 1. [쿼리 마스터/AI DB 총괄] 도시 정보 조회
      let city;
      try {
        const [dbCity] = await db.select().from(cities).where(eq(cities.id, cityId));
        city = dbCity;
      } catch (dbError) {
        console.warn(`[AI DB Manager] DB 연결 불안정, storage에서 도시 정보를 찾습니다: ${cityId}`);
        city = await storage.getCity(cityId);
      }

      if (!city) {
        return res.status(404).json({ error: "해당 도시를 찾을 수 없습니다." });
      }

      // 2. [오토메이션 박사] AI 자동 탐사 실행
      // AI는 좌표 정보와 함께 300자 이상의 풍부한 역사/문화 이야기를 생성합니다.
      console.log(`[Automation Doctor] Discovering landmarks for ${city.name}...`);
      const discoveredLandmarks = await automationService.discoverLandmarks(city.name);

      // 3. [AI DB 총괄] 중복 검사 로직 및 데이터 필터링
      let existingLandmarks;
      try {
        existingLandmarks = await db.select().from(landmarks).where(eq(landmarks.cityId, cityId));
      } catch (dbError) {
        console.warn(`[AI DB Manager] DB 연결 불안정, storage에서 기존 명소를 조회합니다.`);
        existingLandmarks = await storage.getLandmarks(cityId);
      }

      const result = discoveredLandmarks.map((discovered: any) => {
        const duplicate = existingLandmarks.find(existing =>
          existing.name.toLowerCase().includes(discovered.name.toLowerCase()) ||
          discovered.name.toLowerCase().includes(existing.name.toLowerCase())
        );

        return {
          ...discovered,
          isDuplicate: !!duplicate,
          existingLandmark: duplicate || null
        };
      });

      res.json(result);
    } catch (error) {
      console.error('[Automation Doctor] AI 탐사 중 오류:', error);
      res.status(500).json({ error: "AI 탐사 도중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." });
    }
  });

  // [학습 가이드: AI 생성 데이터 실제 반영(Apply) API]
  // 사용자가 AI 추천 목록 중 선택한 항목들을 실제 DB에 저장('확정')하는 단계입니다.
  app.post("/api/admin/ai/apply", async (req, res) => {
    try {
      const { cityId, selectedLandmarks } = req.body;
      if (!cityId || !selectedLandmarks || !Array.isArray(selectedLandmarks)) {
        return res.status(400).json({ error: "Invalid request data" });
      }

      const results = [];
      for (const data of selectedLandmarks) {
        // Generate a unique ID if not provided or to avoid conflicts
        const id = data.id || `${cityId}_${data.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;

        const [upserted] = await db.insert(landmarks).values({
          id,
          cityId,
          name: data.name,
          lat: data.lat,
          lng: data.lng,
          radius: 50,
          narration: data.narration,
          description: data.description || null,
          category: data.category || null,
          detailedDescription: data.detailedDescription || null,
          historicalInfo: data.historicalInfo || null
        })
          .onConflictDoUpdate({
            target: landmarks.id,
            set: {
              name: data.name,
              lat: data.lat,
              lng: data.lng,
              narration: data.narration,
              description: data.description || null,
              category: data.category || null,
              detailedDescription: data.detailedDescription || null,
              historicalInfo: data.historicalInfo || null,
              updatedAt: new Date()
            }
          })
          .returning();

        // 3. [교육용 주석: 리턴된 데이터 저장]
        results.push(upserted);

        // 4. [비동기 백그라운드 작업] 마케팅 문구(마케터 쏭) 생성을 별도로 트리거합니다.
        // await를 쓰지 않음으로써 사용자가 홍보 문구 생성을 기다리지 않게 처리했습니다.
        automationService.generatePromotionContent(upserted as any).catch(err => {
          console.error("[Admin AI] Background marketing generation failed:", err);
        });
      }

      res.json({ success: true, count: results.length, data: results });
    } catch (error) {
      console.error('Admin AI apply error:', error);
      res.status(500).json({ error: "데이터 적용 중 오류가 발생했습니다." });
    }
  });


  /**
   * [코다리부장 팁: 결제 세션 생성 API]
   * 대표님, 고객이 '구매하기' 버튼을 누르면 바로 결제창으로 보내는 게 아니라,
   * 서버에서 먼저 Stripe 세션을 만들어서 그 주소(URL)를 클라이언트에 전달해야 합니다.
   * 이렇게 하면 결제 금액 위조를 원천 봉쇄할 수 있죠!
   */
  app.post("/api/payments/create-checkout-session", async (req, res) => {
    try {
      const { landmarkId, creatorId, userId, amount, name } = req.body;

      // [회계부장 검토] 결제 요청 정보가 누락되지 않았는지 꼼꼼히 체크합니다.
      if (!landmarkId || !amount) {
        return res.status(400).json({ error: "필수 결제 정보가 누락되었습니다." });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'eur', // 우리 플랫폼은 유로화(EUR)를 기본으로 합니다.
            product_data: {
              name: name || "가이드 패키지 구매",
            },
            unit_amount: Math.round(amount * 100), // Stripe는 센트(cent) 단위를 사용하므로 100을 곱합니다.
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${req.headers.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/payment/cancel`,
        metadata: {
          landmarkId,
          creatorId,
          userId,
          amount: amount.toString()
        }
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("[코다리부장] 결제 세션 생성 중 에러 발생:", error);
      res.status(500).json({ error: "결제 세션을 생성하지 못했습니다." });
    }
  });

  // ===============================
  // [강의 섹션: 크리에이터 플랫폼 & 수익화]
  // 학생 여러분, 이제 우리 플랫폼의 주인공인 크리에이터들을 위한 관리 시스템을 만들어봅시다.
  // 이 섹션은 돈이 오가는 민감한 영역이므로, 데이터의 무결성과 보안을 최우선으로 해야 합니다.
  // ===============================

  /**
   * [정산이 감사 수정] ⚠️ 중복 라우트 제거
   * 기존에 여기(L693)에 인증 없는 /api/creator/stats가 있었으나,
   * L2533에 세션 인증 버전이 있어 중복이었습니다.
   * 인증 없이 크리에이터 수익이 노출되는 보안 문제가 있어 삭제했습니다.
   * → 인증된 버전은 아래 L2533의 /api/creator/stats를 사용하세요.
   */

  /**
   * [강의 노트: 결제 검증 및 수익 배분 자동화]
   * 자, 이 부분이 가장 중요합니다! 결제가 완료되면 시스템은 자동으로 크리에이터에게 지분을 나눠줘야 합니다.
   * 'Atomic'하게 처리하지 않으면 데이터 불일치가 발생할 수 있으니 트랜잭션 개념을 꼭 기억하세요.
   */
  app.post("/api/payments/verify", async (req, res) => {
    try {
      const { transactionId, userId, amount, creatorId } = req.body;

      // [잠깐!] 실제 현업에서는 여기서 PG사의 API를 호출하여 결제가 정말 성공했는지 "교차 검증"을 해야 합니다.
      // 지금은 검증이 통과되었다고 가정하고 로직을 진행하겠습니다.

      await db.transaction(async (tx) => {
        // 1. 거래 내역을 기록합니다.
        await tx.insert(transactions).values({
          userId,
          targetId: 'route-or-landmark-id',
          amount,
          status: 'completed',
          providerData: { verifiedAt: new Date().toISOString() }
        });

        // 2. 크리에이터의 수익을 업데이트합니다. (배분율 70% 가정)
        const creatorShare = amount * 0.7;
        const [existing] = await tx.select().from(creatorEarnings).where(eq(creatorEarnings.userId, creatorId));

        if (existing) {
          await tx.update(creatorEarnings)
            .set({
              totalBalance: sql`${creatorEarnings.totalBalance} + ${creatorShare}`,
              totalEarned: sql`${creatorEarnings.totalEarned} + ${creatorShare}`,
              updatedAt: new Date()
            })
            .where(eq(creatorEarnings.userId, creatorId));
        } else {
          await tx.insert(creatorEarnings).values({
            userId: creatorId,
            totalBalance: creatorShare,
            totalEarned: creatorShare
          });
        }
      });

      res.json({ success: true, message: "수익 배분이 완료되었습니다. 코다리부장님이 흡족해하십니다." });
    } catch (error) {
      console.error('[Critical Error] Payment Verification Failed:', error);
      res.status(500).json({ error: "결제 검증 오류가 발생했습니다." });
    }
  });

  // ===============================
  // Admin Import/Export Routes
  // ===============================

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
  });

  // Helper: Convert array to comma-separated string
  const arrayToString = (arr: any[] | null | undefined): string => {
    if (!arr || !Array.isArray(arr)) return '';
    return arr.join(', ');
  };

  // Helper: Convert comma-separated string to array
  const stringToArray = (str: string | null | undefined): string[] | null => {
    if (!str || typeof str !== 'string') return null;
    const trimmed = str.trim();
    if (!trimmed) return null;
    return trimmed.split(',').map(s => s.trim()).filter(Boolean);
  };

  // Helper: Safe JSON parse
  const safeJsonParse = (str: string | null | undefined): any => {
    if (!str || typeof str !== 'string') return null;
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  };

  // Admin: Download template
  app.get("/api/admin/template", async (req, res) => {
    try {
      const type = req.query.type as string || 'cities';
      const format = req.query.format as string || 'xlsx';

      let data: any[] = [];
      let filename = '';

      if (type === 'cities') {
        filename = `cities_template.${format}`;
        data = [{
          id: 'example_city',
          name: 'Example City',
          country: 'Country Name',
          lat: 41.9028,
          lng: 12.4964,
          zoom: 14,
          cruisePort: ''
        }];
      } else {
        filename = `landmarks_template.${format}`;
        data = [{
          id: 'example_landmark',
          cityId: 'example_city',
          name: 'Example Landmark',
          lat: 41.9028,
          lng: 12.4964,
          radius: 50,
          narration: 'Audio narration text that will be spoken when user approaches',
          description: 'Short description',
          category: 'Monument',
          detailedDescription: 'Detailed description for the info panel',
          photos: 'https://example.com/photo1.jpg, https://example.com/photo2.jpg',
          historicalInfo: 'Historical information',
          yearBuilt: '1900',
          architect: 'Architect Name',
          openingHours: 'Mon-Sun: 9:00-18:00',
          priceRange: '€€',
          cuisine: '',
          reservationUrl: '',
          phoneNumber: '',
          menuHighlights: '',
          paymentMethods: 'Card, Cash',
          translations: ''
        }];
      }

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, type === 'cities' ? 'Cities' : 'Landmarks');

      if (format === 'csv') {
        const csv = XLSX.utils.sheet_to_csv(ws);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
      } else {
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
      }
    } catch (error) {
      console.error('Template download error:', error);
      res.status(500).json({ error: "Failed to generate template" });
    }
  });

  // Admin: Export existing data
  app.get("/api/admin/export", async (req, res) => {
    try {
      const type = req.query.type as string || 'cities';
      const format = req.query.format as string || 'xlsx';

      let data: any[] = [];
      let filename = '';

      if (type === 'cities') {
        const allCities = await storage.getCities();
        filename = `cities_export_${Date.now()}.${format}`;
        data = allCities.map(c => ({
          id: c.id,
          name: c.name,
          country: c.country,
          lat: c.lat,
          lng: c.lng,
          zoom: c.zoom || 14,
          cruisePort: c.cruisePort ? JSON.stringify(c.cruisePort) : ''
        }));
      } else {
        const allLandmarks = await storage.getLandmarks();
        filename = `landmarks_export_${Date.now()}.${format}`;
        data = allLandmarks.map(l => ({
          id: l.id,
          cityId: l.cityId,
          name: l.name,
          lat: l.lat,
          lng: l.lng,
          radius: l.radius,
          narration: l.narration,
          description: l.description || '',
          category: l.category || '',
          detailedDescription: l.detailedDescription || '',
          photos: arrayToString(l.photos as string[] | null),
          historicalInfo: l.historicalInfo || '',
          yearBuilt: l.yearBuilt || '',
          architect: l.architect || '',
          openingHours: l.openingHours || '',
          priceRange: l.priceRange || '',
          cuisine: l.cuisine || '',
          reservationUrl: l.reservationUrl || '',
          phoneNumber: l.phoneNumber || '',
          menuHighlights: arrayToString(l.menuHighlights as string[] | null),
          paymentMethods: arrayToString(l.paymentMethods as string[] | null),
          translations: l.translations ? JSON.stringify(l.translations) : ''
        }));
      }

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, type === 'cities' ? 'Cities' : 'Landmarks');

      if (format === 'csv') {
        const csv = XLSX.utils.sheet_to_csv(ws);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
      } else {
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
      }
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  // Admin: Import data from file
  app.post("/api/admin/import", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const type = req.body.type as string;
      if (!type || !['cities', 'landmarks'].includes(type)) {
        return res.status(400).json({ error: "Invalid type. Must be 'cities' or 'landmarks'" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);

      if (rows.length === 0) {
        return res.status(400).json({ error: "File is empty or has no valid data" });
      }

      if (rows.length > 5000) {
        return res.status(400).json({ error: "Too many rows. Maximum 5000 rows allowed" });
      }

      const errors: { row: number; message: string }[] = [];
      let successCount = 0;

      if (type === 'cities') {
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rowNum = i + 2; // Excel row (1-indexed + header)

          // Validate required fields
          if (!row.id || typeof row.id !== 'string') {
            errors.push({ row: rowNum, message: 'Missing or invalid id' });
            continue;
          }
          if (!row.name || typeof row.name !== 'string') {
            errors.push({ row: rowNum, message: 'Missing or invalid name' });
            continue;
          }
          if (!row.country || typeof row.country !== 'string') {
            errors.push({ row: rowNum, message: 'Missing or invalid country' });
            continue;
          }

          const lat = parseFloat(row.lat);
          const lng = parseFloat(row.lng);
          if (isNaN(lat) || lat < -90 || lat > 90) {
            errors.push({ row: rowNum, message: 'Invalid latitude (must be -90 to 90)' });
            continue;
          }
          if (isNaN(lng) || lng < -180 || lng > 180) {
            errors.push({ row: rowNum, message: 'Invalid longitude (must be -180 to 180)' });
            continue;
          }

          try {
            // Upsert: try insert, update on conflict
            const existing = await db.select().from(cities).where(eq(cities.id, row.id.toString().trim()));
            const cityData = {
              id: row.id.toString().trim(),
              name: row.name.toString().trim(),
              country: row.country.toString().trim(),
              lat,
              lng,
              zoom: parseInt(row.zoom) || 14,
              cruisePort: safeJsonParse(row.cruisePort)
            };

            if (existing.length > 0) {
              await db.update(cities).set({ ...cityData, updatedAt: new Date() }).where(eq(cities.id, cityData.id));
            } else {
              await db.insert(cities).values(cityData);
            }
            successCount++;
          } catch (dbError: any) {
            errors.push({ row: rowNum, message: `Database error: ${dbError.message}` });
          }
        }
      } else {
        // Landmarks import
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rowNum = i + 2;

          // Validate required fields
          if (!row.id || typeof row.id !== 'string') {
            errors.push({ row: rowNum, message: 'Missing or invalid id' });
            continue;
          }
          if (!row.cityId) {
            errors.push({ row: rowNum, message: 'Missing cityId' });
            continue;
          }
          if (!row.name) {
            errors.push({ row: rowNum, message: 'Missing name' });
            continue;
          }
          if (!row.narration) {
            errors.push({ row: rowNum, message: 'Missing narration' });
            continue;
          }

          const lat = parseFloat(row.lat);
          const lng = parseFloat(row.lng);
          const radius = parseInt(row.radius) || 50;

          if (isNaN(lat) || lat < -90 || lat > 90) {
            errors.push({ row: rowNum, message: 'Invalid latitude' });
            continue;
          }
          if (isNaN(lng) || lng < -180 || lng > 180) {
            errors.push({ row: rowNum, message: 'Invalid longitude' });
            continue;
          }
          if (radius <= 0) {
            errors.push({ row: rowNum, message: 'Radius must be positive' });
            continue;
          }

          // Check if cityId exists
          const cityExists = await db.select().from(cities).where(eq(cities.id, row.cityId.toString().trim()));
          if (cityExists.length === 0) {
            errors.push({ row: rowNum, message: `City '${row.cityId}' does not exist` });
            continue;
          }

          try {
            const existing = await db.select().from(landmarks).where(eq(landmarks.id, row.id.toString().trim()));
            const landmarkData = {
              id: row.id.toString().trim(),
              cityId: row.cityId.toString().trim(),
              name: row.name.toString().trim(),
              lat,
              lng,
              radius,
              narration: row.narration.toString(),
              description: row.description?.toString() || null,
              category: row.category?.toString() || null,
              detailedDescription: row.detailedDescription?.toString() || null,
              photos: stringToArray(row.photos?.toString()),
              historicalInfo: row.historicalInfo?.toString() || null,
              yearBuilt: row.yearBuilt?.toString() || null,
              architect: row.architect?.toString() || null,
              openingHours: row.openingHours?.toString() || null,
              priceRange: row.priceRange?.toString() || null,
              cuisine: row.cuisine?.toString() || null,
              reservationUrl: row.reservationUrl?.toString() || null,
              phoneNumber: row.phoneNumber?.toString() || null,
              menuHighlights: stringToArray(row.menuHighlights?.toString()),
              paymentMethods: stringToArray(row.paymentMethods?.toString()),
              translations: safeJsonParse(row.translations?.toString())
            };

            if (existing.length > 0) {
              await db.update(landmarks).set({ ...landmarkData, updatedAt: new Date() }).where(eq(landmarks.id, landmarkData.id));
            } else {
              await db.insert(landmarks).values(landmarkData);
            }
            successCount++;
          } catch (dbError: any) {
            errors.push({ row: rowNum, message: `Database error: ${dbError.message}` });
          }
        }
      }

      res.json({
        success: true,
        imported: successCount,
        total: rows.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error: any) {
      console.error('Import error:', error);
      res.status(500).json({ error: error.message || "Failed to import data" });
    }
  });

  // AI tour recommendation route
  app.post("/api/ai/recommend-tour", async (req, res) => {
    try {
      const { cityId, language, userPosition, filterType } = req.body;

      if (!cityId) {
        return res.status(400).json({ error: "City ID is required" });
      }

      let landmarks = await storage.getLandmarks(cityId);

      // Apply category filter if specified
      if (filterType && filterType !== 'all') {
        switch (filterType) {
          case 'landmarks':
            landmarks = landmarks.filter(l =>
              l.category !== 'Activity' &&
              l.category !== 'Restaurant' &&
              l.category !== 'Gift Shop'
            );
            break;
          case 'restaurants':
            landmarks = landmarks.filter(l => l.category === 'Restaurant');
            break;
          case 'activities':
            landmarks = landmarks.filter(l => l.category === 'Activity');
            break;
        }
      }

      if (landmarks.length === 0) {
        return res.status(404).json({ error: "No landmarks found for this city with the selected filter" });
      }

      const recommendation = await recommendTourItinerary(
        landmarks,
        userPosition,
        language || 'en'
      );

      // Validate that all recommended landmark IDs exist in the database
      const validLandmarkIds = new Set(landmarks.map(l => l.id));
      const invalidIds = recommendation.itinerary
        .map(item => item.landmarkId)
        .filter(id => !validLandmarkIds.has(id));

      if (invalidIds.length > 0) {
        console.error('AI recommended invalid landmark IDs:', invalidIds);
        return res.status(500).json({
          error: "AI recommendation contains invalid landmarks",
          details: invalidIds
        });
      }

      res.json(recommendation);
    } catch (error: any) {
      console.error('AI recommendation error:', error);

      // Pass through specific error messages from OpenAI service
      const errorMessage = error.message || "Failed to generate AI recommendation";
      res.status(500).json({ error: errorMessage });
    }
  });

  // ========== Audio TTS Routes ==========

  // Serve static audio files
  app.use('/uploads/audio', express.static(path.join(process.cwd(), 'uploads', 'audio')));

  // Get available TTS voices (CLOVA Voice)
  app.get("/api/audio/voices", (req, res) => {
    res.json({
      voices: CLOVA_VOICES,
      defaults: DEFAULT_CLOVA_VOICE_BY_LANGUAGE
    });
  });

  // Generate audio for a landmark using CLOVA Voice TTS
  app.post("/api/audio/generate", async (req, res) => {
    try {
      const { landmarkId, language, voiceId, text: providedText } = req.body;

      if (!landmarkId) {
        return res.status(400).json({ error: "Landmark ID is required" });
      }

      // Get landmark to fetch narration text
      const landmark = await storage.getLandmark(landmarkId);
      if (!landmark) {
        return res.status(404).json({ error: "Landmark not found" });
      }

      // Get text in the requested language
      const lang = language || 'en';
      let text = providedText || landmark.narration || '';

      // Check for translated narration if no text provided
      if (!providedText && landmark.translations && landmark.translations[lang]) {
        text = landmark.translations[lang].narration || landmark.translations[lang].description || text;
      }

      if (!text) {
        return res.status(400).json({ error: "No narration text available for this landmark" });
      }

      // Determine voice: user preference or language default
      const selectedVoice = (voiceId && CLOVA_VOICES[voiceId as ClovaVoiceId])
        ? voiceId as ClovaVoiceId
        : DEFAULT_CLOVA_VOICE_BY_LANGUAGE[lang] || 'clara';

      // Check if audio already exists with same voice
      const existingAudio = await storage.getAudio(landmarkId, lang);
      if (existingAudio && existingAudio.voiceId === selectedVoice) {
        return res.json(existingAudio);
      }

      // Generate new audio using CLOVA Voice TTS
      const audioResult = await generateAndSaveClovaTTS(landmarkId, text, lang, selectedVoice);

      // Estimate duration (rough estimate: ~150 chars per second for speech)
      const duration = Math.ceil(text.length / 15);

      // Save to database
      const savedAudio = await storage.saveAudio({
        landmarkId,
        language: lang,
        audioUrl: audioResult.audioUrl,
        duration,
        sizeBytes: audioResult.sizeBytes,
        checksum: audioResult.checksum,
        voiceId: audioResult.voiceId
      });

      res.json(savedAudio);
    } catch (error: any) {
      console.error('CLOVA Audio generation error:', error);
      res.status(500).json({ error: error.message || "Failed to generate audio with CLOVA Voice" });
    }
  });

  // Get audio for a landmark
  app.get("/api/audio/:landmarkId", async (req, res) => {
    try {
      const { landmarkId } = req.params;
      const language = (req.query.language as string) || 'en';

      const audio = await storage.getAudio(landmarkId, language);
      if (!audio) {
        return res.status(404).json({ error: "Audio not found" });
      }

      res.json(audio);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch audio" });
    }
  });

  // Get all audio for a city (for offline download)
  app.get("/api/audio/city/:cityId", async (req, res) => {
    try {
      const { cityId } = req.params;
      const audioList = await storage.getAudioByCity(cityId);
      res.json(audioList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch city audio" });
    }
  });

  // Batch generate audio for all landmarks in a city using CLOVA Voice
  app.post("/api/audio/batch-generate", async (req, res) => {
    try {
      const { cityId, language, voiceId } = req.body;

      if (!cityId) {
        return res.status(400).json({ error: "City ID is required" });
      }

      const landmarkList = await storage.getLandmarks(cityId);
      const lang = language || 'en';
      const results: any[] = [];
      const errors: any[] = [];

      // Determine voice for this batch
      const selectedVoice = (voiceId && CLOVA_VOICES[voiceId as ClovaVoiceId])
        ? voiceId as ClovaVoiceId
        : DEFAULT_CLOVA_VOICE_BY_LANGUAGE[lang] || 'clara';

      for (const landmark of landmarkList) {
        try {
          // Check if already exists with same voice
          const existing = await storage.getAudio(landmark.id, lang);
          if (existing && existing.voiceId === selectedVoice) {
            results.push({ landmarkId: landmark.id, status: 'exists', audio: existing });
            continue;
          }

          // Get text
          let text = landmark.narration || '';
          if (landmark.translations && landmark.translations[lang]) {
            text = landmark.translations[lang].narration || landmark.translations[lang].description || text;
          }

          if (!text) {
            errors.push({ landmarkId: landmark.id, error: 'No narration text available' });
            continue;
          }

          // Generate using CLOVA Voice
          const audioResult = await generateAndSaveClovaTTS(landmark.id, text, lang, selectedVoice);
          const duration = Math.ceil(text.length / 15);

          const saved = await storage.saveAudio({
            landmarkId: landmark.id,
            language: lang,
            audioUrl: audioResult.audioUrl,
            duration,
            sizeBytes: audioResult.sizeBytes,
            checksum: audioResult.checksum,
            voiceId: audioResult.voiceId
          });

          results.push({ landmarkId: landmark.id, status: 'generated', audio: saved });
        } catch (err: any) {
          errors.push({ landmarkId: landmark.id, error: err.message });
        }
      }

      res.json({
        total: landmarkList.length,
        generated: results.filter(r => r.status === 'generated').length,
        existing: results.filter(r => r.status === 'exists').length,
        errors: errors.length,
        results,
        errorDetails: errors.length > 0 ? errors : undefined
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to batch generate audio with CLOVA Voice" });
    }
  });

  // ========== CLOVA Voice TTS Routes ==========

  // Serve CLOVA audio files
  app.use('/audio/clova', express.static(path.join(process.cwd(), 'public', 'audio', 'clova')));

  // Get available CLOVA voices
  app.get("/api/tts/clova/voices", async (req, res) => {
    try {
      const { CLOVA_VOICES, getClovaVoicesForLanguage, DEFAULT_CLOVA_VOICE_BY_LANGUAGE } = await import("./lib/clova");
      const language = req.query.language as string;

      if (language) {
        const voicesForLang = getClovaVoicesForLanguage(language);
        const voiceDetails = voicesForLang.map(id => ({
          id,
          ...CLOVA_VOICES[id]
        }));
        return res.json({ voices: voiceDetails, default: DEFAULT_CLOVA_VOICE_BY_LANGUAGE[language] || "nara" });
      }

      res.json({
        voices: CLOVA_VOICES,
        defaults: DEFAULT_CLOVA_VOICE_BY_LANGUAGE
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get CLOVA voices" });
    }
  });

  // Generate CLOVA TTS audio (streaming)
  app.post("/api/tts/clova/generate", async (req, res) => {
    try {
      const { generateClovaTTS, DEFAULT_CLOVA_VOICE_BY_LANGUAGE } = await import("./lib/clova");
      const { text, voice, language, speed, pitch, volume } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const selectedVoice = voice || DEFAULT_CLOVA_VOICE_BY_LANGUAGE[language || 'ko'] || 'nara';
      const result = await generateClovaTTS(
        text,
        selectedVoice,
        speed || 0,
        pitch || 0,
        volume || 0
      );

      res.set({
        'Content-Type': result.contentType,
        'Content-Length': result.audioBuffer.length,
        'X-Voice-Id': result.voiceId
      });
      res.send(result.audioBuffer);
    } catch (error: any) {
      console.error('CLOVA TTS error:', error);
      res.status(500).json({ error: error.message || "Failed to generate CLOVA TTS" });
    }
  });

  // Generate OpenAI TTS audio (streaming)
  app.post("/api/tts/openai/generate", async (req, res) => {
    try {
      const { generateLandmarkAudio } = await import("./lib/openai");
      const { text, voice, language } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const result = await generateLandmarkAudio(
        "streaming-tts",
        text,
        language || 'en',
        voice
      );

      const filePath = path.join(process.cwd(), result.audioUrl.startsWith('/') ? result.audioUrl.slice(1) : result.audioUrl);
      const audioBuffer = fs.readFileSync(filePath);

      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length,
        'X-Voice-Id': result.voiceId
      });
      res.send(audioBuffer);
    } catch (error: any) {
      console.error('OpenAI TTS error:', error);
      res.status(500).json({ error: error.message || "Failed to generate OpenAI TTS" });
    }
  });

  // Generate and save CLOVA TTS for a landmark
  app.post("/api/tts/clova/landmark", async (req, res) => {
    try {
      const { generateAndSaveClovaTTS, DEFAULT_CLOVA_VOICE_BY_LANGUAGE } = await import("./lib/clova");
      const { landmarkId, language, voice } = req.body;

      if (!landmarkId) {
        return res.status(400).json({ error: "Landmark ID is required" });
      }

      const landmark = await storage.getLandmark(landmarkId);
      if (!landmark) {
        return res.status(404).json({ error: "Landmark not found" });
      }

      const lang = language || 'ko';
      let text = landmark.narration;

      if (landmark.translations && landmark.translations[lang]) {
        text = landmark.translations[lang].narration || text;
      }

      const result = await generateAndSaveClovaTTS(landmarkId, text, lang, voice);

      res.json({
        landmarkId,
        language: lang,
        ...result
      });
    } catch (error: any) {
      console.error('CLOVA landmark TTS error:', error);
      res.status(500).json({ error: error.message || "Failed to generate CLOVA TTS for landmark" });
    }
  });

  // Batch generate CLOVA TTS for multiple landmarks
  app.post("/api/admin/generate-audio-batch", async (req, res) => {
    try {
      const { generateAndSaveClovaTTS, DEFAULT_CLOVA_VOICE_BY_LANGUAGE } = await import("./lib/clova");
      const { landmarkIds, languages, voice } = req.body;

      if (!landmarkIds || !Array.isArray(landmarkIds) || landmarkIds.length === 0) {
        return res.status(400).json({ error: "landmarkIds array is required" });
      }

      const targetLanguages = languages && Array.isArray(languages) ? languages : ['ko'];
      const results: any[] = [];
      const errors: any[] = [];

      for (const landmarkId of landmarkIds) {
        const landmark = await storage.getLandmark(landmarkId);
        if (!landmark) {
          errors.push({ landmarkId, error: "Landmark not found" });
          continue;
        }

        for (const lang of targetLanguages) {
          try {
            let text = landmark.detailedDescription || landmark.narration || landmark.description || '';

            if (landmark.translations && landmark.translations[lang]) {
              const trans = landmark.translations[lang];
              text = trans.detailedDescription || trans.narration || trans.description || text;
            }

            if (!text || text.trim().length === 0) {
              errors.push({ landmarkId, language: lang, error: "No text available" });
              continue;
            }

            const selectedVoice = voice || DEFAULT_CLOVA_VOICE_BY_LANGUAGE[lang] || "nara";
            const result = await generateAndSaveClovaTTS(landmarkId, text, lang, selectedVoice);

            results.push({
              landmarkId,
              landmarkName: landmark.name,
              language: lang,
              ...result
            });
          } catch (err: any) {
            errors.push({ landmarkId, language: lang, error: err.message });
          }
        }
      }

      res.json({
        success: true,
        generated: results.length,
        failed: errors.length,
        results,
        errors
      });
    } catch (error: any) {
      console.error('Batch CLOVA TTS error:', error);
      res.status(500).json({ error: error.message || "Failed to generate batch audio" });
    }
  });

  // Get audio generation status for landmarks
  app.get("/api/admin/audio-status", async (req, res) => {
    try {
      const { cityId, language } = req.query;
      const audioDir = path.join(process.cwd(), "public", "audio", "clova");

      const allLandmarks = await storage.getLandmarks(cityId as string);
      const targetLang = (language as string) || 'ko';

      const status = allLandmarks.map(landmark => {
        const possibleFiles = [
          `${landmark.id}_${targetLang}_nara.mp3`,
          `${landmark.id}_${targetLang}_clara.mp3`,
          `${landmark.id}_${targetLang}_ntomoko.mp3`,
          `${landmark.id}_${targetLang}_meimei.mp3`,
          `${landmark.id}_${targetLang}_carmen.mp3`,
        ];

        let hasAudio = false;
        let audioUrl = null;

        for (const filename of possibleFiles) {
          const filePath = path.join(audioDir, filename);
          if (fs.existsSync(filePath)) {
            hasAudio = true;
            audioUrl = `/audio/clova/${filename}`;
            break;
          }
        }

        return {
          landmarkId: landmark.id,
          landmarkName: landmark.name,
          category: landmark.category,
          language: targetLang,
          hasAudio,
          audioUrl
        };
      });

      const generated = status.filter(s => s.hasAudio).length;
      const pending = status.filter(s => !s.hasAudio).length;

      res.json({
        total: status.length,
        generated,
        pending,
        landmarks: status
      });
    } catch (error: any) {
      console.error('Audio status error:', error);
      res.status(500).json({ error: error.message || "Failed to get audio status" });
    }
  });

  // =====================================================
  // Tour Leader API - Schedules and Group Members CRUD
  // =====================================================

  // Get all schedules for a tour
  app.get("/api/tour-leader/schedules", async (req, res) => {
    try {
      const tourId = (req.query.tourId as string) || 'default';
      const schedules = await db.select()
        .from(tourSchedules)
        .where(eq(tourSchedules.tourId, tourId))
        .orderBy(tourSchedules.orderIndex);
      res.json(schedules);
    } catch (error) {
      console.error('Get schedules error:', error);
      res.status(500).json({ error: "Failed to fetch schedules" });
    }
  });

  // Create a new schedule
  app.post("/api/tour-leader/schedules", async (req, res) => {
    try {
      const { tourId, time, location, duration, notes, orderIndex } = req.body;

      if (!time || !location) {
        return res.status(400).json({ error: "Time and location are required" });
      }

      const [newSchedule] = await db.insert(tourSchedules).values({
        tourId: tourId || 'default',
        time,
        location,
        duration: duration || null,
        notes: notes || null,
        orderIndex: orderIndex || 0
      }).returning();

      res.status(201).json(newSchedule);
    } catch (error) {
      console.error('Create schedule error:', error);
      res.status(500).json({ error: "Failed to create schedule" });
    }
  });

  // Update a schedule
  app.put("/api/tour-leader/schedules/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { time, location, duration, notes, orderIndex } = req.body;

      const [updated] = await db.update(tourSchedules)
        .set({
          time,
          location,
          duration: duration || null,
          notes: notes || null,
          orderIndex: orderIndex ?? 0,
          updatedAt: new Date()
        })
        .where(eq(tourSchedules.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Schedule not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error('Update schedule error:', error);
      res.status(500).json({ error: "Failed to update schedule" });
    }
  });

  // Delete a schedule
  app.delete("/api/tour-leader/schedules/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const [deleted] = await db.delete(tourSchedules).where(eq(tourSchedules.id, id)).returning();

      if (!deleted) {
        return res.status(404).json({ error: "Schedule not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Delete schedule error:', error);
      res.status(500).json({ error: "Failed to delete schedule" });
    }
  });

  // Get all members for a tour
  app.get("/api/tour-leader/members", async (req, res) => {
    try {
      const tourId = (req.query.tourId as string) || 'default';
      const members = await db.select()
        .from(groupMembers)
        .where(eq(groupMembers.tourId, tourId))
        .orderBy(groupMembers.name);
      res.json(members);
    } catch (error) {
      console.error('Get members error:', error);
      res.status(500).json({ error: "Failed to fetch members" });
    }
  });

  // Create a new member
  app.post("/api/tour-leader/members", async (req, res) => {
    try {
      const { tourId, name, phone, email, roomNumber, status, notes } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      const [newMember] = await db.insert(groupMembers).values({
        tourId: tourId || 'default',
        name,
        phone: phone || null,
        email: email || null,
        roomNumber: roomNumber || null,
        status: status || 'on-time',
        notes: notes || null
      }).returning();

      res.status(201).json(newMember);
    } catch (error) {
      console.error('Create member error:', error);
      res.status(500).json({ error: "Failed to create member" });
    }
  });

  // Update a member
  app.put("/api/tour-leader/members/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, phone, email, roomNumber, status, notes } = req.body;

      const [updated] = await db.update(groupMembers)
        .set({
          name,
          phone: phone || null,
          email: email || null,
          roomNumber: roomNumber || null,
          status: status || 'on-time',
          notes: notes || null,
          updatedAt: new Date()
        })
        .where(eq(groupMembers.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Member not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error('Update member error:', error);
      res.status(500).json({ error: "Failed to update member" });
    }
  });

  // Update member status only
  app.patch("/api/tour-leader/members/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['on-time', 'late', 'absent'].includes(status)) {
        return res.status(400).json({ error: "Valid status is required (on-time, late, absent)" });
      }

      const [updated] = await db.update(groupMembers)
        .set({
          status,
          updatedAt: new Date()
        })
        .where(eq(groupMembers.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Member not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error('Update member status error:', error);
      res.status(500).json({ error: "Failed to update member status" });
    }
  });

  // Delete a member
  app.delete("/api/tour-leader/members/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const [deleted] = await db.delete(groupMembers).where(eq(groupMembers.id, id)).returning();

      if (!deleted) {
        return res.status(404).json({ error: "Member not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Delete member error:', error);
      res.status(500).json({ error: "Failed to delete member" });
    }
  });

  // Export schedules to Excel
  app.get("/api/tour-leader/export/schedules", async (req, res) => {
    try {
      const tourId = (req.query.tourId as string) || 'default';
      const format = (req.query.format as string) || 'xlsx';

      const schedules = await db.select()
        .from(tourSchedules)
        .where(eq(tourSchedules.tourId, tourId))
        .orderBy(tourSchedules.orderIndex);

      const data = schedules.map((s, idx) => ({
        '순서': idx + 1,
        '시간': s.time,
        '장소': s.location,
        '소요시간': s.duration || '',
        '메모': s.notes || ''
      }));

      if (format === 'csv') {
        const header = Object.keys(data[0] || {}).join(',');
        const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(','));
        const csv = [header, ...rows].join('\n');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="tour_schedule_${tourId}.csv"`);
        res.send('\uFEFF' + csv); // BOM for Korean Excel
      } else {
        const XLSX = await import('xlsx');
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Schedule');
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="tour_schedule_${tourId}.xlsx"`);
        res.send(buffer);
      }
    } catch (error) {
      console.error('Export schedules error:', error);
      res.status(500).json({ error: "Failed to export schedules" });
    }
  });

  // Export members to Excel
  app.get("/api/tour-leader/export/members", async (req, res) => {
    try {
      const tourId = (req.query.tourId as string) || 'default';
      const format = (req.query.format as string) || 'xlsx';

      const members = await db.select()
        .from(groupMembers)
        .where(eq(groupMembers.tourId, tourId))
        .orderBy(groupMembers.name);

      const statusMap: Record<string, string> = { 'on-time': '정시', 'late': '지연', 'absent': '결석' };
      const data = members.map((m, idx) => ({
        '번호': idx + 1,
        '이름': m.name,
        '전화번호': m.phone || '',
        '이메일': m.email || '',
        '객실번호': m.roomNumber || '',
        '상태': statusMap[m.status] || m.status,
        '메모': m.notes || ''
      }));

      if (format === 'csv') {
        const header = Object.keys(data[0] || {}).join(',');
        const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(','));
        const csv = [header, ...rows].join('\n');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="group_members_${tourId}.csv"`);
        res.send('\uFEFF' + csv);
      } else {
        const XLSX = await import('xlsx');
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Members');
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="group_members_${tourId}.xlsx"`);
        res.send(buffer);
      }
    } catch (error) {
      console.error('Export members error:', error);
      res.status(500).json({ error: "Failed to export members" });
    }
  });

  // Import schedules from Excel/CSV
  app.post("/api/tour-leader/import/schedules", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const tourId = (req.body.tourId as string) || 'default';
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const data: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      let imported = 0;
      const errors: { row: number; message: string }[] = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          const time = row['시간'] || row['time'] || row['Time'];
          const location = row['장소'] || row['location'] || row['Location'];

          if (!time || !location) {
            errors.push({ row: i + 2, message: 'Missing time or location' });
            continue;
          }

          await db.insert(tourSchedules).values({
            tourId,
            time: String(time),
            location: String(location),
            duration: row['소요시간'] || row['duration'] || null,
            notes: row['메모'] || row['notes'] || null,
            orderIndex: i
          });
          imported++;
        } catch (err: any) {
          errors.push({ row: i + 2, message: err.message });
        }
      }

      res.json({
        success: true,
        imported,
        total: data.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error('Import schedules error:', error);
      res.status(500).json({ error: "Failed to import schedules" });
    }
  });

  // Import members from Excel/CSV
  app.post("/api/tour-leader/import/members", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const tourId = (req.body.tourId as string) || 'default';
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const data: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      const statusMap: Record<string, string> = { '정시': 'on-time', '지연': 'late', '결석': 'absent' };
      let imported = 0;
      const errors: { row: number; message: string }[] = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          const name = row['이름'] || row['name'] || row['Name'];

          if (!name) {
            errors.push({ row: i + 2, message: 'Missing name' });
            continue;
          }

          const statusValue = row['상태'] || row['status'] || 'on-time';
          const mappedStatus = statusMap[statusValue] || statusValue;

          await db.insert(groupMembers).values({
            tourId,
            name: String(name),
            phone: row['전화번호'] || row['phone'] || null,
            email: row['이메일'] || row['email'] || null,
            roomNumber: row['객실번호'] || row['roomNumber'] || null,
            status: ['on-time', 'late', 'absent'].includes(mappedStatus) ? mappedStatus : 'on-time',
            notes: row['메모'] || row['notes'] || null
          });
          imported++;
        } catch (err: any) {
          errors.push({ row: i + 2, message: err.message });
        }
      }

      res.json({
        success: true,
        imported,
        total: data.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error('Import members error:', error);
      res.status(500).json({ error: "Failed to import members" });
    }
  });

  // ===== Saved Routes API =====

  // Create a new saved route
  app.post("/api/routes", async (req, res) => {
    try {
      const { title, countryCode, cityId, stops, description, totalDistance, totalDuration, coverPhotoUrl } = req.body;
      const sessionId = req.headers['x-session-id'] as string;
      const userId = (req.session as any)?.userId;

      if (!title || !countryCode || !cityId || !stops || stops.length === 0) {
        return res.status(400).json({ error: "Title, country code, city ID, and stops are required" });
      }

      const route = await storage.createSavedRoute({
        userId: userId || null,
        sessionId: sessionId || null,
        title,
        countryCode,
        cityId,
        stops,
        description: description || null,
        totalDistance: totalDistance || null,
        totalDuration: totalDuration || null,
        coverPhotoUrl: coverPhotoUrl || null
      });

      res.status(201).json(route);
    } catch (error) {
      console.error('Create route error:', error);
      res.status(500).json({ error: "Failed to create route" });
    }
  });

  // Get saved routes (by user/session and optionally by country)
  app.get("/api/routes", async (req, res) => {
    try {
      const sessionId = (req.query.sessionId as string) || (req.headers['x-session-id'] as string);
      const userId = (req.session as any)?.userId;
      const countryCode = req.query.countryCode as string;

      if (!userId && !sessionId) {
        return res.status(400).json({ error: "Session ID or authentication required" });
      }

      const routes = await storage.getSavedRoutes(userId, sessionId, countryCode);
      res.json(routes);
    } catch (error) {
      console.error('Get routes error:', error);
      res.status(500).json({ error: "Failed to get routes" });
    }
  });

  // Get a specific route by ID
  app.get("/api/routes/:id", async (req, res) => {
    try {
      const route = await storage.getSavedRouteById(req.params.id);
      if (!route) {
        return res.status(404).json({ error: "Route not found" });
      }
      res.json(route);
    } catch (error) {
      console.error('Get route error:', error);
      res.status(500).json({ error: "Failed to get route" });
    }
  });

  // Update a saved route
  app.put("/api/routes/:id", async (req, res) => {
    try {
      const { title, description, stops, totalDistance, totalDuration, coverPhotoUrl } = req.body;

      const route = await storage.updateSavedRoute(req.params.id, {
        title,
        description,
        stops,
        totalDistance,
        totalDuration,
        coverPhotoUrl
      });

      if (!route) {
        return res.status(404).json({ error: "Route not found" });
      }

      res.json(route);
    } catch (error) {
      console.error('Update route error:', error);
      res.status(500).json({ error: "Failed to update route" });
    }
  });

  // Delete a saved route
  app.delete("/api/routes/:id", async (req, res) => {
    try {
      await storage.deleteSavedRoute(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Delete route error:', error);
      res.status(500).json({ error: "Failed to delete route" });
    }
  });

  // ===== Route Photos API =====

  // Add photo to a route
  app.post("/api/routes/:routeId/photos", upload.single('photo'), async (req, res) => {
    try {
      const { routeId } = req.params;
      const file = req.file;
      const userId = (req.session as any)?.userId;

      if (!file) {
        return res.status(400).json({ error: "Photo file is required" });
      }

      // Get GPS coordinates from body (extracted by frontend from EXIF)
      const { latitude, longitude, takenAt, source, metadata } = req.body;

      const photo = await storage.addRoutePhoto({
        routeId,
        userId: userId || null,
        storageUrl: `/uploads/${file.filename}`,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        takenAt: takenAt ? new Date(takenAt) : null,
        source: source || 'upload',
        metadata: metadata ? JSON.parse(metadata) : null
      });

      res.status(201).json(photo);
    } catch (error) {
      console.error('Add photo error:', error);
      res.status(500).json({ error: "Failed to add photo" });
    }
  });

  // Get photos for a route
  app.get("/api/routes/:routeId/photos", async (req, res) => {
    try {
      const photos = await storage.getRoutePhotos(req.params.routeId);
      res.json(photos);
    } catch (error) {
      console.error('Get photos error:', error);
      res.status(500).json({ error: "Failed to get photos" });
    }
  });

  // Delete a photo
  app.delete("/api/routes/photos/:id", async (req, res) => {
    try {
      await storage.deleteRoutePhoto(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Delete photo error:', error);
      res.status(500).json({ error: "Failed to delete photo" });
    }
  });

  // ===============================
  // ADMIN: User Management API
  // ===============================

  // Get all users with pagination and search
  app.get("/api/admin/users", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = (req.query.search as string) || '';
      const role = req.query.role as string;
      const offset = (page - 1) * limit;

      let query = db.select().from(users);

      // Build where conditions
      const conditions: any[] = [];
      if (search) {
        conditions.push(
          or(
            ilike(users.email, `%${search}%`),
            ilike(users.displayName, `%${search}%`)
          )
        );
      }
      if (role && role !== 'all') {
        conditions.push(eq(users.role, role));
      }

      // Get total count
      const countResult = await db.select({ count: count() }).from(users);
      const total = countResult[0]?.count || 0;

      // Get users with conditions
      let usersQuery = db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);

      const allUsers = await usersQuery;

      // Filter in memory for now (simpler approach)
      let filteredUsers = allUsers;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredUsers = filteredUsers.filter(u =>
          u.email?.toLowerCase().includes(searchLower) ||
          u.displayName?.toLowerCase().includes(searchLower)
        );
      }
      if (role && role !== 'all') {
        filteredUsers = filteredUsers.filter(u => u.role === role);
      }

      res.json({
        users: filteredUsers,
        pagination: {
          page,
          limit,
          total: Number(total),
          pages: Math.ceil(Number(total) / limit)
        }
      });
    } catch (error) {
      console.warn('[Admin] DB fetch failed for users, falling back to storage:', error);
      try {
        const allUsers = await storage.getAllUsers();
        // Simple search/role filter on fallback data
        let filtered = allUsers;
        const search = (req.query.search as string) || '';
        const role = req.query.role as string;
        if (search) {
          const s = search.toLowerCase();
          filtered = filtered.filter(u => u.email?.toLowerCase().includes(s) || u.displayName?.toLowerCase().includes(s));
        }
        if (role && role !== 'all') {
          filtered = filtered.filter(u => u.role === role);
        }
        res.json({
          users: filtered,
          pagination: { page: 1, limit: filtered.length, total: filtered.length, pages: 1 }
        });
      } catch (storageError) {
        res.status(500).json({ error: "Failed to fetch users" });
      }
    }
  });

  // Get user statistics
  app.get("/api/admin/users/stats", async (req, res) => {
    try {
      const totalResult = await db.select({ count: count() }).from(users);
      const total = Number(totalResult[0]?.count || 0);

      // Get role distribution
      const roleStats = await db.select({
        role: users.role,
        count: count()
      }).from(users).groupBy(users.role);

      // Get provider distribution from identities
      const providerStats = await db.select({
        provider: userIdentities.provider,
        count: count()
      }).from(userIdentities).groupBy(userIdentities.provider);

      // Get recent signups (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentSignups = await db.select({ count: count() })
        .from(users)
        .where(sql`${users.createdAt} > ${sevenDaysAgo}`);

      res.json({
        total,
        roles: Object.fromEntries(roleStats.map(r => [r.role || 'user', Number(r.count)])),
        providers: Object.fromEntries(providerStats.map(p => [p.provider, Number(p.count)])),
        recentSignups: Number(recentSignups[0]?.count || 0)
      });
    } catch (error) {
      console.warn('[Admin] DB fetch failed for user stats, falling back to storage:', error);
      try {
        const allUsers = await storage.getAllUsers();
        const roleDist: Record<string, number> = {};
        allUsers.forEach(u => {
          const r = u.role || 'user';
          roleDist[r] = (roleDist[r] || 0) + 1;
        });
        res.json({
          total: allUsers.length,
          roles: roleDist,
          providers: {}, // Hard to get providers without identity join in fallback
          recentSignups: 0
        });
      } catch (storageError) {
        res.status(500).json({ error: "Failed to fetch user stats" });
      }
    }
  });

  // Get single user with identities
  app.get("/api/admin/users/:id", async (req, res) => {
    try {
      const userId = req.params.id;

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get user's linked identities
      const identities = await db.select({
        id: userIdentities.id,
        provider: userIdentities.provider,
        providerUserId: userIdentities.providerUserId,
        email: userIdentities.email,
        displayName: userIdentities.displayName,
        avatar: userIdentities.avatar,
        createdAt: userIdentities.createdAt,
        updatedAt: userIdentities.updatedAt
      }).from(userIdentities).where(eq(userIdentities.userId, userId));

      res.json({
        ...user,
        identities
      });
    } catch (error) {
      console.error('Admin get user error:', error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Update user role
  app.patch("/api/admin/users/:id/role", async (req, res) => {
    try {
      const userId = req.params.id;
      const { role } = req.body;

      const validRoles = ['user', 'guide', 'tour_leader', 'admin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const [updated] = await db.update(users)
        .set({ role, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error('Admin update user role error:', error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  // Update user details
  app.put("/api/admin/users/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      const { displayName, email, locale, role } = req.body;

      const updateData: any = { updatedAt: new Date() };
      if (displayName !== undefined) updateData.displayName = displayName;
      if (email !== undefined) updateData.email = email;
      if (locale !== undefined) updateData.locale = locale;
      if (role !== undefined) {
        const validRoles = ['user', 'guide', 'tour_leader', 'admin'];
        if (!validRoles.includes(role)) {
          return res.status(400).json({ error: "Invalid role" });
        }
        updateData.role = role;
      }

      const [updated] = await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error('Admin update user error:', error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Delete user (and their identities cascade)
  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      const userId = req.params.id;

      const [deleted] = await db.delete(users)
        .where(eq(users.id, userId))
        .returning();

      if (!deleted) {
        return res.status(404).json({ error: "User not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Admin delete user error:', error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Get all user identities (login history by provider)
  app.get("/api/admin/identities", async (req, res) => {
    try {
      const provider = req.query.provider as string;

      let query = db.select({
        id: userIdentities.id,
        userId: userIdentities.userId,
        provider: userIdentities.provider,
        providerUserId: userIdentities.providerUserId,
        email: userIdentities.email,
        displayName: userIdentities.displayName,
        avatar: userIdentities.avatar,
        createdAt: userIdentities.createdAt,
        updatedAt: userIdentities.updatedAt,
        userName: users.displayName,
        userEmail: users.email
      })
        .from(userIdentities)
        .leftJoin(users, eq(userIdentities.userId, users.id))
        .orderBy(desc(userIdentities.createdAt));

      const identities = await query;

      // Filter by provider if specified
      const filtered = provider && provider !== 'all'
        ? identities.filter(i => i.provider === provider)
        : identities;

      res.json(filtered);
    } catch (error) {
      console.error('Admin get identities error:', error);
      res.status(500).json({ error: "Failed to fetch identities" });
    }
  });

  /**
   * [회계부장 노트: 수익 정산의 자동화]
   * 대표님, 이 웹훅이 바로 우리 플랫폼의 '자동 장부' 역할을 합니다.
   * 사용자가 Stripe 결제 페이지에서 결제를 마치면, Stripe 서버가 우리에게 "입금 확인됐어!"라고 신호를 보냅니다.
   * 그 신호를 받아 `transactions`와 `creator_earnings`를 업데이트하는 것이 핵심입니다.
   */
  app.post("/api/payments/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // [코다리부장 조언] 웹훅은 보안이 생명입니다! Stripe에서 보낸 진짜 신호인지 서명을 반드시 검증해야 해요.
      event = stripe.webhooks.constructEvent(
        req.body,
        sig!,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error(`[회계부장 긴급 보고] 웹훅 서명 검증 실패: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // 결제 성공 이벤트 처리
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;

      if (metadata) {
        const { userId, creatorId, amount } = metadata;

        // [회계부장 로직] 실제 입금된 금액을 바탕으로 수익을 배분합니다.
        // 우리 플랫폼의 약속: 크리에이터 70%, 플랫폼 30% 배분 원칙을 고수합니다.
        const totalAmount = parseFloat(amount);
        const creatorShare = totalAmount * 0.7;


        /**
         * [회계부장 실무 강의: 돈이 들어오면 무엇을 해야 할까요?]
         * 1. 누가 샀는지(userId)
         * 2. 무엇을 샀는지(targetId)
         * 3. 누가 돈을 받아야 하는지(creatorId)
         * 4. 정확한 금액은 얼마인지(totalAmount) 확인하는 것이 정산의 기초 중의 기초입니다!
         */
        console.log(`[회계부장] 결제 성공 확인: 사용자 ${userId}, 크리에이터 ${creatorId}, 총액 ${totalAmount}€, 수익배분 ${creatorShare.toFixed(2)}€`);


        try {
          // [회계부장] 개별 결제 처리 로직을 전담 서비스로 이관하여 전문성을 높였습니다.
          await settlementService.processPayment(
            userId,
            metadata.landmarkId || 'unknown',
            totalAmount,
            {
              stripeSessionId: session.id,
              paymentIntentId: session.payment_intent as string,
              verifiedAt: new Date().toISOString(),
              creatorId // 수익금을 받을 주체
            }
          );
          console.log(`[회계부장] 장부 기입 완료! 아주 깔끔합니다, 대표님.`);
        } catch (dbError) {
          console.error(`[회계부장 긴급] DB 전송 중 오류 발생:`, dbError);
          throw dbError;
        }
      }
    }

    res.json({ received: true });
  });

  /**
   * [회계부장 실무 강의: 크리에이터 모드 API]
   * 학생 여러분, 화면(Frontend)에서 '내 수익이 얼마야?'라고 물어보면 
   * 이 엔드포인트가 정산 서비스에서 데이터를 쓱싹 긁어다 대답해주는 역할을 한단다.
   */
  app.get("/api/creator/stats", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId || req.query.userId as string;
      if (!userId) {
        return res.status(401).json({ error: "[회계부장] 로그인부터 하고 오세요! 누구 장부인지 모르겠어요." });
      }

      const stats = await settlementService.getCreatorStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Get creator stats error:', error);
      res.status(500).json({ error: "통계정보를 가져오는데 실패했습니다!" });
    }
  });

  /**
   * [회계부장 실무 강의: 관리자의 권한]
   * 정산은 아주 무거운 작업이라, 함부로 실행되지 않게 관리자 전용 엔드포인트로 만들었어.
   */
  app.post("/api/admin/settle", async (req, res) => {
    try {
      const { userId, period } = req.body;
      if (!userId || !period) {
        return res.status(400).json({ error: "누구에게, 언제치 월급을 줄지 정확히 써주세요!" });
      }

      const settlement = await settlementService.runSettlement(userId, period);
      res.json({ success: true, settlement });
    } catch (error: any) {
      console.error('Run settlement error:', error);
      res.status(500).json({ error: error.message || "정산 처리 중 오류가 발생했습니다!" });
    }
  });

  app.get("/api/admin/marketing-contents", async (req, res) => {
    // [마케터 쏭의 가이드] 생성된 모든 홍보 문구를 관리자 대시보드에 보고합니다!
    // 명소 이름과 함께 보여주기 위해 Join을 사용했어요.
    try {
      const results = await db
        .select({
          id: marketingContents.id,
          landmarkId: marketingContents.landmarkId,
          landmarkName: landmarks.name,
          content: marketingContents.content,
          updatedAt: marketingContents.updatedAt,
        })
        .from(marketingContents)
        .innerJoin(landmarks, eq(marketingContents.landmarkId, landmarks.id))
        .orderBy(desc(marketingContents.updatedAt));

      res.json(results);
    } catch (error) {
      console.warn('[Admin] DB fetch failed for marketing contents, falling back to storage:', error);
      try {
        const fallbackContents = await storage.getMarketingContents();
        res.json(fallbackContents);
      } catch (storageError) {
        res.status(500).json({ error: "Failed to fetch marketing contents" });
      }
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

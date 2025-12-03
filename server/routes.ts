import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVisitedLandmarkSchema } from "@shared/schema";
import { recommendTourItinerary } from "./lib/openai";
import { db } from "./db";
import { cities, landmarks, dataVersions } from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
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
      res.json(landmark);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch landmark" });
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

  app.get("/api/visited/:landmarkId", async (req, res) => {
    try {
      const sessionId = req.query.sessionId as string | undefined;
      const isVisited = await storage.isLandmarkVisited(req.params.landmarkId, sessionId);
      res.json({ visited: isVisited });
    } catch (error) {
      res.status(500).json({ error: "Failed to check if landmark is visited" });
    }
  });

  // Offline package API - download city data for offline use
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
          paymentMethods: l.paymentMethods
        })),
        version,
        downloadedAt: new Date().toISOString()
      };

      // Generate ETag based on content hash
      const contentHash = crypto
        .createHash('md5')
        .update(JSON.stringify({ version, cityId, count: cityLandmarks.length }))
        .digest('hex');
      const etag = `"${contentHash}"`;

      // Check if client has latest version
      if (clientEtag === etag) {
        return res.status(304).end();
      }

      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', 'private, max-age=3600');
      res.json(packageData);
    } catch (error) {
      console.error('Offline package error:', error);
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

  // ===============================
  // Admin API Routes
  // ===============================

  // Admin: Get all cities from database
  app.get("/api/admin/cities", async (req, res) => {
    try {
      const allCities = await db.select().from(cities).orderBy(cities.name);
      res.json(allCities);
    } catch (error) {
      console.error('Admin get cities error:', error);
      res.status(500).json({ error: "Failed to fetch cities" });
    }
  });

  // Admin: Create a new city
  app.post("/api/admin/cities", async (req, res) => {
    try {
      const { id, name, country, lat, lng, zoom, cruisePort } = req.body;
      
      if (!id || !name || !country || lat === undefined || lng === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const [newCity] = await db.insert(cities).values({
        id,
        name,
        country,
        lat,
        lng,
        zoom: zoom || 14,
        cruisePort: cruisePort || null
      }).returning();

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
      console.error('Admin get landmarks error:', error);
      res.status(500).json({ error: "Failed to fetch landmarks" });
    }
  });

  // Admin: Create a new landmark
  app.post("/api/admin/landmarks", async (req, res) => {
    try {
      const data = req.body;
      
      if (!data.id || !data.cityId || !data.name || data.lat === undefined || data.lng === undefined || !data.narration) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const [newLandmark] = await db.insert(landmarks).values({
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
      }).returning();

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
      const allCities = await db.select().from(cities);
      const allLandmarks = await db.select().from(landmarks);
      
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

  // AI tour recommendation route
  app.post("/api/ai/recommend-tour", async (req, res) => {
    try {
      const { cityId, language, userPosition } = req.body;
      
      if (!cityId) {
        return res.status(400).json({ error: "City ID is required" });
      }

      const landmarks = await storage.getLandmarks(cityId);
      
      if (landmarks.length === 0) {
        return res.status(404).json({ error: "No landmarks found for this city" });
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

  const httpServer = createServer(app);

  return httpServer;
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVisitedLandmarkSchema } from "@shared/schema";
import { generateLandmarkAudio, TTS_VOICES, VOICE_STYLES } from "./lib/openai";
import { recommendTourItinerary } from "./lib/gemini";
import { db } from "./db";
import { cities, landmarks, dataVersions, tourSchedules, groupMembers } from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import multer from "multer";
import * as XLSX from "xlsx";
import * as path from "path";
import express from "express";

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
        const allCities = await db.select().from(cities);
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
        const allLandmarks = await db.select().from(landmarks);
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

  // Get available TTS voices
  app.get("/api/audio/voices", (req, res) => {
    res.json({
      voices: TTS_VOICES,
      styles: VOICE_STYLES
    });
  });

  // Generate audio for a landmark
  app.post("/api/audio/generate", async (req, res) => {
    try {
      const { landmarkId, language, voice } = req.body;
      
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
      let text = landmark.narration;
      
      // Check for translated narration
      if (landmark.translations && landmark.translations[lang]) {
        text = landmark.translations[lang].narration || text;
      }

      // Check if audio already exists
      const existingAudio = await storage.getAudio(landmarkId, lang);
      if (existingAudio && existingAudio.voiceId === (voice || 'fable')) {
        return res.json(existingAudio);
      }

      // Generate new audio
      const audioResult = await generateLandmarkAudio(landmarkId, text, lang, voice);
      
      // Save to database
      const savedAudio = await storage.saveAudio({
        landmarkId,
        language: lang,
        audioUrl: audioResult.audioUrl,
        duration: audioResult.duration,
        sizeBytes: audioResult.sizeBytes,
        checksum: audioResult.checksum,
        voiceId: audioResult.voiceId
      });

      res.json(savedAudio);
    } catch (error: any) {
      console.error('Audio generation error:', error);
      res.status(500).json({ error: error.message || "Failed to generate audio" });
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

  // Batch generate audio for all landmarks in a city
  app.post("/api/audio/batch-generate", async (req, res) => {
    try {
      const { cityId, language, voice } = req.body;
      
      if (!cityId) {
        return res.status(400).json({ error: "City ID is required" });
      }

      const landmarks = await storage.getLandmarks(cityId);
      const lang = language || 'en';
      const results: any[] = [];
      const errors: any[] = [];

      for (const landmark of landmarks) {
        try {
          // Check if already exists
          const existing = await storage.getAudio(landmark.id, lang);
          if (existing) {
            results.push({ landmarkId: landmark.id, status: 'exists', audio: existing });
            continue;
          }

          // Get text
          let text = landmark.narration;
          if (landmark.translations && landmark.translations[lang]) {
            text = landmark.translations[lang].narration || text;
          }

          // Generate
          const audioResult = await generateLandmarkAudio(landmark.id, text, lang, voice);
          const saved = await storage.saveAudio({
            landmarkId: landmark.id,
            language: lang,
            audioUrl: audioResult.audioUrl,
            duration: audioResult.duration,
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
        total: landmarks.length,
        generated: results.filter(r => r.status === 'generated').length,
        existing: results.filter(r => r.status === 'exists').length,
        errors: errors.length,
        results,
        errorDetails: errors.length > 0 ? errors : undefined
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to batch generate audio" });
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

  const httpServer = createServer(app);

  return httpServer;
}

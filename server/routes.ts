import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVisitedLandmarkSchema } from "@shared/schema";
import { recommendTourItinerary } from "./lib/openai";

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

import { z } from "zod";
import { pgTable, varchar, timestamp, boolean, doublePrecision, integer, text, json, unique } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

// Transport option schema
export const transportOptionSchema = z.object({
  type: z.enum(['train', 'bus', 'taxi', 'rideshare', 'shuttle']),
  name: z.string(),
  from: z.string().optional(),
  to: z.string().optional(),
  duration: z.string().optional(),
  frequency: z.string().optional(),
  price: z.string().optional(),
  bookingUrl: z.string().optional(),
  tips: z.string().optional(),
  translations: z.record(z.string(), z.object({
    name: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    duration: z.string().optional(),
    frequency: z.string().optional(),
    price: z.string().optional(),
    tips: z.string().optional(),
  })).optional(),
});

export type TransportOption = z.infer<typeof transportOptionSchema>;

// Cruise port schema for shore excursions
export const cruisePortSchema = z.object({
  portName: z.string(),
  distanceFromCity: z.string().optional(), // e.g., "80km from Rome"
  recommendedDuration: z.string().optional(), // e.g., "6-8 hours"
  recommendedLandmarks: z.array(z.string()), // Array of landmark IDs
  tips: z.string().optional(), // Travel tips for cruise passengers
  transportOptions: z.array(transportOptionSchema).optional(), // Transport options from port to city
  portCoordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(), // Port location for ride-hailing services
  translations: z.record(z.string(), z.object({
    portName: z.string().optional(),
    distanceFromCity: z.string().optional(),
    recommendedDuration: z.string().optional(),
    tips: z.string().optional(),
  })).optional(),
});

export type CruisePort = z.infer<typeof cruisePortSchema>;

// City schema
export const citySchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  lat: z.number(),
  lng: z.number(),
  zoom: z.number().default(14),
  cruisePort: cruisePortSchema.optional(), // Optional cruise port information
});

export type City = z.infer<typeof citySchema>;

// Language schema
export const languageSchema = z.object({
  code: z.string(),
  name: z.string(),
  flag: z.string(),
  speechLang: z.string().optional(), // Web Speech API language code
});

export type Language = z.infer<typeof languageSchema>;

// Translation content schema (used for each language)
const translationContentSchema = z.object({
  name: z.string(),
  narration: z.string(),
  description: z.string().optional(),
  detailedDescription: z.string().optional(), // Long 5-minute reading content
  historicalInfo: z.string().optional(), // Extended historical information
  yearBuilt: z.string().optional(), // Construction year/period
  architect: z.string().optional(), // Architect or creator name
});

// Dynamic translations schema - supports any language code
export const translationsSchema = z.record(z.string(), translationContentSchema).optional();

export type Translations = z.infer<typeof translationsSchema>;

// Landmark/POI schema
export const landmarkSchema = z.object({
  id: z.string(),
  cityId: z.string(),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  radius: z.number(),
  narration: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  translations: translationsSchema,
  detailedDescription: z.string().optional(), // Long 5-minute reading content
  photos: z.array(z.string()).optional(), // Array of photo URLs
  historicalInfo: z.string().optional(), // Extended historical information
  yearBuilt: z.string().optional(), // Construction year/period
  architect: z.string().optional(), // Architect or creator name
});

export type Landmark = z.infer<typeof landmarkSchema>;

// GPS Position schema
export const gpsPositionSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().optional(),
  timestamp: z.number().optional(),
});

export type GpsPosition = z.infer<typeof gpsPositionSchema>;

// Route waypoint schema
export const waypointSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

export type Waypoint = z.infer<typeof waypointSchema>;

// Drizzle ORM Tables for Database

// Visited Landmarks table
export const visitedLandmarks = pgTable("visited_landmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  landmarkId: varchar("landmark_id").notNull(),
  visitedAt: timestamp("visited_at").notNull().defaultNow(),
  sessionId: varchar("session_id"), // Optional: track user session
}, (table) => ({
  // Unique constraint to prevent duplicate visits for the same session+landmark
  uniqueSessionLandmark: unique().on(table.sessionId, table.landmarkId),
}));

export const visitedLandmarksRelations = relations(visitedLandmarks, () => ({}));

// Insert schemas
export const insertVisitedLandmarkSchema = createInsertSchema(visitedLandmarks).omit({
  id: true,
  visitedAt: true,
});

export type InsertVisitedLandmark = z.infer<typeof insertVisitedLandmarkSchema>;
export type VisitedLandmark = typeof visitedLandmarks.$inferSelect;

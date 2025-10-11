import { z } from "zod";
import { pgTable, varchar, timestamp, boolean, doublePrecision, integer, text, json, unique } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

// City schema
export const citySchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  lat: z.number(),
  lng: z.number(),
  zoom: z.number().default(14),
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

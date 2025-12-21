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
  // Restaurant-specific fields
  openingHours: z.string().optional(), // e.g., "Mon-Sat: 12:00-15:00, 19:00-23:00"
  priceRange: z.string().optional(), // e.g., "€€€" or "$50-80 per person"
  cuisine: z.string().optional(), // e.g., "Traditional Roman", "French Fine Dining"
  reservationUrl: z.string().optional(), // Direct reservation link (OpenTable, TheFork, etc.)
  phoneNumber: z.string().optional(), // Restaurant phone number
  menuHighlights: z.array(z.string()).optional(), // Key dishes: ["Cacio e Pepe", "Carbonara"]
  restaurantPhotos: z.object({
    exterior: z.array(z.string()).optional(), // Exterior photos
    interior: z.array(z.string()).optional(), // Interior photos
    menu: z.array(z.string()).optional(), // Menu photos
  }).optional(),
  paymentMethods: z.array(z.string()).optional(), // e.g., ["Card", "Cash", "Mobile Payment"]
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

// Cities table
export const cities = pgTable("cities", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  country: varchar("country").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  zoom: integer("zoom").default(14),
  cruisePort: json("cruise_port"), // JSON for cruise port data
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Landmarks table (includes landmarks, activities, restaurants, gift shops)
export const landmarks = pgTable("landmarks", {
  id: varchar("id").primaryKey(),
  cityId: varchar("city_id").notNull(),
  name: varchar("name").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  radius: integer("radius").notNull(),
  narration: text("narration").notNull(),
  description: text("description"),
  category: varchar("category"), // 'Ancient Rome', 'Activity', 'Restaurant', 'Gift Shop', etc.
  detailedDescription: text("detailed_description"),
  photos: json("photos"), // Array of photo URLs
  historicalInfo: text("historical_info"),
  yearBuilt: varchar("year_built"),
  architect: varchar("architect"),
  translations: json("translations"), // JSONB for all language translations
  // Restaurant-specific fields
  openingHours: varchar("opening_hours"),
  priceRange: varchar("price_range"),
  cuisine: varchar("cuisine"),
  reservationUrl: varchar("reservation_url"),
  phoneNumber: varchar("phone_number"),
  menuHighlights: json("menu_highlights"), // Array of strings
  restaurantPhotos: json("restaurant_photos"), // { exterior, interior, menu }
  paymentMethods: json("payment_methods"), // Array of strings
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Data version table for offline sync
export const dataVersions = pgTable("data_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: varchar("entity_type").notNull(), // 'cities', 'landmarks', 'all'
  version: integer("version").notNull().default(1),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

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

// Landmark Audio table for offline MP3 files
export const landmarkAudio = pgTable("landmark_audio", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  landmarkId: varchar("landmark_id").notNull(),
  language: varchar("language", { length: 10 }).notNull(), // 'en', 'ko', 'es', etc.
  audioUrl: varchar("audio_url").notNull(), // Path to MP3 file
  duration: integer("duration"), // Duration in seconds
  sizeBytes: integer("size_bytes"), // File size in bytes
  format: varchar("format", { length: 20 }).default("audio/mpeg"),
  checksum: varchar("checksum", { length: 64 }), // MD5 or SHA256 for cache validation
  voiceId: varchar("voice_id", { length: 50 }), // OpenAI voice used (alloy, echo, etc.)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  // Unique constraint: one audio per landmark per language
  uniqueLandmarkLanguage: unique().on(table.landmarkId, table.language),
}));

// Users table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email"), // May be null for some providers
  displayName: varchar("display_name"),
  avatar: varchar("avatar"), // Profile picture URL
  locale: varchar("locale", { length: 10 }).default("en"), // User's preferred language
  role: varchar("role", { length: 20 }).default("user"), // 'user', 'guide', 'tour_leader', 'admin'
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// User Social Identities table - links SNS accounts to users
export const userIdentities = pgTable("user_identities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar("provider", { length: 50 }).notNull(), // 'google', 'facebook', 'kakao', 'naver', 'apple', 'line', 'wechat'
  providerUserId: varchar("provider_user_id").notNull(), // The user's ID from the provider
  email: varchar("email"), // Email from provider (if available)
  displayName: varchar("display_name"), // Display name from provider
  avatar: varchar("avatar"), // Avatar URL from provider
  accessToken: text("access_token"), // OAuth access token (encrypted)
  refreshToken: text("refresh_token"), // OAuth refresh token (encrypted)
  tokenExpiresAt: timestamp("token_expires_at"),
  rawProfile: json("raw_profile"), // Full profile data from provider
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  // Unique constraint: one identity per provider per user
  uniqueProviderUserId: unique().on(table.provider, table.providerUserId),
}));

// Tour Leader: Schedule table for tour itineraries
export const tourSchedules = pgTable("tour_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tourId: varchar("tour_id").notNull(), // Group tour identifier
  time: varchar("time").notNull(), // e.g., "09:00"
  location: varchar("location").notNull(),
  duration: varchar("duration"), // e.g., "30분", "1 hour"
  notes: text("notes"),
  orderIndex: integer("order_index").notNull().default(0), // For ordering
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relations
export const citiesRelations = relations(cities, ({ many }) => ({
  landmarks: many(landmarks),
}));

export const landmarksRelations = relations(landmarks, ({ one }) => ({
  city: one(cities, {
    fields: [landmarks.cityId],
    references: [cities.id],
  }),
}));

export const visitedLandmarksRelations = relations(visitedLandmarks, () => ({}));

export const usersRelations = relations(users, ({ many }) => ({
  identities: many(userIdentities),
}));

export const userIdentitiesRelations = relations(userIdentities, ({ one }) => ({
  user: one(users, {
    fields: [userIdentities.userId],
    references: [users.id],
  }),
}));

export const landmarkAudioRelations = relations(landmarkAudio, ({ one }) => ({
  landmark: one(landmarks, {
    fields: [landmarkAudio.landmarkId],
    references: [landmarks.id],
  }),
}));

// Tour Leader: Group members table
export const groupMembers = pgTable("group_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tourId: varchar("tour_id").notNull(), // Group tour identifier
  name: varchar("name").notNull(),
  phone: varchar("phone"),
  email: varchar("email"),
  roomNumber: varchar("room_number"), // Hotel room number
  status: varchar("status").notNull().default("on-time"), // 'on-time', 'late', 'absent'
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Saved Routes table - User's saved tour routes per country
export const savedRoutes = pgTable("saved_routes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  sessionId: varchar("session_id"), // For non-logged-in users
  countryCode: varchar("country_code", { length: 10 }).notNull(), // 'IT', 'PH', 'FR', etc.
  cityId: varchar("city_id").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  totalDistance: doublePrecision("total_distance"), // In meters
  totalDuration: integer("total_duration"), // In minutes
  stops: json("stops").notNull(), // Array of { landmarkId, name, lat, lng, duration, order }
  coverPhotoUrl: varchar("cover_photo_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Route Photos table - Photos associated with saved routes
export const routePhotos = pgTable("route_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  routeId: varchar("route_id").notNull().references(() => savedRoutes.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'set null' }),
  storageUrl: varchar("storage_url").notNull(), // Path to uploaded photo
  thumbnailUrl: varchar("thumbnail_url"), // Path to thumbnail
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  takenAt: timestamp("taken_at"), // EXIF date taken
  source: varchar("source", { length: 20 }).default("upload"), // 'upload', 'gps_auto'
  metadata: json("metadata"), // Additional EXIF data
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertCitySchema = createInsertSchema(cities).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertLandmarkSchema = createInsertSchema(landmarks).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertVisitedLandmarkSchema = createInsertSchema(visitedLandmarks).omit({
  id: true,
  visitedAt: true,
});

export const insertLandmarkAudioSchema = createInsertSchema(landmarkAudio).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTourScheduleSchema = createInsertSchema(tourSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGroupMemberSchema = createInsertSchema(groupMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserIdentitySchema = createInsertSchema(userIdentities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSavedRouteSchema = createInsertSchema(savedRoutes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoutePhotoSchema = createInsertSchema(routePhotos).omit({
  id: true,
  createdAt: true,
});

// Saved Routes relations
export const savedRoutesRelations = relations(savedRoutes, ({ one, many }) => ({
  user: one(users, {
    fields: [savedRoutes.userId],
    references: [users.id],
  }),
  photos: many(routePhotos),
}));

export const routePhotosRelations = relations(routePhotos, ({ one }) => ({
  route: one(savedRoutes, {
    fields: [routePhotos.routeId],
    references: [savedRoutes.id],
  }),
  user: one(users, {
    fields: [routePhotos.userId],
    references: [users.id],
  }),
}));

// Route stop schema for validation
export const routeStopSchema = z.object({
  landmarkId: z.string(),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  duration: z.number().optional(), // Stay duration in minutes
  order: z.number(),
});

export type RouteStop = z.infer<typeof routeStopSchema>;

export type InsertCity = z.infer<typeof insertCitySchema>;
export type InsertLandmark = z.infer<typeof insertLandmarkSchema>;
export type InsertVisitedLandmark = z.infer<typeof insertVisitedLandmarkSchema>;
export type InsertLandmarkAudio = z.infer<typeof insertLandmarkAudioSchema>;
export type InsertTourSchedule = z.infer<typeof insertTourScheduleSchema>;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertUserIdentity = z.infer<typeof insertUserIdentitySchema>;
export type VisitedLandmark = typeof visitedLandmarks.$inferSelect;
export type LandmarkAudio = typeof landmarkAudio.$inferSelect;
export type TourSchedule = typeof tourSchedules.$inferSelect;
export type GroupMember = typeof groupMembers.$inferSelect;
export type User = typeof users.$inferSelect;
export type UserIdentity = typeof userIdentities.$inferSelect;
export type DbCity = typeof cities.$inferSelect;
export type DbLandmark = typeof landmarks.$inferSelect;
export type InsertSavedRoute = z.infer<typeof insertSavedRouteSchema>;
export type InsertRoutePhoto = z.infer<typeof insertRoutePhotoSchema>;
export type SavedRoute = typeof savedRoutes.$inferSelect;
export type RoutePhoto = typeof routePhotos.$inferSelect;

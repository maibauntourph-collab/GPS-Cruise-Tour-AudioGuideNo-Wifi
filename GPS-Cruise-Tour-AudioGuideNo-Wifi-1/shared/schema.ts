// [학습 가이드: 데이터 모델링의 두 기둥]
// 1. Zod (z): 프론트엔드와 백엔드 사이의 데이터 '유효성 검사'를 담당합니다.
// 2. Drizzle (pgTable...): 실제 데이터베이스(PostgreSQL)의 '테이블 구조'를 정의합니다.
// 이 둘을 하나로 합쳐서(createInsertSchema) 관리하면 코드 중복 없이 안전한 코딩이 가능해요!
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

// [학습 가이드: 도시 및 크루즈 항구 스키마]
// 오프라인 모드에서도 동작해야 하므로 좌표(lat, lng)와 추천 코스 정보가 중요합니다.
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
  defaultGuideId: z.string().optional(), // Default guide (creator) for this city
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
  // Premium fields
  isPremium: z.boolean().optional(),
  price: z.number().optional(), // Price in EUR for the premium guide
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

/**
 * [연구소장 노트: 도시 데이터 설계]
 * 서비스의 기본 단위인 '도시' 정보입니다. 
 * GPS 기반 서비스이므로 위도(lat)와 경도(lng)가 필수이며, 
 * 크루즈 승객을 위해 항구 정보(cruisePort)를 JSON 형태로 담고 있습니다.
 */
export const cities = pgTable("cities", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  country: varchar("country").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  zoom: integer("zoom").default(14),
  cruisePort: json("cruise_port"), // JSON for cruise port data
  defaultGuideId: varchar("default_guide_id"), // Global instructor ID for this city
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * [연구소장 노트: 지능형 랜드마크(명소) 설계]
 * 단순한 명소가 아니라, 식당, 쇼핑몰, 액티비티를 모두 포함하는 포괄적인 장소 데이터입니다.
 * - radius: GPS 인식 범위를 미터(m) 단위로 설정합니다. 이 범위 안에 들어오면 오디오 가이드가 나옵니다.
 * - narration: AI가 생성한 생생한 이야기 본문입니다.
 * - translations: 다국어 지원을 위해 번역 데이터를 JSONB 형식으로 통째로 보관합니다.
 */
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
  // [교육용 주석] 식당/카페 전용 필드들입니다. 
  // 장소의 유형에 따라 일부 필드만 사용될 수도 있는 '유연한 설계' 패턴입니다.
  openingHours: varchar("opening_hours"),
  priceRange: varchar("price_range"),
  cuisine: varchar("cuisine"),
  reservationUrl: varchar("reservation_url"),
  phoneNumber: varchar("phone_number"),
  menuHighlights: json("menu_highlights"), // Array of strings
  restaurantPhotos: json("restaurant_photos"), // { exterior, interior, menu }
  paymentMethods: json("payment_methods"), // Array of strings
  isPremium: boolean("is_premium").notNull().default(false),
  price: doublePrecision("price"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * [연구소장 노트: 다중 가이드 해설 설계]
 * 하나의 랜드마크에 대해 여러 명의 크리에이터(가이드)가 제공하는 다양한 버전의 해설입니다.
 * 사용자는 취향에 맞는 가이드의 목소리와 내용을 선택하여 들을 수 있습니다.
 */
export const landmarkGuides = pgTable("landmark_guides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  landmarkId: varchar("landmark_id").notNull().references(() => landmarks.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  narration: text("narration").notNull(),
  description: text("description"),
  detailedDescription: text("detailed_description"),
  translations: json("translations"), // Translation specific to this guide's content
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  // 명소 하나당 한 명의 크리에이터는 하나의 가이드만 등록할 수 있음
  uniqueLandmarkUser: unique().on(table.landmarkId, table.userId),
}));

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

/**
 * [연구소장 노트: 통합 사용자(Users) 개체 설계]
 * 서비스 내의 모든 인간 행위자(관리자, 크리에이터, 가이드, 일반 사용자)의 공통 정보입니다.
 * - role: 권한 시스템의 핵심입니다. ('admin', 'guide', 'creator', 'user')
 * - locale: 다국어 서비스이므로 사용자가 선호하는 언어 설정이 중요합니다.
 */
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

/**
 * [연구소장 노트: 소셜 Identity 연동 설계]
 * 한 명의 사용자(User)가 여러 소셜 계정(구글, 카카오 등)을 연결할 수 있는 구조입니다.
 */
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

/**
 * [강의 노트: 크리에이터 수익 관리]
 * 학생 여러분, 플랫폼 비즈니스의 핵심은 '누가 얼마나 벌었는가'를 정확히 기록하는 것입니다.
 * 이 ‘creator_earnings’ 테이블은 크리에이터 각자의 '지갑' 역할을 합니다.
 * 단순히 숫자를 적는 것이 아니라, 출금 가능한 잔액과 총 누적액을 분리하여 관리함으로써
 * 회계적 투명성을 확보하는 것이 이 설계의 핵심입니다.
 */
export const creatorEarnings = pgTable("creator_earnings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // 어떤 크리에이터의 지갑인지 식별합니다 (users 테이블 참조)
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  // 현재 시점에서 크리에이터가 실제로 현금화할 수 있는 금액입니다.
  totalBalance: doublePrecision("total_balance").notNull().default(0),
  // 플랫폼 가입 이후 지금까지 벌어들인 총 금액으로, 성과 지표로 활용됩니다.
  totalEarned: doublePrecision("total_earned").notNull().default(0),
  // 마지막으로 수익이 업데이트된 시점입니다. 소수점 단위의 오차를 방지하기 위해 doublePrecision을 사용했습니다.
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * [강의 노트: 결제 및 트랜잭션의 무결성]
 * 여러분, 돈이 오가는 모든 행위는 '증거'가 남아야 합니다. 이를 '트레일(Trail)'이라고 하죠.
 * 'transactions' 테이블은 개별 결제가 발생할 때마다 그 상세 내역과 PG사(결제대행사)의 응답을 기록합니다.
 * 결제 상태가 'pending'에서 'completed'로 변하는 과정을 추적하여 이중 결제를 방지하는 핵심 로직이 여기서 시작됩니다.
 */
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // 결제를 시도한 사용자입니다. 비로그인 결제도 고려하여 nullable 할 수 있으나, 여기서는 회원 중심 설계를 따릅니다.
  userId: varchar("user_id").notNull().references(() => users.id),
  // 구매 대상인 랜드마크나 특정 루트의 ID입니다.
  targetId: varchar("target_id").notNull(),
  // 결제 금액입니다. 통화(Currency)는 현재 기본 설정을 따르지만, 글로벌 확장을 위해 필드를 분리할 수도 있습니다.
  amount: doublePrecision("amount").notNull(),
  // 결제의 현재 상태를 나타내는 지시자입니다. (시도 중, 완료, 실패, 환불 등)
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  // PG사에서 발급해준 고유 승인 번호나 결과 데이터(JSON)를 저장하여 추후 분쟁 시 증거로 활용합니다.
  providerData: json("provider_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * [강의 노트: 정산과 데이터 확정]
 * 자, 수익이 발생했다면 이제 약속한 날짜에 크리에이터에게 일괄적으로 '월급'을 줘야겠죠?
 * 'settlements' 테이블은 바로 그 '지급' 행위를 기록합니다.
 * 정산이 완료된 데이터는 '확정'된 데이터이므로 가급적 수정을 지양하고 로그로서의 가치를 보존해야 합니다.
 */
export const settlements = pgTable("settlements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: doublePrecision("amount").notNull(),
  period: varchar("period", { length: 20 }).notNull(), // Added period column (e.g. "2024-02")
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * [마케터 쏭의 강의 노트: 마케팅 자산의 보관]
 * 학생 여러분, AI가 만든 홍보 문구는 우리 플랫폼의 소중한 '디지털 자산'입니다.
 * 이 ‘marketing_contents’ 테이블은 생성된 문구를 영구적으로 보관하여,
 * 언제든 관리자가 확인하고 수정하여 SNS에 올릴 수 있도록 도와줍니다.
 */
export const marketingContents = pgTable("marketing_contents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // 어떤 명소에 대한 홍보 문구인지 연결합니다.
  landmarkId: varchar("landmark_id").notNull().references(() => landmarks.id, { onDelete: 'cascade' }),
  // AI가 생성한 JSON 형태의 콘텐츠 (blog, instagram, tiktok, twitter 등)
  content: json("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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

// [교수님 노트] 방금 만든 신규 테이블들을 위한 Insert 스키마들입니다. 데이터 입력 시 자동 검증 도구 역할을 하죠.
export const insertCreatorEarningsSchema = createInsertSchema(creatorEarnings).omit({ id: true, updatedAt: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSettlementSchema = createInsertSchema(settlements).omit({ id: true, createdAt: true });
export const insertMarketingContentSchema = createInsertSchema(marketingContents).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLandmarkGuideSchema = createInsertSchema(landmarkGuides).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertLandmarkGuide = z.infer<typeof insertLandmarkGuideSchema>;

// [강의 노트: 관계형 데이터베이스의 꽃, Relations]
// 여러분, 테이블들이 각자 따로 놀면 안 됩니다. 
// 유저가 누구인지, 결제가 어떤 유저의 것인지 서로 '연결'되어 있어야 진정한 시스템이 됩니다.
export const creatorEarningsRelations = relations(creatorEarnings, ({ one }) => ({
  // 각 수익 레코드는 하나의 유저(크리에이터)에게 귀속됩니다.
  user: one(users, {
    fields: [creatorEarnings.userId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  // 결제 내역은 이를 실행한 유저와 연결됩니다. 1:N 관계의 전형이죠.
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const settlementsRelations = relations(settlements, ({ one }) => ({
  // 정산 기록 또한 수혜자인 유저와 연결되어야 합니다.
  user: one(users, {
    fields: [settlements.userId],
    references: [users.id],
  }),
}));

export const marketingContentsRelations = relations(marketingContents, ({ one }) => ({
  // 각 마케팅 콘텐츠는 하나의 명소에 귀속됩니다.
  landmark: one(landmarks, {
    fields: [marketingContents.landmarkId],
    references: [landmarks.id],
  }),
}));

export const landmarkGuidesRelations = relations(landmarkGuides, ({ one }) => ({
  landmark: one(landmarks, {
    fields: [landmarkGuides.landmarkId],
    references: [landmarks.id],
  }),
  user: one(users, {
    fields: [landmarkGuides.userId],
    references: [users.id],
  }),
}));

// [교수님 노트] 아래는 기존 테이블들과의 통합을 위한 관계 정의입니다.
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
export type InsertCreatorEarnings = z.infer<typeof insertCreatorEarningsSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertSettlement = z.infer<typeof insertSettlementSchema>;
export type InsertMarketingContent = z.infer<typeof insertMarketingContentSchema>;

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
export type CreatorEarnings = typeof creatorEarnings.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Settlement = typeof settlements.$inferSelect;
export type MarketingContent = typeof marketingContents.$inferSelect;
export const LandmarkGuide = typeof landmarkGuides.$inferSelect;
export type DbLandmarkGuide = typeof landmarkGuides.$inferSelect;

import { type Landmark, type City, type VisitedLandmark, type InsertVisitedLandmark, type LandmarkAudio, type InsertLandmarkAudio, type User, type InsertUser, type UserIdentity, type InsertUserIdentity, type SavedRoute, type InsertSavedRoute, type RoutePhoto, type InsertRoutePhoto, type DbLandmarkGuide, type InsertLandmarkGuide } from "@shared/schema";
import { db } from "./db";
import { visitedLandmarks, landmarkAudio as landmarkAudioTable, landmarks as landmarksTable, cities as citiesTable, users, userIdentities, savedRoutes, routePhotos } from "@shared/schema";
import { eq, count, and, sql, notInArray, desc } from "drizzle-orm";
import { RESTAURANTS } from "./data/restaurants";
import { CITIES } from './data/cities';
import { LANDMARKS } from './data/landmarks';
import { env } from "./env";

// [AI 데이터베이스 총괄의 'No-Wifi' 데이터 철학]
// "우리 서비스의 이름은 'nowifigps'입니다. 즉, 바다 위 크루즈나 인터넷이 없는 오지에서도 
// 우리의 가이드는 멈추지 말아야 합니다. 온라인에서 AI가 정교하게 빚어낸 데이터를 
// 로컬(MemStorage/Mock)에 안전하게 캐싱하여 '오프라인 서바이벌 데이터'로 변환하는 것,
// 그것이 바로 하이브리드 저장 전략의 핵심이자 제 존재 이유입니다."

export interface IStorage {
  getCities(): Promise<City[]>;
  getCity(id: string): Promise<City | undefined>;
  getLandmarks(cityId?: string): Promise<Landmark[]>;
  getLandmark(id: string): Promise<Landmark | undefined>;
  // Visited landmarks methods
  markLandmarkVisited(landmarkId: string, sessionId?: string): Promise<VisitedLandmark>;
  getVisitedLandmarks(sessionId?: string): Promise<VisitedLandmark[]>;
  isLandmarkVisited(landmarkId: string, sessionId?: string): Promise<boolean>;
  getVisitedCount(sessionId?: string): Promise<number>;
  // Audio methods
  getAudio(landmarkId: string, language: string): Promise<LandmarkAudio | undefined>;
  getAudioByCity(cityId: string): Promise<LandmarkAudio[]>;
  saveAudio(audio: InsertLandmarkAudio): Promise<LandmarkAudio>;
  deleteAudio(landmarkId: string, language: string): Promise<void>;
  // User methods
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  // User Identity methods
  getUserIdentity(provider: string, providerUserId: string): Promise<UserIdentity | undefined>;
  getUserIdentitiesByUserId(userId: string): Promise<UserIdentity[]>;
  createUserIdentity(identity: InsertUserIdentity): Promise<UserIdentity>;
  updateUserIdentity(id: string, updates: Partial<InsertUserIdentity>): Promise<UserIdentity | undefined>;
  findOrCreateUserByIdentity(provider: string, providerUserId: string, profileData: { email?: string; displayName?: string; avatar?: string; rawProfile?: any }): Promise<User>;
  // Saved Routes methods
  createSavedRoute(route: InsertSavedRoute): Promise<SavedRoute>;
  getSavedRoutes(userId?: string, sessionId?: string, countryCode?: string): Promise<SavedRoute[]>;
  getSavedRouteById(id: string): Promise<SavedRoute | undefined>;
  updateSavedRoute(id: string, updates: Partial<InsertSavedRoute>): Promise<SavedRoute | undefined>;
  deleteSavedRoute(id: string): Promise<void>;
  // Route Photos methods
  addRoutePhoto(photo: InsertRoutePhoto): Promise<RoutePhoto>;
  getRoutePhotos(routeId: string): Promise<RoutePhoto[]>;
  deleteRoutePhoto(id: string): Promise<void>;
  // Admin methods
  getAllUsers(): Promise<User[]>;
  getMarketingContents(): Promise<any[]>;
  createCity(city: any): Promise<City>;
  updateCity(id: string, updates: Partial<City>): Promise<City | undefined>;
  createLandmark(landmark: any): Promise<Landmark>;
  updateLandmark(id: string, updates: Partial<Landmark>): Promise<Landmark | undefined>;
  // Guide methods
  getLandmarkGuides(landmarkId: string): Promise<DbLandmarkGuide[]>;
  createLandmarkGuide(guide: InsertLandmarkGuide): Promise<DbLandmarkGuide>;
}

// Hardcoded CITIES and LANDMARKS moved to separate files in server/data/

// LANDMARKS.push(...NEW_LANDMARKS);

export class MemStorage implements IStorage {
  private usersMap: Map<string, User> = new Map();
  private userIdentitiesMap: Map<string, UserIdentity> = new Map();
  private citiesMap: Map<string, City> = new Map();
  private landmarksMap: Map<string, Landmark> = new Map();
  private nextUserId: number = 1;
  private nextIdentityId: number = 1;

  constructor() {
    // Memory storage initialized empty (no disk load)
  }
  async getCities(): Promise<City[]> {
    const hardcodedIds = CITIES.map(c => c.id);
    try {
      let dbCities: City[] = [];
      if (hardcodedIds.length > 0) {
        dbCities = await db.select().from(citiesTable).where(notInArray(citiesTable.id, hardcodedIds)) as City[];
      } else {
        dbCities = await db.select().from(citiesTable) as City[];
      }
      const result = [...CITIES, ...Array.from(this.citiesMap.values()), ...dbCities];
      console.log(`[Storage Debug] getCities returning ${result.length} cities (${this.citiesMap.size} from memory)`);
      return result;
    } catch (error) {
      console.error('Error fetching cities from DB:', error);
      const result = [...CITIES, ...Array.from(this.citiesMap.values())];
      console.log(`[Storage Debug] getCities (fallback) returning ${result.length} cities (${this.citiesMap.size} from memory)`);
      return result;
    }
  }

  async getCity(id: string): Promise<City | undefined> {
    const found = CITIES.find(city => city.id === id) || this.citiesMap.get(id);
    if (found) return found;

    try {
      const [dbCity] = await db.select().from(citiesTable).where(eq(citiesTable.id, id));
      return dbCity as City;
    } catch (error) {
      console.error(`Error fetching city ${id} from DB:`, error);
      return undefined;
    }
  }

  async getLandmarks(cityId?: string): Promise<Landmark[]> {
    // Get hardcoded landmarks and restaurants
    const hardcodedLandmarks = [...LANDMARKS, ...RESTAURANTS];
    const hardcodedIds = hardcodedLandmarks.map(l => l.id);

    // Get additional landmarks from database (ones not in hardcoded data)
    try {
      let dbLandmarks: Landmark[] = [];
      if (hardcodedIds.length > 0) {
        dbLandmarks = await db.select().from(landmarksTable).where(notInArray(landmarksTable.id, hardcodedIds)) as Landmark[];
      } else {
        dbLandmarks = await db.select().from(landmarksTable) as Landmark[];
      }

      // Combine all sources: hardcoded, memory, and database
      const allLandmarks = [...hardcodedLandmarks, ...Array.from(this.landmarksMap.values()), ...dbLandmarks];

      if (cityId) {
        return allLandmarks.filter(landmark => landmark.cityId === cityId);
      }
      return allLandmarks;
    } catch (error) {
      // If DB query fails, fall back to hardcoded + memory data
      console.error('[Storage] DB access failed for getLandmarks:', error);
      const fallbackLandmarks = [...hardcodedLandmarks, ...Array.from(this.landmarksMap.values())];
      if (cityId) {
        return fallbackLandmarks.filter(landmark => landmark.cityId === cityId);
      }
      return fallbackLandmarks;
    }
  }

  async getLandmark(id: string): Promise<Landmark | undefined> {
    // First check hardcoded data
    const hardcodedLandmarks = [...LANDMARKS, ...RESTAURANTS];
    const found = hardcodedLandmarks.find(landmark => landmark.id === id) || this.landmarksMap.get(id);
    if (found) return found;

    // If not found, check database
    try {
      const [dbLandmark] = await db.select().from(landmarksTable).where(eq(landmarksTable.id, id));
      return dbLandmark as Landmark;
    } catch (error) {
      console.error(`[Storage] DB access failed for getLandmark (${id}):`, error);
      return undefined;
    }
  }

  // Visited landmarks methods - using database
  async markLandmarkVisited(landmarkId: string, sessionId?: string): Promise<VisitedLandmark> {
    // Use ON CONFLICT DO NOTHING to prevent duplicate visits
    const [visited] = await db
      .insert(visitedLandmarks)
      .values({ landmarkId, sessionId })
      .onConflictDoNothing()
      .returning();

    // If no row returned (duplicate), fetch the existing one
    if (!visited) {
      const conditions = sessionId
        ? and(eq(visitedLandmarks.landmarkId, landmarkId), eq(visitedLandmarks.sessionId, sessionId))
        : eq(visitedLandmarks.landmarkId, landmarkId);

      const [existing] = await db
        .select()
        .from(visitedLandmarks)
        .where(conditions!);
      return existing;
    }

    return visited;
  }

  async getVisitedLandmarks(sessionId?: string): Promise<VisitedLandmark[]> {
    if (sessionId) {
      return await db
        .select()
        .from(visitedLandmarks)
        .where(eq(visitedLandmarks.sessionId, sessionId));
    }
    return await db.select().from(visitedLandmarks);
  }

  async isLandmarkVisited(landmarkId: string, sessionId?: string): Promise<boolean> {
    const conditions = sessionId
      ? and(eq(visitedLandmarks.landmarkId, landmarkId), eq(visitedLandmarks.sessionId, sessionId))
      : eq(visitedLandmarks.landmarkId, landmarkId);

    const results = await db
      .select()
      .from(visitedLandmarks)
      .where(conditions!);

    return results.length > 0;
  }

  async getVisitedCount(sessionId?: string): Promise<number> {
    if (sessionId) {
      const result = await db
        .select({ count: count() })
        .from(visitedLandmarks)
        .where(eq(visitedLandmarks.sessionId, sessionId));
      return result[0]?.count || 0;
    }

    const result = await db
      .select({ count: count() })
      .from(visitedLandmarks);
    return result[0]?.count || 0;
  }

  // Audio methods - using database
  async getAudio(landmarkId: string, language: string): Promise<LandmarkAudio | undefined> {
    const [audio] = await db
      .select()
      .from(landmarkAudioTable)
      .where(and(
        eq(landmarkAudioTable.landmarkId, landmarkId),
        eq(landmarkAudioTable.language, language)
      ));
    return audio;
  }

  async getAudioByCity(cityId: string): Promise<LandmarkAudio[]> {
    const landmarks = await this.getLandmarks(cityId);
    const landmarkIds = landmarks.map(l => l.id);

    if (landmarkIds.length === 0) return [];

    const audioList = await db
      .select()
      .from(landmarkAudioTable)
      .where(sql`${landmarkAudioTable.landmarkId} = ANY(${landmarkIds})`);

    return audioList;
  }

  async saveAudio(audio: InsertLandmarkAudio): Promise<LandmarkAudio> {
    const [saved] = await db
      .insert(landmarkAudioTable)
      .values(audio)
      .onConflictDoUpdate({
        target: [landmarkAudioTable.landmarkId, landmarkAudioTable.language],
        set: {
          audioUrl: audio.audioUrl,
          duration: audio.duration,
          sizeBytes: audio.sizeBytes,
          checksum: audio.checksum,
          voiceId: audio.voiceId,
          updatedAt: new Date()
        }
      })
      .returning();
    return saved;
  }

  async deleteAudio(landmarkId: string, language: string): Promise<void> {
    await db
      .delete(landmarkAudioTable)
      .where(and(
        eq(landmarkAudioTable.landmarkId, landmarkId),
        eq(landmarkAudioTable.language, language)
      ));
  }

  // User methods
  async getUserById(id: string): Promise<User | undefined> {
    if (!env.NOWIFIGPSTOURS) {
      return Array.from(this.usersMap.values()).find(u => u.id === id);
    }
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (e) {
      console.warn("[Storage] DB access failed for getUserById:", e);
      return Array.from(this.usersMap.values()).find(u => u.id === id);
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!env.NOWIFIGPSTOURS) {
      return Array.from(this.usersMap.values()).find(u => u.email === email);
    }
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (e) {
      console.warn("[Storage] DB access failed for getUserByEmail:", e);
      return Array.from(this.usersMap.values()).find(u => u.email === email);
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    if (!env.NOWIFIGPSTOURS) {
      console.warn("[Storage] No NOWIFIGPSTOURS, using memory for createUser");
      const id = String(this.nextUserId++);
      const newUser: User = {
        ...user,
        id,
        role: user.role || "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        email: user.email || null,
        displayName: user.displayName || null,
        avatar: user.avatar || null,
        locale: user.locale || null,
        lastLoginAt: user.lastLoginAt || null
      };
      this.usersMap.set(id, newUser);
      return newUser;
    }
    try {
      const [created] = await db.insert(users).values(user).returning();
      return created;
    } catch (e) {
      console.warn("[Storage] DB access failed for createUser:", e);
      const id = String(this.nextUserId++);
      const newUser: User = {
        ...user,
        id,
        role: user.role || "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        email: user.email || null,
        displayName: user.displayName || null,
        avatar: user.avatar || null,
        locale: user.locale || null,
        lastLoginAt: user.lastLoginAt || null
      };
      this.usersMap.set(id, newUser);
      return newUser;
    }
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const [updated] = await db
        .update(users)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      return updated;
    } catch (e) {
      console.warn("[Storage] DB access failed for updateUser:", e);
      const user = this.usersMap.get(id);
      if (user) {
        const updatedUser = { ...user, ...updates, updatedAt: new Date() };
        this.usersMap.set(id, updatedUser);
        return updatedUser;
      }
      return undefined;
    }
  }

  // User Identity methods
  async getUserIdentity(provider: string, providerUserId: string): Promise<UserIdentity | undefined> {
    try {
      const [identity] = await db
        .select()
        .from(userIdentities)
        .where(and(
          eq(userIdentities.provider, provider),
          eq(userIdentities.providerUserId, providerUserId)
        ));
      return identity;
    } catch (e) {
      console.warn("[Storage] DB access failed for getUserIdentity:", e);
      return Array.from(this.userIdentitiesMap.values()).find(
        i => i.provider === provider && i.providerUserId === providerUserId
      );
    }
  }

  async getUserIdentitiesByUserId(userId: string): Promise<UserIdentity[]> {
    try {
      return await db.select().from(userIdentities).where(eq(userIdentities.userId, userId));
    } catch (e) {
      console.warn("[Storage] DB access failed for getUserIdentitiesByUserId:", e);
      return Array.from(this.userIdentitiesMap.values()).filter(i => i.userId === userId);
    }
  }

  async createUserIdentity(identity: InsertUserIdentity): Promise<UserIdentity> {
    try {
      const [created] = await db.insert(userIdentities).values(identity).returning();
      return created;
    } catch (e) {
      console.warn("[Storage] DB access failed for createUserIdentity:", e);
      const id = String(this.nextIdentityId++);
      const newIdentity: UserIdentity = {
        ...identity,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
        email: identity.email || null,
        displayName: identity.displayName || null,
        avatar: identity.avatar || null,
        rawProfile: identity.rawProfile || null,
        accessToken: identity.accessToken || null,
        refreshToken: identity.refreshToken || null,
        tokenExpiresAt: identity.tokenExpiresAt || null
      };
      this.userIdentitiesMap.set(id, newIdentity);
      return newIdentity;
    }
  }

  async updateUserIdentity(id: string, updates: Partial<InsertUserIdentity>): Promise<UserIdentity | undefined> {
    try {
      const [updated] = await db
        .update(userIdentities)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(userIdentities.id, id))
        .returning();
      return updated;
    } catch (e) {
      console.warn("[Storage] DB access failed for updateUserIdentity:", e);
      const identity = this.userIdentitiesMap.get(id);
      if (identity) {
        const updatedIdentity = { ...identity, ...updates, updatedAt: new Date() };
        this.userIdentitiesMap.set(id, updatedIdentity);
        return updatedIdentity;
      }
      return undefined;
    }
  }

  async findOrCreateUserByIdentity(
    provider: string,
    providerUserId: string,
    profileData: { email?: string; displayName?: string; avatar?: string; rawProfile?: any }
  ): Promise<User> {
    // Check if identity exists
    const existingIdentity = await this.getUserIdentity(provider, providerUserId);

    if (existingIdentity) {
      // Update identity with new profile data
      await this.updateUserIdentity(existingIdentity.id, {
        email: profileData.email,
        displayName: profileData.displayName,
        avatar: profileData.avatar,
        rawProfile: profileData.rawProfile
      });

      // Update user's last login
      const user = await this.getUserById(existingIdentity.userId);
      if (user) {
        await this.updateUser(user.id, { lastLoginAt: new Date() });
        return { ...user, lastLoginAt: new Date() };
      }
      throw new Error('User not found for existing identity');
    }

    // Check if user with same email exists (for account linking)
    let user: User | undefined;
    if (profileData.email) {
      user = await this.getUserByEmail(profileData.email);
    }

    // Create new user if not found
    if (!user) {
      user = await this.createUser({
        email: profileData.email,
        displayName: profileData.displayName,
        avatar: profileData.avatar,
        lastLoginAt: new Date()
      });
    }

    // Create identity link
    await this.createUserIdentity({
      userId: user.id,
      provider,
      providerUserId,
      email: profileData.email,
      displayName: profileData.displayName,
      avatar: profileData.avatar,
      rawProfile: profileData.rawProfile
    });

    return user;
  }

  // Saved Routes methods
  async createSavedRoute(route: InsertSavedRoute): Promise<SavedRoute> {
    const [created] = await db.insert(savedRoutes).values(route).returning();
    return created;
  }

  async getSavedRoutes(userId?: string, sessionId?: string, countryCode?: string): Promise<SavedRoute[]> {
    let conditions = [];

    if (userId) {
      conditions.push(eq(savedRoutes.userId, userId));
    }
    if (sessionId) {
      conditions.push(eq(savedRoutes.sessionId, sessionId));
    }
    if (countryCode) {
      conditions.push(eq(savedRoutes.countryCode, countryCode));
    }

    if (conditions.length === 0) {
      return db.select().from(savedRoutes).orderBy(savedRoutes.createdAt);
    }

    // Use OR for userId/sessionId, AND for countryCode
    if (userId && sessionId && !countryCode) {
      return db.select().from(savedRoutes)
        .where(sql`(${savedRoutes.userId} = ${userId} OR ${savedRoutes.sessionId} = ${sessionId})`)
        .orderBy(savedRoutes.createdAt);
    }

    if (countryCode && (userId || sessionId)) {
      const userCondition = userId ? eq(savedRoutes.userId, userId) : eq(savedRoutes.sessionId, sessionId || '');
      return db.select().from(savedRoutes)
        .where(and(userCondition, eq(savedRoutes.countryCode, countryCode)))
        .orderBy(savedRoutes.createdAt);
    }

    return db.select().from(savedRoutes)
      .where(conditions[0])
      .orderBy(savedRoutes.createdAt);
  }

  async getSavedRouteById(id: string): Promise<SavedRoute | undefined> {
    const [route] = await db.select().from(savedRoutes).where(eq(savedRoutes.id, id));
    return route;
  }

  async updateSavedRoute(id: string, updates: Partial<InsertSavedRoute>): Promise<SavedRoute | undefined> {
    const [updated] = await db
      .update(savedRoutes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(savedRoutes.id, id))
      .returning();
    return updated;
  }

  async deleteSavedRoute(id: string): Promise<void> {
    await db.delete(savedRoutes).where(eq(savedRoutes.id, id));
  }

  // Route Photos methods
  async addRoutePhoto(photo: InsertRoutePhoto): Promise<RoutePhoto> {
    const [created] = await db.insert(routePhotos).values(photo).returning();
    return created;
  }

  async getRoutePhotos(routeId: string): Promise<RoutePhoto[]> {
    return db.select().from(routePhotos)
      .where(eq(routePhotos.routeId, routeId))
      .orderBy(routePhotos.takenAt);
  }

  async deleteRoutePhoto(id: string): Promise<void> {
    await db.delete(routePhotos).where(eq(routePhotos.id, id));
  }

  /**
   * [AI DB 총괄 특강: 어드민 사용자 목록 조회]
   * "회원 관리의 생명은 최신성입니다. 방금 가입한 분들이 맨 위에 나와야 하죠."
   * - orderBy(desc(users.createdAt)): 가입일 기준 내림차순 정렬의 정석입니다.
   * - catch(error): DB가 잠시 쉬고 있다면(연결 오류), 제가 미리 메모리에 저장해둔 지도로 안내합니다.
   */
  async getAllUsers(): Promise<User[]> {
    try {
      return await db.select().from(users).orderBy(desc(users.createdAt));
    } catch (error) {
      console.warn('[AI DB Manager] DB fetch failed for all users, falling back to memory:', error);
      return Array.from(this.usersMap.values()).sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  }

  /**
   * [AI DB 총괄 특강: 마케팅 콘텐츠 통합 조회]
   * "데이터는 엮어야 제맛입니다. 콘텐츠만 보여주면 어디에 쓰는지 모르니까요."
   * - innerJoin: 명소(Landmarks) 테이블과 결합하여 '장소 이름'을 함께 가져옵니다.
   * - AI DB Manager's Tip: 복잡한 쿼리는 성능을 위해 인덱스 설계를 병행해야 합니다.
   */
  async getMarketingContents(): Promise<any[]> {
    try {
      // [적요] 마케팅 테이블과 명소 테이블을 결합하여 가독성 높은 리스트를 만듭니다.
      const { marketingContents: marketingTable, landmarks: landmarksTable } = await import("@shared/schema");
      return await db
        .select({
          id: marketingTable.id,
          landmarkId: marketingTable.landmarkId,
          landmarkName: landmarksTable.name,
          content: marketingTable.content,
          updatedAt: marketingTable.updatedAt,
        })
        .from(marketingTable)
        .innerJoin(landmarksTable, eq(marketingTable.landmarkId, landmarksTable.id))
        .orderBy(desc(marketingTable.updatedAt));
    } catch (error) {
      console.warn('[AI DB Manager] DB fetch failed for marketing contents, falling back to empty list:', error);
      return [];
    }
  }
  async createCity(cityData: any): Promise<City> {
    try {
      const [newCity] = await db.insert(citiesTable).values(cityData).returning();
      return newCity as City;
    } catch (error) {
      console.warn('[AI DB Manager] DB create city failed, falling back to memory:', error);
      const newCityMem = { ...cityData, id: cityData.id || `city_${Date.now()}` } as City;
      this.citiesMap.set(newCityMem.id, newCityMem);
      console.log(`[Storage Debug] City saved to memory map. Map size: ${this.citiesMap.size}`);
      // this.saveToDisk(); // Persistence disabled
      return newCityMem;
    }
  }

  async createLandmark(landmarkData: any): Promise<Landmark> {
    try {
      const [newLandmark] = await db.insert(landmarksTable).values(landmarkData).returning();
      return newLandmark as Landmark;
    } catch (error) {
      console.warn('[AI DB Manager] DB create landmark failed, falling back to memory:', error);
      const newLandmark = { ...landmarkData, id: landmarkData.id || `landmark_${Date.now()}` } as Landmark;
      this.landmarksMap.set(newLandmark.id, newLandmark);
      // this.saveToDisk(); // Persistence disabled
      return newLandmark;
    }
  }

  async updateCity(id: string, updates: Partial<City>): Promise<City | undefined> {
    try {
      const [updated] = await db
        .update(citiesTable)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(citiesTable.id, id))
        .returning();
      return updated as City;
    } catch (error) {
      console.warn('[AI DB Manager] DB update city failed, falling back to memory:', error);
      const city = this.citiesMap.get(id);
      if (city) {
        const updatedCity = { ...city, ...updates, updatedAt: new Date() };
        this.citiesMap.set(id, updatedCity);
        // this.saveToDisk();
        return updatedCity;
      }
      return undefined;
    }
  }

  async updateLandmark(id: string, updates: Partial<Landmark>): Promise<Landmark | undefined> {
    try {
      const [updated] = await db
        .update(landmarksTable)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(landmarksTable.id, id))
        .returning();
      return updated as Landmark;
    } catch (error) {
      console.warn('[AI DB Manager] DB update landmark failed, falling back to memory:', error);
      const landmark = this.landmarksMap.get(id);
      if (landmark) {
        const updatedLandmark = { ...landmark, ...updates, updatedAt: new Date() };
        this.landmarksMap.set(id, updatedLandmark);
        // this.saveToDisk();
        return updatedLandmark;
      }
      return undefined;
    }
  }

  async getLandmarkGuides(landmarkId: string): Promise<DbLandmarkGuide[]> {
    const { landmarkGuides: landmarkGuidesTable } = await import("@shared/schema");
    try {
      return await db
        .select()
        .from(landmarkGuidesTable)
        .where(eq(landmarkGuidesTable.landmarkId, landmarkId))
        .orderBy(desc(landmarkGuidesTable.createdAt));
    } catch (error) {
      console.warn('[AI DB Manager] DB fetch failed for landmark guides:', error);
      return [];
    }
  }

  async createLandmarkGuide(guide: InsertLandmarkGuide): Promise<DbLandmarkGuide> {
    const { landmarkGuides: landmarkGuidesTable } = await import("@shared/schema");
    try {
      const [newGuide] = await db
        .insert(landmarkGuidesTable)
        .values(guide)
        .onConflictDoUpdate({
          target: [landmarkGuidesTable.landmarkId, landmarkGuidesTable.userId],
          set: {
            narration: guide.narration,
            description: guide.description,
            detailedDescription: guide.detailedDescription,
            translations: guide.translations,
            updatedAt: new Date()
          }
        })
        .returning();
      return newGuide;
    } catch (error) {
      console.error('[AI DB Manager] DB create landmark guide failed:', error);
      throw error;
    }
  }
}

export const storage = new MemStorage();

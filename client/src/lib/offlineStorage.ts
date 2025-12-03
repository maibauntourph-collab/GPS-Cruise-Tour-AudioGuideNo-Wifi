import type { City, Landmark } from "@shared/schema";

const DB_NAME = 'gps-audio-guide-offline';
const DB_VERSION = 1;

interface OfflinePackage {
  city: City;
  landmarks: Landmark[];
  version: number;
  downloadedAt: string;
  etag?: string;
}

interface CityMetadata {
  id: string;
  name: string;
  country: string;
  landmarkCount: number;
  downloadedAt: string;
  version: number;
  etag?: string;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('cities')) {
          const citiesStore = db.createObjectStore('cities', { keyPath: 'id' });
          citiesStore.createIndex('name', 'name', { unique: false });
        }

        if (!db.objectStoreNames.contains('landmarks')) {
          const landmarksStore = db.createObjectStore('landmarks', { keyPath: 'id' });
          landmarksStore.createIndex('cityId', 'cityId', { unique: false });
          landmarksStore.createIndex('category', 'category', { unique: false });
        }

        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'cityId' });
        }

        if (!db.objectStoreNames.contains('visitedQueue')) {
          const queueStore = db.createObjectStore('visitedQueue', { keyPath: 'id', autoIncrement: true });
          queueStore.createIndex('synced', 'synced', { unique: false });
        }

        console.log('IndexedDB schema created');
      };
    });

    return this.initPromise;
  }

  private async ensureDb(): Promise<IDBDatabase> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  async saveOfflinePackage(packageData: OfflinePackage, etag?: string): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cities', 'landmarks', 'metadata'], 'readwrite');

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => {
        console.log(`Saved offline package for ${packageData.city.name}: ${packageData.landmarks.length} landmarks`);
        resolve();
      };

      const citiesStore = transaction.objectStore('cities');
      citiesStore.put(packageData.city);

      const landmarksStore = transaction.objectStore('landmarks');
      for (const landmark of packageData.landmarks) {
        landmarksStore.put(landmark);
      }

      const metadataStore = transaction.objectStore('metadata');
      const metadata: CityMetadata = {
        id: packageData.city.id,
        name: packageData.city.name,
        country: packageData.city.country,
        landmarkCount: packageData.landmarks.length,
        downloadedAt: packageData.downloadedAt,
        version: packageData.version,
        etag
      };
      metadataStore.put({ cityId: packageData.city.id, ...metadata });
    });
  }

  async getCity(cityId: string): Promise<City | null> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cities'], 'readonly');
      const store = transaction.objectStore('cities');
      const request = store.get(cityId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getAllCities(): Promise<City[]> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cities'], 'readonly');
      const store = transaction.objectStore('cities');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getLandmarks(cityId?: string): Promise<Landmark[]> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['landmarks'], 'readonly');
      const store = transaction.objectStore('landmarks');

      if (cityId) {
        const index = store.index('cityId');
        const request = index.getAll(cityId);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      } else {
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      }
    });
  }

  async getLandmark(id: string): Promise<Landmark | null> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['landmarks'], 'readonly');
      const store = transaction.objectStore('landmarks');
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getCityMetadata(cityId: string): Promise<CityMetadata | null> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      const request = store.get(cityId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          const { cityId: _, ...metadata } = result;
          resolve(metadata as CityMetadata);
        } else {
          resolve(null);
        }
      };
    });
  }

  async getAllCitiesMetadata(): Promise<CityMetadata[]> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = request.result.map((item: any) => {
          const { cityId, ...metadata } = item;
          return { id: cityId, ...metadata } as CityMetadata;
        });
        resolve(results);
      };
    });
  }

  async isCityDownloaded(cityId: string): Promise<boolean> {
    const metadata = await this.getCityMetadata(cityId);
    return metadata !== null;
  }

  async deleteCityData(cityId: string): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cities', 'landmarks', 'metadata'], 'readwrite');

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => {
        console.log(`Deleted offline data for city: ${cityId}`);
        resolve();
      };

      transaction.objectStore('cities').delete(cityId);
      transaction.objectStore('metadata').delete(cityId);

      const landmarksStore = transaction.objectStore('landmarks');
      const index = landmarksStore.index('cityId');
      const cursorRequest = index.openCursor(IDBKeyRange.only(cityId));
      
      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          landmarksStore.delete(cursor.primaryKey);
          cursor.continue();
        }
      };
    });
  }

  async queueVisitedLandmark(landmarkId: string, sessionId?: string): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['visitedQueue'], 'readwrite');
      const store = transaction.objectStore('visitedQueue');

      const request = store.add({
        landmarkId,
        sessionId,
        visitedAt: new Date().toISOString(),
        synced: 0 // 0 = not synced, 1 = synced (using number for IndexedDB compatibility)
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getUnsynkedVisits(): Promise<Array<{ id: number; landmarkId: string; sessionId?: string; visitedAt: string }>> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['visitedQueue'], 'readonly');
      const store = transaction.objectStore('visitedQueue');
      const index = store.index('synced');
      const request = index.getAll(IDBKeyRange.only(0));

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async markVisitSynced(id: number): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['visitedQueue'], 'readwrite');
      const store = transaction.objectStore('visitedQueue');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.synced = 1; // Mark as synced
          store.put(item);
        }
      };

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  }

  async clearSyncedVisits(): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['visitedQueue'], 'readwrite');
      const store = transaction.objectStore('visitedQueue');
      const index = store.index('synced');
      const cursorRequest = index.openCursor(IDBKeyRange.only(1)); // 1 = synced

      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        }
      };

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  }

  async getStorageSize(): Promise<{ cities: number; landmarks: number; total: number }> {
    const db = await this.ensureDb();

    const countStore = (storeName: string): Promise<number> => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.count();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
    };

    const [cities, landmarks] = await Promise.all([
      countStore('cities'),
      countStore('landmarks')
    ]);

    return { cities, landmarks, total: cities + landmarks };
  }

  async clearAll(): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cities', 'landmarks', 'metadata', 'visitedQueue'], 'readwrite');
      
      transaction.objectStore('cities').clear();
      transaction.objectStore('landmarks').clear();
      transaction.objectStore('metadata').clear();
      transaction.objectStore('visitedQueue').clear();

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => {
        console.log('All offline data cleared');
        resolve();
      };
    });
  }
}

export const offlineStorage = new OfflineStorage();
export type { OfflinePackage, CityMetadata };

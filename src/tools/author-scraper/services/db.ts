export interface ScrapedNote {
    id: string; // url as id
    href: string;
    likeCount: number;
    likeStr: string;
    cover: string;
    title: string;
    content: string;
    images: string[];
    scrapedAt: number;
}

const DB_NAME = 'XhsScraperDB';
const STORE_NAME = 'scrapedNotes';
const DB_VERSION = 1;

export class ScraperDB {
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        if (this.db) return;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('scrapedAt', 'scrapedAt', { unique: false });
                    store.createIndex('likeCount', 'likeCount', { unique: false });
                }
            };
        });
    }

    async saveNotes(notes: ScrapedNote[]): Promise<void> {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);

            notes.forEach(note => {
                store.put(note);
            });
        });
    }

    async getAllNotes(): Promise<ScrapedNote[]> {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                // 按抓取时间倒序
                const result = request.result.sort((a, b) => b.scrapedAt - a.scrapedAt);
                resolve(result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async clearAll(): Promise<void> {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

export const scraperDb = new ScraperDB();

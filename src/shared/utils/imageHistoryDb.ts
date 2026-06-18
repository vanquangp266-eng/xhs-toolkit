import type { GeneratedImage } from '../../tools/image-studio/types';
import type { BatchItem } from '../../tools/batch-image/types';

const DB_NAME = 'xhs-image-history-db';
const DB_VERSION = 1;
const STUDIO_STORE = 'studioImages';
const BATCH_STORE = 'batchImages';

const openDb = (): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STUDIO_STORE)) db.createObjectStore(STUDIO_STORE, { keyPath: 'id' });
            if (!db.objectStoreNames.contains(BATCH_STORE)) db.createObjectStore(BATCH_STORE, { keyPath: 'id' });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });

const runStore = async <T>(
    storeName: string,
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T | undefined> => {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const req = action(store);
        let result: T | undefined;

        if (req) {
            req.onsuccess = () => {
                result = req.result;
            };
            req.onerror = () => reject(req.error);
        }

        tx.oncomplete = () => {
            db.close();
            resolve(result);
        };
        tx.onerror = () => {
            db.close();
            reject(tx.error);
        };
    });
};

export const imageHistoryDb = {
    async saveStudioImage(image: GeneratedImage) {
        await runStore(STUDIO_STORE, 'readwrite', store => store.put(image));
    },

    async listStudioImages(): Promise<GeneratedImage[]> {
        const rows = await runStore<GeneratedImage[]>(STUDIO_STORE, 'readonly', store => store.getAll());
        return (rows || []).sort((a, b) => b.timestamp - a.timestamp);
    },

    async clearStudioImages() {
        await runStore(STUDIO_STORE, 'readwrite', store => store.clear());
    },

    async saveBatchItems(items: BatchItem[]) {
        const successItems = items.filter(item => item.status === 'success' && item.resultUrl);
        await runStore(BATCH_STORE, 'readwrite', store => {
            successItems.forEach(item => store.put(item));
        });
    },

    async listBatchItems(): Promise<BatchItem[]> {
        const rows = await runStore<BatchItem[]>(BATCH_STORE, 'readonly', store => store.getAll());
        return rows || [];
    },

    async clearBatchImages() {
        await runStore(BATCH_STORE, 'readwrite', store => store.clear());
    },
};

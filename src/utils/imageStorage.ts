export const saveImageToStorage = (key: string, base64Data: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('DreamRoomDB', 2);

        request.onerror = () => reject('Error opening database');

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('images')) {
                db.createObjectStore('images');
            }
        };

        request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const transaction = db.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');

            const putRequest = store.put(base64Data, key);

            putRequest.onerror = () => reject('Error saving image');
            putRequest.onsuccess = () => resolve();
        };
    });
};

export const getImageFromStorage = (key: string): Promise<string | null> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('DreamRoomDB', 2);

        request.onerror = () => reject('Error opening database');

        request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('images')) {
                resolve(null);
                return;
            }

            const transaction = db.transaction(['images'], 'readonly');
            const store = transaction.objectStore('images');

            const getRequest = store.get(key);

            getRequest.onerror = () => reject('Error getting image');
            getRequest.onsuccess = () => resolve(getRequest.result || null);
        };
    });
};

// db.js

// Import openDB from idb (version 6)
import { openDB } from 'https://unpkg.com/idb?module';

// Set up IndexedDB
export const dbPromise = openDB('markdown-notes-db', 1, {
  upgrade(db) {
    db.createObjectStore('handles', {
      keyPath: 'id',
    });
  },
});

// Store the directory handles in IndexedDB
export async function storeDirectoryHandles(rootHandle, currentHandle) {
  const db = await dbPromise;
  await db.put('handles', { id: 'root', handle: rootHandle });
  await db.put('handles', { id: 'current', handle: currentHandle });
}

// Retrieve the stored directory handles
export async function getStoredDirectoryHandles() {
  const db = await dbPromise;
  const rootHandleEntry = await db.get('handles', 'root');
  const currentHandleEntry = await db.get('handles', 'current');
  return {
    rootHandle: rootHandleEntry ? rootHandleEntry.handle : null,
    currentHandle: currentHandleEntry ? currentHandleEntry.handle : null,
  };
}

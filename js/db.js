// db.js

// Import openDB from idb (version 6)
import { openDB } from 'https://unpkg.com/idb?module';

// Set up IndexedDB
export const dbPromise = openDB('markdown-notes-db', 2, {
  upgrade(db, oldVersion) {
    if (oldVersion < 1) {
      // Version 1 setup
      db.createObjectStore('handles', { keyPath: 'id' });
    }
    if (oldVersion < 2) {
      // Version 2 setup: Create a new object store for settings
      db.createObjectStore('settings', { keyPath: 'key' });
    }
  },
});

// Store the directory handles in IndexedDB
export async function storeDirectoryCurrentHandle(currentHandle) {
  const db = await dbPromise;
  await db.put('handles', { id: 'current', handle: currentHandle });
}

// Store the directory handles in IndexedDB
export async function storeDirectoryRootHandle(rootHandle) {
  const db = await dbPromise;
  await db.put('handles', { id: 'root', handle: rootHandle });
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

// Save a setting to IndexedDB
export async function saveSetting(key, value) {
  const db = await dbPromise;
  await db.put('settings', { key, value });
}

// Retrieve a setting from IndexedDB
export async function getSetting(key) {
  const db = await dbPromise;
  const result = await db.get('settings', key);
  return result ? result.value : null;
}
// service-worker.js

const CACHE_NAME = 'markdown-notes-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/editor.css',
    '/main.js',
    '/manifest.json',
    '/js/ai.js',
    '/js/db.js',
    '/js/directoryTree.js',
    '/js/domElements.js',
    '/js/editor.js',
    '/js/eventListeners.js',
    '/js/fileSystem.js',
    '/js/permissions.js',
    '/js/utils.js',
    'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
    'https://unpkg.com/easymde/dist/easymde.min.css',
    'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    // Exclude IndexedDB requests and permission requests
    if (
      event.request.url.includes('/indexeddb') ||
      event.request.url.includes('showDirectoryPicker')
    ) {
      // Bypass the Service Worker for these requests
      return;
    }
  
    event.respondWith(
      caches.match(event.request).then((response) => {
        // Return the cached response if found
        if (response) {
          return response;
        }
        // Fetch from network
        return fetch(event.request);
      })
    );
  });

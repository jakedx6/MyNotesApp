// main.js

import { getStoredDirectoryHandles } from './js/db.js';
import { renderDirectoryTree } from './js/directoryTree.js';
import { initializeEventListeners } from './js/eventListeners.js';
import { toggleEditorDisplay, showElement } from './js/utils.js';
import { verifyPermission } from './js/permissions.js';

/*** Application Initialization ***/

let rootDirectoryHandle;
let currentDirectoryHandle;
let currentFileHandle;

// Attempt to load the stored directory handle on app load
window.addEventListener('DOMContentLoaded', async () => {
  initializeEventListeners(); // Initialize event listeners

  const handles = await getStoredDirectoryHandles();
  rootDirectoryHandle = handles.rootHandle;
  currentDirectoryHandle = handles.currentHandle || rootDirectoryHandle;

  if (rootDirectoryHandle) {
    const permission = await verifyPermission(rootDirectoryHandle);
    if (permission) {
      await renderDirectoryTree(rootDirectoryHandle);
    } else {
      // Permission not granted, request it again
      showOpenDirectoryPrompt();
    }
  } else {
    showOpenDirectoryPrompt();
  }

  // Register the service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js', { scope: '/' })
      .then((reg) => console.log('Service Worker registered', reg))
      .catch((err) => console.error('Service Worker registration failed', err));
  }
});

// Show the open directory prompt
function showOpenDirectoryPrompt() {
  showElement('prompt-container');
}

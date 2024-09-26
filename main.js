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
  if (handles.rootHandle) {
    const permission = await verifyPermission(handles.rootHandle);
    if (permission) {
      await renderDirectoryTree(handles.currentHandle || handles.rootHandle);
      toggleEditorDisplay(false);
    } else {
      showOpenDirectoryPrompt();
    }
  } else {
    showOpenDirectoryPrompt();
  }

  // Register the service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
      .then((reg) => console.log('Service Worker registered', reg))
      .catch((err) => console.error('Service Worker registration failed', err));
  }
});

// Show the open directory prompt
function showOpenDirectoryPrompt() {
  showElement('prompt-container');
}

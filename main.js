// main.js

import { getSetting } from './js/db.js';
import { renderDirectoryTree } from './js/directoryTree.js';
import { initializeEventListeners } from './js/eventListeners.js';

/*** Application Initialization ***/

async function applyDarkModeSetting() {
  const isDarkMode = await getSetting('darkMode');
  if (isDarkMode === true || isDarkMode === 'true') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  initializeEventListeners(); // Initialize event listeners

  // Render the directory tree from the server
  await renderDirectoryTree();

  // Apply dark mode setting
  await applyDarkModeSetting();

});

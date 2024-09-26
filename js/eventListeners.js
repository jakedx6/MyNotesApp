// eventListeners.js

import { promptCreateNote, promptCreateFolder, changeMainDirectory, requestDirectoryAccess } from './fileSystem.js';

/*** Event Listeners and UI Actions ***/

// Initialize event listeners
export function initializeEventListeners() {
  document.getElementById('new-note-btn').addEventListener('click', (event) => {
    event.stopPropagation();
    promptCreateNote();
  });

  document.getElementById('new-folder-btn').addEventListener('click', (event) => {
    event.stopPropagation();
    promptCreateFolder();
  });

  document.getElementById('change-directory-btn').addEventListener('click', async (event) => {
    event.stopPropagation();
    await changeMainDirectory();
  });

  // Toggle dark mode
  document.getElementById('toggle-dark-mode-btn').addEventListener('click', () => {
    toggleDarkMode();
  });

  // Event listener for the "Open Directory" button
  document.getElementById('open-directory-btn').addEventListener('click', async () => {
    await requestDirectoryAccess();
  });
}

// Toggle between light and dark mode
function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
}

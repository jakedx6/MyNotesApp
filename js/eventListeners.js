// eventListeners.js

import { promptCreateNote, promptCreateFolder, changeMainDirectory, requestDirectoryAccess } from './fileSystem.js';
import { saveSetting } from './db.js';
import { openSettingsModal, closeSettingsModal } from './domElements.js';

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

  document.getElementById('open-settings-btn').addEventListener('click', openSettingsModal);
  document.getElementById('close-settings-modal').addEventListener('click', closeSettingsModal);

  document.getElementById('save-settings-btn').addEventListener('click', async () => {
    const urlInput = document.getElementById('ollama-url-input').value.trim();
    if (urlInput) {
      await saveSetting('ollamaUrl', urlInput);
      alert('Settings saved.');
      closeSettingsModal();
    } else {
      alert('Please enter a valid URL.');
    }
  });

  // Close modal when clicking outside of it
  window.addEventListener('click', function (event) {
    const modal = document.getElementById('settings-modal');
    if (event.target === modal) {
      closeSettingsModal();
    }
  });
}

// Toggle between light and dark mode
function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
}

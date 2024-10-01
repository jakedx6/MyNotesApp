// directoryTree.js

import { API_BASE_URL } from './config.js';
import { createFileElement, createDirectoryElement } from './domElements.js';
import { hideElement, showElement } from './utils.js';
import { sortEntries } from './utils.js';

/*** Directory Tree Rendering ***/

// Render the directory tree starting from the root path
export async function renderDirectoryTree() {
  try {
    hideElement('prompt-container');
    showElement('editor-container');
    showElement('folder-list');

    // Clear the folderList contents
    const folderList = document.getElementById('folder-list');
    folderList.innerHTML = '';

    // Fetch and render the root directory
    await loadAndRenderDirectoryContents('', folderList, 0);
  } catch (error) {
    console.error('Error rendering directory tree:', error);
    showOpenDirectoryPrompt();
  }
}

// Load and render directory contents recursively
export async function loadAndRenderDirectoryContents(path, container, level) {
  try {
    // Fetch directory contents from the server
    const response = await fetch(`${API_BASE_URL}/api/directories/${encodeURIComponent(path)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch directory contents');
    }
    const entries = await response.json();

    // Sort entries
    entries.sort(sortEntries);

    // Render sorted entries
    for (const entry of entries) {
      let childElement;
      if (entry.isDirectory) {
        childElement = await createDirectoryElement(entry, level);
      } else {
        childElement = await createFileElement(entry, level);
      }
      container.appendChild(childElement);
    }
  } catch (error) {
    console.error('Error loading directory contents:', error);
  }
}

// Show the open directory prompt (modify as needed)
export function showOpenDirectoryPrompt() {
  const promptContainer = document.getElementById('prompt-container');
  if (promptContainer) {
    promptContainer.style.display = 'flex';
  }
}

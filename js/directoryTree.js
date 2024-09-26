// directoryTree.js

import { verifyPermission } from './permissions.js';
import { createFileElement, createDirectoryElement } from './domElements.js';
import { hideElement, showElement } from './utils.js';
import { sortEntries } from './utils.js';

/*** Directory Tree Rendering ***/

let rootDirectoryHandle;
let currentDirectoryHandle;

export async function renderDirectoryTree(directoryHandle = rootDirectoryHandle) {
  // Verify permission before accessing the directory
  const hasPermission = await verifyPermission(directoryHandle);
  if (!hasPermission) {
    console.error('Permission to access the directory was denied.');
    showOpenDirectoryPrompt();
    return;
  }

  hideElement('prompt-container');
  showElement('editor-container');
  showElement('folder-list');

  // Clear the folderList contents
  const folderList = document.getElementById('folder-list');
  folderList.innerHTML = '';

  // Collect and render entries
  await loadAndRenderDirectoryContents(directoryHandle, folderList, 0);
}

// Load and render directory contents recursively
export async function loadAndRenderDirectoryContents(directoryHandle, container, level) {
  // Collect entries
  const entries = [];
  for await (const entry of directoryHandle.values()) {
    entries.push(entry);
  }

  // Sort entries
  entries.sort(sortEntries);

  // Render sorted entries
  for (const entry of entries) {
    let childElement;
    if (entry.kind === 'file') {
      childElement = await createFileElement(entry, directoryHandle, level);
    } else if (entry.kind === 'directory') {
      childElement = await createDirectoryElement(entry, directoryHandle, level);
    }
    container.appendChild(childElement);
  }
}

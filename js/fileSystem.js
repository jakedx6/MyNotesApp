// fileSystem.js

import { verifyPermission } from './permissions.js';
import { storeDirectoryHandles, dbPromise } from './db.js';
import { sortEntries, toggleEditorDisplay, highlightSelectedFile } from './utils.js';
import { createFileElement, createDirectoryElement } from './domElements.js';
import { initializeEditor } from './editor.js';

export let rootDirectoryHandle;
export let currentDirectoryHandle;
export let currentFileHandle;

// Request access to a directory
export async function requestDirectoryAccess(startIn = undefined) {
  try {
    const options = startIn ? { startIn } : {};
    rootDirectoryHandle = await window.showDirectoryPicker(options);
    currentDirectoryHandle = rootDirectoryHandle;
    currentFileHandle = null; // Clear current file handle
    await storeDirectoryHandles(rootDirectoryHandle, currentDirectoryHandle);
    renderDirectoryTree(currentDirectoryHandle);
    initializeEditor(''); // Clear the editor content

    // Hide the editor and show the placeholder
    toggleEditorDisplay(false);
  } catch (error) {
    console.error('Directory access was not granted:', error);
    showOpenDirectoryPrompt();
  }
}

// Export the full changeMainDirectory function as requested
export async function changeMainDirectory() {
  try {
    const success = await requestDirectoryAccess();
    if (success) {
      // Directory access was successful
      // The calling code should handle rendering the directory tree
    }
  } catch (error) {
    console.error('Error changing directory:', error);
  }
}

// Update current directory handle and store it
export function updateCurrentDirectoryHandle(handle) {
  currentDirectoryHandle = handle;
  storeDirectoryHandles(rootDirectoryHandle, currentDirectoryHandle);
}

// Render the directory tree
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

// Open and display a markdown file
export async function openFile(fileHandle, parentDirectoryHandle) {
  try {
    const file = await fileHandle.getFile();
    const content = await file.text();
    currentFileHandle = fileHandle;
    initializeEditor(content || ''); // Ensure content is a string
    updateCurrentDirectoryHandle(parentDirectoryHandle);

    // Show the editor and hide the placeholder
    toggleEditorDisplay(true);

    // Highlight the selected file
    highlightSelectedFile(fileHandle.name);
  } catch (error) {
    console.error('Error opening file:', error);
  }
}

// Save file content
export async function saveFile(fileHandle, content) {
  try {
    const hasPermission = await verifyPermission(fileHandle, 'readwrite');
    if (!hasPermission) {
      console.error('Write permission denied for file:', fileHandle.name);
      alert('Write permission denied. Please grant permission to save changes.');
      return;
    }
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    console.log('File saved successfully:', fileHandle.name);
  } catch (error) {
    console.error('Error saving file:', error);
    if (error.name === 'InvalidStateError') {
      alert('An error occurred while saving the file. Please try re-opening the file.');
      currentFileHandle = null;
    }
  }
}

// Delete a file
export async function deleteFile(fileHandle, directoryHandle) {
  try {
    const hasPermission = await verifyPermission(directoryHandle, 'readwrite');
    if (!hasPermission) {
      console.error('No permission to delete files in this directory.');
      return;
    }
    await directoryHandle.removeEntry(fileHandle.name);
    console.log(`File "${fileHandle.name}" deleted successfully.`);

    // If the deleted file is currently open, hide the editor
    if (currentFileHandle && currentFileHandle.name === fileHandle.name) {
      currentFileHandle = null;
      // Clear the editor content
      initializeEditor('');
      // Hide the editor and show the placeholder
      toggleEditorDisplay(false);
    }

    // Refresh the directory tree
    await renderDirectoryTree(rootDirectoryHandle);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

// Create a new markdown note
export async function createNote(noteName) {
  try {
    const fileHandle = await currentDirectoryHandle.getFileHandle(`${noteName}.md`, { create: true });
    currentFileHandle = fileHandle; // Set currentFileHandle
    await saveFile(fileHandle, '');
    renderDirectoryTree(rootDirectoryHandle);
    await openFile(fileHandle, currentDirectoryHandle); // Open the new note
  } catch (error) {
    console.error('Error creating note:', error);
  }
}

// Create a new folder
export async function createFolder(folderName) {
  try {
    await currentDirectoryHandle.getDirectoryHandle(folderName, { create: true });
    renderDirectoryTree(rootDirectoryHandle); // Refresh the tree from the root
  } catch (error) {
    console.error('Error creating folder:', error);
  }
}

// Prompt to create a new folder
export function promptCreateFolder() {
  const folderName = prompt('Enter folder name:');
  if (folderName) {
    createFolder(folderName);
  }
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

// Prompt to create a new note
export function promptCreateNote() {
  const noteName = prompt('Enter note name:');
  if (noteName) {
    createNote(noteName);
  }
}

// Show the open directory prompt
export function showOpenDirectoryPrompt() {
  const promptContainer = document.getElementById('prompt-container');
  if (promptContainer) {
    promptContainer.style.display = 'flex';
  }
}

// Import utility functions
import { hideElement, showElement } from './utils.js';

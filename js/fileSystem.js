// fileSystem.js

import { API_BASE_URL } from './config.js';
import { sortEntries, toggleEditorDisplay, highlightSelectedFile, hideElement, showElement } from './utils.js';
import { createFileElement, createDirectoryElement } from './domElements.js';
import { initializeEditor } from './editor.js';

export let currentFilePath = null;
export let currentFolderPath = ''; // Initialize to root

// Setter function for currentFolderPath
export function setCurrentFolderPath(newPath) {
  currentFolderPath = newPath;
  console.log(`Current Folder Path set to: ${currentFolderPath}`); // Debugging statement
}

// Getter for currentFolderPath
export function getCurrentFolderPath() {
  return currentFolderPath;
}

// Generates a list of paths that need to be open based on currentFolderPath.
function getPathsToOpen() {
  if (!currentFolderPath) return [];
  const parts = currentFolderPath.split('/').filter(part => part); // Remove empty parts
  const paths = [];
  for (let i = 1; i <= parts.length; i++) {
    const path = parts.slice(0, i).join('/');
    paths.push(path);
  }
  return paths;
}

// Fetch and render the directory tree from the server
export async function renderDirectoryTree() {
  try {
    // Determine the paths that need to be open based on currentFolderPath
    const pathsToOpen = getPathsToOpen();

    // Fetch the root directory contents (empty path for the root)
    await renderDirectoryContents('', document.getElementById('folder-list'), 0, pathsToOpen);

    hideElement('prompt-container');
    showElement('editor-container');
    showElement('folder-list');
  } catch (error) {
    console.error('Error rendering directory tree:', error);
    showOpenDirectoryPrompt();
  }
}

// Render directory contents recursively
export async function renderDirectoryContents(folderPath, container, level, pathsToOpen = []) {
  try {
    // Fetch directory contents from the server
    const response = await fetch(`${API_BASE_URL}/api/directories/${encodeURIComponent(folderPath)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch directory contents');
    }
    let entries = await response.json();

    // Sort entries
    entries.sort(sortEntries);

    // Clear the container before rendering
    container.innerHTML = '';

    // Render sorted entries
    for (const entry of entries) {
      let childElement;
      if (entry.isDirectory) {
        childElement = await createDirectoryElement(entry, level, pathsToOpen);
      } else {
        childElement = await createFileElement(entry, level);
      }
      container.appendChild(childElement);
    }
  } catch (error) {
    console.error('Error loading directory contents:', error);
    alert('Failed to load directory contents.');
  }
}

// Open and display a markdown file
export async function openFile(filePath) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/files/${encodeURIComponent(filePath)}`);
    if (!response.ok) {
      throw new Error('Failed to open file');
    }
    const content = await response.text();
    currentFilePath = filePath;
    initializeEditor(content || '');

    // Show the editor and hide the placeholder
    toggleEditorDisplay(true);

    // Highlight the selected file
    highlightSelectedFile(filePath);
  } catch (error) {
    console.error('Error opening file:', error);
    alert('Failed to open the file. Please try again.');
  }
}

// Save file content
export async function saveFile(content) {
  try {
    if (!currentFilePath) {
      alert('No file is currently open.');
      return;
    }
    const response = await fetch(`${API_BASE_URL}/api/files/${encodeURIComponent(currentFilePath)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: content,
    });
    if (!response.ok) {
      throw new Error('Failed to save file');
    }
    console.log('File saved successfully:', currentFilePath);
  } catch (error) {
    console.error('Error saving file:', error);
    alert('An error occurred while saving the file.');
  }
}

// Delete a file
export async function deleteFile(filePath) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/files/${encodeURIComponent(filePath)}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete file');
    }
    console.log(`File "${filePath}" deleted successfully.`);

    // If the deleted file is currently open, hide the editor
    if (currentFilePath === filePath) {
      currentFilePath = null;
      // Clear the editor content
      initializeEditor('');
      // Hide the editor and show the placeholder
      toggleEditorDisplay(false);
    }

    // Refresh the directory tree
    await renderDirectoryTree();
  } catch (error) {
    console.error('Error deleting file:', error);
    alert('An error occurred while deleting the file.');
  }
}

// Create a new markdown note
export async function createNote(noteName) {
  try {
    // Determine the target folder path
    const targetFolder = currentFolderPath || ''; // Use root if no folder is open
    const filePath = targetFolder ? `${targetFolder}/${noteName}.md` : `${noteName}.md`;

    const response = await fetch(`${API_BASE_URL}/api/files/${encodeURIComponent(filePath)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: '', // Empty content for a new file
    });
    if (!response.ok) {
      throw new Error('Failed to create note');
    }
    currentFilePath = filePath;
    await renderDirectoryTree();
    await openFile(filePath); // Open the new note
  } catch (error) {
    console.error('Error creating note:', error);
    alert('An error occurred while creating the note.');
  }
}

// Create a new folder
export async function createFolder(folderName) {
  try {
    // Determine the target parent folder path
    const targetFolder = currentFolderPath || ''; // Use root if no folder is open
    const folderPath = targetFolder ? `${targetFolder}/${folderName}` : `${folderName}`;

    const response = await fetch(`${API_BASE_URL}/api/directories/${encodeURIComponent(folderPath)}`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to create folder');
    }
    await renderDirectoryTree(); // Refresh the tree
  } catch (error) {
    console.error('Error creating folder:', error);
    alert('An error occurred while creating the folder.');
  }
}

// Delete a folder and its contents recursively
export async function deleteFolder(folderPath) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/directories/${encodeURIComponent(folderPath)}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete folder');
    }
    console.log(`Folder "${folderPath}" deleted successfully.`);
    await renderDirectoryTree();
  } catch (error) {
    console.error('Error deleting folder:', error);
    alert('An error occurred while deleting the folder.');
  }
}

// Prompt to create a new folder
export function promptCreateFolder() {
  const folderName = prompt('Enter folder name:');
  if (folderName) {
    createFolder(folderName);
  }
}

// Prompt to create a new note
export function promptCreateNote() {
  const noteName = prompt('Enter note name:');
  if (noteName) {
    createNote(noteName);
  }
}

// Show the open directory prompt (modify as needed)
export function showOpenDirectoryPrompt() {
  const promptContainer = document.getElementById('prompt-container');
  if (promptContainer) {
    promptContainer.style.display = 'flex';
  }
}
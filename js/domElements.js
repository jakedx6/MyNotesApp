// domElements.js

import {
  deleteFile,
  deleteFolder,
  openFile,
  createNote,
  createFolder,
  renderDirectoryTree,
  setCurrentFolderPath,
  getCurrentFolderPath
} from './fileSystem.js';
import {
  loadAndRenderDirectoryContents,
} from './directoryTree.js';
import { getSetting } from './db.js';

/*** Initialize Event Listeners for Creating Notes and Folders ***/
document.addEventListener('DOMContentLoaded', () => {
  const newNoteButton = document.getElementById('new-note-button');
  const newFolderButton = document.getElementById('new-folder-button');

  if (newNoteButton) {
    newNoteButton.addEventListener('click', promptCreateNote);
  }

  if (newFolderButton) {
    newFolderButton.addEventListener('click', promptCreateFolder);
  }
});

/*** Prompt Functions ***/
// Prompt to create a new note
export function promptCreateNote() {
  const noteName = prompt('Enter note name:');
  if (noteName && noteName.trim() !== '') {
    createNote(noteName.trim());
  } else if (noteName !== null) { // If user didn't cancel
    alert('Note name cannot be empty.');
  }
}

// Prompt to create a new folder
export function promptCreateFolder() {
  const folderName = prompt('Enter folder name:');
  if (folderName && folderName.trim() !== '') {
    createFolder(folderName.trim());
  } else if (folderName !== null) { // If user didn't cancel
    alert('Folder name cannot be empty.');
  }
}

/*** DOM Element Creation Functions ***/

// Create directory element recursively
export async function createDirectoryElement(entry, level, pathsToOpen = []) {
  const item = document.createElement('div');
  item.classList.add('flex', 'flex-col', 'p-0');

  const folderHeader = document.createElement('div');
  folderHeader.classList.add(
    'flex',
    'items-center',
    'justify-between',
    'hover:bg-gray-200',
    'dark:hover:bg-gray-700'
  );
  folderHeader.style.paddingLeft = `${level * 0.75}rem`;

  const folderInfo = document.createElement('div');
  folderInfo.classList.add('flex', 'items-center', 'cursor-pointer');

  // Folder icon
  const folderIcon = document.createElement('span');
  folderIcon.innerHTML = `
    <span class="material-symbols-outlined">folder</span>
  `;

  const folderName = document.createElement('span');
  folderName.textContent = entry.name;
  folderName.classList.add('font-bold');

  folderInfo.appendChild(folderIcon);
  folderInfo.appendChild(folderName);

  // Add folderInfo to folderHeader
  folderHeader.appendChild(folderInfo);

  // Delete button for folder
  const deleteButton = document.createElement('button');
  deleteButton.innerHTML = `
    <span class="material-symbols-outlined text-red-500">delete</span>
  `;

  // Add event listener to the delete button
  deleteButton.addEventListener('click', async (event) => {
    event.stopPropagation();
    const confirmDelete = confirm(
      `Are you sure you want to delete the folder "${entry.name}" and all its contents? This action cannot be undone.`
    );
    if (confirmDelete) {
      await deleteFolder(entry.path);
      setCurrentFolderPath('');
      await renderDirectoryTree();
    }
  });

  // Add the delete button to the folderHeader
  folderHeader.appendChild(deleteButton);

  item.appendChild(folderHeader);

  const childrenContainer = document.createElement('div');
  childrenContainer.classList.add('flex', 'flex-col', 'p-0');
  childrenContainer.style.display = 'none'; // Initially collapsed

  folderInfo.addEventListener('click', async (event) => {
    event.stopPropagation();
    if (childrenContainer.style.display === 'none') {
      childrenContainer.style.display = 'flex';
      // Change folder icon to open
      folderIcon.innerHTML = `
        <span class="material-symbols-outlined">folder_open</span>
      `;
      if (!childrenContainer.hasChildNodes()) {
        // Load and render child entries
        await loadAndRenderDirectoryContents(entry.path, childrenContainer, level + 1, pathsToOpen);
      }
      // Set currentFolderPath to the opened folder
      setCurrentFolderPath(entry.path);
    } else {
      childrenContainer.style.display = 'none';
      // Change folder icon to closed
      folderIcon.innerHTML = `
        <span class="material-symbols-outlined">folder</span>
      `;
      // If the currentFolderPath is the folder being closed, reset it to root
      if (getCurrentFolderPath() === entry.path) {
        setCurrentFolderPath('');
      }
    }
  });

  // Automatically open the folder if it's in pathsToOpen
  if (pathsToOpen.includes(entry.path)) {
    childrenContainer.style.display = 'flex';
    // Change folder icon to open
    folderIcon.innerHTML = `
      <span class="material-symbols-outlined">folder_open</span>
    `;
    // Load and render child entries
    await loadAndRenderDirectoryContents(entry.path, childrenContainer, level + 1, pathsToOpen);
  }

  item.appendChild(childrenContainer);

  return item;
}

// Create file element
export async function createFileElement(entry, level) {
  const item = document.createElement('div');
  item.classList.add(
    'flex',
    'items-center',
    'justify-between',
    'hover:bg-gray-200',
    'dark:hover:bg-gray-700',
    'file-item'
  );
  item.style.paddingLeft = `${level * 0.75}rem`;

  const fileInfo = document.createElement('div');
  fileInfo.classList.add('flex', 'items-center', 'cursor-pointer');

  // File icon
  const fileIcon = document.createElement('span');
  fileIcon.innerHTML = `
    <span class="material-symbols-outlined">description</span>
  `;

  const fileName = document.createElement('span');
  fileName.textContent = entry.name;
  fileName.classList.add('text-blue-600', 'dark:text-blue-400', 'file-name');

  fileInfo.appendChild(fileIcon);
  fileInfo.appendChild(fileName);

  item.appendChild(fileInfo);

  // Delete button
  const deleteButton = document.createElement('button');
  deleteButton.innerHTML = `
    <span class="material-symbols-outlined text-red-500">delete</span>
  `;
  deleteButton.classList.add('focus:outline-none');

  item.appendChild(deleteButton);

  fileInfo.addEventListener('click', async () => {
    await openFile(entry.path);
  });

  return item;
}

/*** Show AI Response Modal ***/
export function showAIResponseModal(aiResponse, doc) {
  const modal = document.getElementById('ai-response-modal');
  const closeModalButton = document.getElementById('close-modal');
  const copyButton = document.getElementById('copy-button');
  const appendButton = document.getElementById('append-button');
  const replaceButton = document.getElementById('replace-button');
  const aiResponseText = document.getElementById('ai-response-text');

  // Set the AI response text
  aiResponseText.value = aiResponse;

  // Show the modal
  modal.style.display = 'flex';

  // Close modal function
  function closeModal() {
    modal.style.display = 'none';
    // Remove event listeners to prevent duplicates
    closeModalButton.removeEventListener('click', closeModal);
    copyButton.removeEventListener('click', handleCopy);
    appendButton.removeEventListener('click', handleAppend);
    replaceButton.removeEventListener('click', handleReplace);
  }

  // Copy action using Clipboard API
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(aiResponseText.value);
      // Display a temporary message
      const copyMessage = document.createElement('span');
      copyMessage.textContent = 'Copied to clipboard!';
      copyMessage.style.color = 'green';
      copyButton.parentElement.insertBefore(copyMessage, copyButton.nextSibling);

      setTimeout(() => {
        copyMessage.remove();
      }, 2000);
    } catch (err) {
      console.error('Error copying text: ', err);
      alert('Error copying text to clipboard.');
    }
  }

  // Append action
  function handleAppend() {
    const selectedText = doc.getSelection();
    doc.replaceSelection(selectedText + aiResponse);
    closeModal();
  }

  // Replace action
  function handleReplace() {
    doc.replaceSelection(aiResponse);
    closeModal();
  }

  // Event listeners
  closeModalButton.addEventListener('click', closeModal);
  copyButton.addEventListener('click', handleCopy);
  appendButton.addEventListener('click', handleAppend);
  replaceButton.addEventListener('click', handleReplace);

  // Close modal when clicking outside of the modal content
  window.addEventListener(
    'click',
    function (event) {
      if (event.target === modal) {
        closeModal();
      }
    },
    { once: true }
  );
}

// Settings Modal Functions
export async function openSettingsModal() {
  document.getElementById('settings-modal').style.display = 'block';
  const currentUrl = await getSetting('ollamaUrl');
  document.getElementById('ollama-url-input').value =
    currentUrl || 'http://localhost:11434';
}

export function closeSettingsModal() {
  document.getElementById('settings-modal').style.display = 'none';
}

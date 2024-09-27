// domElements.js

import {
  updateCurrentDirectoryHandle,
  deleteFile,
  deleteFolder,
  openFile,
  rootDirectoryHandle,
} from './fileSystem.js';
import {
  loadAndRenderDirectoryContents,
  renderDirectoryTree,
} from './directoryTree.js';
import { getSetting } from './db.js';

/*** DOM Element Creation Functions ***/

// Create directory element recursively
export async function createDirectoryElement(
  directoryHandle,
  parentDirectoryHandle,
  level
) {
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

  // Folder icon (closed)
  const folderIcon = document.createElement('span');
  folderIcon.innerHTML = `
    <span class="material-symbols-outlined pr-2">folder</span>
  `;

  const folderName = document.createElement('span');
  folderName.textContent = directoryHandle.name;
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
  deleteButton.classList.add('focus:outline-none');

  // **Add event listener to the delete button**
  deleteButton.addEventListener('click', async (event) => {
    event.stopPropagation();
    const confirmDelete = confirm(
      `Are you sure you want to delete the folder "${directoryHandle.name}" and all its contents? This action cannot be undone.`
    );
    if (confirmDelete) {
      await deleteFolder(directoryHandle, parentDirectoryHandle);
      // Refresh the directory tree from the root
      await renderDirectoryTree(rootDirectoryHandle);
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
    updateCurrentDirectoryHandle(directoryHandle);
    if (childrenContainer.style.display === 'none') {
      childrenContainer.style.display = 'flex';
      // Change folder icon to open
      folderIcon.innerHTML = `
        <span class="material-symbols-outlined pr-2">folder_open</span>
      `;
      if (!childrenContainer.hasChildNodes()) {
        // Load and render child entries
        await loadAndRenderDirectoryContents(
          directoryHandle,
          childrenContainer,
          level + 1
        );
      }
    } else {
      childrenContainer.style.display = 'none';
      // Change folder icon to closed
      folderIcon.innerHTML = `
        <span class="material-symbols-outlined pr-2">folder</span>
      `;
    }
  });

  item.appendChild(childrenContainer);

  return item;
}

// Create file element
export async function createFileElement(
  fileHandle,
  parentDirectoryHandle,
  level
) {
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
  fileName.textContent = fileHandle.name;
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

  deleteButton.addEventListener('click', async (event) => {
    event.stopPropagation();
    const confirmDelete = confirm(
      `Are you sure you want to delete "${fileHandle.name}"?`
    );
    if (confirmDelete) {
      await deleteFile(fileHandle, parentDirectoryHandle);
      await renderDirectoryTree(rootDirectoryHandle);
    }
  });

  item.appendChild(deleteButton);

  fileInfo.addEventListener('click', async () => {
    await openFile(fileHandle, parentDirectoryHandle);
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

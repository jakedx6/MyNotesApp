// domElements.js

import { updateCurrentDirectoryHandle, deleteFile, openFile } from './fileSystem.js';
import { loadAndRenderDirectoryContents } from './directoryTree.js';
import { getSetting } from './db.js';

/*** DOM Element Creation Functions ***/

// Create directory element recursively
export async function createDirectoryElement(directoryHandle, parentDirectoryHandle, level) {
  const item = document.createElement('div');
  item.classList.add('flex', 'flex-col');

  const folderHeader = document.createElement('div');
  folderHeader.classList.add('flex', 'items-center', 'cursor-pointer', 'hover:bg-gray-200', 'dark:hover:bg-gray-700', 'p-2');
  folderHeader.style.paddingLeft = `${level * 1.5}rem`;

  // Folder icon (closed)
  const folderIcon = document.createElement('span');
  folderIcon.innerHTML = `
    <svg class="w-5 h-5 mr-2 inline-block" fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v1H2V6z" />
      <path d="M2 9h16v5a2 2 0 01-2 2H4a2 2 0 01-2-2V9z" />
    </svg>
  `;

  const folderName = document.createElement('span');
  folderName.textContent = directoryHandle.name;
  folderName.classList.add('font-bold');

  folderHeader.appendChild(folderIcon);
  folderHeader.appendChild(folderName);

  item.appendChild(folderHeader);

  const childrenContainer = document.createElement('div');
  childrenContainer.classList.add('flex', 'flex-col');
  childrenContainer.style.display = 'none'; // Initially collapsed

  folderHeader.onclick = async (event) => {
    event.stopPropagation();
    updateCurrentDirectoryHandle(directoryHandle);
    if (childrenContainer.style.display === 'none') {
      childrenContainer.style.display = 'flex';
      // Change folder icon to open
      folderIcon.innerHTML = `
        <svg class="w-5 h-5 mr-2 inline-block" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v1H2V6z" />
          <path d="M2 9h16v5a2 2 0 01-2 2H4a2 2 0 01-2-2V9z" />
        </svg>
      `;
       if (!childrenContainer.hasChildNodes()) {
        // Load and render child entries
        await loadAndRenderDirectoryContents(directoryHandle, childrenContainer, level + 1);
      }
    } else {
      childrenContainer.style.display = 'none';
      // Change folder icon to closed
      folderIcon.innerHTML = `
        <svg class="w-5 h-5 mr-2 inline-block" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v1H2V6z" />
          <path d="M2 9h16v5a2 2 0 01-2 2H4a2 2 0 01-2-2V9z" />
        </svg>
      `;
    }
  };

  item.appendChild(childrenContainer);

  return item;
}

// Create file element
export async function createFileElement(fileHandle, parentDirectoryHandle, level) {
  const item = document.createElement('div');
  item.classList.add('flex', 'items-center', 'justify-between', 'hover:bg-gray-200', 'dark:hover:bg-gray-700', 'p-2', 'file-item');
  item.style.paddingLeft = `${level * 1.5}rem`;

  const fileInfo = document.createElement('div');
  fileInfo.classList.add('flex', 'items-center', 'cursor-pointer');

  // File icon
  const fileIcon = document.createElement('span');
  fileIcon.innerHTML =`
    <svg class="w-5 h-5 mr-2 inline-block" fill="currentColor" viewBox="0 0 20 20">
      <path d="M4 2h8l4 4v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z" />
    </svg>
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
    <svg class="w-5 h-5 text-red-600 hover:text-red-800" fill="currentColor" viewBox="0 0 20 20">
      <path d="M6 6h8v10H6V6z" />
      <path fill-rule="evenodd" d="M4 4h12v2H4V4zm3 2h6v10H7V6z" clip-rule="evenodd" />
    </svg>
  `;
  deleteButton.classList.add('focus:outline-none');

  deleteButton.addEventListener('click', async (event) => {
    event.stopPropagation();
    const confirmDelete = confirm(`Are you sure you want to delete "${fileHandle.name}"?`);
    if (confirmDelete) {
      await deleteFile(fileHandle, parentDirectoryHandle);
      renderDirectoryTree(rootDirectoryHandle);
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
  document.getElementById('ollama-url-input').value = currentUrl || 'http://localhost:11434';
}


export function closeSettingsModal() {
  document.getElementById('settings-modal').style.display = 'none';
}
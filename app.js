// app.js

let rootDirectoryHandle;
let currentDirectoryHandle;
let currentFileHandle;
let easyMDE;

const editorElement = document.getElementById('editor');

// Import openDB from idb (version 6)
const { openDB } = idb;

// Set up IndexedDB
const dbPromise = openDB('markdown-notes-db', 1, {
  upgrade(db) {
    db.createObjectStore('handles', {
      keyPath: 'id',
    });
  },
});

// Verify permission to access a handle
async function verifyPermission(fileHandle, mode = 'readwrite') {
  const options = { mode };
  // Check if permission was already granted
  if ((await fileHandle.queryPermission(options)) === 'granted') {
    return true;
  }
  // Request permission
  if ((await fileHandle.requestPermission(options)) === 'granted') {
    return true;
  }
  // Permission was not granted
  return false;
}

// Store the directory handles in IndexedDB
async function storeDirectoryHandles(rootHandle, currentHandle) {
  const db = await dbPromise;
  await db.put('handles', { id: 'root', handle: rootHandle });
  await db.put('handles', { id: 'current', handle: currentHandle });
}

// Retrieve the stored directory handles
async function getStoredDirectoryHandles() {
  const db = await dbPromise;
  const rootHandleEntry = await db.get('handles', 'root');
  const currentHandleEntry = await db.get('handles', 'current');
  return {
    rootHandle: rootHandleEntry ? rootHandleEntry.handle : null,
    currentHandle: currentHandleEntry ? currentHandleEntry.handle : null,
  };
}

// Request access to a directory
async function requestDirectoryAccess(startIn = undefined) {
  try {
    const options = startIn ? { startIn } : {};
    rootDirectoryHandle = await window.showDirectoryPicker(options);
    currentDirectoryHandle = rootDirectoryHandle;
    currentFileHandle = null; // Clear current file handle
    await storeDirectoryHandles(rootDirectoryHandle, currentDirectoryHandle);
    renderDirectoryTree(currentDirectoryHandle);
    initializeEditor(''); // Clear the editor content

    // Hide the editor and show the placeholder
    const editorContainer = document.getElementById('editor-container');
    const placeholderContainer = document.getElementById('placeholder-container');
    if (editorContainer) {
      editorContainer.style.display = 'none';
    }
    if (placeholderContainer) {
      placeholderContainer.style.display = 'flex';
    }
  } catch (error) {
    console.error('Directory access was not granted:', error);
    showOpenDirectoryPrompt();
  }
}

// Update current directory handle and store it
function updateCurrentDirectoryHandle(handle) {
  currentDirectoryHandle = handle;
  storeDirectoryHandles(rootDirectoryHandle, currentDirectoryHandle);
}

async function loadAndRenderDirectoryContents(directoryHandle, container, level) {
  // Collect entries
  const entries = [];
  for await (const entry of directoryHandle.values()) {
    entries.push(entry);
  }

  // Sort entries
  entries.sort((a, b) => {
    if (a.kind !== b.kind) {
      return a.kind === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

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

// Render the directory tree
async function renderDirectoryTree(directoryHandle = rootDirectoryHandle) {
  // Verify permission before accessing the directory
  const hasPermission = await verifyPermission(directoryHandle);
  if (!hasPermission) {
    console.error('Permission to access the directory was denied.');
    showOpenDirectoryPrompt();
    return;
  }

  const promptContainer = document.getElementById('prompt-container');
  const editorContainer = document.getElementById('editor-container');
  const folderList = document.getElementById('folder-list');

  if (promptContainer) {
    promptContainer.style.display = 'none';
  }
  if (editorContainer) {
    editorContainer.style.display = 'block';
  }
  if (folderList) {
    folderList.style.display = 'block';
  }

  // **Clear the folderList contents**
  folderList.innerHTML = '';

  // Collect entries
  const entries = [];
  for await (const entry of directoryHandle.values()) {
    entries.push(entry);
  }

  // Sort entries
  entries.sort((a, b) => {
    if (a.kind !== b.kind) {
      return a.kind === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  // Render entries at level 0
  for (const entry of entries) {
    let childElement;
    if (entry.kind === 'file') {
      childElement = await createFileElement(entry, directoryHandle, 0);
    } else if (entry.kind === 'directory') {
      childElement = await createDirectoryElement(entry, directoryHandle, 0);
    }
    folderList.appendChild(childElement);
  }
}

// Create directory element recursively
async function createDirectoryElement(directoryHandle, parentDirectoryHandle, level) {
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

async function changeMainDirectory() {
  try {
    await requestDirectoryAccess();
  } catch (error) {
    console.error('Error changing directory:', error);
  }
}

// Event listeners for buttons
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

let previousSelectedFileItem = null;

function highlightSelectedFile(selectedFileName) {
  // Remove the highlight from the previous item
  if (previousSelectedFileItem) {
    previousSelectedFileItem.classList.remove('bg-blue-200', 'dark:bg-blue-800');
  }

  // Find the new item to highlight
  const allFileItems = document.querySelectorAll('.file-item');
  allFileItems.forEach((item) => {
    const fileNameElement = item.querySelector('.file-name');
    if (fileNameElement && fileNameElement.textContent === selectedFileName) {
      // Add the highlight to the current item
      item.classList.add('bg-blue-200', 'dark:bg-blue-800');
      previousSelectedFileItem = item;
    }
  });
}

// Create file element
async function createFileElement(fileHandle, parentDirectoryHandle, level) {
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

const saveFileWithDebounce = debounce(async (fileHandle, content) => {
  await saveFile(fileHandle, content);
}, 500); 

function handleEditorChange() {
  if (currentFileHandle) {
    console.log('Attempting to save file:', currentFileHandle.name);
    saveFileWithDebounce(currentFileHandle, easyMDE.value());
  } else {
    console.log('No file is currently open; changes will not be saved.');
    easyMDE.codemirror.setOption('readOnly', 'nocursor');
  }
}

//Delete File
async function deleteFile(fileHandle, directoryHandle) {
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
      const editorContainer = document.getElementById('editor-container');
      const placeholderContainer = document.getElementById('placeholder-container');
      if (editorContainer) {
        editorContainer.style.display = 'none';
      }
      if (placeholderContainer) {
        placeholderContainer.style.display = 'flex';
      }
    }

    // Refresh the directory tree
    await renderDirectoryTree(rootDirectoryHandle);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

// Open and display a markdown file
async function openFile(fileHandle, parentDirectoryHandle) {
  try {
    const file = await fileHandle.getFile();
    const content = await file.text();
    currentFileHandle = fileHandle;
    initializeEditor(content || ''); // Ensure content is a string
    updateCurrentDirectoryHandle(parentDirectoryHandle);

    // Show the editor and hide the placeholder
    const editorContainer = document.getElementById('editor-container');
    const placeholderContainer = document.getElementById('placeholder-container');
    if (editorContainer) {
      editorContainer.style.display = 'block';
    }
    if (placeholderContainer) {
      placeholderContainer.style.display = 'none';
    }

    // Highlight the selected file
    highlightSelectedFile(fileHandle.name);
  } catch (error) {
    console.error('Error opening file:', error);
  }
}

// Initialize EasyMDE editor
function initializeEditor(content = '') {
  if (easyMDE) {
    // Update the content of the existing editor
    easyMDE.value(content);
    // Reset the undo history
    easyMDE.codemirror.clearHistory();
  } else {
    // Initialize the editor for the first time
    easyMDE = new EasyMDE({
      element: editorElement,
      initialValue: content,
      autofocus: true,
      spellChecker: false,
      renderingConfig: {
        singleLineBreaks: false,
        codeSyntaxHighlighting: true,
      },
      toolbar: [
        'bold', 'italic', 'heading', '|',
        'quote', 'code', 'table', 'horizontal-rule', '|',
        'link', 'image', '|',
        {
          name: 'expand',
          action: async function customExpand(editor) {
            await handleOllamaAction('expand', editor);
          },
          className: 'fa fa-expand',
          title: 'Expand Selection',
        },
        {
          name: 'improve',
          action: async function customImprove(editor) {
            await handleOllamaAction('improve', editor);
          },
          className: 'fa fa-magic',
          title: 'Improve Selection',
        },
        {
          name: 'summarize',
          action: async function customSummarize(editor) {
            await handleOllamaAction('summarize', editor);
          },
          className: 'fa fa-align-left',
          title: 'Summarize Selection',
        },
        '|', 'preview', 'side-by-side', 'fullscreen',
      ],
      autosave: {
        enabled: false,
      },
    });

    // Attach the 'change' event listener
    easyMDE.codemirror.on('change', handleEditorChange);
  }

  // Disable the editor if no file is open
  if (!currentFileHandle) {
    easyMDE.codemirror.setOption('readOnly', 'nocursor');
  } else {
    easyMDE.codemirror.setOption('readOnly', false);
  }
}


function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Create a new folder
async function createFolder(folderName) {
  try {
    const newFolderHandle = await currentDirectoryHandle.getDirectoryHandle(folderName, { create: true });
    renderDirectoryTree(rootDirectoryHandle); // Refresh the tree from the root
  } catch (error) {
    console.error('Error creating folder:', error);
  }
}

// Create a new markdown note
async function createNote(noteName) {
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

async function saveFile(fileHandle, content) {
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


// Prompt to create a new note
function promptCreateNote() {
  const noteName = prompt('Enter note name:');
  if (noteName) {
    createNote(noteName);
  }
}

// Prompt to create a new folder
function promptCreateFolder() {
  const folderName = prompt('Enter folder name:');
  if (folderName) {
    createFolder(folderName);
  }
}

// Toggle between light and dark mode
function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
}

// Register the service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(reg => console.log('Service Worker registered', reg))
    .catch(err => console.error('Service Worker registration failed', err));
}

function showAIResponseModal(aiResponse, doc) {
  const modal = document.getElementById('ai-response-modal');
  const closeModalButton = document.getElementById('close-modal');
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
    appendButton.removeEventListener('click', handleAppend);
    replaceButton.removeEventListener('click', handleReplace);
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
  appendButton.addEventListener('click', handleAppend);
  replaceButton.addEventListener('click', handleReplace);

  // Close modal when clicking outside of the modal content
  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      closeModal();
    }
  }, { once: true });
}

// Attempt to load the stored directory handle on app load
window.addEventListener('DOMContentLoaded', async () => {
  const handles = await getStoredDirectoryHandles();
  rootDirectoryHandle = handles.rootHandle;
  currentDirectoryHandle = handles.currentHandle || rootDirectoryHandle;

  if (rootDirectoryHandle) {
    const permission = await verifyPermission(rootDirectoryHandle);
    if (permission) {
      renderDirectoryTree(currentDirectoryHandle);

      // Hide the editor since no file is selected
      const placeholderContainer = document.getElementById('placeholder-container');
      const editorContainer = document.getElementById('editor-container');
      if (editorContainer) {
        editorContainer.style.display = 'none';
      }
      if (placeholderContainer) {
        placeholderContainer.style.display = 'flex';
      }
    } else {
      showOpenDirectoryPrompt();
    }
  } else {
    showOpenDirectoryPrompt();
  }
});

function showOpenDirectoryPrompt() {
  const promptContainer = document.getElementById('prompt-container');
  if (promptContainer) {
    promptContainer.style.display = 'flex';
  }
}

async function handleOllamaAction(action, editor) {
  const doc = editor.codemirror.getDoc();
  const selectedText = doc.getSelection();

  if (!selectedText) {
    alert('Please select some text to ' + action + '.');
    return;
  }

  // Prepare the prompt based on the action
  let prompt = '';
  switch (action) {
    case 'expand':
      prompt = `Expand the following text:\n\n"${selectedText}"\n\nReturn only the expanded content without any additional explanation.`;
      break;
    case 'improve':
      prompt = `Improve the following text:\n\n"${selectedText}"\n\nReturn only the improved content without any additional explanation.`;
      break;
    case 'summarize':
      prompt = `Summarize the following text:\n\n"${selectedText}"\n\nReturn only the summary without any additional explanation.`;
      break;
    default:
      console.error('Unknown action:', action);
      return;
  }

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        model: 'llama3.1', 
        prompt: prompt,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to communicate with the Ollama API. Status: ${response.status}`);
    }

    // Read the response as a stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let outputText = '';
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Process each line
      let lines = buffer.split('\n');
      buffer = lines.pop(); // Save the last partial line for the next chunk

      for (let line of lines) {
        line = line.trim();
        if (line) {
          try {
            const data = JSON.parse(line);
            if (data.done) {
              break;
            }
            if (data.response) {
              outputText += data.response;
            }
          } catch (e) {
            console.error('Error parsing JSON line:', line, e);
          }
        }
      }
    }

    // Process any remaining data in the buffer
    if (buffer.trim()) {
      try {
        const data = JSON.parse(buffer.trim());
        if (data.response) {
          outputText += data.response;
        }
      } catch (e) {
        console.error('Error parsing final JSON chunk:', buffer.trim(), e);
      }
    }

    if (outputText) {
      // Show the AI response in a modal dialog
      showAIResponseModal(outputText.trim(), doc);
    } else {
      console.error('No output received from Ollama API');
      alert('Failed to process the action.');
    }
  } catch (error) {
    console.error('Error during Ollama API request:', error);
    alert('An error occurred while communicating with the AI service.');
  }
}



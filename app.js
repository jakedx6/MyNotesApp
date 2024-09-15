// app.js

let rootDirectoryHandle;
let currentFileHandle;

const editor = document.getElementById('editor');
const previewTab = document.getElementById('preview-tab');
const editorTab = document.getElementById('editor-tab');

// Request access to a directory
async function requestDirectoryAccess() {
  try {
    rootDirectoryHandle = await window.showDirectoryPicker();
    renderDirectoryTree();
  } catch (error) {
    console.error('Directory access was not granted:', error);
  }
}

// Render the directory tree
async function renderDirectoryTree() {
  const folderList = document.getElementById('folder-list');
  folderList.innerHTML = '';

  const rootItem = await createDirectoryElement(rootDirectoryHandle, 0);
  folderList.appendChild(rootItem);
}

// Create directory element recursively
async function createDirectoryElement(directoryHandle, level) {
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
  childrenContainer.classList.add('flex', 'flex-col', 'ml-4');
  childrenContainer.style.display = 'none'; // Initially collapsed

  folderHeader.addEventListener('click', () => {
    if (childrenContainer.style.display === 'none') {
      childrenContainer.style.display = 'flex';
      // Change folder icon to open
      folderIcon.innerHTML = `
        <svg class="w-5 h-5 mr-2 inline-block" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v1H2V6z" />
          <path d="M2 9h16v5a2 2 0 01-2 2H4a2 2 0 01-2-2V9z" />
        </svg>
      `;
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
  });

  // Load directory contents
  for await (const entry of directoryHandle.values()) {
    let childElement;
    if (entry.kind === 'file') {
      childElement = await createFileElement(entry, level + 1);
    } else if (entry.kind === 'directory') {
      childElement = await createDirectoryElement(entry, level + 1);
    }
    childrenContainer.appendChild(childElement);
  }

  item.appendChild(childrenContainer);

  return item;
}

// Create file element
async function createFileElement(fileHandle, level) {
  const item = document.createElement('div');
  item.classList.add('flex', 'items-center', 'cursor-pointer', 'hover:bg-gray-200', 'dark:hover:bg-gray-700', 'p-2');
  item.style.paddingLeft = `${(level + 1) * 1.5}rem`;

  // File icon
  const fileIcon = document.createElement('span');
  fileIcon.innerHTML = `
    <svg class="w-5 h-5 mr-2 inline-block" fill="currentColor" viewBox="0 0 20 20">
      <path d="M4 2h8l4 4v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z" />
    </svg>
  `;

  const fileName = document.createElement('span');
  fileName.textContent = fileHandle.name;
  fileName.classList.add('text-blue-600', 'dark:text-blue-400');

  item.appendChild(fileIcon);
  item.appendChild(fileName);

  item.addEventListener('click', async () => {
    await openFile(fileHandle);
    currentFileHandle = fileHandle;
  });

  return item;
}

// Open and display a markdown file
async function openFile(fileHandle) {
  const file = await fileHandle.getFile();
  const content = await file.text();
  editor.value = content;
  updatePreview();
}

// Create a new folder
async function createFolder(folderName) {
  try {
    await rootDirectoryHandle.getDirectoryHandle(folderName, { create: true });
    renderDirectoryTree();
  } catch (error) {
    console.error('Error creating folder:', error);
  }
}

// Create a new markdown note
async function createNote(noteName) {
  try {
    const fileHandle = await rootDirectoryHandle.getFileHandle(`${noteName}.md`, { create: true });
    await saveFile(fileHandle, '');
    renderDirectoryTree();
  } catch (error) {
    console.error('Error creating note:', error);
  }
}

// Save the current file
async function saveFile(fileHandle, content) {
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

// Update the preview
function updatePreview() {
  const markdownText = editor.value;
  const previewContent = marked.parse(markdownText);
  previewTab.innerHTML = previewContent;
}

// Update the preview as the user types
editor.addEventListener('input', () => {
  updatePreview();
});

// Save the file when the editor loses focus
editor.addEventListener('blur', () => {
  if (currentFileHandle) {
    saveFile(currentFileHandle, editor.value);
  }
});

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

// Get the selected text in the editor
function getSelectedText() {
  const textarea = document.getElementById('editor');
  return textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
}

// Replace the selected text with the processed text
function replaceSelectedText(replacementText) {
  const textarea = document.getElementById('editor');
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;

  textarea.value = text.slice(0, start) + replacementText + text.slice(end);
  textarea.setSelectionRange(start, start + replacementText.length);
  textarea.focus();

  // Update the preview
  updatePreview();
}

// Process the selected text with Ollama
async function processSelection(action) {
  const selectedText = getSelectedText();

  if (!selectedText) {
    alert('Please select some text to process.');
    return;
  }

  let prompt = '';

  switch (action) {
    case 'rewrite':
      prompt = `Rewrite the following text to improve clarity and style:\n\n"${selectedText}"\n\nRewritten Text:`;
      break;
    case 'expand':
      prompt = `Expand on the following idea with more detail:\n\n"${selectedText}"\n\nExpanded Text:`;
      break;
    case 'summarize':
      prompt = `Summarize the following text concisely:\n\n"${selectedText}"\n\nSummary:`;
      break;
    default:
      alert('Invalid action.');
      return;
  }

  // Show a loading indicator
  const actionButtons = document.querySelectorAll('#actions button');
  actionButtons.forEach(button => button.disabled = true);

  const result = await sendToOllama(prompt);

  // Restore button state
  actionButtons.forEach(button => button.disabled = false);

  if (result) {
    replaceSelectedText(result.trim());
  } else {
    alert('An error occurred while processing your request.');
  }
}

// Communicate with Ollama API
async function sendToOllama(prompt) {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3.1', // Replace with the model you have installed
        prompt: prompt
      })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    // Ollama streams responses in NDJSON format
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let result = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += decoder.decode(value);
    }

    // Parse the responses
    const lines = result.trim().split('\n');
    const responses = lines.map(line => JSON.parse(line));
    const fullResponse = responses.map(res => res.response).join('');

    return fullResponse;
  } catch (error) {
    console.error('Error communicating with Ollama:', error);
    return null;
  }
}

// Toggle between light and dark mode
function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
}

// Tab functionality
function showTab(tab) {
  const editorTabElement = document.getElementById('editor-tab');
  const previewTabElement = document.getElementById('preview-tab');
  const tabEditorButton = document.getElementById('tab-editor');
  const tabPreviewButton = document.getElementById('tab-preview');

  if (tab === 'editor') {
    editorTabElement.classList.remove('hidden');
    previewTabElement.classList.add('hidden');
    tabEditorButton.classList.add('text-blue-600', 'border-blue-500');
    tabEditorButton.classList.remove('text-gray-500', 'hover:text-gray-700', 'dark:text-gray-300', 'dark:hover:text-gray-100', 'border-transparent');
    tabPreviewButton.classList.add('text-gray-500', 'hover:text-gray-700', 'dark:text-gray-300', 'dark:hover:text-gray-100', 'border-transparent');
    tabPreviewButton.classList.remove('text-blue-600', 'border-blue-500');
  } else if (tab === 'preview') {
    editorTabElement.classList.add('hidden');
    previewTabElement.classList.remove('hidden');
    tabPreviewButton.classList.add('text-blue-600', 'border-blue-500');
    tabPreviewButton.classList.remove('text-gray-500', 'hover:text-gray-700', 'dark:text-gray-300', 'dark:hover:text-gray-100', 'border-transparent');
    tabEditorButton.classList.add('text-gray-500', 'hover:text-gray-700', 'dark:text-gray-300', 'dark:hover:text-gray-100', 'border-transparent');
    tabEditorButton.classList.remove('text-blue-600', 'border-blue-500');
  }
}

// Register the service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(reg => console.log('Service Worker registered', reg))
    .catch(err => console.error('Service Worker registration failed', err));
}

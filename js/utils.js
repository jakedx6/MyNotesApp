// utils.js

/*** Utility Functions ***/

// Debounce function to limit the rate of function execution
export function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
  
  // Sort directory entries (folders first, then files)
  export function sortEntries(a, b) {
    if (a.kind !== b.kind) {
      return a.kind === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  }
  
  // Show an element by ID
  export function showElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = 'block';
    }
  }
  
  // Hide an element by ID
  export function hideElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = 'none';
    }
  }
  
  // Toggle editor display based on whether a file is open
  export function toggleEditorDisplay(showEditor) {
    const editorContainer = document.getElementById('editor-container');
    const placeholderContainer = document.getElementById('placeholder-container');
    if (showEditor) {
      if (editorContainer) editorContainer.style.display = 'block';
      if (placeholderContainer) placeholderContainer.style.display = 'none';
    } else {
      if (editorContainer) editorContainer.style.display = 'none';
      if (placeholderContainer) placeholderContainer.style.display = 'flex';
    }
  }
  
  // Highlight the selected file in the directory tree
  let previousSelectedFileItem = null;
  
  export function highlightSelectedFile(selectedFileName) {
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
  
// editor.js

import { handleOllamaAction } from './ai.js';
import { currentFileHandle } from './fileSystem.js';
import { verifyPermission } from './permissions.js';
import { debounce } from './utils.js';

let easyMDE;

const editorElement = document.getElementById('editor');

// Initialize EasyMDE editor
export function initializeEditor(content = '') {
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
                'link', 'image','|', 'preview', 'side-by-side', 'fullscreen', '|',
                {
                    name: 'expand',
                    action: async function customExpand(editor) {
                        await handleOllamaAction('expand', editor);
                    },
                    className: 'fa fa-expand bg-orange-400',
                    title: 'Expand Selection'
                },
                {
                    name: 'improve',
                    action: async function customImprove(editor) {
                        await handleOllamaAction('improve', editor);
                    },
                    className: 'fa fa-magic bg-orange-400',
                    title: 'Improve Selection',
                },
                {
                    name: 'summarize',
                    action: async function customSummarize(editor) {
                        await handleOllamaAction('summarize', editor);
                    },
                    className: 'fa fa-align-left bg-orange-400',
                    title: 'Summarize Selection',
                },
            ],
            autosave: {
                enabled: false,
            },
        });

        // Attach the 'change' event listener
        easyMDE.codemirror.on('change', handleEditorChange);
    }

    // Disable or enable the editor based on whether a file is open
    if (!currentFileHandle) {
        easyMDE.codemirror.setOption('readOnly', 'nocursor');
    } else {
        easyMDE.codemirror.setOption('readOnly', false);
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

// Handle editor content change
function handleEditorChange() {
    if (currentFileHandle) {
        console.log('Attempting to save file:', currentFileHandle.name);
        saveFileWithDebounce(currentFileHandle, easyMDE.value());
    } else {
        console.log('No file is currently open; changes will not be saved.');
        easyMDE.codemirror.setOption('readOnly', 'nocursor');
    }
}

// Save file with debounce to prevent frequent writes
const saveFileWithDebounce = debounce(async (fileHandle, content) => {
    await saveFile(fileHandle, content);
}, 500);

// Export variables if needed
export { easyMDE, currentFileHandle };

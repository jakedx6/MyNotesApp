// editor.js

import { handleOllamaAction } from './ai.js';
import { currentFilePath } from './fileSystem.js';
import { saveFile } from './fileSystem.js';
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
                'link', 'image', '|', 'preview', 'side-by-side', 'fullscreen', '|',
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
            ],
            autosave: {
                enabled: false,
            },
        });

        // Attach the 'change' event listener
        easyMDE.codemirror.on('change', handleEditorChange);
    }

    // Disable or enable the editor based on whether a file is open
    if (!currentFilePath) {
        easyMDE.codemirror.setOption('readOnly', 'nocursor');
    } else {
        easyMDE.codemirror.setOption('readOnly', false);
    }
}

// Handle editor content change
function handleEditorChange() {
    if (currentFilePath) {
        console.log('Attempting to save file:', currentFilePath);
        saveFileWithDebounce(easyMDE.value());
    } else {
        console.log('No file is currently open; changes will not be saved.');
        easyMDE.codemirror.setOption('readOnly', 'nocursor');
    }
}

// Save file with debounce to prevent frequent writes
const saveFileWithDebounce = debounce(async (content) => {
    await saveFile(content);
}, 500);

// Export variables if needed
export { easyMDE };

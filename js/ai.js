// ai.js

import { showAIResponseModal } from './domElements.js';

export async function handleOllamaAction(action, editor) {
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
      prompt = `Expand the following text:\n\n"${selectedText}"\n\nReturn only the expanded content without any additional explanation in markdown format`;
      break;
    case 'improve':
      prompt = `Improve the following text:\n\n"${selectedText}"\n\nReturn only the improved content without any additional explanation in markdown format`;
      break;
    case 'summarize':
      prompt = `Summarize the following text:\n\n"${selectedText}"\n\nReturn only the summary without any additional explanation in markdown format.`;
      break;
    default:
      console.error('Unknown action:', action);
      return;
  }

  try {
    const response = await fetch('/api/generate', {
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

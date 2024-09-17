
# **Markdown Editor with AI Assistance**

A feature-rich Markdown editor with directory navigation, dark mode support, and integrated AI functionalities powered by the [Ollama](https://github.com/jmorganca/ollama) API. Enhance your writing experience with AI-powered text expansion, improvement, and summarization directly within the editor.

## **Table of Contents**

-   [Features](#features)
-   [Demo](#demo)
-   [Prerequisites](#prerequisites)
-   [Installation](#installation)
-   [Usage](#usage)
-   [AI Integration with Ollama](#ai-integration-with-ollama)
-   [Configuration](#configuration)
-   [Troubleshooting](#troubleshooting)
-   [Contributing](#contributing)
-   [License](#license)

----------

## **Features**

-   **Markdown Editing:** Write and edit Markdown files with syntax highlighting and live preview.
-   **Directory Navigation:** Browse and manage files and folders through an interactive directory tree.
-   **File Operations:** Create, open, edit, save, and delete Markdown files.
-   **Dark Mode Support:** Toggle between light and dark themes for comfortable editing.
-   **AI Assistance:**
    -   **Expand:** Enrich your text by expanding on ideas.
    -   **Improve:** Enhance the quality of your writing.
    -   **Summarize:** Generate concise summaries of your content.
-   **AI Response Preview:** Preview AI-generated content before appending or replacing text.
-   **Keyboard Shortcuts:** Boost productivity with handy keyboard shortcuts.
-   **Responsive Design:** Optimized for various screen sizes, including mobile devices.

----------

## **Prerequisites**

-   **Node.js and NPM:** Ensure you have Node.js and NPM installed.
-   **Ollama API:** Install and run the Ollama API on your local machine.
-   **Supported Browsers:** Latest versions of Chrome, Firefox, or Edge.

----------

## **Installation**

### **1. Clone the Repository**

bash

Copy code

`git clone https://github.com/yourusername/markdown-editor-ai.git
cd markdown-editor-ai` 

### **2. Install Dependencies**

Since this is a simple web application, dependencies are minimal.

If you're using any package managers or build tools, install dependencies accordingly.

### **3. Set Up Ollama API**

Ensure that the Ollama API is installed and running on your local machine.

----------

## **Usage**

### **1. Start the Application**

Since this is a web application, you can run it by opening the `index.html` file in your browser.

Alternatively, you can serve it using a local development server:

bash

Copy code

`# Using Node.js http-server
npm install -g http-server
http-server` 

Then navigate to `http://localhost:8080` in your browser.

### **2. Open the Application**

-   Navigate to the application URL in your web browser.
-   You may need to allow the browser to access local files and directories.

### **3. Select a Directory**

-   Click on the **"Open Directory"** button to grant the application access to a directory.
-   The directory tree will display files and folders within the selected directory.

### **4. Edit Markdown Files**

-   Click on a Markdown file (`.md`) in the directory tree to open it in the editor.
-   The editor supports syntax highlighting and Markdown preview.

### **5. Use AI Assistance**

-   **Select text** within the editor that you want to modify.
-   Click on one of the AI action buttons in the toolbar:
    -   **Expand**
        
    -   **Improve**
        
    -   **Summarize**
        
-   A modal dialog will display the AI-generated response.
-   Choose to **Append** or **Replace** the selected text with the AI response.

### **6. Toggle Dark Mode**

-   Click on the **"Toggle Dark Mode"** button to switch between light and dark themes.

----------

## **AI Integration with Ollama**

### **1. Install Ollama**

Follow the [Ollama installation guide](https://github.com/jmorganca/ollama#installation) to install the Ollama API on your local machine.

### **2. Start the Ollama Server**

bash

Copy code

`ollama serve` 

By default, the Ollama server runs on `http://localhost:11434`.

### **3. Install AI Models**

Install the desired AI model, for example:

bash

Copy code

`ollama pull llama2` 

### **4. Update Model Name in Application**

Ensure that the model name in the application matches the installed model.

In `app.js`, update the model name in the `handleOllamaAction` function:

javascript

Copy code

`body: JSON.stringify({
  model: 'llama2', // Replace with your actual model name
  prompt: prompt,
}),` 

----------

## **Configuration**

### **Application Settings**

-   **Dark Mode:** The application remembers your dark mode preference using the `dark` class on the `<html>` element.
-   **Editor Settings:** Customize the editor options in the `initializeEditor` function in `app.js`.

### **Ollama API Settings**

-   **Port and Host:** If the Ollama API runs on a different host or port, update the API endpoint in `app.js`:

javascript

Copy code

`const response = await fetch('http://localhost:11434/api/generate', { ... });` 

----------

## **Troubleshooting**

### **1. Cannot Access Local Files**

-   Ensure your browser allows file system access.
-   If using Chrome, you may need to launch it with specific flags or use a local server.

### **2. Ollama API Errors**

-   **404 Not Found:**
    -   Verify that the Ollama server is running.
    -   Ensure the API endpoint in the code matches the server's endpoint.
-   **Model Not Found:**
    -   Confirm that the AI model is installed and the model name is correct.
-   **Syntax Errors in Response:**
    -   Update the `handleOllamaAction` function to properly handle streaming responses.

### **3. CORS Issues**

-   If you encounter CORS errors, consider adjusting the Ollama server's CORS settings or using a proxy.

### **4. Editor Not Updating**

-   Ensure that event listeners are correctly attached.
-   Verify that the editor's initialization logic is functioning.

----------

## **Contributing**

Contributions are welcome! Please follow these steps:

1.  **Fork the Repository**
    
    -   Click on the "Fork" button at the top right of the repository page.
2.  **Create a Feature Branch**
    
    bash
    
    Copy code
    
    `git checkout -b feature/your-feature-name` 
    
3.  **Commit Your Changes**
    
    bash
    
    Copy code
    
    `git commit -m "Add your commit message"` 
    
4.  **Push to Your Fork**
    
    bash
    
    Copy code
    
    `git push origin feature/your-feature-name` 
    
5.  **Create a Pull Request**
    
    -   Open a pull request from your feature branch to the main repository.

----------

## **License**

This project is licensed under the MIT License.

----------

## **Acknowledgments**

-   **[EasyMDE](https://github.com/Ionaru/easy-markdown-editor):** For providing the Markdown editor component.
-   **[Ollama](https://github.com/jmorganca/ollama):** For the AI models and API integration.
-   **[Tailwind CSS](https://tailwindcss.com/):** For utility-first CSS styling
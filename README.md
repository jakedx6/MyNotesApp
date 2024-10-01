
# **Markdown Notes Editor with AI Assistance**

A feature-rich Markdown Notes editor with directory navigation, dark mode support, and integrated AI functionalities powered by the [Ollama](https://github.com/jmorganca/ollama) API. Enhance your writing experience with AI-powered text expansion, improvement, and summarization directly within the editor.

## **Table of Contents**

-   [Features](#features)
-   [Prerequisites](#prerequisites)
-   [Installation](#installation)
-   [Usage](#usage)
-   [AI Integration with Ollama](#ai-integration-with-ollama)
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

----------

## **Prerequisites**

-   **Node.js and NPM:** Ensure you have Node.js and NPM installed.
-   **Ollama API:** Install and run the Ollama API on your local machine.
-   **Docker:** Ensure you have Docker installed to run the app using Docker Compose.

----------

## **Installation**

### **1. Clone the Repository**

bash

Copy code

`git clone https://github.com/jakedx6/MyNotesApp
cd MyNotesApp` 

### **2. Set Up Ollama**

Ensure that the Ollama API is installed and running on your local machine.

### **3.  Run the Application using Docker Compose**

Run the following command to build and start the application:

`docker-compose up --build`

----------

## **Usage**

### **1. Start the Application**

Once the setup is complete, the frontend will be accessible at http://localhost:8080 and the backend at http://localhost:3010.

### **2. Use AI Assistance**

-   **Select text** within the editor that you want to modify.
-   Click on one of the AI action buttons in the toolbar:
    -   **Expand**
        
    -   **Improve**
        
    -   **Summarize**
        
-   A modal dialog will display the AI-generated response.
-   Choose to **Append** or **Replace** the selected text with the AI response.

----------

## **AI Integration with Ollama**

### **1. Install Ollama**

Follow the [Ollama installation guide](https://github.com/jmorganca/ollama#installation) to install the Ollama API on your local machine.

### **2. Start the Ollama Server**

`ollama serve` 

By default, the Ollama server runs on `http://localhost:11434`.

### **3. Install AI Models**

Install the desired AI model, for example:

`ollama pull llama3.1` 

----------

## **Contributing**

Contributions are welcome! Please follow these steps:

1.  **Fork the Repository**
    
    -   Click on the "Fork" button at the top right of the repository page.
2.  **Create a Feature Branch**
    
    `git checkout -b feature/your-feature-name` 
    
3.  **Commit Your Changes**
    
    `git commit -m "Add your commit message"` 
    
4.  **Push to Your Fork**
    
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

# Script Documenter AI

An AI-powered tool that automatically generates comprehensive documentation for your code scripts. Built with React, Tailwind CSS, and powered by the Google Gemini API.

## How to Use

1.  **Upload Files:** Drag and drop your project folders (or individual files) into the "Main Project" and "Frontend Project" upload zones. The app will read your file structure and content.
2.  **Select Language:** Choose the desired language for the generated documentation (English or Russian) using the language selector.
3.  **Analyze:** Click the "Analyze Project" button. The AI will process each file, understanding its context within the entire project (using your README and CHANGELOG if present).
4.  **Review Changes:** A side-by-side diff viewer will appear, showing the original code next to the AI-documented version. You can navigate through all your project files.
5.  **Select Files:** Use the checkboxes next to each file name to include or exclude it from the final download.
6.  **Download:** Click "Apply & Download" to get a `.zip` archive containing your newly documented project files.

## Features

-   **Context-Aware Documentation:** The AI uses the entire project's file structure, README, and CHANGELOG to generate more relevant and insightful comments.
-   **Multi-Language Support:** Generate documentation in English or Russian.
-   **Side-by-Side Diff Viewer:** Easily review the changes made by the AI.
-   **Selective Download:** You have full control over which documented files are included in the final output.
-   **Project-Based Analysis:** Supports splitting files between a main/backend project and a frontend project for better organization.

## Powered by Google Gemini

This application leverages the power of Google's Gemini model to understand code and generate high-quality JSDoc-style documentation.

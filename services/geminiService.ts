import { GoogleGenAI } from "@google/genai";
import { DocLanguage } from "../App";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const englishPolicy = `Strictly adhere to the following JSDoc documentation policy:

1.  **Required:** Every global function (function declaration) MUST have a JSDoc block.
2.  **Description (@description):** The JSDoc block MUST start with a \`@description\` tag with a clear description of the function's purpose in English.
3.  **Parameters (@param):**
    *   A \`@param\` tag MUST be present for EACH function parameter.
    *   The tag must follow the format: \`{@param {type} parameter_name - Description}\`.
    *   The type must be specified (e.g., {string}, {number}, {GoogleAppsScript.Spreadsheet.Sheet}, {Object[]}).
4.  **Return Value (@returns):**
    *   If the function returns a value (contains a \`return\` statement), it MUST have a \`@returns\` tag.
    *   The tag must follow the format: \`{@returns {type} - Description}\`.
5.  **Module (@module):**
    *   For logical grouping, every function MUST have a \`{@module {ModuleName}}\` tag. For example, {DataProcessing}, {UI}, {API_Integration}. You must infer the module name from the file name and project context.
6.  **Entrypoint (@entrypoint):**
    *   If a function is an entrypoint (called by a trigger, from a menu, etc.), it MUST be marked with the \`{@entrypoint}\` tag. You should infer if a function is an entrypoint from its name (e.g., 'onOpen', 'doGet') or context.`;

const russianPolicy = `Strictly adhere to the following JSDoc documentation policy:

1.  **Обязательное наличие:** Каждая глобальная функция (function declaration) ДОЛЖНА иметь JSDoc-блок.
2.  **Описание (@description):** JSDoc-блок ДОЛЖЕН начинаться с тега \`@description\` с понятным описанием назначения функции на русском языке.
3.  **Параметры (@param):**
    *   Для КАЖДОГО параметра функции ДОЛЖЕН присутствовать тег \`@param\`.
    *   Тег должен иметь формат: \`{@param {тип} имя_параметра - Описание}\`.
    *   Тип должен быть указан (например, {string}, {number}, {GoogleAppsScript.Spreadsheet.Sheet}, {Object[]}).
4.  **Возвращаемое значение (@returns):**
    *   Если функция возвращает значение (содержит оператор \`return\`), она ДОЛЖНА иметь тег \`@returns\`.
    *   Тег должен иметь формат: \`{@returns {тип} - Описание}\`.
5.  **Модуль (@module):**
    *   Для логической группировки, каждая функция ДОЛЖНА иметь тег \`{@module {ИмяМодуля}}\`. Например, {DataProcessing}, {UI}, {API_Integration}. You must infer the module name from the file name and project context.
6.  **Точка входа (@entrypoint):**
    *   Если функция является точкой входа (вызывается триггером, из меню и т.д.), она ДОЛЖНА быть помечена тегом \`{@entrypoint}\`. You should infer if a function is an entrypoint from its name (e.g., 'onOpen', 'doGet') or context.`;


export async function generateDocumentation(script: string, language: string, projectContext: string, docLanguage: DocLanguage): Promise<string> {
  // If the script is not a code file (e.g. README, .json), return original content
  if (language === 'code' || script.trim().length === 0) {
    return script;
  }
  
  const documentationLanguage = docLanguage === 'ru' ? 'Russian' : 'English';
  const policy = docLanguage === 'ru' ? russianPolicy : englishPolicy;

  const systemInstruction = `You are an expert developer specializing in writing JSDoc documentation for ${language} code.
Your task is to analyze the provided script and add a JSDoc comment block directly above each function declaration. The documentation comments you write MUST be in ${documentationLanguage}.

To help you understand the project's purpose, goals, and recent changes, I am providing the project's file structure and the content of its README and CHANGELOG files. Use this information to write more insightful and context-aware descriptions for functions, especially noting how a function might relate to the overall goals described in the README.
    
--- PROJECT CONTEXT ---
${projectContext}
--- END PROJECT CONTEXT ---

${policy}
    
If the file does not contain any functions that require documentation, return the original script content without any changes or comments.

You MUST return ONLY the fully documented script. Do not add any introductory text, closing remarks, or markdown code fences. The script you are documenting is provided as the user content.`;


  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: script,
      config: {
        systemInstruction: systemInstruction
      },
    });
    
    let documentedScript = response.text.trim();
    // The model might still wrap the output in ```, so we should trim it.
    const codeBlockRegex = new RegExp("^\`\`\`(?:[a-zA-Z]*)?\\n?([\\s\\S]*)\`\`\`$");
    const match = documentedScript.match(codeBlockRegex);
    if (match) {
      documentedScript = match[1].trim();
    }
    return documentedScript;

  } catch (error) {
    console.error("Error generating documentation with Gemini API:", error);
    
    let finalMessage = "An unknown error occurred while communicating with the AI model.";

    if (error instanceof Error && error.message) {
        // Attempt to parse the message if it's a JSON string from the API
        try {
            const parsed = JSON.parse(error.message);
            if (parsed.error && parsed.error.message) {
                finalMessage = `The AI model returned an error: ${parsed.error.message}`;
            } else {
                finalMessage = `An unexpected error occurred: ${error.message}`;
            }
        } catch (jsonError) {
            // The message is not JSON, use it directly
            finalMessage = `An unexpected error occurred: ${error.message}`;
        }
    }
    
    if (finalMessage.includes("500") || finalMessage.includes("Rpc failed")) {
        finalMessage += "\nThis could be a temporary issue with the AI service or the request might be too large. Please try again later or with fewer files.";
    }

    throw new Error(finalMessage);
  }
}
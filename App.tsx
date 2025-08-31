import React, { useState, useCallback, useRef } from 'react';
import { generateDocumentation } from './services/geminiService';
import { GithubIcon } from './components/icons/GithubIcon';
import { FileUpload } from './components/FileUpload';
import { ReviewChanges } from './components/ReviewChanges';
import { Spinner } from './components/Spinner';

export interface ProjectFile {
  name: string;
  content: string;
  language: string;
  documentedContent: string | null;
  error: string | null;
  isIncluded: boolean;
}

type AppState = 'uploading' | 'loading' | 'reviewing';
export type DocLanguage = 'en' | 'ru';

const App: React.FC = () => {
  const [mainProjectFiles, setMainProjectFiles] = useState<ProjectFile[]>([]);
  const [frontendProjectFiles, setFrontendProjectFiles] = useState<ProjectFile[]>([]);
  const [appState, setAppState] = useState<AppState>('uploading');
  const [docLanguage, setDocLanguage] = useState<DocLanguage>('en');
  const [processingMessage, setProcessingMessage] = useState<string>('');
  const isCancelledRef = useRef(false);

  const getFileLanguage = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js': return 'JavaScript';
      case 'ts': return 'TypeScript';
      case 'py': return 'Python';
      case 'java': return 'Java';
      case 'go': return 'Go';
      case 'gs': return 'Google Apps Script';
      default: return 'code';
    }
  };

  const handleFilesUpload = (project: 'main' | 'frontend', files: File[]) => {
    const projectFiles: ProjectFile[] = files.map(file => ({
      name: file.name,
      content: '',
      language: getFileLanguage(file.name),
      documentedContent: null,
      error: null,
      isIncluded: true,
    }));

    projectFiles.forEach((projFile, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        projFile.content = e.target?.result as string;
      };
      reader.readAsText(files[index]);
    });

    if (project === 'main') {
      setMainProjectFiles(projectFiles);
    } else {
      setFrontendProjectFiles(projectFiles);
    }
  };

  const handleAnalyze = useCallback(async () => {
    isCancelledRef.current = false;
    setAppState('loading');
    const allFiles = [...mainProjectFiles, ...frontendProjectFiles];
    if (allFiles.length === 0) {
      setAppState('uploading');
      return;
    }

    const readmeFile = allFiles.find(f => f.name.toLowerCase().startsWith('readme'));
    const changelogFile = allFiles.find(f => f.name.toLowerCase().startsWith('changelog'));

    let detailedProjectContext = `This project contains the following files:\n${allFiles.map(f => `- ${f.name}`).join('\n')}`;

    if (readmeFile) {
        detailedProjectContext += `\n\n--- PROJECT README ---\n${readmeFile.content}\n--- END README ---`;
    }

    if (changelogFile) {
        detailedProjectContext += `\n\n--- PROJECT CHANGELOG ---\n${changelogFile.content}\n--- END CHANGELOG ---`;
    }

    const totalFiles = allFiles.length;

    for (let i = 0; i < totalFiles; i++) {
      if(isCancelledRef.current) {
        break;
      }
      const file = allFiles[i];
      setProcessingMessage(`Analyzing ${i + 1}/${totalFiles}: ${file.name}`);
      try {
        // Skip analysis for non-code files
        if (file.language === 'code') {
            file.documentedContent = file.content;
            continue;
        }
        const result = await generateDocumentation(file.content, file.language, detailedProjectContext, docLanguage);
        file.documentedContent = result;
      } catch (err) {
        file.error = err instanceof Error ? err.message : 'An unknown error occurred.';
        console.error(`Failed to document ${file.name}:`, err);
      }
    }
    
    setMainProjectFiles([...mainProjectFiles]);
    setFrontendProjectFiles([...frontendProjectFiles]);
    setProcessingMessage('');
    setAppState('reviewing');

  }, [mainProjectFiles, frontendProjectFiles, docLanguage]);
  
  const handleCancel = () => {
    isCancelledRef.current = true;
  };

  const toggleFileInclusion = (projectName: 'main' | 'frontend', fileName: string) => {
    const files = projectName === 'main' ? mainProjectFiles : frontendProjectFiles;
    const setFiles = projectName === 'main' ? setMainProjectFiles : setFrontendProjectFiles;

    const updatedFiles = files.map(f =>
      f.name === fileName ? { ...f, isIncluded: !f.isIncluded } : f
    );
    setFiles(updatedFiles);
  };
  
  const handleReset = () => {
    setMainProjectFiles([]);
    setFrontendProjectFiles([]);
    setAppState('uploading');
  }

  const renderContent = () => {
    switch (appState) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <Spinner />
            <p className="mt-4 text-lg text-slate-300">{processingMessage}</p>
            <button
              onClick={handleCancel}
              className="mt-6 px-8 py-2 font-semibold text-white bg-red-600 rounded-lg shadow-md hover:bg-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Cancel
            </button>
          </div>
        );
      case 'reviewing':
        return (
            <ReviewChanges 
                mainProjectFiles={mainProjectFiles}
                frontendProjectFiles={frontendProjectFiles}
                onToggleFile={toggleFileInclusion}
                onReset={handleReset}
            />
        );
      case 'uploading':
      default:
        return (
          <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8">
            <FileUpload
              projectId="main"
              title="Main Project"
              onFilesUploaded={(files) => handleFilesUpload('main', files)}
            />
            <FileUpload
              projectId="frontend"
              title="Frontend Project"
              onFilesUploaded={(files) => handleFilesUpload('frontend', files)}
            />
          </div>
        );
    }
  };

  const canAnalyze = mainProjectFiles.length > 0 || frontendProjectFiles.length > 0;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col font-sans">
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 p-4 sticky top-0 z-20">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Script Documenter <span className="text-cyan-400">AI</span>
          </h1>
          <a href="https://github.com/google/labs-prototypes/tree/main/frame/samples/react-gemini-script-documenter" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-cyan-400 transition-colors">
            <GithubIcon className="w-6 h-6" />
          </a>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col">
        {renderContent()}
        {appState === 'uploading' && (
          <div className="mt-8 flex flex-col items-center gap-6">
            <div>
                <span className="text-slate-400 mr-4 font-medium">Documentation Language:</span>
                <div className="inline-flex rounded-md shadow-sm" role="group">
                    <button
                        type="button"
                        onClick={() => setDocLanguage('en')}
                        className={`px-4 py-2 text-sm font-medium border rounded-l-lg transition-colors ${docLanguage === 'en' ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}
                    >
                        English
                    </button>
                    <button
                        type="button"
                        onClick={() => setDocLanguage('ru')}
                        className={`px-4 py-2 text-sm font-medium border-t border-b border-r rounded-r-lg transition-colors ${docLanguage === 'ru' ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}
                    >
                        Русский
                    </button>
                </div>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="px-10 py-4 font-semibold text-white bg-cyan-600 rounded-lg shadow-lg hover:bg-cyan-500 disabled:bg-slate-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Analyze Project
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
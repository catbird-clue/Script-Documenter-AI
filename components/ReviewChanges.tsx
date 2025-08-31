import React, { useState, useMemo } from 'react';
import { ProjectFile } from '../App';
import { DiffViewer } from './DiffViewer';
import JSZip from 'jszip';

interface ReviewChangesProps {
  mainProjectFiles: ProjectFile[];
  frontendProjectFiles: ProjectFile[];
  onToggleFile: (projectName: 'main' | 'frontend', fileName: string) => void;
  onReset: () => void;
}

type SelectedProjectFile = ProjectFile & { project: 'main' | 'frontend' };

const FileListItem: React.FC<{ file: ProjectFile; onToggle: () => void; onSelect: () => void; isSelected: boolean }> = ({ file, onToggle, onSelect, isSelected }) => (
  <li 
    className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-cyan-900/50' : 'hover:bg-slate-700/50'}`}
    onClick={onSelect}
  >
    <input
      type="checkbox"
      checked={file.isIncluded}
      onChange={onToggle}
      onClick={(e) => e.stopPropagation()} // prevent selection when clicking checkbox
      className="form-checkbox h-4 w-4 rounded bg-slate-600 border-slate-500 text-cyan-500 focus:ring-cyan-600"
      aria-label={`Include ${file.name} in download`}
    />
    <span className="truncate flex-grow">{file.name}</span>
    {file.documentedContent === file.content && <span className="text-xs text-slate-500 flex-shrink-0">No changes</span>}
    {file.error && <span className="text-xs text-red-500 flex-shrink-0" title={file.error}>Error</span>}
  </li>
);

export const ReviewChanges: React.FC<ReviewChangesProps> = ({ mainProjectFiles, frontendProjectFiles, onToggleFile, onReset }) => {
  const [selectedFile, setSelectedFile] = useState<SelectedProjectFile | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const allFiles = useMemo(() => [
    ...mainProjectFiles.map(f => ({ ...f, project: 'main' as const })),
    ...frontendProjectFiles.map(f => ({ ...f, project: 'frontend' as const }))
  ], [mainProjectFiles, frontendProjectFiles]);

  // Select the first file with changes by default
  useState(() => {
    const firstChangedFile = allFiles.find(f => f.documentedContent && f.documentedContent !== f.content);
    if (firstChangedFile) {
      setSelectedFile(firstChangedFile);
    } else if (allFiles.length > 0) {
      setSelectedFile(allFiles[0]);
    }
  });
  
  const handleApplyAndDownload = async () => {
    setIsDownloading(true);
    try {
        const zip = new JSZip();
        
        const mainFolder = mainProjectFiles.length > 0 ? zip.folder('main_project') : null;
        const frontendFolder = frontendProjectFiles.length > 0 ? zip.folder('frontend_project') : null;

        mainProjectFiles.forEach(file => {
            if (mainFolder) {
                const content = file.isIncluded ? (file.documentedContent ?? file.content) : file.content;
                mainFolder.file(file.name, content);
            }
        });

        frontendProjectFiles.forEach(file => {
            if (frontendFolder) {
                const content = file.isIncluded ? (file.documentedContent ?? file.content) : file.content;
                frontendFolder.file(file.name, content);
            }
        });

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = 'documented_project.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

    } catch (error) {
        console.error("Failed to create or download zip file", error);
        alert("Failed to create zip archive.");
    } finally {
        setIsDownloading(false);
    }
};


  const renderFileList = (files: ProjectFile[], projectName: 'main' | 'frontend') => {
    const projectTitle = projectName === 'main' ? 'Main' : 'Frontend';
    return(
        <div>
            <h3 className="text-lg font-semibold mb-2 px-2 capitalize">{projectTitle} Project</h3>
            <ul className="space-y-1">
                {files.map(file => (
                <FileListItem
                    key={`${projectName}-${file.name}`}
                    file={file}
                    isSelected={selectedFile?.name === file.name && selectedFile?.project === projectName}
                    onToggle={() => onToggleFile(projectName, file.name)}
                    onSelect={() => setSelectedFile({ ...file, project: projectName })}
                />
                ))}
            </ul>
        </div>
    );
  }

  const hasFilesToDownload = useMemo(() => 
    mainProjectFiles.some(f => f.isIncluded) || frontendProjectFiles.some(f => f.isIncluded),
    [mainProjectFiles, frontendProjectFiles]
  );

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-150px)]">
      <aside className="w-full md:w-1/3 lg:w-1/4 bg-slate-800/50 rounded-lg p-4 flex flex-col">
        <h2 className="text-xl font-bold mb-4">Review Changes</h2>
        <div className="overflow-y-auto flex-grow">
            {mainProjectFiles.length > 0 && renderFileList(mainProjectFiles, 'main')}
            {frontendProjectFiles.length > 0 && mainProjectFiles.length > 0 && <div className="my-4 border-t border-slate-700"></div>}
            {frontendProjectFiles.length > 0 && renderFileList(frontendProjectFiles, 'frontend')}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-700 flex flex-col gap-2">
            <button
              onClick={handleApplyAndDownload}
              disabled={!hasFilesToDownload || isDownloading}
              className="w-full px-4 py-2 text-base font-semibold text-white bg-cyan-600 rounded-lg shadow-md hover:bg-cyan-500 disabled:bg-slate-600 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              {isDownloading ? 'Creating archive...' : 'Apply & Download'}
            </button>
            <button 
                onClick={onReset}
                className="w-full px-4 py-2 text-sm font-semibold bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
                >
                Start Over
            </button>
        </div>
      </aside>
      <main className="w-full md:w-2/3 lg:w-3/4 flex flex-col">
        {selectedFile ? (
          <DiffViewer
            fileName={selectedFile.name}
            originalContent={selectedFile.content}
            newContent={selectedFile.isIncluded ? selectedFile.documentedContent : selectedFile.content}
            error={selectedFile.error}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-slate-800 rounded-lg">
            <p className="text-slate-400">Select a file to review changes.</p>
          </div>
        )}
      </main>
    </div>
  );
};
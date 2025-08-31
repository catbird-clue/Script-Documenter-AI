import React, { useState, useCallback, useRef, HTMLAttributes, InputHTMLAttributes } from 'react';

declare module 'react' {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
  }
}

interface FileUploadProps {
  projectId: string;
  title: string;
  onFilesUploaded: (files: File[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ projectId, title, onFilesUploaded }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList) {
      const newFiles = Array.from(fileList);
      setFiles(newFiles);
      onFilesUploaded(newFiles);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles && droppedFiles.length > 0) {
      setFiles(droppedFiles);
      onFilesUploaded(droppedFiles);
    }
  };
  
  const handleBrowseClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-4 bg-slate-800/50 p-6 rounded-xl border border-dashed border-slate-600">
      <h2 className="text-xl font-semibold text-center text-slate-300">{title}</h2>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200
          ${isDragging ? 'border-cyan-400 bg-slate-700/50' : 'border-slate-500 hover:border-cyan-500 hover:bg-slate-800'}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          id={`file-upload-${projectId}`}
          multiple
          webkitdirectory=""
          directory=""
          onChange={handleFileChange}
          className="hidden"
          aria-label={`Upload files for ${title}`}
        />
        <p className="text-slate-400 text-center">Drag & drop files/folders here, or click to browse.</p>
      </div>
      <div className="text-sm text-slate-400">
        {files.length > 0 ? (
          <>
            <p className="font-semibold text-slate-300 mb-2">Uploaded: {files.length} file(s)</p>
            <ul className="max-h-32 overflow-y-auto bg-slate-900/50 p-2 rounded-md">
                {files.map(file => (
                    <li key={file.name} className="truncate">{file.name}</li>
                ))}
            </ul>
          </>
        ) : (
          <p>No files uploaded yet.</p>
        )}
      </div>
    </div>
  );
};
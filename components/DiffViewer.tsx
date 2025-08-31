import React from 'react';

interface DiffViewerProps {
    fileName: string;
    originalContent: string;
    newContent: string | null;
    error: string | null;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ fileName, originalContent, newContent, error }) => {
    const finalNewContent = newContent ?? originalContent;
    const hasChanges = originalContent !== finalNewContent;

    if(error) {
        return (
            <div className="bg-slate-800 rounded-lg p-4 flex flex-col h-full border border-red-500/50">
                <h3 className="text-lg font-semibold text-red-400">Error processing {fileName}</h3>
                <pre className="text-sm text-red-300 mt-2 whitespace-pre-wrap">{error}</pre>
            </div>
        )
    }

    return (
        <div className="flex flex-col flex-grow h-full bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <div className="p-3 bg-slate-900/50 border-b border-slate-700">
                <h3 className="font-mono font-semibold">{fileName}</h3>
            </div>
            {!hasChanges ? (
                <div className="flex-grow flex items-center justify-center p-4">
                    <p className="text-slate-400">No documentation changes suggested for this file.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-px flex-grow bg-slate-700">
                    {/* Original */}
                    <div className="flex flex-col overflow-hidden bg-slate-800">
                        <h4 className="p-2 text-sm font-semibold bg-slate-900/50 text-slate-400">Original</h4>
                        <div className="overflow-auto p-3 flex-grow">
                            <pre className="text-sm font-mono text-slate-300 whitespace-pre">
                                {originalContent}
                            </pre>
                        </div>
                    </div>
                    {/* New */}
                    <div className="flex flex-col overflow-hidden bg-slate-800">
                        <h4 className="p-2 text-sm font-semibold bg-slate-900/50 text-slate-300">With AI Documentation</h4>
                         <div className="overflow-auto p-3 flex-grow">
                            <pre className="text-sm font-mono text-green-300 whitespace-pre">
                                {finalNewContent}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
import React, { useState } from 'react';
import { useOpenSSLStore } from './store';
import { File, FileCode, FileKey, Download, Trash2, Upload, Edit2, X, Save } from 'lucide-react';


export const FileManager = () => {
    const { files, removeFile, addFile, editingFile, setEditingFile } = useOpenSSLStore();
    const [editContent, setEditContent] = useState('');

    // Sync editing content when editingFile changes
    React.useEffect(() => {
        if (editingFile) {
            const content = editingFile.content;
            let text = '';
            if (typeof content === 'string') {
                text = content;
            } else {
                text = new TextDecoder().decode(content);
            }
            setEditContent(text);
        }
    }, [editingFile]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (!fileList) return;

        Array.from(fileList).forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    addFile({
                        name: file.name,
                        type: file.name.endsWith('.key') || file.name.endsWith('.pem') ? 'key' : 'text',
                        content: new Uint8Array(event.target.result as ArrayBuffer),
                        size: file.size,
                        timestamp: Date.now()
                    });
                }
            };
            reader.readAsArrayBuffer(file);
        });
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'key': return <FileKey size={16} className="text-amber-400" />;
            case 'cert': return <FileCode size={16} className="text-blue-400" />;
            default: return <File size={16} className="text-muted" />;
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        return (bytes / 1024).toFixed(1) + ' KB';
    };

    const handleDownload = (file: any) => {
        const content = file.content;
        const blobPart = typeof content === 'string' ? content : content as Uint8Array;
        const blob = new Blob([blobPart as any], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleSaveEdit = () => {
        if (!editingFile) return;

        addFile({
            ...editingFile,
            content: new TextEncoder().encode(editContent),
            size: new TextEncoder().encode(editContent).length,
            timestamp: Date.now()
        });
        setEditingFile(null);
    };

    return (
        <div className="h-full flex flex-col bg-white/5 rounded-xl border border-white/10 overflow-hidden relative">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">Virtual File System</span>
                <label className="cursor-pointer text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                    <Upload size={12} /> Upload
                    <input type="file" className="hidden" multiple onChange={handleFileUpload} />
                </label>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {files.length === 0 ? (
                    <div className="text-center py-8 text-white/20 text-xs">
                        No files in memory.<br />Generated keys will appear here.
                    </div>
                ) : (
                    files.map((file) => (
                        <div key={file.name} className="flex items-center justify-between p-2 rounded hover:bg-white/5 group transition-colors">
                            <div className="flex items-center gap-3 overflow-hidden">
                                {getIcon(file.type)}
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm text-white truncate font-medium">{file.name}</span>
                                    <span className="text-[10px] text-muted">{formatSize(file.size)} • {new Date(file.timestamp).toLocaleTimeString()}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => setEditingFile(file)}
                                    className="p-1.5 hover:bg-white/10 rounded text-muted hover:text-white"
                                    title="Edit / View"
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    onClick={() => handleDownload(file)}
                                    className="p-1.5 hover:bg-white/10 rounded text-muted hover:text-white"
                                    title="Download"
                                >
                                    <Download size={14} />
                                </button>
                                <button
                                    onClick={() => removeFile(file.name)}
                                    className="p-1.5 hover:bg-red-500/20 rounded text-muted hover:text-red-400"
                                    title="Delete"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Editor Overlay */}
            {editingFile && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10 flex flex-col animate-fade-in">
                    <div className="flex items-center justify-between p-3 border-b border-white/10 bg-white/5">
                        <span className="text-sm font-bold text-white flex items-center gap-2">
                            <Edit2 size={14} /> {editingFile.name}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSaveEdit}
                                className="p-1.5 bg-primary/20 text-primary hover:bg-primary/30 rounded transition-colors"
                                title="Save"
                            >
                                <Save size={14} />
                            </button>
                            <button
                                onClick={() => setEditingFile(null)}
                                className="p-1.5 hover:bg-white/10 text-muted hover:text-white rounded transition-colors"
                                title="Close"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 p-0 overflow-hidden">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full h-full bg-transparent text-xs font-mono p-4 text-white/90 outline-none resize-none"
                            spellCheck={false}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

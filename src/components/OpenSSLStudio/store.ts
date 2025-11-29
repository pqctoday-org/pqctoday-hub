import { create } from 'zustand';

export interface VirtualFile {
    name: string;
    type: 'key' | 'cert' | 'csr' | 'config' | 'binary' | 'text';
    content: Uint8Array | string;
    size: number;
    timestamp: number;
}

export interface LogEntry {
    id: string;
    timestamp: string;
    type: 'stdout' | 'stderr' | 'info' | 'error';
    message: string;
}

interface OpenSSLStudioState {
    // File System
    files: VirtualFile[];
    addFile: (file: VirtualFile) => void;
    removeFile: (name: string) => void;
    getFile: (name: string) => VirtualFile | undefined;

    // Terminal Output
    logs: LogEntry[];
    addLog: (type: LogEntry['type'], message: string) => void;
    clearLogs: () => void;

    // Command Builder
    command: string;
    setCommand: (cmd: string) => void;
    isProcessing: boolean;
    setIsProcessing: (isProcessing: boolean) => void;

    // Editor State
    editingFile: VirtualFile | null;
    setEditingFile: (file: VirtualFile | null) => void;
}

export const useOpenSSLStore = create<OpenSSLStudioState>((set, get) => ({
    files: [],
    addFile: (file) => set((state) => ({ files: [...state.files.filter(f => f.name !== file.name), file] })),
    removeFile: (name) => set((state) => ({ files: state.files.filter((f) => f.name !== name) })),
    getFile: (name) => get().files.find((f) => f.name === name),

    logs: [],
    addLog: (type, message) => set((state) => ({
        logs: [...state.logs, {
            id: Math.random().toString(36).substring(2),
            timestamp: new Date().toLocaleTimeString(),
            type,
            message
        }]
    })),
    clearLogs: () => set({ logs: [] }),

    command: '',
    setCommand: (cmd) => set({ command: cmd }),
    isProcessing: false,
    setIsProcessing: (isProcessing) => set({ isProcessing }),

    // Editor State
    editingFile: null,
    setEditingFile: (file) => set({ editingFile: file }),
}));

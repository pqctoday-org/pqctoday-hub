import React, { useState, useEffect, useRef } from 'react';
import type { LogEntry } from '../../../types';
import * as MLDSA from '../../../wasm/liboqs_dsa';
import { SettingsContext } from './SettingsContext';
import type { ExecutionMode, SortColumn, SortDirection, ClassicalAlgorithm } from './types';

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // State definitions
    const [algorithm, setAlgorithm] = useState<'ML-KEM' | 'ML-DSA'>('ML-KEM');
    const [keySize, setKeySize] = useState<string>('768');
    const [executionMode, setExecutionMode] = useState<ExecutionMode>(() => {
        const isWasmSupported = typeof WebAssembly === 'object';
        if (!isWasmSupported) return 'mock';
        const savedMode = sessionStorage.getItem('playground-execution-mode');
        return (savedMode === 'wasm' || savedMode === 'mock') ? savedMode : 'wasm';
    });
    const [wasmLoaded, setWasmLoaded] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(() => {
        return (typeof WebAssembly === 'object') ? null : 'WebAssembly not supported in this browser. Using Mock mode.';
    });
    const [sortColumn, setSortColumn] = useState<SortColumn>('timestamp');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({ timestamp: 150, keyLabel: 200, operation: 180, result: 300, executionTime: 120 });
    const [resizingColumn, setResizingColumn] = useState<SortColumn | null>(null);
    const resizeStartX = useRef<number>(0);
    const resizeStartWidth = useRef<number>(0);
    const [activeTab, setActiveTab] = useState<'settings' | 'data' | 'kem_ops' | 'sign_verify' | 'keystore' | 'logs' | 'acvp' | 'symmetric'>('settings');
    const [classicalAlgorithm, setClassicalAlgorithm] = useState<ClassicalAlgorithm>('RSA-2048');
    const [enabledAlgorithms, setEnabledAlgorithms] = useState(() => {
        const saved = sessionStorage.getItem('playground-enabled-algorithms');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                // Corrupted sessionStorage data, return defaults
            }
        }
        return {
            kem: { 'ML-KEM-512': true, 'ML-KEM-768': true, 'ML-KEM-1024': true, 'X25519': true, 'P-256': true },
            signature: { 'ML-DSA-44': true, 'ML-DSA-65': true, 'ML-DSA-87': true, 'RSA-2048': true, 'RSA-3072': true, 'RSA-4096': true, 'ECDSA-P256': true, 'Ed25519': true },
            symmetric: { 'AES-128-GCM': true, 'AES-256-GCM': true },
            hash: { 'SHA-256': true, 'SHA-384': true, 'SHA3-256': false }
        };
    });

    // --- Helpers ---
    const handleAlgorithmChange = (newAlgorithm: 'ML-KEM' | 'ML-DSA') => { setAlgorithm(newAlgorithm); setKeySize(newAlgorithm === 'ML-KEM' ? '768' : '65'); };
    const toggleAlgorithm = (category: 'kem' | 'signature' | 'symmetric' | 'hash', algorithm: string) => {
        setEnabledAlgorithms((prev: Record<string, Record<string, boolean>>) => ({ ...prev, [category]: { ...prev[category], [algorithm]: !prev[category][algorithm as keyof typeof prev[typeof category]] } }));
    };
    const addLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
        const newEntry: LogEntry = { id: Math.random().toString(36).substring(2, 9), timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }), ...entry };
        setLogs(prev => {
            const updated = [newEntry, ...prev];
            return updated.length > 1000 ? updated.slice(0, 1000) : updated;
        });
    };
    const clearLogs = () => setLogs([]);

    const handleSort = (column: SortColumn) => { if (sortColumn === column) { setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); } else { setSortColumn(column); setSortDirection('desc'); } };
    const startResize = (e: React.MouseEvent, column: SortColumn) => { e.preventDefault(); e.stopPropagation(); setResizingColumn(column); resizeStartX.current = e.clientX; resizeStartWidth.current = columnWidths[column]; document.body.style.cursor = 'col-resize'; };

    // --- Effects ---
    useEffect(() => {
        const loadWASM = async () => {
            if (executionMode === 'wasm' && !wasmLoaded) {
                try {
                    await MLDSA.load();
                    setWasmLoaded(true);
                    addLog({ keyLabel: 'System', operation: 'Load WASM', result: 'Libraries loaded successfully', executionTime: 0 });
                } catch (err: unknown) {
                    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                    setError(`Failed to load WASM libraries: ${errorMessage}. Falling back to Mock mode.`);
                    setExecutionMode('mock');
                }
            }
        };
        loadWASM();
    }, [executionMode, wasmLoaded]);

    useEffect(() => { sessionStorage.setItem('playground-execution-mode', executionMode); }, [executionMode]);
    useEffect(() => { sessionStorage.setItem('playground-enabled-algorithms', JSON.stringify(enabledAlgorithms)); }, [enabledAlgorithms]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (resizingColumn) {
                const diff = e.clientX - resizeStartX.current;
                const newWidth = Math.max(50, resizeStartWidth.current + diff);
                setColumnWidths(prev => ({ ...prev, [resizingColumn]: newWidth }));
            }
        };
        const handleMouseUp = () => { if (resizingColumn) { setResizingColumn(null); document.body.style.cursor = 'default'; } };
        if (resizingColumn) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); }
        return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
    }, [resizingColumn]);

    const sortedLogs = [...logs].sort((a, b) => {
        let aValue: string | number = a[sortColumn];
        let bValue: string | number = b[sortColumn];
        if (sortColumn === 'executionTime') return sortDirection === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <SettingsContext.Provider value={{
            algorithm, setAlgorithm, keySize, setKeySize, executionMode, setExecutionMode, wasmLoaded,
            logs, loading, setLoading, error, setError,
            sortColumn, setSortColumn, sortDirection, setSortDirection, columnWidths, setColumnWidths, resizingColumn, setResizingColumn, startResize, handleSort, sortedLogs,
            classicalAlgorithm, setClassicalAlgorithm,
            enabledAlgorithms, toggleAlgorithm, handleAlgorithmChange,
            activeTab, setActiveTab,
            addLog, clearLogs
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

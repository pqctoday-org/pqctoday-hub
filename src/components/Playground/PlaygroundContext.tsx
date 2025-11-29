import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { Key, LogEntry } from '../../types';
import * as MLDSA from '../../wasm/liboqs_dsa';
import { useKeyGeneration } from './hooks/useKeyGeneration';
import { useKemOperations } from './hooks/useKemOperations';
import { useDsaOperations } from './hooks/useDsaOperations';
import { useSymmetricOperations } from './hooks/useSymmetricOperations';

// --- Types ---
export type ExecutionMode = 'mock' | 'wasm';
export type SortColumn = 'timestamp' | 'keyLabel' | 'operation' | 'result' | 'executionTime';
export type SortDirection = 'asc' | 'desc';
export type ClassicalAlgorithm = 'RSA-2048' | 'RSA-3072' | 'RSA-4096' | 'ECDSA-P256' | 'Ed25519' | 'X25519' | 'P-256' | 'AES-128' | 'AES-256';

export interface PlaygroundContextType {
    // State
    algorithm: 'ML-KEM' | 'ML-DSA';
    setAlgorithm: (algo: 'ML-KEM' | 'ML-DSA') => void;
    keySize: string;
    setKeySize: (size: string) => void;
    executionMode: ExecutionMode;
    setExecutionMode: (mode: ExecutionMode) => void;
    wasmLoaded: boolean;
    keyStore: Key[];
    setKeyStore: React.Dispatch<React.SetStateAction<Key[]>>;
    logs: LogEntry[];
    loading: boolean;
    error: string | null;
    setError: (error: string | null) => void;

    // Sorting & Columns
    sortColumn: SortColumn;
    setSortColumn: (col: SortColumn) => void;
    sortDirection: SortDirection;
    setSortDirection: (dir: SortDirection) => void;
    columnWidths: { [key: string]: number };
    setColumnWidths: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
    resizingColumn: SortColumn | null;
    setResizingColumn: (col: SortColumn | null) => void;
    startResize: (e: React.MouseEvent, column: SortColumn) => void;
    handleSort: (column: SortColumn) => void;
    sortedLogs: LogEntry[];

    // ML-KEM State
    sharedSecret: string;
    setSharedSecret: (val: string) => void;
    ciphertext: string;
    setCiphertext: (val: string) => void;
    encryptedData: string;
    setEncryptedData: (val: string) => void;

    // ML-DSA State
    signature: string;
    setSignature: (val: string) => void;

    // Selection State
    selectedEncKeyId: string;
    setSelectedEncKeyId: (id: string) => void;
    selectedDecKeyId: string;
    setSelectedDecKeyId: (id: string) => void;
    selectedSignKeyId: string;
    setSelectedSignKeyId: (id: string) => void;
    selectedVerifyKeyId: string;
    setSelectedVerifyKeyId: (id: string) => void;
    verificationResult: boolean | null;
    setVerificationResult: (result: boolean | null) => void;
    kemDecapsulationResult: boolean | null;
    setKemDecapsulationResult: (result: boolean | null) => void;

    // Data State
    dataToSign: string;
    setDataToSign: (val: string) => void;
    dataToEncrypt: string;
    setDataToEncrypt: (val: string) => void;
    decryptedData: string;
    setDecryptedData: (val: string) => void;

    // Symmetric State
    selectedSymKeyId: string;
    setSelectedSymKeyId: (id: string) => void;
    symData: string;
    setSymData: (val: string) => void;
    symOutput: string;
    setSymOutput: (val: string) => void;

    // Classical State
    classicalAlgorithm: ClassicalAlgorithm;
    setClassicalAlgorithm: (algo: ClassicalAlgorithm) => void;
    classicalLoading: boolean;

    // Config
    enabledAlgorithms: any;
    toggleAlgorithm: (category: 'kem' | 'signature' | 'symmetric' | 'hash', algorithm: string) => void;

    // Actions
    handleAlgorithmChange: (newAlgorithm: 'ML-KEM' | 'ML-DSA') => void;
    generateKeys: () => Promise<void>;
    generateClassicalKeys: () => Promise<void>;
    runOperation: (type: 'encapsulate' | 'decapsulate' | 'sign' | 'verify' | 'encrypt' | 'decrypt' | 'symEncrypt' | 'symDecrypt') => Promise<void>;
    addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
    clearLogs: () => void;
    clearKeys: () => void;

    // Active Tab
    activeTab: 'settings' | 'data' | 'kem_ops' | 'sign_verify' | 'keystore' | 'logs' | 'acvp' | 'symmetric';
    setActiveTab: (tab: 'settings' | 'data' | 'kem_ops' | 'sign_verify' | 'keystore' | 'logs' | 'acvp' | 'symmetric') => void;
}

const PlaygroundContext = createContext<PlaygroundContextType | undefined>(undefined);

export const usePlaygroundContext = () => {
    const context = useContext(PlaygroundContext);
    if (!context) {
        throw new Error('usePlaygroundContext must be used within a PlaygroundProvider');
    }
    return context;
};

export const PlaygroundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
    const [keyStore, setKeyStore] = useState<Key[]>([]);
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
    const [sharedSecret, setSharedSecret] = useState<string>('');
    const [ciphertext, setCiphertext] = useState<string>('');
    const [encryptedData, setEncryptedData] = useState<string>('');
    const [signature, setSignature] = useState<string>('');
    const [selectedEncKeyId, setSelectedEncKeyId] = useState<string>('');
    const [selectedDecKeyId, setSelectedDecKeyId] = useState<string>('');
    const [selectedSignKeyId, setSelectedSignKeyId] = useState<string>('');
    const [selectedVerifyKeyId, setSelectedVerifyKeyId] = useState<string>('');
    const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
    const [kemDecapsulationResult, setKemDecapsulationResult] = useState<boolean | null>(null);
    const [activeTab, setActiveTab] = useState<'settings' | 'data' | 'kem_ops' | 'sign_verify' | 'keystore' | 'logs' | 'acvp' | 'symmetric'>('settings');
    const [dataToSign, setDataToSign] = useState('Hello Quantum World!');
    const [dataToEncrypt, setDataToEncrypt] = useState('Secret Message');
    const [decryptedData, setDecryptedData] = useState('');
    const [selectedSymKeyId, setSelectedSymKeyId] = useState<string>('');
    const [symData, setSymData] = useState('48656c6c6f2053796d6d657472696320576f726c64');
    const [symOutput, setSymOutput] = useState('');
    const [classicalAlgorithm, setClassicalAlgorithm] = useState<ClassicalAlgorithm>('RSA-2048');
    const [enabledAlgorithms, setEnabledAlgorithms] = useState(() => {
        const saved = sessionStorage.getItem('playground-enabled-algorithms');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error(e);
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
        setLogs(prev => [newEntry, ...prev]);
    };
    const clearLogs = () => setLogs([]);
    const clearKeys = () => {
        setKeyStore([]);
        setSelectedEncKeyId('');
        setSelectedDecKeyId('');
        setSelectedSignKeyId('');
        setSelectedVerifyKeyId('');
        setSelectedSymKeyId('');
        setSharedSecret('');
        setCiphertext('');
        setEncryptedData('');
        setDecryptedData('');
        setSignature('');
        setVerificationResult(null);
        setKemDecapsulationResult(null);
        setSymOutput('');
        addLog({ keyLabel: 'System', operation: 'Clear Keys', result: 'All keys and states cleared', executionTime: 0 });
    };
    const handleSort = (column: SortColumn) => { if (sortColumn === column) { setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); } else { setSortColumn(column); setSortDirection('desc'); } };
    const startResize = (e: React.MouseEvent, column: SortColumn) => { e.preventDefault(); e.stopPropagation(); setResizingColumn(column); resizeStartX.current = e.clientX; resizeStartWidth.current = columnWidths[column]; document.body.style.cursor = 'col-resize'; };

    // --- Hooks ---
    const { generateKeys, generateClassicalKeys, classicalLoading } = useKeyGeneration({
        algorithm,
        keySize,
        executionMode,
        wasmLoaded,
        classicalAlgorithm,
        setKeyStore,
        setSelectedEncKeyId,
        setSelectedDecKeyId,
        setSelectedSignKeyId,
        setSelectedVerifyKeyId,
        addLog,
        setLoading,
        setError
    });

    const { runKemOperation } = useKemOperations({
        keyStore,
        selectedEncKeyId,
        selectedDecKeyId,
        executionMode,
        wasmLoaded,
        keySize,
        sharedSecret,
        ciphertext,
        setSharedSecret,
        setCiphertext,
        setKemDecapsulationResult,
        addLog,
        setLoading,
        setError
    });

    const { runDsaOperation } = useDsaOperations({
        keyStore,
        selectedSignKeyId,
        selectedVerifyKeyId,
        executionMode,
        wasmLoaded,
        dataToSign,
        signature,
        setSignature,
        setVerificationResult,
        addLog,
        setLoading,
        setError
    });

    const { runSymmetricOperation } = useSymmetricOperations({
        keyStore,
        selectedSymKeyId,
        executionMode,
        symData,
        symOutput,
        sharedSecret,
        dataToEncrypt,
        encryptedData,
        setSymData,
        setSymOutput,
        setEncryptedData,
        setDecryptedData,
        addLog,
        setLoading,
        setError
    });

    // Unified runOperation wrapper
    const runOperation = async (type: 'encapsulate' | 'decapsulate' | 'sign' | 'verify' | 'encrypt' | 'decrypt' | 'symEncrypt' | 'symDecrypt') => {
        if (type === 'encapsulate' || type === 'decapsulate') {
            await runKemOperation(type);
        } else if (type === 'sign' || type === 'verify') {
            await runDsaOperation(type);
        } else {
            await runSymmetricOperation(type);
        }
    };

    // --- Effects ---
    useEffect(() => {
        const loadWASM = async () => {
            if (executionMode === 'wasm' && !wasmLoaded) {
                try {
                    await MLDSA.load();
                    setWasmLoaded(true);
                    addLog({ keyLabel: 'System', operation: 'Load WASM', result: 'Libraries loaded successfully', executionTime: 0 });
                } catch (err: any) {
                    setError(`Failed to load WASM libraries: ${err.message}. Falling back to Mock mode.`);
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
        let aValue: any = a[sortColumn];
        let bValue: any = b[sortColumn];
        if (sortColumn === 'executionTime') return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <PlaygroundContext.Provider value={{
            algorithm, setAlgorithm, keySize, setKeySize, executionMode, setExecutionMode, wasmLoaded, keyStore, setKeyStore, logs, loading, error, setError,
            sortColumn, setSortColumn, sortDirection, setSortDirection, columnWidths, setColumnWidths, resizingColumn, setResizingColumn, startResize, handleSort, sortedLogs,
            sharedSecret, setSharedSecret, ciphertext, setCiphertext, encryptedData, setEncryptedData, signature, setSignature,
            selectedEncKeyId, setSelectedEncKeyId, selectedDecKeyId, setSelectedDecKeyId, selectedSignKeyId, setSelectedSignKeyId, selectedVerifyKeyId, setSelectedVerifyKeyId,
            dataToSign, setDataToSign, dataToEncrypt, setDataToEncrypt, decryptedData, setDecryptedData,
            selectedSymKeyId, setSelectedSymKeyId, symData, setSymData, symOutput, setSymOutput,
            classicalAlgorithm, setClassicalAlgorithm, classicalLoading,
            enabledAlgorithms, toggleAlgorithm,
            handleAlgorithmChange, generateKeys, generateClassicalKeys, runOperation, addLog, clearLogs, clearKeys,
            activeTab,
            setActiveTab,
            verificationResult,
            setVerificationResult,
            kemDecapsulationResult,
            setKemDecapsulationResult
        }}>
            {children}
        </PlaygroundContext.Provider>
    );
};

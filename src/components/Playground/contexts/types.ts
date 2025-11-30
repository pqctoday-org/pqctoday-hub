import type { LogEntry, Key } from '../../../types';

// Settings Context Types
export type ExecutionMode = 'mock' | 'wasm';
export type SortColumn = 'timestamp' | 'keyLabel' | 'operation' | 'result' | 'executionTime';
export type SortDirection = 'asc' | 'desc';
export type ClassicalAlgorithm = 'RSA-2048' | 'RSA-3072' | 'RSA-4096' | 'ECDSA-P256' | 'Ed25519' | 'X25519' | 'P-256' | 'AES-128' | 'AES-256';

export interface EnabledAlgorithms {
    kem: Record<string, boolean>;
    signature: Record<string, boolean>;
    symmetric: Record<string, boolean>;
    hash: Record<string, boolean>;
}

export interface SettingsContextType {
    // Algorithm Settings
    algorithm: 'ML-KEM' | 'ML-DSA';
    setAlgorithm: (algo: 'ML-KEM' | 'ML-DSA') => void;
    keySize: string;
    setKeySize: (size: string) => void;
    executionMode: ExecutionMode;
    setExecutionMode: (mode: ExecutionMode) => void;
    wasmLoaded: boolean;

    // Classical Settings
    classicalAlgorithm: ClassicalAlgorithm;
    setClassicalAlgorithm: (algo: ClassicalAlgorithm) => void;

    // Config
    enabledAlgorithms: EnabledAlgorithms;
    toggleAlgorithm: (category: 'kem' | 'signature' | 'symmetric' | 'hash', algorithm: string) => void;
    handleAlgorithmChange: (newAlgorithm: 'ML-KEM' | 'ML-DSA') => void;

    // UI State
    activeTab: 'settings' | 'data' | 'kem_ops' | 'sign_verify' | 'keystore' | 'logs' | 'acvp' | 'symmetric';
    setActiveTab: (tab: 'settings' | 'data' | 'kem_ops' | 'sign_verify' | 'keystore' | 'logs' | 'acvp' | 'symmetric') => void;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    error: string | null;
    setError: (error: string | null) => void;

    // Logs
    logs: LogEntry[];
    addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
    clearLogs: () => void;

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
}

// Operations Context Types
export interface OperationsContextType {
    // ML-KEM State
    sharedSecret: string;
    setSharedSecret: (val: string) => void;
    ciphertext: string;
    setCiphertext: (val: string) => void;
    encryptedData: string;
    setEncryptedData: (val: string) => void;
    kemDecapsulationResult: boolean | null;
    setKemDecapsulationResult: (result: boolean | null) => void;

    // ML-DSA State
    signature: string;
    setSignature: (val: string) => void;
    verificationResult: boolean | null;
    setVerificationResult: (result: boolean | null) => void;

    // Data State
    dataToSign: string;
    setDataToSign: (val: string) => void;
    dataToEncrypt: string;
    setDataToEncrypt: (val: string) => void;
    decryptedData: string;
    setDecryptedData: (val: string) => void;

    // Symmetric State
    symData: string;
    setSymData: (val: string) => void;
    symOutput: string;
    setSymOutput: (val: string) => void;

    // Actions
    runOperation: (type: 'encapsulate' | 'decapsulate' | 'sign' | 'verify' | 'encrypt' | 'decrypt' | 'symEncrypt' | 'symDecrypt') => Promise<void>;
    clearOperations: () => void;
}

// KeyStore Context Types
export interface KeyStoreContextType {
    keyStore: Key[];
    setKeyStore: React.Dispatch<React.SetStateAction<Key[]>>;
    selectedEncKeyId: string;
    setSelectedEncKeyId: (id: string) => void;
    selectedDecKeyId: string;
    setSelectedDecKeyId: (id: string) => void;
    selectedSignKeyId: string;
    setSelectedSignKeyId: (id: string) => void;
    selectedVerifyKeyId: string;
    setSelectedVerifyKeyId: (id: string) => void;
    selectedSymKeyId: string;
    setSelectedSymKeyId: (id: string) => void;
    generateKeys: () => Promise<void>;
    generateClassicalKeys: () => Promise<void>;
    clearKeys: () => void;
    classicalLoading: boolean;
    importKey: (key: Key) => void;
    deleteKey: (id: string) => void;
    downloadKey: (id: string) => void;
}

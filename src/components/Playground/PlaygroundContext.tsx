import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { Key, LogEntry } from '../../types';
import * as MLKEM from '../../wasm/liboqs_kem';
import * as MLDSA from '../../wasm/liboqs_dsa';
import * as WebCrypto from '../../utils/webCrypto';
import { bytesToHex, hexToBytes } from './DataInput';

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

    // Active Tab
    activeTab: 'settings' | 'data' | 'kem' | 'encrypt' | 'sign' | 'verify' | 'keystore' | 'logs' | 'acvp' | 'symmetric';
    setActiveTab: (tab: 'settings' | 'data' | 'kem' | 'encrypt' | 'sign' | 'verify' | 'keystore' | 'logs' | 'acvp' | 'symmetric') => void;
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
    // State definitions will go here
    const [algorithm, setAlgorithm] = useState<'ML-KEM' | 'ML-DSA'>('ML-KEM');
    const [keySize, setKeySize] = useState<string>('768');
    const [executionMode, setExecutionMode] = useState<ExecutionMode>('mock');
    const [wasmLoaded, setWasmLoaded] = useState(false);
    const [keyStore, setKeyStore] = useState<Key[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
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
    const [activeTab, setActiveTab] = useState<'settings' | 'data' | 'kem' | 'encrypt' | 'sign' | 'verify' | 'keystore' | 'logs' | 'acvp' | 'symmetric'>('settings');
    const [dataToSign, setDataToSign] = useState('Hello Quantum World!');
    const [dataToEncrypt, setDataToEncrypt] = useState('Secret Message');
    const [decryptedData, setDecryptedData] = useState('');
    const [selectedSymKeyId, setSelectedSymKeyId] = useState<string>('');
    const [symData, setSymData] = useState('48656c6c6f2053796d6d657472696320576f726c64');
    const [symOutput, setSymOutput] = useState('');
    const [classicalAlgorithm, setClassicalAlgorithm] = useState<ClassicalAlgorithm>('RSA-2048');
    const [classicalLoading, setClassicalLoading] = useState(false);
    const [enabledAlgorithms, setEnabledAlgorithms] = useState({
        kem: { 'ML-KEM-512': true, 'ML-KEM-768': true, 'ML-KEM-1024': true, 'X25519': true, 'P-256': true },
        signature: { 'ML-DSA-44': true, 'ML-DSA-65': true, 'ML-DSA-87': true, 'RSA-2048': true, 'RSA-3072': true, 'RSA-4096': true, 'ECDSA-P256': true, 'Ed25519': true },
        symmetric: { 'AES-128-GCM': true, 'AES-256-GCM': true },
        hash: { 'SHA-256': true, 'SHA-384': true, 'SHA3-256': false }
    });

    // ... Logic Placeholders ...
    const handleAlgorithmChange = (newAlgorithm: 'ML-KEM' | 'ML-DSA') => { setAlgorithm(newAlgorithm); setKeySize(newAlgorithm === 'ML-KEM' ? '768' : '65'); };
    const toggleAlgorithm = (category: 'kem' | 'signature' | 'symmetric' | 'hash', algorithm: string) => {
        setEnabledAlgorithms(prev => ({ ...prev, [category]: { ...prev[category], [algorithm]: !prev[category][algorithm as keyof typeof prev[typeof category]] } }));
    };
    const addLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
        const newEntry: LogEntry = { id: Math.random().toString(36).substring(2, 9), timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }), ...entry };
        setLogs(prev => [newEntry, ...prev]);
    };
    const clearLogs = () => setLogs([]);
    const handleSort = (column: SortColumn) => { if (sortColumn === column) { setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); } else { setSortColumn(column); setSortDirection('desc'); } };
    const startResize = (e: React.MouseEvent, column: SortColumn) => { e.preventDefault(); e.stopPropagation(); setResizingColumn(column); resizeStartX.current = e.clientX; resizeStartWidth.current = columnWidths[column]; document.body.style.cursor = 'col-resize'; };

    // ... Effects ...
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

    useEffect(() => {
        const isWasmSupported = typeof WebAssembly === 'object';
        if (!isWasmSupported && executionMode === 'wasm') { setExecutionMode('mock'); setError('WebAssembly not supported in this browser. Using Mock mode.'); }
    }, [executionMode]);

    useEffect(() => {
        const savedMode = sessionStorage.getItem('playground-execution-mode');
        if (savedMode === 'wasm' || savedMode === 'mock') setExecutionMode(savedMode);
        const savedAlgorithms = sessionStorage.getItem('playground-enabled-algorithms');
        if (savedAlgorithms) try { setEnabledAlgorithms(JSON.parse(savedAlgorithms)); } catch (e) { console.error(e); }
    }, []);

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

    const generateKeys = async () => {
        setLoading(true);
        setError(null);
        const start = performance.now();

        try {
            if (executionMode === 'wasm') {
                // WASM Mode - Real cryptographic operations
                if (!wasmLoaded) {
                    throw new Error('WASM libraries not loaded');
                }

                const timestamp = new Date().toLocaleTimeString([], { hour12: false });
                const idBase = Math.random().toString(36).substring(2, 9);

                let newKeys: Key[] = [];
                let algoName = '';

                if (algorithm === 'ML-KEM') {
                    algoName = `ML-KEM-${keySize}`;
                    console.log('[Playground] Generating ML-KEM keys...', algoName);
                    const keys = await MLKEM.generateKey({ name: algoName });
                    console.log('[Playground] ML-KEM keys generated:', keys);

                    newKeys = [
                        {
                            id: `pk-${idBase}`,
                            name: `${algoName} Public Key (WASM) [${timestamp}]`,
                            type: 'public',
                            algorithm: algoName,
                            value: bytesToHex(keys.publicKey),
                            data: keys.publicKey,
                            dataType: 'binary',
                            timestamp: Date.now()
                        },
                        {
                            id: `sk-${idBase}`,
                            name: `${algoName} Private Key (WASM) [${timestamp}]`,
                            type: 'private',
                            algorithm: algoName,
                            value: bytesToHex(keys.secretKey),
                            data: keys.secretKey,
                            dataType: 'binary',
                            timestamp: Date.now()
                        }
                    ];

                    setKeyStore(prev => [...prev, ...newKeys]);
                    setSelectedEncKeyId(newKeys[0].id);
                    setSelectedDecKeyId(newKeys[1].id);

                    const end = performance.now();
                    addLog({
                        keyLabel: `${algoName} Pair`,
                        operation: 'Key Generation (WASM)',
                        result: `PK: ${keys.publicKey.length}B, SK: ${keys.secretKey.length}B`,
                        executionTime: end - start
                    });

                } else {
                    // ML-DSA
                    algoName = `ML-DSA-${keySize}`;
                    const keypair = await MLDSA.generateKey({ name: algoName }, true, [
                        'sign',
                        'verify',
                    ]);

                    newKeys = [
                        {
                            id: `pk-${idBase}`,
                            name: `${algoName} Public Key (WASM) [${timestamp}]`,
                            type: 'public',
                            algorithm: algoName,
                            value: bytesToHex(keypair.publicKey),
                            data: keypair.publicKey,
                            dataType: 'binary',
                            timestamp: Date.now()
                        },
                        {
                            id: `sk-${idBase}`,
                            name: `${algoName} Private Key (WASM) [${timestamp}]`,
                            type: 'private',
                            algorithm: algoName,
                            value: bytesToHex(keypair.secretKey),
                            data: keypair.secretKey,
                            dataType: 'binary',
                            timestamp: Date.now()
                        }
                    ];

                    setKeyStore(prev => [...prev, ...newKeys]);
                    setSelectedSignKeyId(newKeys[1].id);
                    setSelectedVerifyKeyId(newKeys[0].id);

                    const end = performance.now();
                    addLog({
                        keyLabel: `${algoName} Pair`,
                        operation: 'Key Generation (WASM)',
                        result: `PK: ${keypair.publicKey.length}B, SK: ${keypair.secretKey.length}B`,
                        executionTime: end - start
                    });
                }
            } else {
                // Mock Mode - Simulated operations
                await new Promise(resolve => setTimeout(resolve, 800));

                const timestamp = new Date().toLocaleTimeString([], { hour12: false });
                const idBase = Math.random().toString(36).substring(2, 9);

                const algorithmLabel = algorithm === 'ML-KEM' ? `ML-KEM-${keySize}` : `ML-DSA-${keySize}`;
                const publicKeyType = algorithm === 'ML-KEM' ? 'Kyber' : 'Dilithium';
                const privateKeyType = algorithm === 'ML-KEM' ? 'Kyber' : 'Dilithium';

                const newKeys: Key[] = [
                    {
                        id: `pk-${idBase}`,
                        name: `${algorithmLabel} Public Key (Mock) [${timestamp}]`,
                        type: 'public',
                        algorithm,
                        value: algorithm === 'ML-KEM'
                            ? `1a2b3c4d... (${publicKeyType}-${keySize} Public Key)`
                            : `5e6f7g8h... (${publicKeyType}-${keySize} Public Key)`,
                        dataType: 'string',
                        timestamp: Date.now()
                    },
                    {
                        id: `sk-${idBase}`,
                        name: `${algorithmLabel} Private Key (Mock) [${timestamp}]`,
                        type: 'private',
                        algorithm,
                        value: algorithm === 'ML-KEM'
                            ? `9z8y7x6w... (${privateKeyType}-${keySize} Private Key)`
                            : `4v3u2t1s... (${privateKeyType}-${keySize} Private Key)`,
                        dataType: 'string',
                        timestamp: Date.now()
                    }
                ];

                setKeyStore(prev => [...prev, ...newKeys]);

                if (algorithm === 'ML-KEM') {
                    setSelectedEncKeyId(newKeys[0].id);
                    setSelectedDecKeyId(newKeys[1].id);
                } else {
                    setSelectedSignKeyId(newKeys[1].id);
                    setSelectedVerifyKeyId(newKeys[0].id);
                }

                const end = performance.now();

                addLog({
                    keyLabel: `${algorithmLabel} Pair`,
                    operation: 'Key Generation (Mock)',
                    result: 'Success',
                    executionTime: end - start
                });
            }
        } catch (err: any) {
            setError(`Failed to generate keys: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const generateClassicalKeys = async () => {
        setClassicalLoading(true);
        setError(null);
        const start = performance.now();

        try {
            const timestamp = new Date().toLocaleTimeString([], { hour12: false });
            const idBase = Math.random().toString(36).substring(2, 9);
            let newKeys: Key[] = [];
            let keyPairResult;

            // Generate keys based on selected algorithm
            if (classicalAlgorithm.startsWith('RSA')) {
                const keySize = parseInt(classicalAlgorithm.split('-')[1]) as WebCrypto.RSAKeySize;
                keyPairResult = await WebCrypto.generateRSAKeyPair(keySize);

                newKeys = [
                    {
                        id: `pk-${idBase}`,
                        name: `${classicalAlgorithm} Public Key (WebCrypto) [${timestamp}]`,
                        type: 'public',
                        algorithm: 'RSA',
                        value: keyPairResult.publicKeyHex,
                        data: keyPairResult.publicKey,
                        dataType: 'cryptokey',
                        timestamp: Date.now()
                    },
                    {
                        id: `sk-${idBase}`,
                        name: `${classicalAlgorithm} Private Key (WebCrypto) [${timestamp}]`,
                        type: 'private',
                        algorithm: 'RSA',
                        value: keyPairResult.privateKeyHex,
                        data: keyPairResult.privateKey,
                        dataType: 'cryptokey',
                        timestamp: Date.now()
                    }
                ];
            } else if (classicalAlgorithm === 'ECDSA-P256') {
                keyPairResult = await WebCrypto.generateECDSAKeyPair();

                newKeys = [
                    {
                        id: `pk-${idBase}`,
                        name: `ECDSA P-256 Public Key (WebCrypto) [${timestamp}]`,
                        type: 'public',
                        algorithm: 'ECDSA-P256',
                        value: keyPairResult.publicKeyHex,
                        data: keyPairResult.publicKey,
                        dataType: 'cryptokey',
                        timestamp: Date.now()
                    },
                    {
                        id: `sk-${idBase}`,
                        name: `ECDSA P-256 Private Key (WebCrypto) [${timestamp}]`,
                        type: 'private',
                        algorithm: 'ECDSA-P256',
                        value: keyPairResult.privateKeyHex,
                        data: keyPairResult.privateKey,
                        dataType: 'cryptokey',
                        timestamp: Date.now()
                    }
                ];
            } else if (classicalAlgorithm === 'Ed25519') {
                keyPairResult = await WebCrypto.generateEd25519KeyPair();

                newKeys = [
                    {
                        id: `pk-${idBase}`,
                        name: `Ed25519 Public Key (WebCrypto) [${timestamp}]`,
                        type: 'public',
                        algorithm: 'Ed25519',
                        value: keyPairResult.publicKeyHex,
                        data: keyPairResult.publicKey,
                        dataType: 'cryptokey',
                        timestamp: Date.now()
                    },
                    {
                        id: `sk-${idBase}`,
                        name: `Ed25519 Private Key (WebCrypto) [${timestamp}]`,
                        type: 'private',
                        algorithm: 'Ed25519',
                        value: keyPairResult.privateKeyHex,
                        data: keyPairResult.privateKey,
                        dataType: 'cryptokey',
                        timestamp: Date.now()
                    }
                ];
            } else if (classicalAlgorithm === 'X25519') {
                keyPairResult = await WebCrypto.generateX25519KeyPair();

                newKeys = [
                    {
                        id: `pk-${idBase}`,
                        name: `X25519 Public Key (WebCrypto) [${timestamp}]`,
                        type: 'public',
                        algorithm: 'X25519',
                        value: keyPairResult.publicKeyHex,
                        data: keyPairResult.publicKey,
                        dataType: 'cryptokey',
                        timestamp: Date.now()
                    },
                    {
                        id: `sk-${idBase}`,
                        name: `X25519 Private Key (WebCrypto) [${timestamp}]`,
                        type: 'private',
                        algorithm: 'X25519',
                        value: keyPairResult.privateKeyHex,
                        data: keyPairResult.privateKey,
                        dataType: 'cryptokey',
                        timestamp: Date.now()
                    }
                ];
            } else if (classicalAlgorithm === 'P-256') {
                keyPairResult = await WebCrypto.generateECDHKeyPair();

                newKeys = [
                    {
                        id: `pk-${idBase}`,
                        name: `P-256 ECDH Public Key (WebCrypto) [${timestamp}]`,
                        type: 'public',
                        algorithm: 'P-256',
                        value: keyPairResult.publicKeyHex,
                        data: keyPairResult.publicKey,
                        dataType: 'cryptokey',
                        timestamp: Date.now()
                    },
                    {
                        id: `sk-${idBase}`,
                        name: `P-256 ECDH Private Key (WebCrypto) [${timestamp}]`,
                        type: 'private',
                        algorithm: 'P-256',
                        value: keyPairResult.privateKeyHex,
                        data: keyPairResult.privateKey,
                        dataType: 'cryptokey',
                        timestamp: Date.now()
                    }
                ];
            } else if (classicalAlgorithm.startsWith('AES')) {
                const keySize = parseInt(classicalAlgorithm.split('-')[1]) as WebCrypto.AESKeySize;
                const aesKey = await WebCrypto.generateAESKey(keySize);
                const exportedKey = await crypto.subtle.exportKey('raw', aesKey);

                newKeys = [
                    {
                        id: `aes-${idBase}`,
                        name: `${classicalAlgorithm}-GCM Key (WebCrypto) [${timestamp}]`,
                        type: 'symmetric',
                        algorithm: 'AES-GCM',
                        value: WebCrypto.arrayBufferToHex(exportedKey),
                        data: aesKey,
                        dataType: 'cryptokey',
                        timestamp: Date.now()
                    }
                ];
            }

            setKeyStore(prev => [...prev, ...newKeys]);

            const end = performance.now();
            addLog({
                keyLabel: `${classicalAlgorithm} ${newKeys.length > 1 ? 'Pair' : 'Key'}`,
                operation: 'Key Generation (WebCrypto)',
                result: `Generated ${newKeys.length} key(s)`,
                executionTime: end - start
            });

        } catch (err: any) {
            setError(`Failed to generate classical keys: ${err.message}`);
        } finally {
            setClassicalLoading(false);
        }
    };

    const runOperation = async (type: 'encapsulate' | 'decapsulate' | 'sign' | 'verify' | 'encrypt' | 'decrypt' | 'symEncrypt' | 'symDecrypt') => {
        setLoading(true);
        setError(null);
        const start = performance.now();

        try {
            // 1. Identify the key involved (if any)
            let selectedKey: Key | undefined;
            if (type === 'encapsulate') selectedKey = keyStore.find(k => k.id === selectedEncKeyId);
            else if (type === 'decapsulate') selectedKey = keyStore.find(k => k.id === selectedDecKeyId);
            else if (type === 'symEncrypt' || type === 'symDecrypt') selectedKey = keyStore.find(k => k.id === selectedSymKeyId);
            else if (type === 'sign') selectedKey = keyStore.find(k => k.id === selectedSignKeyId);
            else if (type === 'verify') selectedKey = keyStore.find(k => k.id === selectedVerifyKeyId);

            // 2. Check if Classical Algorithm
            const isClassical = selectedKey && (
                selectedKey.algorithm.startsWith('RSA') ||
                selectedKey.algorithm.startsWith('ECDSA') ||
                selectedKey.algorithm === 'Ed25519' ||
                selectedKey.algorithm === 'X25519' ||
                selectedKey.algorithm === 'P-256' ||
                selectedKey.algorithm.startsWith('AES')
            );
            if (isClassical && selectedKey) {
                // --- CLASSICAL OPERATIONS (Web Crypto) ---
                if (type === 'encapsulate') {
                    if (!selectedKey.data || !(selectedKey.data instanceof CryptoKey)) throw new Error("Invalid key data for Web Crypto operation");

                    const ephemeralKeyPair = selectedKey.algorithm === 'X25519'
                        ? await WebCrypto.generateX25519KeyPair()
                        : await WebCrypto.generateECDHKeyPair();

                    const sharedSecretBytes = await WebCrypto.deriveSharedSecret(ephemeralKeyPair.privateKey, selectedKey.data);
                    const ciphertextHex = ephemeralKeyPair.publicKeyHex;

                    setSharedSecret(bytesToHex(sharedSecretBytes));
                    setCiphertext(ciphertextHex);

                    const end = performance.now();
                    addLog({
                        keyLabel: selectedKey.name,
                        operation: `Encapsulate (${selectedKey.algorithm})`,
                        result: `Shared Secret: ${sharedSecretBytes.length}B, Ephemeral PK: ${ciphertextHex.length / 2}B`,
                        executionTime: end - start
                    });
                    setLoading(false);
                    return;
                }
                else if (type === 'decapsulate') {
                    if (!selectedKey.data || !(selectedKey.data instanceof CryptoKey)) throw new Error("Invalid key data for Web Crypto operation");
                    if (!ciphertext) throw new Error("No ciphertext available. Run Encapsulate first.");

                    const epkBytes = hexToBytes(ciphertext);
                    const epk = await window.crypto.subtle.importKey(
                        'raw',
                        epkBytes as BufferSource,
                        selectedKey.algorithm === 'X25519' ? { name: 'X25519' } : { name: 'ECDH', namedCurve: 'P-256' },
                        true,
                        []
                    );

                    const recoveredSecret = await WebCrypto.deriveSharedSecret(selectedKey.data, epk);

                    // Verify match
                    let matches = false;
                    if (sharedSecret) {
                        const originalSecretBytes = hexToBytes(sharedSecret);
                        matches = recoveredSecret.every((byte: number, i: number) => byte === originalSecretBytes[i]);
                    }

                    const end = performance.now();
                    addLog({
                        keyLabel: selectedKey.name,
                        operation: `Decapsulate (${selectedKey.algorithm})`,
                        result: matches ? '✓ Secret Recovered (Match)' : '✗ Mismatch',
                        executionTime: end - start
                    });
                    setLoading(false);
                    return;
                }
                else if (type === 'sign') {
                    if (!selectedKey.data || !(selectedKey.data instanceof CryptoKey)) throw new Error("Invalid key data for Web Crypto operation");

                    const messageBytes = new TextEncoder().encode(dataToSign);
                    let signature: Uint8Array;

                    if (selectedKey.algorithm.startsWith('RSA')) {
                        signature = await WebCrypto.signRSA(selectedKey.data, messageBytes);
                    } else if (selectedKey.algorithm.startsWith('ECDSA')) {
                        signature = await WebCrypto.signECDSA(selectedKey.data, messageBytes);
                    } else {
                        signature = await WebCrypto.signEd25519(selectedKey.data, messageBytes);
                    }

                    const end = performance.now();
                    setSignature(bytesToHex(signature));
                    addLog({
                        keyLabel: selectedKey.name,
                        operation: `Sign (${selectedKey.algorithm})`,
                        result: `Signature: ${signature.length} bytes`,
                        executionTime: end - start
                    });
                    setLoading(false);
                    return;
                }
                else if (type === 'verify') {
                    if (!selectedKey.data || !(selectedKey.data instanceof CryptoKey)) throw new Error("Invalid key data for Web Crypto operation");
                    if (!signature) throw new Error("No signature available. Run Sign first.");

                    const messageBytes = new TextEncoder().encode(dataToSign);
                    const signatureBytes = hexToBytes(signature);
                    let isValid: boolean;

                    if (selectedKey.algorithm.startsWith('RSA')) {
                        isValid = await WebCrypto.verifyRSA(selectedKey.data, signatureBytes, messageBytes);
                    } else if (selectedKey.algorithm.startsWith('ECDSA')) {
                        isValid = await WebCrypto.verifyECDSA(selectedKey.data, signatureBytes, messageBytes);
                    } else {
                        isValid = await WebCrypto.verifyEd25519(selectedKey.data, signatureBytes, messageBytes);
                    }

                    const end = performance.now();
                    addLog({
                        keyLabel: selectedKey.name,
                        operation: `Verify (${selectedKey.algorithm})`,
                        result: isValid ? '✓ VALID' : '✗ INVALID',
                        executionTime: end - start
                    });
                    setLoading(false);
                    return;
                }
                else if (type === 'symEncrypt') {
                    if (!selectedKey.data || !(selectedKey.data instanceof CryptoKey)) throw new Error("Invalid symmetric key");

                    const iv = WebCrypto.getRandomBytes(12);
                    const dataBytes = hexToBytes(symData);
                    const ciphertext = await WebCrypto.encryptAES(selectedKey.data, dataBytes, iv);

                    // Combine IV + Ciphertext
                    const result = new Uint8Array(iv.length + ciphertext.length);
                    result.set(iv, 0);
                    result.set(ciphertext, iv.length);

                    const resultHex = bytesToHex(result);
                    setSymOutput(resultHex);

                    const end = performance.now();
                    addLog({
                        keyLabel: selectedKey.name,
                        operation: 'Symmetric Encrypt (AES-GCM)',
                        result: `Ciphertext: ${resultHex.length / 2} bytes (IV included)`,
                        executionTime: end - start
                    });
                    setLoading(false);
                    return;
                }
                else if (type === 'symDecrypt') {
                    if (!selectedKey.data || !(selectedKey.data instanceof CryptoKey)) throw new Error("Invalid symmetric key");

                    const inputBytes = hexToBytes(symOutput);

                    if (inputBytes.length < 12) throw new Error("Invalid ciphertext (too short for IV)");
                    const iv = inputBytes.slice(0, 12);
                    const ciphertext = inputBytes.slice(12);

                    const plaintext = await WebCrypto.decryptAES(selectedKey.data, ciphertext, iv);
                    const plaintextHex = bytesToHex(plaintext);

                    setSymData(plaintextHex);

                    const end = performance.now();
                    addLog({
                        keyLabel: selectedKey.name,
                        operation: 'Symmetric Decrypt (AES-GCM)',
                        result: `Plaintext: ${plaintextHex.length / 2} bytes`,
                        executionTime: end - start
                    });
                    setLoading(false);
                    return;
                }
            }

            if (executionMode === 'wasm') {
                // WASM Mode Operations
                if (!wasmLoaded) throw new Error('WASM libraries not loaded');

                if (type === 'encapsulate') {
                    const key = keyStore.find(k => k.id === selectedEncKeyId);
                    if (!key) throw new Error("Please select a Public Key");

                    if (!key.data || !(key.data instanceof Uint8Array)) throw new Error("Selected key has invalid data format (expected Uint8Array)");

                    let algoName = key.algorithm;
                    if (algoName === 'ML-KEM') {
                        // Infer from key size for legacy keys
                        const len = key.data.length;
                        if (len === 800) algoName = 'ML-KEM-512';
                        else if (len === 1184) algoName = 'ML-KEM-768';
                        else if (len === 1568) algoName = 'ML-KEM-1024';
                        else algoName = `ML-KEM-${keySize}`; // Fallback
                    }
                    const { ciphertext, sharedKey } = await MLKEM.encapsulateBits({ name: algoName }, key.data);

                    setSharedSecret(bytesToHex(sharedKey));
                    setCiphertext(bytesToHex(ciphertext));

                    const end = performance.now();

                    addLog({
                        keyLabel: key.name,
                        operation: 'Encapsulate (WASM)',
                        result: `Shared Secret: ${sharedKey.length}B, Ciphertext: ${ciphertext.length}B`,
                        executionTime: end - start
                    });
                }
                else if (type === 'decapsulate') {
                    const key = keyStore.find(k => k.id === selectedDecKeyId);
                    if (!key) throw new Error("Please select a Private Key");

                    if (!key.data || !(key.data instanceof Uint8Array)) throw new Error("Selected key has invalid data format (expected Uint8Array)");
                    if (!ciphertext) throw new Error("No ciphertext available. Run Encapsulate first.");

                    let algoName = key.algorithm;
                    if (algoName === 'ML-KEM') {
                        // Infer from key size for legacy keys
                        const len = key.data.length;
                        if (len === 1632) algoName = 'ML-KEM-512';
                        else if (len === 2400) algoName = 'ML-KEM-768';
                        else if (len === 3168) algoName = 'ML-KEM-1024';
                        else algoName = `ML-KEM-${keySize}`; // Fallback
                    }
                    const recoveredSecret = await MLKEM.decapsulateBits({ name: algoName }, key.data, hexToBytes(ciphertext));

                    // Verify against the shared secret from encapsulation (if available)
                    let matches = false;
                    if (sharedSecret) {
                        const originalSecretBytes = hexToBytes(sharedSecret);
                        matches = recoveredSecret.every((byte: number, i: number) => byte === originalSecretBytes[i]);
                    }

                    const end = performance.now();

                    addLog({
                        keyLabel: key.name,
                        operation: 'Decapsulate (WASM)',
                        result: matches ? '✓ Secret Recovered (Match)' : '✗ Mismatch',
                        executionTime: end - start
                    });
                }
                else if (type === 'encrypt') {
                    if (!sharedSecret) throw new Error("No shared secret available. Run Encapsulate first.");
                    if (!dataToEncrypt) throw new Error("Please enter a message to encrypt.");

                    // Use Web Crypto API for AES-GCM encryption with the shared secret
                    const key = await window.crypto.subtle.importKey(
                        "raw",
                        hexToBytes(sharedSecret) as BufferSource,
                        { name: "AES-GCM" },
                        false,
                        ["encrypt"]
                    );

                    const iv = window.crypto.getRandomValues(new Uint8Array(12));
                    const encodedMessage = new TextEncoder().encode(dataToEncrypt);

                    const encryptedContent = await window.crypto.subtle.encrypt(
                        {
                            name: "AES-GCM",
                            iv: iv
                        },
                        key,
                        encodedMessage
                    );

                    const combined = new Uint8Array(iv.length + encryptedContent.byteLength);
                    combined.set(iv);
                    combined.set(new Uint8Array(encryptedContent), iv.length);

                    setEncryptedData(bytesToHex(combined));

                    const end = performance.now();

                    addLog({
                        keyLabel: 'Shared Secret',
                        operation: 'AES-GCM Encrypt',
                        result: `Encrypted ${encodedMessage.length} bytes`,
                        executionTime: end - start
                    });
                }
                else if (type === 'decrypt') {
                    if (!sharedSecret) throw new Error("No shared secret available.");
                    if (!encryptedData) throw new Error("No encrypted data available. Run Encrypt first.");

                    const combinedEncryptedData = hexToBytes(encryptedData);
                    const iv = combinedEncryptedData.slice(0, 12);
                    const data = combinedEncryptedData.slice(12);

                    const key = await window.crypto.subtle.importKey(
                        "raw",
                        hexToBytes(sharedSecret) as BufferSource,
                        { name: "AES-GCM" },
                        false,
                        ["decrypt"]
                    );

                    const decryptedContent = await window.crypto.subtle.decrypt(
                        {
                            name: "AES-GCM",
                            iv: iv
                        },
                        key,
                        data
                    );

                    setDecryptedData(new TextDecoder().decode(decryptedContent));

                    const end = performance.now();

                    addLog({
                        keyLabel: 'Shared Secret',
                        operation: 'AES-GCM Decrypt',
                        result: 'Message Decrypted Successfully',
                        executionTime: end - start
                    });
                }
                else if (type === 'sign') {
                    const key = keyStore.find(k => k.id === selectedSignKeyId);
                    if (!key) throw new Error("Please select a Private Key");

                    if (!key.data || !(key.data instanceof Uint8Array)) throw new Error("Selected key has invalid data format (expected Uint8Array)");

                    const messageBytes = new TextEncoder().encode(dataToSign);
                    const signature = await MLDSA.sign(messageBytes, key.data);

                    setSignature(bytesToHex(signature));

                    const end = performance.now();

                    addLog({
                        keyLabel: key.name,
                        operation: 'Sign (WASM)',
                        result: `Signature: ${signature.length} bytes`,
                        executionTime: end - start
                    });
                }
                else if (type === 'verify') {
                    const key = keyStore.find(k => k.id === selectedVerifyKeyId);
                    if (!key) throw new Error("Please select a Public Key");

                    if (!key.data || !(key.data instanceof Uint8Array)) throw new Error("Selected key has invalid data format (expected Uint8Array)");
                    if (!signature) throw new Error("No signature available. Run Sign first.");

                    const messageBytes = new TextEncoder().encode(dataToSign);
                    const isValid = await MLDSA.verify(hexToBytes(signature), messageBytes, key.data);

                    const end = performance.now();

                    addLog({
                        keyLabel: key.name,
                        operation: 'Verify (WASM)',
                        result: isValid ? '✓ VALID' : '✗ INVALID',
                        executionTime: end - start
                    });
                }
            } else {
                // Mock Mode Operations
                await new Promise(resolve => setTimeout(resolve, 500));

                if (type === 'encapsulate') {
                    const key = keyStore.find(k => k.id === selectedEncKeyId);
                    if (!key) throw new Error("Please select a Public Key");

                    const newSharedSecret = Math.random().toString(36).substring(2).toUpperCase();
                    const newCiphertext = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
                    setSharedSecret(newSharedSecret);
                    setCiphertext(newCiphertext);

                    const end = performance.now();

                    addLog({
                        keyLabel: key.name,
                        operation: 'Encapsulate (Mock)',
                        result: 'Shared Secret Generated',
                        executionTime: end - start
                    });
                }
                else if (type === 'decapsulate') {
                    const key = keyStore.find(k => k.id === selectedDecKeyId);
                    if (!key) throw new Error("Please select a Private Key");
                    if (!ciphertext) throw new Error("No ciphertext available. Run Encapsulate first.");

                    const end = performance.now();

                    addLog({
                        keyLabel: key.name,
                        operation: 'Decapsulate (Mock)',
                        result: 'Secret Recovered (Simulated)',
                        executionTime: end - start
                    });
                }
                else if (type === 'encrypt') {
                    if (!sharedSecret) throw new Error("No shared secret available. Run Encapsulate first.");
                    if (!dataToEncrypt) throw new Error("Please enter a message to encrypt.");

                    const encrypted = 'mock_encrypted_' + btoa(dataToEncrypt);
                    setEncryptedData(encrypted);

                    const end = performance.now();

                    addLog({
                        keyLabel: 'Shared Secret',
                        operation: 'Encrypt (Mock)',
                        result: 'Message Encrypted',
                        executionTime: end - start
                    });
                }
                else if (type === 'decrypt') {
                    if (!sharedSecret) throw new Error("No shared secret available.");
                    if (!encryptedData) throw new Error("No encrypted data available. Run Encrypt first.");

                    let decrypted = '';
                    if (encryptedData.startsWith('mock_encrypted_')) {
                        decrypted = atob(encryptedData.replace('mock_encrypted_', ''));
                    } else {
                        throw new Error("Invalid mock encrypted data format.");
                    }
                    setDecryptedData(decrypted);

                    const end = performance.now();

                    addLog({
                        keyLabel: 'Shared Secret',
                        operation: 'Decrypt (Mock)',
                        result: 'Message Decrypted',
                        executionTime: end - start
                    });
                }
                else if (type === 'sign') {
                    const key = keyStore.find(k => k.id === selectedSignKeyId);
                    if (!key) throw new Error("Please select a Private Key");

                    const newSignature = 'mock_signature_' + Math.random().toString(36).substring(7);
                    setSignature(newSignature);

                    const end = performance.now();

                    addLog({
                        keyLabel: key.name,
                        operation: 'Sign (Mock)',
                        result: 'Signature Generated',
                        executionTime: end - start
                    });
                }
                else if (type === 'verify') {
                    const key = keyStore.find(k => k.id === selectedVerifyKeyId);
                    if (!key) throw new Error("Please select a Public Key");
                    if (!signature) throw new Error("No signature available. Run Sign first or enter a signature.");

                    const isValid = signature.startsWith('mock_signature_'); // Simple mock validation

                    const end = performance.now();

                    addLog({
                        keyLabel: key.name,
                        operation: 'Verify (Mock)',
                        result: isValid ? '✓ VALID' : '✗ INVALID',
                        executionTime: end - start
                    });
                }
            }
        } catch (err: any) {
            setError(err.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

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
            handleAlgorithmChange, generateKeys, generateClassicalKeys, runOperation, addLog, clearLogs,
            activeTab, setActiveTab
        }}>
            {children}
        </PlaygroundContext.Provider>
    );
};

import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Lock, Key as KeyIcon, Play, AlertCircle, FileSignature, Cpu, Settings, Database, Activity, FileText, Layers, ArrowUpDown, ArrowUp, ArrowDown, ShieldCheck, CheckSquare, Square, Hash } from 'lucide-react';
import clsx from 'clsx';
import { DataInput, bytesToHex, hexToBytes } from './DataInput';
import { ACVPTesting } from '../ACVP/ACVPTesting';
import * as WebCrypto from '../../utils/webCrypto';
import { KeyStoreView } from './KeyStoreView';

// WASM wrappers
import * as MLKEM from '../../wasm/liboqs_kem';
import * as MLDSA from '../../wasm/liboqs_dsa';

import type { Key, LogEntry } from '../../types';

type ExecutionMode = 'mock' | 'wasm';
type SortColumn = 'timestamp' | 'keyLabel' | 'operation' | 'result' | 'executionTime';
type SortDirection = 'asc' | 'desc';

export const InteractivePlayground = () => {
    const [algorithm, setAlgorithm] = useState<'ML-KEM' | 'ML-DSA'>('ML-KEM');
    const [keySize, setKeySize] = useState<string>('768'); // Default: ML-KEM-768
    const [executionMode, setExecutionMode] = useState<ExecutionMode>('mock');
    const [wasmLoaded, setWasmLoaded] = useState(false);

    // Update key size when algorithm changes
    const handleAlgorithmChange = (newAlgorithm: 'ML-KEM' | 'ML-DSA') => {
        setAlgorithm(newAlgorithm);
        // Set appropriate default for each algorithm
        setKeySize(newAlgorithm === 'ML-KEM' ? '768' : '65');
    };
    const [keyStore, setKeyStore] = useState<Key[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sorting state for logs
    const [sortColumn, setSortColumn] = useState<SortColumn>('timestamp');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Column Resizing State
    const [columnWidths, setColumnWidths] = useState({
        timestamp: 150,
        keyLabel: 200,
        operation: 180,
        result: 300,
        executionTime: 120
    });
    const [resizingColumn, setResizingColumn] = useState<SortColumn | null>(null);
    const resizeStartX = useRef<number>(0);
    const resizeStartWidth = useRef<number>(0);

    // ML-KEM State
    const [sharedSecret, setSharedSecret] = useState<string>('');
    const [ciphertext, setCiphertext] = useState<string>('');
    const [encryptedData, setEncryptedData] = useState<string>('');

    // ML-DSA State
    const [signature, setSignature] = useState<string>('');

    // Selection states
    const [selectedEncKeyId, setSelectedEncKeyId] = useState<string>('');
    const [selectedDecKeyId, setSelectedDecKeyId] = useState<string>('');
    const [selectedSignKeyId, setSelectedSignKeyId] = useState<string>('');
    const [selectedVerifyKeyId, setSelectedVerifyKeyId] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'settings' | 'data' | 'kem' | 'encrypt' | 'sign' | 'verify' | 'keystore' | 'logs' | 'acvp'>('settings');

    // Data States
    const [dataToSign, setDataToSign] = useState('Hello Quantum World!');
    const [dataToEncrypt, setDataToEncrypt] = useState('Secret Message');
    const [decryptedData, setDecryptedData] = useState('');

    // Classical Algorithm Selection (for Web Crypto API)
    type ClassicalAlgorithm = 'RSA-2048' | 'RSA-3072' | 'RSA-4096' | 'ECDSA-P256' | 'Ed25519' | 'X25519' | 'P-256' | 'AES-128' | 'AES-256';
    const [classicalAlgorithm, setClassicalAlgorithm] = useState<ClassicalAlgorithm>('RSA-2048');
    const [classicalLoading, setClassicalLoading] = useState(false);

    // Enabled Algorithms Configuration
    // Only algorithms with actual implementations are enabled by default
    const [enabledAlgorithms, setEnabledAlgorithms] = useState({
        kem: {
            'ML-KEM-512': true,   // ✅ Implemented in WASM (liboqs)
            'ML-KEM-768': true,   // ✅ Implemented in WASM (liboqs)
            'ML-KEM-1024': true,  // ✅ Implemented in WASM (liboqs)
            'X25519': true,       // ✅ Implemented in Web Crypto API
            'P-256': true,        // ✅ Implemented in Web Crypto API
        },
        signature: {
            'ML-DSA-44': true,    // ✅ Implemented in WASM (liboqs)
            'ML-DSA-65': true,    // ✅ Implemented in WASM (liboqs)
            'ML-DSA-87': true,    // ✅ Implemented in WASM (liboqs)
            'RSA-2048': true,     // ✅ Implemented in Web Crypto API
            'RSA-3072': true,     // ✅ Implemented in Web Crypto API
            'RSA-4096': true,     // ✅ Implemented in Web Crypto API
            'ECDSA-P256': true,   // ✅ Implemented in Web Crypto API
            'Ed25519': true,      // ✅ Implemented in Web Crypto API
        },
        symmetric: {
            'AES-128-GCM': true,  // ✅ Implemented in Web Crypto API
            'AES-256-GCM': true,  // ✅ Implemented in Web Crypto API
        },
        hash: {
            'SHA-256': true,      // ✅ Implemented in Web Crypto API
            'SHA-384': true,      // ✅ Implemented in Web Crypto API
            'SHA3-256': false,    // ⏸️ Skipped for now (would need @noble/hashes)
        }
    });


    const toggleAlgorithm = (category: 'kem' | 'signature' | 'symmetric' | 'hash', algorithm: string) => {
        setEnabledAlgorithms(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [algorithm]: !prev[category][algorithm as keyof typeof prev[typeof category]]
            }
        }));
    };


    // Load WASM libraries when switching to WASM mode
    useEffect(() => {
        const loadWASM = async () => {
            if (executionMode === 'wasm' && !wasmLoaded) {
                console.log('[Playground] Starting WASM load...');
                try {
                    // Dynamically import WASM libraries (mlkem-wasm & mldsa-wasm)
                    // Dynamically import WASM libraries (mlkem-wasm & mldsa-wasm)
                    // MLKEM (liboqs) is loaded implicitly

                    console.log('[Playground] Importing @openforge-sh/liboqs for ML-DSA...');
                    await MLDSA.load();
                    console.log('[Playground] @openforge-sh/liboqs loaded');

                    setWasmLoaded(true);
                    addLog({
                        keyLabel: 'System',
                        operation: 'Load WASM',
                        result: 'Libraries loaded successfully',
                        executionTime: 0
                    });
                    console.log('[Playground] WASM loaded successfully');
                } catch (err: any) {
                    console.error('[Playground] Failed to load WASM:', err);
                    setError(`Failed to load WASM libraries: ${err.message}. Falling back to Mock mode.`);
                    setExecutionMode('mock');
                }
            }
        };

        loadWASM();
    }, [executionMode, wasmLoaded]);

    // Check browser WASM support
    useEffect(() => {
        const isWasmSupported = typeof WebAssembly === 'object';
        if (!isWasmSupported && executionMode === 'wasm') {
            setExecutionMode('mock');
            setError('WebAssembly not supported in this browser. Using Mock mode.');
        }
    }, [executionMode]);

    // Session storage persistence
    useEffect(() => {
        const savedMode = sessionStorage.getItem('playground-execution-mode');
        if (savedMode === 'wasm' || savedMode === 'mock') {
            setExecutionMode(savedMode);
        }

        // Load enabled algorithms from session storage
        const savedAlgorithms = sessionStorage.getItem('playground-enabled-algorithms');
        if (savedAlgorithms) {
            try {
                setEnabledAlgorithms(JSON.parse(savedAlgorithms));
            } catch (e) {
                console.error('Failed to parse saved algorithms:', e);
            }
        }
    }, []);

    useEffect(() => {
        sessionStorage.setItem('playground-execution-mode', executionMode);
    }, [executionMode]);

    useEffect(() => {
        sessionStorage.setItem('playground-enabled-algorithms', JSON.stringify(enabledAlgorithms));
    }, [enabledAlgorithms]);


    // Resize Event Listeners
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (resizingColumn) {
                const diff = e.clientX - resizeStartX.current;
                const newWidth = Math.max(50, resizeStartWidth.current + diff); // Minimum width 50px
                setColumnWidths(prev => ({
                    ...prev,
                    [resizingColumn]: newWidth
                }));
            }
        };

        const handleMouseUp = () => {
            if (resizingColumn) {
                setResizingColumn(null);
                document.body.style.cursor = 'default';
            }
        };

        if (resizingColumn) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingColumn]);


    const getPerformanceColor = (ms: number): string => {
        if (ms < 100) return 'text-green-400';
        if (ms < 500) return 'text-yellow-400';
        return 'text-red-400';
    };

    const addLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
        const newEntry: LogEntry = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }),
            ...entry
        };
        setLogs(prev => [newEntry, ...prev]);
    };

    const handleSort = (column: SortColumn) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('desc'); // Default to desc for new column usually better for logs
        }
    };

    const startResize = (e: React.MouseEvent, column: SortColumn) => {
        e.preventDefault();
        e.stopPropagation();
        setResizingColumn(column);
        resizeStartX.current = e.clientX;
        resizeStartWidth.current = columnWidths[column];
        document.body.style.cursor = 'col-resize';
    };

    const sortedLogs = [...logs].sort((a, b) => {
        let aValue: any = a[sortColumn];
        let bValue: any = b[sortColumn];

        // Handle numeric comparison for executionTime
        if (sortColumn === 'executionTime') {
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // String comparison for others
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
                        name: `ECDSA-P256 Public Key (WebCrypto) [${timestamp}]`,
                        type: 'public',
                        algorithm: 'ECDSA',
                        value: keyPairResult.publicKeyHex,
                        data: keyPairResult.publicKey,
                        dataType: 'cryptokey',
                        timestamp: Date.now()
                    },
                    {
                        id: `sk-${idBase}`,
                        name: `ECDSA-P256 Private Key (WebCrypto) [${timestamp}]`,
                        type: 'private',
                        algorithm: 'ECDSA',
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

    const runOperation = async (type: 'encapsulate' | 'decapsulate' | 'sign' | 'verify' | 'encrypt' | 'decrypt') => {
        setLoading(true);
        setError(null);
        const start = performance.now();

        try {
            // 1. Identify the key involved (if any)
            let selectedKey: Key | undefined;
            if (type === 'encapsulate') selectedKey = keyStore.find(k => k.id === selectedEncKeyId);
            else if (type === 'decapsulate') selectedKey = keyStore.find(k => k.id === selectedDecKeyId);
            else if (type === 'sign') selectedKey = keyStore.find(k => k.id === selectedSignKeyId);
            else if (type === 'verify') selectedKey = keyStore.find(k => k.id === selectedVerifyKeyId);

            // 2. Check if Classical Algorithm
            const isClassical = selectedKey && (
                ['Ed25519', 'X25519', 'P-256'].includes(selectedKey.algorithm) ||
                selectedKey.algorithm.startsWith('RSA') ||
                selectedKey.algorithm.startsWith('ECDSA')
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


    const isKEM = (algo: string) => algo.startsWith('ML-KEM') || ['X25519', 'P-256'].includes(algo);
    const isSign = (algo: string) => algo.startsWith('ML-DSA') || algo.startsWith('RSA') || algo.startsWith('ECDSA') || algo === 'Ed25519';

    const kemPublicKeys = keyStore.filter(k => k.type === 'public' && isKEM(k.algorithm));
    const kemPrivateKeys = keyStore.filter(k => k.type === 'private' && isKEM(k.algorithm));

    const signPublicKeys = keyStore.filter(k => k.type === 'public' && isSign(k.algorithm));
    const signPrivateKeys = keyStore.filter(k => k.type === 'private' && isSign(k.algorithm));

    return (
        <div className="glass-panel p-6 h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 shrink-0">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                    <Play className="text-secondary" aria-hidden="true" />
                    Interactive Playground
                </h3>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 bg-white/5 p-1 rounded-xl shrink-0 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('settings')}
                    className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                        activeTab === 'settings' ? "bg-primary/20 text-primary shadow-sm" : "text-muted hover:text-white hover:bg-white/5"
                    )}
                >
                    <Settings size={16} /> Settings
                </button>
                <button
                    onClick={() => setActiveTab('data')}
                    className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                        activeTab === 'data' ? "bg-primary/20 text-primary shadow-sm" : "text-muted hover:text-white hover:bg-white/5"
                    )}
                >
                    <Database size={16} /> Data
                </button>

                {/* PQC Tabs */}
                <button
                    onClick={() => setActiveTab('kem')}
                    className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                        activeTab === 'kem' ? "bg-primary/20 text-primary shadow-sm" : "text-muted hover:text-white hover:bg-white/5"
                    )}
                >
                    <Activity size={16} /> KEM
                </button>
                <button
                    onClick={() => setActiveTab('encrypt')}
                    className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                        activeTab === 'encrypt' ? "bg-primary/20 text-primary shadow-sm" : "text-muted hover:text-white hover:bg-white/5"
                    )}
                >
                    <Lock size={16} /> Encrypt
                </button>
                <button
                    onClick={() => setActiveTab('sign')}
                    className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                        activeTab === 'sign' ? "bg-primary/20 text-primary shadow-sm" : "text-muted hover:text-white hover:bg-white/5"
                    )}
                >
                    <FileSignature size={16} /> Sign
                </button>
                <button
                    onClick={() => setActiveTab('verify')}
                    className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                        activeTab === 'verify' ? "bg-primary/20 text-primary shadow-sm" : "text-muted hover:text-white hover:bg-white/5"
                    )}
                >
                    <FileSignature size={16} /> Verify
                </button>

                <button
                    onClick={() => setActiveTab('keystore')}
                    className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                        activeTab === 'keystore' ? "bg-primary/20 text-primary shadow-sm" : "text-muted hover:text-white hover:bg-white/5"
                    )}
                >
                    <KeyIcon size={16} /> Key Store ({keyStore.length})
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                        activeTab === 'logs' ? "bg-primary/20 text-primary shadow-sm" : "text-muted hover:text-white hover:bg-white/5"
                    )}
                >
                    <FileText size={16} /> Logs
                </button>
                <button
                    onClick={() => setActiveTab('acvp')}
                    className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                        activeTab === 'acvp' ? "bg-primary/20 text-primary shadow-sm" : "text-muted hover:text-white hover:bg-white/5"
                    )}
                >
                    <ShieldCheck size={16} /> ACVP
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 bg-white/5 rounded-xl border border-white/10 p-6 relative">

                {/* Tab: ACVP */}
                {activeTab === 'acvp' && (
                    <div className="h-full">
                        <ACVPTesting keyStore={keyStore} setKeyStore={setKeyStore} />
                    </div>
                )}

                {/* Tab: Settings */}
                {activeTab === 'settings' && (
                    <div className="space-y-8 max-w-2xl mx-auto animate-fade-in">
                        <div className="space-y-4">
                            <h4 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
                                <Cpu size={18} className="text-accent" /> Execution Mode
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setExecutionMode('mock')}
                                    className={clsx(
                                        "p-4 rounded-xl border transition-all text-left group",
                                        executionMode === 'mock'
                                            ? "bg-white/10 border-primary/50 ring-1 ring-primary/50"
                                            : "bg-black/20 border-white/10 hover:border-white/30"
                                    )}
                                >
                                    <div className="font-bold text-white mb-1 group-hover:text-primary transition-colors">Mock Mode</div>
                                    <div className="text-xs text-muted">Simulated operations. Instant execution for UI testing.</div>
                                </button>
                                <button
                                    onClick={() => setExecutionMode('wasm')}
                                    className={clsx(
                                        "p-4 rounded-xl border transition-all text-left group relative overflow-hidden",
                                        executionMode === 'wasm'
                                            ? "bg-primary/10 border-primary/50 ring-1 ring-primary/50"
                                            : "bg-black/20 border-white/10 hover:border-white/30"
                                    )}
                                >
                                    <div className="font-bold text-white mb-1 group-hover:text-primary transition-colors flex items-center gap-2">
                                        WASM Mode
                                        {executionMode === 'wasm' && !wasmLoaded && <RefreshCw size={12} className="animate-spin" />}
                                    </div>
                                    <div className="text-xs text-muted">Real cryptographic operations using WebAssembly.</div>
                                </button>
                            </div>
                        </div>

                        {/* Algorithm Configuration */}
                        <div className="space-y-4">
                            <h4 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
                                <Settings size={18} className="text-primary" /> Algorithm Configuration
                            </h4>

                            <div className="space-y-6">
                                {/* KEM Algorithms */}
                                <div className="bg-black/20 rounded-xl border border-white/10 p-4">
                                    <h5 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                        <Lock size={14} className="text-primary" />
                                        KEM Algorithms
                                    </h5>
                                    <div className="space-y-2">
                                        {/* ML-KEM */}
                                        <div className="space-y-1.5">
                                            <div className="text-xs font-semibold text-muted uppercase tracking-wider">ML-KEM (Post-Quantum)</div>
                                            <div className="grid grid-cols-1 gap-2">
                                                {['ML-KEM-512', 'ML-KEM-768', 'ML-KEM-1024'].map((algo) => (
                                                    <button
                                                        key={algo}
                                                        onClick={() => toggleAlgorithm('kem', algo)}
                                                        className={clsx(
                                                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all border text-left",
                                                            enabledAlgorithms.kem[algo as keyof typeof enabledAlgorithms.kem]
                                                                ? "bg-primary/10 border-primary/30 text-white"
                                                                : "bg-black/20 border-white/10 text-muted hover:bg-white/5"
                                                        )}
                                                    >
                                                        {enabledAlgorithms.kem[algo as keyof typeof enabledAlgorithms.kem] ? (
                                                            <CheckSquare size={16} className="text-primary shrink-0" />
                                                        ) : (
                                                            <Square size={16} className="shrink-0" />
                                                        )}
                                                        <span className="font-medium">{algo}</span>
                                                        <span className="text-xs ml-auto">
                                                            {algo === 'ML-KEM-512' && 'NIST Level 1'}
                                                            {algo === 'ML-KEM-768' && 'NIST Level 3'}
                                                            {algo === 'ML-KEM-1024' && 'NIST Level 5'}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Classical KEM */}
                                        <div className="space-y-1.5 pt-3 border-t border-white/5">
                                            <div className="text-xs font-semibold text-muted uppercase tracking-wider">Classical</div>
                                            <div className="grid grid-cols-1 gap-2">
                                                {[
                                                    { name: 'X25519', desc: 'Curve25519 ECDH' },
                                                    { name: 'P-256', desc: 'NIST P-256 ECDH' }
                                                ].map((algo) => (
                                                    <button
                                                        key={algo.name}
                                                        onClick={() => toggleAlgorithm('kem', algo.name)}
                                                        className={clsx(
                                                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all border text-left",
                                                            enabledAlgorithms.kem[algo.name as keyof typeof enabledAlgorithms.kem]
                                                                ? "bg-primary/10 border-primary/30 text-white"
                                                                : "bg-black/20 border-white/10 text-muted hover:bg-white/5"
                                                        )}
                                                    >
                                                        {enabledAlgorithms.kem[algo.name as keyof typeof enabledAlgorithms.kem] ? (
                                                            <CheckSquare size={16} className="text-primary shrink-0" />
                                                        ) : (
                                                            <Square size={16} className="shrink-0" />
                                                        )}
                                                        <span className="font-medium">{algo.name}</span>
                                                        <span className="text-xs ml-auto">{algo.desc}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Signature Algorithms */}
                                <div className="bg-black/20 rounded-xl border border-white/10 p-4">
                                    <h5 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                        <FileSignature size={14} className="text-secondary" />
                                        Signature Algorithms
                                    </h5>
                                    <div className="space-y-2">
                                        {/* ML-DSA */}
                                        <div className="space-y-1.5">
                                            <div className="text-xs font-semibold text-muted uppercase tracking-wider">ML-DSA (Post-Quantum)</div>
                                            <div className="grid grid-cols-1 gap-2">
                                                {['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87'].map((algo) => (
                                                    <button
                                                        key={algo}
                                                        onClick={() => toggleAlgorithm('signature', algo)}
                                                        className={clsx(
                                                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all border text-left",
                                                            enabledAlgorithms.signature[algo as keyof typeof enabledAlgorithms.signature]
                                                                ? "bg-secondary/10 border-secondary/30 text-white"
                                                                : "bg-black/20 border-white/10 text-muted hover:bg-white/5"
                                                        )}
                                                    >
                                                        {enabledAlgorithms.signature[algo as keyof typeof enabledAlgorithms.signature] ? (
                                                            <CheckSquare size={16} className="text-secondary shrink-0" />
                                                        ) : (
                                                            <Square size={16} className="shrink-0" />
                                                        )}
                                                        <span className="font-medium">{algo}</span>
                                                        <span className="text-xs ml-auto">
                                                            {algo === 'ML-DSA-44' && 'NIST Level 2'}
                                                            {algo === 'ML-DSA-65' && 'NIST Level 3'}
                                                            {algo === 'ML-DSA-87' && 'NIST Level 5'}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Classical Signatures */}
                                        <div className="space-y-1.5 pt-3 border-t border-white/5">
                                            <div className="text-xs font-semibold text-muted uppercase tracking-wider">Classical</div>
                                            <div className="grid grid-cols-1 gap-2">
                                                {[
                                                    { name: 'RSA-2048', desc: '2048 bits' },
                                                    { name: 'RSA-3072', desc: '3072 bits' },
                                                    { name: 'RSA-4096', desc: '4096 bits' },
                                                    { name: 'ECDSA-P256', desc: 'NIST P-256' },
                                                    { name: 'Ed25519', desc: 'Curve25519' }
                                                ].map((algo) => (
                                                    <button
                                                        key={algo.name}
                                                        onClick={() => toggleAlgorithm('signature', algo.name)}
                                                        className={clsx(
                                                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all border text-left",
                                                            enabledAlgorithms.signature[algo.name as keyof typeof enabledAlgorithms.signature]
                                                                ? "bg-secondary/10 border-secondary/30 text-white"
                                                                : "bg-black/20 border-white/10 text-muted hover:bg-white/5"
                                                        )}
                                                    >
                                                        {enabledAlgorithms.signature[algo.name as keyof typeof enabledAlgorithms.signature] ? (
                                                            <CheckSquare size={16} className="text-secondary shrink-0" />
                                                        ) : (
                                                            <Square size={16} className="shrink-0" />
                                                        )}
                                                        <span className="font-medium">{algo.name}</span>
                                                        <span className="text-xs ml-auto">{algo.desc}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Symmetric Encryption */}
                                <div className="bg-black/20 rounded-xl border border-white/10 p-4">
                                    <h5 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                        <Lock size={14} className="text-accent" />
                                        Symmetric Encryption
                                    </h5>
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { name: 'AES-128-GCM', desc: 'FIPS 197' },
                                            { name: 'AES-256-GCM', desc: 'FIPS 197' }
                                        ].map((algo) => (
                                            <button
                                                key={algo.name}
                                                onClick={() => toggleAlgorithm('symmetric', algo.name)}
                                                className={clsx(
                                                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all border text-left",
                                                    enabledAlgorithms.symmetric[algo.name as keyof typeof enabledAlgorithms.symmetric]
                                                        ? "bg-accent/10 border-accent/30 text-white"
                                                        : "bg-black/20 border-white/10 text-muted hover:bg-white/5"
                                                )}
                                            >
                                                {enabledAlgorithms.symmetric[algo.name as keyof typeof enabledAlgorithms.symmetric] ? (
                                                    <CheckSquare size={16} className="text-accent shrink-0" />
                                                ) : (
                                                    <Square size={16} className="shrink-0" />
                                                )}
                                                <span className="font-medium">{algo.name}</span>
                                                <span className="text-xs ml-auto">{algo.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Hash Algorithms */}
                                <div className="bg-black/20 rounded-xl border border-white/10 p-4">
                                    <h5 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                        <Hash size={14} className="text-primary" />
                                        Hash Algorithms
                                    </h5>
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { name: 'SHA-256', desc: 'FIPS 180-4' },
                                            { name: 'SHA-384', desc: 'FIPS 180-4' },
                                            { name: 'SHA3-256', desc: 'FIPS 202 (QR)' }
                                        ].map((algo) => (
                                            <button
                                                key={algo.name}
                                                onClick={() => toggleAlgorithm('hash', algo.name)}
                                                className={clsx(
                                                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all border text-left",
                                                    enabledAlgorithms.hash[algo.name as keyof typeof enabledAlgorithms.hash]
                                                        ? "bg-primary/10 border-primary/30 text-white"
                                                        : "bg-black/20 border-white/10 text-muted hover:bg-white/5"
                                                )}
                                            >
                                                {enabledAlgorithms.hash[algo.name as keyof typeof enabledAlgorithms.hash] ? (
                                                    <CheckSquare size={16} className="text-primary shrink-0" />
                                                ) : (
                                                    <Square size={16} className="shrink-0" />
                                                )}
                                                <span className="font-medium">{algo.name}</span>
                                                <span className="text-xs ml-auto">{algo.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
                                <Layers size={18} className="text-secondary" /> Quick Actions
                            </h4>
                            <div className="p-4 bg-black/20 rounded-xl border border-white/10">
                                <p className="text-sm text-muted mb-3">
                                    To generate keys and manage your cryptographic operations:
                                </p>
                                <button
                                    onClick={() => setActiveTab('keystore')}
                                    className="w-full btn-secondary flex items-center justify-center gap-2 h-10 text-sm"
                                >
                                    <KeyIcon size={16} />
                                    Go to Key Store
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab: Data Management */}
                {activeTab === 'data' && (
                    <div className="max-w-4xl mx-auto animate-fade-in">
                        <h4 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2 mb-6">
                            <Database size={18} className="text-accent" /> Data Management
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Signing Section */}
                            <div className="space-y-6">
                                <h5 className="text-sm font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                                    <FileSignature size={14} /> Signing & Verification
                                </h5>
                                <DataInput
                                    label="Data to Sign / Verify"
                                    value={dataToSign}
                                    onChange={setDataToSign}
                                    placeholder="Enter message to sign..."
                                />
                                <DataInput
                                    label="Signature"
                                    value={signature}
                                    onChange={setSignature}
                                    placeholder="Signature will appear here..."
                                    inputType="binary"
                                />
                            </div>

                            {/* Encryption Section */}
                            <div className="space-y-6">
                                <h5 className="text-sm font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                                    <Lock size={14} /> Encryption & Decryption
                                </h5>
                                <DataInput
                                    label="Data to Encrypt"
                                    value={dataToEncrypt}
                                    onChange={setDataToEncrypt}
                                    placeholder="Enter message to encrypt..."
                                />
                                <DataInput
                                    label="Decrypted Data"
                                    value={decryptedData}
                                    onChange={setDecryptedData}
                                    placeholder="Decrypted message will appear here..."
                                    readOnly={true}
                                />
                            </div>
                        </div>

                        {/* Shared Secret */}
                        <div className="mt-8 pt-6 border-t border-white/10">
                            <h5 className="text-sm font-bold text-muted uppercase tracking-wider flex items-center gap-2 mb-4">
                                <KeyIcon size={14} /> Shared Secret (ML-KEM)
                            </h5>
                            <DataInput
                                label="Established Shared Secret"
                                value={sharedSecret}
                                onChange={() => { }} // Read-only mostly, or we can allow edit if needed for testing
                                readOnly={true}
                                placeholder="Shared secret will appear here after encapsulation..."
                                height="h-16"
                                inputType="binary"
                            />
                        </div>
                    </div>
                )}

                {/* Tab: KEM (ML-KEM Only) */}
                {activeTab === 'kem' && (
                    <div className="max-w-4xl mx-auto animate-fade-in">
                        <h4 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2 mb-6">
                            <Activity size={18} className="text-accent" /> Key Encapsulation Mechanism
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Encapsulate */}
                            <div className="p-6 bg-black/20 rounded-xl border border-white/5 hover:border-blue-500/30 transition-colors group">
                                <div className="text-sm text-blue-300 mb-4 font-bold uppercase tracking-wider flex items-center gap-2">
                                    <Lock size={16} /> Encapsulate
                                </div>
                                <p className="text-xs text-muted mb-4 h-10">
                                    Generate a shared secret and encapsulate it for a public key.
                                </p>
                                <select
                                    value={selectedEncKeyId}
                                    onChange={(e) => setSelectedEncKeyId(e.target.value)}
                                    className="w-full mb-4 bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                                >
                                    <option value="">Select Public Key...</option>
                                    {kemPublicKeys.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                                </select>
                                <button
                                    onClick={() => { runOperation('encapsulate'); }}
                                    disabled={!selectedEncKeyId || loading}
                                    className="w-full py-3 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                                >
                                    Run Encapsulate
                                </button>
                            </div>

                            {/* Decapsulate */}
                            <div className="p-6 bg-black/20 rounded-xl border border-white/5 hover:border-purple-500/30 transition-colors group">
                                <div className="text-sm text-purple-300 mb-4 font-bold uppercase tracking-wider flex items-center gap-2">
                                    <KeyIcon size={16} /> Decapsulate
                                </div>
                                <p className="text-xs text-muted mb-4 h-10">
                                    Decapsulate a shared secret using a private key.
                                </p>
                                <select
                                    value={selectedDecKeyId}
                                    onChange={(e) => setSelectedDecKeyId(e.target.value)}
                                    className="w-full mb-4 bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500"
                                >
                                    <option value="">Select Private Key...</option>
                                    {kemPrivateKeys.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                                </select>
                                <button
                                    onClick={() => { runOperation('decapsulate'); }}
                                    disabled={!selectedDecKeyId || loading}
                                    className="w-full py-3 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                                >
                                    Run Decapsulate
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab: Encrypt (ML-KEM Only) */}
                {activeTab === 'encrypt' && (
                    <div className="max-w-4xl mx-auto animate-fade-in">
                        <h4 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2 mb-6">
                            <Lock size={18} className="text-accent" /> AES-GCM Encryption (Hybrid)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Encrypt Data */}
                            <div className="p-6 bg-black/20 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-colors group">
                                <div className="text-sm text-cyan-300 mb-4 font-bold uppercase tracking-wider flex items-center gap-2">
                                    <Lock size={16} /> Encrypt
                                </div>
                                <p className="text-xs text-muted mb-4 h-10">
                                    Encrypt the input message using the established shared secret.
                                </p>
                                <div className="mb-4 p-3 bg-black/40 rounded border border-white/5 text-xs text-muted">
                                    {sharedSecret ? 'Shared Secret Available' : 'No Shared Secret (Run Encapsulate first)'}
                                </div>
                                <button
                                    onClick={() => { runOperation('encrypt'); }}
                                    disabled={!sharedSecret || loading}
                                    className="w-full py-3 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                                >
                                    Encrypt Message
                                </button>
                            </div>

                            {/* Decrypt Data */}
                            <div className="p-6 bg-black/20 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-colors group">
                                <div className="text-sm text-emerald-300 mb-4 font-bold uppercase tracking-wider flex items-center gap-2">
                                    <KeyIcon size={16} /> Decrypt
                                </div>
                                <p className="text-xs text-muted mb-4 h-10">
                                    Decrypt the ciphertext using the established shared secret.
                                </p>
                                <div className="mb-4 p-3 bg-black/40 rounded border border-white/5 text-xs text-muted">
                                    {encryptedData ? 'Encrypted Data Available' : 'No Encrypted Data (Run Encrypt first)'}
                                </div>
                                <button
                                    onClick={() => { runOperation('decrypt'); }}
                                    disabled={!encryptedData || loading}
                                    className="w-full py-3 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                                >
                                    Decrypt Message
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab: Sign (ML-DSA Only) */}
                {activeTab === 'sign' && (
                    <div className="max-w-4xl mx-auto animate-fade-in">
                        <h4 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2 mb-6">
                            <FileSignature size={18} className="text-accent" /> Sign Message
                        </h4>
                        <div className="p-6 bg-black/20 rounded-xl border border-white/5 hover:border-green-500/30 transition-colors">
                            <div className="text-sm text-green-300 mb-4 font-bold uppercase tracking-wider flex items-center gap-2">
                                <FileSignature size={16} /> Sign Message
                            </div>
                            <div className="space-y-4 max-w-xl">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs text-muted font-bold uppercase tracking-wider">Select Private Key</label>
                                    <select
                                        value={selectedSignKeyId}
                                        onChange={(e) => setSelectedSignKeyId(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-green-500"
                                    >
                                        <option value="">Select Private Key...</option>
                                        {signPrivateKeys.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                                    </select>
                                </div>
                                <button
                                    onClick={() => { runOperation('sign'); }}
                                    disabled={!selectedSignKeyId || loading}
                                    className="w-full py-3 rounded-lg bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold flex items-center justify-center gap-2"
                                >
                                    <FileSignature size={18} /> Sign Message
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab: Verify (ML-DSA Only) */}
                {activeTab === 'verify' && (
                    <div className="max-w-4xl mx-auto animate-fade-in">
                        <h4 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2 mb-6">
                            <FileSignature size={18} className="text-accent" /> Verify Signature
                        </h4>
                        <div className="p-6 bg-black/20 rounded-xl border border-white/5 hover:border-amber-500/30 transition-colors max-w-xl">
                            <div className="text-sm text-amber-300 mb-4 font-bold uppercase tracking-wider flex items-center gap-2">
                                <FileSignature size={16} /> Verify Signature
                            </div>
                            <div className="space-y-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs text-muted font-bold uppercase tracking-wider">Select Public Key</label>
                                    <select
                                        value={selectedVerifyKeyId}
                                        onChange={(e) => setSelectedVerifyKeyId(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500"
                                    >
                                        <option value="">Select Public Key...</option>
                                        {signPublicKeys.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs text-muted font-bold uppercase tracking-wider">Signature to Verify</label>
                                    <textarea
                                        value={signature}
                                        onChange={(e) => setSignature(e.target.value)}
                                        placeholder="Paste signature here..."
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-amber-500 font-mono h-32 resize-none"
                                    />
                                </div>
                                <button
                                    onClick={() => { runOperation('verify'); }}
                                    disabled={!selectedVerifyKeyId || loading}
                                    className="w-full py-3 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold flex items-center justify-center gap-2"
                                >
                                    <FileSignature size={18} /> Verify Signature
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab: Key Store */}
                {activeTab === 'keystore' && (
                    <KeyStoreView
                        keyStore={keyStore}
                        setKeyStore={setKeyStore}
                        algorithm={algorithm}
                        keySize={keySize}
                        loading={loading}
                        onAlgorithmChange={handleAlgorithmChange}
                        onKeySizeChange={setKeySize}
                        onGenerateKeys={generateKeys}
                        onUnifiedChange={(algo, size) => {
                            setAlgorithm(algo);
                            setKeySize(size);
                        }}
                        classicalAlgorithm={classicalAlgorithm}
                        classicalLoading={classicalLoading}
                        onClassicalAlgorithmChange={(algo) => setClassicalAlgorithm(algo as ClassicalAlgorithm)}
                        onGenerateClassicalKeys={generateClassicalKeys}
                    />
                )}

                {/* Tab: Logs */}
                {activeTab === 'logs' && (
                    <div className="h-full flex flex-col animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                <FileText size={18} className="text-muted" /> Operation Log
                            </h4>
                            <button onClick={() => setLogs([])} className="text-xs text-muted hover:text-white transition-colors">
                                Clear Log
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden rounded-xl border border-white/10 bg-black/20 flex flex-col">
                            <div className="overflow-y-auto flex-1 custom-scrollbar">
                                <table className="w-full text-left text-sm" style={{ tableLayout: 'fixed' }}>
                                    <thead className="bg-white/5 text-muted uppercase text-xs sticky top-0 backdrop-blur-md select-none">
                                        <tr>
                                            <th
                                                className="p-4 font-bold cursor-pointer hover:bg-white/5 transition-colors relative group"
                                                style={{ width: columnWidths.timestamp }}
                                                onClick={() => handleSort('timestamp')}
                                            >
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    Timestamp
                                                    {sortColumn === 'timestamp' && (
                                                        sortDirection === 'asc' ? <ArrowUp size={14} className="text-primary shrink-0" /> : <ArrowDown size={14} className="text-primary shrink-0" />
                                                    )}
                                                    {sortColumn !== 'timestamp' && <ArrowUpDown size={14} className="opacity-30 shrink-0" />}
                                                </div>
                                                <div
                                                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50"
                                                    onMouseDown={(e) => startResize(e, 'timestamp')}
                                                />
                                            </th>
                                            <th
                                                className="p-4 font-bold cursor-pointer hover:bg-white/5 transition-colors relative group"
                                                style={{ width: columnWidths.keyLabel }}
                                                onClick={() => handleSort('keyLabel')}
                                            >
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    Key Label
                                                    {sortColumn === 'keyLabel' && (
                                                        sortDirection === 'asc' ? <ArrowUp size={14} className="text-primary shrink-0" /> : <ArrowDown size={14} className="text-primary shrink-0" />
                                                    )}
                                                    {sortColumn !== 'keyLabel' && <ArrowUpDown size={14} className="opacity-30 shrink-0" />}
                                                </div>
                                                <div
                                                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50"
                                                    onMouseDown={(e) => startResize(e, 'keyLabel')}
                                                />
                                            </th>
                                            <th
                                                className="p-4 font-bold cursor-pointer hover:bg-white/5 transition-colors relative group"
                                                style={{ width: columnWidths.operation }}
                                                onClick={() => handleSort('operation')}
                                            >
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    Operation
                                                    {sortColumn === 'operation' && (
                                                        sortDirection === 'asc' ? <ArrowUp size={14} className="text-primary shrink-0" /> : <ArrowDown size={14} className="text-primary shrink-0" />
                                                    )}
                                                    {sortColumn !== 'operation' && <ArrowUpDown size={14} className="opacity-30 shrink-0" />}
                                                </div>
                                                <div
                                                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50"
                                                    onMouseDown={(e) => startResize(e, 'operation')}
                                                />
                                            </th>
                                            <th
                                                className="p-4 font-bold cursor-pointer hover:bg-white/5 transition-colors relative group"
                                                style={{ width: columnWidths.result }}
                                                onClick={() => handleSort('result')}
                                            >
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    Results
                                                    {sortColumn === 'result' && (
                                                        sortDirection === 'asc' ? <ArrowUp size={14} className="text-primary shrink-0" /> : <ArrowDown size={14} className="text-primary shrink-0" />
                                                    )}
                                                    {sortColumn !== 'result' && <ArrowUpDown size={14} className="opacity-30 shrink-0" />}
                                                </div>
                                                <div
                                                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50"
                                                    onMouseDown={(e) => startResize(e, 'result')}
                                                />
                                            </th>
                                            <th
                                                className="p-4 font-bold cursor-pointer hover:bg-white/5 transition-colors text-right relative group"
                                                style={{ width: columnWidths.executionTime }}
                                                onClick={() => handleSort('executionTime')}
                                            >
                                                <div className="flex items-center justify-end gap-2 overflow-hidden">
                                                    Execution Time
                                                    {sortColumn === 'executionTime' && (
                                                        sortDirection === 'asc' ? <ArrowUp size={14} className="text-primary shrink-0" /> : <ArrowDown size={14} className="text-primary shrink-0" />
                                                    )}
                                                    {sortColumn !== 'executionTime' && <ArrowUpDown size={14} className="opacity-30 shrink-0" />}
                                                </div>
                                                <div
                                                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50"
                                                    onMouseDown={(e) => startResize(e, 'executionTime')}
                                                />
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {sortedLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="p-12 text-center text-white/30 italic">
                                                    No operations performed yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            sortedLogs.map(log => (
                                                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="p-4 font-mono text-xs text-muted whitespace-nowrap overflow-hidden text-ellipsis">{log.timestamp}</td>
                                                    <td className="p-4 font-medium text-white overflow-hidden text-ellipsis">{log.keyLabel}</td>
                                                    <td className="p-4 text-accent overflow-hidden text-ellipsis">{log.operation}</td>
                                                    <td className="p-4 text-sm text-muted overflow-hidden text-ellipsis" title={log.result}>{log.result}</td>
                                                    <td className={clsx("p-4 text-right font-mono text-xs font-bold overflow-hidden text-ellipsis", getPerformanceColor(log.executionTime))}>
                                                        {log.executionTime.toFixed(2)} ms
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}


            </div>

            {
                error && (
                    <div
                        id="playground-error"
                        role="alert"
                        className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm shrink-0"
                    >
                        <AlertCircle size={20} aria-hidden="true" />
                        <span className="font-medium">{error}</span>
                    </div>
                )
            }
        </div >
    );
};

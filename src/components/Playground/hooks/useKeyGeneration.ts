import { useState } from 'react';
import type { Key, LogEntry } from '../../../types';
import * as MLKEM from '../../../wasm/liboqs_kem';
import * as MLDSA from '../../../wasm/liboqs_dsa';
import * as WebCrypto from '../../../utils/webCrypto';
import { bytesToHex } from '../../../utils/dataInputUtils';
import type { ExecutionMode, ClassicalAlgorithm } from '../PlaygroundContext';

interface UseKeyGenerationProps {
    algorithm: 'ML-KEM' | 'ML-DSA';
    keySize: string;
    executionMode: ExecutionMode;
    wasmLoaded: boolean;
    classicalAlgorithm: ClassicalAlgorithm;
    setKeyStore: React.Dispatch<React.SetStateAction<Key[]>>;
    setSelectedEncKeyId: (id: string) => void;
    setSelectedDecKeyId: (id: string) => void;
    setSelectedSignKeyId: (id: string) => void;
    setSelectedVerifyKeyId: (id: string) => void;
    addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useKeyGeneration = ({
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
}: UseKeyGenerationProps) => {
    const [classicalLoading, setClassicalLoading] = useState(false);

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

    return {
        generateKeys,
        generateClassicalKeys,
        classicalLoading
    };
};

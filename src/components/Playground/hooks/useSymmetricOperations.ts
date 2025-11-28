import type { Key, LogEntry } from '../../../types';
import * as WebCrypto from '../../../utils/webCrypto';
import { bytesToHex, hexToBytes } from '../DataInput';
import type { ExecutionMode } from '../PlaygroundContext';

interface UseSymmetricOperationsProps {
    keyStore: Key[];
    selectedSymKeyId: string;
    executionMode: ExecutionMode;
    symData: string;
    symOutput: string;
    sharedSecret: string;
    dataToEncrypt: string;
    encryptedData: string;
    setSymData: (val: string) => void;
    setSymOutput: (val: string) => void;
    setEncryptedData: (val: string) => void;
    setDecryptedData: (val: string) => void;
    addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useSymmetricOperations = ({
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
}: UseSymmetricOperationsProps) => {

    const runSymmetricOperation = async (type: 'encrypt' | 'decrypt' | 'symEncrypt' | 'symDecrypt') => {
        setLoading(true);
        setError(null);
        const start = performance.now();

        try {
            // 1. Identify the key involved (if any)
            let selectedKey: Key | undefined;
            if (type === 'symEncrypt' || type === 'symDecrypt') selectedKey = keyStore.find(k => k.id === selectedSymKeyId);

            // 2. Check if Classical Algorithm (AES)
            const isClassical = selectedKey && selectedKey.algorithm.startsWith('AES');

            if (isClassical && selectedKey) {
                // --- CLASSICAL OPERATIONS (Web Crypto) ---
                if (type === 'symEncrypt') {
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
                }
            } else if (executionMode === 'wasm') {
                // WASM Mode Operations (Hybrid Encryption using Shared Secret)
                if (type === 'encrypt') {
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
            } else {
                // Mock Mode Operations
                await new Promise(resolve => setTimeout(resolve, 500));
                const end = performance.now();

                if (type === 'encrypt') {
                    if (!sharedSecret) throw new Error("No shared secret available. Run Encapsulate first.");
                    if (!dataToEncrypt) throw new Error("Please enter a message to encrypt.");

                    const encrypted = 'mock_encrypted_' + btoa(dataToEncrypt);
                    setEncryptedData(encrypted);

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

                    addLog({
                        keyLabel: 'Shared Secret',
                        operation: 'Decrypt (Mock)',
                        result: 'Message Decrypted',
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

    return { runSymmetricOperation };
};

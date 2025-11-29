import type { Key, LogEntry } from '../../../types';
import * as MLKEM from '../../../wasm/liboqs_kem';
import * as WebCrypto from '../../../utils/webCrypto';
import { bytesToHex, hexToBytes } from '../../../utils/dataInputUtils';
import type { ExecutionMode } from '../PlaygroundContext';

interface UseKemOperationsProps {
    keyStore: Key[];
    selectedEncKeyId: string;
    selectedDecKeyId: string;
    executionMode: ExecutionMode;
    wasmLoaded: boolean;
    keySize: string;
    sharedSecret: string;
    ciphertext: string;
    setSharedSecret: (val: string) => void;
    setCiphertext: (val: string) => void;
    setKemDecapsulationResult: (val: boolean | null) => void;
    addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useKemOperations = ({
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
}: UseKemOperationsProps) => {

    const runKemOperation = async (type: 'encapsulate' | 'decapsulate') => {
        setLoading(true);
        setError(null);
        const start = performance.now();

        try {
            // 1. Identify the key involved
            let selectedKey: Key | undefined;
            if (type === 'encapsulate') selectedKey = keyStore.find(k => k.id === selectedEncKeyId);
            else if (type === 'decapsulate') selectedKey = keyStore.find(k => k.id === selectedDecKeyId);

            // 2. Check if Classical Algorithm
            const isClassical = selectedKey && (
                selectedKey.algorithm === 'X25519' ||
                selectedKey.algorithm === 'P-256'
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
                    setKemDecapsulationResult(matches);
                    addLog({
                        keyLabel: selectedKey.name,
                        operation: `Decapsulate (${selectedKey.algorithm})`,
                        result: matches ? '✓ Secret Recovered (Match)' : '✗ Mismatch',
                        executionTime: end - start
                    });
                }
            } else if (executionMode === 'wasm') {
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
                    setKemDecapsulationResult(matches);

                    addLog({
                        keyLabel: key.name,
                        operation: 'Decapsulate (WASM)',
                        result: matches ? '✓ Secret Recovered (Match)' : '✗ Mismatch',
                        executionTime: end - start
                    });
                }
            } else {
                // Mock Mode Operations
                await new Promise(resolve => setTimeout(resolve, 500));
                const end = performance.now();

                if (type === 'encapsulate') {
                    const key = keyStore.find(k => k.id === selectedEncKeyId);
                    if (!key) throw new Error("Please select a Public Key");

                    const newSharedSecret = Math.random().toString(36).substring(2).toUpperCase();
                    const newCiphertext = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
                    setSharedSecret(newSharedSecret);
                    setCiphertext(newCiphertext);

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

                    setKemDecapsulationResult(true);

                    addLog({
                        keyLabel: key.name,
                        operation: 'Decapsulate (Mock)',
                        result: 'Secret Recovered (Simulated)',
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

    return { runKemOperation };
};

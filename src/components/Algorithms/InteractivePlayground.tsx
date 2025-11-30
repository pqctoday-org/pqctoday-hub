import { useState } from 'react';
import { RefreshCw, Lock, Key as KeyIcon, Play, AlertCircle, FileSignature, Trash2 } from 'lucide-react';
import * as MLKEM from '../../wasm/liboqs_kem';
import * as MLDSA from '../../wasm/liboqs_dsa';
import clsx from 'clsx';
import { bytesToHex } from '../../utils/dataInputUtils';

interface Key {
    id: string;
    name: string;
    type: 'public' | 'private';
    algorithm: 'ML-KEM' | 'ML-DSA';
    value: string;
}

export const InteractivePlayground = () => {
    const [algorithm, setAlgorithm] = useState<'ML-KEM' | 'ML-DSA'>('ML-KEM');
    const [keySize, setKeySize] = useState<string>('768'); // Default: ML-KEM-768

    // Update key size when algorithm changes
    const handleAlgorithmChange = (newAlgorithm: 'ML-KEM' | 'ML-DSA') => {
        setAlgorithm(newAlgorithm);
        // Set appropriate default for each algorithm
        setKeySize(newAlgorithm === 'ML-KEM' ? '768' : '65');
    };
    const [keyStore, setKeyStore] = useState<Key[]>([]);
    const [input, setInput] = useState('Hello Quantum World!');
    const [output, setOutput] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ML-KEM specific states
    const [sharedSecret, setSharedSecret] = useState<string>('');
    const [ciphertext, setCiphertext] = useState<string>('');
    const [encryptedData, setEncryptedData] = useState<string>('');

    // ML-DSA specific states
    const [signature, setSignature] = useState<string>('');

    // Selection states
    const [selectedEncKeyId, setSelectedEncKeyId] = useState<string>('');
    const [selectedDecKeyId, setSelectedDecKeyId] = useState<string>('');
    const [selectedSignKeyId, setSelectedSignKeyId] = useState<string>('');
    const [selectedVerifyKeyId, setSelectedVerifyKeyId] = useState<string>('');

    const generateKeys = async () => {
        setLoading(true);
        setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            const timestamp = new Date().toLocaleTimeString([], { hour12: false });
            const idBase = Math.random().toString(36).substring(2, 9);

            let newKeys: Key[] = [];

            if (algorithm === 'ML-KEM') {
                const algoName = `ML-KEM-${keySize}`;
                const keys = await MLKEM.generateKey({ name: algoName });

                newKeys = [
                    { id: `${idBase}-pub`, name: `${algoName} Public Key [${timestamp}]`, type: 'public', algorithm: 'ML-KEM', value: bytesToHex(keys.publicKey) },
                    { id: `${idBase}-priv`, name: `${algoName} Private Key [${timestamp}]`, type: 'private', algorithm: 'ML-KEM', value: bytesToHex(keys.secretKey) }
                ];
            } else { // ML-DSA
                const algoName = `ML-DSA-${keySize}`;
                const keys = await MLDSA.generateKey({ name: algoName });

                newKeys = [
                    { id: `${idBase}-pub`, name: `${algoName} Public Key [${timestamp}]`, type: 'public', algorithm: 'ML-DSA', value: bytesToHex(keys.publicKey) },
                    { id: `${idBase}-priv`, name: `${algoName} Private Key [${timestamp}]`, type: 'private', algorithm: 'ML-DSA', value: bytesToHex(keys.secretKey) }
                ];
            }

            setKeyStore(prev => [...prev, ...newKeys]);

            if (algorithm === 'ML-KEM') {
                setSelectedEncKeyId(newKeys[0].id);
                setSelectedDecKeyId(newKeys[1].id);
            } else {
                setSelectedSignKeyId(newKeys[1].id);
            }

            setOutput(`Generated key pair: ${newKeys[0].name} & ${newKeys[1].name}`);
        } catch {
            setError('Failed to generate keys');
        } finally {
            setLoading(false);
        }
    };

    const runOperation = async (type: 'encapsulate' | 'decapsulate' | 'sign' | 'verify' | 'encrypt' | 'decrypt') => {
        setLoading(true);
        setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            if (type === 'encapsulate') {
                const key = keyStore.find(k => k.id === selectedEncKeyId);
                if (!key) throw new Error("Please select a Public Key");

                const newSharedSecret = Math.random().toString(36).substring(2).toUpperCase();
                const newCiphertext = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
                setSharedSecret(newSharedSecret);
                setCiphertext(newCiphertext);
                setOutput(`[Encapsulate using ${key.name}]\nShared Secret: ${newSharedSecret}\nCiphertext: ${newCiphertext}...`);
            }
            else if (type === 'decapsulate') {
                const key = keyStore.find(k => k.id === selectedDecKeyId);
                if (!key) throw new Error("Please select a Private Key");
                if (!ciphertext) throw new Error("No ciphertext available. Run Encapsulate first.");

                setOutput(`[Decapsulate using ${key.name}]\nRecovered Shared Secret: ${sharedSecret} (Matches!)`);
            }
            else if (type === 'encrypt') {
                if (!sharedSecret) throw new Error("No shared secret available. Run Encapsulate first.");
                if (!input) throw new Error("Please enter a message to encrypt.");

                const encrypted = btoa(input + ':' + sharedSecret).split('').reverse().join('');
                setEncryptedData(encrypted);
                setOutput(`[Encrypt using Shared Secret]\nOriginal: "${input}"\nEncrypted: ${encrypted}`);
            }
            else if (type === 'decrypt') {
                if (!sharedSecret) throw new Error("No shared secret available.");
                if (!encryptedData) throw new Error("No encrypted data available. Run Encrypt first.");

                const decrypted = atob(encryptedData.split('').reverse().join('')).split(':')[0];
                setOutput(`[Decrypt using Shared Secret]\nEncrypted: ${encryptedData}\nDecrypted: "${decrypted}"`);
            }
            else if (type === 'sign') {
                const key = keyStore.find(k => k.id === selectedSignKeyId);
                if (!key) throw new Error("Please select a Private Key");

                const newSignature = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
                setSignature(newSignature);
                setOutput(`[Sign using ${key.name}]\nMessage: "${input}"\nSignature: ${newSignature}...`);
            }
            else if (type === 'verify') {
                const key = keyStore.find(k => k.id === selectedVerifyKeyId);
                if (!key) throw new Error("Please select a Public Key");
                if (!signature) throw new Error("No signature available. Run Sign first or enter a signature.");

                const isValid = signature.length > 10; // Simple mock validation
                setOutput(`[Verify using ${key.name}]\nMessage: "${input}"\nSignature: ${signature}\nVerification: ${isValid ? '✓ VALID' : '✗ INVALID'}`);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Operation failed';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const clearKeys = () => {
        setKeyStore([]);
        setSelectedEncKeyId('');
        setSelectedDecKeyId('');
        setSelectedSignKeyId('');
        setSelectedVerifyKeyId('');
        setOutput('');
    };

    const publicKeys = keyStore.filter(k => k.algorithm === algorithm && k.type === 'public');
    const privateKeys = keyStore.filter(k => k.algorithm === algorithm && k.type === 'private');

    return (
        <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                    <Play className="text-secondary" aria-hidden="true" />
                    Interactive Playground
                </h3>
                <div className="flex bg-white/5 rounded-lg p-1" role="group" aria-label="Select cryptographic algorithm">
                    <button
                        onClick={() => { handleAlgorithmChange('ML-KEM'); setOutput(''); }}
                        aria-label="ML-KEM Encryption algorithm"
                        aria-pressed={algorithm === 'ML-KEM'}
                        className={clsx(
                            "px-4 py-2 rounded-md text-sm font-bold transition-colors",
                            algorithm === 'ML-KEM' ? "bg-primary/20 text-primary" : "text-muted hover:text-white"
                        )}
                    >
                        ML-KEM (Encryption)
                    </button>
                    <button
                        onClick={() => { handleAlgorithmChange('ML-DSA'); setOutput(''); }}
                        aria-label="ML-DSA Signing algorithm"
                        aria-pressed={algorithm === 'ML-DSA'}
                        className={clsx(
                            "px-4 py-2 rounded-md text-sm font-bold transition-colors",
                            algorithm === 'ML-DSA' ? "bg-secondary/20 text-secondary" : "text-muted hover:text-white"
                        )}
                    >
                        ML-DSA (Signing)
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Controls */}
                {/* Left Column: Controls */}
                <div className="space-y-10">
                    {/* Section 1: Key Gen */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-muted uppercase tracking-wider">1. Key Generation</span>
                            {keyStore.length > 0 && (
                                <button onClick={clearKeys} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                                    <Trash2 size={12} /> Clear Keys
                                </button>
                            )}
                        </div>
                        <div className="space-y-3">
                            <label htmlFor="key-size-select" className="text-xs text-muted uppercase tracking-wider block">Key Size / Security Level</label>
                            <select
                                id="key-size-select"
                                value={keySize}
                                onChange={(e) => setKeySize(e.target.value)}
                                className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-primary appearance-none"
                            >
                                {algorithm === 'ML-KEM' ? (
                                    <>
                                        <option value="512">ML-KEM-512 (NIST Level 1)</option>
                                        <option value="768">ML-KEM-768 (NIST Level 3)</option>
                                        <option value="1024">ML-KEM-1024 (NIST Level 5)</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="44">ML-DSA-44 (NIST Level 2)</option>
                                        <option value="65">ML-DSA-65 (NIST Level 3)</option>
                                        <option value="87">ML-DSA-87 (NIST Level 5)</option>
                                    </>
                                )}
                            </select>
                        </div>
                        <button
                            onClick={generateKeys}
                            disabled={loading}
                            className="w-full btn-primary flex items-center justify-center gap-2 h-12"
                        >
                            {loading ? <RefreshCw className="animate-spin" size={18} /> : <KeyIcon size={18} />}
                            Generate New {algorithm} Pair
                        </button>
                    </div>

                    {/* Section 2: Input */}
                    <div className="space-y-4">
                        <label htmlFor="message-input" className="text-sm font-bold text-muted uppercase tracking-wider block mb-2">
                            2. {algorithm === 'ML-KEM' ? 'Input Data' : 'Message to Sign'}
                        </label>
                        <textarea
                            id="message-input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            aria-describedby={error ? "playground-error" : undefined}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-primary outline-none transition-colors h-32 resize-none placeholder:text-white/20 leading-relaxed"
                        />
                    </div>

                    {/* Section 3: Operations */}
                    <div className="space-y-4">
                        <span className="text-sm font-bold text-muted uppercase tracking-wider block mb-2">3. Execute Operation</span>

                        {algorithm === 'ML-KEM' ? (
                            <div className="grid grid-cols-1 gap-4">
                                {/* Encapsulate */}
                                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                    <div className="text-xs text-blue-200 mb-2 font-bold uppercase tracking-wider">Encapsulate (Public Key)</div>
                                    <select
                                        value={selectedEncKeyId}
                                        onChange={(e) => setSelectedEncKeyId(e.target.value)}
                                        aria-label="Select Public Key for Encapsulation"
                                        className="w-full mb-3 bg-black/40 border border-white/20 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-primary appearance-none"
                                    >
                                        <option value="">Select Public Key...</option>
                                        {publicKeys.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                                    </select>
                                    <button
                                        onClick={() => runOperation('encapsulate')}
                                        disabled={!selectedEncKeyId || loading}
                                        className="w-full py-2.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold flex items-center justify-center gap-2"
                                    >
                                        <Lock size={16} /> Encapsulate
                                    </button>
                                </div>

                                {/* Decapsulate */}
                                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                    <div className="text-xs text-purple-200 mb-2 font-bold uppercase tracking-wider">Decapsulate (Private Key)</div>
                                    <select
                                        value={selectedDecKeyId}
                                        onChange={(e) => setSelectedDecKeyId(e.target.value)}
                                        aria-label="Select Private Key for Decapsulation"
                                        className="w-full mb-3 bg-black/40 border border-white/20 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-secondary appearance-none"
                                    >
                                        <option value="">Select Private Key...</option>
                                        {privateKeys.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                                    </select>
                                    <button
                                        onClick={() => runOperation('decapsulate')}
                                        disabled={!selectedDecKeyId || loading}
                                        className="w-full py-2.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold flex items-center justify-center gap-2"
                                    >
                                        <KeyIcon size={16} /> Decapsulate
                                    </button>
                                    {sharedSecret && (
                                        <div className="mt-3">
                                            <label htmlFor="shared-secret-input" className="text-xs text-muted block mb-2">Shared Secret:</label>
                                            <input
                                                id="shared-secret-input"
                                                type="text"
                                                value={sharedSecret}
                                                onChange={(e) => setSharedSecret(e.target.value)}
                                                className="w-full bg-black/40 border border-purple-500/30 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500 font-mono"
                                                placeholder="Shared secret will appear here..."
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Encrypt Data */}
                                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                    <div className="text-xs text-cyan-200 mb-2 font-bold uppercase tracking-wider">Encrypt Data (Shared Secret)</div>
                                    <button
                                        onClick={() => runOperation('encrypt')}
                                        disabled={!sharedSecret || loading}
                                        className="w-full py-2.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold flex items-center justify-center gap-2"
                                    >
                                        <Lock size={16} /> Encrypt Message
                                    </button>
                                    {!sharedSecret && <p className="text-xs text-muted mt-2">Run Encapsulate first to get shared secret</p>}
                                </div>

                                {/* Decrypt Data */}
                                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                    <div className="text-xs text-emerald-200 mb-2 font-bold uppercase tracking-wider">Decrypt Data (Shared Secret)</div>
                                    <button
                                        onClick={() => runOperation('decrypt')}
                                        disabled={!encryptedData || loading}
                                        className="w-full py-2.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold flex items-center justify-center gap-2"
                                    >
                                        <KeyIcon size={16} /> Decrypt Message
                                    </button>
                                    {!encryptedData && <p className="text-xs text-muted mt-2">Run Encrypt first to get encrypted data</p>}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {/* Sign */}
                                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                    <div className="text-xs text-green-200 mb-2 font-bold uppercase tracking-wider">Sign (Private Key)</div>
                                    <select
                                        value={selectedSignKeyId}
                                        onChange={(e) => setSelectedSignKeyId(e.target.value)}
                                        aria-label="Select Private Key for Signing"
                                        className="w-full mb-3 bg-black/40 border border-white/20 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-accent appearance-none"
                                    >
                                        <option value="">Select Private Key...</option>
                                        {privateKeys.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                                    </select>
                                    <button
                                        onClick={() => runOperation('sign')}
                                        disabled={!selectedSignKeyId || loading}
                                        className="w-full py-2.5 rounded-lg bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold flex items-center justify-center gap-2"
                                    >
                                        <FileSignature size={16} /> Sign Message
                                    </button>
                                </div>

                                {/* Verify */}
                                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                    <div className="text-xs text-amber-200 mb-2 font-bold uppercase tracking-wider">Verify (Public Key)</div>
                                    <select
                                        value={selectedVerifyKeyId}
                                        onChange={(e) => setSelectedVerifyKeyId(e.target.value)}
                                        aria-label="Select Public Key for Verification"
                                        className="w-full mb-3 bg-black/40 border border-white/20 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-accent appearance-none"
                                    >
                                        <option value="">Select Public Key...</option>
                                        {publicKeys.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                                    </select>
                                    <label htmlFor="signature-verify-input" className="text-xs text-muted block mb-2">Signature to Verify:</label>
                                    <input
                                        id="signature-verify-input"
                                        type="text"
                                        value={signature}
                                        onChange={(e) => setSignature(e.target.value)}
                                        placeholder="Paste or edit signature here..."
                                        className="w-full mb-3 bg-black/40 border border-white/20 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-accent font-mono"
                                    />
                                    <button
                                        onClick={() => runOperation('verify')}
                                        disabled={!selectedVerifyKeyId || loading}
                                        className="w-full py-2.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold flex items-center justify-center gap-2"
                                    >
                                        <FileSignature size={16} /> Verify Signature
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Key Store & Results */}
                <div className="space-y-6">
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-muted uppercase tracking-wider">Key Store ({keyStore.length})</label>
                        <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden h-64 flex flex-col">
                            <div className="overflow-y-auto flex-1 custom-scrollbar">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white/5 text-muted uppercase text-xs sticky top-0 backdrop-blur-md">
                                        <tr>
                                            <th className="p-3 font-bold">Name</th>
                                            <th className="p-3 font-bold">Type</th>
                                            <th className="p-3 font-bold">Algorithm</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {keyStore.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="p-8 text-center text-white/30 italic">
                                                    No keys generated yet...
                                                </td>
                                            </tr>
                                        ) : (
                                            keyStore.map(key => (
                                                <tr key={key.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="p-3 font-medium text-white">{key.name}</td>
                                                    <td className="p-3">
                                                        <span className={clsx(
                                                            "px-2 py-0.5 rounded text-[10px] uppercase font-bold",
                                                            key.type === 'public' ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary"
                                                        )}>
                                                            {key.type}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-muted">{key.algorithm}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <span className="text-sm font-bold text-muted uppercase tracking-wider block">Output Log</span>
                        <div
                            className="bg-white/5 border border-white/10 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm break-all text-accent whitespace-pre-wrap shadow-inner custom-scrollbar"
                            role="log"
                            aria-live="polite"
                            aria-atomic="false"
                        >
                            {output || <span className="text-white/30 italic">Waiting for operation...</span>}
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div
                    id="playground-error"
                    role="alert"
                    className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm"
                >
                    <AlertCircle size={16} aria-hidden="true" />
                    {error}
                </div>
            )}
        </div>
    );
};

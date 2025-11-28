import React, { useState } from 'react';
import { FileSignature, CheckCircle, XCircle } from 'lucide-react';
import { usePlaygroundContext } from '../PlaygroundContext';

// Helper for Hex/ASCII toggle with editing
const EditableDataDisplay: React.FC<{
    label: string;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    readOnly?: boolean;
}> = ({ label, value, onChange, placeholder, readOnly }) => {
    const [viewMode, setViewMode] = useState<'hex' | 'ascii'>('ascii'); // Default to ASCII for messages usually

    const getDisplayValue = () => {
        if (!value) return '';
        if (viewMode === 'hex') return value;
        try {
            let str = '';
            for (let i = 0; i < value.length; i += 2) {
                str += String.fromCharCode(parseInt(value.substr(i, 2), 16));
            }
            return str;
        } catch {
            return 'Invalid encoding for ASCII display';
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const input = e.target.value;
        if (viewMode === 'hex') {
            // Only allow hex characters
            if (/^[0-9a-fA-F]*$/.test(input)) {
                onChange(input);
            }
        } else {
            // Convert ASCII input to Hex for storage
            let hex = '';
            for (let i = 0; i < input.length; i++) {
                hex += input.charCodeAt(i).toString(16).padStart(2, '0');
            }
            onChange(hex);
        }
    };

    return (
        <div className="mb-4 p-3 bg-black/40 rounded border border-white/10 text-xs space-y-1 animate-fade-in focus-within:border-blue-500/50 transition-colors">
            <div className="flex justify-between items-center mb-2">
                <span className="text-muted font-bold uppercase tracking-wider">{label}</span>
                <button
                    onClick={() => setViewMode(prev => prev === 'hex' ? 'ascii' : 'hex')}
                    className="text-[10px] flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition-colors text-blue-300"
                >
                    {viewMode === 'hex' ? 'HEX' : 'ASCII'}
                </button>
            </div>
            {readOnly ? (
                <div className="font-mono text-white break-all max-h-24 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                    {getDisplayValue() || placeholder || 'None'}
                </div>
            ) : (
                <textarea
                    value={getDisplayValue()}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="w-full bg-transparent border-none text-white font-mono text-xs resize-y min-h-[80px] focus:ring-0 p-0 placeholder:text-white/20 outline-none"
                    spellCheck={false}
                />
            )}
        </div>
    );
};

export const SignVerifyTab: React.FC = () => {
    const {
        keyStore,
        selectedSignKeyId,
        setSelectedSignKeyId,
        selectedVerifyKeyId,
        setSelectedVerifyKeyId,
        runOperation,
        loading,
        signature,
        setSignature,
        dataToSign,
        setDataToSign,
        verificationResult
    } = usePlaygroundContext();

    const isSign = (algo: string) => algo.startsWith('ML-DSA') || algo.startsWith('RSA') || algo.startsWith('ECDSA') || algo === 'Ed25519';
    const signPrivateKeys = keyStore.filter(k => k.type === 'private' && isSign(k.algorithm));
    const signPublicKeys = keyStore.filter(k => k.type === 'public' && isSign(k.algorithm));

    // Helper to handle dataToSign change (stored as plain string in context, but EditableDataDisplay expects Hex for consistency if we want unified component)
    // Wait, dataToSign is stored as a string (e.g. "Hello").
    // But EditableDataDisplay expects value to be HEX if viewMode is HEX.
    // Let's adapt EditableDataDisplay or wrap the state.

    // Actually, let's make EditableDataDisplay handle "Text" vs "Hex" storage.
    // But for simplicity, let's assume we convert everything to Hex for the `EditableDataDisplay` prop, and convert back.

    const messageHex = (() => {
        let hex = '';
        for (let i = 0; i < dataToSign.length; i++) {
            hex += dataToSign.charCodeAt(i).toString(16).padStart(2, '0');
        }
        return hex;
    })();

    const handleMessageChange = (newHex: string) => {
        // Convert hex back to string for context
        let str = '';
        for (let i = 0; i < newHex.length; i += 2) {
            str += String.fromCharCode(parseInt(newHex.substr(i, 2), 16));
        }
        setDataToSign(str);
    };

    return (
        <div className="max-w-6xl mx-auto animate-fade-in space-y-8">
            <div>
                <h4 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2 mb-6">
                    <FileSignature size={18} className="text-accent" /> Digital Signatures
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sign */}
                    <div className="p-6 bg-black/20 rounded-xl border border-white/5 hover:border-green-500/30 transition-colors group flex flex-col">
                        <div className="text-sm text-green-300 mb-4 font-bold uppercase tracking-wider flex items-center gap-2">
                            <FileSignature size={16} /> Sign Message
                        </div>

                        <select
                            value={selectedSignKeyId}
                            onChange={(e) => setSelectedSignKeyId(e.target.value)}
                            className="w-full mb-4 bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-green-500"
                        >
                            <option value="">Select Private Key...</option>
                            {signPrivateKeys.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                        </select>

                        {selectedSignKeyId && (() => {
                            const key = keyStore.find(k => k.id === selectedSignKeyId);
                            if (!key) return null;
                            let scheme = 'Unknown';
                            let hash = 'Unknown';

                            if (key.algorithm.startsWith('ML-DSA')) {
                                scheme = 'Pure ML-DSA';
                                hash = 'SHAKE-256';
                            } else if (key.algorithm.startsWith('RSA')) {
                                scheme = 'RSA-PSS';
                                hash = 'SHA-256';
                            } else if (key.algorithm.startsWith('ECDSA')) {
                                scheme = 'ECDSA';
                                hash = 'SHA-256';
                            } else if (key.algorithm === 'Ed25519') {
                                scheme = 'EdDSA';
                                hash = 'SHA-512';
                            }

                            return (
                                <div className="mb-4 p-3 bg-white/5 rounded border border-white/10 text-xs text-muted space-y-1">
                                    <div className="flex justify-between">
                                        <span>Algorithm:</span>
                                        <span className="text-white font-mono">{key.algorithm}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Scheme:</span>
                                        <span className="text-white font-mono">{scheme}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Hash Function:</span>
                                        <span className="text-white font-mono">{hash}</span>
                                    </div>
                                </div>
                            );
                        })()}

                        <EditableDataDisplay
                            label="Message to Sign (Input)"
                            value={messageHex}
                            onChange={handleMessageChange}
                            placeholder="Enter message to sign..."
                        />

                        <EditableDataDisplay
                            label="Signature (Output)"
                            value={signature}
                            onChange={setSignature}
                            placeholder="Run Sign to generate..."
                        />

                        <div className="mt-auto pt-4">
                            <button
                                onClick={() => { runOperation('sign'); }}
                                disabled={!selectedSignKeyId || loading}
                                className="w-full py-3 rounded-lg bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                            >
                                Sign Message
                            </button>
                        </div>
                    </div>

                    {/* Verify */}
                    <div className="p-6 bg-black/20 rounded-xl border border-white/5 hover:border-orange-500/30 transition-colors group flex flex-col">
                        <div className="text-sm text-orange-300 mb-4 font-bold uppercase tracking-wider flex items-center gap-2">
                            <FileSignature size={16} /> Verify Signature
                        </div>

                        <select
                            value={selectedVerifyKeyId}
                            onChange={(e) => setSelectedVerifyKeyId(e.target.value)}
                            className="w-full mb-4 bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-orange-500"
                        >
                            <option value="">Select Public Key...</option>
                            {signPublicKeys.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                        </select>

                        {selectedVerifyKeyId && (() => {
                            const key = keyStore.find(k => k.id === selectedVerifyKeyId);
                            if (!key) return null;
                            let scheme = 'Unknown';
                            let hash = 'Unknown';

                            if (key.algorithm.startsWith('ML-DSA')) {
                                scheme = 'Pure ML-DSA';
                                hash = 'SHAKE-256';
                            } else if (key.algorithm.startsWith('RSA')) {
                                scheme = 'RSA-PSS';
                                hash = 'SHA-256';
                            } else if (key.algorithm.startsWith('ECDSA')) {
                                scheme = 'ECDSA';
                                hash = 'SHA-256';
                            } else if (key.algorithm === 'Ed25519') {
                                scheme = 'EdDSA';
                                hash = 'SHA-512';
                            }

                            return (
                                <div className="mb-4 p-3 bg-white/5 rounded border border-white/10 text-xs text-muted space-y-1">
                                    <div className="flex justify-between">
                                        <span>Algorithm:</span>
                                        <span className="text-white font-mono">{key.algorithm}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Scheme:</span>
                                        <span className="text-white font-mono">{scheme}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Hash Function:</span>
                                        <span className="text-white font-mono">{hash}</span>
                                    </div>
                                </div>
                            );
                        })()}

                        <EditableDataDisplay
                            label="Message to Verify (Input)"
                            value={messageHex}
                            onChange={handleMessageChange}
                            placeholder="Enter message to verify..."
                        />

                        <EditableDataDisplay
                            label="Signature (Input)"
                            value={signature}
                            onChange={setSignature}
                            placeholder="No Signature (Run Sign first or paste one)"
                        />

                        {/* Verification Result Display */}
                        {verificationResult !== null && (
                            <div className={`mb-4 p-4 rounded-lg border flex items-center gap-3 ${verificationResult
                                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                : 'bg-red-500/10 border-red-500/30 text-red-400'
                                }`}>
                                {verificationResult ? <CheckCircle size={24} /> : <XCircle size={24} />}
                                <div>
                                    <div className="font-bold text-lg">{verificationResult ? 'VERIFICATION OK' : 'VERIFICATION FAILED'}</div>
                                    <div className="text-xs opacity-80">
                                        {verificationResult
                                            ? 'The signature is valid for this message and public key.'
                                            : 'The signature does NOT match this message and public key.'}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-auto pt-4">
                            <button
                                onClick={() => { runOperation('verify'); }}
                                disabled={!selectedVerifyKeyId || loading}
                                className="w-full py-3 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/30 hover:bg-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                            >
                                Verify Signature
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

import React from 'react';
import { Activity, Lock, Key as KeyIcon } from 'lucide-react';
import { usePlaygroundContext } from '../PlaygroundContext';

export const KemTab: React.FC = () => {
    const {
        keyStore,
        selectedEncKeyId,
        setSelectedEncKeyId,
        selectedDecKeyId,
        setSelectedDecKeyId,
        runOperation,
        loading
    } = usePlaygroundContext();

    const isKEM = (algo: string) => algo.startsWith('ML-KEM') || ['X25519', 'P-256'].includes(algo);
    const kemPublicKeys = keyStore.filter(k => k.type === 'public' && isKEM(k.algorithm));
    const kemPrivateKeys = keyStore.filter(k => k.type === 'private' && isKEM(k.algorithm));

    return (
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

                    {selectedEncKeyId && (() => {
                        const key = keyStore.find(k => k.id === selectedEncKeyId);
                        if (!key) return null;

                        let algoDisplay = key.algorithm;
                        let scheme = 'Unknown';
                        let secretSize = '32 bytes';

                        if (key.algorithm.startsWith('ML-KEM')) {
                            scheme = 'ML-KEM (Kyber)';
                        } else if (key.algorithm === 'X25519') {
                            scheme = 'Ephemeral-Static ECDH';
                        } else if (key.algorithm === 'P-256') {
                            scheme = 'Ephemeral-Static ECDH';
                        }

                        return (
                            <div className="mb-4 p-3 bg-black/40 rounded border border-white/10 text-xs space-y-1 animate-fade-in">
                                <div className="flex justify-between">
                                    <span className="text-muted">Algorithm:</span>
                                    <span className="text-blue-400 font-mono font-bold">{algoDisplay}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted">Scheme:</span>
                                    <span className="text-white font-mono">{scheme}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted">Shared Secret:</span>
                                    <span className="text-white font-mono">{secretSize}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted">Derivation:</span>
                                    <span className="text-white font-mono">None (Raw Secret)</span>
                                </div>
                            </div>
                        );
                    })()}
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

                    {selectedDecKeyId && (() => {
                        const key = keyStore.find(k => k.id === selectedDecKeyId);
                        if (!key) return null;

                        let algoDisplay = key.algorithm;
                        let scheme = 'Unknown';
                        let secretSize = '32 bytes';

                        if (key.algorithm.startsWith('ML-KEM')) {
                            scheme = 'ML-KEM (Kyber)';
                        } else if (key.algorithm === 'X25519') {
                            scheme = 'Ephemeral-Static ECDH';
                        } else if (key.algorithm === 'P-256') {
                            scheme = 'Ephemeral-Static ECDH';
                        }

                        return (
                            <div className="mb-4 p-3 bg-black/40 rounded border border-white/10 text-xs space-y-1 animate-fade-in">
                                <div className="flex justify-between">
                                    <span className="text-muted">Algorithm:</span>
                                    <span className="text-purple-400 font-mono font-bold">{algoDisplay}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted">Scheme:</span>
                                    <span className="text-white font-mono">{scheme}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted">Shared Secret:</span>
                                    <span className="text-white font-mono">{secretSize}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted">Derivation:</span>
                                    <span className="text-white font-mono">None (Raw Secret)</span>
                                </div>
                            </div>
                        );
                    })()}
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
    );
};

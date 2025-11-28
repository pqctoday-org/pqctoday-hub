import React from 'react';
import { FileSignature } from 'lucide-react';
import { usePlaygroundContext } from '../PlaygroundContext';

export const SignTab: React.FC = () => {
    const {
        keyStore,
        selectedSignKeyId,
        setSelectedSignKeyId,
        runOperation,
        loading
    } = usePlaygroundContext();

    const isSign = (algo: string) => algo.startsWith('ML-DSA') || algo.startsWith('RSA') || algo.startsWith('ECDSA') || algo === 'Ed25519';
    const signPrivateKeys = keyStore.filter(k => k.type === 'private' && isSign(k.algorithm));

    return (
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

                        {selectedSignKeyId && (() => {
                            const key = keyStore.find(k => k.id === selectedSignKeyId);
                            if (!key) return null;

                            let algoDisplay = key.algorithm;
                            let scheme = 'Unknown';
                            let hash = 'None';

                            if (key.algorithm.startsWith('ML-DSA')) {
                                scheme = 'Pure ML-DSA (Dilithium)';
                                hash = 'Internal (SHAKE256)';
                            } else if (key.algorithm.startsWith('RSA')) {
                                scheme = 'RSA-PSS';
                                hash = 'SHA-256';
                            } else if (key.algorithm.startsWith('ECDSA')) {
                                scheme = 'ECDSA (P-256)';
                                hash = 'SHA-256';
                            } else if (key.algorithm === 'Ed25519') {
                                scheme = 'Pure Ed25519';
                                hash = 'Internal (SHA-512)';
                            }

                            return (
                                <div className="mt-2 p-3 bg-black/40 rounded border border-white/10 text-xs space-y-1 animate-fade-in">
                                    <div className="flex justify-between">
                                        <span className="text-muted">Algorithm:</span>
                                        <span className="text-green-400 font-mono font-bold">{algoDisplay}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted">Scheme:</span>
                                        <span className="text-white font-mono">{scheme}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted">Hash:</span>
                                        <span className="text-white font-mono">{hash}</span>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    <button
                        onClick={() => { runOperation('sign'); }}
                        disabled={!selectedSignKeyId || loading}
                        className="w-full py-3 rounded-lg bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                    >
                        Sign Message
                    </button>
                </div>
            </div>
        </div>
    );
};

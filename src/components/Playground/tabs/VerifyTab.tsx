import React from 'react';
import { FileSignature } from 'lucide-react';
import { usePlaygroundContext } from '../PlaygroundContext';

export const VerifyTab: React.FC = () => {
    const {
        keyStore,
        selectedVerifyKeyId,
        setSelectedVerifyKeyId,
        runOperation,
        loading
    } = usePlaygroundContext();

    const isSign = (algo: string) => algo.startsWith('ML-DSA') || algo.startsWith('RSA') || algo.startsWith('ECDSA') || algo === 'Ed25519';
    const signPublicKeys = keyStore.filter(k => k.type === 'public' && isSign(k.algorithm));

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <h4 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2 mb-6">
                <FileSignature size={18} className="text-accent" /> Verify Signature
            </h4>
            <div className="p-6 bg-black/20 rounded-xl border border-white/5 hover:border-orange-500/30 transition-colors">
                <div className="text-sm text-orange-300 mb-4 font-bold uppercase tracking-wider flex items-center gap-2">
                    <FileSignature size={16} /> Verify Signature
                </div>
                <div className="space-y-4 max-w-xl">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-muted font-bold uppercase tracking-wider">Select Public Key</label>
                        <select
                            value={selectedVerifyKeyId}
                            onChange={(e) => setSelectedVerifyKeyId(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-orange-500"
                        >
                            <option value="">Select Public Key...</option>
                            {signPublicKeys.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                        </select>
                    </div>

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
    );
};

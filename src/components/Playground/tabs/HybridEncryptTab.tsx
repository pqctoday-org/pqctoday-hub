import React from 'react';
import { Lock, Key as KeyIcon } from 'lucide-react';
import { usePlaygroundContext } from '../PlaygroundContext';

export const HybridEncryptTab: React.FC = () => {
    const {
        sharedSecret,
        encryptedData,
        runOperation,
        loading
    } = usePlaygroundContext();

    return (
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
    );
};

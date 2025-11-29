import React from 'react';
import { Cpu, Settings, Lock, FileSignature, Hash, CheckSquare, Square, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { useSettingsContext } from '../contexts/SettingsContext';

export const SettingsTab: React.FC = () => {
    const {
        executionMode,
        setExecutionMode,
        wasmLoaded,
        enabledAlgorithms,
        toggleAlgorithm
    } = useSettingsContext();

    return (
        <div className="space-y-8 max-w-2xl mx-auto animate-fade-in">
            <div className="space-y-4 hidden">
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
        </div>
    );
};

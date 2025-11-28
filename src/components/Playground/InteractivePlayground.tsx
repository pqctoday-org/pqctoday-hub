import React from 'react';
import { Play, Settings, Database, Activity, Lock, FileSignature, Key as KeyIcon, FileText, ShieldCheck, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { PlaygroundProvider, usePlaygroundContext } from './PlaygroundContext';
import { ACVPTesting } from '../ACVP/ACVPTesting';
import { SettingsTab } from './tabs/SettingsTab';
import { DataTab } from './tabs/DataTab';
import { KemTab } from './tabs/KemTab';
import { HybridEncryptTab } from './tabs/HybridEncryptTab';
import { SymmetricTab } from './tabs/SymmetricTab';
import { SignTab } from './tabs/SignTab';
import { VerifyTab } from './tabs/VerifyTab';
import { KeyStoreTab } from './tabs/KeyStoreTab';
import { LogsTab } from './tabs/LogsTab';

export const InteractivePlayground = () => {
    return (
        <PlaygroundProvider>
            <PlaygroundContent />
        </PlaygroundProvider>
    );
};

const PlaygroundContent = () => {
    const {
        activeTab,
        setActiveTab,
        keyStore,
        setKeyStore,
        error
    } = usePlaygroundContext();

    return (
        <div className="glass-panel p-6 h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 shrink-0">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                    <Play className="text-secondary" aria-hidden="true" />
                    Interactive Playground
                </h3>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 bg-white/5 p-1 rounded-xl shrink-0 overflow-x-auto">
                <button onClick={() => setActiveTab('settings')} className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap", activeTab === 'settings' ? "bg-primary/20 text-primary shadow-sm" : "text-muted hover:text-white hover:bg-white/5")}>
                    <Settings size={16} /> Settings
                </button>
                <button onClick={() => setActiveTab('data')} className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap", activeTab === 'data' ? "bg-primary/20 text-primary shadow-sm" : "text-muted hover:text-white hover:bg-white/5")}>
                    <Database size={16} /> Data
                </button>
                <button onClick={() => setActiveTab('kem')} className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap", activeTab === 'kem' ? "bg-primary/20 text-primary shadow-sm" : "text-muted hover:text-white hover:bg-white/5")}>
                    <Activity size={16} /> KEM
                </button>
                <button onClick={() => setActiveTab('encrypt')} className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap", activeTab === 'encrypt' ? "bg-primary/20 text-primary shadow-sm" : "text-muted hover:text-white hover:bg-white/5")}>
                    <Lock size={16} /> Encrypt
                </button>
                <button onClick={() => setActiveTab('symmetric')} className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap", activeTab === 'symmetric' ? "bg-primary/20 text-primary shadow-sm" : "text-muted hover:text-white hover:bg-white/5")}>
                    <Lock size={16} /> Sym Encrypt
                </button>
                <button onClick={() => setActiveTab('sign')} className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap", activeTab === 'sign' ? "bg-primary/20 text-primary shadow-sm" : "text-muted hover:text-white hover:bg-white/5")}>
                    <FileSignature size={16} /> Sign
                </button>
                <button onClick={() => setActiveTab('verify')} className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap", activeTab === 'verify' ? "bg-primary/20 text-primary shadow-sm" : "text-muted hover:text-white hover:bg-white/5")}>
                    <FileSignature size={16} /> Verify
                </button>
                <button onClick={() => setActiveTab('keystore')} className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap", activeTab === 'keystore' ? "bg-primary/20 text-primary shadow-sm" : "text-muted hover:text-white hover:bg-white/5")}>
                    <KeyIcon size={16} /> Key Store ({keyStore.length})
                </button>
                <button onClick={() => setActiveTab('logs')} className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap", activeTab === 'logs' ? "bg-primary/20 text-primary shadow-sm" : "text-muted hover:text-white hover:bg-white/5")}>
                    <FileText size={16} /> Logs
                </button>
                <button onClick={() => setActiveTab('acvp')} className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap", activeTab === 'acvp' ? "bg-primary/20 text-primary shadow-sm" : "text-muted hover:text-white hover:bg-white/5")}>
                    <ShieldCheck size={16} /> ACVP
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 bg-white/5 rounded-xl border border-white/10 p-6 relative">
                {activeTab === 'settings' && <SettingsTab />}
                {activeTab === 'data' && <DataTab />}
                {activeTab === 'kem' && <KemTab />}
                {activeTab === 'encrypt' && <HybridEncryptTab />}
                {activeTab === 'symmetric' && <SymmetricTab />}
                {activeTab === 'sign' && <SignTab />}
                {activeTab === 'verify' && <VerifyTab />}
                {activeTab === 'keystore' && <KeyStoreTab />}
                {activeTab === 'logs' && <LogsTab />}
                {activeTab === 'acvp' && (
                    <div className="h-full">
                        <ACVPTesting keyStore={keyStore} setKeyStore={setKeyStore} />
                    </div>
                )}
            </div>

            {error && (
                <div id="playground-error" role="alert" className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm shrink-0">
                    <AlertCircle size={20} aria-hidden="true" />
                    <span className="font-medium">{error}</span>
                </div>
            )}
        </div>
    );
};

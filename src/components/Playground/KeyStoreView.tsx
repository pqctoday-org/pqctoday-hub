import { useState } from 'react';
import { Key as KeyIcon, Trash2 } from 'lucide-react';
import type { Key } from '../../types';
import { KeyGenerationSection } from './keystore/KeyGenerationSection';
import { KeyTable } from './keystore/KeyTable';
import { KeyDetails } from './keystore/KeyDetails';

interface KeyStoreViewProps {
    keyStore: Key[];
    algorithm: 'ML-KEM' | 'ML-DSA';
    keySize: string;
    loading: boolean;
    onAlgorithmChange: (algorithm: 'ML-KEM' | 'ML-DSA') => void;
    onKeySizeChange: (size: string) => void;
    onGenerateKeys: () => void;
    onUnifiedChange?: (algorithm: 'ML-KEM' | 'ML-DSA', keySize: string) => void;
    // Classical algorithm props
    classicalAlgorithm: string;
    classicalLoading: boolean;
    onClassicalAlgorithmChange: (algorithm: string) => void;
    onGenerateClassicalKeys: () => void;
    onClearKeys: () => void;
}

export const KeyStoreView = ({
    keyStore,
    algorithm,
    keySize,
    loading,
    onAlgorithmChange,
    onKeySizeChange,
    onGenerateKeys,
    classicalAlgorithm,
    classicalLoading,
    onClassicalAlgorithmChange,
    onGenerateClassicalKeys,
    onUnifiedChange,
    onClearKeys
}: KeyStoreViewProps) => {
    // Selection State
    const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);

    // Derived State
    const selectedKey = keyStore.find(k => k.id === selectedKeyId);

    const clearKeys = () => {
        if (confirm('Are you sure you want to clear all keys? This cannot be undone.')) {
            onClearKeys();
            setSelectedKeyId(null);
        }
    };

    return (
        <div className="h-full flex flex-col animate-fade-in gap-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <KeyIcon size={18} className="text-primary" /> Key Store
                </h4>
                {keyStore.length > 0 && (
                    <button onClick={clearKeys} className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10">
                        <Trash2 size={14} /> Clear All Keys
                    </button>
                )}
            </div>

            {/* Key Generation Section */}
            <KeyGenerationSection
                algorithm={algorithm}
                keySize={keySize}
                loading={loading}
                onAlgorithmChange={onAlgorithmChange}
                onKeySizeChange={onKeySizeChange}
                onGenerateKeys={onGenerateKeys}
                onUnifiedChange={onUnifiedChange}
                classicalAlgorithm={classicalAlgorithm}
                classicalLoading={classicalLoading}
                onClassicalAlgorithmChange={onClassicalAlgorithmChange}
                onGenerateClassicalKeys={onGenerateClassicalKeys}
            />

            {/* Table */}
            <KeyTable
                keyStore={keyStore}
                selectedKeyId={selectedKeyId}
                setSelectedKeyId={setSelectedKeyId}
            />

            {/* Detail View */}
            {selectedKey && (
                <KeyDetails selectedKey={selectedKey} />
            )}
        </div>
    );
};

import React, { createContext, useContext, useState } from 'react';
import type { Key } from '../../../types';
import { useSettingsContext } from './SettingsContext';
import { useKeyGeneration } from '../hooks/useKeyGeneration';

import type { KeyStoreContextType } from './types';
export type { KeyStoreContextType };

const KeyStoreContext = createContext<KeyStoreContextType | undefined>(undefined);

export const useKeyStoreContext = () => {
    const context = useContext(KeyStoreContext);
    if (!context) {
        throw new Error('useKeyStoreContext must be used within a KeyStoreProvider');
    }
    return context;
};

export const KeyStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const {
        algorithm, keySize, executionMode, wasmLoaded, classicalAlgorithm,
        addLog, setLoading, setError
    } = useSettingsContext();

    const [keyStore, setKeyStore] = useState<Key[]>([]);
    const [selectedEncKeyId, setSelectedEncKeyId] = useState<string>('');
    const [selectedDecKeyId, setSelectedDecKeyId] = useState<string>('');
    const [selectedSignKeyId, setSelectedSignKeyId] = useState<string>('');
    const [selectedVerifyKeyId, setSelectedVerifyKeyId] = useState<string>('');
    const [selectedSymKeyId, setSelectedSymKeyId] = useState<string>('');

    const { generateKeys, generateClassicalKeys, classicalLoading } = useKeyGeneration({
        algorithm,
        keySize,
        executionMode,
        wasmLoaded,
        classicalAlgorithm,
        setKeyStore,
        setSelectedEncKeyId,
        setSelectedDecKeyId,
        setSelectedSignKeyId,
        setSelectedVerifyKeyId,
        addLog,
        setLoading,
        setError
    });

    const clearKeys = () => {
        setKeyStore([]);
        setSelectedEncKeyId('');
        setSelectedDecKeyId('');
        setSelectedSignKeyId('');
        setSelectedVerifyKeyId('');
        setSelectedSymKeyId('');
        addLog({ keyLabel: 'System', operation: 'Clear Keys', result: 'All keys cleared', executionTime: 0 });
    };

    const importKey = (key: Key) => {
        setKeyStore(prev => [...prev, key]);
        addLog({ keyLabel: key.name, operation: 'Import Key', result: 'Key imported successfully', executionTime: 0 });
    };

    const deleteKey = (id: string) => {
        setKeyStore(prev => prev.filter(k => k.id !== id));
        addLog({ keyLabel: id, operation: 'Delete Key', result: 'Key deleted', executionTime: 0 });
    };

    const downloadKey = (id: string) => {
        const key = keyStore.find(k => k.id === id);
        if (!key) return;

        const blob = new Blob([key.value], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${key.name.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addLog({ keyLabel: key.name, operation: 'Download Key', result: 'Key downloaded', executionTime: 0 });
    };

    return (
        <KeyStoreContext.Provider value={{
            keyStore, setKeyStore,
            selectedEncKeyId, setSelectedEncKeyId,
            selectedDecKeyId, setSelectedDecKeyId,
            selectedSignKeyId, setSelectedSignKeyId,
            selectedVerifyKeyId, setSelectedVerifyKeyId,
            selectedSymKeyId, setSelectedSymKeyId,
            generateKeys, generateClassicalKeys, clearKeys, classicalLoading,
            importKey, deleteKey, downloadKey
        }}>
            {children}
        </KeyStoreContext.Provider>
    );
};

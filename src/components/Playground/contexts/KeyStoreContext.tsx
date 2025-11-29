import React, { createContext, useContext, useState } from 'react';
import type { Key } from '../../../types';
import { useSettingsContext } from './SettingsContext';
import { useKeyGeneration } from '../hooks/useKeyGeneration';

export interface KeyStoreContextType {
    keyStore: Key[];
    setKeyStore: React.Dispatch<React.SetStateAction<Key[]>>;

    // Selection State
    selectedEncKeyId: string;
    setSelectedEncKeyId: (id: string) => void;
    selectedDecKeyId: string;
    setSelectedDecKeyId: (id: string) => void;
    selectedSignKeyId: string;
    setSelectedSignKeyId: (id: string) => void;
    selectedVerifyKeyId: string;
    setSelectedVerifyKeyId: (id: string) => void;
    selectedSymKeyId: string;
    setSelectedSymKeyId: (id: string) => void;

    // Actions
    generateKeys: () => Promise<void>;
    generateClassicalKeys: () => Promise<void>;
    clearKeys: () => void;
    classicalLoading: boolean;
}

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

    return (
        <KeyStoreContext.Provider value={{
            keyStore, setKeyStore,
            selectedEncKeyId, setSelectedEncKeyId,
            selectedDecKeyId, setSelectedDecKeyId,
            selectedSignKeyId, setSelectedSignKeyId,
            selectedVerifyKeyId, setSelectedVerifyKeyId,
            selectedSymKeyId, setSelectedSymKeyId,
            generateKeys, generateClassicalKeys, clearKeys, classicalLoading
        }}>
            {children}
        </KeyStoreContext.Provider>
    );
};

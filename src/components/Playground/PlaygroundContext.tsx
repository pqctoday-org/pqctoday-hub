import React from 'react';
import { SettingsProvider, useSettingsContext } from './contexts/SettingsContext';
import { KeyStoreProvider, useKeyStoreContext } from './contexts/KeyStoreContext';
import { OperationsProvider, useOperationsContext } from './contexts/OperationsContext';


// Re-export types for consumers
export type { ExecutionMode, SortColumn, SortDirection, ClassicalAlgorithm } from './contexts/SettingsContext';

// Legacy hook for backward compatibility
// This aggregates all contexts into one object matching the old interface
export const usePlaygroundContext = () => {
    const settings = useSettingsContext();
    const keyStore = useKeyStoreContext();
    const operations = useOperationsContext();

    return {
        ...settings,
        ...keyStore,
        ...operations,
        // Map clearKeys to clear both keys and operations to match old behavior
        clearKeys: () => {
            keyStore.clearKeys();
            operations.clearOperations();
        }
    };
};

export const PlaygroundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <SettingsProvider>
            <KeyStoreProvider>
                <OperationsProvider>
                    {children}
                </OperationsProvider>
            </KeyStoreProvider>
        </SettingsProvider>
    );
};

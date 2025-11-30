import React from 'react';
import { SettingsProvider } from './contexts/SettingsProvider';
import { KeyStoreProvider } from './contexts/KeyStoreProvider';
import { OperationsProvider } from './contexts/OperationsProvider';

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

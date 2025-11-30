import { createContext, useContext } from 'react';

// --- Types ---
import type { SettingsContextType, ExecutionMode, SortColumn, SortDirection, ClassicalAlgorithm, EnabledAlgorithms } from './types';
export type { SettingsContextType, ExecutionMode, SortColumn, SortDirection, ClassicalAlgorithm, EnabledAlgorithms };

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettingsContext = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettingsContext must be used within a SettingsProvider');
    }
    return context;
};

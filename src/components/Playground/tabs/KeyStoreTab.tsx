import React from 'react';
import { KeyStoreView } from '../KeyStoreView';
import { usePlaygroundContext, type ClassicalAlgorithm } from '../PlaygroundContext';

export const KeyStoreTab: React.FC = () => {
    const {
        keyStore,
        algorithm,
        setAlgorithm,
        keySize,
        setKeySize,
        loading,
        handleAlgorithmChange,
        generateKeys,
        classicalAlgorithm,
        setClassicalAlgorithm,
        classicalLoading,
        generateClassicalKeys,
        clearKeys
    } = usePlaygroundContext();

    return (
        <KeyStoreView
            keyStore={keyStore}
            algorithm={algorithm}
            keySize={keySize}
            loading={loading}
            onAlgorithmChange={handleAlgorithmChange}
            onKeySizeChange={setKeySize}
            onGenerateKeys={generateKeys}
            onUnifiedChange={(algo, size) => {
                setAlgorithm(algo);
                setKeySize(size);
            }}
            classicalAlgorithm={classicalAlgorithm}
            classicalLoading={classicalLoading}
            onClassicalAlgorithmChange={(algo) => setClassicalAlgorithm(algo as ClassicalAlgorithm)}
            onGenerateClassicalKeys={generateClassicalKeys}
            onClearKeys={clearKeys}
        />
    );
};

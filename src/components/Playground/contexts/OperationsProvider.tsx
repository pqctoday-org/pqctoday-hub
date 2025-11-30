import React, { useState } from 'react';
import { OperationsContext } from './OperationsContext';
import { useSettingsContext } from './SettingsContext';
import { useKeyStoreContext } from './KeyStoreContext';
import { useKemOperations } from '../hooks/useKemOperations';
import { useDsaOperations } from '../hooks/useDsaOperations';
import { useSymmetricOperations } from '../hooks/useSymmetricOperations';

export const OperationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const {
        executionMode, wasmLoaded, keySize, addLog, setLoading, setError
    } = useSettingsContext();

    const {
        keyStore, selectedEncKeyId, selectedDecKeyId, selectedSignKeyId, selectedVerifyKeyId, selectedSymKeyId
    } = useKeyStoreContext();

    // State definitions
    const [sharedSecret, setSharedSecret] = useState<string>('');
    const [ciphertext, setCiphertext] = useState<string>('');
    const [encryptedData, setEncryptedData] = useState<string>('');
    const [signature, setSignature] = useState<string>('');
    const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
    const [kemDecapsulationResult, setKemDecapsulationResult] = useState<boolean | null>(null);
    const [dataToSign, setDataToSign] = useState('Hello Quantum World!');
    const [dataToEncrypt, setDataToEncrypt] = useState('Secret Message');
    const [decryptedData, setDecryptedData] = useState('');
    const [symData, setSymData] = useState('48656c6c6f2053796d6d657472696320576f726c64');
    const [symOutput, setSymOutput] = useState('');

    const { runKemOperation } = useKemOperations({
        keyStore,
        selectedEncKeyId,
        selectedDecKeyId,
        executionMode,
        wasmLoaded,
        keySize,
        sharedSecret,
        ciphertext,
        setSharedSecret,
        setCiphertext,
        setKemDecapsulationResult,
        addLog,
        setLoading,
        setError
    });

    const { runDsaOperation } = useDsaOperations({
        keyStore,
        selectedSignKeyId,
        selectedVerifyKeyId,
        executionMode,
        wasmLoaded,
        dataToSign,
        signature,
        setSignature,
        setVerificationResult,
        addLog,
        setLoading,
        setError
    });

    const { runSymmetricOperation } = useSymmetricOperations({
        keyStore,
        selectedSymKeyId,
        executionMode,
        symData,
        symOutput,
        sharedSecret,
        dataToEncrypt,
        encryptedData,
        setSymData,
        setSymOutput,
        setEncryptedData,
        setDecryptedData,
        addLog,
        setLoading,
        setError
    });

    const runOperation = async (type: 'encapsulate' | 'decapsulate' | 'sign' | 'verify' | 'encrypt' | 'decrypt' | 'symEncrypt' | 'symDecrypt') => {
        if (type === 'encapsulate' || type === 'decapsulate') {
            await runKemOperation(type);
        } else if (type === 'sign' || type === 'verify') {
            await runDsaOperation(type);
        } else {
            await runSymmetricOperation(type);
        }
    };

    const clearOperations = () => {
        setSharedSecret('');
        setCiphertext('');
        setEncryptedData('');
        setDecryptedData('');
        setSignature('');
        setVerificationResult(null);
        setKemDecapsulationResult(null);
        setSymOutput('');
        addLog({ keyLabel: 'System', operation: 'Clear Operations', result: 'All operation states cleared', executionTime: 0 });
    };

    return (
        <OperationsContext.Provider value={{
            sharedSecret, setSharedSecret, ciphertext, setCiphertext, encryptedData, setEncryptedData, kemDecapsulationResult, setKemDecapsulationResult,
            signature, setSignature, verificationResult, setVerificationResult,
            dataToSign, setDataToSign, dataToEncrypt, setDataToEncrypt, decryptedData, setDecryptedData,
            symData, setSymData, symOutput, setSymOutput,
            runOperation, clearOperations
        }}>
            {children}
        </OperationsContext.Provider>
    );
};

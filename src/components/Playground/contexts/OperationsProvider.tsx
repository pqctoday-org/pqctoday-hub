import React, { useState } from 'react'
import { OperationsContext } from './OperationsContext'
import { useSettingsContext } from './SettingsContext'
import { useKeyStoreContext } from './KeyStoreContext'
import { useKemOperations } from '../hooks/useKemOperations'
import { useDsaOperations } from '../hooks/useDsaOperations'
import { useSymmetricOperations } from '../hooks/useSymmetricOperations'
import { useHashingOperations } from '../hooks/useHashingOperations'

export const OperationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { executionMode, wasmLoaded, keySize, addLog, setLoading, setError } = useSettingsContext()

  const {
    keyStore,
    selectedEncKeyId,
    selectedDecKeyId,
    selectedSignKeyId,
    selectedVerifyKeyId,
    selectedSymKeyId,
  } = useKeyStoreContext()

  // State definitions
  const [sharedSecret, setSharedSecret] = useState<string>('')
  const [ciphertext, setCiphertext] = useState<string>('')
  const [encryptedData, setEncryptedData] = useState<string>('')
  const [signature, setSignature] = useState<string>('')
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null)
  const [kemDecapsulationResult, setKemDecapsulationResult] = useState<boolean | null>(null)
  const [decapsulatedSecret, setDecapsulatedSecret] = useState<string>('')
  const [isHybridMode, setIsHybridMode] = useState<boolean>(false)
  const [secondaryEncKeyId, setSecondaryEncKeyId] = useState<string>('')
  const [secondaryDecKeyId, setSecondaryDecKeyId] = useState<string>('')
  const [dataToSign, setDataToSign] = useState('Hello Quantum World!')
  const [dataToEncrypt, setDataToEncrypt] = useState('Secret Message')
  const [decryptedData, setDecryptedData] = useState('')
  const [symData, setSymData] = useState('48656c6c6f2053796d6d657472696320576f726c64')
  const [symOutput, setSymOutput] = useState('')
  const [selectedHashMethod, setSelectedHashMethod] = useState('SHA-256')
  const [hashInput, setHashInput] = useState('Hello Hashing World!')
  const [hashOutput, setHashOutput] = useState('')
  const [hybridMethod, setHybridMethod] = useState<'concat-hkdf' | 'concat'>('concat-hkdf')
  const [pqcSharedSecret, setPqcSharedSecret] = useState('')
  const [classicalSharedSecret, setClassicalSharedSecret] = useState('')
  const [pqcRecoveredSecret, setPqcRecoveredSecret] = useState<string>('')
  const [classicalRecoveredSecret, setClassicalRecoveredSecret] = useState<string>('')

  const { runKemOperation } = useKemOperations({
    keyStore,
    selectedEncKeyId,
    selectedDecKeyId,
    isHybridMode,
    secondaryEncKeyId,
    secondaryDecKeyId,
    executionMode,
    wasmLoaded,
    keySize,
    sharedSecret,
    ciphertext,
    setSharedSecret,
    setCiphertext,
    setKemDecapsulationResult,
    setDecapsulatedSecret,
    addLog,
    setLoading,
    setError,
    hybridMethod,
    setPqcSharedSecret,
    setClassicalSharedSecret,
    setPqcRecoveredSecret,
    setClassicalRecoveredSecret,
  })

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
    setError,
  })

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
    setError,
  })

  const { hashData } = useHashingOperations()

  const runOperation = async (
    type:
      | 'encapsulate'
      | 'decapsulate'
      | 'sign'
      | 'verify'
      | 'encrypt'
      | 'decrypt'
      | 'symEncrypt'
      | 'symDecrypt'
      | 'hash'
  ) => {
    if (type === 'encapsulate' || type === 'decapsulate') {
      await runKemOperation(type)
    } else if (type === 'sign' || type === 'verify') {
      await runDsaOperation(type)
    } else if (type === 'hash') {
      // Run hashing operation
      const startTime = performance.now()
      setLoading(true)
      setError(null)

      try {
        const result = hashData(selectedHashMethod, hashInput, 'ascii')
        setHashOutput(result)
        const executionTime = performance.now() - startTime
        addLog({
          keyLabel: selectedHashMethod,
          operation: 'Hash',
          result: `${result.slice(0, 32)}...`,
          executionTime,
        })
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Hashing failed'
        setError(errorMsg)
        addLog({
          keyLabel: selectedHashMethod,
          operation: 'Hash',
          result: `Error: ${errorMsg}`,
          executionTime: performance.now() - startTime,
        })
      } finally {
        setLoading(false)
      }
    } else {
      await runSymmetricOperation(type)
    }
  }

  const clearOperations = () => {
    setSharedSecret('')
    setCiphertext('')
    setEncryptedData('')
    setDecryptedData('')
    setSignature('')
    setVerificationResult(null)
    setVerificationResult(null)
    setKemDecapsulationResult(null)
    setDecapsulatedSecret('')
    setSymOutput('')
    setHashOutput('')
    addLog({
      keyLabel: 'System',
      operation: 'Clear Operations',
      result: 'All operation states cleared',
      executionTime: 0,
    })
  }

  return (
    <OperationsContext.Provider
      value={{
        sharedSecret,
        setSharedSecret,
        ciphertext,
        setCiphertext,
        encryptedData,
        setEncryptedData,
        kemDecapsulationResult,
        setKemDecapsulationResult,
        decapsulatedSecret,
        setDecapsulatedSecret,
        isHybridMode,
        setIsHybridMode,
        secondaryEncKeyId,
        setSecondaryEncKeyId,
        secondaryDecKeyId,
        setSecondaryDecKeyId,
        signature,
        setSignature,
        verificationResult,
        setVerificationResult,
        dataToSign,
        setDataToSign,
        dataToEncrypt,
        setDataToEncrypt,
        decryptedData,
        setDecryptedData,
        symData,
        setSymData,
        symOutput,
        setSymOutput,
        selectedHashMethod,
        setSelectedHashMethod,
        hashInput,
        setHashInput,
        hashOutput,
        setHashOutput,
        runOperation,
        clearOperations,
        hybridMethod,
        setHybridMethod,
        pqcSharedSecret,
        setPqcSharedSecret,
        classicalSharedSecret,
        setClassicalSharedSecret,
        pqcRecoveredSecret,
        setPqcRecoveredSecret,
        classicalRecoveredSecret,
        setClassicalRecoveredSecret,
      }}
    >
      {children}
    </OperationsContext.Provider>
  )
}

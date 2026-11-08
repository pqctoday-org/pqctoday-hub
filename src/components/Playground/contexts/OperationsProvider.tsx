// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState, useEffect } from 'react'
import { OperationsContext } from './OperationsContext'
import { useSettingsContext } from './SettingsContext'
import { useKeyStoreContext } from './KeyStoreContext'
import { useKemOperations } from '../hooks/useKemOperations'
import { useDsaOperations } from '../hooks/useDsaOperations'
import { useSymmetricOperations } from '../hooks/useSymmetricOperations'
import { useHashingOperations } from '../hooks/useHashingOperations'
import { bytesToHex } from '@/utils/dataInputUtils'
import { useAchievementStore } from '@/store/useAchievementStore'

export const OperationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { algorithm, executionMode, wasmLoaded, keySize, addLog, setLoading, setError } =
    useSettingsContext()

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
  const [signature, setSignatureValue] = useState<string>('')
  const [verificationRecord, setVerificationRecord] = useState<{
    valid: boolean
    identity: string
  } | null>(null)
  const [kemDecapsulationResult, setKemDecapsulationResult] = useState<boolean | null>(null)
  const [decapsulatedSecret, setDecapsulatedSecret] = useState<string>('')
  const [isHybridMode, setIsHybridMode] = useState<boolean>(false)
  const [secondaryEncKeyId, setSecondaryEncKeyId] = useState<string>('')
  const [secondaryDecKeyId, setSecondaryDecKeyId] = useState<string>('')
  const [dataToSignBytes, setMessageBytes] = useState(() =>
    new TextEncoder().encode('Hello Quantum World!')
  )
  const verificationIdentity = JSON.stringify([
    selectedVerifyKeyId,
    algorithm,
    executionMode,
    bytesToHex(dataToSignBytes),
    signature,
  ])
  const verificationResult =
    verificationRecord?.identity === verificationIdentity ? verificationRecord.valid : null
  const setVerificationResult = (valid: boolean | null) =>
    setVerificationRecord(valid === null ? null : { valid, identity: verificationIdentity })
  const setSignature = (value: string) => {
    setVerificationRecord(null)
    setSignatureValue(value)
  }
  const setDataToSignBytes = (bytes: Uint8Array) => {
    setVerificationRecord(null)
    setMessageBytes(new Uint8Array(bytes))
  }
  const setDataToSign = (value: string) => setDataToSignBytes(new TextEncoder().encode(value))
  let dataToSign = ''
  try {
    dataToSign = new TextDecoder('utf-8', { fatal: true }).decode(dataToSignBytes)
  } catch {
    /* Binary message: only the hex view is editable. */
  }
  useEffect(() => {
    setVerificationRecord(null)
  }, [selectedVerifyKeyId, algorithm, executionMode])
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

  useEffect(() => {
    setDecapsulatedSecret('')
    setKemDecapsulationResult(null)
    setDecryptedData('')
  }, [ciphertext, selectedDecKeyId, secondaryDecKeyId, hybridMethod, isHybridMode, executionMode])

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
    dataToSignBytes,
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
    decapsulatedSecret,
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
    useAchievementStore.getState().incrementPlaygroundOps()
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
        dataToSignBytes,
        setDataToSignBytes,
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

import React from 'react'
import { KeyStoreView } from '../KeyStoreView'
import { useSettingsContext, type ClassicalAlgorithm } from '../contexts/SettingsContext'
import { useKeyStoreContext } from '../contexts/KeyStoreContext'

export const KeyStoreTab: React.FC = () => {
  const {
    algorithm,
    setAlgorithm,
    keySize,
    setKeySize,
    loading,
    handleAlgorithmChange,
    classicalAlgorithm,
    setClassicalAlgorithm,
  } = useSettingsContext()

  const {
    keyStore,
    generateKeys,
    classicalLoading,
    generateClassicalKeys,
    clearKeys,
    backupAllKeys,
    restoreKeys,
  } = useKeyStoreContext()

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
        setAlgorithm(algo)
        setKeySize(size)
      }}
      classicalAlgorithm={classicalAlgorithm}
      classicalLoading={classicalLoading}
      onClassicalAlgorithmChange={(algo) => setClassicalAlgorithm(algo as ClassicalAlgorithm)}
      onGenerateClassicalKeys={generateClassicalKeys}
      onClearKeys={clearKeys}
      onBackupAllKeys={backupAllKeys}
      onRestoreKeys={restoreKeys}
    />
  )
}

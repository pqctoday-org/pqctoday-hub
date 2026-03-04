// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { KeyStoreView } from '../KeyStoreView'
import { useSettingsContext, type ClassicalAlgorithm } from '../contexts/SettingsContext'
import { useKeyStoreContext } from '../contexts/KeyStoreContext'
import { TokenSetupPanel } from '../components/TokenSetupPanel'
import { HsmKeyTable } from '../keystore/HsmKeyTable'

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
    hsmMode,
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

  if (hsmMode) {
    return (
      <div className="space-y-4">
        <TokenSetupPanel />
        <HsmKeyTable />
      </div>
    )
  }

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

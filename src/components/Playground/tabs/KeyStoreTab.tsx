// SPDX-License-Identifier: AGPL-3.0-only
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
    <>
      {keyStore.some((key) => key.algorithm.startsWith('LMS-')) && (
        <p className="mb-3 rounded border border-status-warning/40 bg-status-warning/10 p-3 text-sm text-status-warning">
          LMS sample backup limitation: saved key state may be stale. Restoring an old state can
          reuse a one-time signing leaf. This demonstration does not prevent rollback or guarantee
          safe recovery; evaluate those capabilities in your production tools.
        </p>
      )}
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
    </>
  )
}

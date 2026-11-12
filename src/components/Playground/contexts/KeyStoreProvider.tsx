// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import type { Key } from '../../../types'
import { KeyStoreContext } from './KeyStoreContext'
import { useSettingsContext } from './SettingsContext'
import { useKeyGeneration } from '../hooks/useKeyGeneration'
import { createSampleKeyArchive, readSampleKeyArchive } from './sampleKeyArchive'
import { withEducationNoticeComment } from '@/data/educationNotice'

export const KeyStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    algorithm,
    keySize,
    executionMode,
    wasmLoaded,
    classicalAlgorithm,
    addLog,
    setLoading,
    setError,
  } = useSettingsContext()

  const [keyStore, setKeyStore] = useState<Key[]>([])
  const [selectedEncKeyId, setSelectedEncKeyId] = useState<string>('')
  const [selectedDecKeyId, setSelectedDecKeyId] = useState<string>('')
  const [selectedSignKeyId, setSelectedSignKeyId] = useState<string>('')
  const [selectedVerifyKeyId, setSelectedVerifyKeyId] = useState<string>('')
  const [selectedSymKeyId, setSelectedSymKeyId] = useState<string>('')

  const { generateKeys, generateClassicalKeys, classicalLoading } = useKeyGeneration({
    algorithm,
    keySize,
    executionMode,
    wasmLoaded,
    classicalAlgorithm,
    setKeyStore,
    setSelectedEncKeyId,
    setSelectedDecKeyId,
    setSelectedSignKeyId,
    setSelectedVerifyKeyId,
    addLog,
    setLoading,
    setError,
  })

  const clearKeys = () => {
    setKeyStore([])
    setSelectedEncKeyId('')
    setSelectedDecKeyId('')
    setSelectedSignKeyId('')
    setSelectedVerifyKeyId('')
    setSelectedSymKeyId('')
    addLog({
      keyLabel: 'System',
      operation: 'Clear Keys',
      result: 'All keys cleared',
      executionTime: 0,
    })
  }

  const importKey = (key: Key) => {
    setKeyStore((prev) => [...prev, key])
    addLog({
      keyLabel: key.name,
      operation: 'Import Key',
      result: 'Key imported successfully',
      executionTime: 0,
    })
  }

  const deleteKey = (id: string) => {
    setKeyStore((prev) => prev.filter((k) => k.id !== id))
    addLog({ keyLabel: id, operation: 'Delete Key', result: 'Key deleted', executionTime: 0 })
  }

  const downloadKey = (id: string) => {
    const key = keyStore.find((k) => k.id === id)
    if (!key) return

    // Key material leaves the browser here, so the notice leaves with it: a
    // .txt of key bytes is indistinguishable from real key material once it is
    // in someone's Downloads folder (education-notice remediation 2026-09-26).
    const blob = new Blob([withEducationNoticeComment(key.value, '#')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${key.name.replace(/\s+/g, '_')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    addLog({
      keyLabel: key.name,
      operation: 'Download Key',
      result: 'Key downloaded',
      executionTime: 0,
    })
  }

  const backupAllKeys = async () => {
    if (keyStore.length === 0) {
      addLog({
        keyLabel: 'System',
        operation: 'Backup Keys',
        result: 'No keys to backup',
        executionTime: 0,
      })
      return
    }

    try {
      setError(null)
      const bytes = await createSampleKeyArchive(keyStore)
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/zip' })

      // Create download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `playground-keys-backup-${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      addLog({
        keyLabel: 'System',
        operation: 'Backup Keys',
        result: `Backed up ${keyStore.length} key(s) to ${a.download}`,
        executionTime: 0,
      })
    } catch (error) {
      setError(
        `Failed to create sample-key backup: ${error instanceof Error ? error.message : String(error)}`
      )
      addLog({
        keyLabel: 'System',
        operation: 'Backup Keys',
        result: `Failed to create backup: ${error}`,
        executionTime: 0,
      })
    }
  }

  const restoreKeys = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setError(null)
      // The complete archive is parsed before any collection update.
      const restored = await readSampleKeyArchive(file)
      setKeyStore((prev) => [...prev, ...restored.keys])
      addLog({
        keyLabel: 'System',
        operation: 'Restore Keys',
        result: restored.legacy
          ? `Imported ${restored.keys.length} unclassified legacy text record(s) from ${file.name}; original key metadata is unavailable. These are not operation keys.`
          : `Restored ${restored.keys.length} sample record(s) from ${file.name}; loading records does not verify their keys.`,
        executionTime: 0,
      })
    } catch (error) {
      const message = `Failed to restore sample-key archive: ${error instanceof Error ? error.message : String(error)}`
      setError(message)
      addLog({ keyLabel: 'System', operation: 'Restore Keys', result: message, executionTime: 0 })
    } finally {
      // Permit retrying the same file after either success or failure.
      event.target.value = ''
    }
  }

  return (
    <KeyStoreContext.Provider
      value={{
        keyStore,
        setKeyStore,
        selectedEncKeyId,
        setSelectedEncKeyId,
        selectedDecKeyId,
        setSelectedDecKeyId,
        selectedSignKeyId,
        setSelectedSignKeyId,
        selectedVerifyKeyId,
        setSelectedVerifyKeyId,
        selectedSymKeyId,
        setSelectedSymKeyId,
        generateKeys,
        generateClassicalKeys,
        clearKeys,
        classicalLoading,
        importKey,
        deleteKey,
        downloadKey,
        backupAllKeys,
        restoreKeys,
      }}
    >
      {children}
    </KeyStoreContext.Provider>
  )
}

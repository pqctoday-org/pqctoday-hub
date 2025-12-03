import React, { useState } from 'react'
import type { Key } from '../../../types'
import { KeyStoreContext } from './KeyStoreContext'
import { useSettingsContext } from './SettingsContext'
import { useKeyGeneration } from '../hooks/useKeyGeneration'
import JSZip from 'jszip'

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

    const blob = new Blob([key.value], { type: 'text/plain' })
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
      const zip = new JSZip()

      // Add all keys to the zip
      keyStore.forEach((key) => {
        const filename = `${key.name.replace(/\s+/g, '_')}.txt`
        zip.file(filename, key.value)
      })

      // Generate the zip file
      const blob = await zip.generateAsync({ type: 'blob' })

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
      const zip = new JSZip()
      const contents = await zip.loadAsync(file)

      let importedCount = 0
      const promises: Promise<void>[] = []
      const newKeys: Key[] = []

      contents.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir && relativePath.endsWith('.txt')) {
          promises.push(
            zipEntry.async('string').then((content) => {
              const keyName = relativePath.replace('.txt', '').replace(/_/g, ' ')
              const newKey: Key = {
                id: `imported-${Date.now()}-${importedCount}`,
                name: keyName,
                type: 'private', // Default to private for imported keys
                value: content,
                algorithm: 'Imported',
                timestamp: Date.now(),
              }
              newKeys.push(newKey)
              importedCount++
            })
          )
        }
      })

      await Promise.all(promises)
      setKeyStore((prev) => [...prev, ...newKeys])

      addLog({
        keyLabel: 'System',
        operation: 'Restore Keys',
        result: `Imported ${importedCount} key(s) from ${file.name}`,
        executionTime: 0,
      })

      // Reset the input
      event.target.value = ''
    } catch (error) {
      addLog({
        keyLabel: 'System',
        operation: 'Restore Keys',
        result: `Failed to import keys: ${error}`,
        executionTime: 0,
      })
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

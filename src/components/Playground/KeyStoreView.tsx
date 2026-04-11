// SPDX-License-Identifier: GPL-3.0-only
import { useState, useMemo } from 'react'
import { Key as KeyIcon, Trash2, Archive, Upload } from 'lucide-react'
import type { Key } from '../../types'
import { KeyGenerationSection } from './keystore/KeyGenerationSection'
import { KeyTable } from './keystore/KeyTable'
import { getKeySize, formatBytes } from './keystore/keySizeUtils'
import { KeyDetails } from './keystore/KeyDetails'
import { Button } from '@/components/ui/button'

interface KeyStoreViewProps {
  keyStore: Key[]
  algorithm: string
  keySize: string
  loading: boolean
  onAlgorithmChange: (algorithm: string) => void
  onKeySizeChange: (size: string) => void
  onGenerateKeys: () => void
  onUnifiedChange?: (algorithm: string, keySize: string) => void
  // Classical algorithm props
  classicalAlgorithm: string
  classicalLoading: boolean
  onClassicalAlgorithmChange: (algorithm: string) => void
  onGenerateClassicalKeys: () => void
  onClearKeys: () => void
  onBackupAllKeys: () => Promise<void>
  onRestoreKeys: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>
}

export const KeyStoreView = ({
  keyStore,
  algorithm,
  keySize,
  loading,
  onAlgorithmChange,
  onKeySizeChange,
  onGenerateKeys,
  classicalAlgorithm,
  classicalLoading,
  onClassicalAlgorithmChange,
  onGenerateClassicalKeys,
  onUnifiedChange,
  onClearKeys,
  onBackupAllKeys,
  onRestoreKeys,
}: KeyStoreViewProps) => {
  // Selection State
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null)

  // Derived State
  const selectedKey = keyStore.find((k) => k.id === selectedKeyId)
  const totalBytes = useMemo(
    () => keyStore.reduce((sum, k) => sum + (getKeySize(k) ?? 0), 0),
    [keyStore]
  )

  const clearKeys = () => {
    if (confirm('Are you sure you want to clear all keys? This cannot be undone.')) {
      onClearKeys()
      setSelectedKeyId(null)
    }
  }

  return (
    <div className="h-full flex flex-col animate-fade-in gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
            <KeyIcon size={18} className="text-primary" /> Key Store
          </h4>
          {keyStore.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5 ml-7">
              {keyStore.length} {keyStore.length === 1 ? 'key' : 'keys'} &middot;{' '}
              {formatBytes(totalBytes)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {keyStore.length > 0 && (
            <>
              <Button
                variant="ghost"
                onClick={onBackupAllKeys}
                className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/40 rounded text-xs font-medium text-primary transition-colors flex items-center gap-2"
                title="Backup all keys to ZIP"
              >
                <Archive size={14} /> Backup All
              </Button>
              <Button
                variant="ghost"
                onClick={clearKeys}
                className="text-sm text-destructive hover:text-destructive/80 flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg hover:bg-destructive/10"
              >
                <Trash2 size={14} /> Clear All Keys
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            className="px-3 py-1.5 bg-muted hover:bg-accent border border-border rounded text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors flex items-center gap-2"
            onClick={() => document.getElementById('restore-keys-input')?.click()}
          >
            <Upload size={14} /> Import ZIP
            <input
              id="restore-keys-input"
              type="file"
              accept=".zip"
              onChange={onRestoreKeys}
              className="hidden"
            />
          </Button>
        </div>
      </div>

      {/* Key Generation Section */}
      <KeyGenerationSection
        algorithm={algorithm}
        keySize={keySize}
        loading={loading}
        onAlgorithmChange={onAlgorithmChange}
        onKeySizeChange={onKeySizeChange}
        onGenerateKeys={onGenerateKeys}
        onUnifiedChange={onUnifiedChange}
        classicalAlgorithm={classicalAlgorithm}
        classicalLoading={classicalLoading}
        onClassicalAlgorithmChange={onClassicalAlgorithmChange}
        onGenerateClassicalKeys={onGenerateClassicalKeys}
      />

      {/* Table */}
      <KeyTable
        keyStore={keyStore}
        selectedKeyId={selectedKeyId}
        setSelectedKeyId={setSelectedKeyId}
      />

      {/* Detail View */}
      {selectedKey && <KeyDetails selectedKey={selectedKey} />}
    </div>
  )
}

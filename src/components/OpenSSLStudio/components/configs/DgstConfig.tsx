// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import clsx from 'clsx'
import { useOpenSSLStore } from '../../store'
import { FilterDropdown } from '../../../common/FilterDropdown'
import { Button } from '@/components/ui/button'

interface DgstConfigProps {
  signAction: 'sign' | 'verify'
  setSignAction: (value: 'sign' | 'verify') => void
  sigHashAlgo: string
  setSigHashAlgo: (value: string) => void
  selectedKeyFile: string
  setSelectedKeyFile: (value: string) => void
  selectedDataFile: string
  setSelectedDataFile: (value: string) => void
  selectedSigFile: string
  setSelectedSigFile: (value: string) => void
  // Advanced
  manualHashHex: string
  setManualHashHex: (value: string) => void
  useRawIn: boolean
  setUseRawIn: (value: boolean) => void
}

export const DgstConfig: React.FC<DgstConfigProps> = ({
  signAction,
  setSignAction,
  sigHashAlgo,
  setSigHashAlgo,
  selectedKeyFile,
  setSelectedKeyFile,
  selectedDataFile,
  setSelectedDataFile,
  selectedSigFile,
  setSelectedSigFile,
  manualHashHex,
  setManualHashHex,
  useRawIn,
  setUseRawIn,
}) => {
  const { files } = useOpenSSLStore()

  return (
    <div className="space-y-4 animate-fade-in">
      <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider block">
        2. Configuration
      </span>

      {/* Test Helper */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          onClick={() =>
            files.find((f) => f.name === 'data.txt')
              ? null
              : useOpenSSLStore.getState().addFile({
                  name: 'data.txt',
                  type: 'text',
                  content: 'This is a test file for OpenSSL operations.',
                  size: 43,
                  timestamp: Date.now(),
                })
          }
          className="text-[10px] text-primary hover:underline"
        >
          Create Test Data File
        </Button>
      </div>

      <div className="space-y-3">
        <span className="text-xs text-muted-foreground block">Action</span>
        <div className="flex bg-background rounded-lg p-1 border border-input">
          <Button
            variant="ghost"
            onClick={() => setSignAction('sign')}
            className={clsx(
              'flex-1 py-1.5 rounded text-sm font-medium transition-colors',
              signAction === 'sign'
                ? 'bg-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Sign
          </Button>
          <Button
            variant="ghost"
            onClick={() => setSignAction('verify')}
            className={clsx(
              'flex-1 py-1.5 rounded text-sm font-medium transition-colors',
              signAction === 'verify'
                ? 'bg-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Verify
          </Button>
        </div>
      </div>

      {/* Sign/Verify flow hint */}
      <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 border border-border">
        {signAction === 'sign' ? (
          <>
            <span className="font-semibold text-foreground">Sign:</span> Takes a{' '}
            <span className="font-medium">private key</span> + data file and produces a{' '}
            <span className="font-medium">signature</span> file.
          </>
        ) : (
          <>
            <span className="font-semibold text-foreground">Verify:</span> Takes a{' '}
            <span className="font-medium">public key</span> + data file +{' '}
            <span className="font-medium">signature</span> file and confirms authenticity.
          </>
        )}
      </div>

      <div className="space-y-3">
        <span className="text-xs text-muted-foreground block">Hash Algorithm</span>
        <FilterDropdown
          selectedId={sigHashAlgo}
          onSelect={(id) => setSigHashAlgo(id)}
          items={[
            { id: 'sha256', label: 'SHA-256' },
            { id: 'sha384', label: 'SHA-384' },
            { id: 'sha512', label: 'SHA-512' },
            { id: 'sha3-256', label: 'SHA3-256' },
            { id: 'sha3-384', label: 'SHA3-384' },
            { id: 'sha3-512', label: 'SHA3-512' },
            { id: 'raw', label: 'RAW (Pre-hashed Input)' },
          ]}
          defaultLabel="Select Hash Algorithm"
          noContainer
        />
      </div>

      {sigHashAlgo === 'raw' && (
        <div className="space-y-3 pt-2 border-t border-border">
          <span className="text-xs font-bold text-primary block">Raw Input Options</span>

          <div className="space-y-1">
            <label htmlFor="manual-hash" className="text-xs text-muted-foreground block">
              Manual Hash Hex (32 bytes)
            </label>
            <textarea
              id="manual-hash"
              value={manualHashHex}
              onChange={(e) => setManualHashHex(e.target.value)}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm font-mono text-foreground outline-none focus:border-primary resize-none h-20"
              placeholder="e.g. 0x1234..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="use-rawin"
              type="checkbox"
              checked={useRawIn}
              onChange={(e) => setUseRawIn(e.target.checked)}
              className="w-4 h-4 rounded border-input bg-background text-primary focus:ring-0 focus:ring-offset-0"
            />
            <label
              htmlFor="use-rawin"
              className="text-sm text-muted-foreground cursor-pointer select-none"
            >
              Use <code className="text-primary">-rawin</code> flag (OpenSSL v3+)
            </label>
          </div>

          <div className="text-[10px] text-muted-foreground pl-1">
            {(() => {
              let hex = manualHashHex.trim()
              if (hex.startsWith('0x') || hex.startsWith('0X')) hex = hex.slice(2)
              const clean = hex.replace(/[^0-9a-fA-F]/g, '')
              const bytes = clean.length / 2
              if (clean.length === 0) return <span>Empty input</span>
              if (clean.length % 2 !== 0)
                return <span className="text-status-warning">Invalid odd-length hex string</span>
              return (
                <span>
                  Binary Size: <span className="text-primary font-mono">{bytes} bytes</span> (fed as
                  manual_input.bin)
                </span>
              )
            })()}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <span className="text-xs text-muted-foreground block">Key File</span>
        <FilterDropdown
          selectedId={selectedKeyFile}
          onSelect={(id) => setSelectedKeyFile(id)}
          items={files
            .filter(
              (f) => f.name.endsWith('.key') || f.name.endsWith('.pem') || f.name.endsWith('.pub')
            )
            .map((f) => ({ id: f.name, label: f.name }))}
          defaultLabel={
            signAction === 'sign' ? 'Select Private Key...' : 'Select Public/Private Key...'
          }
          noContainer
        />
      </div>

      {sigHashAlgo !== 'raw' && (
        <div className="space-y-3">
          <span className="text-xs text-muted-foreground block">Data File (to sign/verify)</span>
          <FilterDropdown
            selectedId={selectedDataFile}
            onSelect={(id) => setSelectedDataFile(id)}
            items={files.map((f) => ({ id: f.name, label: f.name }))}
            defaultLabel="Select Data File..."
            noContainer
          />
        </div>
      )}

      <div className="space-y-3">
        <label htmlFor="sig-file-input" className="text-xs text-muted-foreground block">
          Signature File
        </label>
        {signAction === 'sign' ? (
          <input
            id="sig-file-input"
            type="text"
            value={selectedSigFile}
            onChange={(e) => setSelectedSigFile(e.target.value)}
            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            placeholder="signature.sig"
          />
        ) : (
          <FilterDropdown
            selectedId={selectedSigFile}
            onSelect={(id) => setSelectedSigFile(id)}
            items={files
              .filter((f) => f.name.endsWith('.sig'))
              .map((f) => ({ id: f.name, label: f.name }))}
            defaultLabel="Select Signature File..."
            noContainer
          />
        )}
      </div>
    </div>
  )
}

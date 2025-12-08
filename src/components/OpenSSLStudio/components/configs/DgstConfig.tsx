import React from 'react'
import clsx from 'clsx'
import { useOpenSSLStore } from '../../store'

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
  setUseRawIn
}) => {
  const { files } = useOpenSSLStore()

  return (
    <div className="space-y-4 animate-fade-in">
      <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider block">
        2. Configuration
      </span>

      <div className="space-y-3">
        <span className="text-xs text-muted-foreground block">Action</span>
        <div className="flex bg-black/40 rounded-lg p-1 border border-white/20">
          <button
            onClick={() => setSignAction('sign')}
            className={clsx(
              'flex-1 py-1.5 rounded text-sm font-medium transition-colors',
              signAction === 'sign'
                ? 'bg-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Sign
          </button>
          <button
            onClick={() => setSignAction('verify')}
            className={clsx(
              'flex-1 py-1.5 rounded text-sm font-medium transition-colors',
              signAction === 'verify'
                ? 'bg-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Verify
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <label htmlFor="hash-select" className="text-xs text-muted-foreground block">
          Hash Algorithm
        </label>
        <select
          id="hash-select"
          value={sigHashAlgo}
          onChange={(e) => setSigHashAlgo(e.target.value)}
          className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="sha256">SHA-256</option>
          <option value="sha384">SHA-384</option>
          <option value="sha512">SHA-512</option>
          <option value="sha3-256">SHA3-256</option>
          <option value="sha3-384">SHA3-384</option>
          <option value="sha3-512">SHA3-512</option>
          <option value="raw">RAW (Pre-hashed Input)</option>
        </select>
      </div>

      {sigHashAlgo === 'raw' && (
        <div className="space-y-3 animate-fade-in border-l-2 border-primary/50 pl-3">
          <span className="text-xs font-bold text-primary block">Raw Input Options</span>

          <div className="space-y-1">
            <label htmlFor="manual-hash" className="text-xs text-muted-foreground block">
              Manual Hash Hex (32 bytes)
            </label>
            <textarea
              id="manual-hash"
              value={manualHashHex}
              onChange={(e) => setManualHashHex(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm font-mono text-foreground outline-none focus:border-primary resize-none h-20"
              placeholder="e.g. 0x1234..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="use-rawin"
              type="checkbox"
              checked={useRawIn}
              onChange={(e) => setUseRawIn(e.target.checked)}
              className="rounded border-white/20 bg-black/40 text-primary focus:ring-primary"
            />
            <label htmlFor="use-rawin" className="text-sm text-muted-foreground cursor-pointer select-none">
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
              if (clean.length % 2 !== 0) return <span className="text-amber-500">Invalid odd-length hex string</span>
              return <span>Binary Size: <span className="text-primary font-mono">{bytes} bytes</span> (fed as manual_input.bin)</span>
            })()}
          </div>
        </div>
      )
      }

      <div className="space-y-3">
        <label htmlFor="key-select" className="text-xs text-muted-foreground block">
          Key File
        </label>
        <select
          id="key-select"
          value={selectedKeyFile}
          onChange={(e) => setSelectedKeyFile(e.target.value)}
          className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="">
            {signAction === 'sign' ? 'Select Private Key...' : 'Select Public/Private Key...'}
          </option>
          {files
            .filter(
              (f) => f.name.endsWith('.key') || f.name.endsWith('.pem') || f.name.endsWith('.pub')
            )
            .map((f) => (
              <option key={f.name} value={f.name}>
                {f.name}
              </option>
            ))}
        </select>
      </div>

      {
        sigHashAlgo !== 'raw' && (
          <div className="space-y-3">
            <label htmlFor="data-select" className="text-xs text-muted-foreground block">
              Data File (to sign/verify)
            </label>
            <select
              id="data-select"
              value={selectedDataFile}
              onChange={(e) => setSelectedDataFile(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            >
              <option value="">Select Data File...</option>
              {files.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        )
      }

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
            className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            placeholder="signature.sig"
          />
        ) : (
          <select
            id="sig-file-input"
            value={selectedSigFile}
            onChange={(e) => setSelectedSigFile(e.target.value)}
            className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="">Select Signature File...</option>
            {files
              .filter((f) => f.name.endsWith('.sig'))
              .map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
          </select>
        )}
      </div>
    </div >
  )
}

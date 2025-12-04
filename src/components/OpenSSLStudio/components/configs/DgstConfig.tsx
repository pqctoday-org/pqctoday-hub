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
}) => {
  const { files } = useOpenSSLStore()

  return (
    <div className="space-y-4 animate-fade-in">
      <span className="text-sm font-bold text-muted uppercase tracking-wider block">
        2. Configuration
      </span>

      <div className="space-y-3">
        <span className="text-xs text-muted block">Action</span>
        <div className="flex bg-black/40 rounded-lg p-1 border border-white/20">
          <button
            onClick={() => setSignAction('sign')}
            className={clsx(
              'flex-1 py-1.5 rounded text-sm font-medium transition-colors',
              signAction === 'sign' ? 'bg-primary text-white' : 'text-muted hover:text-white'
            )}
          >
            Sign
          </button>
          <button
            onClick={() => setSignAction('verify')}
            className={clsx(
              'flex-1 py-1.5 rounded text-sm font-medium transition-colors',
              signAction === 'verify' ? 'bg-primary text-white' : 'text-muted hover:text-white'
            )}
          >
            Verify
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <label htmlFor="hash-select" className="text-xs text-muted block">
          Hash Algorithm
        </label>
        <select
          id="hash-select"
          value={sigHashAlgo}
          onChange={(e) => setSigHashAlgo(e.target.value)}
          className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
        >
          <option value="sha256">SHA-256</option>
          <option value="sha384">SHA-384</option>
          <option value="sha512">SHA-512</option>
          <option value="sha3-256">SHA3-256</option>
          <option value="sha3-384">SHA3-384</option>
          <option value="sha3-512">SHA3-512</option>
        </select>
      </div>

      <div className="space-y-3">
        <label htmlFor="key-select" className="text-xs text-muted block">
          Key File
        </label>
        <select
          id="key-select"
          value={selectedKeyFile}
          onChange={(e) => setSelectedKeyFile(e.target.value)}
          className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
        >
          <option value="">
            {signAction === 'sign' ? 'Select Private Key...' : 'Select Public/Private Key...'}
          </option>
          {files
            .filter((f) => f.name.endsWith('.key') || f.name.endsWith('.pem'))
            .map((f) => (
              <option key={f.name} value={f.name}>
                {f.name}
              </option>
            ))}
        </select>
      </div>

      <div className="space-y-3">
        <label htmlFor="data-select" className="text-xs text-muted block">
          Data File (to sign/verify)
        </label>
        <select
          id="data-select"
          value={selectedDataFile}
          onChange={(e) => setSelectedDataFile(e.target.value)}
          className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
        >
          <option value="">Select Data File...</option>
          {files.map((f) => (
            <option key={f.name} value={f.name}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <label htmlFor="sig-file-input" className="text-xs text-muted block">
          Signature File
        </label>
        {signAction === 'sign' ? (
          <input
            id="sig-file-input"
            type="text"
            value={selectedSigFile}
            onChange={(e) => setSelectedSigFile(e.target.value)}
            className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
            placeholder="signature.sig"
          />
        ) : (
          <select
            id="sig-file-input"
            value={selectedSigFile}
            onChange={(e) => setSelectedSigFile(e.target.value)}
            className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
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
    </div>
  )
}

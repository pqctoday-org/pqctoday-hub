import React from 'react'
import clsx from 'clsx'
import { useOpenSSLStore } from '../../store'

interface KemConfigProps {
  kemAction: 'encap' | 'decap'
  setKemAction: (value: 'encap' | 'decap') => void
  kemKeyFile: string
  setKemKeyFile: (value: string) => void
  kemInFile: string
  setKemInFile: (value: string) => void
  kemOutFile: string
  setKemOutFile: (value: string) => void
}

export const KemConfig: React.FC<KemConfigProps> = ({
  kemAction,
  setKemAction,
  kemKeyFile,
  setKemKeyFile,
  kemInFile,
  setKemInFile,
  kemOutFile,
  setKemOutFile,
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
            onClick={() => setKemAction('encap')}
            className={clsx(
              'flex-1 py-1.5 rounded text-sm font-medium transition-colors',
              kemAction === 'encap'
                ? 'bg-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Encapsulate
          </button>
          <button
            onClick={() => setKemAction('decap')}
            className={clsx(
              'flex-1 py-1.5 rounded text-sm font-medium transition-colors',
              kemAction === 'decap'
                ? 'bg-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Decapsulate
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <label htmlFor="kem-key-select" className="text-xs text-muted-foreground block">
          Key File
        </label>
        <select
          id="kem-key-select"
          value={kemKeyFile}
          onChange={(e) => setKemKeyFile(e.target.value)}
          className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="">
            {kemAction === 'encap' ? 'Select Public Key...' : 'Select Private Key...'}
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

      {kemAction === 'decap' && (
        <div className="space-y-3">
          <label htmlFor="kem-infile-select" className="text-xs text-muted-foreground block">
            Ciphertext File (Input)
          </label>
          <select
            id="kem-infile-select"
            value={kemInFile}
            onChange={(e) => setKemInFile(e.target.value)}
            className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="">Select Ciphertext...</option>
            {files.map((f) => (
              <option key={f.name} value={f.name}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-3">
        <label htmlFor="kem-outfile-input" className="text-xs text-muted-foreground block">
          Output File (Optional)
        </label>
        <input
          id="kem-outfile-input"
          type="text"
          value={kemOutFile}
          onChange={(e) => setKemOutFile(e.target.value)}
          className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          placeholder={kemAction === 'encap' ? 'ciphertext.bin' : 'secret.bin'}
        />
      </div>
    </div>
  )
}

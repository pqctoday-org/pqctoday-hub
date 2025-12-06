import React from 'react'
import clsx from 'clsx'
import { useOpenSSLStore } from '../../store'

interface EncConfigProps {
  encAction: 'encrypt' | 'decrypt'
  setEncAction: (value: 'encrypt' | 'decrypt') => void
  encCipher: string
  setEncCipher: (value: string) => void
  encInFile: string
  setEncInFile: (value: string) => void
  encOutFile: string
  setEncOutFile: (value: string) => void
  encShowIV: boolean
  setEncShowIV: (value: boolean) => void
  encCustomIV: string
  setEncCustomIV: (value: string) => void
  passphrase: string
  setPassphrase: (value: string) => void
}

export const EncConfig: React.FC<EncConfigProps> = ({
  encAction,
  setEncAction,
  encCipher,
  setEncCipher,
  encInFile,
  setEncInFile,
  encOutFile,
  setEncOutFile,
  encShowIV,
  setEncShowIV,
  encCustomIV,
  setEncCustomIV,
  passphrase,
  setPassphrase,
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
            onClick={() => setEncAction('encrypt')}
            className={clsx(
              'flex-1 py-1.5 rounded text-sm font-medium transition-colors',
              encAction === 'encrypt'
                ? 'bg-primary/20 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Encrypt
          </button>
          <button
            onClick={() => setEncAction('decrypt')}
            className={clsx(
              'flex-1 py-1.5 rounded text-sm font-medium transition-colors',
              encAction === 'decrypt'
                ? 'bg-primary/20 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Decrypt
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <label htmlFor="enc-cipher-select" className="text-xs text-muted-foreground block">
          Cipher
        </label>
        <select
          id="enc-cipher-select"
          value={encCipher}
          onChange={(e) => setEncCipher(e.target.value)}
          className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="aes-128-cbc">AES-128-CBC</option>
          <option value="aes-192-cbc">AES-192-CBC</option>
          <option value="aes-256-cbc">AES-256-CBC</option>
          <option value="aes-128-ctr">AES-128-CTR</option>
          <option value="aes-192-ctr">AES-192-CTR</option>
          <option value="aes-256-ctr">AES-256-CTR</option>
        </select>
      </div>

      <div className="space-y-3">
        <label htmlFor="enc-infile-select" className="text-xs text-muted-foreground block">
          Input File
        </label>
        <select
          id="enc-infile-select"
          value={encInFile}
          onChange={(e) => setEncInFile(e.target.value)}
          className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="">Select a file...</option>
          {files.map((f) => (
            <option key={f.name} value={f.name}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <label htmlFor="enc-pass-input" className="text-xs text-muted-foreground block">
          Passphrase
        </label>
        <input
          id="enc-pass-input"
          type="password"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          placeholder="Enter encryption password"
        />
      </div>

      <div className="space-y-3">
        <label htmlFor="enc-outfile-input" className="text-xs text-muted-foreground block">
          Output File (Optional)
        </label>
        <input
          id="enc-outfile-input"
          type="text"
          value={encOutFile}
          onChange={(e) => setEncOutFile(e.target.value)}
          className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          placeholder={encAction === 'encrypt' ? 'data.enc' : 'data.dec.txt'}
        />
      </div>

      <div className="space-y-3 pt-2 border-t border-white/10">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={encShowIV}
            onChange={(e) => setEncShowIV(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-black/40 text-primary focus:ring-0 focus:ring-offset-0"
          />
          <span className="text-sm text-foreground">Show Derived Key & IV (-p)</span>
        </label>
      </div>

      <div className="space-y-3">
        <label htmlFor="enc-iv-input" className="text-xs text-muted-foreground block">
          Custom IV (Hex, Optional)
        </label>
        <input
          id="enc-iv-input"
          type="text"
          value={encCustomIV}
          onChange={(e) => setEncCustomIV(e.target.value)}
          className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          placeholder="e.g. 0102030405060708..."
        />
      </div>
    </div>
  )
}

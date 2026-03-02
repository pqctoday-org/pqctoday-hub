// SPDX-License-Identifier: GPL-3.0-only
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
  kemSecretFile: string
  setKemSecretFile: (value: string) => void
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
  kemSecretFile,
  setKemSecretFile,
}) => {
  const { files } = useOpenSSLStore()

  return (
    <div className="space-y-4 animate-fade-in">
      <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider block">
        2. Configuration
      </span>

      <div className="space-y-3">
        <span className="text-xs text-muted-foreground block">Action</span>
        <div className="flex bg-background rounded-lg p-1 border border-input">
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

      {/* KEM flow hint */}
      <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 border border-border">
        {kemAction === 'encap' ? (
          <>
            <span className="font-semibold text-foreground">Encapsulate:</span> Takes a{' '}
            <span className="font-medium">public key</span> and produces a{' '}
            <span className="font-medium">ciphertext</span> +{' '}
            <span className="font-medium">shared secret</span>.
          </>
        ) : (
          <>
            <span className="font-semibold text-foreground">Decapsulate:</span> Takes a{' '}
            <span className="font-medium">private key</span> + the{' '}
            <span className="font-medium">ciphertext</span> from encapsulation and recovers the{' '}
            <span className="font-medium">shared secret</span>.
          </>
        )}
      </div>

      <div className="space-y-3">
        <label htmlFor="kem-key-select" className="text-xs text-muted-foreground block">
          {kemAction === 'encap' ? 'Public Key' : 'Private Key'}
        </label>
        <select
          id="kem-key-select"
          value={kemKeyFile}
          onChange={(e) => setKemKeyFile(e.target.value)}
          className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="">
            {kemAction === 'encap' ? 'Select Public Key (.pub)...' : 'Select Private Key (.key)...'}
          </option>
          {files
            .filter((f) => {
              if (kemAction === 'encap') {
                return f.name.endsWith('.pub') || f.name.endsWith('.pem')
              }
              return f.name.endsWith('.key') || f.name.endsWith('.pem')
            })
            .map((f) => (
              <option key={f.name} value={f.name}>
                {f.name}
              </option>
            ))}
        </select>
      </div>

      {kemAction === 'encap' && (
        <>
          <div className="space-y-3">
            <label htmlFor="kem-outfile-input" className="text-xs text-muted-foreground block">
              Ciphertext Output
            </label>
            <input
              id="kem-outfile-input"
              type="text"
              value={kemOutFile}
              onChange={(e) => setKemOutFile(e.target.value)}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              placeholder="ciphertext.bin"
            />
          </div>

          <div className="space-y-3">
            <label htmlFor="kem-secretfile-input" className="text-xs text-muted-foreground block">
              Shared Secret Output
            </label>
            <input
              id="kem-secretfile-input"
              type="text"
              value={kemSecretFile}
              onChange={(e) => setKemSecretFile(e.target.value)}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              placeholder="secret.bin"
            />
          </div>
        </>
      )}

      {kemAction === 'decap' && (
        <>
          <div className="space-y-3">
            <label htmlFor="kem-infile-select" className="text-xs text-muted-foreground block">
              Ciphertext Input
            </label>
            <select
              id="kem-infile-select"
              value={kemInFile}
              onChange={(e) => setKemInFile(e.target.value)}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            >
              <option value="">Select Ciphertext (from encapsulation)...</option>
              {files
                .filter((f) => !f.name.endsWith('.key') && !f.name.endsWith('.pub'))
                .map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-3">
            <label htmlFor="kem-outfile-input" className="text-xs text-muted-foreground block">
              Shared Secret Output
            </label>
            <input
              id="kem-outfile-input"
              type="text"
              value={kemOutFile}
              onChange={(e) => setKemOutFile(e.target.value)}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              placeholder="secret.bin"
            />
          </div>
        </>
      )}
    </div>
  )
}

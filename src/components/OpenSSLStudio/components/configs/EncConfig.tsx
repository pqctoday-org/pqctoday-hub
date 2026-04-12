// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import clsx from 'clsx'
import { useOpenSSLStore } from '../../store'
import { InlineTooltip } from '../../../PKILearning/modules/DigitalAssets/components/InfoTooltip'
import { CRYPTO_TOOLTIPS } from '../../../PKILearning/modules/DigitalAssets/utils/cryptoConstants'
import { FilterDropdown } from '../../../common/FilterDropdown'
import { Button } from '@/components/ui/button'

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
        <div className="flex bg-background rounded-lg p-1 border border-input">
          <Button
            variant="ghost"
            onClick={() => setEncAction('encrypt')}
            className={clsx(
              'flex-1 py-1.5 rounded text-sm font-medium transition-colors',
              encAction === 'encrypt'
                ? 'bg-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Encrypt
          </Button>
          <Button
            variant="ghost"
            onClick={() => setEncAction('decrypt')}
            className={clsx(
              'flex-1 py-1.5 rounded text-sm font-medium transition-colors',
              encAction === 'decrypt'
                ? 'bg-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Decrypt
          </Button>
        </div>
      </div>

      {/* Encrypt/Decrypt flow hint */}
      <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 border border-border">
        {encAction === 'encrypt' ? (
          <>
            <span className="font-semibold text-foreground">Encrypt:</span> Takes a{' '}
            <span className="font-medium">plaintext</span> file + cipher + passphrase and produces{' '}
            <span className="font-medium">ciphertext</span>. The passphrase is derived into a key
            via PBKDF2.
          </>
        ) : (
          <>
            <span className="font-semibold text-foreground">Decrypt:</span> Takes{' '}
            <span className="font-medium">ciphertext</span> + the same cipher + passphrase and
            recovers the <span className="font-medium">original plaintext</span>.
          </>
        )}
      </div>

      <div className="space-y-3">
        <span className="text-xs text-muted-foreground block">Cipher</span>
        <FilterDropdown
          selectedId={encCipher}
          onSelect={(id) => setEncCipher(id)}
          items={[
            { id: 'aes-128-cbc', label: 'AES-128-CBC' },
            { id: 'aes-192-cbc', label: 'AES-192-CBC' },
            { id: 'aes-256-cbc', label: 'AES-256-CBC' },
            { id: 'aes-128-ctr', label: 'AES-128-CTR' },
            { id: 'aes-192-ctr', label: 'AES-192-CTR' },
            { id: 'aes-256-ctr', label: 'AES-256-CTR' },
          ]}
          defaultLabel="Select Cipher"
          noContainer
        />
      </div>

      <div className="space-y-3">
        <span className="text-xs text-muted-foreground block">Input File</span>
        <FilterDropdown
          selectedId={encInFile}
          onSelect={(id) => setEncInFile(id)}
          items={files.map((f) => ({ id: f.name, label: f.name }))}
          defaultLabel="Select a file..."
          noContainer
        />
      </div>

      <div className="space-y-3">
        <label
          htmlFor="enc-pass-input"
          className="text-xs text-muted-foreground flex items-center gap-1"
        >
          Passphrase (
          <InlineTooltip content={CRYPTO_TOOLTIPS.pbkdf2.description}>
            <span className="text-primary hover:underline cursor-help">PBKDF2</span>
          </InlineTooltip>
          Seed)
        </label>
        <input
          id="enc-pass-input"
          type="password"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
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
          className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          placeholder={encAction === 'encrypt' ? 'data.enc' : 'data.dec.txt'}
        />
      </div>

      <div className="space-y-3 pt-2 border-t border-border">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={encShowIV}
            onChange={(e) => setEncShowIV(e.target.checked)}
            className="w-4 h-4 rounded border-input bg-background text-primary focus:ring-0 focus:ring-offset-0"
          />
          <span className="text-sm text-foreground flex items-center gap-2">
            Show Derived Key & IV (-p)
          </span>
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
          maxLength={32}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9a-fA-F]/g, '')
            setEncCustomIV(val)
          }}
          className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary font-mono"
          placeholder="e.g. 0102030405060708..."
        />
        {encCustomIV.length > 0 && encCustomIV.length !== 32 && (
          <p className="text-[10px] text-status-warning">
            Warning: AES (128/192/256) requires a 16-byte IV (32 hex characters). Current length:{' '}
            {encCustomIV.length} chars.
          </p>
        )}
      </div>
    </div>
  )
}

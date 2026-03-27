// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Key } from 'lucide-react'
import { FilterDropdown } from '../../../common/FilterDropdown'

interface KdfConfigProps {
  kdfAlgo: string
  setKdfAlgo: (value: string) => void
  kdfKeyLen: string
  setKdfKeyLen: (value: string) => void
  kdfOutFile: string
  setKdfOutFile: (value: string) => void
  kdfBinary: boolean
  setKdfBinary: (value: boolean) => void
  kdfDigest: string
  setKdfDigest: (value: string) => void
  kdfPass: string
  setKdfPass: (value: string) => void
  kdfSalt: string
  setKdfSalt: (value: string) => void
  kdfIter: string
  setKdfIter: (value: string) => void
  kdfInfo: string
  setKdfInfo: (value: string) => void
  kdfSecret: string
  setKdfSecret: (value: string) => void
  kdfScryptN: string
  setKdfScryptN: (value: string) => void
  kdfScryptR: string
  setKdfScryptR: (value: string) => void
  kdfScryptP: string
  setKdfScryptP: (value: string) => void
}

export const KdfConfig: React.FC<KdfConfigProps> = ({
  kdfAlgo,
  setKdfAlgo,
  kdfKeyLen,
  setKdfKeyLen,
  kdfOutFile,
  setKdfOutFile,
  kdfBinary,
  setKdfBinary,
  kdfDigest,
  setKdfDigest,
  kdfPass,
  setKdfPass,
  kdfSalt,
  setKdfSalt,
  kdfIter,
  setKdfIter,
  kdfInfo,
  setKdfInfo,
  kdfSecret,
  setKdfSecret,
  kdfScryptN,
  setKdfScryptN,
  kdfScryptR,
  setKdfScryptR,
  kdfScryptP,
  setKdfScryptP,
}) => {
  return (
    <div className="space-y-4 animate-fade-in">
      <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider block">
        2. Configuration
      </span>

      <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-3">
        <div className="flex gap-2 text-secondary mb-1">
          <Key size={16} className="shrink-0 mt-0.5" />
          <span className="text-sm font-bold">Key Derivation (KDF)</span>
        </div>
        <p className="text-xs text-muted-foreground pl-6">
          Derive keys from passwords or secrets using various algorithms.
        </p>
      </div>

      {/* Algorithm Selection */}
      <div className="space-y-3">
        <span className="text-xs text-muted-foreground block">KDF Algorithm</span>
        <FilterDropdown
          selectedId={kdfAlgo}
          onSelect={(id) => setKdfAlgo(id)}
          items={[
            { id: 'HKDF', label: 'HKDF' },
            { id: 'PBKDF2', label: 'PBKDF2' },
            { id: 'SCRYPT', label: 'SCRYPT' },
            { id: 'SSKDF', label: 'SSKDF' },
          ]}
          defaultLabel="Select KDF Algorithm"
          noContainer
        />
      </div>

      {/* Common Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-3">
          <label htmlFor="kdf-keylen" className="text-xs text-muted-foreground block">
            Output Length (bytes)
          </label>
          <input
            id="kdf-keylen"
            type="number"
            value={kdfKeyLen}
            onChange={(e) => setKdfKeyLen(e.target.value)}
            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
        <div className="space-y-3">
          <div className="h-[22px]" /> {/* Spacer to align with label above */}
          <div className="flex items-center gap-2 h-[38px]">
            <input
              type="checkbox"
              id="kdf-binary"
              checked={kdfBinary}
              onChange={(e) => setKdfBinary(e.target.checked)}
              className="rounded border-input bg-background text-primary focus:ring-primary"
            />
            <label htmlFor="kdf-binary" className="text-sm text-foreground cursor-pointer">
              Binary Output
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label htmlFor="kdf-out" className="text-xs text-muted-foreground block">
          Output File (Optional)
        </label>
        <input
          id="kdf-out"
          type="text"
          value={kdfOutFile}
          onChange={(e) => setKdfOutFile(e.target.value)}
          placeholder="derived_key.bin"
          className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Algorithm Specific Options */}
      <div className="pt-2 border-t border-border mt-4">
        <span className="text-xs font-bold text-muted-foreground block mb-3">
          Algorithm Options (-kdfopt)
        </span>

        {/* Digest (HKDF, PBKDF2, SSKDF) */}
        {['HKDF', 'PBKDF2', 'SSKDF'].includes(kdfAlgo) && (
          <div className="space-y-3 mb-4">
            <span className="text-xs text-muted-foreground block">Digest Algorithm</span>
            <FilterDropdown
              selectedId={kdfDigest}
              onSelect={(id) => setKdfDigest(id)}
              items={[
                { id: 'SHA256', label: 'SHA256' },
                { id: 'SHA384', label: 'SHA384' },
                { id: 'SHA512', label: 'SHA512' },
                { id: 'SHA3-256', label: 'SHA3-256' },
              ]}
              defaultLabel="Select Digest"
              noContainer
            />
          </div>
        )}

        {/* Key/Secret (HKDF, SSKDF) */}
        {['HKDF', 'SSKDF'].includes(kdfAlgo) && (
          <div className="space-y-3 mb-4">
            <label htmlFor="kdf-secret" className="text-xs text-muted-foreground block">
              Secret / Key (hex)
            </label>
            <input
              id="kdf-secret"
              type="text"
              value={kdfSecret}
              onChange={(e) => setKdfSecret(e.target.value)}
              placeholder="001122..."
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/50 font-mono"
            />
          </div>
        )}

        {/* Password (PBKDF2, SCRYPT) */}
        {['PBKDF2', 'SCRYPT'].includes(kdfAlgo) && (
          <div className="space-y-3 mb-4">
            <label htmlFor="kdf-pass" className="text-xs text-muted-foreground block">
              Password
            </label>
            <input
              id="kdf-pass"
              type="password"
              value={kdfPass}
              onChange={(e) => setKdfPass(e.target.value)}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
        )}

        {/* Salt (All) */}
        <div className="space-y-3 mb-4">
          <label htmlFor="kdf-salt" className="text-xs text-muted-foreground block">
            Salt (hex)
          </label>
          <input
            id="kdf-salt"
            type="text"
            value={kdfSalt}
            onChange={(e) => setKdfSalt(e.target.value)}
            placeholder="aabbcc..."
            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/50 font-mono"
          />
        </div>

        {/* Info (HKDF, SSKDF) */}
        {['HKDF', 'SSKDF'].includes(kdfAlgo) && (
          <div className="space-y-3 mb-4">
            <label htmlFor="kdf-info" className="text-xs text-muted-foreground block">
              Info (hex)
            </label>
            <input
              id="kdf-info"
              type="text"
              value={kdfInfo}
              onChange={(e) => setKdfInfo(e.target.value)}
              placeholder="deadbeef..."
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/50 font-mono"
            />
          </div>
        )}

        {/* Iterations (PBKDF2) */}
        {kdfAlgo === 'PBKDF2' && (
          <div className="space-y-3 mb-4">
            <label htmlFor="kdf-iter" className="text-xs text-muted-foreground block">
              Iterations
            </label>
            <input
              id="kdf-iter"
              type="number"
              value={kdfIter}
              onChange={(e) => setKdfIter(e.target.value)}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
        )}

        {/* Scrypt Options */}
        {kdfAlgo === 'SCRYPT' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
            <div className="space-y-3">
              <label htmlFor="kdf-n" className="text-xs text-muted-foreground block">
                N (Cost)
              </label>
              <input
                id="kdf-n"
                type="number"
                value={kdfScryptN}
                onChange={(e) => setKdfScryptN(e.target.value)}
                placeholder="1024"
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-3">
              <label htmlFor="kdf-r" className="text-xs text-muted-foreground block">
                r (Block)
              </label>
              <input
                id="kdf-r"
                type="number"
                value={kdfScryptR}
                onChange={(e) => setKdfScryptR(e.target.value)}
                placeholder="8"
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-3">
              <label htmlFor="kdf-p" className="text-xs text-muted-foreground block">
                p (Parallel)
              </label>
              <input
                id="kdf-p"
                type="number"
                value={kdfScryptP}
                onChange={(e) => setKdfScryptP(e.target.value)}
                placeholder="1"
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

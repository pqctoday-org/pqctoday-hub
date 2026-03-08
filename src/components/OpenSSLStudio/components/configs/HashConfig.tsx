// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { useOpenSSLStore } from '../../store'
import { FilterDropdown } from '../../../common/FilterDropdown'

interface HashConfigProps {
  hashAlgo: string
  setHashAlgo: (value: string) => void
  hashInFile: string
  setHashInFile: (value: string) => void
  hashOutFile: string
  setHashOutFile: (value: string) => void
  hashBinary: boolean
  setHashBinary: (value: boolean) => void
}

export const HashConfig: React.FC<HashConfigProps> = ({
  hashAlgo,
  setHashAlgo,
  hashInFile,
  setHashInFile,
  hashOutFile,
  setHashOutFile,
  hashBinary,
  setHashBinary,
}) => {
  const { files } = useOpenSSLStore()

  return (
    <div className="space-y-4 animate-fade-in">
      <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider block">
        2. Configuration
      </span>

      <div className="space-y-3">
        <span className="text-xs text-muted-foreground block">Hash Algorithm</span>
        <FilterDropdown
          selectedId={hashAlgo}
          onSelect={(id) => setHashAlgo(id)}
          items={[
            { id: 'sha256', label: 'SHA-256' },
            { id: 'sha384', label: 'SHA-384' },
            { id: 'sha512', label: 'SHA-512' },
            { id: 'sha3-256', label: 'SHA3-256' },
            { id: 'ripemd160', label: 'RIPEMD-160' },
          ]}
          defaultLabel="Select Hash Algorithm"
          noContainer
        />
        <div className="text-[10px] text-muted-foreground pl-1">
          {hashAlgo === 'sha256' && '32 bytes (256 bits) - Bitcoin, Ethereum, General Purpose'}
          {hashAlgo === 'sha384' && '48 bytes (384 bits) - High Security Applications'}
          {hashAlgo === 'sha512' && '64 bytes (512 bits) - Solana, HD Wallets'}
          {hashAlgo === 'sha3-256' && '32 bytes (256 bits) - NIST SHA-3 Standard'}
          {hashAlgo === 'ripemd160' && '20 bytes (160 bits) - Bitcoin Hash160'}
        </div>
      </div>

      <div className="space-y-3">
        <span className="text-xs text-muted-foreground block">Input File</span>
        <FilterDropdown
          selectedId={hashInFile}
          onSelect={(id) => setHashInFile(id)}
          items={files.map((f) => ({ id: f.name, label: f.name }))}
          defaultLabel="Select a file..."
          noContainer
        />
      </div>

      <div className="space-y-3">
        <label htmlFor="hash-outfile-input" className="text-xs text-muted-foreground block">
          Output File (Optional)
        </label>
        <input
          id="hash-outfile-input"
          type="text"
          value={hashOutFile}
          onChange={(e) => setHashOutFile(e.target.value)}
          className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          placeholder={`${hashInFile || 'data'}.${hashAlgo}.${hashBinary ? 'bin' : 'txt'}`}
        />
      </div>

      <div className="space-y-3 pt-2 border-t border-border">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={hashBinary}
            onChange={(e) => setHashBinary(e.target.checked)}
            className="w-4 h-4 rounded border-input bg-background text-primary focus:ring-0 focus:ring-offset-0"
          />
          <span className="text-sm text-foreground">Binary Output (-binary)</span>
        </label>
        <div className="text-[10px] text-muted-foreground pl-6">
          {hashBinary
            ? 'Output raw binary hash (for piping to other commands)'
            : 'Output hex-encoded hash (human-readable)'}
        </div>
      </div>
    </div>
  )
}

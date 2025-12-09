import React from 'react'
import { useOpenSSLStore } from '../../store'

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
        <label htmlFor="hash-algo-select" className="text-xs text-muted-foreground block">
          Hash Algorithm
        </label>
        <select
          id="hash-algo-select"
          value={hashAlgo}
          onChange={(e) => setHashAlgo(e.target.value)}
          className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="sha256">SHA-256</option>
          <option value="sha384">SHA-384</option>
          <option value="sha512">SHA-512</option>
          <option value="sha3-256">SHA3-256</option>
          <option value="ripemd160">RIPEMD-160</option>
        </select>
        <div className="text-[10px] text-muted-foreground pl-1">
          {hashAlgo === 'sha256' && '32 bytes (256 bits) - Bitcoin, Ethereum, General Purpose'}
          {hashAlgo === 'sha384' && '48 bytes (384 bits) - High Security Applications'}
          {hashAlgo === 'sha512' && '64 bytes (512 bits) - Solana, HD Wallets'}
          {hashAlgo === 'sha3-256' && '32 bytes (256 bits) - NIST SHA-3 Standard'}
          {hashAlgo === 'ripemd160' && '20 bytes (160 bits) - Bitcoin Hash160'}
        </div>
      </div>

      <div className="space-y-3">
        <label htmlFor="hash-infile-select" className="text-xs text-muted-foreground block">
          Input File
        </label>
        <select
          id="hash-infile-select"
          value={hashInFile}
          onChange={(e) => setHashInFile(e.target.value)}
          className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
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

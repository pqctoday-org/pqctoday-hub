// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Link } from 'react-router-dom'
import { FilterDropdown } from '../../../common/FilterDropdown'

interface GenPkeyConfigProps {
  keyAlgo: string
  setKeyAlgo: (value: string) => void
  keyBits: string
  setKeyBits: (value: string) => void
  curve: string
  setCurve: (value: string) => void
  cipher: string
  setCipher: (value: string) => void
  passphrase: string
  setPassphrase: (value: string) => void
}

const PQC_ALGO_REFS: Record<string, { label: string; ref: string }> = {
  mlkem: { label: 'FIPS 203 (ML-KEM)', ref: 'FIPS%20203' },
  mldsa: { label: 'FIPS 204 (ML-DSA)', ref: 'FIPS%20204' },
  slhdsa: { label: 'FIPS 205 (SLH-DSA)', ref: 'FIPS%20205' },
}

export const GenPkeyConfig: React.FC<GenPkeyConfigProps> = ({
  keyAlgo,
  setKeyAlgo,
  keyBits,
  setKeyBits,
  curve,
  setCurve,
  cipher,
  setCipher,
  passphrase,
  setPassphrase,
}) => {
  const pqcRef = Object.entries(PQC_ALGO_REFS).find(([prefix]) => keyAlgo.startsWith(prefix))?.[1]

  return (
    <div className="space-y-4 animate-fade-in">
      <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider block">
        2. Configuration
      </span>

      <div className="space-y-3">
        <span className="text-xs text-muted-foreground block">Algorithm</span>
        <FilterDropdown
          selectedId={keyAlgo}
          onSelect={(id) => setKeyAlgo(id)}
          items={[
            { id: 'rsa', label: 'RSA' },
            { id: 'ec', label: 'Elliptic Curve (EC)' },
            { id: 'ed25519', label: 'Ed25519' },
            { id: 'ed448', label: 'Ed448' },
            { id: 'x25519', label: 'X25519' },
            { id: 'x448', label: 'X448' },
            { id: 'mlkem512', label: 'ML-KEM-512' },
            { id: 'mlkem768', label: 'ML-KEM-768' },
            { id: 'mlkem1024', label: 'ML-KEM-1024' },
            { id: 'mldsa44', label: 'ML-DSA-44' },
            { id: 'mldsa65', label: 'ML-DSA-65' },
            { id: 'mldsa87', label: 'ML-DSA-87' },
            { id: 'slhdsa128s', label: 'SLH-DSA-SHA2-128s' },
            { id: 'slhdsa128f', label: 'SLH-DSA-SHA2-128f' },
            { id: 'slhdsa192s', label: 'SLH-DSA-SHA2-192s' },
            { id: 'slhdsa192f', label: 'SLH-DSA-SHA2-192f' },
            { id: 'slhdsa256s', label: 'SLH-DSA-SHA2-256s' },
            { id: 'slhdsa256f', label: 'SLH-DSA-SHA2-256f' },
            { id: 'slhdsashake128s', label: 'SLH-DSA-SHAKE-128s' },
            { id: 'slhdsashake128f', label: 'SLH-DSA-SHAKE-128f' },
            { id: 'slhdsashake192s', label: 'SLH-DSA-SHAKE-192s' },
            { id: 'slhdsashake192f', label: 'SLH-DSA-SHAKE-192f' },
            { id: 'slhdsashake256s', label: 'SLH-DSA-SHAKE-256s' },
            { id: 'slhdsashake256f', label: 'SLH-DSA-SHAKE-256f' },
          ]}
          defaultLabel="Select Algorithm"
          noContainer
        />
        {pqcRef && (
          <p className="text-[10px] text-muted-foreground">
            Standard:{' '}
            <Link
              to={`/library?ref=${pqcRef.ref}`}
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {pqcRef.label} &rarr;
            </Link>
          </p>
        )}
      </div>

      {keyAlgo === 'rsa' && (
        <div className="space-y-3">
          <span className="text-xs text-muted-foreground block">Key Size (Bits)</span>
          <FilterDropdown
            selectedId={keyBits}
            onSelect={(id) => setKeyBits(id)}
            items={[
              { id: '2048', label: '2048' },
              { id: '3072', label: '3072' },
              { id: '4096', label: '4096' },
            ]}
            defaultLabel="Select Key Size"
            noContainer
          />
        </div>
      )}

      {keyAlgo === 'ec' && (
        <div className="space-y-3">
          <span className="text-xs text-muted-foreground block">Curve</span>
          <FilterDropdown
            selectedId={curve}
            onSelect={(id) => setCurve(id)}
            items={[
              { id: 'P-256', label: 'P-256' },
              { id: 'P-384', label: 'P-384' },
              { id: 'P-521', label: 'P-521' },
              { id: 'secp256k1', label: 'secp256k1' },
            ]}
            defaultLabel="Select Curve"
            noContainer
          />
        </div>
      )}

      <div className="space-y-3">
        <span className="text-xs text-muted-foreground block">Encryption (Optional)</span>
        <FilterDropdown
          selectedId={cipher}
          onSelect={(id) => setCipher(id)}
          items={[
            { id: 'none', label: 'None (Unencrypted)' },
            { id: 'aes-128-cbc', label: 'AES-128-CBC' },
            { id: 'aes-256-cbc', label: 'AES-256-CBC' },
            { id: 'des3', label: 'Triple DES' },
          ]}
          defaultLabel="Select Encryption"
          noContainer
        />
      </div>

      {cipher !== 'none' && (
        <div className="space-y-3">
          <label htmlFor="passphrase-input" className="text-xs text-muted-foreground block">
            Passphrase
          </label>
          <input
            id="passphrase-input"
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
      )}
    </div>
  )
}

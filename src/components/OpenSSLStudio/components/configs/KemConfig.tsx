// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { useOpenSSLStore } from '../../store'
import { FilterDropdown } from '../../../common/FilterDropdown'
import { Button } from '@/components/ui/button'

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

      {/* PQC context */}
      <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 border border-border space-y-1">
        <p>
          <span className="font-semibold text-foreground">Why KEM for PQC?</span> Classical
          Diffie-Hellman and RSA key exchange are broken by Shor&apos;s algorithm on a
          cryptographically relevant quantum computer. ML-KEM (FIPS 203) replaces them with a
          lattice-based Key Encapsulation Mechanism that is quantum-resistant.
        </p>
        <p>
          The immediate threat is{' '}
          <span className="font-semibold text-foreground">harvest now, decrypt later</span> —
          adversaries storing encrypted traffic today to decrypt once a quantum computer exists.
          Migrating key exchange to ML-KEM protects forward secrecy now.
        </p>
        <p className="pt-0.5">
          <span className="font-semibold text-foreground">Error hint:</span>{' '}
          <code className="bg-muted px-1 rounded">no such algorithm: ML-KEM-768</code> means the
          OpenSSL build lacks the PQC provider. This WASM build includes it.
        </p>
        <p className="pt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
          <Link
            to="/library?ref=FIPS%20203"
            className="text-primary hover:underline font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            FIPS 203 (ML-KEM) →
          </Link>
          <Link
            to="/library?ref=NIST%20SP%20800-227"
            className="text-primary hover:underline font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            NIST SP 800-227 (KEM Guidance) →
          </Link>
        </p>
      </div>

      <div className="space-y-3">
        <span className="text-xs text-muted-foreground block">Action</span>
        <div className="flex bg-background rounded-lg p-1 border border-input">
          <Button
            variant="ghost"
            onClick={() => setKemAction('encap')}
            className={clsx(
              'flex-1 py-1.5 rounded text-sm font-medium transition-colors',
              kemAction === 'encap'
                ? 'bg-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Encapsulate
          </Button>
          <Button
            variant="ghost"
            onClick={() => setKemAction('decap')}
            className={clsx(
              'flex-1 py-1.5 rounded text-sm font-medium transition-colors',
              kemAction === 'decap'
                ? 'bg-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Decapsulate
          </Button>
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
        <label className="text-xs text-muted-foreground block">
          {kemAction === 'encap' ? 'Public Key' : 'Private Key'}
        </label>
        <FilterDropdown
          selectedId={kemKeyFile}
          onSelect={(id) => setKemKeyFile(id)}
          items={files
            .filter((f) => {
              if (kemAction === 'encap') {
                return f.name.endsWith('.pub') || f.name.endsWith('.pem')
              }
              return f.name.endsWith('.key') || f.name.endsWith('.pem')
            })
            .map((f) => ({ id: f.name, label: f.name }))}
          defaultLabel={
            kemAction === 'encap' ? 'Select Public Key (.pub)...' : 'Select Private Key (.key)...'
          }
          noContainer
        />
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
            <span className="text-xs text-muted-foreground block">Ciphertext Input</span>
            <FilterDropdown
              selectedId={kemInFile}
              onSelect={(id) => setKemInFile(id)}
              items={files
                .filter((f) => !f.name.endsWith('.key') && !f.name.endsWith('.pub'))
                .map((f) => ({ id: f.name, label: f.name }))}
              defaultLabel="Select Ciphertext (from encapsulation)..."
              noContainer
            />
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

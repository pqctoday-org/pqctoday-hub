// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Loader2, KeyRound, CheckCircle2, AlertTriangle } from 'lucide-react'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { Button } from '@/components/ui/button'
import { CopyableOutput } from '@/components/ui/CopyableOutput'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { ML_DSA_ALG, EE_KEY_PATH } from '../constants'

interface KeyGenStepProps {
  onKeyReady: (algorithm: string, keyPem: Uint8Array) => void
}

const ALG_ITEMS = [
  { id: 'ML-DSA-44', label: 'ML-DSA-44 (NIST Cat 2)' },
  { id: 'ML-DSA-65', label: 'ML-DSA-65 (NIST Cat 3) — recommended' },
  { id: 'ML-DSA-87', label: 'ML-DSA-87 (NIST Cat 5)' },
  { id: 'ML-KEM-512', label: 'ML-KEM-512 (NIST Cat 1)' },
  { id: 'ML-KEM-768', label: 'ML-KEM-768 (NIST Cat 3)' },
  { id: 'ML-KEM-1024', label: 'ML-KEM-1024 (NIST Cat 5)' },
]

export const KeyGenStep: React.FC<KeyGenStepProps> = ({ onKeyReady }) => {
  const [algorithm, setAlgorithm] = useState<string>(ML_DSA_ALG)
  const [busy, setBusy] = useState(false)
  const [keyPem, setKeyPem] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setBusy(true)
    setError(null)
    setKeyPem(null)
    try {
      const result = await openSSLService.execute(
        `openssl genpkey -algorithm ${algorithm} -out ${EE_KEY_PATH}`
      )
      if (result.error) {
        throw new Error(result.error)
      }
      const fileName = EE_KEY_PATH.replace(/^\//, '')
      const keyFile = result.files.find((f) => f.name === fileName)
      if (!keyFile) {
        throw new Error('No key file produced (check OpenSSL stderr)')
      }
      const pem = new TextDecoder().decode(keyFile.data)
      setKeyPem(pem)
      onKeyReady(algorithm, keyFile.data)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        <div className="space-y-1">
          <FilterDropdown
            label="Algorithm"
            items={ALG_ITEMS}
            selectedId={algorithm}
            onSelect={(v) => setAlgorithm(v)}
            defaultLabel="Select algorithm"
          />
        </div>
        <Button
          variant="gradient"
          onClick={handleGenerate}
          disabled={busy}
          className="flex items-center gap-2"
        >
          {busy ? <Loader2 className="animate-spin" size={16} /> : <KeyRound size={16} />}
          {busy ? 'Generating…' : 'Generate keypair (OpenSSL WASM)'}
        </Button>
      </div>

      {error && (
        <div className="rounded border border-status-error/30 bg-status-error/10 p-3 text-sm text-status-error flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <pre className="whitespace-pre-wrap font-mono text-xs">{error}</pre>
        </div>
      )}

      {keyPem && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-status-success text-sm">
            <CheckCircle2 size={16} />
            <span>
              Keypair ready: <strong>{algorithm}</strong> written to{' '}
              <code className="text-xs">{EE_KEY_PATH}</code>
            </span>
          </div>
          <details className="rounded border border-border bg-muted/30 p-3">
            <summary className="cursor-pointer text-sm font-medium text-foreground">
              Inspect PEM
            </summary>
            <div className="mt-2">
              <CopyableOutput
                value={keyPem}
                label="Private Key PEM"
                rows={5}
                downloadFilename="ee-key.pem"
                className="text-[10px]"
              />
            </div>
          </details>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Educational use only — generated keys never leave the browser and are not certified for
        production. Real CA enrollment requires a vetted HSM and audited issuance pipeline.
      </p>
    </div>
  )
}

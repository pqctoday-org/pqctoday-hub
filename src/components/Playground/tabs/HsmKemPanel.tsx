// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useHsmContext } from '../hsm/HsmContext'
import { Button } from '../../ui/button'
import { ErrorAlert } from '../../ui/error-alert'
import {
  hsm_generateMLKEMKeyPair,
  hsm_encapsulate,
  hsm_decapsulate,
  hsm_extractKeyValue,
  hsm_importMLKEMPublicKey,
} from '../../../wasm/softhsm'

// ── HSM KEM Panel ─────────────────────────────────────────────────────────────

const KEM_SIZES: Record<512 | 768 | 1024, { pub: number; ct: number; ss: number }> = {
  512: { pub: 800, ct: 768, ss: 32 },
  768: { pub: 1184, ct: 1088, ss: 32 },
  1024: { pub: 1568, ct: 1568, ss: 32 },
}

const toHexSnippet = (b: Uint8Array) => {
  const h = Array.from(b)
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')
  return h.length > 40 ? `${h.slice(0, 20)}…${h.slice(-8)}` : h
}

const arraysEqual = (a: Uint8Array, b: Uint8Array) => {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}
export const HsmKemPanel: React.FC = () => {
  const { moduleRef, crossCheckModuleRef, hSessionRef, isReady, addHsmKey, engineMode, addHsmLog } =
    useHsmContext()

  const [variant, setVariant] = useState<512 | 768 | 1024>(768)
  const [extractable, setExtractable] = useState(false)
  const [handles, setHandles] = useState<{ pub: number; priv: number } | null>(null)
  const [ciphertext, setCiphertext] = useState<Uint8Array | null>(null)
  const [secret1, setSecret1] = useState<Uint8Array | null>(null)
  const [secret2, setSecret2] = useState<Uint8Array | null>(null)
  const [loadingOp, setLoadingOp] = useState<string | null>(null)
  const [kemError, setKemError] = useState<string | null>(null)

  const anyLoading = loadingOp !== null

  const changeVariant = (v: 512 | 768 | 1024) => {
    setVariant(v)
    setHandles(null)
    setCiphertext(null)
    setSecret1(null)
    setSecret2(null)
    setKemError(null)
  }

  const withLoading = async (op: string, fn: () => Promise<void>) => {
    setLoadingOp(op)
    try {
      await fn()
    } finally {
      setLoadingOp(null)
    }
  }

  const doGenKeyPair = () =>
    withLoading('gen', async () => {
      setKemError(null)
      setCiphertext(null)
      setSecret1(null)
      setSecret2(null)
      try {
        const M = moduleRef.current
        if (!M) throw new Error('Module not loaded — complete Token Setup first')
        const { pubHandle, privHandle } = hsm_generateMLKEMKeyPair(
          M,
          hSessionRef.current,
          variant,
          extractable
        )
        setHandles({ pub: pubHandle, priv: privHandle })
        const ts = new Date().toLocaleTimeString([], {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
        addHsmKey({
          handle: pubHandle,
          family: 'ml-kem',
          role: 'public',
          label: `ML-KEM-${variant} Public Key`,
          variant: String(variant),
          generatedAt: ts,
        })
        addHsmKey({
          handle: privHandle,
          family: 'ml-kem',
          role: 'private',
          label: `ML-KEM-${variant} Private Key${extractable ? ' (extractable)' : ''}`,
          variant: String(variant),
          generatedAt: ts,
        })
      } catch (e) {
        setKemError(String(e))
      }
    })

  const doEncapsulate = () =>
    withLoading('enc', async () => {
      setKemError(null)
      setSecret1(null)
      setSecret2(null)
      try {
        const M = moduleRef.current!
        const { ciphertextBytes, secretHandle } = hsm_encapsulate(
          M,
          hSessionRef.current,
          handles!.pub,
          variant
        )
        const ss = hsm_extractKeyValue(M, hSessionRef.current, secretHandle)
        setCiphertext(ciphertextBytes)
        setSecret1(ss)

        // Dual-engine parity: C++ encapsulates, Rust decapsulates (cross-engine interop test)
        if (engineMode === 'dual' && crossCheckModuleRef.current) {
          const checkM = crossCheckModuleRef.current
          try {
            // 1. Export pub key from C++ and import into Rust
            const pubBytes = hsm_extractKeyValue(M, hSessionRef.current, handles!.pub)
            const rustPub = hsm_importMLKEMPublicKey(checkM, hSessionRef.current, variant, pubBytes)
            // 2. Rust encapsulates using C++ public key
            const rustResult = hsm_encapsulate(checkM, hSessionRef.current, rustPub, variant)
            const rustSecret = hsm_extractKeyValue(
              checkM,
              hSessionRef.current,
              rustResult.secretHandle
            )
            // 3. C++ decapsulates Rust's ciphertext using C++ private key
            const cppDecapHandle = hsm_decapsulate(
              M,
              hSessionRef.current,
              handles!.priv,
              rustResult.ciphertextBytes,
              variant
            )
            const cppDecapSecret = hsm_extractKeyValue(M, hSessionRef.current, cppDecapHandle)
            // 4. Verify secrets match
            if (!arraysEqual(rustSecret, cppDecapSecret)) {
              setKemError(
                'Dual-Engine Parity Failure: Rust encapsulation secret ≠ C++ decapsulation secret'
              )
            } else {
              addHsmLog({
                id: Math.floor(Math.random() * 1_000_000),
                timestamp: new Date().toISOString().slice(11, 19),
                fn: 'Dual-Engine Parity',
                rvName: 'SUCCESS',
                rvHex: '0x00000000',
                ms: 0,
                ok: true,
                engineName: 'dual',
                args: 'Rust Encapsulate × C++ Decapsulate → secrets match',
              })
            }
          } catch (e) {
            setKemError('Cross-check failed: ' + String(e))
          }
        }
      } catch (e) {
        setKemError(String(e))
      }
    })

  const doDecapsulate = () =>
    withLoading('dec', async () => {
      setKemError(null)
      setSecret2(null)
      try {
        const M = moduleRef.current!
        const ssH2 = hsm_decapsulate(M, hSessionRef.current, handles!.priv, ciphertext!, variant)
        const ss2 = hsm_extractKeyValue(M, hSessionRef.current, ssH2)
        setSecret2(ss2)

        // Dual-engine parity: C++ encapsulates → Rust decapsulates (reverse interop direction)
        // ML-KEM private keys are non-extractable, so we use a fresh Rust keypair for this direction
        if (engineMode === 'dual' && crossCheckModuleRef.current) {
          const checkM = crossCheckModuleRef.current
          try {
            // 1. Generate fresh Rust keypair
            const { pubHandle: rustPub, privHandle: rustPriv } = hsm_generateMLKEMKeyPair(
              checkM,
              hSessionRef.current,
              variant
            )
            // 2. Export Rust pub key → import into C++
            const rustPubBytes = hsm_extractKeyValue(checkM, hSessionRef.current, rustPub)
            const cppImportedPub = hsm_importMLKEMPublicKey(
              M,
              hSessionRef.current,
              variant,
              rustPubBytes
            )
            // 3. C++ encapsulates using Rust's public key
            const cppResult = hsm_encapsulate(M, hSessionRef.current, cppImportedPub, variant)
            const cppSecret = hsm_extractKeyValue(M, hSessionRef.current, cppResult.secretHandle)
            // 4. Rust decapsulates C++'s ciphertext using Rust's private key
            const rustDecapH = hsm_decapsulate(
              checkM,
              hSessionRef.current,
              rustPriv,
              cppResult.ciphertextBytes,
              variant
            )
            const rustSecret = hsm_extractKeyValue(checkM, hSessionRef.current, rustDecapH)
            // 5. Verify secrets match
            if (!arraysEqual(cppSecret, rustSecret)) {
              setKemError(
                'Dual-Engine Parity Failure: C++ encapsulation secret ≠ Rust decapsulation secret'
              )
            } else {
              addHsmLog({
                id: Math.floor(Math.random() * 1_000_000),
                timestamp: new Date().toISOString().slice(11, 19),
                fn: 'Dual-Engine Parity',
                rvName: 'SUCCESS',
                rvHex: '0x00000000',
                ms: 0,
                ok: true,
                engineName: 'dual',
                args: 'C++ Encapsulate × Rust Decapsulate → secrets match',
              })
            }
          } catch (e) {
            setKemError('Cross-check failed: ' + String(e))
          }
        }
      } catch (e) {
        setKemError(String(e))
      }
    })

  const secretsMatch = secret1 && secret2 ? arraysEqual(secret1, secret2) : null

  return (
    <div className={`space-y-4 ${!isReady ? 'opacity-60 pointer-events-none' : ''}`}>
      {!isReady && (
        <div className="glass-panel p-3 text-sm text-muted-foreground">
          Complete Token Setup in the Key Store tab first.
        </div>
      )}

      <div className="glass-panel p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-semibold text-sm">ML-KEM Key Encapsulation (FIPS 203)</h3>
          <div className="flex gap-1">
            {([512, 768, 1024] as const).map((v) => (
              <Button
                key={v}
                variant="ghost"
                size="sm"
                disabled={anyLoading}
                onClick={() => changeVariant(v)}
                className={
                  variant === v
                    ? 'bg-primary/20 text-primary text-xs px-2 py-1 h-auto'
                    : 'text-muted-foreground text-xs px-2 py-1 h-auto'
                }
              >
                ML-KEM-{v}
              </Button>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground font-mono">
          pub: {KEM_SIZES[variant].pub} B · ct: {KEM_SIZES[variant].ct} B · ss:{' '}
          {KEM_SIZES[variant].ss} B
        </p>

        <div className="flex flex-wrap gap-2 items-center">
          <Button variant="outline" size="sm" disabled={anyLoading} onClick={doGenKeyPair}>
            {loadingOp === 'gen' && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            {handles ? '✓ Key Pair' : 'Generate Key Pair'}
          </Button>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={extractable}
              onChange={(e) => setExtractable(e.target.checked)}
              className="accent-primary"
            />
            CKA_EXTRACTABLE
          </label>
          <Button
            variant="outline"
            size="sm"
            disabled={!handles || anyLoading}
            onClick={doEncapsulate}
          >
            {loadingOp === 'enc' && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            Encapsulate
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!ciphertext || anyLoading}
            onClick={doDecapsulate}
          >
            {loadingOp === 'dec' && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            Decapsulate
          </Button>
        </div>

        <div className="space-y-1.5 text-xs font-mono">
          {handles && (
            <div className="flex gap-3 text-muted-foreground">
              <span>pubH={handles.pub}</span>
              <span>privH={handles.priv}</span>
            </div>
          )}
          {ciphertext && (
            <div className="flex gap-3 bg-muted rounded px-2 py-1">
              <span className="text-muted-foreground w-20 shrink-0">Ciphertext</span>
              <span className="truncate">{toHexSnippet(ciphertext)}</span>
              <span className="text-muted-foreground shrink-0">{ciphertext.length} B</span>
            </div>
          )}
          {secret1 && (
            <div className="flex gap-3 bg-muted rounded px-2 py-1">
              <span className="text-muted-foreground w-20 shrink-0">SS₁ (enc)</span>
              <span className="truncate">{toHexSnippet(secret1)}</span>
              <span className="text-muted-foreground shrink-0">{secret1.length} B</span>
            </div>
          )}
          {secret2 && (
            <div className="flex gap-3 bg-muted rounded px-2 py-1">
              <span className="text-muted-foreground w-20 shrink-0">SS₂ (dec)</span>
              <span className="truncate">{toHexSnippet(secret2)}</span>
              <span className="text-muted-foreground shrink-0">{secret2.length} B</span>
            </div>
          )}
          {secretsMatch !== null && (
            <div
              className={`flex items-center gap-2 rounded px-2 py-1 ${secretsMatch ? 'bg-status-success/10 text-status-success' : 'bg-status-error/10 text-status-error'}`}
            >
              {secretsMatch ? <CheckCircle size={13} /> : <XCircle size={13} />}
              {secretsMatch ? 'Shared secrets match — KEM successful' : 'Mismatch — secrets differ'}
            </div>
          )}
        </div>

        {kemError && <ErrorAlert message={kemError} />}
      </div>
    </div>
  )
}

// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { Lock, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '../../ui/button'
import { ErrorAlert } from '../../ui/error-alert'
import { useHsmContext } from './HsmContext'
import { HsmReadyGuard, HsmResultRow, toHex, hexSnippet } from './shared'
import {
  hsm_generateMLKEMKeyPair,
  hsm_encapsulate,
  hsm_decapsulate,
  hsm_extractKeyValue,
} from '../../../wasm/softhsm'
import {
  hsm_generateFrodoKEMKeyPair,
  hsm_encapsulateFrodoKEM,
  hsm_decapsulateFrodoKEM,
  hsm_generateClassicMcElieceKeyPair,
  hsm_encapsulateClassicMcEliece,
  hsm_decapsulateClassicMcEliece,
} from '../../../wasm/softhsm/pqc'
import { useEffect } from 'react'

/** ML-KEM has 3 parameter-set variants of ONE algorithm; the vendor KEMs
 * (BSI TR-02102-1) are each a single fixed preset — Rust engine only, not
 * implemented in the C++ engine at all. */
type KemFamily = 'ml-kem' | 'frodo-kem' | 'classic-mceliece'

const labelFor = (fam: KemFamily, v: 512 | 768 | 1024): string =>
  fam === 'ml-kem'
    ? `ML-KEM-${v}`
    : fam === 'frodo-kem'
      ? 'FrodoKEM-1344-AES'
      : 'Classic-McEliece-6688128'

export const HsmKemPanel = ({
  initialAlgo,
  onAlgoChange,
}: { initialAlgo?: string; onAlgoChange?: (algo: string) => void } = {}) => {
  const { moduleRef, hSessionRef, registerKey, engineMode, isReady } = useHsmContext()
  const [family, setFamily] = useState<KemFamily>(() => {
    if (initialAlgo?.startsWith('FrodoKEM')) return 'frodo-kem'
    if (initialAlgo?.startsWith('Classic-McEliece')) return 'classic-mceliece'
    return 'ml-kem'
  })
  const [variant, setVariant] = useState<512 | 768 | 1024>(() => {
    if (initialAlgo === 'ML-KEM-512') return 512
    if (initialAlgo === 'ML-KEM-1024') return 1024
    return 768
  })
  const [pubHandle, setPubHandle] = useState<number | null>(null)
  const [privHandle, setPrivHandle] = useState<number | null>(null)
  const [ciphertext, setCiphertext] = useState<Uint8Array | null>(null)
  const [encapSecret, setEncapSecret] = useState<Uint8Array | null>(null)
  const [decapSecret, setDecapSecret] = useState<Uint8Array | null>(null)
  const [loadingOp, setLoadingOp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkLoading = loadingOp !== null
  const vendorKemUnavailable = family !== 'ml-kem' && engineMode !== 'rust'

  const resetResults = () => {
    setPubHandle(null)
    setPrivHandle(null)
    setCiphertext(null)
    setEncapSecret(null)
    setDecapSecret(null)
  }

  const withLoading = async (op: string, fn: () => Promise<void> | void) => {
    setLoadingOp(op)
    setError(null)
    try {
      await fn()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoadingOp(null)
    }
  }

  const familyLabel = labelFor(family, variant)

  const doGenKey = () =>
    withLoading('gen', () => {
      const M = moduleRef.current!
      const hSession = hSessionRef.current
      const { pubHandle, privHandle } =
        family === 'ml-kem'
          ? hsm_generateMLKEMKeyPair(M, hSession, variant)
          : family === 'frodo-kem'
            ? hsm_generateFrodoKEMKeyPair(M, hSession)
            : hsm_generateClassicMcElieceKeyPair(M, hSession)

      setPubHandle(pubHandle)
      setPrivHandle(privHandle)
      setCiphertext(null)
      setEncapSecret(null)
      setDecapSecret(null)

      const ts = new Date().toLocaleTimeString([], { hour12: false })
      const engineLabel = engineMode === 'rust' ? 'rust' : 'cpp'
      registerKey(M, hSession, {
        handle: pubHandle,
        family,
        role: 'public',
        label: `${familyLabel} Public`,
        variant: family === 'ml-kem' ? String(variant) : familyLabel,
        engine: engineLabel,
        generatedAt: ts,
      })
      registerKey(M, hSession, {
        handle: privHandle,
        family,
        role: 'private',
        label: `${familyLabel} Private`,
        variant: family === 'ml-kem' ? String(variant) : familyLabel,
        engine: engineLabel,
        generatedAt: ts,
      })
    })

  const doEncap = () =>
    withLoading('encap', () => {
      const M = moduleRef.current!
      const result =
        family === 'ml-kem'
          ? hsm_encapsulate(M, hSessionRef.current, pubHandle!, variant)
          : family === 'frodo-kem'
            ? hsm_encapsulateFrodoKEM(M, hSessionRef.current, pubHandle!)
            : hsm_encapsulateClassicMcEliece(M, hSessionRef.current, pubHandle!)
      const rawSecret = hsm_extractKeyValue(M, hSessionRef.current, result.secretHandle)
      setCiphertext(result.ciphertextBytes)
      setEncapSecret(rawSecret)
      setDecapSecret(null)
    })

  const doDecap = () =>
    withLoading('decap', () => {
      const M = moduleRef.current!
      const secHandle =
        family === 'ml-kem'
          ? hsm_decapsulate(M, hSessionRef.current, privHandle!, ciphertext!, variant)
          : family === 'frodo-kem'
            ? hsm_decapsulateFrodoKEM(M, hSessionRef.current, privHandle!, ciphertext!)
            : hsm_decapsulateClassicMcEliece(M, hSessionRef.current, privHandle!, ciphertext!)
      const rawSecret = hsm_extractKeyValue(M, hSessionRef.current, secHandle)
      setDecapSecret(rawSecret)
    })

  const isMatch =
    encapSecret &&
    decapSecret &&
    encapSecret.length === decapSecret.length &&
    // eslint-disable-next-line security/detect-object-injection
    encapSecret.every((val, i) => val === decapSecret[i])

  // E2E UI-decoupled Boundaries
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent
      if (ce.detail?.alg) {
        const v =
          ce.detail.alg === 'ML-KEM-1024' ? 1024 : ce.detail.alg === 'ML-KEM-512' ? 512 : 768
        setVariant(v)
        setPubHandle(null)
        setPrivHandle(null)
        // We use setTimeout to ensure React flushes the state above before trying to run doGenKey,
        // otherwise doGenKey will use the stale `variant` closure if this effect fires eagerly.
        // Wait, actually doGenKey relies on `variant` from state which is a closure!
        // We probably need to re-implement doGenKey in the handler.
        withLoading('gen', () => {
          const M = moduleRef.current!
          const { pubHandle, privHandle } = hsm_generateMLKEMKeyPair(M, hSessionRef.current, v)
          setPubHandle(pubHandle)
          setPrivHandle(privHandle)
          setCiphertext(null)
          setEncapSecret(null)
          setDecapSecret(null)

          const pubKeyBytes = hsm_extractKeyValue(M, hSessionRef.current, pubHandle)
          window.dispatchEvent(
            new CustomEvent('e2e:wasm_crypto_result', { detail: { pubKeyBytes } })
          )
        })
      }
    }
    window.addEventListener('e2e:trigger_wasm_keygen', handler)
    return () => window.removeEventListener('e2e:trigger_wasm_keygen', handler)
  }, [moduleRef, hSessionRef])

  return (
    // Same engine-readiness gate every sibling workbench panel uses
    // (symmetric / key_wrap / hashing / sign_verify / key_agree / key_derive):
    // without it, "Generate Key Pair" is clickable before the WASM engine
    // exists and crashes with a raw null-deref on moduleRef.current.
    <HsmReadyGuard isReady={isReady}>
      <div className="space-y-4">
        {/* KEM family */}
        <div className="glass-panel p-4 space-y-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            KEM Algorithm
          </p>
          <div data-tour="pkcs-op-kem-family" className="flex flex-wrap gap-2 items-center">
            {(
              [
                { id: 'ml-kem' as const, label: 'ML-KEM' },
                { id: 'frodo-kem' as const, label: 'FrodoKEM-1344' },
                { id: 'classic-mceliece' as const, label: 'Classic-McEliece-6688128' },
              ] as const
            ).map((f) => (
              <Button
                key={f.id}
                variant="ghost"
                size="sm"
                disabled={checkLoading}
                onClick={() => {
                  setFamily(f.id)
                  resetResults()
                  onAlgoChange?.(labelFor(f.id, variant))
                }}
                title={f.id !== 'ml-kem' ? 'BSI TR-02102-1 — Rust engine only' : undefined}
                className={
                  family === f.id
                    ? 'bg-primary/20 text-primary text-xs min-h-[44px] md:min-h-0 md:h-7 px-3'
                    : 'text-muted-foreground text-xs min-h-[44px] md:min-h-0 md:h-7 px-3'
                }
              >
                {f.label}
                {f.id !== 'ml-kem' && (
                  <span className="ml-1.5 text-[9px] font-semibold uppercase tracking-wide text-status-warning">
                    rust only
                  </span>
                )}
              </Button>
            ))}
          </div>
          {vendorKemUnavailable && (
            <p className="text-xs text-status-warning">
              {familyLabel} isn't implemented in the C++ engine (BSI TR-02102-1 §2.4 — Rust engine
              only). Switch Engine Mode to Rust above to try it.
            </p>
          )}
        </div>

        {/* Parameter Set (ML-KEM variants only) */}
        {family === 'ml-kem' && (
          <div className="glass-panel p-4 space-y-3">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              ML-KEM Parameters
            </p>
            <div data-tour="pkcs-op-kem-set" className="flex flex-wrap gap-2 items-center">
              {([512, 768, 1024] as const).map((v) => (
                <Button
                  key={v}
                  variant="ghost"
                  size="sm"
                  disabled={checkLoading}
                  onClick={() => {
                    setVariant(v)
                    resetResults()
                    onAlgoChange?.(labelFor('ml-kem', v))
                  }}
                  className={
                    variant === v
                      ? 'bg-primary/20 text-primary text-xs min-h-[44px] md:min-h-0 md:h-7 px-3'
                      : 'text-muted-foreground text-xs min-h-[44px] md:min-h-0 md:h-7 px-3'
                  }
                >
                  ML-KEM-{v}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="glass-panel p-4 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <Button
              data-tour="pkcs-op-kem-keygen"
              variant="outline"
              size="sm"
              disabled={checkLoading || vendorKemUnavailable}
              onClick={doGenKey}
              className="h-7 text-xs"
            >
              {loadingOp === 'gen' && <Loader2 size={12} className="mr-1.5 animate-spin" />}
              {pubHandle !== null ? `✓ pub=${pubHandle}, prv=${privHandle}` : 'Generate Key Pair'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            {`C_GenerateKeyPair(${familyLabel}) → { pub: ${pubHandle ?? '?'}, prv: ${privHandle ?? '?'} }`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            data-tour="pkcs-op-kem-encap"
            variant="ghost"
            onClick={doEncap}
            disabled={pubHandle === null || checkLoading || vendorKemUnavailable}
            className="flex-1"
          >
            {loadingOp === 'encap' && <Loader2 size={14} className="mr-2 animate-spin" />}
            <ArrowRight size={14} className="mr-2" /> Encapsulate
          </Button>
          <Button
            data-tour="pkcs-op-kem-decap"
            variant="outline"
            onClick={doDecap}
            disabled={
              ciphertext === null || privHandle === null || checkLoading || vendorKemUnavailable
            }
            className="flex-1"
          >
            {loadingOp === 'decap' && <Loader2 size={14} className="mr-2 animate-spin" />}
            <Lock size={14} className="mr-2" /> Decapsulate
          </Button>
        </div>

        {error && <ErrorAlert message={error} />}

        {(encapSecret || decapSecret) && (
          <div className="glass-panel p-4 space-y-3 mt-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Result
            </p>
            {encapSecret && (
              <>
                <HsmResultRow label="Original Secret" value={toHex(encapSecret)} />
                <HsmResultRow
                  label="Ciphertext snippet"
                  value={`${hexSnippet(ciphertext!, 24)} (${ciphertext!.length} bytes)`}
                />
              </>
            )}

            {decapSecret && (
              <>
                <HsmResultRow label="Recovered Secret" value={toHex(decapSecret)} />
                <div
                  className={`text-xs font-mono px-3 py-2 rounded flex items-center gap-2 ${
                    isMatch
                      ? 'bg-status-success/20 text-status-success'
                      : 'bg-status-error/20 text-status-error'
                  }`}
                >
                  {isMatch ? '✓ Secret Match' : '✗ Secret Mismatch'}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </HsmReadyGuard>
  )
}

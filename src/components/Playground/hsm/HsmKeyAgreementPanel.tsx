// SPDX-License-Identifier: GPL-3.0-only
import { useState, useEffect } from 'react'
import { ArrowLeftRight, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '../../ui/button'
import { ErrorAlert } from '../../ui/error-alert'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { ShareButton } from '../../ui/ShareButton'
import {
  CKD_SHA256_KDF,
  CKD_SHA384_KDF,
  CKD_SHA512_KDF,
  hsm_generateECKeyPair,
  hsm_ecdhDerive,
  hsm_ecdhCofactorDerive,
  hsm_extractKeyValue,
  hsm_extractECPoint,
} from '../../../wasm/softhsm'
import { useHsmContext } from './HsmContext'
import { HsmReadyGuard, HsmResultRow, toHex } from './shared'
import { MiniPkcsLog } from '../components/MiniPkcsLog'

// ── Constants ────────────────────────────────────────────────────────────────

const CKD_NULL = 0x00000001 // raw Z, no KDF

type KaCurve = 'P-256' | 'P-384' | 'P-521'

const KDF_OPTIONS = [
  { label: 'CKD_NULL (raw Z)', value: CKD_NULL },
  { label: 'CKD_SHA256_KDF (X9.63)', value: CKD_SHA256_KDF },
  { label: 'CKD_SHA384_KDF (X9.63)', value: CKD_SHA384_KDF },
  { label: 'CKD_SHA512_KDF (X9.63)', value: CKD_SHA512_KDF },
] as const

// ── Component ────────────────────────────────────────────────────────────────

export const HsmKeyAgreementPanel = ({
  initialAlgo,
  onAlgoChange,
}: { initialAlgo?: string; onAlgoChange?: (algo: string) => void } = {}) => {
  const { moduleRef, hSessionRef, isReady, addHsmKey } = useHsmContext()
  const [curve, setCurve] = useState<KaCurve>(() => {
    if (initialAlgo === 'P-384') return 'P-384'
    if (initialAlgo === 'P-521') return 'P-521'
    return 'P-256'
  })
  // Emit initial algo on mount so URL reflects current selection immediately
  useEffect(() => {
    onAlgoChange?.(curve)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [cofactorMode, setCofactorMode] = useState(false)
  const [kdf, setKdf] = useState<number>(CKD_NULL)

  // Key pair handles
  const [aliceHandles, setAliceHandles] = useState<{ pub: number; priv: number } | null>(null)
  const [bobHandles, setBobHandles] = useState<{ pub: number; priv: number } | null>(null)

  // Derived secrets
  const [aliceSecret, setAliceSecret] = useState<Uint8Array | null>(null)
  const [bobSecret, setBobSecret] = useState<Uint8Array | null>(null)
  const [secretsMatch, setSecretsMatch] = useState<boolean | null>(null)

  const [loadingOp, setLoadingOp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setAliceHandles(null)
    setBobHandles(null)
    setAliceSecret(null)
    setBobSecret(null)
    setSecretsMatch(null)
    setError(null)
  }

  const run = async (label: string, fn: () => void) => {
    setError(null)
    setLoadingOp(label)
    try {
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          try {
            fn()
            resolve()
          } catch (e) {
            setError(e instanceof Error ? e.message : String(e))
            resolve()
          }
        }, 0)
      })
    } finally {
      setLoadingOp(null)
    }
  }

  const handleGenAlice = () =>
    run('Gen Alice', () => {
      const M = moduleRef.current!
      const hSession = hSessionRef.current
      const { pubHandle, privHandle } = hsm_generateECKeyPair(M, hSession, curve, false, 'derive')
      addHsmKey({
        handle: pubHandle,
        family: 'ecdh',
        role: 'public',
        label: `${curve} Public Key (Alice)`,
        generatedAt: new Date().toISOString(),
      })
      addHsmKey({
        handle: privHandle,
        family: 'ecdh',
        role: 'private',
        label: `${curve} Private Key (Alice)`,
        generatedAt: new Date().toISOString(),
      })
      setAliceHandles({ pub: pubHandle, priv: privHandle })
      setBobHandles(null)
      setAliceSecret(null)
      setBobSecret(null)
      setSecretsMatch(null)
    })

  const handleGenBob = () =>
    run('Gen Bob', () => {
      const M = moduleRef.current!
      const hSession = hSessionRef.current
      const { pubHandle, privHandle } = hsm_generateECKeyPair(M, hSession, curve, false, 'derive')
      addHsmKey({
        handle: pubHandle,
        family: 'ecdh',
        role: 'public',
        label: `${curve} Public Key (Bob)`,
        generatedAt: new Date().toISOString(),
      })
      addHsmKey({
        handle: privHandle,
        family: 'ecdh',
        role: 'private',
        label: `${curve} Private Key (Bob)`,
        generatedAt: new Date().toISOString(),
      })
      setBobHandles({ pub: pubHandle, priv: privHandle })
      setAliceSecret(null)
      setBobSecret(null)
      setSecretsMatch(null)
    })

  const handleDerive = () =>
    run('Derive', () => {
      if (!aliceHandles || !bobHandles) return
      const M = moduleRef.current!
      const hSession = hSessionRef.current
      const deriveFn = cofactorMode ? hsm_ecdhCofactorDerive : hsm_ecdhDerive

      // Extract EC points from each peer's public key (CKA_EC_POINT)
      const alicePubPoint = hsm_extractECPoint(M, hSession, aliceHandles.pub)
      const bobPubPoint = hsm_extractECPoint(M, hSession, bobHandles.pub)

      // Alice derives using Bob's public point
      const aliceSecretHandle = deriveFn(M, hSession, aliceHandles.priv, bobPubPoint, kdf)
      const aliceBytes = hsm_extractKeyValue(M, hSession, aliceSecretHandle)

      // Bob derives using Alice's public point
      const bobSecretHandle = deriveFn(M, hSession, bobHandles.priv, alicePubPoint, kdf)
      const bobBytes = hsm_extractKeyValue(M, hSession, bobSecretHandle)

      setAliceSecret(aliceBytes)
      setBobSecret(bobBytes)

      const match =
        aliceBytes.length === bobBytes.length && aliceBytes.every((b, i) => b === bobBytes[i]) // eslint-disable-line security/detect-object-injection
      setSecretsMatch(match)
    })

  const kdfLabel = KDF_OPTIONS.find((o) => o.value === kdf)?.label ?? 'CKD_NULL'
  const mechCode = cofactorMode ? '0x1051' : '0x1050'
  const mechName = cofactorMode ? 'CKM_ECDH1_COFACTOR_DERIVE' : 'CKM_ECDH1_DERIVE'

  return (
    <HsmReadyGuard isReady={isReady}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <ArrowLeftRight size={18} className="text-primary" />
          <h3 className="font-semibold text-foreground">ECDH Key Agreement</h3>
          <div className="ml-auto flex items-center gap-1">
            <ShareButton title="HSM Key Agreement" variant="icon" />
            <span className="text-xs text-muted-foreground">PKCS#11 v3.2 §2.3</span>
          </div>
        </div>

        {/* Config */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Curve */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Curve</p>
            <div className="flex gap-1">
              {(['P-256', 'P-384', 'P-521'] as KaCurve[]).map((c) => (
                <Button
                  variant="ghost"
                  key={c}
                  onClick={() => {
                    setCurve(c)
                    reset()
                    onAlgoChange?.(c)
                  }}
                  className={`flex-1 text-xs rounded-lg px-2 py-2 min-h-[36px] border transition-colors ${
                    curve === c
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>

          {/* KDF */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">KDF</p>
            <FilterDropdown
              items={KDF_OPTIONS.map((o) => ({ id: String(o.value), label: o.label }))}
              selectedId={String(kdf)}
              onSelect={(id) => {
                setKdf(parseInt(id, 10))
                setAliceSecret(null)
                setBobSecret(null)
                setSecretsMatch(null)
              }}
              noContainer
            />
          </div>

          {/* Cofactor toggle */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Mode</p>
            <Button
              variant="ghost"
              onClick={() => {
                setCofactorMode((m) => !m)
                setAliceSecret(null)
                setBobSecret(null)
                setSecretsMatch(null)
              }}
              className={`w-full text-xs rounded-lg px-2 py-1.5 border transition-colors ${
                cofactorMode
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-muted border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {cofactorMode ? 'Cofactor ECDH' : 'Standard ECDH'}
            </Button>
          </div>
        </div>

        {/* PKCS#11 struct info */}
        <div className="bg-muted rounded-lg p-3 text-xs font-mono space-y-0.5 text-muted-foreground">
          <div className="text-foreground font-semibold mb-1">
            CK_ECDH1_DERIVE_PARAMS ({mechName} {mechCode})
          </div>
          <div> kdf = {kdfLabel}</div>
          <div>
            {' '}
            pSharedData = {'{ '}
            {kdf === CKD_NULL ? 'NULL' : 'optional context'}
            {'}'}
          </div>
          <div> pPublicData = &lt;peer EC point, CKA_EC_POINT&gt;</div>
        </div>

        {/* Key generation buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">Alice</p>
            <Button
              variant={aliceHandles ? 'outline' : 'gradient'}
              size="sm"
              className="w-full"
              onClick={handleGenAlice}
              disabled={loadingOp !== null}
            >
              {loadingOp === 'Gen Alice' ? (
                <Loader2 size={14} className="animate-spin mr-1" />
              ) : null}
              {aliceHandles ? `Regen (pub=${aliceHandles.pub})` : 'Gen Key Pair'}
            </Button>
            {aliceHandles && (
              <div className="space-y-1">
                <HsmResultRow label="pub handle" value={`h=${aliceHandles.pub}`} />
                <HsmResultRow label="priv handle" value={`h=${aliceHandles.priv}`} />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">Bob</p>
            <Button
              variant={bobHandles ? 'outline' : 'gradient'}
              size="sm"
              className="w-full"
              onClick={handleGenBob}
              disabled={loadingOp !== null || !aliceHandles}
            >
              {loadingOp === 'Gen Bob' ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              {bobHandles ? `Regen (pub=${bobHandles.pub})` : 'Gen Key Pair'}
            </Button>
            {bobHandles && (
              <div className="space-y-1">
                <HsmResultRow label="pub handle" value={`h=${bobHandles.pub}`} />
                <HsmResultRow label="priv handle" value={`h=${bobHandles.priv}`} />
              </div>
            )}
          </div>
        </div>

        {/* Derive button */}
        <Button
          variant="gradient"
          size="sm"
          className="w-full"
          onClick={handleDerive}
          disabled={!aliceHandles || !bobHandles || loadingOp !== null}
        >
          {loadingOp === 'Derive' ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
          C_DeriveKey — Both Sides
        </Button>

        {/* Results */}
        {aliceSecret && bobSecret && (
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Alice's shared secret ({aliceSecret.length}B)
              </p>
              <HsmResultRow label="Z (hex)" value={toHex(aliceSecret)} />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Bob's shared secret ({bobSecret.length}B)
              </p>
              <HsmResultRow label="Z (hex)" value={toHex(bobSecret)} />
            </div>

            {secretsMatch !== null && (
              <div
                className={`flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2 ${
                  secretsMatch
                    ? 'bg-status-success/10 text-status-success'
                    : 'bg-status-error/10 text-status-error'
                }`}
              >
                {secretsMatch ? (
                  <>
                    <CheckCircle size={16} /> Secrets match — key agreement successful
                  </>
                ) : (
                  <>
                    <XCircle size={16} /> Secrets do NOT match
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <MiniPkcsLog />
        {error && <ErrorAlert message={error} />}

        {/* Educational note */}
        <p className="text-xs text-muted-foreground">
          PKCS#11 v3.2 §2.3: Both parties run{' '}
          <span className="font-mono text-primary">C_DeriveKey({mechName})</span> with their own
          private key and the peer's DER-encoded EC point (CKA_EC_POINT). For NIST P-curves
          (cofactor=1) standard and cofactor modes produce identical shared secrets. CKD_SHA256_KDF
          applies ANSI X9.63 KDF after ECDH, producing a key-derivation output instead of raw Z.
        </p>
      </div>
    </HsmReadyGuard>
  )
}

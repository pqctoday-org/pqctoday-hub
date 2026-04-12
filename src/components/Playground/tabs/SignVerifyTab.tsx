// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useEffect } from 'react'
import { FileSignature, CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { useSettingsContext } from '../contexts/SettingsContext'
import { useKeyStoreContext } from '../contexts/KeyStoreContext'
import { useOperationsContext } from '../contexts/OperationsContext'
import { useHsmContext } from '../hsm/HsmContext'
import { logEvent } from '../../../utils/analytics'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { ErrorAlert } from '../../ui/error-alert'
import { ShareButton } from '../../ui/ShareButton'
import {
  hsm_generateMLDSAKeyPair,
  hsm_sign,
  hsm_verify,
  hsm_extractKeyValue,
  hsm_importMLDSAPublicKey,
  type MLDSASignOptions,
  hsm_generateSLHDSAKeyPair,
  hsm_slhdsaSign,
  hsm_slhdsaVerify,
  hsm_importSLHDSAPublicKey,
  type SLHDSASignOptions,
  type SLHDSAPreHash,
  CKP_SLH_DSA_SHA2_128S,
} from '../../../wasm/softhsm'
import { FilterDropdown } from '../../common/FilterDropdown'
import { HsmClassicalSignPanel } from '../hsm/HsmClassicalSignPanel'
import { HsmReadyGuard } from '../hsm/shared'
import { Pkcs11LogPanel } from '../../shared/Pkcs11LogPanel'
import { HsmKeyInspector } from '../../shared/HsmKeyInspector'
import { SLH_DSA_PARAM_SET_OPTIONS, SLH_DSA_INTERNAL_PARAMS } from './softhsm/SoftHsmUI'

// FIPS 205 §11 HashSLH-DSA approved hash functions only
const FIPS205_SLH_PREHASH_OPTIONS = [
  { id: 'sha256', label: 'SHA-256' },
  { id: 'sha512', label: 'SHA-512' },
  { id: 'shake128', label: 'SHAKE-128' },
  { id: 'shake256', label: 'SHAKE-256' },
] as const

// Helper for Hex/ASCII toggle with editing
const EditableDataDisplay: React.FC<{
  label: string
  value: string
  onChange: (val: string) => void
  placeholder?: string
  readOnly?: boolean
}> = ({ label, value, onChange, placeholder, readOnly }) => {
  const [viewMode, setViewMode] = useState<'hex' | 'ascii'>('ascii') // Default to ASCII for messages usually

  const getDisplayValue = () => {
    if (!value) return ''
    if (viewMode === 'hex') return value
    try {
      let str = ''
      for (let i = 0; i < value.length; i += 2) {
        str += String.fromCharCode(parseInt(value.substr(i, 2), 16))
      }
      return str
    } catch {
      return 'Invalid encoding for ASCII display'
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const input = e.target.value
    if (viewMode === 'hex') {
      // Only allow hex characters
      if (/^[0-9a-fA-F]*$/.test(input)) {
        onChange(input)
      }
    } else {
      // Convert ASCII input to Hex for storage
      let hex = ''
      for (let i = 0; i < input.length; i++) {
        hex += input.charCodeAt(i).toString(16).padStart(2, '0')
      }
      onChange(hex)
    }
  }

  return (
    <div className="mb-4 p-3 bg-muted/40 rounded border border-border text-xs space-y-1 animate-fade-in focus-within:border-primary/50 transition-colors">
      <div className="flex justify-between items-center mb-2">
        <span className="text-muted-foreground font-bold uppercase tracking-wider">{label}</span>
        <Button
          variant="ghost"
          type="button"
          onClick={() => setViewMode((prev) => (prev === 'hex' ? 'ascii' : 'hex'))}
          aria-label={`Switch to ${viewMode === 'hex' ? 'ASCII' : 'HEX'} view`}
          className="text-[10px] flex items-center gap-1 bg-muted hover:bg-accent px-2 py-1 rounded transition-colors text-primary"
        >
          {viewMode === 'hex' ? 'HEX' : 'ASCII'}
        </Button>
      </div>
      {readOnly ? (
        <div className="font-mono text-foreground break-all max-h-24 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
          {getDisplayValue() || placeholder || 'None'}
        </div>
      ) : (
        <textarea
          value={getDisplayValue()}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full bg-transparent border-none text-foreground font-mono text-xs resize-y min-h-[80px] focus:ring-0 p-0 placeholder:text-foreground/20 outline-none"
          spellCheck={false}
        />
      )}
    </div>
  )
}

// ── HSM Sign Panel ────────────────────────────────────────────────────────────

const DSA_SIZES: Record<44 | 65 | 87, { pub: number; sig: number }> = {
  44: { pub: 1312, sig: 2420 },
  65: { pub: 1952, sig: 3293 },
  87: { pub: 2592, sig: 4627 },
}

const toHexSnippetDsa = (b: Uint8Array) => {
  const h = Array.from(b)
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')
  return h.length > 40 ? `${h.slice(0, 20)}…${h.slice(-8)}` : h
}

const HsmSignPanel: React.FC<{ initialAlgo?: string; onAlgoChange?: (algo: string) => void }> = ({
  initialAlgo,
  onAlgoChange,
}) => {
  const { moduleRef, crossCheckModuleRef, hSessionRef, addHsmKey, engineMode, addHsmLog } =
    useHsmContext()

  const [variant, setVariant] = useState<44 | 65 | 87>(() => {
    if (initialAlgo === 'ML-DSA-44') return 44
    if (initialAlgo === 'ML-DSA-87') return 87
    return 65
  })
  const [extractable, setExtractable] = useState(false)
  const [handles, setHandles] = useState<{ pub: number; priv: number } | null>(null)
  const [message, setMessage] = useState('Hello, PQC World!')
  const [signature, setSignature] = useState<Uint8Array | null>(null)
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null)
  const [hedging, setHedging] = useState<'preferred' | 'required' | 'deterministic'>('preferred')
  const [context, setContext] = useState('')
  const [preHash, setPreHash] = useState<'' | 'sha256' | 'sha512' | 'sha3-256'>('')
  const [loadingOp, setLoadingOp] = useState<string | null>(null)
  const [dsaError, setDsaError] = useState<string | null>(null)

  const anyLoading = loadingOp !== null

  const changeVariant = (v: 44 | 65 | 87) => {
    setVariant(v)
    setHandles(null)
    setSignature(null)
    setVerifyResult(null)
    setDsaError(null)
    onAlgoChange?.(`ML-DSA-${v}`)
  }

  const withLoading = async (op: string, fn: () => Promise<void>) => {
    setLoadingOp(op)
    try {
      await fn()
    } finally {
      setLoadingOp(null)
    }
  }

  const buildOpts = (): MLDSASignOptions | undefined => {
    const opts: MLDSASignOptions = {}
    if (hedging !== 'preferred') opts.hedging = hedging
    if (context) opts.context = new TextEncoder().encode(context)
    if (preHash) opts.preHash = preHash
    return Object.keys(opts).length > 0 ? opts : undefined
  }

  const doGenKeyPair = () =>
    withLoading('gen', async () => {
      setDsaError(null)
      setSignature(null)
      setVerifyResult(null)
      try {
        const M = moduleRef.current
        if (!M) throw new Error('Module not loaded — complete Token Setup first')
        const { pubHandle, privHandle } = hsm_generateMLDSAKeyPair(
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
          family: 'ml-dsa',
          role: 'public',
          label: `ML-DSA-${variant} Public Key`,
          variant: String(variant),
          generatedAt: ts,
        })
        addHsmKey({
          handle: privHandle,
          family: 'ml-dsa',
          role: 'private',
          label: `ML-DSA-${variant} Private Key${extractable ? ' (extractable)' : ''}`,
          variant: String(variant),
          generatedAt: ts,
        })
      } catch (e) {
        setDsaError(String(e))
      }
    })

  const doSign = () =>
    withLoading('sign', async () => {
      setDsaError(null)
      setVerifyResult(null)
      try {
        const M = moduleRef.current!
        const sig = hsm_sign(M, hSessionRef.current, handles!.priv, message, buildOpts())
        setSignature(sig)

        // Dual-engine parity: C++ signs, Rust verifies (cross-engine interop test)
        if (engineMode === 'dual' && crossCheckModuleRef.current) {
          const checkM = crossCheckModuleRef.current
          try {
            // 1. Export pub key from C++ and import into Rust
            const pubBytes = hsm_extractKeyValue(M, hSessionRef.current, handles!.pub)
            const rustPub = hsm_importMLDSAPublicKey(checkM, hSessionRef.current, variant, pubBytes)
            // 2. Rust verifies C++ signature
            const checkOk = hsm_verify(
              checkM,
              hSessionRef.current,
              rustPub,
              message,
              sig,
              buildOpts()
            )
            if (!checkOk) {
              setDsaError('Dual-Engine Parity Failure: Rust failed to verify C++ ML-DSA signature')
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
                args: `Rust Verify(C++ ML-DSA-${variant} Signature) → valid`,
              })
            }
          } catch (e) {
            setDsaError('Cross-check failed: ' + String(e))
          }
        }
      } catch (e) {
        setDsaError(String(e))
      }
    })

  const doVerify = () =>
    withLoading('verify', async () => {
      setDsaError(null)
      try {
        const M = moduleRef.current!
        const ok = hsm_verify(
          M,
          hSessionRef.current,
          handles!.pub,
          message,
          signature!,
          buildOpts()
        )
        setVerifyResult(ok)

        // Dual-engine parity: Rust also verifies using imported C++ public key
        if (ok && engineMode === 'dual' && crossCheckModuleRef.current) {
          const checkM = crossCheckModuleRef.current
          try {
            const pubBytes = hsm_extractKeyValue(M, hSessionRef.current, handles!.pub)
            const rustPub = hsm_importMLDSAPublicKey(checkM, hSessionRef.current, variant, pubBytes)
            const checkOk = hsm_verify(
              checkM,
              hSessionRef.current,
              rustPub,
              message,
              signature!,
              buildOpts()
            )
            if (!checkOk) {
              setDsaError('Dual-Engine Parity Failure: Rust failed to verify C++ ML-DSA signature')
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
                args: `Rust Verify(C++ ML-DSA-${variant} Signature) → valid`,
              })
            }
          } catch (e) {
            setDsaError('Cross-check failed: ' + String(e))
          }
        }
      } catch (e) {
        setDsaError(String(e))
      }
    })

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-semibold text-sm">ML-DSA Sign &amp; Verify (FIPS 204)</h3>
          <div className="flex gap-1">
            {([44, 65, 87] as const).map((v) => (
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
                ML-DSA-{v}
              </Button>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground font-mono">
          pub: {DSA_SIZES[variant].pub} B · sig: {DSA_SIZES[variant].sig} B
        </p>

        {/* Message input */}
        <div className="space-y-1.5">
          <label htmlFor="hsm-dsa-message" className="text-xs text-muted-foreground">
            Message
          </label>
          <Input
            id="hsm-dsa-message"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              setSignature(null)
              setVerifyResult(null)
            }}
            className="text-sm font-mono"
            placeholder="Enter message to sign…"
          />
        </div>

        {/* Options */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Hedging:</span>
            <FilterDropdown
              selectedId={hedging}
              onSelect={(id) => setHedging(id as typeof hedging)}
              items={[
                { id: 'preferred', label: 'Preferred' },
                { id: 'required', label: 'Required' },
                { id: 'deterministic', label: 'Deterministic' },
              ]}
              defaultLabel="Preferred"
              noContainer
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Pre-hash:</span>
            <FilterDropdown
              selectedId={preHash || 'All'}
              onSelect={(id) => setPreHash(id === 'All' ? '' : (id as typeof preHash))}
              items={[
                { id: 'sha256', label: 'SHA-256' },
                { id: 'sha512', label: 'SHA-512' },
                { id: 'sha3-256', label: 'SHA3-256' },
              ]}
              defaultLabel="None (pure ML-DSA)"
              noContainer
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="hsm-dsa-context"
                className="text-muted-foreground"
                title="FIPS 204 §5.2: 0–255 bytes. Used to domain-separate signatures across protocols or applications."
              >
                Context:
              </label>
              <Input
                id="hsm-dsa-context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="optional, e.g. app-v1"
                className="h-6 text-xs px-2 w-32"
              />
              <span
                className={`text-[10px] font-mono ${new TextEncoder().encode(context).length > 255 ? 'text-status-error' : 'text-muted-foreground'}`}
              >
                {new TextEncoder().encode(context).length}/255B
              </span>
            </div>
          </div>
        </div>

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
            disabled={
              !handles || anyLoading || (!preHash && new TextEncoder().encode(context).length > 255)
            }
            onClick={doSign}
          >
            {loadingOp === 'sign' && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            Sign
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={
              !signature ||
              anyLoading ||
              (!preHash && new TextEncoder().encode(context).length > 255)
            }
            onClick={doVerify}
          >
            {loadingOp === 'verify' && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            Verify
          </Button>
        </div>

        <div className="space-y-1.5 text-xs font-mono">
          {handles && (
            <div className="flex gap-3 text-muted-foreground">
              <span>pubH={handles.pub}</span>
              <span>privH={handles.priv}</span>
            </div>
          )}
          {signature && (
            <div className="flex gap-3 bg-muted rounded px-2 py-1">
              <span className="text-muted-foreground w-16 shrink-0">Signature</span>
              <span className="truncate">{toHexSnippetDsa(signature)}</span>
              <span className="text-muted-foreground shrink-0">{signature.length} B</span>
            </div>
          )}
          {verifyResult !== null && (
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className={`flex items-center gap-2 rounded px-2 py-1 ${verifyResult ? 'bg-status-success/10 text-status-success' : 'bg-status-error/10 text-status-error'}`}
            >
              {verifyResult ? <CheckCircle size={13} /> : <XCircle size={13} />}
              {verifyResult
                ? 'Signature valid — ML-DSA verify passed'
                : 'Signature invalid — verification failed'}
            </div>
          )}
        </div>

        {dsaError && <ErrorAlert message={dsaError} />}
      </div>
    </div>
  )
}

// ── HSM SLH-DSA Sign Panel ────────────────────────────────────────────────────

// Map FIPS205_SLH_PREHASH_OPTIONS id → display mechanism name
const SLH_DSA_PREHASH_MECH_LABEL: Record<string, string> = {
  sha256: 'CKM_HASH_SLH_DSA_SHA256',
  sha512: 'CKM_HASH_SLH_DSA_SHA512',
  shake128: 'CKM_HASH_SLH_DSA_SHAKE128',
  shake256: 'CKM_HASH_SLH_DSA_SHAKE256',
}

const HsmSlhDsaSignPanel: React.FC<{ onAlgoChange?: (algo: string) => void }> = ({
  onAlgoChange,
}) => {
  const {
    moduleRef,
    crossCheckModuleRef,
    hSessionRef,
    addHsmKey,
    engineMode,
    addHsmLog,
    hsmLog,
    clearHsmLog,
    keysForFamily,
    removeHsmKey,
    isReady,
  } = useHsmContext()

  const [paramSetId, setParamSetId] = useState('sha2-128s')
  const [handles, setHandles] = useState<{ pub: number; priv: number } | null>(null)
  const [message, setMessage] = useState('Hello, PQC World!')
  const [signature, setSignature] = useState<Uint8Array | null>(null)
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null)
  const [preHash, setPreHash] = useState<'' | SLHDSAPreHash>('')
  const [contextStr, setContextStr] = useState('')
  const [deterministic, setDeterministic] = useState(false)
  const [extractable, setExtractable] = useState(false)
  const [showInternalParams, setShowInternalParams] = useState(false)
  const [loadingOp, setLoadingOp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const anyLoading = loadingOp !== null

  const getParamSet = () =>
    SLH_DSA_PARAM_SET_OPTIONS.find((o) => o.id === paramSetId) ?? SLH_DSA_PARAM_SET_OPTIONS[0]

  const getParamSetCkp = () => getParamSet().ckp ?? CKP_SLH_DSA_SHA2_128S

  const changeParamSet = (id: string) => {
    setParamSetId(id)
    setHandles(null)
    setSignature(null)
    setVerifyResult(null)
    setError(null)
    setContextStr('')
    setDeterministic(false)
    onAlgoChange?.(`SLH-DSA-${id}`)
  }

  const withLoading = async (op: string, fn: () => Promise<void>) => {
    setLoadingOp(op)
    try {
      await fn()
    } finally {
      setLoadingOp(null)
    }
  }

  const buildOpts = (): SLHDSASignOptions | undefined => {
    const ctx =
      !preHash && contextStr.trim() ? new TextEncoder().encode(contextStr.slice(0, 255)) : undefined
    const det = !preHash && deterministic ? true : undefined
    if (!preHash && !ctx && !det) return undefined
    if (preHash) return { preHash }
    return { context: ctx, deterministic: det }
  }

  const doGenKeyPair = () =>
    withLoading('gen', async () => {
      setError(null)
      setSignature(null)
      setVerifyResult(null)
      try {
        const M = moduleRef.current
        if (!M) throw new Error('Module not loaded — complete Token Setup first')
        const { pubHandle, privHandle } = hsm_generateSLHDSAKeyPair(
          M,
          hSessionRef.current,
          getParamSetCkp(),
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
          family: 'slh-dsa',
          role: 'public',
          label: `SLH-DSA-${paramSetId} Public Key`,
          variant: paramSetId,
          generatedAt: ts,
        })
        addHsmKey({
          handle: privHandle,
          family: 'slh-dsa',
          role: 'private',
          label: `SLH-DSA-${paramSetId} Private Key`,
          variant: paramSetId,
          generatedAt: ts,
        })
      } catch (e) {
        setError(String(e))
      }
    })

  const runDualEngineCrossCheck = async (sig: Uint8Array, opts: SLHDSASignOptions | undefined) => {
    if (engineMode !== 'dual' || !crossCheckModuleRef.current || !handles) return
    const M = moduleRef.current!
    const checkM = crossCheckModuleRef.current
    try {
      const pubBytes = hsm_extractKeyValue(M, hSessionRef.current, handles.pub)
      const rustPub = hsm_importSLHDSAPublicKey(
        checkM,
        hSessionRef.current,
        getParamSetCkp(),
        pubBytes
      )
      const checkOk = hsm_slhdsaVerify(checkM, hSessionRef.current, rustPub, message, sig, opts)
      if (!checkOk) {
        setError('Dual-Engine Parity Failure: Rust failed to verify C++ SLH-DSA signature')
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
          args: `Rust Verify(C++ SLH-DSA-${paramSetId} Signature) → valid`,
        })
      }
    } catch (e) {
      setError('Cross-check failed: ' + String(e))
    }
  }

  const doSign = () =>
    withLoading('sign', async () => {
      setError(null)
      setVerifyResult(null)
      try {
        const M = moduleRef.current!
        const opts = buildOpts()
        const sig = hsm_slhdsaSign(M, hSessionRef.current, handles!.priv, message, opts)
        setSignature(sig)
        await runDualEngineCrossCheck(sig, opts)
      } catch (e) {
        setError(String(e))
      }
    })

  const doVerify = () =>
    withLoading('verify', async () => {
      setError(null)
      try {
        const M = moduleRef.current!
        const opts = buildOpts()
        const ok = hsm_slhdsaVerify(M, hSessionRef.current, handles!.pub, message, signature!, opts)
        setVerifyResult(ok)
        if (ok) await runDualEngineCrossCheck(signature!, opts)
      } catch (e) {
        setError(String(e))
      }
    })

  const ps = getParamSet()
  const secLevel = paramSetId.includes('128') ? 128 : paramSetId.includes('192') ? 192 : 256
  const isSlow = paramSetId.endsWith('s')
  const hashFamily = paramSetId.startsWith('sha2') ? 'SHA-2' : 'SHAKE-256'
  const activeMech = preHash
    ? (SLH_DSA_PREHASH_MECH_LABEL[preHash] ?? 'CKM_HASH_SLH_DSA')
    : 'CKM_SLH_DSA'
  const slhKeys = [...keysForFamily('slh-dsa', 'public'), ...keysForFamily('slh-dsa', 'private')]

  return (
    <div className="space-y-3">
      {/* ── Step 1: Parameter Set ─────────────────────────────────────── */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
            1
          </span>
          <span className="text-sm font-semibold">Parameter Set</span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <FilterDropdown
            selectedId={paramSetId}
            onSelect={(id) => {
              if (id !== 'All') changeParamSet(id)
            }}
            items={SLH_DSA_PARAM_SET_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
            defaultLabel="SHA2-128s"
            noContainer
          />
          <span className="text-xs text-muted-foreground font-mono">
            pk: {ps.pub} B · sk: {ps.sk} B · sig: {ps.sig.toLocaleString()} B
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[11px]">
          <div className="bg-muted/40 rounded px-2 py-1.5">
            <span className="text-muted-foreground block mb-0.5">Security</span>
            <span className="font-semibold">
              {secLevel}-bit · NIST Cat.&nbsp;{secLevel === 128 ? 1 : secLevel === 192 ? 3 : 5}
            </span>
          </div>
          <div className="bg-muted/40 rounded px-2 py-1.5">
            <span className="text-muted-foreground block mb-0.5">Speed / Sig size</span>
            <span className="font-semibold">
              {isSlow ? 'Small sig, slower' : 'Fast sign, larger sig'}
            </span>
          </div>
          <div className="bg-muted/40 rounded px-2 py-1.5">
            <span className="text-muted-foreground block mb-0.5">Hash tree</span>
            <span className="font-semibold">{hashFamily}</span>
            <span className="text-muted-foreground text-[10px] block mt-0.5 leading-snug">
              {hashFamily === 'SHA-2'
                ? 'Faster without SHA-3 hardware'
                : 'Preferred with SHA-3 / SHAKE acceleration'}
            </span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 leading-relaxed">
          SLH-DSA is <strong className="text-foreground">stateless</strong> — no per-key signing
          counter. Safe to reuse the same key across sessions without risk of state exhaustion.
          (FIPS 205)
        </div>

        {/* FIPS 205 §6 internal parameters — collapsible */}
        <Button
          variant="ghost"
          type="button"
          onClick={() => setShowInternalParams((v) => !v)}
          className="flex items-center gap-1 text-[11px] text-primary/80 hover:text-primary transition-colors"
        >
          {showInternalParams ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          FIPS 205 §6 internal parameters (n, h, d, a, k, lg_w)
        </Button>
        {showInternalParams &&
          (() => {
            const ip = SLH_DSA_INTERNAL_PARAMS[paramSetId]
            if (!ip) return null
            return (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] font-mono border-collapse">
                  <thead>
                    <tr className="text-muted-foreground">
                      {['n', 'h', 'd', 'h/d', 'a', 'k', 'lg_w', 'm'].map((col) => (
                        <th
                          key={col}
                          className="text-left px-2 py-1 border-b border-border font-medium"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {[ip.n, ip.h, ip.d, ip.hp, ip.a, ip.k, ip.lg_w, ip.m].map((v, i) => (
                        <td key={i} className="px-2 py-1 text-foreground">
                          {v}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
                <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
                  <strong className="text-foreground">n</strong>=hash output bytes ·{' '}
                  <strong className="text-foreground">h</strong>=hypertree height ·{' '}
                  <strong className="text-foreground">d</strong>=layers ·{' '}
                  <strong className="text-foreground">h/d</strong>=height per layer ·{' '}
                  <strong className="text-foreground">a</strong>=FORS tree height ·{' '}
                  <strong className="text-foreground">k</strong>=FORS trees ·{' '}
                  <strong className="text-foreground">lg_w</strong>=WOTS+ Winternitz param ·{' '}
                  <strong className="text-foreground">m</strong>=index bits. -s variants use fewer
                  layers (small <strong className="text-foreground">d</strong>, large{' '}
                  <strong className="text-foreground">h/d</strong>) → smaller signatures but more
                  hash rounds per layer. -f variants use more layers → faster signing, larger
                  proofs.
                </p>
              </div>
            )
          })()}
      </div>

      {/* ── Step 2: Key Generation ────────────────────────────────────── */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
            2
          </span>
          <span className="text-sm font-semibold">Generate Key Pair</span>
          <span className="ml-auto font-mono text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
            CKM_SLH_DSA_KEY_PAIR_GEN
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" disabled={anyLoading} onClick={doGenKeyPair}>
            {loadingOp === 'gen' && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            {handles ? '✓ Key Pair Generated' : 'Generate Key Pair'}
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
        </div>
        {handles && (
          <div className="flex flex-wrap gap-3 text-xs font-mono text-muted-foreground">
            <span>pubH={handles.pub}</span>
            <span>privH={handles.priv}</span>
            <span className="text-muted-foreground/60">→ visible in HSM Key Registry ↓</span>
          </div>
        )}
        <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 leading-relaxed">
          <strong className="text-foreground">
            CKA_SENSITIVE = {extractable ? 'false' : 'true'}
          </strong>{' '}
          —{' '}
          {extractable
            ? 'Key bytes readable via C_GetAttributeValue. Use for cross-engine inspection or export scenarios.'
            : 'Prevents C_GetAttributeValue from revealing private key bytes. Production-safe default.'}
        </div>
      </div>

      {/* ── Step 3: Sign ─────────────────────────────────────────────── */}
      <div
        className={`glass-panel p-4 space-y-3 transition-opacity ${!handles ? 'opacity-40 pointer-events-none select-none' : ''}`}
        aria-disabled={!handles}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
            3
          </span>
          <span className="text-sm font-semibold">Sign</span>
          <span className="ml-auto font-mono text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
            {activeMech}
          </span>
        </div>

        {/* Mode selector */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-muted-foreground">Mode:</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPreHash('')
              setSignature(null)
              setVerifyResult(null)
            }}
            className={`text-xs h-6 px-2 ${!preHash ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
          >
            Pure SLH-DSA
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (!preHash) {
                setPreHash('sha256')
                setSignature(null)
                setVerifyResult(null)
              }
            }}
            className={`text-xs h-6 px-2 ${preHash ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
          >
            HashSLH-DSA
          </Button>
        </div>

        {preHash && (
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-muted-foreground">Hash function:</span>
            <FilterDropdown
              selectedId={preHash}
              onSelect={(id) => {
                if (id !== 'All') {
                  setPreHash(id as SLHDSAPreHash)
                  setSignature(null)
                  setVerifyResult(null)
                }
              }}
              items={[...FIPS205_SLH_PREHASH_OPTIONS]}
              defaultLabel="SHA-256"
              noContainer
            />
          </div>
        )}

        {/* Context string — pure SLH-DSA only (FIPS 205 §9.2) */}
        {!preHash && (
          <div>
            <label
              htmlFor="hsm-slhdsa-context"
              className="text-xs text-muted-foreground mb-1 block"
            >
              Context string{' '}
              <span className="font-mono text-[10px] bg-primary/10 text-primary px-1 py-0.5 rounded">
                FIPS 205 §9.2
              </span>
            </label>
            <Input
              id="hsm-slhdsa-context"
              value={contextStr}
              onChange={(e) => {
                setContextStr(e.target.value.slice(0, 255))
                setSignature(null)
                setVerifyResult(null)
              }}
              className="text-sm font-mono"
              placeholder="Optional domain separator, max 255 bytes (e.g. myapp:codesign)"
            />
            <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
              Binds the signature to a specific protocol or application context (domain separation).
              The same context must be supplied at verify time, or verification returns{' '}
              <span className="font-mono">CKR_SIGNATURE_INVALID</span>. Pure SLH-DSA only — not
              available in HashSLH-DSA mode.
            </p>
          </div>
        )}

        {/* Deterministic mode toggle — pure SLH-DSA only (FIPS 205 §10) */}
        {!preHash && (
          <label className="flex items-start gap-2 text-xs cursor-pointer select-none">
            <input
              type="checkbox"
              checked={deterministic}
              onChange={(e) => {
                setDeterministic(e.target.checked)
                setSignature(null)
                setVerifyResult(null)
              }}
              className="accent-primary mt-0.5 shrink-0"
            />
            <span>
              <span className="font-semibold text-foreground">Deterministic signing</span>{' '}
              <span className="font-mono text-[10px] bg-primary/10 text-primary px-1 py-0.5 rounded">
                FIPS 205 §10
              </span>
              <br />
              <span className="text-muted-foreground leading-relaxed">
                When enabled, <span className="font-mono">opt_rand = none</span> — the same (SK, M,
                context) triple always produces an{' '}
                <strong className="text-foreground">identical signature</strong>. Toggle to observe
                the difference: off = a new random signature each click; on = same bytes every time.
              </span>
            </span>
          </label>
        )}

        <div>
          <label htmlFor="hsm-slhdsa-message" className="text-xs text-muted-foreground mb-1 block">
            Message
          </label>
          <Input
            id="hsm-slhdsa-message"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              setSignature(null)
              setVerifyResult(null)
            }}
            className="text-sm font-mono"
            placeholder="Enter message to sign…"
          />
        </div>

        <Button variant="outline" size="sm" disabled={!handles || anyLoading} onClick={doSign}>
          {loadingOp === 'sign' && <Loader2 size={13} className="mr-1.5 animate-spin" />}
          Sign
        </Button>

        {signature && (
          <div className="flex gap-3 bg-muted rounded px-2 py-1 text-xs font-mono">
            <span className="text-muted-foreground w-16 shrink-0">Signature</span>
            <span className="truncate">{toHexSnippetDsa(signature)}</span>
            <span className="text-muted-foreground shrink-0">
              {signature.length.toLocaleString()} B
            </span>
          </div>
        )}

        <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 leading-relaxed">
          {!preHash ? (
            <>
              <strong className="text-foreground">
                SLH-DSA.sign(SK, M{contextStr.trim() ? ', ctx' : ''})
              </strong>{' '}
              — FIPS 205 §9.{' '}
              {deterministic ? (
                <>
                  <strong className="text-foreground">Deterministic mode</strong> (FIPS 205 §10):{' '}
                  <span className="font-mono">opt_rand = none</span>. Same (SK, M
                  {contextStr.trim() ? ', ctx' : ''}) always produces the{' '}
                  <strong className="text-foreground">same signature</strong>.
                </>
              ) : (
                <>
                  Randomized (<span className="font-mono">opt_rand</span> from RNG). Same message
                  produces a{' '}
                  <strong className="text-foreground">different signature each time</strong>.
                </>
              )}
              {contextStr.trim() && (
                <>
                  {' '}
                  Context:{' '}
                  <span className="font-mono">
                    "{contextStr.slice(0, 32)}
                    {contextStr.length > 32 ? '…' : ''}"
                  </span>{' '}
                  ({new TextEncoder().encode(contextStr.slice(0, 255)).length}B).
                </>
              )}
            </>
          ) : (
            <>
              <strong className="text-foreground">HashSLH-DSA.sign(SK, M, PH)</strong> — FIPS 205
              §11. Pre-hashes M with{' '}
              {FIPS205_SLH_PREHASH_OPTIONS.find((o) => o.id === preHash)?.label ?? preHash} before
              signing. Use when message size is unbounded or the protocol mandates pre-hashing.
            </>
          )}
        </div>
      </div>

      {/* ── Step 4: Verify ───────────────────────────────────────────── */}
      <div
        className={`glass-panel p-4 space-y-3 transition-opacity ${!signature ? 'opacity-40 pointer-events-none select-none' : ''}`}
        aria-disabled={!signature}
      >
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
            4
          </span>
          <span className="text-sm font-semibold">Verify</span>
        </div>

        <Button variant="outline" size="sm" disabled={!signature || anyLoading} onClick={doVerify}>
          {loadingOp === 'verify' && <Loader2 size={13} className="mr-1.5 animate-spin" />}
          Verify Signature
        </Button>

        {verifyResult !== null && (
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={`flex items-center gap-2 rounded px-2 py-1 text-sm font-medium ${verifyResult ? 'bg-status-success/10 text-status-success' : 'bg-status-error/10 text-status-error'}`}
          >
            {verifyResult ? <CheckCircle size={13} /> : <XCircle size={13} />}
            {verifyResult
              ? 'Signature valid — SLH-DSA verify passed'
              : 'Signature invalid — verification failed'}
          </div>
        )}

        <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 leading-relaxed">
          Verification uses the same mechanism as signing. A different hash function, mismatched
          message, or wrong key returns{' '}
          <strong className="text-foreground">CKR_SIGNATURE_INVALID</strong>.
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      {/* ── Inline PKCS#11 log ──────────────────────────────────────── */}
      {isReady && (
        <Pkcs11LogPanel
          log={hsmLog}
          onClear={clearHsmLog}
          title="PKCS#11 Call Log — SLH-DSA Sign & Verify"
        />
      )}

      {/* ── HSM Key Inspector (SLH-DSA keys) ───────────────────────── */}
      {isReady && slhKeys.length > 0 && (
        <HsmKeyInspector
          keys={slhKeys}
          moduleRef={moduleRef}
          hSessionRef={hSessionRef}
          onRemoveKey={removeHsmKey}
        />
      )}
    </div>
  )
}

const HsmXmssSignPanel: React.FC<{
  initialAlgo?: string
  onAlgoChange?: (algo: string) => void
}> = () => {
  return (
    <div className="flex h-48 items-center justify-center p-8 bg-muted rounded-xl text-muted-foreground border-dashed border-2">
      <FileSignature className="w-8 h-8 mr-3 opacity-50" />
      <span className="font-semibold">
        XMSS / LMS Stateful Signature Panel under construction (requires softhsmv3 bump).
      </span>
    </div>
  )
}

// ── Combined HSM Sign Panel (PQC + Classical) ────────────────────────────────

export const HsmSignCombinedPanel: React.FC<{
  initialAlgo?: string
  onAlgoChange?: (algo: string) => void
}> = ({ initialAlgo, onAlgoChange }) => {
  const { isReady } = useHsmContext()
  const [signFamily, setSignFamily] = useState<'pqc' | 'classical'>(() => {
    if (
      initialAlgo?.startsWith('RSA') ||
      initialAlgo?.startsWith('ECDSA') ||
      initialAlgo?.startsWith('EdDSA')
    )
      return 'classical'
    return 'pqc'
  })
  const [pqcAlgo, setPqcAlgo] = useState<'ml-dsa' | 'slh-dsa' | 'xmss'>(() => {
    if (initialAlgo?.startsWith('SLH-DSA')) return 'slh-dsa'
    if (initialAlgo?.startsWith('XMSS') || initialAlgo?.startsWith('LMS')) return 'xmss'
    return 'ml-dsa'
  })
  useEffect(() => {
    if (signFamily === 'classical') {
      onAlgoChange?.('ECDSA')
    } else if (pqcAlgo === 'slh-dsa') {
      onAlgoChange?.(initialAlgo?.startsWith('SLH-DSA') ? initialAlgo : 'SLH-DSA-sha2-128s')
    } else if (pqcAlgo === 'xmss') {
      onAlgoChange?.(initialAlgo?.startsWith('XMSS') ? initialAlgo : 'XMSS-SHA2_10_256')
    } else {
      onAlgoChange?.(initialAlgo?.startsWith('ML-DSA') ? initialAlgo : 'ML-DSA-65')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <HsmReadyGuard isReady={isReady}>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex gap-2 flex-wrap flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSignFamily('pqc')
                onAlgoChange?.(pqcAlgo === 'slh-dsa' ? 'SLH-DSA-sha2-128s' : 'ML-DSA-65')
              }}
              className={`text-xs h-7 px-3 ${signFamily === 'pqc' ? 'bg-primary/20 text-primary' : ''}`}
            >
              PQC (ML-DSA · SLH-DSA)
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSignFamily('classical')
                onAlgoChange?.('ECDSA')
              }}
              className={`text-xs h-7 px-3 ${signFamily === 'classical' ? 'bg-primary/20 text-primary' : ''}`}
            >
              Classical (RSA · ECDSA · EdDSA)
            </Button>
            {signFamily === 'pqc' && (
              <>
                <span className="text-muted-foreground text-xs self-center">|</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPqcAlgo('ml-dsa')
                    onAlgoChange?.('ML-DSA-65')
                  }}
                  className={`text-xs h-7 px-3 ${pqcAlgo === 'ml-dsa' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
                >
                  ML-DSA
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPqcAlgo('slh-dsa')
                    onAlgoChange?.('SLH-DSA-sha2-128s')
                  }}
                  className={`text-xs h-7 px-3 ${pqcAlgo === 'slh-dsa' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
                >
                  SLH-DSA
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPqcAlgo('xmss')
                    onAlgoChange?.('XMSS-SHA2_10_256')
                  }}
                  className={`text-xs h-7 px-3 ${pqcAlgo === 'xmss' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
                >
                  XMSS / LMS
                </Button>
              </>
            )}
          </div>
          <ShareButton title="HSM Sign &amp; Verify" variant="icon" />
        </div>
        {signFamily === 'pqc' ? (
          pqcAlgo === 'ml-dsa' ? (
            <HsmSignPanel initialAlgo={initialAlgo} onAlgoChange={onAlgoChange} />
          ) : pqcAlgo === 'slh-dsa' ? (
            <HsmSlhDsaSignPanel onAlgoChange={onAlgoChange} />
          ) : (
            <HsmXmssSignPanel initialAlgo={initialAlgo} onAlgoChange={onAlgoChange} />
          )
        ) : (
          <HsmClassicalSignPanel />
        )}
      </div>
    </HsmReadyGuard>
  )
}

// ── Software Sign Tab ─────────────────────────────────────────────────────────

export const SignVerifyTab: React.FC = () => {
  return <SignVerifyTabSoftware />
}

const SignVerifyTabSoftware: React.FC = () => {
  const { loading } = useSettingsContext()
  const {
    keyStore,
    selectedSignKeyId,
    setSelectedSignKeyId,
    selectedVerifyKeyId,
    setSelectedVerifyKeyId,
  } = useKeyStoreContext()
  const { runOperation, signature, setSignature, dataToSign, setDataToSign, verificationResult } =
    useOperationsContext()

  const isSign = (algo: string) =>
    algo.startsWith('ML-DSA') ||
    algo.startsWith('SLH-DSA') ||
    algo.startsWith('FN-DSA') ||
    algo.startsWith('LMS-') ||
    algo.startsWith('RSA') ||
    algo.startsWith('ECDSA') ||
    algo === 'Ed25519' ||
    algo === 'Ed448' ||
    algo === 'secp256k1'
  const signPrivateKeys = keyStore.filter((k) => k.type === 'private' && isSign(k.algorithm))
  const signPublicKeys = keyStore.filter((k) => k.type === 'public' && isSign(k.algorithm))

  // Helper to handle dataToSign change (stored as plain string in context, but EditableDataDisplay expects Hex for consistency if we want unified component)
  // Wait, dataToSign is stored as a string (e.g. "Hello").
  // But EditableDataDisplay expects value to be HEX if viewMode is HEX.
  // Let's adapt EditableDataDisplay or wrap the state.

  // Actually, let's make EditableDataDisplay handle "Text" vs "Hex" storage.
  // But for simplicity, let's assume we convert everything to Hex for the `EditableDataDisplay` prop, and convert back.

  const messageHex = (() => {
    const bytes = new TextEncoder().encode(dataToSign)
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  })()

  const handleMessageChange = (newHex: string) => {
    const bytes = new Uint8Array((newHex.match(/.{1,2}/g) ?? []).map((h) => parseInt(h, 16)))
    setDataToSign(new TextDecoder().decode(bytes))
  }

  return (
    <div className="w-full animate-fade-in space-y-8">
      <div>
        <h4 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-2 mb-6">
          <FileSignature size={18} className="text-accent" /> Digital Signatures
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
          {/* Sign */}
          <div className="p-6 bg-card rounded-xl border border-border hover:border-success/30 transition-colors group flex flex-col">
            <div className="text-sm text-success mb-4 font-bold uppercase tracking-wider flex items-center gap-2">
              <FileSignature size={16} /> Sign Message
            </div>

            <div className="mb-4">
              <FilterDropdown
                selectedId={selectedSignKeyId || 'All'}
                onSelect={(id) => setSelectedSignKeyId(id === 'All' ? '' : id)}
                items={signPrivateKeys.map((k) => ({ id: k.id, label: k.name }))}
                defaultLabel="Select Private Key..."
                noContainer
              />
            </div>

            {selectedSignKeyId &&
              (() => {
                const key = keyStore.find((k) => k.id === selectedSignKeyId)
                if (!key) return null
                let scheme = 'Unknown'
                let hash = 'Unknown'

                if (key.algorithm.startsWith('ML-DSA')) {
                  scheme = 'Pure ML-DSA'
                  hash = 'SHAKE-256'
                } else if (key.algorithm.startsWith('SLH-DSA')) {
                  scheme = 'SLH-DSA (Hash-Based)'
                  hash = key.algorithm.includes('SHA2') ? 'SHA2' : 'SHAKE'
                } else if (key.algorithm.startsWith('FN-DSA')) {
                  scheme = 'FN-DSA / Falcon'
                  hash = 'SHAKE-256'
                } else if (key.algorithm.startsWith('LMS-')) {
                  scheme = 'LMS/HSS (Stateful)'
                  hash = 'SHA-256'
                } else if (key.algorithm.startsWith('RSA')) {
                  scheme = 'RSA-PSS'
                  hash = 'SHA-256'
                } else if (key.algorithm.startsWith('ECDSA')) {
                  scheme = 'ECDSA'
                  hash =
                    key.algorithm.includes('P384') || key.algorithm.includes('P-384')
                      ? 'SHA-384'
                      : key.algorithm.includes('P521') || key.algorithm.includes('P-521')
                        ? 'SHA-512'
                        : 'SHA-256'
                } else if (key.algorithm === 'Ed25519') {
                  scheme = 'EdDSA'
                  hash = 'SHA-512'
                } else if (key.algorithm === 'Ed448') {
                  scheme = 'EdDSA'
                  hash = 'SHAKE-256'
                } else if (key.algorithm === 'secp256k1') {
                  scheme = 'ECDSA (secp256k1)'
                  hash = 'SHA-256'
                }

                return (
                  <>
                    <div className="mb-4 p-3 bg-muted rounded border border-border text-xs text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>Algorithm:</span>
                        <span className="text-foreground font-mono">{key.algorithm}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Scheme:</span>
                        <span className="text-foreground font-mono">{scheme}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hash Function:</span>
                        <span className="text-foreground font-mono">{hash}</span>
                      </div>
                    </div>
                    {key.algorithm.startsWith('LMS-') && (
                      <div className="mb-4 p-3 rounded border border-status-warning/40 bg-status-warning/10 text-xs text-status-warning space-y-1">
                        <p className="font-semibold">
                          Stateful signature — key updates after each sign
                        </p>
                        <p className="text-status-warning/80">
                          LMS private keys are one-time-use: each signature advances the key state.
                          Re-using a key state breaks security (NIST SP 800-208). The updated key is
                          saved back to the key store automatically.
                        </p>
                      </div>
                    )}
                  </>
                )
              })()}

            <EditableDataDisplay
              label="Message to Sign (Input)"
              value={messageHex}
              onChange={handleMessageChange}
              placeholder="Enter message to sign..."
            />

            <EditableDataDisplay
              label="Signature (Output)"
              value={signature}
              onChange={setSignature}
              placeholder="Run Sign to generate..."
            />

            <div className="mt-auto pt-4">
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  runOperation('sign')
                  logEvent('Playground', 'Sign Message')
                }}
                disabled={!selectedSignKeyId || loading}
                className="w-full py-3 rounded-lg bg-success/20 text-success border border-success/30 hover:bg-success/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold"
              >
                Sign Message
              </Button>
            </div>
          </div>

          {/* Verify */}
          <div className="p-6 bg-card rounded-xl border border-border hover:border-warning/30 transition-colors group flex flex-col">
            <div className="text-sm text-warning mb-4 font-bold uppercase tracking-wider flex items-center gap-2">
              <FileSignature size={16} /> Verify Signature
            </div>

            <div className="mb-4">
              <FilterDropdown
                selectedId={selectedVerifyKeyId || 'All'}
                onSelect={(id) => setSelectedVerifyKeyId(id === 'All' ? '' : id)}
                items={signPublicKeys.map((k) => ({ id: k.id, label: k.name }))}
                defaultLabel="Select Public Key..."
                noContainer
              />
            </div>

            {selectedVerifyKeyId &&
              (() => {
                const key = keyStore.find((k) => k.id === selectedVerifyKeyId)
                if (!key) return null
                let scheme = 'Unknown'
                let hash = 'Unknown'

                if (key.algorithm.startsWith('ML-DSA')) {
                  scheme = 'Pure ML-DSA'
                  hash = 'SHAKE-256'
                } else if (key.algorithm.startsWith('SLH-DSA')) {
                  scheme = 'SLH-DSA (Hash-Based)'
                  hash = key.algorithm.includes('SHA2') ? 'SHA2' : 'SHAKE'
                } else if (key.algorithm.startsWith('FN-DSA')) {
                  scheme = 'FN-DSA / Falcon'
                  hash = 'SHAKE-256'
                } else if (key.algorithm.startsWith('LMS-')) {
                  scheme = 'LMS/HSS (Stateful)'
                  hash = 'SHA-256'
                } else if (key.algorithm.startsWith('RSA')) {
                  scheme = 'RSA-PSS'
                  hash = 'SHA-256'
                } else if (key.algorithm.startsWith('ECDSA')) {
                  scheme = 'ECDSA'
                  hash =
                    key.algorithm.includes('P384') || key.algorithm.includes('P-384')
                      ? 'SHA-384'
                      : key.algorithm.includes('P521') || key.algorithm.includes('P-521')
                        ? 'SHA-512'
                        : 'SHA-256'
                } else if (key.algorithm === 'Ed25519') {
                  scheme = 'EdDSA'
                  hash = 'SHA-512'
                } else if (key.algorithm === 'Ed448') {
                  scheme = 'EdDSA'
                  hash = 'SHAKE-256'
                } else if (key.algorithm === 'secp256k1') {
                  scheme = 'ECDSA (secp256k1)'
                  hash = 'SHA-256'
                }

                return (
                  <div className="mb-4 p-3 bg-muted rounded border border-border text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Algorithm:</span>
                      <span className="text-foreground font-mono">{key.algorithm}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Scheme:</span>
                      <span className="text-foreground font-mono">{scheme}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hash Function:</span>
                      <span className="text-foreground font-mono">{hash}</span>
                    </div>
                  </div>
                )
              })()}

            <EditableDataDisplay
              label="Message to Verify (Input)"
              value={messageHex}
              onChange={handleMessageChange}
              placeholder="Enter message to verify..."
            />

            <EditableDataDisplay
              label="Signature (Input)"
              value={signature}
              onChange={setSignature}
              placeholder="No Signature (Run Sign first or paste one)"
            />

            {/* Verification Result Display */}
            {verificationResult !== null && (
              <div
                className={`mb-4 p-4 rounded-lg border flex items-center gap-3 ${
                  verificationResult
                    ? 'bg-success/10 border-success/30 text-success'
                    : 'bg-destructive/10 border-destructive/30 text-destructive'
                }`}
              >
                {verificationResult ? <CheckCircle size={24} /> : <XCircle size={24} />}
                <div>
                  <div className="font-bold text-lg">
                    {verificationResult ? 'VERIFICATION OK' : 'VERIFICATION FAILED'}
                  </div>
                  <div className="text-xs opacity-80">
                    {verificationResult
                      ? 'The signature is valid for this message and public key.'
                      : 'The signature does NOT match this message and public key.'}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-auto pt-4">
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  runOperation('verify')
                  logEvent('Playground', 'Verify Signature')
                }}
                disabled={!selectedVerifyKeyId || loading}
                className="w-full py-3 rounded-lg bg-warning/20 text-warning border border-warning/30 hover:bg-warning/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold"
              >
                Verify Signature
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

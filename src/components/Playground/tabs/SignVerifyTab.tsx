// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { FileSignature, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useSettingsContext } from '../contexts/SettingsContext'
import { useKeyStoreContext } from '../contexts/KeyStoreContext'
import { useOperationsContext } from '../contexts/OperationsContext'
import { useHsmContext } from '../hsm/HsmContext'
import { logEvent } from '../../../utils/analytics'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { ErrorAlert } from '../../ui/error-alert'
import {
  hsm_generateMLDSAKeyPair,
  hsm_sign,
  hsm_verify,
  hsm_extractKeyValue,
  hsm_importMLDSAPublicKey,
  type MLDSASignOptions,
} from '../../../wasm/softhsm'
import { FilterDropdown } from '../../common/FilterDropdown'
import { HsmClassicalSignPanel } from '../hsm/HsmClassicalSignPanel'
import { HsmReadyGuard } from '../hsm/shared'

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
        <button
          type="button"
          onClick={() => setViewMode((prev) => (prev === 'hex' ? 'ascii' : 'hex'))}
          aria-label={`Switch to ${viewMode === 'hex' ? 'ASCII' : 'HEX'} view`}
          className="text-[10px] flex items-center gap-1 bg-muted hover:bg-accent px-2 py-1 rounded transition-colors text-primary"
        >
          {viewMode === 'hex' ? 'HEX' : 'ASCII'}
        </button>
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

const HsmSignPanel: React.FC = () => {
  const { moduleRef, crossCheckModuleRef, hSessionRef, addHsmKey, engineMode, addHsmLog } =
    useHsmContext()

  const [variant, setVariant] = useState<44 | 65 | 87>(65)
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
          <div className="flex items-center gap-1.5">
            <label htmlFor="hsm-dsa-context" className="text-muted-foreground">
              Context:
            </label>
            <Input
              id="hsm-dsa-context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="optional"
              className="h-6 text-xs px-2 w-28"
            />
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
          <Button variant="outline" size="sm" disabled={!handles || anyLoading} onClick={doSign}>
            {loadingOp === 'sign' && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            Sign
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!signature || anyLoading}
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

// ── Combined HSM Sign Panel (PQC + Classical) ────────────────────────────────

const HsmSignCombinedPanel: React.FC = () => {
  const { isReady } = useHsmContext()
  const [signFamily, setSignFamily] = useState<'pqc' | 'classical'>('pqc')
  return (
    <HsmReadyGuard isReady={isReady}>
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSignFamily('pqc')}
            className={`text-xs h-7 px-3 ${signFamily === 'pqc' ? 'bg-primary/20 text-primary' : ''}`}
          >
            PQC (ML-DSA · SLH-DSA)
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSignFamily('classical')}
            className={`text-xs h-7 px-3 ${signFamily === 'classical' ? 'bg-primary/20 text-primary' : ''}`}
          >
            Classical (RSA · ECDSA · EdDSA)
          </Button>
        </div>
        {signFamily === 'pqc' ? <HsmSignPanel /> : <HsmClassicalSignPanel />}
      </div>
    </HsmReadyGuard>
  )
}

// ── Software Sign Tab ─────────────────────────────────────────────────────────

export const SignVerifyTab: React.FC = () => {
  const { hsmMode } = useSettingsContext()
  if (hsmMode) return <HsmSignCombinedPanel />
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
    <div className="max-w-6xl mx-auto animate-fade-in space-y-8">
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
              <button
                type="button"
                onClick={() => {
                  runOperation('sign')
                  logEvent('Playground', 'Sign Message')
                }}
                disabled={!selectedSignKeyId || loading}
                className="w-full py-3 rounded-lg bg-success/20 text-success border border-success/30 hover:bg-success/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold"
              >
                Sign Message
              </button>
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
              <button
                type="button"
                onClick={() => {
                  runOperation('verify')
                  logEvent('Playground', 'Verify Signature')
                }}
                disabled={!selectedVerifyKeyId || loading}
                className="w-full py-3 rounded-lg bg-warning/20 text-warning border border-warning/30 hover:bg-warning/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold"
              >
                Verify Signature
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

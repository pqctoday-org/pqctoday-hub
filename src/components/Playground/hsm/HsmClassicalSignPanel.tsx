// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { PenLine, CheckCircle, XCircle, Loader2, Plus, X } from 'lucide-react'
import { Button } from '../../ui/button'
import { ErrorAlert } from '../../ui/error-alert'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import {
  CKM_SHA256_RSA_PKCS,
  CKM_SHA384_RSA_PKCS,
  CKM_SHA512_RSA_PKCS,
  CKM_SHA256_RSA_PKCS_PSS,
  CKM_SHA384_RSA_PKCS_PSS,
  CKM_SHA512_RSA_PKCS_PSS,
  CKM_ECDSA_SHA256,
  CKM_ECDSA_SHA384,
  CKM_ECDSA_SHA512,
  hsm_generateRSAKeyPair,
  hsm_rsaSign,
  hsm_rsaVerify,
  hsm_rsaEncrypt,
  hsm_rsaDecrypt,
  hsm_generateECKeyPair,
  hsm_ecdsaSign,
  hsm_ecdsaVerify,
  hsm_generateEdDSAKeyPair,
  hsm_eddsaSign,
  hsm_eddsaVerify,
  hsm_signMultiPart,
} from '../../../wasm/softhsm'
import { useHsmContext } from './HsmContext'
import { HsmReadyGuard, HsmResultRow, toHex } from './shared'
import { MiniPkcsLog } from '../components/MiniPkcsLog'

// ── Types ────────────────────────────────────────────────────────────────────

type ClassicMode = 'rsa' | 'ecdsa' | 'eddsa'

const CLASSIC_MODES: { id: ClassicMode; label: string; spec: string }[] = [
  { id: 'rsa', label: 'RSA', spec: 'PKCS#11 v3.2 §2.1 — CKM_RSA_PKCS / PSS / OAEP' },
  { id: 'ecdsa', label: 'ECDSA', spec: 'PKCS#11 v3.2 §2.3.1 — CKM_ECDSA_SHA*' },
  { id: 'eddsa', label: 'EdDSA', spec: 'PKCS#11 v3.2 §2.3.6 — CKM_EDDSA (Ed25519/Ed448)' },
]

const RSA_SIGN_MECHS = [
  { label: 'SHA256-RSA-PKCS', value: CKM_SHA256_RSA_PKCS },
  { label: 'SHA384-RSA-PKCS', value: CKM_SHA384_RSA_PKCS },
  { label: 'SHA512-RSA-PKCS', value: CKM_SHA512_RSA_PKCS },
  { label: 'SHA256-RSA-PKCS-PSS', value: CKM_SHA256_RSA_PKCS_PSS },
  { label: 'SHA384-RSA-PKCS-PSS', value: CKM_SHA384_RSA_PKCS_PSS },
  { label: 'SHA512-RSA-PKCS-PSS', value: CKM_SHA512_RSA_PKCS_PSS },
]

const ECDSA_MECHS = [
  { label: 'ECDSA-SHA256', value: CKM_ECDSA_SHA256 },
  { label: 'ECDSA-SHA384', value: CKM_ECDSA_SHA384 },
  { label: 'ECDSA-SHA512', value: CKM_ECDSA_SHA512 },
]

// ── RSA sub-panel ─────────────────────────────────────────────────────────────

const RsaPanel = () => {
  const { moduleRef, hSessionRef, addHsmKey } = useHsmContext()
  const [keyBits, setKeyBits] = useState<2048 | 3072 | 4096>(2048)
  const [extractable, setExtractable] = useState(false)
  const [signMech, setSignMech] = useState(CKM_SHA256_RSA_PKCS)
  const [handles, setHandles] = useState<{ pub: number; priv: number } | null>(null)
  const [message, setMessage] = useState('Hello from PKCS#11 RSA!')

  const [sig, setSig] = useState<Uint8Array | null>(null)
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null)

  const [ciphertext, setCiphertext] = useState<Uint8Array | null>(null)
  const [plaintext, setPlaintext] = useState('RSA-OAEP encrypt me')
  const [decrypted, setDecrypted] = useState<string | null>(null)

  const [loadingOp, setLoadingOp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Multi-part state
  const [multiPartSign, setMultiPartSign] = useState(false)
  const [chunks, setChunks] = useState<string[]>(['Hello from ', 'PKCS#11 RSA!'])

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

  const handleGenKeys = () =>
    run('KeyGen', () => {
      const M = moduleRef.current!
      const hSession = hSessionRef.current
      const { pubHandle, privHandle } = hsm_generateRSAKeyPair(
        M,
        hSession,
        keyBits,
        extractable,
        'sign'
      )
      addHsmKey({
        handle: pubHandle,
        family: 'rsa',
        role: 'public',
        label: `RSA-${keyBits} Public Key`,
        generatedAt: new Date().toISOString(),
      })
      addHsmKey({
        handle: privHandle,
        family: 'rsa',
        role: 'private',
        label: `RSA-${keyBits} Private Key${extractable ? ' (extractable)' : ''}`,
        generatedAt: new Date().toISOString(),
      })
      setHandles({ pub: pubHandle, priv: privHandle })
      setSig(null)
      setVerifyResult(null)
      setCiphertext(null)
      setDecrypted(null)
    })

  const handleSign = () =>
    run('Sign', () => {
      const M = moduleRef.current!
      const hSession = hSessionRef.current
      if (multiPartSign) {
        const encodedChunks = chunks.map((c) => new TextEncoder().encode(c))
        const s = hsm_signMultiPart(M, hSession, handles!.priv, encodedChunks, signMech)
        setSig(s)
      } else {
        const s = hsm_rsaSign(M, hSession, handles!.priv, message, signMech)
        setSig(s)
      }
      setVerifyResult(null)
    })

  const handleVerify = () =>
    run('Verify', () => {
      const M = moduleRef.current!
      const hSession = hSessionRef.current
      // Verify uses single-part (concatenated message)
      const fullMsg = multiPartSign ? chunks.join('') : message
      const valid = hsm_rsaVerify(M, hSession, handles!.pub, fullMsg, sig!, signMech)
      setVerifyResult(valid)
    })

  const handleEncrypt = () =>
    run('Encrypt', () => {
      const M = moduleRef.current!
      const hSession = hSessionRef.current
      const ct = hsm_rsaEncrypt(M, hSession, handles!.pub, plaintext)
      setCiphertext(ct)
      setDecrypted(null)
    })

  const handleDecrypt = () =>
    run('Decrypt', () => {
      const M = moduleRef.current!
      const hSession = hSessionRef.current
      const pt = hsm_rsaDecrypt(M, hSession, handles!.priv, ciphertext!)
      setDecrypted(new TextDecoder().decode(pt))
    })

  return (
    <div className="space-y-4">
      {/* Key gen */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          {([2048, 3072, 4096] as const).map((bits) => (
            <Button
              variant="ghost"
              key={bits}
              onClick={() => setKeyBits(bits)}
              className={`text-xs rounded-lg px-3 py-1.5 border transition-colors ${
                keyBits === bits
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-muted border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              RSA-{bits}
            </Button>
          ))}
          <Button
            variant="gradient"
            size="sm"
            onClick={handleGenKeys}
            disabled={loadingOp !== null}
          >
            {loadingOp === 'KeyGen' && <Loader2 size={14} className="animate-spin mr-1" />}
            {handles ? `Regen RSA-${keyBits}` : 'Generate Key Pair'}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            <HsmResultRow label="pub handle" value={`h=${handles.pub}`} />
            <HsmResultRow label="priv handle" value={`h=${handles.priv}`} />
          </div>
        )}
      </div>

      {handles && (
        <>
          {/* Sign / Verify */}
          <div className="space-y-2 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-foreground">Sign &amp; Verify</p>
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setMultiPartSign((v) => !v)
                  setSig(null)
                  setVerifyResult(null)
                }}
                className={`text-[10px] rounded-lg px-2 py-0.5 border transition-colors ${
                  multiPartSign
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                Multi-part
              </Button>
            </div>
            <FilterDropdown
              items={RSA_SIGN_MECHS.map((m) => ({ id: String(m.value), label: m.label }))}
              selectedId={String(signMech)}
              onSelect={(id) => {
                setSignMech(parseInt(id, 10))
                setSig(null)
                setVerifyResult(null)
              }}
              noContainer
            />
            {multiPartSign ? (
              <div className="space-y-1.5">
                {chunks.map((chunk, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground w-4">#{idx + 1}</span>
                    <input
                      type="text"
                      value={chunk}
                      onChange={(e) => {
                        setChunks((prev) => prev.map((c, i) => (i === idx ? e.target.value : c)))
                        setSig(null)
                        setVerifyResult(null)
                      }}
                      placeholder={`Chunk ${idx + 1}…`}
                      className="flex-1 text-xs rounded-lg px-2 py-1 bg-muted border border-border text-foreground font-mono"
                    />
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => {
                        if (chunks.length > 1) {
                          setChunks((prev) => prev.filter((_, i) => i !== idx))
                          setSig(null)
                          setVerifyResult(null)
                        }
                      }}
                      disabled={chunks.length <= 1}
                      className="text-muted-foreground hover:text-status-error disabled:opacity-30"
                    >
                      <X size={10} />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setChunks((prev) => [...prev, ''])}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <Plus size={10} /> Add chunk
                </Button>
              </div>
            ) : (
              <input
                type="text"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value)
                  setSig(null)
                  setVerifyResult(null)
                }}
                placeholder="Message to sign"
                className="w-full text-xs rounded-lg px-3 py-1.5 bg-muted border border-border text-foreground"
              />
            )}
            <div className="flex gap-2">
              <Button
                variant="gradient"
                size="sm"
                onClick={handleSign}
                disabled={loadingOp !== null}
              >
                {loadingOp === 'Sign' && <Loader2 size={14} className="animate-spin mr-1" />}
                {multiPartSign ? 'C_SignUpdate' : 'C_Sign'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleVerify}
                disabled={loadingOp !== null || !sig}
              >
                {loadingOp === 'Verify' && <Loader2 size={14} className="animate-spin mr-1" />}{' '}
                C_Verify
              </Button>
            </div>
            {sig && <HsmResultRow label={`Sig (${sig.length}B)`} value={toHex(sig)} />}
            {verifyResult !== null && (
              <div
                className={`flex items-center gap-2 text-xs font-medium rounded px-2 py-1 ${verifyResult ? 'text-status-success bg-status-success/10' : 'text-status-error bg-status-error/10'}`}
              >
                {verifyResult ? (
                  <>
                    <CheckCircle size={12} /> Valid signature
                  </>
                ) : (
                  <>
                    <XCircle size={12} /> Invalid signature
                  </>
                )}
              </div>
            )}
          </div>

          {/* Encrypt / Decrypt */}
          <div className="space-y-2 rounded-lg border border-border p-3">
            <p className="text-xs font-medium text-foreground">RSA-OAEP Encrypt &amp; Decrypt</p>
            <input
              type="text"
              value={plaintext}
              onChange={(e) => {
                setPlaintext(e.target.value)
                setCiphertext(null)
                setDecrypted(null)
              }}
              placeholder="Plaintext to encrypt"
              className="w-full text-xs rounded-lg px-3 py-1.5 bg-muted border border-border text-foreground"
            />
            <div className="flex gap-2">
              <Button
                variant="gradient"
                size="sm"
                onClick={handleEncrypt}
                disabled={loadingOp !== null}
              >
                {loadingOp === 'Encrypt' && <Loader2 size={14} className="animate-spin mr-1" />}{' '}
                C_Encrypt
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDecrypt}
                disabled={loadingOp !== null || !ciphertext}
              >
                {loadingOp === 'Decrypt' && <Loader2 size={14} className="animate-spin mr-1" />}{' '}
                C_Decrypt
              </Button>
            </div>
            {ciphertext && (
              <HsmResultRow label={`CT (${ciphertext.length}B)`} value={toHex(ciphertext)} />
            )}
            {decrypted !== null && (
              <HsmResultRow label="Decrypted" value={decrypted} mono={false} />
            )}
          </div>
        </>
      )}

      <MiniPkcsLog />
      {error && <ErrorAlert message={error} />}
    </div>
  )
}

// ── ECDSA sub-panel ──────────────────────────────────────────────────────────

const EcdsaPanel = () => {
  const { moduleRef, hSessionRef, addHsmKey } = useHsmContext()
  type EcCurve = 'P-256' | 'P-384' | 'P-521'
  const [curve, setCurve] = useState<EcCurve>('P-256')
  const [extractable, setExtractable] = useState(false)
  const [mech, setMech] = useState(CKM_ECDSA_SHA256)
  const [handles, setHandles] = useState<{ pub: number; priv: number } | null>(null)
  const [message, setMessage] = useState('Hello from ECDSA!')
  const [sig, setSig] = useState<Uint8Array | null>(null)
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null)
  const [loadingOp, setLoadingOp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Multi-part state
  const [multiPartSign, setMultiPartSign] = useState(false)
  const [chunks, setChunks] = useState<string[]>(['Hello from ', 'ECDSA!'])

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

  const handleGenKeys = () =>
    run('KeyGen', () => {
      const M = moduleRef.current!
      const hSession = hSessionRef.current
      const { pubHandle, privHandle } = hsm_generateECKeyPair(
        M,
        hSession,
        curve,
        extractable,
        'sign'
      )
      addHsmKey({
        handle: pubHandle,
        family: 'ecdsa',
        role: 'public',
        label: `${curve} Public Key`,
        variant: curve,
        generatedAt: new Date().toISOString(),
      })
      addHsmKey({
        handle: privHandle,
        family: 'ecdsa',
        role: 'private',
        label: `${curve} Private Key${extractable ? ' (extractable)' : ''}`,
        variant: curve,
        generatedAt: new Date().toISOString(),
      })
      setHandles({ pub: pubHandle, priv: privHandle })
      setSig(null)
      setVerifyResult(null)
    })

  const handleSign = () =>
    run('Sign', () => {
      const M = moduleRef.current!
      const hSession = hSessionRef.current
      if (multiPartSign) {
        const encodedChunks = chunks.map((c) => new TextEncoder().encode(c))
        const s = hsm_signMultiPart(M, hSession, handles!.priv, encodedChunks, mech)
        setSig(s)
      } else {
        const s = hsm_ecdsaSign(M, hSession, handles!.priv, message, mech)
        setSig(s)
      }
      setVerifyResult(null)
    })

  const handleVerify = () =>
    run('Verify', () => {
      const M = moduleRef.current!
      const hSession = hSessionRef.current
      const fullMsg = multiPartSign ? chunks.join('') : message
      const valid = hsm_ecdsaVerify(M, hSession, handles!.pub, fullMsg, sig!, mech)
      setVerifyResult(valid)
    })

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          {(['P-256', 'P-384', 'P-521'] as EcCurve[]).map((c) => (
            <Button
              variant="ghost"
              key={c}
              onClick={() => {
                setCurve(c)
                setHandles(null)
                setSig(null)
                setVerifyResult(null)
              }}
              className={`text-xs rounded-lg px-3 py-1.5 border transition-colors ${
                curve === c
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-muted border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {c}
            </Button>
          ))}
          <Button
            variant="gradient"
            size="sm"
            onClick={handleGenKeys}
            disabled={loadingOp !== null}
          >
            {loadingOp === 'KeyGen' && <Loader2 size={14} className="animate-spin mr-1" />}
            {handles ? `Regen ${curve}` : 'Generate Key Pair'}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            <HsmResultRow label="pub handle" value={`h=${handles.pub}`} />
            <HsmResultRow label="priv handle" value={`h=${handles.priv}`} />
          </div>
        )}
      </div>

      {handles && (
        <div className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Mechanism</span>
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setMultiPartSign((v) => !v)
                setSig(null)
                setVerifyResult(null)
              }}
              className={`text-[10px] rounded-lg px-2 py-0.5 border transition-colors ${
                multiPartSign
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-muted border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              Multi-part
            </Button>
          </div>
          <FilterDropdown
            items={ECDSA_MECHS.map((m2) => ({ id: String(m2.value), label: m2.label }))}
            selectedId={String(mech)}
            onSelect={(id) => {
              setMech(parseInt(id, 10))
              setSig(null)
              setVerifyResult(null)
            }}
            noContainer
          />
          {multiPartSign ? (
            <div className="space-y-1.5">
              {chunks.map((chunk, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground w-4">#{idx + 1}</span>
                  <input
                    type="text"
                    value={chunk}
                    onChange={(e) => {
                      setChunks((prev) => prev.map((c, i) => (i === idx ? e.target.value : c)))
                      setSig(null)
                      setVerifyResult(null)
                    }}
                    placeholder={`Chunk ${idx + 1}…`}
                    className="flex-1 text-xs rounded-lg px-2 py-1 bg-muted border border-border text-foreground font-mono"
                  />
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => {
                      if (chunks.length > 1) {
                        setChunks((prev) => prev.filter((_, i) => i !== idx))
                        setSig(null)
                        setVerifyResult(null)
                      }
                    }}
                    disabled={chunks.length <= 1}
                    className="text-muted-foreground hover:text-status-error disabled:opacity-30"
                  >
                    <X size={10} />
                  </Button>
                </div>
              ))}
              <Button
                variant="ghost"
                type="button"
                onClick={() => setChunks((prev) => [...prev, ''])}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <Plus size={10} /> Add chunk
              </Button>
            </div>
          ) : (
            <input
              type="text"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                setSig(null)
                setVerifyResult(null)
              }}
              placeholder="Message to sign"
              className="w-full text-xs rounded-lg px-3 py-1.5 bg-muted border border-border text-foreground"
            />
          )}
          <div className="flex gap-2">
            <Button variant="gradient" size="sm" onClick={handleSign} disabled={loadingOp !== null}>
              {loadingOp === 'Sign' && <Loader2 size={14} className="animate-spin mr-1" />}
              {multiPartSign ? 'C_SignUpdate' : 'C_Sign'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleVerify}
              disabled={loadingOp !== null || !sig}
            >
              {loadingOp === 'Verify' && <Loader2 size={14} className="animate-spin mr-1" />}{' '}
              C_Verify
            </Button>
          </div>
          {sig && <HsmResultRow label={`Sig (${sig.length}B, DER-ASN.1)`} value={toHex(sig)} />}
          {verifyResult !== null && (
            <div
              className={`flex items-center gap-2 text-xs font-medium rounded px-2 py-1 ${verifyResult ? 'text-status-success bg-status-success/10' : 'text-status-error bg-status-error/10'}`}
            >
              {verifyResult ? (
                <>
                  <CheckCircle size={12} /> Valid
                </>
              ) : (
                <>
                  <XCircle size={12} /> Invalid
                </>
              )}
            </div>
          )}
        </div>
      )}

      <MiniPkcsLog />
      {error && <ErrorAlert message={error} />}
    </div>
  )
}

// ── EdDSA sub-panel ──────────────────────────────────────────────────────────

const EddsaPanel = () => {
  const { moduleRef, hSessionRef, addHsmKey } = useHsmContext()
  type EdCurve = 'Ed25519' | 'Ed448'
  const [curve, setCurve] = useState<EdCurve>('Ed25519')
  const [extractable, setExtractable] = useState(false)
  const [handles, setHandles] = useState<{ pub: number; priv: number } | null>(null)
  const [message, setMessage] = useState('Hello from EdDSA!')
  const [sig, setSig] = useState<Uint8Array | null>(null)
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null)
  const [loadingOp, setLoadingOp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  const handleGenKeys = () =>
    run('KeyGen', () => {
      const M = moduleRef.current!
      const hSession = hSessionRef.current
      const { pubHandle, privHandle } = hsm_generateEdDSAKeyPair(M, hSession, curve, extractable)
      addHsmKey({
        handle: pubHandle,
        family: 'eddsa',
        role: 'public',
        label: `${curve} Public Key`,
        variant: curve,
        generatedAt: new Date().toISOString(),
      })
      addHsmKey({
        handle: privHandle,
        family: 'eddsa',
        role: 'private',
        label: `${curve} Private Key${extractable ? ' (extractable)' : ''}`,
        variant: curve,
        generatedAt: new Date().toISOString(),
      })
      setHandles({ pub: pubHandle, priv: privHandle })
      setSig(null)
      setVerifyResult(null)
    })

  const handleSign = () =>
    run('Sign', () => {
      const M = moduleRef.current!
      const hSession = hSessionRef.current
      const s = hsm_eddsaSign(M, hSession, handles!.priv, message)
      setSig(s)
      setVerifyResult(null)
    })

  const handleVerify = () =>
    run('Verify', () => {
      const M = moduleRef.current!
      const hSession = hSessionRef.current
      const valid = hsm_eddsaVerify(M, hSession, handles!.pub, message, sig!)
      setVerifyResult(valid)
    })

  const sigBytes = curve === 'Ed25519' ? 64 : 114

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {(['Ed25519', 'Ed448'] as EdCurve[]).map((c) => (
            <Button
              variant="ghost"
              key={c}
              onClick={() => {
                setCurve(c)
                setHandles(null)
                setSig(null)
                setVerifyResult(null)
              }}
              className={`text-xs rounded-lg px-3 py-1.5 border transition-colors ${
                curve === c
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-muted border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {c}
            </Button>
          ))}
          <Button
            variant="gradient"
            size="sm"
            onClick={handleGenKeys}
            disabled={loadingOp !== null}
          >
            {loadingOp === 'KeyGen' && <Loader2 size={14} className="animate-spin mr-1" />}
            {handles ? `Regen ${curve}` : 'Generate Key Pair'}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            <HsmResultRow label="pub handle" value={`h=${handles.pub}`} />
            <HsmResultRow label="priv handle" value={`h=${handles.priv}`} />
          </div>
        )}
      </div>

      {handles && (
        <div className="space-y-2 rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">
            Mechanism: <span className="font-mono text-primary">CKM_EDDSA (0x1057)</span> —
            deterministic, no prehash (pure EdDSA), signature is {sigBytes} bytes
          </p>
          <input
            type="text"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              setSig(null)
              setVerifyResult(null)
            }}
            placeholder="Message to sign"
            className="w-full text-xs rounded-lg px-3 py-1.5 bg-muted border border-border text-foreground"
          />
          <div className="flex gap-2">
            <Button variant="gradient" size="sm" onClick={handleSign} disabled={loadingOp !== null}>
              {loadingOp === 'Sign' && <Loader2 size={14} className="animate-spin mr-1" />} C_Sign
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleVerify}
              disabled={loadingOp !== null || !sig}
            >
              {loadingOp === 'Verify' && <Loader2 size={14} className="animate-spin mr-1" />}{' '}
              C_Verify
            </Button>
          </div>
          {sig && <HsmResultRow label={`Sig (${sig.length}B)`} value={toHex(sig)} />}
          {verifyResult !== null && (
            <div
              className={`flex items-center gap-2 text-xs font-medium rounded px-2 py-1 ${verifyResult ? 'text-status-success bg-status-success/10' : 'text-status-error bg-status-error/10'}`}
            >
              {verifyResult ? (
                <>
                  <CheckCircle size={12} /> Valid
                </>
              ) : (
                <>
                  <XCircle size={12} /> Invalid
                </>
              )}
            </div>
          )}
        </div>
      )}

      <MiniPkcsLog />
      {error && <ErrorAlert message={error} />}
    </div>
  )
}

// ── Main panel ───────────────────────────────────────────────────────────────

export const HsmClassicalSignPanel = () => {
  const { isReady } = useHsmContext()
  const [mode, setMode] = useState<ClassicMode>('rsa')

  const currentMode = CLASSIC_MODES.find((m) => m.id === mode)!

  return (
    <HsmReadyGuard isReady={isReady}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <PenLine size={18} className="text-primary" />
          <h3 className="font-semibold text-foreground">Classical Sign / Verify / Encrypt</h3>
          <span className="text-xs text-muted-foreground ml-auto">{currentMode.spec}</span>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-xl">
          {CLASSIC_MODES.map((m) => (
            <Button
              variant="ghost"
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex-1 text-xs rounded-lg px-2 py-1.5 transition-colors ${
                mode === m.id
                  ? 'bg-primary/20 text-primary font-medium shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {m.label}
            </Button>
          ))}
        </div>

        {/* Sub-panels */}
        {mode === 'rsa' && <RsaPanel />}
        {mode === 'ecdsa' && <EcdsaPanel />}
        {mode === 'eddsa' && <EddsaPanel />}
      </div>
    </HsmReadyGuard>
  )
}

// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useState } from 'react'
import { Filter, Loader2 } from 'lucide-react'
import { Button } from '../../ui/button'
import { ErrorAlert } from '../../ui/error-alert'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { ShareButton } from '../../ui/ShareButton'
import {
  CKP_PKCS5_PBKD2_HMAC_SHA256,
  CKP_PKCS5_PBKD2_HMAC_SHA384,
  CKP_PKCS5_PBKD2_HMAC_SHA512,
  CKM_SHA256,
  CKM_SHA384,
  CKM_SHA512,
  CKM_SHA3_256,
  CKM_SHA3_512,
  CKM_AES_CMAC,
  hsm_pbkdf2,
  hsm_generateAESKey,
  hsm_destroyObject,
  hsm_hkdf,
  hsm_kbkdf,
  hsm_kbkdfFeedback,
} from '../../../wasm/softhsm'
import { useHsmContext } from './HsmContext'
import { HsmReadyGuard, HsmResultRow, toHex } from './shared'
import { MiniPkcsLog } from '../components/MiniPkcsLog'

// ── Types & constants ────────────────────────────────────────────────────────

type KdfMode = 'pbkdf2' | 'hkdf' | 'kbkdf-counter' | 'kbkdf-feedback'

const KDF_MODES: { id: KdfMode; label: string; spec: string; useCase: string; pqcNote: string }[] =
  [
    {
      id: 'pbkdf2',
      label: 'PBKDF2',
      spec: 'PKCS#11 v3.2 §5.7.3 / CKM_PKCS5_PBKD2',
      useCase: 'Password hashing · BIP39 mnemonic seed · low-entropy key material',
      pqcNote: 'Use to derive AES keys from passphrase-protected PQC key vaults (SP 800-132)',
    },
    {
      id: 'hkdf',
      label: 'HKDF',
      spec: 'PKCS#11 v3.2 §2.43 / CKM_HKDF_DERIVE',
      useCase: 'KEM shared-secret expansion · TLS 1.3 key schedule (RFC 8446)',
      pqcNote:
        'SP 800-56C Rev2 §6.1 mandates HKDF to expand ML-KEM shared secrets in hybrid schemes',
    },
    {
      id: 'kbkdf-counter',
      label: 'KBKDF Counter',
      spec: 'SP 800-108 Rev1 §4.1 / PKCS#11 v3.2 §2.44 / CKM_SP800_108_COUNTER_KDF',
      useCase: 'PSK derivation · segmented key material · IKEv2 / QKD post-processing',
      pqcNote:
        'SP 800-56C Rev2 §6.2 recommends counter-mode KBKDF to expand ML-KEM secrets into session keys',
    },
    {
      id: 'kbkdf-feedback',
      label: 'KBKDF Feedback',
      spec: 'SP 800-108 Rev1 §4.2 / PKCS#11 v3.2 §2.44.2 / CKM_SP800_108_FEEDBACK_KDF',
      useCase: 'Chained derivation where each output feeds the next MAC input',
      pqcNote: 'Suitable for deriving a chain of sub-keys from a single ML-KEM or QKD session key',
    },
  ]

const PBKDF2_PRFS = [
  { label: 'HMAC-SHA-256', value: CKP_PKCS5_PBKD2_HMAC_SHA256 },
  { label: 'HMAC-SHA-384', value: CKP_PKCS5_PBKD2_HMAC_SHA384 },
  { label: 'HMAC-SHA-512', value: CKP_PKCS5_PBKD2_HMAC_SHA512 },
]

const HKDF_PRFS = [
  { label: 'SHA-256', value: CKM_SHA256 },
  { label: 'SHA-384', value: CKM_SHA384 },
  { label: 'SHA-512', value: CKM_SHA512 },
  { label: 'SHA3-256', value: CKM_SHA3_256 },
  { label: 'SHA3-512', value: CKM_SHA3_512 },
]

// prfType for SP 800-108 KDF params is the *hash* mechanism (CKM_SHA256 etc.),
// not the HMAC mechanism — SoftHSM3's ckmToDigestName() maps SHA→"SHA2-256" etc.
// and internally constructs HMAC using that hash. AES-CMAC is the exception.
const KBKDF_PRFS = [
  { label: 'HMAC-SHA-256', value: CKM_SHA256 },
  { label: 'HMAC-SHA-384', value: CKM_SHA384 },
  { label: 'HMAC-SHA-512', value: CKM_SHA512 },
  { label: 'AES-CMAC', value: CKM_AES_CMAC },
]

// OpenSSL KBKDF requires the feedback IV to be exactly h bytes (MAC output size).
// PROV_R_INVALID_SEED_LENGTH is raised if iv_len != 0 && iv_len != h.
const PRF_SEED_BYTES: Record<number, number> = {
  [CKM_SHA256]: 32,
  [CKM_SHA384]: 48,
  [CKM_SHA512]: 64,
  [CKM_AES_CMAC]: 16,
}

const OUTPUT_LENS = [16, 24, 32] as const

// ── Hex validation helpers ───────────────────────────────────────────────────

const isValidHex = (s: string) => /^[0-9a-fA-F\s:]*$/.test(s)
const hexByteLen = (s: string) => Math.floor(s.replace(/[\s:]/g, '').replace(/^0x/i, '').length / 2)

// ── Random hex helpers ───────────────────────────────────────────────────────

const randomHex = (bytes: number) =>
  Array.from(crypto.getRandomValues(new Uint8Array(bytes)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

const hexToBytes = (hex: string): Uint8Array => {
  const clean = hex.replace(/\s+/g, '')
  const bytes = new Uint8Array(Math.floor(clean.length / 2))
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16) // eslint-disable-line security/detect-object-injection
  }
  return bytes
}

// ── PBKDF2 sub-panel ─────────────────────────────────────────────────────────

const Pbkdf2Panel = ({ onAlgoChange }: { onAlgoChange?: (algo: string) => void } = {}) => {
  const { moduleRef, hSessionRef } = useHsmContext()
  const [password, setPassword] = useState('correct-horse-battery-staple')
  const [salt, setSalt] = useState(() => randomHex(16))
  const [iterations, setIterations] = useState(100000)
  const [prf, setPrf] = useState(CKP_PKCS5_PBKD2_HMAC_SHA512)
  const [outLen, setOutLen] = useState<16 | 24 | 32>(32)
  const [derived, setDerived] = useState<Uint8Array | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    onAlgoChange?.(`PBKDF2-${outLen * 8}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDerive = async () => {
    setError(null)
    setLoading(true)
    try {
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          try {
            const M = moduleRef.current!
            const hSession = hSessionRef.current
            const passBytes = new TextEncoder().encode(password)
            const saltBytes = hexToBytes(salt)
            const key = hsm_pbkdf2(M, hSession, passBytes, saltBytes, iterations, outLen, prf)
            setDerived(key)
            resolve()
          } catch (e) {
            setError(e instanceof Error ? e.message : String(e))
            resolve()
          }
        }, 0)
      })
    } finally {
      setLoading(false)
    }
  }

  const prfLabel = PBKDF2_PRFS.find((p) => p.value === prf)?.label ?? ''

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Password</p>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full text-xs rounded-lg px-3 py-1.5 bg-muted border border-border text-foreground"
          />
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Salt (hex)</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={salt}
              onChange={(e) => setSalt(e.target.value)}
              className={`flex-1 text-xs font-mono rounded-lg px-3 py-1.5 bg-muted border text-foreground ${!isValidHex(salt) ? 'border-status-error' : 'border-border'}`}
            />
            <Button variant="outline" size="sm" onClick={() => setSalt(randomHex(16))}>
              Random
            </Button>
          </div>
          <p
            className={`text-[10px] font-mono ${!isValidHex(salt) ? 'text-status-error' : 'text-muted-foreground'}`}
          >
            {isValidHex(salt) ? `${hexByteLen(salt)}B` : 'invalid hex'}
          </p>
          {isValidHex(salt) && hexByteLen(salt) < 16 && (
            <p className="text-[10px] text-status-warning">
              Below NIST SP 800-132 §5.1 minimum (16B / 128 bits)
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Iterations</p>
            <input
              type="number"
              value={iterations}
              min={1000}
              max={1000000}
              onChange={(e) => setIterations(Number(e.target.value))}
              className="w-full text-xs rounded-lg px-3 py-1.5 bg-muted border border-border text-foreground"
            />
            {iterations < 100_000 && (
              <p className="text-[10px] text-status-warning">
                Below NIST SP 800-132 minimum (100,000)
              </p>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">PRF</p>
            <FilterDropdown
              items={PBKDF2_PRFS.map((p) => ({ id: String(p.value), label: p.label }))}
              selectedId={String(prf)}
              onSelect={(id) => setPrf(parseInt(id, 10))}
              noContainer
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Output (bytes)</p>
            <div className="flex gap-1">
              {OUTPUT_LENS.map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setOutLen(l)
                    onAlgoChange?.(`PBKDF2-${l * 8}`)
                  }}
                  className={`flex-1 text-xs rounded-lg px-1 py-1.5 border transition-colors ${
                    outLen === l
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Button
        variant="gradient"
        size="sm"
        className="w-full"
        onClick={handleDerive}
        disabled={loading || !password || !isValidHex(salt)}
      >
        {loading && <Loader2 size={14} className="animate-spin mr-1" />}
        C_DeriveKey (PBKDF2)
      </Button>

      {derived && (
        <div className="space-y-2">
          <HsmResultRow label={`Key (${derived.length}B)`} value={toHex(derived)} />
          <div className="bg-muted rounded-lg p-3 text-xs font-mono text-muted-foreground space-y-0.5">
            <div className="text-foreground font-semibold mb-1">CK_PKCS5_PBKD2_PARAMS2</div>
            <div> saltSource = CKZ_SALT_SPECIFIED</div>
            <div> pSaltSourceData = 0x{salt.slice(0, 16)}…</div>
            <div> iterations = {iterations}</div>
            <div> prf = {prfLabel}</div>
            <div> keyLen = {outLen}</div>
          </div>
        </div>
      )}

      {error && <ErrorAlert message={error} />}
    </div>
  )
}

// ── HKDF sub-panel ───────────────────────────────────────────────────────────

const HkdfPanel = ({ onAlgoChange }: { onAlgoChange?: (algo: string) => void } = {}) => {
  const { moduleRef, hSessionRef, addHsmKey, removeHsmKey } = useHsmContext()
  const [prf, setPrf] = useState(CKM_SHA256)
  const [salt, setSalt] = useState(() => randomHex(16))
  const [info, setInfo] = useState('HKDF-example-context')
  const [outLen, setOutLen] = useState<16 | 24 | 32>(32)
  const [bExtract, setBExtract] = useState(true)
  const [bExpand, setBExpand] = useState(true)
  const [derived, setDerived] = useState<Uint8Array | null>(null)
  const [ikmHandle, setIkmHandle] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    onAlgoChange?.(`HKDF-${outLen * 8}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleGenIkm = async () => {
    setError(null)
    setLoading(true)
    try {
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          try {
            const M = moduleRef.current!
            const hSession = hSessionRef.current
            if (ikmHandle !== null) {
              try {
                hsm_destroyObject(M, hSession, ikmHandle)
              } catch {
                /* ignore */
              }
              removeHsmKey(ikmHandle)
            }
            const h = hsm_generateAESKey(M, hSession, 256)
            setIkmHandle(h)
            setDerived(null)
            addHsmKey({
              handle: h,
              label: 'IKM (AES-256)',
              family: 'aes',
              role: 'secret',
              generatedAt: new Date().toISOString(),
            })
            resolve()
          } catch (e) {
            setError(e instanceof Error ? e.message : String(e))
            resolve()
          }
        }, 0)
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDerive = async () => {
    if (!ikmHandle) return
    setError(null)
    setLoading(true)
    try {
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          try {
            const M = moduleRef.current!
            const hSession = hSessionRef.current
            const saltBytes = salt ? hexToBytes(salt) : undefined
            const infoBytes = info ? new TextEncoder().encode(info) : undefined
            const key = hsm_hkdf(
              M,
              hSession,
              ikmHandle,
              prf,
              bExtract,
              bExpand,
              saltBytes,
              infoBytes,
              outLen
            )
            setDerived(key)
            resolve()
          } catch (e) {
            setError(e instanceof Error ? e.message : String(e))
            resolve()
          }
        }, 0)
      })
    } finally {
      setLoading(false)
    }
  }

  const prfLabel = HKDF_PRFS.find((p) => p.value === prf)?.label ?? ''

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Button
            variant={ikmHandle ? 'outline' : 'gradient'}
            size="sm"
            onClick={handleGenIkm}
            disabled={loading}
          >
            {loading && !ikmHandle ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
            {ikmHandle ? `IKM h=${ikmHandle} (AES-256)` : 'Generate IKM (AES-256)'}
          </Button>
          {ikmHandle && (
            <span className="text-xs text-status-success">✓ Key handle {ikmHandle}</span>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Salt (hex, optional)</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={salt}
              onChange={(e) => setSalt(e.target.value)}
              placeholder="leave blank for no salt"
              className={`flex-1 text-xs font-mono rounded-lg px-3 py-1.5 bg-muted border text-foreground ${salt && !isValidHex(salt) ? 'border-status-error' : 'border-border'}`}
            />
            <Button variant="outline" size="sm" onClick={() => setSalt(randomHex(16))}>
              Random
            </Button>
          </div>
          {salt && (
            <p
              className={`text-[10px] font-mono ${!isValidHex(salt) ? 'text-status-error' : 'text-muted-foreground'}`}
            >
              {isValidHex(salt) ? `${hexByteLen(salt)}B` : 'invalid hex'}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Info / context (text)</p>
          <input
            type="text"
            value={info}
            onChange={(e) => setInfo(e.target.value)}
            className="w-full text-xs rounded-lg px-3 py-1.5 bg-muted border border-border text-foreground"
          />
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Steps (RFC 5869 §2)</p>
          <div className="flex gap-1">
            {(
              [
                {
                  key: 'extract',
                  label: 'Extract',
                  active: bExtract,
                  toggle: () => setBExtract((v) => !v),
                },
                {
                  key: 'expand',
                  label: 'Expand',
                  active: bExpand,
                  toggle: () => setBExpand((v) => !v),
                },
              ] as const
            ).map(({ key, label, active, toggle }) => (
              <button
                key={key}
                onClick={toggle}
                className={`flex-1 text-xs rounded-lg px-2 py-1.5 border transition-colors ${
                  active
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {!bExtract && !bExpand && (
            <p className="text-[10px] text-status-warning">Select at least one step</p>
          )}
          {!bExtract && bExpand && (
            <p className="text-[10px] text-muted-foreground">
              Expand-only: salt is ignored; IKM is treated as PRK directly
            </p>
          )}
          {bExtract && !bExpand && (
            <p className="text-[10px] text-muted-foreground">
              Extract-only: outputs PRK; Info/context is ignored
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">PRF Hash</p>
            <FilterDropdown
              items={HKDF_PRFS.map((p) => ({ id: String(p.value), label: p.label }))}
              selectedId={String(prf)}
              onSelect={(id) => setPrf(parseInt(id, 10))}
              noContainer
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Output (bytes)</p>
            <div className="flex gap-1">
              {OUTPUT_LENS.map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setOutLen(l)
                    onAlgoChange?.(`HKDF-${l * 8}`)
                  }}
                  className={`flex-1 text-xs rounded-lg px-1 py-1.5 border transition-colors ${
                    outLen === l
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Button
        variant="gradient"
        size="sm"
        className="w-full"
        onClick={handleDerive}
        disabled={loading || !ikmHandle || (!bExtract && !bExpand) || (!!salt && !isValidHex(salt))}
      >
        {loading && ikmHandle ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
        C_DeriveKey (HKDF —{' '}
        {bExtract && bExpand ? 'Extract+Expand' : bExtract ? 'Extract only' : 'Expand only'})
      </Button>

      {derived && (
        <div className="space-y-2">
          <HsmResultRow label={`OKM (${derived.length}B)`} value={toHex(derived)} />
          <div className="bg-muted rounded-lg p-3 text-xs font-mono text-muted-foreground space-y-0.5">
            <div className="text-foreground font-semibold mb-1">CK_HKDF_PARAMS (RFC 5869)</div>
            <div> bExtract = {bExtract ? 'CK_TRUE' : 'CK_FALSE'}</div>
            <div> bExpand = {bExpand ? 'CK_TRUE' : 'CK_FALSE'}</div>
            <div>
              {' '}
              prfHashMechanism = {prfLabel} ({prf})
            </div>
            <div> ulSaltType = {salt ? 'CKF_HKDF_SALT_DATA' : 'CKF_HKDF_SALT_NULL'}</div>
            <div> ulInfoLen = {info.length} bytes</div>
            <div> keyLen = {outLen}</div>
          </div>
        </div>
      )}

      {error && <ErrorAlert message={error} />}
    </div>
  )
}

// ── KBKDF sub-panel (Counter + Feedback) ─────────────────────────────────────

const KbkdfPanel = ({
  feedback,
  onAlgoChange,
}: {
  feedback: boolean
  onAlgoChange?: (algo: string) => void
}) => {
  const { moduleRef, hSessionRef, addHsmKey, removeHsmKey } = useHsmContext()
  const [prf, setPrf] = useState(CKM_SHA256)
  const [label, setLabel] = useState('pqc-key-derivation')
  const [context, setContext] = useState(() => randomHex(8))
  // IV must be exactly h bytes (MAC output size) or absent — OpenSSL enforces this
  const [iv, setIv] = useState(() => randomHex(PRF_SEED_BYTES[CKM_SHA256] ?? 32))

  // Keep IV length in sync with selected PRF
  useEffect(() => {
    if (feedback) setIv(randomHex(PRF_SEED_BYTES[prf] ?? 32))
  }, [prf, feedback])
  const [outLen, setOutLen] = useState<16 | 24 | 32>(32)
  const [baseKeyHandle, setBaseKeyHandle] = useState<number | null>(null)
  const [derived, setDerived] = useState<Uint8Array | null>(null)
  const [fixedInputHex, setFixedInputHex] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mechName = feedback ? 'CKM_SP800_108_FEEDBACK_KDF' : 'CKM_SP800_108_COUNTER_KDF'
  const mechCode = feedback ? '0x3ad' : '0x3ac'

  useEffect(() => {
    onAlgoChange?.(`${feedback ? 'KBKDF-Feedback' : 'KBKDF-Counter'}-${outLen * 8}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleGenBase = async () => {
    setError(null)
    setLoading(true)
    try {
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          try {
            const M = moduleRef.current!
            const hSession = hSessionRef.current
            if (baseKeyHandle !== null) {
              try {
                hsm_destroyObject(M, hSession, baseKeyHandle)
              } catch {
                /* ignore */
              }
              removeHsmKey(baseKeyHandle)
            }
            const h = hsm_generateAESKey(M, hSession, 256)
            setBaseKeyHandle(h)
            setDerived(null)
            setFixedInputHex(null)
            addHsmKey({
              handle: h,
              label: `Ki (AES-256) — ${feedback ? 'KBKDF-Feedback' : 'KBKDF-Counter'}`,
              family: 'aes',
              role: 'secret',
              generatedAt: new Date().toISOString(),
            })
            resolve()
          } catch (e) {
            setError(e instanceof Error ? e.message : String(e))
            resolve()
          }
        }, 0)
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDerive = async () => {
    if (!baseKeyHandle) return
    setError(null)
    setLoading(true)
    try {
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          try {
            const M = moduleRef.current!
            const hSession = hSessionRef.current
            const labelBytes = new TextEncoder().encode(label)
            const contextBytes = hexToBytes(context)
            // Concatenate label + 0x00 separator + context as fixedInput
            const fixedInput = new Uint8Array(labelBytes.length + 1 + contextBytes.length)
            fixedInput.set(labelBytes, 0)
            fixedInput[labelBytes.length] = 0x00
            fixedInput.set(contextBytes, labelBytes.length + 1)

            let key: Uint8Array
            if (feedback) {
              const ivBytes = iv ? hexToBytes(iv) : undefined
              key = hsm_kbkdfFeedback(M, hSession, baseKeyHandle, prf, fixedInput, ivBytes, outLen)
            } else {
              key = hsm_kbkdf(M, hSession, baseKeyHandle, prf, fixedInput, outLen)
            }
            setDerived(key)
            setFixedInputHex(toHex(fixedInput))
            resolve()
          } catch (e) {
            setError(e instanceof Error ? e.message : String(e))
            resolve()
          }
        }, 0)
      })
    } finally {
      setLoading(false)
    }
  }

  const prfLabel = KBKDF_PRFS.find((p) => p.value === prf)?.label ?? ''

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Button
            variant={baseKeyHandle ? 'outline' : 'gradient'}
            size="sm"
            onClick={handleGenBase}
            disabled={loading}
          >
            {loading && !baseKeyHandle ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
            {baseKeyHandle ? `Base Key h=${baseKeyHandle}` : 'Generate Base Key (AES-256)'}
          </Button>
          {baseKeyHandle && (
            <span className="text-xs text-status-success">✓ Ki h={baseKeyHandle}</span>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Label (text)</p>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full text-xs rounded-lg px-3 py-1.5 bg-muted border border-border text-foreground"
          />
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Context (hex)</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className={`flex-1 text-xs font-mono rounded-lg px-3 py-1.5 bg-muted border text-foreground ${!isValidHex(context) ? 'border-status-error' : 'border-border'}`}
            />
            <Button variant="outline" size="sm" onClick={() => setContext(randomHex(8))}>
              Random
            </Button>
          </div>
          <p
            className={`text-[10px] font-mono ${!isValidHex(context) ? 'text-status-error' : 'text-muted-foreground'}`}
          >
            {isValidHex(context) ? `${hexByteLen(context)}B` : 'invalid hex'}
          </p>
        </div>

        {feedback && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">IV / Seed (hex, optional)</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={iv}
                onChange={(e) => setIv(e.target.value)}
                placeholder="leave blank for no IV"
                className={`flex-1 text-xs font-mono rounded-lg px-3 py-1.5 bg-muted border text-foreground ${iv && hexByteLen(iv) !== (PRF_SEED_BYTES[prf] ?? 32) ? 'border-status-error' : 'border-border'}`}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIv(randomHex(PRF_SEED_BYTES[prf] ?? 32))}
              >
                Random
              </Button>
            </div>
            {iv && (
              <p
                className={`text-[10px] font-mono ${hexByteLen(iv) !== (PRF_SEED_BYTES[prf] ?? 32) ? 'text-status-error' : 'text-muted-foreground'}`}
              >
                {hexByteLen(iv)}/{PRF_SEED_BYTES[prf] ?? 32}B — IV must equal PRF output size
                (OpenSSL PROV_R_INVALID_SEED_LENGTH)
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">PRF</p>
            <FilterDropdown
              items={KBKDF_PRFS.map((p) => ({ id: String(p.value), label: p.label }))}
              selectedId={String(prf)}
              onSelect={(id) => setPrf(parseInt(id, 10))}
              noContainer
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Output (bytes)</p>
            <div className="flex gap-1">
              {OUTPUT_LENS.map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setOutLen(l)
                    onAlgoChange?.(`${feedback ? 'KBKDF-Feedback' : 'KBKDF-Counter'}-${l * 8}`)
                  }}
                  className={`flex-1 text-xs rounded-lg px-1 py-1.5 border transition-colors ${
                    outLen === l
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Button
        variant="gradient"
        size="sm"
        className="w-full"
        onClick={handleDerive}
        disabled={
          loading ||
          !baseKeyHandle ||
          !isValidHex(context) ||
          (feedback && !!iv && hexByteLen(iv) !== (PRF_SEED_BYTES[prf] ?? 32))
        }
      >
        {loading && baseKeyHandle ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
        C_DeriveKey ({mechName})
      </Button>

      {derived && (
        <div className="space-y-2">
          <HsmResultRow label={`Ko (${derived.length}B)`} value={toHex(derived)} />
          <div className="bg-muted rounded-lg p-3 text-xs font-mono text-muted-foreground space-y-0.5">
            <div className="text-foreground font-semibold mb-1">
              {mechName} ({mechCode})
            </div>
            <div> prfType = {prfLabel}</div>
            {feedback ? (
              <>
                <div> ulNumberOfDataParams = 1</div>
                <div> pDataParams[0] = BYTE_ARRAY (label∥0x00∥context)</div>
                {fixedInputHex && (
                  <div className="text-primary/80">
                    {' '}
                    fixedData = 0x{fixedInputHex.slice(0, 32)}… ({label}∥0x00∥context)
                  </div>
                )}
                <div>
                  {' '}
                  pIV / ulIVLen = {iv ? `0x${iv.slice(0, 16)}… (${hexByteLen(iv)}B)` : 'NULL'}
                </div>
              </>
            ) : (
              <>
                <div> ulNumberOfDataParams = 2</div>
                <div> pDataParams[0] = ITERATION_VARIABLE (32-bit counter, big-endian)</div>
                <div> pDataParams[1] = BYTE_ARRAY (label∥0x00∥context)</div>
                {fixedInputHex && (
                  <div className="text-primary/80">
                    {' '}
                    fixedInput = 0x{fixedInputHex.slice(0, 32)}… ({label}∥0x00∥context)
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {error && <ErrorAlert message={error} />}
    </div>
  )
}

// ── Main panel ───────────────────────────────────────────────────────────────

const KDF_MODE_URL: Record<KdfMode, string> = {
  pbkdf2: 'PBKDF2',
  hkdf: 'HKDF',
  'kbkdf-counter': 'KBKDF-Counter',
  'kbkdf-feedback': 'KBKDF-Feedback',
}

export const HsmKdfPanel = ({
  initialAlgo,
  onAlgoChange,
}: { initialAlgo?: string; onAlgoChange?: (algo: string) => void } = {}) => {
  const { isReady } = useHsmContext()
  const [mode, setMode] = useState<KdfMode>(() => {
    if (initialAlgo?.startsWith('HKDF')) return 'hkdf'
    if (initialAlgo?.startsWith('KBKDF-Counter')) return 'kbkdf-counter'
    if (initialAlgo?.startsWith('KBKDF-Feedback')) return 'kbkdf-feedback'
    return 'pbkdf2'
  })

  const currentMode = KDF_MODES.find((m) => m.id === mode)!

  return (
    <HsmReadyGuard isReady={isReady}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-primary" />
          <h3 className="font-semibold text-foreground">Key Derivation Functions</h3>
          <div className="ml-auto flex items-center gap-1">
            <ShareButton title="HSM Key Derivation" variant="icon" />
            <span className="text-xs text-muted-foreground">{currentMode.spec}</span>
          </div>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-xl">
          {KDF_MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setMode(m.id)
                onAlgoChange?.(KDF_MODE_URL[m.id])
              }}
              className={`flex-1 text-xs rounded-lg px-2 py-2 min-h-[36px] transition-colors ${
                mode === m.id
                  ? 'bg-primary/20 text-primary font-medium shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {m.label}
            </button>
          ))}
          {/* Double-Pipeline: defined in SP 800-108 Rev1 §4.3 / CKM_SP800_108_DOUBLE_PIPELINE_KDF
              Not yet implemented in this WASM build */}
          <button
            disabled
            title="SP 800-108 Rev1 §4.3 / CKM_SP800_108_DOUBLE_PIPELINE_KDF — not yet implemented in this WASM build"
            className="flex-1 text-xs rounded-lg px-2 py-2 min-h-[36px] text-muted-foreground/40 cursor-not-allowed"
          >
            KBKDF DP
          </button>
        </div>

        {/* Mode description */}
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 space-y-0.5">
          <p className="text-xs text-foreground">{currentMode.useCase}</p>
          <p className="text-[10px] text-primary/80">{currentMode.pqcNote}</p>
        </div>

        {/* Sub-panels */}
        {mode === 'pbkdf2' && <Pbkdf2Panel onAlgoChange={onAlgoChange} />}
        {mode === 'hkdf' && <HkdfPanel onAlgoChange={onAlgoChange} />}
        {mode === 'kbkdf-counter' && <KbkdfPanel feedback={false} onAlgoChange={onAlgoChange} />}
        {mode === 'kbkdf-feedback' && <KbkdfPanel feedback={true} onAlgoChange={onAlgoChange} />}

        {/* Unified PKCS#11 call log — one instance for all KDF modes */}
        <MiniPkcsLog />
      </div>
    </HsmReadyGuard>
  )
}

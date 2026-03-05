// SPDX-License-Identifier: GPL-3.0-only
import { useState, useRef, useCallback } from 'react'
import { Shield, CheckCircle, XCircle, Copy, Trash2, Loader2, ChevronRight } from 'lucide-react'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { ErrorAlert } from '../../ui/error-alert'
import { FilterDropdown } from '../../common/FilterDropdown'
import {
  getSoftHSMModule,
  createLoggingProxy,
  hsm_initialize,
  hsm_getFirstSlot,
  hsm_initToken,
  hsm_openUserSession,
  hsm_generateMLKEMKeyPair,
  hsm_encapsulate,
  hsm_decapsulate,
  hsm_extractKeyValue,
  hsm_generateMLDSAKeyPair,
  hsm_sign,
  hsm_verify,
  hsm_generateSLHDSAKeyPair,
  hsm_slhdsaSign,
  hsm_slhdsaVerify,
  hsm_finalize,
  type Pkcs11LogEntry,
  type MLDSASignOptions,
  type MLDSAPreHash,
  type SLHDSAPreHash,
  CKP_SLH_DSA_SHA2_128S,
  CKP_SLH_DSA_SHAKE_128S,
  CKP_SLH_DSA_SHA2_128F,
  CKP_SLH_DSA_SHAKE_128F,
  CKP_SLH_DSA_SHA2_192S,
  CKP_SLH_DSA_SHAKE_192S,
  CKP_SLH_DSA_SHA2_192F,
  CKP_SLH_DSA_SHAKE_192F,
  CKP_SLH_DSA_SHA2_256S,
  CKP_SLH_DSA_SHAKE_256S,
  CKP_SLH_DSA_SHA2_256F,
  CKP_SLH_DSA_SHAKE_256F,
} from '../../../wasm/softhsm'
import { useSettingsContext } from '../contexts/SettingsContext'
import { useHsmContext } from '../hsm/HsmContext'
import { HsmSetupPanel } from '../hsm/HsmSetupPanel'

// ── Static size hints ────────────────────────────────────────────────────────

const KEM_SIZES: Record<512 | 768 | 1024, { pub: number; ct: number; ss: number }> = {
  512: { pub: 800, ct: 768, ss: 32 },
  768: { pub: 1184, ct: 1088, ss: 32 },
  1024: { pub: 1568, ct: 1568, ss: 32 },
}

const DSA_SIZES: Record<44 | 65 | 87, { pub: number; sig: number }> = {
  44: { pub: 1312, sig: 2420 },
  65: { pub: 1952, sig: 3293 },
  87: { pub: 2592, sig: 4627 },
}

// Pre-hash options shared by ML-DSA and SLH-DSA (PKCS#11 v3.2 CKM_HASH_*_DSA_* variants)
const PREHASH_OPTIONS = [
  { id: 'sha224', label: 'SHA-224' },
  { id: 'sha256', label: 'SHA-256' },
  { id: 'sha384', label: 'SHA-384' },
  { id: 'sha512', label: 'SHA-512' },
  { id: 'sha3-224', label: 'SHA3-224' },
  { id: 'sha3-256', label: 'SHA3-256' },
  { id: 'sha3-384', label: 'SHA3-384' },
  { id: 'sha3-512', label: 'SHA3-512' },
  { id: 'shake128', label: 'SHAKE-128' },
  { id: 'shake256', label: 'SHAKE-256' },
]

// SLH-DSA parameter sets (FIPS 205 / PKCS#11 v3.2 CKP_SLH_DSA_*)
const SLH_DSA_PARAM_SET_OPTIONS = [
  { id: 'sha2-128s', label: 'SHA2-128s', ckp: CKP_SLH_DSA_SHA2_128S, pub: 32, sig: 7856 },
  { id: 'shake-128s', label: 'SHAKE-128s', ckp: CKP_SLH_DSA_SHAKE_128S, pub: 32, sig: 7856 },
  { id: 'sha2-128f', label: 'SHA2-128f', ckp: CKP_SLH_DSA_SHA2_128F, pub: 32, sig: 17088 },
  { id: 'shake-128f', label: 'SHAKE-128f', ckp: CKP_SLH_DSA_SHAKE_128F, pub: 32, sig: 17088 },
  { id: 'sha2-192s', label: 'SHA2-192s', ckp: CKP_SLH_DSA_SHA2_192S, pub: 48, sig: 16224 },
  { id: 'shake-192s', label: 'SHAKE-192s', ckp: CKP_SLH_DSA_SHAKE_192S, pub: 48, sig: 16224 },
  { id: 'sha2-192f', label: 'SHA2-192f', ckp: CKP_SLH_DSA_SHA2_192F, pub: 48, sig: 35664 },
  { id: 'shake-192f', label: 'SHAKE-192f', ckp: CKP_SLH_DSA_SHAKE_192F, pub: 48, sig: 35664 },
  { id: 'sha2-256s', label: 'SHA2-256s', ckp: CKP_SLH_DSA_SHA2_256S, pub: 64, sig: 29792 },
  { id: 'shake-256s', label: 'SHAKE-256s', ckp: CKP_SLH_DSA_SHAKE_256S, pub: 64, sig: 29792 },
  { id: 'sha2-256f', label: 'SHA2-256f', ckp: CKP_SLH_DSA_SHA2_256F, pub: 64, sig: 49856 },
  { id: 'shake-256f', label: 'SHAKE-256f', ckp: CKP_SLH_DSA_SHAKE_256F, pub: 64, sig: 49856 },
] as const

// ── Helpers ──────────────────────────────────────────────────────────────────

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

const hexSnippet = (bytes: Uint8Array): string => {
  const h = toHex(bytes)
  return h.length > 40 ? `${h.slice(0, 20)}…${h.slice(-8)}` : h
}

const arraysEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

// ── Type for phase state ─────────────────────────────────────────────────────

type Phase = 'idle' | 'initialized' | 'session_open'

// ── Simulation step definitions ───────────────────────────────────────────────

const SIM_TOKEN_STEPS = [
  {
    call: 'C_Initialize(NULL_PTR)',
    rv: 'CKR_OK',
    note: 'Initialise the Cryptoki library.',
  },
  {
    call: 'C_GetSlotList(CK_FALSE, slotList, &count)',
    rv: 'CKR_OK → slot=0',
    note: 'Enumerate available slots; pick slot 0.',
  },
  {
    call: 'C_InitToken(slot=0, soPin, "SoftHSM3")',
    rv: 'CKR_OK → slot=1',
    note: 'Format the token, set SO PIN, get new slot after re-init.',
  },
  {
    call: 'C_OpenSession(slot=1, RW|SERIAL)',
    rv: 'CKR_OK → hSession=1',
    note: 'Open a read-write session on the token.',
  },
  {
    call: 'C_Login(SO) → C_InitPIN("user1234") → C_Login(USER)',
    rv: 'CKR_OK × 3',
    note: 'Promote from SO to user login.',
  },
]

const SIM_KEM_STEPS = [
  {
    call: 'C_GenerateKeyPair(CKM_ML_KEM_KEY_PAIR_GEN, ML-KEM-768)',
    rv: 'CKR_OK → pubH=2, privH=3',
  },
  {
    call: 'C_EncapsulateKey(hSession, ML-KEM, pubH=2, template, ctPtr, &ctLen, &ssH)',
    rv: 'CKR_OK → ct[1088 B], ssH=4',
  },
  {
    call: 'C_DecapsulateKey(hSession, ML-KEM, privH=3, ct, template, &ssH2)',
    rv: 'CKR_OK → ssH2=5',
  },
  {
    call: 'C_GetAttributeValue(ssH) → C_GetAttributeValue(ssH2)',
    rv: 'CKR_OK × 2',
  },
  { call: 'compare(ss1, ss2)', rv: '✓ Match — 32 bytes identical' },
]

const SIM_DSA_STEPS = [
  { call: 'C_GenerateKeyPair(CKM_ML_DSA_KEY_PAIR_GEN, ML-DSA-65)', rv: 'CKR_OK' },
  {
    call: 'C_SignInit(CKM_ML_DSA, privH) → C_Sign(message)',
    rv: 'CKR_OK → sig[3293 B]',
  },
  {
    call: 'C_VerifyInit(CKM_ML_DSA, pubH) → C_Verify(message, sig)',
    rv: 'CKR_OK → valid',
  },
]

// ── Simulation mode component ─────────────────────────────────────────────────

const SimulationView = () => (
  <div className="space-y-6">
    <div className="glass-panel p-4">
      <p className="text-sm text-muted-foreground">
        <strong className="text-foreground">Simulation mode</strong> shows the PKCS#11 v3.2 call
        sequence. Switch to <em>Live WASM</em> to drive a real in-browser SoftHSM token backed by
        OpenSSL 3.6 and FIPS 203 / 204.
      </p>
    </div>

    {/* Token Setup */}
    <div className="glass-panel p-4 space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Shield size={14} className="text-primary" /> Token Lifecycle
      </h3>
      <div className="space-y-2">
        {SIM_TOKEN_STEPS.map((s, i) => (
          <div key={i} className="flex items-start gap-3 text-xs font-mono">
            <span className="text-muted-foreground w-4 shrink-0">{i + 1}.</span>
            <div className="flex-1">
              <span className="text-foreground">{s.call}</span>
              <span className="mx-2 text-foreground/40">→</span>
              <span className="text-status-success">{s.rv}</span>
              {s.note && <p className="text-muted-foreground mt-0.5 font-sans">{s.note}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* ML-KEM */}
    <div className="glass-panel p-4 space-y-3">
      <h3 className="font-semibold text-sm">ML-KEM-768 — Key Encapsulation (FIPS 203)</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left py-1 pr-4 font-medium">Variant</th>
              <th className="text-right py-1 pr-4 font-medium">Public Key</th>
              <th className="text-right py-1 pr-4 font-medium">Ciphertext</th>
              <th className="text-right py-1 font-medium">Shared Secret</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {([512, 768, 1024] as const).map((v) => (
              <tr key={v} className="border-b border-border/40">
                <td className="py-1 pr-4">ML-KEM-{v}</td>
                <td className="text-right py-1 pr-4">{KEM_SIZES[v].pub.toLocaleString()} B</td>
                <td className="text-right py-1 pr-4">{KEM_SIZES[v].ct.toLocaleString()} B</td>
                <td className="text-right py-1">{KEM_SIZES[v].ss} B</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-2 mt-2">
        {SIM_KEM_STEPS.map((s, i) => (
          <div key={i} className="flex items-start gap-3 text-xs font-mono">
            <ChevronRight size={12} className="text-primary mt-0.5 shrink-0" />
            <span className="flex-1 text-foreground">{s.call}</span>
            <span className="text-status-success shrink-0">{s.rv}</span>
          </div>
        ))}
      </div>
    </div>

    {/* ML-DSA */}
    <div className="glass-panel p-4 space-y-3">
      <h3 className="font-semibold text-sm">ML-DSA-65 — Sign & Verify (FIPS 204)</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left py-1 pr-4 font-medium">Variant</th>
              <th className="text-right py-1 pr-4 font-medium">Public Key</th>
              <th className="text-right py-1 font-medium">Signature</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {([44, 65, 87] as const).map((v) => (
              <tr key={v} className="border-b border-border/40">
                <td className="py-1 pr-4">ML-DSA-{v}</td>
                <td className="text-right py-1 pr-4">{DSA_SIZES[v].pub.toLocaleString()} B</td>
                <td className="text-right py-1">{DSA_SIZES[v].sig.toLocaleString()} B</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-2 mt-2">
        {SIM_DSA_STEPS.map((s, i) => (
          <div key={i} className="flex items-start gap-3 text-xs font-mono">
            <ChevronRight size={12} className="text-primary mt-0.5 shrink-0" />
            <span className="flex-1 text-foreground">{s.call}</span>
            <span className="text-status-success shrink-0">{s.rv}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
)

// ── Variant selector ──────────────────────────────────────────────────────────

interface VariantSelectorProps<T extends number> {
  options: T[]
  value: T
  onChange: (v: T) => void
  prefix: string
  disabled?: boolean
}

const VariantSelector = <T extends number>({
  options,
  value,
  onChange,
  prefix,
  disabled,
}: VariantSelectorProps<T>) => (
  <div className="flex gap-1">
    {options.map((v) => (
      <Button
        key={v}
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={() => onChange(v)}
        className={
          value === v
            ? 'bg-primary/20 text-primary text-xs px-2 py-1 h-auto'
            : 'text-muted-foreground text-xs px-2 py-1 h-auto'
        }
      >
        {prefix}-{v}
      </Button>
    ))}
  </div>
)

// ── Result row ────────────────────────────────────────────────────────────────

interface ResultRowProps {
  label: string
  bytes: Uint8Array | null
}
const ResultRow = ({ label, bytes }: ResultRowProps) => {
  if (!bytes) return null
  return (
    <div className="flex items-center gap-3 text-xs font-mono bg-muted rounded-lg px-3 py-1.5">
      <span className="text-muted-foreground w-24 shrink-0">{label}</span>
      <span className="text-foreground flex-1 truncate">{hexSnippet(bytes)}</span>
      <span className="text-muted-foreground shrink-0">{bytes.length} B</span>
    </div>
  )
}

// ── Log panel ─────────────────────────────────────────────────────────────────

interface LogPanelProps {
  log: Pkcs11LogEntry[]
  onClear: () => void
}
const LogPanel = ({ log, onClear }: LogPanelProps) => {
  const [copied, setCopied] = useState(false)

  const copyAll = () => {
    const text = log
      .map((e) => `[${e.timestamp}] ${e.fn}(${e.args}) → ${e.rvName} ${e.rvHex} [${e.ms}ms]`)
      .join('\n')
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {})
  }

  return (
    <div className="glass-panel p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          PKCS#11 Call Log
          <span className="text-xs text-muted-foreground font-normal">({log.length} calls)</span>
        </h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={log.length === 0}
            onClick={copyAll}
          >
            {copied ? (
              <CheckCircle size={12} className="mr-1 text-status-success" />
            ) : (
              <Copy size={12} className="mr-1" />
            )}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onClear}>
            <Trash2 size={12} className="mr-1" /> Clear
          </Button>
        </div>
      </div>
      {log.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          No calls yet — click a button above to start.
        </p>
      ) : (
        <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-0.5">
          {log.map((e) => (
            <div key={e.id} className="flex items-baseline gap-2 text-xs font-mono">
              <span className="text-muted-foreground shrink-0 w-16">{e.timestamp}</span>
              <span className="text-foreground shrink-0">{e.fn}</span>
              <span className="text-muted-foreground truncate">{e.args && `(${e.args})`}</span>
              <span className="ml-auto shrink-0">→</span>
              <span
                className={e.ok ? 'text-status-success shrink-0' : 'text-status-error shrink-0'}
              >
                {e.rvName}
              </span>
              <span className="text-muted-foreground shrink-0">[{e.ms}ms]</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Step badge ────────────────────────────────────────────────────────────────

interface StepBadgeProps {
  done: boolean
  label: string
}
const StepBadge = ({ done, label }: StepBadgeProps) => (
  <span className="flex items-center gap-1 text-xs">
    {done ? (
      <CheckCircle size={13} className="text-status-success" />
    ) : (
      <span className="w-3 h-3 rounded-full border border-border inline-block" />
    )}
    <span className={done ? 'text-status-success' : 'text-muted-foreground'}>{label}</span>
  </span>
)

// ── HSM mode wrapper (PKCS#11 call log from HsmContext) ──────────────────────

const HsmCallLog = () => {
  const { hsmLog, clearHsmLog, inspectMode, toggleInspect } = useHsmContext()
  const [copied, setCopied] = useState(false)

  const copyAll = () => {
    const text = hsmLog
      .map((e) => `[${e.timestamp}] ${e.fn}(${e.args}) → ${e.rvName} ${e.rvHex} [${e.ms}ms]`)
      .join('\n')
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {})
  }

  return (
    <div className="glass-panel p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          PKCS#11 Call Log
          <span className="text-xs text-muted-foreground font-normal">({hsmLog.length} calls)</span>
        </h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={toggleInspect}>
            {inspectMode ? 'Hide Params' : 'Show Params'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={hsmLog.length === 0}
            onClick={copyAll}
          >
            {copied ? (
              <CheckCircle size={12} className="mr-1 text-status-success" />
            ) : (
              <Copy size={12} className="mr-1" />
            )}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearHsmLog}>
            <Trash2 size={12} className="mr-1" /> Clear
          </Button>
        </div>
      </div>
      {hsmLog.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          No calls yet — complete HSM Setup to start.
        </p>
      ) : (
        <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-0.5">
          {hsmLog.map((e) => (
            <div key={e.id} className="flex items-baseline gap-2 text-xs font-mono">
              <span className="text-muted-foreground shrink-0 w-16">{e.timestamp}</span>
              <span className="text-foreground shrink-0">{e.fn}</span>
              <span className="text-muted-foreground truncate">{e.args && `(${e.args})`}</span>
              <span className="ml-auto shrink-0">→</span>
              <span
                className={e.ok ? 'text-status-success shrink-0' : 'text-status-error shrink-0'}
              >
                {e.rvName}
              </span>
              <span className="text-muted-foreground shrink-0">[{e.ms}ms]</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export const SoftHsmTab = () => {
  const { hsmMode } = useSettingsContext()

  // When HSM mode is active: show HsmSetupPanel + global PKCS#11 call log
  if (hsmMode) {
    return (
      <div className="space-y-6">
        <HsmSetupPanel />
        <HsmCallLog />
      </div>
    )
  }

  return <SoftHsmTabBrowser />
}

// ── Browser mode (original implementation, unchanged) ────────────────────────

const SoftHsmTabBrowser = () => {
  const [liveMode, setLiveMode] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [loadingOp, setLoadingOp] = useState<string | null>(null)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [kemError, setKemError] = useState<string | null>(null)
  const [dsaError, setDsaError] = useState<string | null>(null)

  const moduleRef = useRef<SoftHSMModule | null>(null)
  const hSessionRef = useRef<number>(0)
  const slotRef = useRef<number>(0)

  // ML-KEM state
  const [kemVariant, setKemVariant] = useState<512 | 768 | 1024>(768)
  const [kemHandles, setKemHandles] = useState<{ pub: number; priv: number } | null>(null)
  const [ciphertext, setCiphertext] = useState<Uint8Array | null>(null)
  const [secret1, setSecret1] = useState<Uint8Array | null>(null)
  const [secret2, setSecret2] = useState<Uint8Array | null>(null)

  // ML-DSA state
  const [dsaVariant, setDsaVariant] = useState<44 | 65 | 87>(65)
  const [dsaHandles, setDsaHandles] = useState<{ pub: number; priv: number } | null>(null)
  const [message, setMessage] = useState('Hello, PQC World!')
  const [signature, setSignature] = useState<Uint8Array | null>(null)
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null)
  const [dsaHedging, setDsaHedging] = useState<'preferred' | 'required' | 'deterministic'>(
    'preferred'
  )
  const [dsaContext, setDsaContext] = useState('')
  const [dsaPreHash, setDsaPreHash] = useState<'' | MLDSAPreHash>('')

  // SLH-DSA state
  const [slhdsaParamSetId, setSlhdsaParamSetId] = useState('sha2-128s')
  const [slhdsaHandles, setSlhdsaHandles] = useState<{ pub: number; priv: number } | null>(null)
  const [slhdsaMessage, setSlhdsaMessage] = useState('Hello, PQC World!')
  const [slhdsaSignature, setSlhdsaSignature] = useState<Uint8Array | null>(null)
  const [slhdsaVerifyResult, setSlhdsaVerifyResult] = useState<boolean | null>(null)
  const [slhdsaPreHash, setSlhdsaPreHash] = useState<'' | SLHDSAPreHash>('')
  const [slhdsaError, setSlhdsaError] = useState<string | null>(null)

  // Token created tracking (ref changes don't re-render, so mirror in state)
  const [tokenCreated, setTokenCreated] = useState(false)

  // Call log
  const [log, setLog] = useState<Pkcs11LogEntry[]>([])
  const addLog = useCallback((e: Pkcs11LogEntry) => setLog((l) => [...l, e]), [])

  const getM = (): SoftHSMModule => {
    if (!moduleRef.current) throw new Error('Module not loaded')
    return moduleRef.current
  }

  const withLoading = async (op: string, fn: () => Promise<void>) => {
    setLoadingOp(op)
    try {
      await fn()
    } finally {
      setLoadingOp(null)
    }
  }

  // Reset KEM results when variant changes
  const changeKemVariant = (v: 512 | 768 | 1024) => {
    setKemVariant(v)
    setKemHandles(null)
    setCiphertext(null)
    setSecret1(null)
    setSecret2(null)
    setKemError(null)
  }

  // Reset DSA results when variant changes
  const changeDsaVariant = (v: 44 | 65 | 87) => {
    setDsaVariant(v)
    setDsaHandles(null)
    setSignature(null)
    setVerifyResult(null)
    setDsaError(null)
  }

  // ── Token Setup actions ──────────────────────────────────────────────────

  const doInitialize = () =>
    withLoading('initialize', async () => {
      setTokenError(null)
      try {
        const M = await getSoftHSMModule()
        const proxy = createLoggingProxy(M, addLog)
        moduleRef.current = proxy
        hsm_initialize(proxy)
        setPhase('initialized')
      } catch (e) {
        setTokenError(String(e))
        moduleRef.current = null
      }
    })

  const doInitToken = () =>
    withLoading('init_token', async () => {
      setTokenError(null)
      try {
        const M = getM()
        const slot0 = hsm_getFirstSlot(M)
        const newSlot = hsm_initToken(M, slot0, '12345678', 'SoftHSM3')
        slotRef.current = newSlot
        setTokenCreated(true)
      } catch (e) {
        setTokenError(String(e))
      }
    })

  const doOpenSession = () =>
    withLoading('open_session', async () => {
      setTokenError(null)
      try {
        const M = getM()
        const hSession = hsm_openUserSession(M, slotRef.current, '12345678', 'user1234')
        hSessionRef.current = hSession
        setPhase('session_open')
      } catch (e) {
        setTokenError(String(e))
      }
    })

  // ── ML-KEM actions ───────────────────────────────────────────────────────

  const doKemGenKeyPair = () =>
    withLoading('kem_gen', async () => {
      setKemError(null)
      setCiphertext(null)
      setSecret1(null)
      setSecret2(null)
      try {
        const M = getM()
        const { pubHandle, privHandle } = hsm_generateMLKEMKeyPair(
          M,
          hSessionRef.current,
          kemVariant
        )
        setKemHandles({ pub: pubHandle, priv: privHandle })
      } catch (e) {
        setKemError(String(e))
      }
    })

  const doEncapsulate = () =>
    withLoading('encapsulate', async () => {
      setKemError(null)
      setSecret1(null)
      setSecret2(null)
      try {
        const M = getM()
        const { ciphertextBytes, secretHandle } = hsm_encapsulate(
          M,
          hSessionRef.current,
          kemHandles!.pub,
          kemVariant
        )
        const ss1 = hsm_extractKeyValue(M, hSessionRef.current, secretHandle)
        setCiphertext(ciphertextBytes)
        setSecret1(ss1)
      } catch (e) {
        setKemError(String(e))
      }
    })

  const doDecapsulate = () =>
    withLoading('decapsulate', async () => {
      setKemError(null)
      setSecret2(null)
      try {
        const M = getM()
        const secretHandle2 = hsm_decapsulate(
          M,
          hSessionRef.current,
          kemHandles!.priv,
          ciphertext!,
          kemVariant
        )
        const ss2 = hsm_extractKeyValue(M, hSessionRef.current, secretHandle2)
        setSecret2(ss2)
      } catch (e) {
        setKemError(String(e))
      }
    })

  // ── ML-DSA actions ───────────────────────────────────────────────────────

  const doDsaGenKeyPair = () =>
    withLoading('dsa_gen', async () => {
      setDsaError(null)
      setSignature(null)
      setVerifyResult(null)
      try {
        const M = getM()
        const { pubHandle, privHandle } = hsm_generateMLDSAKeyPair(
          M,
          hSessionRef.current,
          dsaVariant
        )
        setDsaHandles({ pub: pubHandle, priv: privHandle })
      } catch (e) {
        setDsaError(String(e))
      }
    })

  const buildDsaOpts = (): MLDSASignOptions | undefined => {
    const opts: MLDSASignOptions = {}
    if (dsaHedging !== 'preferred') opts.hedging = dsaHedging
    if (dsaContext) opts.context = new TextEncoder().encode(dsaContext)
    if (dsaPreHash) opts.preHash = dsaPreHash
    return Object.keys(opts).length > 0 ? opts : undefined
  }

  const doSign = () =>
    withLoading('sign', async () => {
      setDsaError(null)
      setVerifyResult(null)
      try {
        const M = getM()
        const sig = hsm_sign(M, hSessionRef.current, dsaHandles!.priv, message, buildDsaOpts())
        setSignature(sig)
      } catch (e) {
        setDsaError(String(e))
      }
    })

  const doVerify = () =>
    withLoading('verify', async () => {
      setDsaError(null)
      try {
        const M = getM()
        const ok = hsm_verify(
          M,
          hSessionRef.current,
          dsaHandles!.pub,
          message,
          signature!,
          buildDsaOpts()
        )
        setVerifyResult(ok)
      } catch (e) {
        setDsaError(String(e))
      }
    })

  // ── SLH-DSA actions ──────────────────────────────────────────────────────

  const getSlhdsaParamSetCkp = () =>
    SLH_DSA_PARAM_SET_OPTIONS.find((o) => o.id === slhdsaParamSetId)?.ckp ?? CKP_SLH_DSA_SHA2_128S

  const changeSlhdsaParamSet = (id: string) => {
    setSlhdsaParamSetId(id)
    setSlhdsaHandles(null)
    setSlhdsaSignature(null)
    setSlhdsaVerifyResult(null)
    setSlhdsaError(null)
  }

  const doSlhdsaGenKeyPair = () =>
    withLoading('slhdsa_gen', async () => {
      setSlhdsaError(null)
      setSlhdsaSignature(null)
      setSlhdsaVerifyResult(null)
      try {
        const M = getM()
        const { pubHandle, privHandle } = hsm_generateSLHDSAKeyPair(
          M,
          hSessionRef.current,
          getSlhdsaParamSetCkp()
        )
        setSlhdsaHandles({ pub: pubHandle, priv: privHandle })
      } catch (e) {
        setSlhdsaError(String(e))
      }
    })

  const doSlhdsaSign = () =>
    withLoading('slhdsa_sign', async () => {
      setSlhdsaError(null)
      setSlhdsaVerifyResult(null)
      try {
        const M = getM()
        const opts = slhdsaPreHash ? { preHash: slhdsaPreHash } : undefined
        const sig = hsm_slhdsaSign(M, hSessionRef.current, slhdsaHandles!.priv, slhdsaMessage, opts)
        setSlhdsaSignature(sig)
      } catch (e) {
        setSlhdsaError(String(e))
      }
    })

  const doSlhdsaVerify = () =>
    withLoading('slhdsa_verify', async () => {
      setSlhdsaError(null)
      try {
        const M = getM()
        const opts = slhdsaPreHash ? { preHash: slhdsaPreHash } : undefined
        const ok = hsm_slhdsaVerify(
          M,
          hSessionRef.current,
          slhdsaHandles!.pub,
          slhdsaMessage,
          slhdsaSignature!,
          opts
        )
        setSlhdsaVerifyResult(ok)
      } catch (e) {
        setSlhdsaError(String(e))
      }
    })

  const isLoading = (op: string) => loadingOp === op
  const anyLoading = loadingOp !== null
  const sessionOpen = phase === 'session_open'

  if (!liveMode) {
    return (
      <div className="space-y-6">
        {/* Mode toggle */}
        <div className="flex items-center justify-between glass-panel p-4">
          <div>
            <p className="font-semibold text-sm">PKCS#11 v3.2 — PQC HSM</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Token lifecycle, ML-KEM, ML-DSA via SoftHSM WASM + OpenSSL 3.6
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLiveMode(true)}>
            <Shield size={14} className="mr-2" /> Live WASM
          </Button>
        </div>
        <SimulationView />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex items-center justify-between glass-panel p-4">
        <div>
          <p className="font-semibold text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-success inline-block animate-pulse" />
            Live WASM — PKCS#11 v3.2
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real in-browser SoftHSM token · OpenSSL 3.6 · FIPS 203 / 204 / 205
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            try {
              if (moduleRef.current && hSessionRef.current) {
                hsm_finalize(moduleRef.current, hSessionRef.current)
              }
            } catch {
              // ignore
            }
            moduleRef.current = null
            hSessionRef.current = 0
            slotRef.current = 0
            setTokenCreated(false)
            setPhase('idle')
            setKemHandles(null)
            setCiphertext(null)
            setSecret1(null)
            setSecret2(null)
            setDsaHandles(null)
            setSignature(null)
            setVerifyResult(null)
            setSlhdsaHandles(null)
            setSlhdsaSignature(null)
            setSlhdsaVerifyResult(null)
            setSlhdsaError(null)
            setLog([])
            setLiveMode(false)
          }}
        >
          Simulation
        </Button>
      </div>

      {/* ── Token Setup ── */}
      <div className="glass-panel p-4 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Shield size={14} className="text-primary" /> Token Setup
        </h3>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={phase !== 'idle' || anyLoading}
            onClick={doInitialize}
          >
            {isLoading('initialize') && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            {phase === 'idle' ? '1. Initialize HSM' : '✓ Initialized'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={phase !== 'initialized' || anyLoading}
            onClick={doInitToken}
          >
            {isLoading('init_token') && <Loader2 size={13} className="mr-1.5 animate-spin" />}2.
            Create Token
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={phase !== 'initialized' || !tokenCreated || anyLoading}
            onClick={doOpenSession}
          >
            {isLoading('open_session') && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            3. Open Session & Login
          </Button>
        </div>

        <div className="flex gap-4">
          <StepBadge done={phase !== 'idle'} label="Initialized" />
          <StepBadge done={tokenCreated} label="Token created" />
          <StepBadge done={sessionOpen} label="Session open" />
        </div>

        {tokenError && <ErrorAlert message={tokenError} />}
      </div>

      {/* ── ML-KEM ── */}
      <div className={`glass-panel p-4 space-y-4 ${!sessionOpen ? 'opacity-50' : ''}`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-semibold text-sm">ML-KEM Key Encapsulation (FIPS 203)</h3>
          <VariantSelector
            options={[512, 768, 1024]}
            value={kemVariant}
            onChange={changeKemVariant}
            prefix="ML-KEM"
            disabled={!sessionOpen || anyLoading}
          />
        </div>

        <div className="text-xs text-muted-foreground font-mono">
          pub: {KEM_SIZES[kemVariant].pub.toLocaleString()} B &nbsp;·&nbsp; ct:{' '}
          {KEM_SIZES[kemVariant].ct.toLocaleString()} B &nbsp;·&nbsp; ss: {KEM_SIZES[kemVariant].ss}{' '}
          B
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!sessionOpen || anyLoading}
            onClick={doKemGenKeyPair}
          >
            {isLoading('kem_gen') && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            {kemHandles ? '✓ Key Pair' : 'Generate Key Pair'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!sessionOpen || !kemHandles || anyLoading}
            onClick={doEncapsulate}
          >
            {isLoading('encapsulate') && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            Encapsulate
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!sessionOpen || !ciphertext || anyLoading}
            onClick={doDecapsulate}
          >
            {isLoading('decapsulate') && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            Decapsulate
          </Button>
        </div>

        <div className="space-y-1.5">
          <ResultRow label="Ciphertext" bytes={ciphertext} />
          <ResultRow label="Shared Secret 1" bytes={secret1} />
          <ResultRow label="Shared Secret 2" bytes={secret2} />
        </div>

        {secret1 && secret2 && (
          <div className="flex items-center gap-2 text-sm font-medium">
            {arraysEqual(secret1, secret2) ? (
              <>
                <CheckCircle size={16} className="text-status-success" />
                <span className="text-status-success">
                  Secrets match — {secret1.length} bytes identical
                </span>
              </>
            ) : (
              <>
                <XCircle size={16} className="text-status-error" />
                <span className="text-status-error">Mismatch</span>
              </>
            )}
          </div>
        )}

        {kemError && <ErrorAlert message={kemError} />}
      </div>

      {/* ── ML-DSA ── */}
      <div className={`glass-panel p-4 space-y-4 ${!sessionOpen ? 'opacity-50' : ''}`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-semibold text-sm">ML-DSA Sign & Verify (FIPS 204)</h3>
          <VariantSelector
            options={[44, 65, 87]}
            value={dsaVariant}
            onChange={changeDsaVariant}
            prefix="ML-DSA"
            disabled={!sessionOpen || anyLoading}
          />
        </div>

        <div className="text-xs text-muted-foreground font-mono">
          pub: {DSA_SIZES[dsaVariant].pub.toLocaleString()} B &nbsp;·&nbsp; sig:{' '}
          {DSA_SIZES[dsaVariant].sig.toLocaleString()} B
        </div>

        <div>
          <label htmlFor="softhsm-dsa-message" className="text-xs text-muted-foreground mb-1 block">
            Message
          </label>
          <Input
            id="softhsm-dsa-message"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              setSignature(null)
              setVerifyResult(null)
            }}
            disabled={!sessionOpen || anyLoading}
            className="font-mono text-xs"
          />
        </div>

        {/* PKCS#11 v3.2 sign options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <span className="text-xs text-muted-foreground block mb-1">Hedging</span>
            <div className="flex gap-1">
              {(['preferred', 'required', 'deterministic'] as const).map((h) => (
                <Button
                  key={h}
                  variant="ghost"
                  size="sm"
                  disabled={!sessionOpen || anyLoading}
                  onClick={() => {
                    setDsaHedging(h)
                    setSignature(null)
                    setVerifyResult(null)
                  }}
                  className={
                    dsaHedging === h
                      ? 'bg-primary/20 text-primary text-xs px-2 py-1 h-auto capitalize'
                      : 'text-muted-foreground text-xs px-2 py-1 h-auto capitalize'
                  }
                >
                  {h === 'deterministic' ? 'Determ.' : h.charAt(0).toUpperCase() + h.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs text-muted-foreground block mb-1">Pre-hash</span>
            <FilterDropdown
              noContainer
              items={PREHASH_OPTIONS}
              selectedId={dsaPreHash || 'All'}
              onSelect={(id) => {
                setDsaPreHash(id === 'All' ? '' : (id as MLDSAPreHash))
                setSignature(null)
                setVerifyResult(null)
              }}
              defaultLabel="Pure"
              defaultIcon={undefined}
            />
          </div>

          <div>
            <label
              htmlFor="softhsm-dsa-context"
              className="text-xs text-muted-foreground mb-1 block"
            >
              Context (0-255 B)
            </label>
            <Input
              id="softhsm-dsa-context"
              value={dsaContext}
              onChange={(e) => {
                const v = e.target.value
                if (new TextEncoder().encode(v).length <= 255) {
                  setDsaContext(v)
                  setSignature(null)
                  setVerifyResult(null)
                }
              }}
              placeholder="optional domain separator"
              disabled={!sessionOpen || anyLoading}
              className="font-mono text-xs"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!sessionOpen || anyLoading}
            onClick={doDsaGenKeyPair}
          >
            {isLoading('dsa_gen') && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            {dsaHandles ? '✓ Key Pair' : 'Generate Key Pair'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!sessionOpen || !dsaHandles || anyLoading}
            onClick={doSign}
          >
            {isLoading('sign') && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            Sign
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!sessionOpen || !signature || anyLoading}
            onClick={doVerify}
          >
            {isLoading('verify') && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            Verify
          </Button>
        </div>

        <div className="space-y-1.5">
          <ResultRow label="Signature" bytes={signature} />
        </div>

        {verifyResult !== null && (
          <div className="flex items-center gap-2 text-sm font-medium">
            {verifyResult ? (
              <>
                <CheckCircle size={16} className="text-status-success" />
                <span className="text-status-success">Signature valid</span>
              </>
            ) : (
              <>
                <XCircle size={16} className="text-status-error" />
                <span className="text-status-error">Signature invalid</span>
              </>
            )}
          </div>
        )}

        {dsaError && <ErrorAlert message={dsaError} />}
      </div>

      {/* ── SLH-DSA ── */}
      <div className={`glass-panel p-4 space-y-4 ${!sessionOpen ? 'opacity-50' : ''}`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-semibold text-sm">SLH-DSA Sign & Verify (FIPS 205)</h3>
          <FilterDropdown
            noContainer
            items={SLH_DSA_PARAM_SET_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
            selectedId={slhdsaParamSetId}
            onSelect={(id) => {
              if (id !== 'All') changeSlhdsaParamSet(id)
            }}
            defaultLabel="SHA2-128s"
            defaultIcon={undefined}
          />
        </div>

        {(() => {
          const ps = SLH_DSA_PARAM_SET_OPTIONS.find((o) => o.id === slhdsaParamSetId)
          return ps ? (
            <div className="text-xs text-muted-foreground font-mono">
              pub: {ps.pub} B &nbsp;·&nbsp; sig: {ps.sig.toLocaleString()} B
            </div>
          ) : null
        })()}

        <div>
          <label
            htmlFor="softhsm-slhdsa-message"
            className="text-xs text-muted-foreground mb-1 block"
          >
            Message
          </label>
          <Input
            id="softhsm-slhdsa-message"
            value={slhdsaMessage}
            onChange={(e) => {
              setSlhdsaMessage(e.target.value)
              setSlhdsaSignature(null)
              setSlhdsaVerifyResult(null)
            }}
            disabled={!sessionOpen || anyLoading}
            className="font-mono text-xs"
          />
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <span className="text-xs text-muted-foreground block mb-1">Pre-hash</span>
            <FilterDropdown
              noContainer
              items={PREHASH_OPTIONS}
              selectedId={slhdsaPreHash || 'All'}
              onSelect={(id) => {
                setSlhdsaPreHash(id === 'All' ? '' : (id as SLHDSAPreHash))
                setSlhdsaSignature(null)
                setSlhdsaVerifyResult(null)
              }}
              defaultLabel="Pure"
              defaultIcon={undefined}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!sessionOpen || anyLoading}
            onClick={doSlhdsaGenKeyPair}
          >
            {isLoading('slhdsa_gen') && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            {slhdsaHandles ? '✓ Key Pair' : 'Generate Key Pair'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!sessionOpen || !slhdsaHandles || anyLoading}
            onClick={doSlhdsaSign}
          >
            {isLoading('slhdsa_sign') && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            Sign
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!sessionOpen || !slhdsaSignature || anyLoading}
            onClick={doSlhdsaVerify}
          >
            {isLoading('slhdsa_verify') && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            Verify
          </Button>
        </div>

        <div className="space-y-1.5">
          <ResultRow label="Signature" bytes={slhdsaSignature} />
        </div>

        {slhdsaVerifyResult !== null && (
          <div className="flex items-center gap-2 text-sm font-medium">
            {slhdsaVerifyResult ? (
              <>
                <CheckCircle size={16} className="text-status-success" />
                <span className="text-status-success">Signature valid</span>
              </>
            ) : (
              <>
                <XCircle size={16} className="text-status-error" />
                <span className="text-status-error">Signature invalid</span>
              </>
            )}
          </div>
        )}

        {slhdsaError && <ErrorAlert message={slhdsaError} />}
      </div>

      {/* ── Call Log ── */}
      <LogPanel log={log} onClear={() => setLog([])} />
    </div>
  )
}

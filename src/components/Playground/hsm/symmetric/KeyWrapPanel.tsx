// SPDX-License-Identifier: GPL-3.0-only
import { useState, useRef, useEffect } from 'react'
import {
  Lock,
  Unlock,
  Download,
  Copy,
  Upload,
  Loader2,
  Key,
  Shield,
  Zap,
  Check,
  Info,
  X as XIcon,
} from 'lucide-react'
import { Button } from '../../../ui/button'
import { ShareButton } from '../../../ui/ShareButton'
import { ErrorAlert } from '../../../ui/error-alert'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import {
  CKM_AES_KEY_WRAP,
  CKM_AES_KEY_WRAP_KWP,
  CKM_SHA256,
  CKO_SECRET_KEY,
  CKA_CLASS,
  CKA_KEY_TYPE,
  CKA_TOKEN,
  CKA_EXTRACTABLE,
  CKA_VALUE_LEN,
  CKK_AES,
  hsm_wrapKeyMech,
  hsm_aesGcmWrapKey,
  hsm_aesGcmUnwrapKey,
  hsm_rsaOaepWrapKey,
  hsm_rsaOaepUnwrapKey,
  hsm_unwrapKeyMech,
  hsm_generateRSAWrapKeyPair,
  hsm_generateAESKey,
  hsm_generateMLKEMKeyPair,
  hsm_generateMLDSAKeyPair,
  hsm_generateECKeyPair,
  hsm_ecdhDerive,
  hsm_extractECPoint,
  hsm_encapsulate,
  hsm_decapsulate,
  hsm_extractKeyValue,
  hsm_importAESKey,
  hsm_importGenericSecret,
  hsm_hkdf,
  type AttrDef,
  type SoftHSMModule,
  type Pkcs11LogEntry,
} from '../../../../wasm/softhsm'
import { useHSM } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'
import { HsmResultRow, toHex, hexSnippet } from '../shared'
import { downloadCsv } from '@/utils/csvExport'

// ── Types ─────────────────────────────────────────────────────────────────────

type WrapMode = 'direct' | 'indirect' | 'pqc'
type DirectMech = 'aes-kw' | 'aes-kwp' | 'aes-gcm'
type HybridCombiner = 'p256-mlkem' | 'x25519-mlkem'
type PqcWrapRepr = 'expanded' | 'seed'

interface WrapResult {
  mode: WrapMode
  mechanism: string
  wrappingKeyLabel: string
  targetKeyLabel: string
  wrappedHex: string
  auxHex?: string
  auxLabel?: string
  aux2Hex?: string
  aux2Label?: string
}

interface WrapLogEntry extends WrapResult {
  timestamp: string
  op: 'wrap' | 'unwrap'
  status: 'ok' | 'error'
  error?: string
  unwrappedHandle?: number
}

const UNWRAP_TEMPLATE = (bits: 128 | 192 | 256): AttrDef[] => [
  { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
  { type: CKA_KEY_TYPE, ulongVal: CKK_AES },
  { type: CKA_TOKEN, boolVal: false },
  { type: CKA_EXTRACTABLE, boolVal: true },
  { type: CKA_VALUE_LEN, ulongVal: bits / 8 },
]

// Seed lengths per FIPS 203 / FIPS 204
const ML_KEM_SEED_LEN = 64 // d || z (FIPS 203 §3.3)
const ML_DSA_SEED_LEN = 32 // ξ (FIPS 204 §6.1)

const FIPS_REFS: Record<WrapMode, string> = {
  direct: 'NIST SP 800-38F / FIPS 140-3 L3',
  indirect: 'NIST SP 800-56B Rev 2 / PKCS#11 v3.2',
  pqc: 'NIST SP 800-227 + FIPS 203 (ML-KEM) + SP 800-38F',
}

const HKDF_INFO = new TextEncoder().encode('hybrid-wrap-kek')

// ── Info modal data ───────────────────────────────────────────────────────────

interface MechInfo {
  name: string
  pkcs11Constant: string
  constantHex: string
  nistRef: string
  rfcRef?: string
  fips140Level: string
  description: string
  keyConstraints: string
  aws: { supported: boolean; note: string }
  gcp: { supported: boolean; note: string }
  azure: { supported: boolean; note: string }
}

const MECH_INFO: MechInfo[] = [
  {
    name: 'AES Key Wrap',
    pkcs11Constant: 'CKM_AES_KEY_WRAP',
    constantHex: '0x2109',
    nistRef: 'NIST SP 800-38F (2012)',
    rfcRef: 'RFC 3394',
    fips140Level: 'FIPS 140-3 L1–L4',
    description:
      'Deterministic AES-based key wrap with a 64-bit semi-fixed header. Key being wrapped must be a multiple of 8 bytes. Adds 8 bytes of overhead. No padding — target key must be 16, 24, or 32 bytes.',
    keyConstraints:
      'Target must be 8-byte-aligned (128/192/256-bit AES keys). Wrapping key: AES-128/192/256.',
    aws: {
      supported: true,
      note: 'CKM_CLOUDHSM_AES_KEY_WRAP_PKCS5_PAD (AWS variant with PKCS#5 pad)',
    },
    gcp: { supported: true, note: 'Supported via PKCS#11 library for Cloud HSM' },
    azure: { supported: true, note: 'Supported on Thales Luna (Dedicated HSM) and Managed HSM' },
  },
  {
    name: 'AES Key Wrap with Padding',
    pkcs11Constant: 'CKM_AES_KEY_WRAP_KWP',
    constantHex: '0x210A',
    nistRef: 'NIST SP 800-38F §6.3 (2012)',
    rfcRef: 'RFC 5649',
    fips140Level: 'FIPS 140-3 L1–L4',
    description:
      'Extension of AES-KW that supports wrapping keys of any length using a 4-byte constant + 4-byte length field as a header. Adds 8 bytes. Preferred over AES-KW when key length is not a multiple of 8 bytes.',
    keyConstraints: 'Target key: any length (padded internally). Wrapping key: AES-128/192/256.',
    aws: {
      supported: true,
      note: 'CKM_CLOUDHSM_AES_KEY_WRAP_ZERO_PAD also available. AES-KWP preferred for variable-length keys.',
    },
    gcp: {
      supported: true,
      note: 'Used in BYOK import flow (GCP wraps the customer-managed key with RSA-OAEP + AES-KWP)',
    },
    azure: {
      supported: true,
      note: 'Supported on Thales Luna and Managed HSM (BYOK key import uses AES-KWP)',
    },
  },
  {
    name: 'AES-GCM',
    pkcs11Constant: 'CKM_AES_GCM',
    constantHex: '0x1087',
    nistRef: 'NIST SP 800-38D (2007)',
    fips140Level: 'FIPS 140-3 L1–L4',
    description:
      'Authenticated encryption mode. When used for key wrapping, the ciphertext includes a 128-bit authentication tag. The 12-byte IV must be unique per wrapping operation — never reuse an IV with the same key. Provides both confidentiality and integrity.',
    keyConstraints:
      'IV must be exactly 12 bytes (96 bits). Tag is 128 bits. Wrapping key: AES-128/192/256.',
    aws: {
      supported: true,
      note: 'CKM_AES_GCM supported on CloudHSM Client SDK 5. IV management is caller responsibility.',
    },
    gcp: {
      supported: true,
      note: 'Supported. GCP recommends AES-KW/KWP over GCM for key wrapping.',
    },
    azure: {
      supported: true,
      note: 'Supported on Thales Luna HSM. Managed HSM uses AES-GCM for internal operations.',
    },
  },
  {
    name: 'RSA-OAEP + AES-KWP (Indirect)',
    pkcs11Constant: 'CKM_RSA_PKCS_OAEP + CKM_AES_KEY_WRAP_KWP',
    constantHex: '0x0009 + 0x210A',
    nistRef: 'NIST SP 800-56B Rev 2 (2019)',
    rfcRef: 'RFC 3447 §7.1',
    fips140Level: 'FIPS 140-3 L1–L4',
    description:
      "Standard hybrid key transport: an ephemeral AES-256 KEK wraps the target key (AES-KWP), then RSA-OAEP encrypts the ephemeral KEK using the recipient's RSA public key. This is the canonical PKCS#11 v3.x pattern for asymmetric key wrapping. SHA-256 is minimum; SHA-384/512 recommended for L3+.",
    keyConstraints:
      'RSA key: ≥ 2048-bit (2048 approved, 3072+ recommended for post-2030). OAEP hash: SHA-256/384/512.',
    aws: {
      supported: true,
      note: 'CKM_RSA_PKCS_OAEP supported. AWS BYOK uses RSA-OAEP (2048/3072/4096) wrapping an AES-256 KEK.',
    },
    gcp: {
      supported: true,
      note: 'Primary BYOK import method: RSA-OAEP-4096-SHA256 wraps an AES-256 KEK, AES-KWP wraps the target.',
    },
    azure: {
      supported: true,
      note: 'Managed HSM BYOK: RSA-OAEP (3072 or 4096) + AES-KWP. Documented in MS Key Vault BYOK spec.',
    },
  },
  {
    name: 'Hybrid ECDH + ML-KEM + AES-KW',
    pkcs11Constant: 'CKM_ECDH1_DERIVE + CKM_ML_KEM + CKM_HKDF_DERIVE + CKM_AES_KEY_WRAP',
    constantHex: '0x1050 + 0x0017 + 0x402a + 0x2109',
    nistRef: 'NIST SP 800-227 (2025) + FIPS 203 (2024) + SP 800-38F',
    fips140Level: 'FIPS 140-3 (ML-KEM approved 2024)',
    description:
      'True hybrid key wrapping combining classical ECDH (P-256) and ML-KEM via HKDF-SHA-256 combiner per NIST SP 800-227. ECDH provides classical security guarantee; ML-KEM provides quantum resistance. The combined shared secret (classical_ss || pqc_ss = 64 bytes) is processed through HKDF to derive an AES-256 KEK. X25519 variant (X-Wing) also supported per Google Cloud KMS pattern. No single PKCS#11 composite mechanism exists — implemented as 6 separate PKCS#11 calls.',
    keyConstraints:
      'P-256 + ML-KEM-768 (NIST L3) or ML-KEM-1024 (L5). HKDF info="hybrid-wrap-kek". Output: 3 blobs (ephemeral pubkey + ML-KEM ciphertext + wrapped key).',
    aws: {
      supported: false,
      note: 'ML-KEM not yet in CloudHSM. BYOK uses RSA-OAEP + AES-KW only. ML-KEM TLS transport supported; ML-DSA signing announced.',
    },
    gcp: {
      supported: false,
      note: 'ML-KEM-768/1024 + X-Wing available as KEM key purpose (preview), but NOT wired into BYOK import flow. BYOK still RSA-OAEP + AES-KW.',
    },
    azure: {
      supported: false,
      note: 'ML-KEM/ML-DSA in Windows CNG only. Key Vault / Managed HSM have no PQC key types or PQC BYOK wrapping.',
    },
  },
]

const SupportBadge = ({ supported, note }: { supported: boolean; note: string }) => (
  <div className="flex flex-col gap-0.5">
    <span
      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded inline-flex items-center gap-1 w-fit ${
        supported ? 'bg-status-success/15 text-status-success' : 'bg-muted text-muted-foreground'
      }`}
    >
      {supported ? <Check size={9} /> : <XIcon size={9} />}
      {supported ? 'Supported' : 'Not yet'}
    </span>
    <span className="text-[10px] text-muted-foreground leading-relaxed">{note}</span>
  </div>
)

const WrapInfoModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
    <div className="fixed inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
    <div className="relative z-10 w-full max-w-3xl bg-card border border-border rounded-lg shadow-xl my-4 sm:my-8">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Key Wrapping — NIST References &amp; Cloud HSM Compatibility
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            FIPS 140-3 Level 3 approved mechanisms · AWS CloudHSM · Google Cloud HSM · Azure
            Dedicated HSM
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
          <XIcon size={14} />
        </Button>
      </div>

      <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
        {MECH_INFO.map((m) => (
          <div key={m.name} className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{m.name}</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-primary font-mono">
                    {m.pkcs11Constant}
                  </code>
                  <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                    {m.constantHex}
                  </code>
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                    {m.fips140Level}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-muted-foreground">{m.nistRef}</p>
                {m.rfcRef && <p className="text-[10px] text-muted-foreground">{m.rfcRef}</p>}
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">{m.description}</p>

            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground/60">Constraints: </span>
              {m.keyConstraints}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-foreground/70">AWS CloudHSM</p>
                <SupportBadge supported={m.aws.supported} note={m.aws.note} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-foreground/70">Google Cloud HSM</p>
                <SupportBadge supported={m.gcp.supported} note={m.gcp.note} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-foreground/70">Azure Dedicated HSM</p>
                <SupportBadge supported={m.azure.supported} note={m.azure.note} />
              </div>
            </div>

            <div className="border-b border-border" />
          </div>
        ))}

        <div className="glass-panel p-3 space-y-2">
          <p className="text-xs font-semibold text-foreground/70">
            KEM vs Key Wrapping — Why the Extra Steps?
          </p>
          <div className="text-[10px] text-muted-foreground leading-relaxed space-y-1.5">
            <p>
              <span className="font-semibold text-foreground/70">Key Encapsulation (KEM)</span> is a
              key <em>agreement</em> primitive.{' '}
              <code className="bg-muted px-1 rounded">C_EncapsulateKey</code> produces a{' '}
              <em>random</em> shared secret — neither party chooses the value. It is designed to
              establish transient session keys (TLS, VPN, IKEv2).
            </p>
            <p>
              <span className="font-semibold text-foreground/70">Key Wrapping</span> is a key{' '}
              <em>transport</em> primitive. <code className="bg-muted px-1 rounded">C_WrapKey</code>{' '}
              encrypts a <em>specific, pre-existing</em> key so it can be moved between HSMs or
              imported via BYOK.
            </p>
            <p>
              Because KEM cannot directly wrap a chosen key, our PQC Hybrid mode bridges the gap:
            </p>
            <ol className="list-decimal list-inside space-y-0.5 ml-1">
              <li>
                <strong>KEM</strong> — ECDH + ML-KEM each produce a random shared secret (key
                agreement)
              </li>
              <li>
                <strong>Combine</strong> — Concatenate classical_ss || pqc_ss (64 bytes)
              </li>
              <li>
                <strong>Derive</strong> — HKDF-SHA-256 derives an AES-256 KEK from the combined
                secret
              </li>
              <li>
                <strong>Wrap</strong> — AES Key Wrap (RFC 3394) wraps the target key with that KEK
                (key transport)
              </li>
            </ol>
            <p>
              This is why cloud providers (AWS, GCP, Azure) offer ML-KEM for TLS sessions but still
              use RSA-OAEP for BYOK imports — RSA-OAEP is a key transport mechanism that can
              directly encrypt a chosen key. The KEM→HKDF→AES-KW pattern demonstrated here is the
              expected migration path once cloud HSMs adopt PQC wrapping.
            </p>
          </div>
        </div>

        <div className="glass-panel p-3 space-y-1">
          <p className="text-xs font-semibold text-foreground/70">Standards Quick Reference</p>
          <ul className="text-[10px] text-muted-foreground space-y-0.5 list-disc list-inside">
            <li>
              NIST SP 800-38F — Recommendation for Block Cipher Modes of Operation: Methods for Key
              Wrapping
            </li>
            <li>
              NIST SP 800-56B Rev 2 — Recommendation for Pair-Wise Key-Establishment Using Integer
              Factorization Cryptography
            </li>
            <li>
              NIST SP 800-38D — Recommendation for Block Cipher Modes of Operation: GCM and GMAC
            </li>
            <li>
              NIST SP 800-227 — Recommendations for Key-Encapsulation Mechanisms (Hybrid KEM
              Combiners)
            </li>
            <li>
              FIPS 203 (2024) — Module-Lattice-Based Key-Encapsulation Mechanism Standard (ML-KEM)
            </li>
            <li>PKCS#11 v3.2 — Cryptographic Token Interface Standard (OASIS, 2023)</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
)

const normalizeHex = (raw: string): string =>
  raw.replace(/\s+/g, '').replace(/^0x/i, '').replace(/:/g, '').toLowerCase()

const isValidHex = (s: string) => !s || /^[0-9a-fA-F\s:]*$/.test(s)
const hexByteLen = (s: string) => Math.floor(normalizeHex(s).length / 2)

const hexToBytes = (hex: string): Uint8Array => {
  const h = normalizeHex(hex)
  if (h.length % 2 !== 0) throw new Error('Odd-length hex string')
  return new Uint8Array(h.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)))
}

// ── Main component ─────────────────────────────────────────────────────────────

export const KeyWrapPanel = ({
  initialAlgo,
  onAlgoChange,
}: { initialAlgo?: string; onAlgoChange?: (algo: string) => void } = {}) => {
  const hsm = useHSM('rust')
  const { moduleRef, hSessionRef, isReady } = hsm

  const [showInfo, setShowInfo] = useState(false)

  // Mode
  const [wrapMode, setWrapMode] = useState<WrapMode>(() => {
    if (initialAlgo === 'RSA-OAEP') return 'indirect'
    if (initialAlgo?.startsWith('P256-ML-KEM-') || initialAlgo?.startsWith('X25519-ML-KEM-'))
      return 'pqc'
    return 'direct'
  })

  // Direct mode
  const [directMech, setDirectMech] = useState<DirectMech>(() => {
    if (initialAlgo === 'AES-KWP') return 'aes-kwp'
    if (initialAlgo === 'AES-GCM') return 'aes-gcm'
    return 'aes-kw'
  })
  const [wrapKeyHandle, setWrapKeyHandle] = useState<number | null>(null)

  // Indirect mode (RSA-OAEP + AES-KWP)
  const [rsaHashAlgo, setRsaHashAlgo] = useState<'sha256' | 'sha384' | 'sha512'>('sha256')
  const [rsaKeyBits, setRsaKeyBits] = useState<2048 | 3072 | 4096>(2048)
  const [rsaPubHandle, setRsaPubHandle] = useState<number | null>(null)
  const [rsaPrivHandle, setRsaPrivHandle] = useState<number | null>(null)

  // PQC hybrid mode
  const [hybridCombiner, setHybridCombiner] = useState<HybridCombiner>(() =>
    initialAlgo?.startsWith('X25519-ML-KEM-') ? 'x25519-mlkem' : 'p256-mlkem'
  )
  const [mlkemVariant, setMlkemVariant] = useState<512 | 768 | 1024>(() => {
    if (initialAlgo?.endsWith('-1024')) return 1024
    return 768
  })
  const [mlkemPubHandle, setMlkemPubHandle] = useState<number | null>(null)
  const [mlkemPrivHandle, setMlkemPrivHandle] = useState<number | null>(null)
  // P-256 ECDH (PKCS#11)
  const [ecPubHandle, setEcPubHandle] = useState<number | null>(null)
  const [ecPrivHandle, setEcPrivHandle] = useState<number | null>(null)
  // X25519 (Web Crypto)
  const [x25519KeyPair, setX25519KeyPair] = useState<CryptoKeyPair | null>(null)

  // Target key + seed/expanded
  const [targetKeyHandle, setTargetKeyHandle] = useState<number | null>(null)
  const [pqcWrapRepr, setPqcWrapRepr] = useState<PqcWrapRepr>('expanded')
  const [wrapResult, setWrapResult] = useState<WrapResult | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  // Unwrap inputs
  const [unwrapInputMode, setUnwrapInputMode] = useState<'paste' | 'csv'>('paste')
  const [pastedWrappedHex, setPastedWrappedHex] = useState('')
  const [pastedAuxHex, setPastedAuxHex] = useState('')
  const [pastedAux2Hex, setPastedAux2Hex] = useState('')
  const [pastedIvHex, setPastedIvHex] = useState('')
  const [unwrapTargetBits, setUnwrapTargetBits] = useState<128 | 192 | 256>(256)
  const [unwrappedHandle, setUnwrappedHandle] = useState<number | null>(null)
  const csvFileRef = useRef<HTMLInputElement>(null)

  // Session log
  const [sessionLog, setSessionLog] = useState<WrapLogEntry[]>([])

  // Loading / error
  const [loadingOp, setLoadingOp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Derived
  const aesKeys = hsm.keys.filter((k) => k.family === 'aes' && k.role === 'secret')
  const anyLoading = loadingOp !== null

  // All wrappable keys: AES + any extractable private key (ML-KEM, ML-DSA, RSA, ECDSA, EdDSA)
  const wrappableKeys = [
    ...aesKeys,
    ...hsm.keys.filter((k) => k.role === 'private' && k.label.includes('(extractable)')),
  ]

  const targetKeyInfo =
    targetKeyHandle !== null ? hsm.keys.find((k) => k.handle === targetKeyHandle) : null
  const isPqcTarget = targetKeyInfo?.family === 'ml-kem' || targetKeyInfo?.family === 'ml-dsa'

  const keyLabel = (handle: number | null): string => {
    if (handle === null) return 'unknown'
    const k = hsm.keys.find((k) => k.handle === handle)
    return k ? `${k.label} (h=${handle})` : `h=${handle}`
  }

  const addLogEntry = (entry: WrapLogEntry) => {
    setSessionLog((prev) => [entry, ...prev].slice(0, 50))
    const synthetic: Pkcs11LogEntry = {
      id: Date.now(),
      timestamp: entry.timestamp.slice(11, 19),
      fn: entry.op === 'wrap' ? '[WRAP]' : '[UNWRAP]',
      args: `mech=${entry.mechanism} wrapping="${entry.wrappingKeyLabel}" target="${entry.targetKeyLabel}"`,
      rvHex: entry.status === 'ok' ? '0x00000000' : '0x00000006',
      rvName: entry.status === 'ok' ? 'CKR_OK' : 'CKR_FUNCTION_FAILED',
      ms: 0,
      ok: entry.status === 'ok',
      engineName: 'cpp',
    }
    hsm.addLog(synthetic)
  }

  const emitAlgo = (
    mode: WrapMode,
    mech: DirectMech,
    combiner: HybridCombiner,
    variant: 512 | 768 | 1024
  ) => {
    if (mode === 'direct') {
      onAlgoChange?.(mech === 'aes-kw' ? 'AES-KW' : mech === 'aes-kwp' ? 'AES-KWP' : 'AES-GCM')
    } else if (mode === 'indirect') {
      onAlgoChange?.('RSA-OAEP')
    } else {
      onAlgoChange?.(`${combiner === 'p256-mlkem' ? 'P256' : 'X25519'}-ML-KEM-${variant}`)
    }
  }

  // Emit initial algo on mount so URL reflects current selection immediately
  useEffect(() => {
    emitAlgo(wrapMode, directMech, hybridCombiner, mlkemVariant)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const withLoading = async (op: string, fn: () => Promise<void>) => {
    setLoadingOp(op)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(String(e))
    } finally {
      setLoadingOp(null)
    }
  }

  const copyHex = async (hex: string, label: string) => {
    await navigator.clipboard.writeText(hex)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  // ── Helper: resolve target handle for seed mode ────────────────────────────

  const resolveTargetHandle = (M: SoftHSMModule, hSession: number): number => {
    if (!isPqcTarget || pqcWrapRepr === 'expanded') return targetKeyHandle!
    // Seed mode: extract full key, truncate to seed, import as generic secret
    const fullBytes = hsm_extractKeyValue(M, hSession, targetKeyHandle!)
    const seedLen = targetKeyInfo!.family === 'ml-kem' ? ML_KEM_SEED_LEN : ML_DSA_SEED_LEN
    const seedBytes = fullBytes.slice(0, seedLen)
    return hsm_importGenericSecret(M, hSession, seedBytes)
  }

  // ── Helper: derive hybrid KEK from classical + PQC shared secrets ──────────

  const deriveHybridKEK = (
    M: SoftHSMModule,
    hSession: number,
    classicalSS: Uint8Array,
    pqcSS: Uint8Array
  ): number => {
    const combined = new Uint8Array(classicalSS.length + pqcSS.length)
    combined.set(classicalSS)
    combined.set(pqcSS, classicalSS.length)
    const combinedHandle = hsm_importGenericSecret(M, hSession, combined)
    const kekBytes = hsm_hkdf(
      M,
      hSession,
      combinedHandle,
      CKM_SHA256,
      true,
      true,
      undefined,
      HKDF_INFO,
      32
    )
    return hsm_importAESKey(M, hSession, kekBytes, false, false)
  }

  // ── Wrap operations ──────────────────────────────────────────────────────────

  const doWrapDirect = () =>
    withLoading('wrap', async () => {
      const M = moduleRef.current!
      const hSession = hSessionRef.current
      const effTarget = resolveTargetHandle(M, hSession)
      let wrappedBytes: Uint8Array
      let auxHex: string | undefined
      let auxLabel: string | undefined
      let mechanism: string

      if (directMech === 'aes-kw') {
        wrappedBytes = hsm_wrapKeyMech(M, hSession, CKM_AES_KEY_WRAP, wrapKeyHandle!, effTarget)
        mechanism = 'AES-KW (RFC 3394)'
      } else if (directMech === 'aes-kwp') {
        wrappedBytes = hsm_wrapKeyMech(M, hSession, CKM_AES_KEY_WRAP_KWP, wrapKeyHandle!, effTarget)
        mechanism = 'AES-KWP (RFC 5649)'
      } else {
        const r = hsm_aesGcmWrapKey(M, hSession, wrapKeyHandle!, effTarget, new Uint8Array(0))
        wrappedBytes = r.wrapped
        auxHex = toHex(r.iv)
        auxLabel = 'GCM IV (12 B)'
        mechanism = 'AES-GCM (SP 800-38D)'
      }

      const targetLabel =
        isPqcTarget && pqcWrapRepr === 'seed'
          ? `${keyLabel(targetKeyHandle)} [seed]`
          : keyLabel(targetKeyHandle)

      const result: WrapResult = {
        mode: 'direct',
        mechanism,
        wrappingKeyLabel: keyLabel(wrapKeyHandle),
        targetKeyLabel: targetLabel,
        wrappedHex: toHex(wrappedBytes),
        auxHex,
        auxLabel,
      }
      setWrapResult(result)
      setUnwrappedHandle(null)
      addLogEntry({ ...result, timestamp: new Date().toISOString(), op: 'wrap', status: 'ok' })
    })

  const doWrapIndirect = () =>
    withLoading('wrap', async () => {
      const M = moduleRef.current!
      const hSession = hSessionRef.current
      const effTarget = resolveTargetHandle(M, hSession)

      const tempKEKHandle = hsm_generateAESKey(M, hSession, 256)
      const wrappedTarget = hsm_wrapKeyMech(
        M,
        hSession,
        CKM_AES_KEY_WRAP_KWP,
        tempKEKHandle,
        effTarget
      )
      const encryptedKEK = hsm_rsaOaepWrapKey(
        M,
        hSession,
        rsaPubHandle!,
        tempKEKHandle,
        rsaHashAlgo
      )

      const targetLabel =
        isPqcTarget && pqcWrapRepr === 'seed'
          ? `${keyLabel(targetKeyHandle)} [seed]`
          : keyLabel(targetKeyHandle)

      const result: WrapResult = {
        mode: 'indirect',
        mechanism: `RSA-OAEP-${rsaHashAlgo.toUpperCase()} + AES-KWP`,
        wrappingKeyLabel: `RSA-${rsaKeyBits} pub (h=${rsaPubHandle})`,
        targetKeyLabel: targetLabel,
        wrappedHex: toHex(wrappedTarget),
        auxHex: toHex(encryptedKEK),
        auxLabel: 'RSA-Encrypted KEK',
      }
      setWrapResult(result)
      setUnwrappedHandle(null)
      addLogEntry({ ...result, timestamp: new Date().toISOString(), op: 'wrap', status: 'ok' })
    })

  const doWrapPQC = () =>
    withLoading('wrap', async () => {
      const M = moduleRef.current!
      const hSession = hSessionRef.current
      const effTarget = resolveTargetHandle(M, hSession)

      // 1. ML-KEM encapsulate → PQC shared secret
      const { ciphertextBytes, secretHandle: pqcSecretHandle } = hsm_encapsulate(
        M,
        hSession,
        mlkemPubHandle!,
        mlkemVariant
      )
      const pqcSS = hsm_extractKeyValue(M, hSession, pqcSecretHandle)

      let classicalSS: Uint8Array
      let ephPubHex: string
      let combinerLabel: string

      if (hybridCombiner === 'p256-mlkem') {
        // 2a. ECDH P-256: generate ephemeral pair, derive with recipient's pub
        const { pubHandle: ephPub, privHandle: ephPriv } = hsm_generateECKeyPair(
          M,
          hSession,
          'P-256',
          false,
          'sign'
        )
        const recipientPubBytes = hsm_extractECPoint(M, hSession, ecPubHandle!)
        const classicalSecretHandle = hsm_ecdhDerive(M, hSession, ephPriv, recipientPubBytes)
        classicalSS = hsm_extractKeyValue(M, hSession, classicalSecretHandle)
        ephPubHex = toHex(hsm_extractECPoint(M, hSession, ephPub))
        combinerLabel = `P-256+ML-KEM-${mlkemVariant}`
      } else {
        // 2b. X25519 via Web Crypto
        const ephKP = await crypto.subtle.generateKey({ name: 'X25519' } as EcKeyGenParams, true, [
          'deriveBits',
        ])
        const recipientPub = x25519KeyPair!.publicKey
        const rawBits = await crypto.subtle.deriveBits(
          { name: 'X25519', public: recipientPub } as EcdhKeyDeriveParams,
          ephKP.privateKey,
          256
        )
        classicalSS = new Uint8Array(rawBits)
        const ephPubRaw = await crypto.subtle.exportKey('raw', ephKP.publicKey)
        ephPubHex = toHex(new Uint8Array(ephPubRaw))
        combinerLabel = `X25519+ML-KEM-${mlkemVariant}`
      }

      // 3. Combine → HKDF → AES-256 KEK → AES-KWP wrap (KWP handles arbitrary-length keys)
      const kekHandle = deriveHybridKEK(M, hSession, classicalSS, pqcSS)
      const wrappedTarget = hsm_wrapKeyMech(M, hSession, CKM_AES_KEY_WRAP_KWP, kekHandle, effTarget)

      const targetLabel =
        isPqcTarget && pqcWrapRepr === 'seed'
          ? `${keyLabel(targetKeyHandle)} [seed]`
          : keyLabel(targetKeyHandle)

      const result: WrapResult = {
        mode: 'pqc',
        mechanism: `${combinerLabel} + HKDF + AES-KWP`,
        wrappingKeyLabel: combinerLabel,
        targetKeyLabel: targetLabel,
        wrappedHex: toHex(wrappedTarget),
        auxHex: toHex(ciphertextBytes),
        auxLabel: 'ML-KEM Ciphertext',
        aux2Hex: ephPubHex,
        aux2Label:
          hybridCombiner === 'p256-mlkem' ? 'Ephemeral EC P-256 Pubkey' : 'Ephemeral X25519 Pubkey',
      }
      setWrapResult(result)
      setUnwrappedHandle(null)
      addLogEntry({ ...result, timestamp: new Date().toISOString(), op: 'wrap', status: 'ok' })
    })

  const doWrap = () => {
    if (wrapMode === 'direct') return doWrapDirect()
    if (wrapMode === 'indirect') return doWrapIndirect()
    return doWrapPQC()
  }

  // ── Unwrap operations ────────────────────────────────────────────────────────

  const doUnwrapDirect = () =>
    withLoading('unwrap', async () => {
      const M = moduleRef.current!
      const hSession = hSessionRef.current
      const wrappedBytes = hexToBytes(pastedWrappedHex)
      const tpl = UNWRAP_TEMPLATE(unwrapTargetBits)
      let newHandle: number

      if (directMech === 'aes-kw') {
        newHandle = hsm_unwrapKeyMech(
          M,
          hSession,
          CKM_AES_KEY_WRAP,
          wrapKeyHandle!,
          wrappedBytes,
          tpl
        )
      } else if (directMech === 'aes-kwp') {
        newHandle = hsm_unwrapKeyMech(
          M,
          hSession,
          CKM_AES_KEY_WRAP_KWP,
          wrapKeyHandle!,
          wrappedBytes,
          tpl
        )
      } else {
        const iv = hexToBytes(pastedIvHex)
        newHandle = hsm_aesGcmUnwrapKey(M, hSession, wrapKeyHandle!, wrappedBytes, iv, tpl)
      }

      setUnwrappedHandle(newHandle)
      hsm.addKey({
        handle: newHandle,
        family: 'aes',
        role: 'secret',
        label: `AES-${unwrapTargetBits} (unwrapped)`,
        variant: String(unwrapTargetBits),
        generatedAt: new Date().toLocaleTimeString([], { hour12: false }),
      })
      addLogEntry({
        mode: wrapMode,
        mechanism: directMech.toUpperCase(),
        wrappingKeyLabel: keyLabel(wrapKeyHandle),
        targetKeyLabel: `unwrapped → h=${newHandle}`,
        wrappedHex: pastedWrappedHex,
        timestamp: new Date().toISOString(),
        op: 'unwrap',
        status: 'ok',
        unwrappedHandle: newHandle,
      })
    })

  const doUnwrapIndirect = () =>
    withLoading('unwrap', async () => {
      const M = moduleRef.current!
      const hSession = hSessionRef.current
      const encryptedKEKBytes = hexToBytes(pastedAuxHex)
      const wrappedTargetBytes = hexToBytes(pastedWrappedHex)
      const tpl = UNWRAP_TEMPLATE(unwrapTargetBits)

      const kekTemplate = UNWRAP_TEMPLATE(256)
      const tempKEKHandle = hsm_rsaOaepUnwrapKey(
        M,
        hSession,
        rsaPrivHandle!,
        encryptedKEKBytes,
        kekTemplate,
        rsaHashAlgo
      )
      const newHandle = hsm_unwrapKeyMech(
        M,
        hSession,
        CKM_AES_KEY_WRAP_KWP,
        tempKEKHandle,
        wrappedTargetBytes,
        tpl
      )

      setUnwrappedHandle(newHandle)
      hsm.addKey({
        handle: newHandle,
        family: 'aes',
        role: 'secret',
        label: `AES-${unwrapTargetBits} (unwrapped)`,
        variant: String(unwrapTargetBits),
        generatedAt: new Date().toLocaleTimeString([], { hour12: false }),
      })
      addLogEntry({
        mode: 'indirect',
        mechanism: `RSA-OAEP-${rsaHashAlgo.toUpperCase()} + AES-KWP`,
        wrappingKeyLabel: `RSA priv (h=${rsaPrivHandle})`,
        targetKeyLabel: `unwrapped → h=${newHandle}`,
        wrappedHex: pastedWrappedHex,
        auxHex: pastedAuxHex,
        auxLabel: 'RSA-Encrypted KEK',
        timestamp: new Date().toISOString(),
        op: 'unwrap',
        status: 'ok',
        unwrappedHandle: newHandle,
      })
    })

  const doUnwrapPQC = () =>
    withLoading('unwrap', async () => {
      const M = moduleRef.current!
      const hSession = hSessionRef.current
      const ctBytes = hexToBytes(pastedAuxHex)
      const ephPubBytes = hexToBytes(pastedAux2Hex)
      const wrappedTargetBytes = hexToBytes(pastedWrappedHex)
      const tpl = UNWRAP_TEMPLATE(unwrapTargetBits)

      // 1. ML-KEM decapsulate → PQC shared secret
      const pqcSecretHandle = hsm_decapsulate(M, hSession, mlkemPrivHandle!, ctBytes, mlkemVariant)
      const pqcSS = hsm_extractKeyValue(M, hSession, pqcSecretHandle)

      let classicalSS: Uint8Array
      if (hybridCombiner === 'p256-mlkem') {
        // 2a. ECDH with ephemeral pub
        const classicalSecretHandle = hsm_ecdhDerive(M, hSession, ecPrivHandle!, ephPubBytes)
        classicalSS = hsm_extractKeyValue(M, hSession, classicalSecretHandle)
      } else {
        // 2b. X25519 via Web Crypto
        const ephPub = await crypto.subtle.importKey(
          'raw',
          ephPubBytes.buffer as ArrayBuffer,
          { name: 'X25519' } as EcKeyImportParams,
          true,
          []
        )
        const rawBits = await crypto.subtle.deriveBits(
          { name: 'X25519', public: ephPub } as EcdhKeyDeriveParams,
          x25519KeyPair!.privateKey,
          256
        )
        classicalSS = new Uint8Array(rawBits)
      }

      // 3. Combine → HKDF → KEK → AES-KWP unwrap (must match wrap which uses KWP)
      const kekHandle = deriveHybridKEK(M, hSession, classicalSS, pqcSS)
      const newHandle = hsm_unwrapKeyMech(
        M,
        hSession,
        CKM_AES_KEY_WRAP_KWP,
        kekHandle,
        wrappedTargetBytes,
        tpl
      )

      setUnwrappedHandle(newHandle)
      hsm.addKey({
        handle: newHandle,
        family: 'aes',
        role: 'secret',
        label: `AES-${unwrapTargetBits} (unwrapped)`,
        variant: String(unwrapTargetBits),
        generatedAt: new Date().toLocaleTimeString([], { hour12: false }),
      })
      addLogEntry({
        mode: 'pqc',
        mechanism: `${hybridCombiner === 'p256-mlkem' ? 'P-256' : 'X25519'}+ML-KEM-${mlkemVariant} + HKDF + AES-KW`,
        wrappingKeyLabel: `Hybrid (h=${mlkemPrivHandle})`,
        targetKeyLabel: `unwrapped → h=${newHandle}`,
        wrappedHex: pastedWrappedHex,
        auxHex: pastedAuxHex,
        auxLabel: 'ML-KEM Ciphertext',
        aux2Hex: pastedAux2Hex,
        aux2Label: 'Ephemeral Pubkey',
        timestamp: new Date().toISOString(),
        op: 'unwrap',
        status: 'ok',
        unwrappedHandle: newHandle,
      })
    })

  const doUnwrap = () => {
    if (wrapMode === 'direct') return doUnwrapDirect()
    if (wrapMode === 'indirect') return doUnwrapIndirect()
    return doUnwrapPQC()
  }

  // ── CSV import ───────────────────────────────────────────────────────────────

  const onCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string
        const lines = text.trim().split(/\r?\n/)
        if (lines.length < 2) throw new Error('CSV must have header + at least one data row')
        const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
        const row = lines[1].split(',').map((v) => v.trim())
        const get = (col: string) => row[header.indexOf(col)] ?? ''
        const wrappedCol = get('wrapped_hex') || get('wrapped data (hex)')
        const auxCol = get('aux_hex') || get('aux data') || ''
        const aux2Col = get('aux2_hex') || get('eph_pubkey') || ''
        const bitsStr = get('key_bits') || get('key size (bits)') || '256'
        if (!wrappedCol) throw new Error('CSV missing wrapped_hex column')
        setPastedWrappedHex(wrappedCol)
        if (auxCol) setPastedAuxHex(auxCol)
        if (aux2Col) setPastedAux2Hex(aux2Col)
        const bits = parseInt(bitsStr, 10)
        if (bits === 128 || bits === 192 || bits === 256) setUnwrapTargetBits(bits)
        setUnwrapInputMode('paste')
      } catch (err) {
        setError(String(err))
      }
    }
    reader.readAsText(file)
    if (csvFileRef.current) csvFileRef.current.value = ''
  }

  // ── CSV export ───────────────────────────────────────────────────────────────

  const exportSessionCsv = () => {
    const csv = [
      'Timestamp,Operation,Mode,Mechanism,Wrapping Key,Target Key,Wrapped Data (hex),Aux Data,Aux2 Data,Status',
      ...sessionLog.map((e) =>
        [
          e.timestamp,
          e.op,
          e.mode,
          e.mechanism,
          e.wrappingKeyLabel,
          e.targetKeyLabel,
          e.wrappedHex,
          e.auxHex ?? '–',
          e.aux2Hex ?? '–',
          e.status,
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n')
    downloadCsv(csv, `key-wrap-session-${Date.now()}.csv`)
  }

  // ── Readiness checks ───────────────────────────────────────────────────────

  const canUnwrap = (() => {
    if (!pastedWrappedHex || !isValidHex(pastedWrappedHex)) return false
    if (wrapMode === 'direct') {
      if (!wrapKeyHandle) return false
      if (directMech === 'aes-gcm') {
        if (!pastedIvHex || hexByteLen(pastedIvHex) !== 12) return false
      }
    }
    if (wrapMode === 'indirect') {
      if (!rsaPrivHandle || !pastedAuxHex || !isValidHex(pastedAuxHex)) return false
    }
    if (wrapMode === 'pqc') {
      if (!mlkemPrivHandle || !pastedAuxHex || !pastedAux2Hex) return false
      if (!isValidHex(pastedAuxHex) || !isValidHex(pastedAux2Hex)) return false
      if (hybridCombiner === 'p256-mlkem' && !ecPrivHandle) return false
      if (hybridCombiner === 'x25519-mlkem' && !x25519KeyPair) return false
    }
    return true
  })()

  const canWrap = (() => {
    if (!targetKeyHandle) return false
    if (wrapMode === 'direct') return !!wrapKeyHandle
    if (wrapMode === 'indirect') return !!rsaPubHandle
    if (wrapMode === 'pqc') {
      if (!mlkemPubHandle) return false
      if (hybridCombiner === 'p256-mlkem') return !!ecPubHandle
      if (hybridCombiner === 'x25519-mlkem') return !!x25519KeyPair
    }
    return false
  })()

  // ── Key generation helpers ────────────────────────────────────────────────

  const genRSAWrapPair = () =>
    withLoading('gen-rsa', async () => {
      const M = moduleRef.current!
      const { pubHandle, privHandle } = hsm_generateRSAWrapKeyPair(
        M,
        hSessionRef.current,
        rsaKeyBits
      )
      setRsaPubHandle(pubHandle)
      setRsaPrivHandle(privHandle)
      const ts = new Date().toLocaleTimeString([], { hour12: false })
      hsm.addKey({
        handle: pubHandle,
        family: 'rsa',
        role: 'public',
        label: `RSA-${rsaKeyBits} Wrap Pub`,
        variant: String(rsaKeyBits),
        generatedAt: ts,
      })
      hsm.addKey({
        handle: privHandle,
        family: 'rsa',
        role: 'private',
        label: `RSA-${rsaKeyBits} Wrap Priv`,
        variant: String(rsaKeyBits),
        generatedAt: ts,
      })
    })

  const genHybridKeyPair = () =>
    withLoading('gen-hybrid', async () => {
      const M = moduleRef.current!
      const hSession = hSessionRef.current
      const ts = new Date().toLocaleTimeString([], { hour12: false })

      // ML-KEM pair
      const { pubHandle: mkPub, privHandle: mkPriv } = hsm_generateMLKEMKeyPair(
        M,
        hSession,
        mlkemVariant
      )
      setMlkemPubHandle(mkPub)
      setMlkemPrivHandle(mkPriv)
      hsm.addKey({
        handle: mkPub,
        family: 'ml-kem',
        role: 'public',
        label: `ML-KEM-${mlkemVariant} Pub`,
        variant: String(mlkemVariant),
        generatedAt: ts,
      })
      hsm.addKey({
        handle: mkPriv,
        family: 'ml-kem',
        role: 'private',
        label: `ML-KEM-${mlkemVariant} Priv`,
        variant: String(mlkemVariant),
        generatedAt: ts,
      })

      if (hybridCombiner === 'p256-mlkem') {
        // P-256 ECDH pair
        const { pubHandle: ecPub, privHandle: ecPriv } = hsm_generateECKeyPair(
          M,
          hSession,
          'P-256',
          false,
          'sign'
        )
        setEcPubHandle(ecPub)
        setEcPrivHandle(ecPriv)
        hsm.addKey({
          handle: ecPub,
          family: 'ecdh',
          role: 'public',
          label: 'EC P-256 Hybrid Pub',
          variant: 'P-256',
          generatedAt: ts,
        })
        hsm.addKey({
          handle: ecPriv,
          family: 'ecdh',
          role: 'private',
          label: 'EC P-256 Hybrid Priv',
          variant: 'P-256',
          generatedAt: ts,
        })
      } else {
        // X25519 via Web Crypto
        const kp = await crypto.subtle.generateKey({ name: 'X25519' } as EcKeyGenParams, true, [
          'deriveBits',
        ])
        setX25519KeyPair(kp)
      }
    })

  const genWrappableMLKEM = () =>
    withLoading('gen-wkem', async () => {
      const M = moduleRef.current!
      const { pubHandle, privHandle } = hsm_generateMLKEMKeyPair(
        M,
        hSessionRef.current,
        mlkemVariant,
        true
      )
      const ts = new Date().toLocaleTimeString([], { hour12: false })
      hsm.addKey({
        handle: pubHandle,
        family: 'ml-kem',
        role: 'public',
        label: `ML-KEM-${mlkemVariant} Pub (extractable)`,
        variant: String(mlkemVariant),
        generatedAt: ts,
      })
      hsm.addKey({
        handle: privHandle,
        family: 'ml-kem',
        role: 'private',
        label: `ML-KEM-${mlkemVariant} Priv (extractable)`,
        variant: String(mlkemVariant),
        generatedAt: ts,
      })
    })

  const genWrappableMLDSA = () =>
    withLoading('gen-wdsa', async () => {
      const M = moduleRef.current!
      const variant = 65 as const // default to ML-DSA-65 (NIST L3)
      const { pubHandle, privHandle } = hsm_generateMLDSAKeyPair(
        M,
        hSessionRef.current,
        variant,
        true
      )
      const ts = new Date().toLocaleTimeString([], { hour12: false })
      hsm.addKey({
        handle: pubHandle,
        family: 'ml-dsa',
        role: 'public',
        label: `ML-DSA-${variant} Pub (extractable)`,
        variant: String(variant),
        generatedAt: ts,
      })
      hsm.addKey({
        handle: privHandle,
        family: 'ml-dsa',
        role: 'private',
        label: `ML-DSA-${variant} Priv (extractable)`,
        variant: String(variant),
        generatedAt: ts,
      })
    })

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      <LiveHSMToggle
        hsm={hsm}
        operations={[
          'C_GenerateKey',
          'C_GenerateKeyPair',
          'C_WrapKey',
          'C_UnwrapKey',
          'C_EncapsulateKey',
        ]}
      />

      {showInfo && <WrapInfoModal onClose={() => setShowInfo(false)} />}

      {isReady && (
        <div className="space-y-4">
          {/* ── Mode selector ─────────────────────────────────────────────────── */}
          <div className="glass-panel p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Wrapping Mode
              </p>
              <div className="flex items-center gap-1">
                <ShareButton title="HSM Key Wrap" variant="icon" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setShowInfo(true)}
                >
                  <Info size={12} className="mr-1" /> NIST refs &amp; cloud HSM
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  {
                    id: 'direct' as const,
                    icon: Lock,
                    label: 'Direct KEK',
                    sub: 'AES-KW · AES-KWP · AES-GCM',
                  },
                  {
                    id: 'indirect' as const,
                    icon: Shield,
                    label: 'Indirect (RSA+KEK)',
                    sub: 'RSA-OAEP + AES-KWP',
                  },
                  {
                    id: 'pqc' as const,
                    icon: Zap,
                    label: 'PQC Hybrid',
                    sub: 'ECDH + ML-KEM + HKDF → AES-KW',
                  },
                ] as const
              ).map(({ id, icon: Icon, label, sub }) => (
                <Button
                  key={id}
                  variant="ghost"
                  onClick={() => {
                    setWrapMode(id)
                    setWrapResult(null)
                    setUnwrappedHandle(null)
                    setError(null)
                    emitAlgo(id, directMech, hybridCombiner, mlkemVariant)
                  }}
                  className={`flex flex-col items-start h-auto px-3 py-2 rounded border text-left transition-colors ${
                    wrapMode === id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-xs font-semibold">
                    <Icon size={12} /> {label}
                  </span>
                  <span className="text-[10px] mt-0.5 opacity-70">{sub}</span>
                </Button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              <span className="font-medium text-foreground/60">FIPS ref:</span>{' '}
              {FIPS_REFS[wrapMode]}
            </p>
          </div>

          {/* ── Mode-specific config ───────────────────────────────────────────── */}

          {wrapMode === 'direct' && (
            <div className="glass-panel p-4 space-y-3">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Mechanism
              </p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { id: 'aes-kw' as const, label: 'AES-KW', desc: 'RFC 3394' },
                    { id: 'aes-kwp' as const, label: 'AES-KWP', desc: 'RFC 5649' },
                    { id: 'aes-gcm' as const, label: 'AES-GCM', desc: 'SP 800-38D' },
                  ] as const
                ).map(({ id, label, desc }) => (
                  <Button
                    key={id}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDirectMech(id)
                      emitAlgo(wrapMode, id, hybridCombiner, mlkemVariant)
                    }}
                    className={`text-xs h-7 px-3 ${directMech === id ? 'bg-primary/20 text-primary' : ''}`}
                  >
                    {label} <span className="ml-1 opacity-60">{desc}</span>
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground w-24">Wrapping key:</span>
                <FilterDropdown
                  items={aesKeys.map((k) => ({
                    id: String(k.handle),
                    label: `h=${k.handle} — ${k.label}`,
                  }))}
                  selectedId={wrapKeyHandle !== null ? String(wrapKeyHandle) : 'All'}
                  onSelect={(id) =>
                    setWrapKeyHandle(id === 'All' ? null : parseInt(id, 10) || null)
                  }
                  defaultLabel="Select AES key…"
                  noContainer
                />
              </div>
              {aesKeys.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Generate AES keys in AES-GCM/CBC/CTR mode first.
                </p>
              )}
            </div>
          )}

          {wrapMode === 'indirect' && (
            <div className="glass-panel p-4 space-y-3">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                RSA Wrap Key Pair
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Key size:</span>
                {([2048, 3072, 4096] as const).map((b) => (
                  <Button
                    key={b}
                    variant="ghost"
                    size="sm"
                    onClick={() => setRsaKeyBits(b)}
                    className={`text-xs h-7 px-2 ${rsaKeyBits === b ? 'bg-primary/20 text-primary' : ''}`}
                  >
                    RSA-{b}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={genRSAWrapPair}
                  disabled={anyLoading}
                  className="text-xs h-7"
                >
                  {loadingOp === 'gen-rsa' ? (
                    <Loader2 size={12} className="animate-spin mr-1" />
                  ) : (
                    <Key size={12} className="mr-1" />
                  )}
                  Gen RSA Pair
                </Button>
              </div>
              {rsaPubHandle !== null && (
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div>
                    Pub: h={rsaPubHandle} &nbsp;·&nbsp; Priv: h={rsaPrivHandle}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground w-24">OAEP hash:</span>
                {(['sha256', 'sha384', 'sha512'] as const).map((h) => (
                  <Button
                    key={h}
                    variant="ghost"
                    size="sm"
                    onClick={() => setRsaHashAlgo(h)}
                    className={`text-xs h-7 px-2 ${rsaHashAlgo === h ? 'bg-primary/20 text-primary' : ''}`}
                  >
                    {h.toUpperCase()}
                  </Button>
                ))}
              </div>
              {rsaPubHandle === null && (
                <p className="text-xs text-muted-foreground">
                  Generate an RSA wrap key pair above to enable wrapping.
                </p>
              )}
            </div>
          )}

          {wrapMode === 'pqc' && (
            <div className="glass-panel p-4 space-y-3">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Hybrid Combiner
              </p>

              {/* Combiner sub-mode selector */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setHybridCombiner('p256-mlkem')
                    emitAlgo(wrapMode, directMech, 'p256-mlkem', mlkemVariant)
                  }}
                  className={`text-xs h-7 px-3 ${hybridCombiner === 'p256-mlkem' ? 'bg-primary/20 text-primary' : ''}`}
                >
                  P-256 + ML-KEM <span className="ml-1 opacity-60">PKCS#11</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setHybridCombiner('x25519-mlkem')
                    emitAlgo(wrapMode, directMech, 'x25519-mlkem', mlkemVariant)
                  }}
                  className={`text-xs h-7 px-3 ${hybridCombiner === 'x25519-mlkem' ? 'bg-primary/20 text-primary' : ''}`}
                >
                  X25519 + ML-KEM <span className="ml-1 opacity-60">X-Wing</span>
                </Button>
              </div>

              {/* ML-KEM variant */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">ML-KEM:</span>
                {([768, 1024] as const).map((v) => (
                  <Button
                    key={v}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMlkemVariant(v)
                      emitAlgo(wrapMode, directMech, hybridCombiner, v)
                    }}
                    className={`text-xs h-7 px-2 ${mlkemVariant === v ? 'bg-primary/20 text-primary' : ''}`}
                  >
                    ML-KEM-{v}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={genHybridKeyPair}
                  disabled={anyLoading}
                  className="text-xs h-7"
                >
                  {loadingOp === 'gen-hybrid' ? (
                    <Loader2 size={12} className="animate-spin mr-1" />
                  ) : (
                    <Zap size={12} className="mr-1" />
                  )}
                  Gen {hybridCombiner === 'p256-mlkem' ? 'EC+ML-KEM' : 'X25519+ML-KEM'} Pair
                </Button>
              </div>

              {/* Show generated key handles */}
              {mlkemPubHandle !== null && (
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div>
                    ML-KEM: pub h={mlkemPubHandle} · priv h={mlkemPrivHandle}
                  </div>
                  {hybridCombiner === 'p256-mlkem' && ecPubHandle !== null && (
                    <div>
                      EC P-256: pub h={ecPubHandle} · priv h={ecPrivHandle}
                    </div>
                  )}
                  {hybridCombiner === 'x25519-mlkem' && x25519KeyPair && (
                    <div>X25519: Web Crypto key pair ready</div>
                  )}
                </div>
              )}

              <p className="text-[10px] text-muted-foreground opacity-70">
                {hybridCombiner === 'p256-mlkem'
                  ? 'ECDH P-256 → classical_ss (32 B) || ML-KEM → pqc_ss (32 B) → HKDF-SHA-256 → AES-256 KEK → AES-KW'
                  : 'X25519 → classical_ss (32 B) || ML-KEM → pqc_ss (32 B) → HKDF-SHA-256 → AES-256 KEK → AES-KW'}
              </p>
            </div>
          )}

          {/* ── Target key + Wrap button ──────────────────────────────────────── */}
          <div className="glass-panel p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Target Key
              </p>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={genWrappableMLKEM}
                  disabled={anyLoading}
                >
                  {loadingOp === 'gen-wkem' ? (
                    <Loader2 size={10} className="animate-spin mr-1" />
                  ) : (
                    <Zap size={10} className="mr-1" />
                  )}
                  Gen ML-KEM
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={genWrappableMLDSA}
                  disabled={anyLoading}
                >
                  {loadingOp === 'gen-wdsa' ? (
                    <Loader2 size={10} className="animate-spin mr-1" />
                  ) : (
                    <Key size={10} className="mr-1" />
                  )}
                  Gen ML-DSA
                </Button>
              </div>
            </div>

            {wrappableKeys.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No wrappable keys found. Generate AES keys or use buttons above to generate
                wrappable PQC keys.
              </p>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground w-24">Key to wrap:</span>
                <FilterDropdown
                  items={wrappableKeys.map((k) => ({
                    id: String(k.handle),
                    label: `h=${k.handle} — ${k.label}`,
                  }))}
                  selectedId={targetKeyHandle !== null ? String(targetKeyHandle) : 'All'}
                  onSelect={(id) => {
                    setTargetKeyHandle(id === 'All' ? null : parseInt(id, 10) || null)
                    setWrapResult(null)
                  }}
                  defaultLabel="Select target key…"
                  noContainer
                />
              </div>
            )}

            {/* Seed / Expanded toggle for PQC targets */}
            {isPqcTarget && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Representation:</span>
                {(['expanded', 'seed'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setPqcWrapRepr(r)}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      pqcWrapRepr === r
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {r === 'expanded' ? 'Expanded' : 'Seed'}
                  </button>
                ))}
                <span className="text-[10px] text-muted-foreground">
                  {pqcWrapRepr === 'seed'
                    ? `${targetKeyInfo?.family === 'ml-kem' ? ML_KEM_SEED_LEN : ML_DSA_SEED_LEN} B seed`
                    : 'Full key material'}
                </span>
              </div>
            )}

            <Button onClick={doWrap} disabled={!canWrap || anyLoading} className="w-full">
              {loadingOp === 'wrap' ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : (
                <Lock size={14} className="mr-2" />
              )}
              Wrap Key
            </Button>
          </div>

          {error && <ErrorAlert message={error} />}

          {/* ── Wrap result ───────────────────────────────────────────────────── */}
          {wrapResult && (
            <div className="glass-panel p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Wrap Result
                </p>
                <span className="text-[10px] text-muted-foreground">{wrapResult.mechanism}</span>
              </div>

              <HsmResultRow label="Target" value={wrapResult.targetKeyLabel} mono={false} />

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Wrapped key (hex)</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => copyHex(wrapResult.wrappedHex, 'wrapped')}
                  >
                    {copied === 'wrapped' ? (
                      <Check size={12} className="text-status-success" />
                    ) : (
                      <Copy size={12} />
                    )}
                    <span className="ml-1">{copied === 'wrapped' ? 'Copied!' : 'Copy'}</span>
                  </Button>
                </div>
                <p className="text-xs font-mono bg-muted rounded px-3 py-2 break-all text-foreground/80 select-all">
                  {wrapResult.wrappedHex}
                </p>
              </div>

              {wrapResult.auxHex && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{wrapResult.auxLabel}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => copyHex(wrapResult.auxHex!, 'aux')}
                    >
                      {copied === 'aux' ? (
                        <Check size={12} className="text-status-success" />
                      ) : (
                        <Copy size={12} />
                      )}
                      <span className="ml-1">{copied === 'aux' ? 'Copied!' : 'Copy'}</span>
                    </Button>
                  </div>
                  <p className="text-xs font-mono bg-muted rounded px-3 py-2 break-all text-foreground/80 select-all">
                    {wrapResult.auxHex}
                  </p>
                </div>
              )}

              {wrapResult.aux2Hex && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{wrapResult.aux2Label}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => copyHex(wrapResult.aux2Hex!, 'aux2')}
                    >
                      {copied === 'aux2' ? (
                        <Check size={12} className="text-status-success" />
                      ) : (
                        <Copy size={12} />
                      )}
                      <span className="ml-1">{copied === 'aux2' ? 'Copied!' : 'Copy'}</span>
                    </Button>
                  </div>
                  <p className="text-xs font-mono bg-muted rounded px-3 py-2 break-all text-foreground/80 select-all">
                    {wrapResult.aux2Hex}
                  </p>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground">
                Paste these values below to test unwrapping, or export to CSV.
              </p>
            </div>
          )}

          {/* ── Unwrap section ────────────────────────────────────────────────── */}
          <div className="glass-panel p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Unwrap
              </p>
              <div className="flex gap-1">
                {(['paste', 'csv'] as const).map((m) => (
                  <Button
                    key={m}
                    variant="ghost"
                    size="sm"
                    onClick={() => setUnwrapInputMode(m)}
                    className={`h-6 px-2 text-xs ${unwrapInputMode === m ? 'bg-primary/20 text-primary' : ''}`}
                  >
                    {m === 'paste' ? (
                      <Copy size={10} className="mr-1" />
                    ) : (
                      <Upload size={10} className="mr-1" />
                    )}
                    {m === 'paste' ? 'Paste hex' : 'Upload CSV'}
                  </Button>
                ))}
              </div>
            </div>

            {unwrapInputMode === 'csv' && (
              <div>
                <input
                  type="file"
                  accept=".csv"
                  ref={csvFileRef}
                  onChange={onCsvFile}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs w-full h-8"
                  onClick={() => csvFileRef.current?.click()}
                >
                  <Upload size={12} className="mr-2" /> Choose CSV file…
                </Button>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Expected columns: <span className="font-mono">wrapped_hex</span>,{' '}
                  <span className="font-mono">aux_hex</span>,{' '}
                  <span className="font-mono">aux2_hex</span> (optional),{' '}
                  <span className="font-mono">key_bits</span>
                </p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="unwrap-wrapped-hex" className="text-xs text-muted-foreground">
                  Wrapped key blob (hex) — raw hex, 0x-prefix, or colon-separated
                </label>
                {pastedWrappedHex && (
                  <span
                    className={`text-[10px] font-mono ${!isValidHex(pastedWrappedHex) ? 'text-status-error' : 'text-muted-foreground'}`}
                  >
                    {isValidHex(pastedWrappedHex)
                      ? `${hexByteLen(pastedWrappedHex)}B`
                      : 'invalid hex'}
                  </span>
                )}
              </div>
              <textarea
                id="unwrap-wrapped-hex"
                value={pastedWrappedHex}
                onChange={(e) => {
                  setPastedWrappedHex(e.target.value)
                  setUnwrappedHandle(null)
                }}
                placeholder="e.g. a0b1c2d3… or 0xa0:b1:c2 or a0 b1 c2"
                className={`w-full h-16 text-xs font-mono bg-muted border rounded px-3 py-2 resize-none text-foreground/80 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary ${pastedWrappedHex && !isValidHex(pastedWrappedHex) ? 'border-status-error' : 'border-input'}`}
              />
            </div>

            {wrapMode === 'indirect' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="unwrap-rsa-kek-hex" className="text-xs text-muted-foreground">
                    RSA-encrypted KEK (hex)
                  </label>
                  {pastedAuxHex && (
                    <span
                      className={`text-[10px] font-mono ${!isValidHex(pastedAuxHex) ? 'text-status-error' : 'text-muted-foreground'}`}
                    >
                      {isValidHex(pastedAuxHex) ? `${hexByteLen(pastedAuxHex)}B` : 'invalid hex'}
                    </span>
                  )}
                </div>
                <textarea
                  id="unwrap-rsa-kek-hex"
                  value={pastedAuxHex}
                  onChange={(e) => setPastedAuxHex(e.target.value)}
                  placeholder="Paste the RSA-OAEP encrypted AES key…"
                  className={`w-full h-12 text-xs font-mono bg-muted border rounded px-3 py-2 resize-none text-foreground/80 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary ${pastedAuxHex && !isValidHex(pastedAuxHex) ? 'border-status-error' : 'border-input'}`}
                />
              </div>
            )}

            {wrapMode === 'pqc' && (
              <>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="unwrap-mlkem-ct-hex" className="text-xs text-muted-foreground">
                      ML-KEM ciphertext (hex)
                    </label>
                    {pastedAuxHex && (
                      <span
                        className={`text-[10px] font-mono ${!isValidHex(pastedAuxHex) ? 'text-status-error' : 'text-muted-foreground'}`}
                      >
                        {isValidHex(pastedAuxHex) ? `${hexByteLen(pastedAuxHex)}B` : 'invalid hex'}
                      </span>
                    )}
                  </div>
                  <textarea
                    id="unwrap-mlkem-ct-hex"
                    value={pastedAuxHex}
                    onChange={(e) => setPastedAuxHex(e.target.value)}
                    placeholder="Paste the ML-KEM encapsulation ciphertext…"
                    className={`w-full h-12 text-xs font-mono bg-muted border rounded px-3 py-2 resize-none text-foreground/80 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary ${pastedAuxHex && !isValidHex(pastedAuxHex) ? 'border-status-error' : 'border-input'}`}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="unwrap-eph-pubkey-hex"
                      className="text-xs text-muted-foreground"
                    >
                      Ephemeral {hybridCombiner === 'p256-mlkem' ? 'EC P-256' : 'X25519'} pubkey
                      (hex)
                    </label>
                    {pastedAux2Hex && (
                      <span
                        className={`text-[10px] font-mono ${!isValidHex(pastedAux2Hex) ? 'text-status-error' : 'text-muted-foreground'}`}
                      >
                        {isValidHex(pastedAux2Hex)
                          ? `${hexByteLen(pastedAux2Hex)}B`
                          : 'invalid hex'}
                      </span>
                    )}
                  </div>
                  <textarea
                    id="unwrap-eph-pubkey-hex"
                    value={pastedAux2Hex}
                    onChange={(e) => setPastedAux2Hex(e.target.value)}
                    placeholder="Paste the ephemeral public key…"
                    className={`w-full h-10 text-xs font-mono bg-muted border rounded px-3 py-2 resize-none text-foreground/80 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary ${pastedAux2Hex && !isValidHex(pastedAux2Hex) ? 'border-status-error' : 'border-input'}`}
                  />
                </div>
              </>
            )}

            {wrapMode === 'direct' && directMech === 'aes-gcm' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="unwrap-gcm-iv-hex" className="text-xs text-muted-foreground">
                    GCM IV (hex, 12 bytes)
                  </label>
                  {pastedIvHex && (
                    <span
                      className={`text-[10px] font-mono ${hexByteLen(pastedIvHex) !== 12 ? 'text-status-error' : 'text-muted-foreground'}`}
                    >
                      {hexByteLen(pastedIvHex)}/12B
                    </span>
                  )}
                </div>
                <textarea
                  id="unwrap-gcm-iv-hex"
                  value={pastedIvHex}
                  onChange={(e) => setPastedIvHex(e.target.value)}
                  placeholder="24-char hex (12 bytes)…"
                  className={`w-full h-10 text-xs font-mono bg-muted border rounded px-3 py-2 resize-none text-foreground/80 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary ${pastedIvHex && hexByteLen(pastedIvHex) !== 12 ? 'border-status-error' : 'border-input'}`}
                />
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Unwrap as:</span>
              {([128, 192, 256] as const).map((b) => (
                <Button
                  key={b}
                  variant="ghost"
                  size="sm"
                  onClick={() => setUnwrapTargetBits(b)}
                  className={`h-6 px-2 text-xs ${unwrapTargetBits === b ? 'bg-primary/20 text-primary' : ''}`}
                >
                  AES-{b}
                </Button>
              ))}
            </div>

            {/* Unwrap key selector — mode-specific */}
            {wrapMode === 'direct' && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground w-24">Unwrap key:</span>
                <FilterDropdown
                  items={aesKeys.map((k) => ({
                    id: String(k.handle),
                    label: `h=${k.handle} — ${k.label}`,
                  }))}
                  selectedId={wrapKeyHandle !== null ? String(wrapKeyHandle) : 'All'}
                  onSelect={(id) =>
                    setWrapKeyHandle(id === 'All' ? null : parseInt(id, 10) || null)
                  }
                  defaultLabel="Select AES key…"
                  noContainer
                />
              </div>
            )}

            {wrapMode === 'indirect' && rsaPrivHandle !== null && (
              <p className="text-xs text-muted-foreground">
                RSA priv: h={rsaPrivHandle} &nbsp;·&nbsp; OAEP-{rsaHashAlgo.toUpperCase()}
              </p>
            )}
            {wrapMode === 'indirect' && rsaPrivHandle === null && (
              <p className="text-xs text-status-warning">Generate RSA wrap key pair first.</p>
            )}

            {wrapMode === 'pqc' && mlkemPrivHandle !== null && (
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div>
                  ML-KEM-{mlkemVariant} priv: h={mlkemPrivHandle}
                </div>
                {hybridCombiner === 'p256-mlkem' && ecPrivHandle !== null && (
                  <div>EC P-256 priv: h={ecPrivHandle}</div>
                )}
                {hybridCombiner === 'x25519-mlkem' && x25519KeyPair && (
                  <div>X25519: Web Crypto key pair ready</div>
                )}
              </div>
            )}
            {wrapMode === 'pqc' && mlkemPrivHandle === null && (
              <p className="text-xs text-status-warning">Generate hybrid key pair first.</p>
            )}

            <Button
              variant="outline"
              onClick={doUnwrap}
              disabled={!canUnwrap || anyLoading}
              className="w-full"
            >
              {loadingOp === 'unwrap' ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : (
                <Unlock size={14} className="mr-2" />
              )}
              Unwrap Key
            </Button>

            {unwrappedHandle !== null && (
              <HsmResultRow
                label="Unwrapped handle"
                value={`h=${unwrappedHandle} (registered)`}
                mono={false}
              />
            )}
          </div>

          {/* ── Session log ───────────────────────────────────────────────────── */}
          {sessionLog.length > 0 && (
            <div className="glass-panel p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Session Log ({sessionLog.length})
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={exportSessionCsv}
                >
                  <Download size={12} className="mr-1" /> Export CSV
                </Button>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {sessionLog.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span
                      className={`mt-0.5 shrink-0 ${e.op === 'wrap' ? 'text-primary' : 'text-status-success'}`}
                    >
                      {e.op === 'wrap' ? <Lock size={10} /> : <Unlock size={10} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {e.timestamp.slice(11, 19)}
                      </span>{' '}
                      <span className="font-medium">{e.mechanism}</span>{' '}
                      <span className="text-muted-foreground">
                        →{' '}
                        {hexSnippet(
                          new Uint8Array(
                            normalizeHex(e.wrappedHex)
                              .match(/.{1,2}/g)
                              ?.map((b) => parseInt(b, 16)) ?? []
                          )
                        )}
                      </span>
                      {e.status === 'error' && (
                        <span className="text-status-error ml-1">{e.error}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PKCS#11 reference ─────────────────────────────────────────────── */}
          <div className="glass-panel p-4 space-y-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              PKCS#11 v3.2 Call Sequence
            </p>
            <div className="space-y-1 text-xs font-mono text-muted-foreground">
              {wrapMode === 'direct' && directMech !== 'aes-gcm' && (
                <>
                  <div>
                    <span className="text-foreground">C_WrapKey</span>
                    {'(hSession, CKM_AES_KEY_WRAP[_KWP], hKEK, hTarget, pOut, &len) → '}
                    <span className="text-status-success">CKR_OK</span>
                  </div>
                  <div>
                    <span className="text-foreground">C_UnwrapKey</span>
                    {'(hSession, CKM_AES_KEY_WRAP[_KWP], hKEK, pWrapped, len, tpl, n, &hNew) → '}
                    <span className="text-status-success">CKR_OK</span>
                  </div>
                </>
              )}
              {wrapMode === 'direct' && directMech === 'aes-gcm' && (
                <>
                  <div>
                    <span className="text-foreground">C_WrapKey</span>
                    {'(hSession, CKM_AES_GCM+params, hKEK, hTarget, pOut, &len) → '}
                    <span className="text-status-success">CKR_OK</span>
                  </div>
                  <div>
                    <span className="text-foreground">C_UnwrapKey</span>
                    {'(hSession, CKM_AES_GCM+params, hKEK, pWrapped, len, tpl, n, &hNew) → '}
                    <span className="text-status-success">CKR_OK</span>
                  </div>
                </>
              )}
              {wrapMode === 'indirect' && (
                <>
                  <div>
                    <span className="text-foreground">C_GenerateKey</span>
                    {'(CKM_AES_KEY_GEN, AES-256) → hTempKEK'}
                  </div>
                  <div>
                    <span className="text-foreground">C_WrapKey</span>
                    {'(CKM_AES_KEY_WRAP_KWP, hTempKEK, hTarget) → wrappedTarget'}
                  </div>
                  <div>
                    <span className="text-foreground">C_WrapKey</span>
                    {'(CKM_RSA_PKCS_OAEP, hRSAPub, hTempKEK) → encryptedKEK'}
                  </div>
                </>
              )}
              {wrapMode === 'pqc' && hybridCombiner === 'p256-mlkem' && (
                <>
                  <div>
                    <span className="text-foreground">C_GenerateKeyPair</span>
                    {'(CKM_EC_KEY_PAIR_GEN, P-256) → {hEphPub, hEphPriv}'}
                  </div>
                  <div>
                    <span className="text-foreground">C_DeriveKey</span>
                    {'(CKM_ECDH1_DERIVE, hEphPriv, peerPub) → hClassicalSS'}
                  </div>
                  <div>
                    <span className="text-foreground">C_EncapsulateKey</span>
                    {'(CKM_ML_KEM, hRecipientPub) → {ct, hPqcSS}'}
                  </div>
                  <div>
                    <span className="text-foreground">C_CreateObject</span>
                    {'(GENERIC_SECRET, classical||pqc) → hCombined'}
                  </div>
                  <div>
                    <span className="text-foreground">C_DeriveKey</span>
                    {'(CKM_HKDF_DERIVE, hCombined, info="hybrid-wrap-kek") → kekBytes'}
                  </div>
                  <div>
                    <span className="text-foreground">C_WrapKey</span>
                    {'(CKM_AES_KEY_WRAP, hKEK, hTarget) → wrapped'}
                  </div>
                </>
              )}
              {wrapMode === 'pqc' && hybridCombiner === 'x25519-mlkem' && (
                <>
                  <div>
                    <span className="text-foreground">WebCrypto.generateKey</span>
                    {"('X25519') → ephKeyPair"}
                  </div>
                  <div>
                    <span className="text-foreground">WebCrypto.deriveBits</span>
                    {"('X25519', recipientPub) → classicalSS"}
                  </div>
                  <div>
                    <span className="text-foreground">C_EncapsulateKey</span>
                    {'(CKM_ML_KEM, hRecipientPub) → {ct, hPqcSS}'}
                  </div>
                  <div>
                    <span className="text-foreground">C_CreateObject</span>
                    {'(GENERIC_SECRET, classical||pqc) → hCombined'}
                  </div>
                  <div>
                    <span className="text-foreground">C_DeriveKey</span>
                    {'(CKM_HKDF_DERIVE, hCombined, info="hybrid-wrap-kek") → kekBytes'}
                  </div>
                  <div>
                    <span className="text-foreground">C_WrapKey</span>
                    {'(CKM_AES_KEY_WRAP, hKEK, hTarget) → wrapped'}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {isReady && (
        <Pkcs11LogPanel
          log={hsm.log}
          onClear={hsm.clearLog}
          title="PKCS#11 Call Log — Key Wrap"
          defaultOpen
        />
      )}

      {isReady && (
        <HsmKeyInspector
          keys={hsm.keys}
          moduleRef={hsm.moduleRef}
          hSessionRef={hsm.hSessionRef}
          onRemoveKey={hsm.removeKey}
        />
      )}
    </div>
  )
}

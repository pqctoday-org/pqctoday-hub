import { Button } from '../../../ui/button'
import { CheckCircle } from 'lucide-react'
import {
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
} from '../../../../wasm/softhsm'

// ── Static size hints ────────────────────────────────────────────────────────

export const KEM_SIZES: Record<512 | 768 | 1024, { pub: number; ct: number; ss: number }> = {
  512: { pub: 800, ct: 768, ss: 32 },
  768: { pub: 1184, ct: 1088, ss: 32 },
  1024: { pub: 1568, ct: 1568, ss: 32 },
}

export const DSA_SIZES: Record<44 | 65 | 87, { pub: number; sig: number }> = {
  44: { pub: 1312, sig: 2420 },
  65: { pub: 1952, sig: 3293 },
  87: { pub: 2592, sig: 4627 },
}

// Pre-hash options shared by ML-DSA and SLH-DSA (PKCS#11 v3.2 CKM_HASH_*_DSA_* variants)
export const PREHASH_OPTIONS = [
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
// sk = 4n bytes (SK.seed + SK.prf + PK.seed + PK.root, each n bytes; FIPS 205 §6)
export const SLH_DSA_PARAM_SET_OPTIONS = [
  { id: 'sha2-128s', label: 'SHA2-128s', ckp: CKP_SLH_DSA_SHA2_128S, pub: 32, sk: 64, sig: 7856 },
  {
    id: 'shake-128s',
    label: 'SHAKE-128s',
    ckp: CKP_SLH_DSA_SHAKE_128S,
    pub: 32,
    sk: 64,
    sig: 7856,
  },
  { id: 'sha2-128f', label: 'SHA2-128f', ckp: CKP_SLH_DSA_SHA2_128F, pub: 32, sk: 64, sig: 17088 },
  {
    id: 'shake-128f',
    label: 'SHAKE-128f',
    ckp: CKP_SLH_DSA_SHAKE_128F,
    pub: 32,
    sk: 64,
    sig: 17088,
  },
  { id: 'sha2-192s', label: 'SHA2-192s', ckp: CKP_SLH_DSA_SHA2_192S, pub: 48, sk: 96, sig: 16224 },
  {
    id: 'shake-192s',
    label: 'SHAKE-192s',
    ckp: CKP_SLH_DSA_SHAKE_192S,
    pub: 48,
    sk: 96,
    sig: 16224,
  },
  { id: 'sha2-192f', label: 'SHA2-192f', ckp: CKP_SLH_DSA_SHA2_192F, pub: 48, sk: 96, sig: 35664 },
  {
    id: 'shake-192f',
    label: 'SHAKE-192f',
    ckp: CKP_SLH_DSA_SHAKE_192F,
    pub: 48,
    sk: 96,
    sig: 35664,
  },
  { id: 'sha2-256s', label: 'SHA2-256s', ckp: CKP_SLH_DSA_SHA2_256S, pub: 64, sk: 128, sig: 29792 },
  {
    id: 'shake-256s',
    label: 'SHAKE-256s',
    ckp: CKP_SLH_DSA_SHAKE_256S,
    pub: 64,
    sk: 128,
    sig: 29792,
  },
  { id: 'sha2-256f', label: 'SHA2-256f', ckp: CKP_SLH_DSA_SHA2_256F, pub: 64, sk: 128, sig: 49856 },
  {
    id: 'shake-256f',
    label: 'SHAKE-256f',
    ckp: CKP_SLH_DSA_SHAKE_256F,
    pub: 64,
    sk: 128,
    sig: 49856,
  },
] as const

// ── Helpers ──────────────────────────────────────────────────────────────────

export const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

export const hexSnippet = (bytes: Uint8Array): string => {
  const h = toHex(bytes)
  return h.length > 40 ? `${h.slice(0, 20)}…${h.slice(-8)}` : h
}

export const arraysEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

export type Phase = 'idle' | 'initialized' | 'session_open'

// ── Variant selector ──────────────────────────────────────────────────────────

export interface VariantSelectorProps<T extends number> {
  options: T[]
  value: T
  onChange: (v: T) => void
  prefix: string
  disabled?: boolean
}

export const VariantSelector = <T extends number>({
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

export interface ResultRowProps {
  label: string
  bytes: Uint8Array | null
}
export const ResultRow = ({ label, bytes }: ResultRowProps) => {
  if (!bytes) return null
  return (
    <div className="flex items-center gap-3 text-xs font-mono bg-muted rounded-lg px-3 py-1.5">
      <span className="text-muted-foreground w-24 shrink-0">{label}</span>
      <span className="text-foreground flex-1 truncate">{hexSnippet(bytes)}</span>
      <span className="text-muted-foreground shrink-0">{bytes.length} B</span>
    </div>
  )
}

// ── Step badge ────────────────────────────────────────────────────────────────

export interface StepBadgeProps {
  done: boolean
  label: string
}
export const StepBadge = ({ done, label }: StepBadgeProps) => (
  <span className="flex items-center gap-1 text-xs">
    {done ? (
      <CheckCircle size={13} className="text-status-success" />
    ) : (
      <span className="w-3 h-3 rounded-full border border-border inline-block" />
    )}
    <span className={done ? 'text-status-success' : 'text-muted-foreground'}>{label}</span>
  </span>
)

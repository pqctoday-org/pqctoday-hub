// SPDX-License-Identifier: GPL-3.0-only
/**
 * hsmKeyAttrDisplay — shared PKCS#11 key-attribute display helpers.
 *
 * Single source for the attribute modal, boolean-attribute list, and key-size
 * estimator used by both HsmKeyInspector (portable, prop-driven) and
 * HsmKeyTable (Playground-specific, hardwired to useHsmContext). Consolidated
 * from three near-identical copies (a fourth, unused one lived in
 * wasm/softhsm/objects.ts) that had already drifted — HsmKeyInspector's local
 * CKK_NAMES was missing CKK_HSS/CKK_XMSS/CKK_XMSSMT, so HSS/XMSS keys rendered
 * unlabeled in every one of its 8+ consumers (SSH, VPN, 5G, PKI Workshop, HD
 * wallet, …) even though the Playground's own HsmKeyTable showed them
 * correctly. CKK_NAMES itself stays canonical in discoverHsmObjects.ts
 * (object-discovery's classification table); this module re-exports it
 * rather than holding a second copy.
 *
 * The modal shows every attribute both real PKCS#11 engines return (verified
 * live, not assumed) in four collapsible sections — Identity, Capabilities,
 * Policy & lifecycle, Key material — plus a collapsible Raw attributes table.
 * A field that came back null is rendered as one of three distinct states
 * (not present on this object / sensitive — withheld / read error) driven by
 * KeyAttributeSet.unavailable, never collapsed to an ambiguous "—" the way it
 * was before that field existed.
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AppWindow,
  ChevronDown,
  ChevronRight,
  Globe,
  Key as KeyIcon,
  ShieldCheck,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { HsmKey, HsmKeyPurpose } from '@/components/Playground/hsm/HsmContext'
import { CKK_NAMES, CKO_NAMES } from '@/components/Playground/keystore/discoverHsmObjects'
import {
  CKP_ML_KEM,
  CKP_ML_DSA,
  CKP_SLH_DSA,
  CKP_XMSS,
  CKP_XMSSMT,
  type ConstEntry,
} from '@/wasm/pkcs11Inspect'
import { bytesToHex } from '@/utils/dataInputUtils'
import {
  CKK_EC,
  CKK_EC_EDWARDS,
  CKK_EC_MONTGOMERY,
  CKK_RSA,
  ecCurveNameFromOID,
  SLH_DSA_PUB_BYTES,
  type AttrUnavailableReason,
  type KeyAttributeSet,
} from '@/wasm/softhsm'

export { CKK_NAMES, CKO_NAMES }

// CKA_PARAMETER_SET is only meaningful together with CKA_KEY_TYPE — the
// same PQC/pkcs11Inspect.ts tables the log decoder uses for this attribute,
// flattened to plain names for UlongRow. CKK_HSS isn't here: HSS's LMS/LMOTS
// shape travels in the mechanism parameter, not CKA_PARAMETER_SET.
const namesOf = (table: Record<number, ConstEntry>): Record<number, string> =>
  Object.fromEntries(Object.entries(table).map(([k, v]) => [k, v.name]))

const PARAMETER_SET_NAMES_BY_KEY_TYPE: Record<number, Record<number, string>> = {
  0x49: namesOf(CKP_ML_KEM), // CKK_ML_KEM
  0x4a: namesOf(CKP_ML_DSA), // CKK_ML_DSA
  0x4b: namesOf(CKP_SLH_DSA), // CKK_SLH_DSA
  0x47: namesOf(CKP_XMSS), // CKK_XMSS
  0x48: namesOf(CKP_XMSSMT), // CKK_XMSSMT
}

export const CKM_KEYGEN_NAMES: Record<number, string> = {
  0x00000000: 'CKM_RSA_PKCS_KEY_PAIR_GEN',
  0x0000000f: 'CKM_ML_KEM_KEY_PAIR_GEN',
  0x0000001c: 'CKM_ML_DSA_KEY_PAIR_GEN',
  0x0000002d: 'CKM_SLH_DSA_KEY_PAIR_GEN',
  0x00001040: 'CKM_EC_KEY_PAIR_GEN',
  0x00001055: 'CKM_EC_EDWARDS_KEY_PAIR_GEN',
  0x00001056: 'CKM_EC_MONTGOMERY_KEY_PAIR_GEN',
  0x00001080: 'CKM_AES_KEY_GEN',
  0x00000350: 'CKM_GENERIC_SECRET_KEY_GEN',
}

// ── PQC key material sizes (bytes) by CKA_KEY_TYPE + CKA_PARAMETER_SET ──────
// Source: FIPS 203/204, SLH-DSA spec. pub=CKO_PUBLIC_KEY, priv=CKO_PRIVATE_KEY.

const ML_KEM_SIZES: Record<number, { pub: number; priv: number }> = {
  0x1: { pub: 800, priv: 1632 }, // ML-KEM-512
  0x2: { pub: 1184, priv: 2400 }, // ML-KEM-768
  0x3: { pub: 1568, priv: 3168 }, // ML-KEM-1024
}

const ML_DSA_SIZES: Record<number, { pub: number; priv: number }> = {
  0x1: { pub: 1312, priv: 2560 }, // ML-DSA-44
  0x2: { pub: 1952, priv: 4032 }, // ML-DSA-65
  0x3: { pub: 2592, priv: 4896 }, // ML-DSA-87
}

// Curve → field size in bits, for RSA-style "N-bit key" display of EC/EdDSA/
// Montgomery keys.
const EC_CURVE_BITS: Record<string, number> = {
  'P-256': 256,
  'P-384': 384,
  'P-521': 521,
  secp256k1: 256,
  X25519: 256,
  X448: 448,
  Ed25519: 256,
  Ed448: 448,
}

/** Estimate key material size from PKCS#11 attributes. Returns null if unknown. */
export const estimateKeySize = (attrs: KeyAttributeSet): number | null => {
  // Symmetric: CKA_VALUE_LEN is authoritative
  if (attrs.ckValueLen !== null) return attrs.ckValueLen

  const cls = attrs.ckClass // 2=pub, 3=priv
  const ps = attrs.ckParameterSet
  const kt = attrs.ckKeyType

  // RSA: CKA_MODULUS_BITS on the public key; CKA_MODULUS byte length on the
  // private key (which doesn't carry CKA_MODULUS_BITS — see hsm_getKeyAttributes).
  if (kt === CKK_RSA) {
    if (attrs.ckModulusBits !== null) return Math.ceil(attrs.ckModulusBits / 8)
    if (attrs.ckModulus) return attrs.ckModulus.length
  }

  // EC / EdDSA / Montgomery: decode the curve from CKA_EC_PARAMS, independent
  // of class (present on both public and private per hsm_getKeyAttributes).
  if (kt === CKK_EC || kt === CKK_EC_EDWARDS || kt === CKK_EC_MONTGOMERY) {
    if (attrs.ckEcParams) {
      const curve = ecCurveNameFromOID(attrs.ckEcParams)
      const bits = curve ? EC_CURVE_BITS[curve] : undefined
      if (bits) return Math.ceil(bits / 8)
    }
  }

  if (ps === null || cls === null) return null

  const field = cls === 0x02 ? 'pub' : cls === 0x03 ? 'priv' : null
  if (!field) return null

  // ML-KEM (CKK=0x49)
  if (kt === 0x49 && ps in ML_KEM_SIZES) return ML_KEM_SIZES[ps]?.[field] ?? null
  // ML-DSA (CKK=0x4a)
  if (kt === 0x4a && ps in ML_DSA_SIZES) return ML_DSA_SIZES[ps]?.[field] ?? null
  // SLH-DSA (CKK=0x4b): private key = 2 × public key (seed pair)
  if (kt === 0x4b && ps in SLH_DSA_PUB_BYTES) {
    const pubSize = SLH_DSA_PUB_BYTES[ps] ?? null
    if (pubSize === null) return null
    return field === 'pub' ? pubSize : pubSize * 2
  }

  return null
}

export const fmtUlong = (v: number | null, names: Record<number, string>): string => {
  if (v === null) return '—'
  return names[v]
    ? `${names[v]} (0x${v.toString(16).padStart(2, '0')})`
    : `0x${v.toString(16).padStart(8, '0')}`
}

export const BoolCell = ({ value }: { value: boolean | null }) => {
  if (value === null) return <span className="text-muted-foreground text-xs">—</span>
  return value ? (
    <span className="text-status-success text-xs font-medium">CK_TRUE</span>
  ) : (
    <span className="text-muted-foreground text-xs">CK_FALSE</span>
  )
}

export const BOOL_ATTRS: Array<{ label: string; key: keyof KeyAttributeSet }> = [
  { label: 'CKA_TOKEN', key: 'ckToken' },
  { label: 'CKA_PRIVATE', key: 'ckPrivate' },
  { label: 'CKA_LOCAL', key: 'ckLocal' },
  { label: 'CKA_SENSITIVE', key: 'ckSensitive' },
  { label: 'CKA_ALWAYS_SENSITIVE', key: 'ckAlwaysSensitive' },
  { label: 'CKA_EXTRACTABLE', key: 'ckExtractable' },
  { label: 'CKA_NEVER_EXTRACTABLE', key: 'ckNeverExtractable' },
  { label: 'CKA_ENCRYPT', key: 'ckEncrypt' },
  { label: 'CKA_DECRYPT', key: 'ckDecrypt' },
  { label: 'CKA_SIGN', key: 'ckSign' },
  { label: 'CKA_VERIFY', key: 'ckVerify' },
  { label: 'CKA_WRAP', key: 'ckWrap' },
  { label: 'CKA_UNWRAP', key: 'ckUnwrap' },
  { label: 'CKA_DERIVE', key: 'ckDerive' },
  { label: 'CKA_ENCAPSULATE', key: 'ckEncapsulate' },
  { label: 'CKA_DECAPSULATE', key: 'ckDecapsulate' },
]

// ── Purpose badge ─────────────────────────────────────────────────────────────

const PURPOSE_CONFIG: Record<
  HsmKeyPurpose,
  { label: string; className: string; icon: React.ReactNode }
> = {
  attestation: {
    label: 'Attestation Key (AK)',
    className: 'text-status-warning bg-status-warning/10',
    icon: <ShieldCheck size={10} />,
  },
  tls: {
    label: 'TLS / KEM Key',
    className: 'text-status-info bg-status-info/10',
    icon: <Globe size={10} />,
  },
  kek: {
    label: 'Wrapping Key (KEK)',
    className: 'text-status-success bg-status-success/10',
    icon: <KeyIcon size={10} />,
  },
  application: {
    label: 'Application Key',
    className: 'text-primary bg-primary/10',
    icon: <AppWindow size={10} />,
  },
  general: {
    label: '',
    className: '',
    icon: null,
  },
}

export const PurposeBadge = ({ purpose }: { purpose?: HsmKeyPurpose }) => {
  if (!purpose || purpose === 'general')
    return <span className="text-muted-foreground text-xs">—</span>
  const cfg = PURPOSE_CONFIG[purpose]
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${cfg.className}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

// ── Tri-state attribute rendering ─────────────────────────────────────────────
// Distinguishes: a real value; a field never probed at all (client-side class
// gating — e.g. CKA_SENSITIVE on a public key); and the three probed-and-failed
// outcomes KeyAttributeSet.unavailable classifies (absent / sensitive / error).

type AttrKind = 'value' | 'not-probed' | AttrUnavailableReason

const UNAVAILABLE_TEXT: Record<Exclude<AttrKind, 'value'>, string> = {
  'not-probed': '—',
  absent: 'not present on this object',
  sensitive: 'sensitive — withheld by the token',
  error: 'read error',
}

const attrKind = (
  attrs: KeyAttributeSet,
  key: keyof KeyAttributeSet,
  hasValue: boolean
): AttrKind => {
  if (hasValue) return 'value'
  const reason = attrs.unavailable?.[key]
  return reason ?? 'not-probed'
}

const StatusText = ({ kind }: { kind: Exclude<AttrKind, 'value'> }) => (
  <span
    className={
      kind === 'error' ? 'text-xs text-status-error' : 'text-xs text-muted-foreground italic'
    }
  >
    {UNAVAILABLE_TEXT[kind]}
  </span>
)

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <tr className="border-b border-border/40 align-top">
    <td className="py-1.5 pr-4 text-muted-foreground w-44 shrink-0">{label}</td>
    <td className="py-1.5 text-foreground break-all">{children}</td>
  </tr>
)

const UlongRow = ({
  label,
  attrs,
  field,
  names,
}: {
  label: string
  attrs: KeyAttributeSet
  field: keyof KeyAttributeSet
  names?: Record<number, string>
}) => {
  const v = attrs[field] as number | null
  const kind = attrKind(attrs, field, v !== null)
  return (
    <Row label={label}>
      {kind === 'value' ? (
        names ? (
          fmtUlong(v, names)
        ) : (
          `0x${(v as number).toString(16).padStart(8, '0')}`
        )
      ) : (
        <StatusText kind={kind} />
      )}
    </Row>
  )
}

const BoolRow = ({
  label,
  attrs,
  field,
}: {
  label: string
  attrs: KeyAttributeSet
  field: keyof KeyAttributeSet
}) => {
  const v = attrs[field] as boolean | null
  const kind = attrKind(attrs, field, v !== null)
  return (
    <Row label={label}>
      {kind === 'value' ? <BoolCell value={v} /> : <StatusText kind={kind} />}
    </Row>
  )
}

const StrRow = ({
  label,
  attrs,
  field,
}: {
  label: string
  attrs: KeyAttributeSet
  field: keyof KeyAttributeSet
}) => {
  const v = attrs[field] as string | null
  const kind = attrKind(attrs, field, v !== null)
  if (kind !== 'value') return <Row label={label}>{<StatusText kind={kind} />}</Row>
  return (
    <Row label={label}>
      {v!.length > 0 ? v : <span className="text-muted-foreground italic">(empty)</span>}
    </Row>
  )
}

/** Byte-array attribute row: decoded value by default, raw hex behind a toggle. */
const BytesRow = ({
  label,
  attrs,
  field,
  decode,
}: {
  label: string
  attrs: KeyAttributeSet
  field: keyof KeyAttributeSet
  decode?: (bytes: Uint8Array, attrs: KeyAttributeSet) => string
}) => {
  const [showHex, setShowHex] = useState(false)
  const v = attrs[field] as Uint8Array | null
  const kind = attrKind(attrs, field, v !== null)
  if (kind !== 'value') return <Row label={label}>{<StatusText kind={kind} />}</Row>
  const bytes = v as Uint8Array
  if (bytes.length === 0) {
    return (
      <Row label={label}>
        <span className="text-muted-foreground italic">(empty)</span>
      </Row>
    )
  }
  const decoded = decode ? decode(bytes, attrs) : `${bytes.length} bytes`
  return (
    <Row label={label}>
      <div className="flex items-center gap-2 flex-wrap">
        <span>{decoded}</span>
        <Button
          variant="ghost"
          onClick={() => setShowHex((s) => !s)}
          className="h-auto p-0 text-[10px] text-primary hover:underline shrink-0"
        >
          {showHex ? 'hide hex' : 'hex'}
        </Button>
      </div>
      {showHex && (
        <div className="mt-1 text-[10px] text-muted-foreground break-all">{bytesToHex(bytes)}</div>
      )}
    </Row>
  )
}

// ── Byte-array decoders (D-2: decoded by default, raw hex behind a toggle) ──

const decodeEcParams = (bytes: Uint8Array): string => {
  const curve = ecCurveNameFromOID(bytes)
  return curve ? curve : `unrecognised curve OID (${bytes.length} bytes)`
}

/** DER OCTET STRING wrapping an uncompressed/compressed SEC1 point:
 *  0x04 [len | 0x81 len2] <point-form-byte> … Best-effort; degrades to a
 *  byte count if the encoding doesn't match this common shape. */
const decodeEcPoint = (bytes: Uint8Array): string => {
  if (bytes[0] !== 0x04) return `${bytes.length} bytes`
  const len = bytes[1]
  if (len === undefined) return `${bytes.length} bytes`
  const i = len & 0x80 ? 2 + (len & 0x7f) : 2
  const form = bytes[i]
  const formName =
    form === 0x04
      ? 'uncompressed point'
      : form === 0x02 || form === 0x03
        ? 'compressed point'
        : 'point'
  return `${formName}, ${bytes.length} bytes`
}

const decodeModulus = (bytes: Uint8Array): string =>
  `${bytes.length * 8}-bit modulus (${bytes.length} B)`

const decodePublicExponent = (bytes: Uint8Array): string => {
  if (bytes.length > 8) return `${bytes.length}-byte exponent`
  let v = 0n
  for (const b of bytes) v = (v << 8n) | BigInt(b)
  return `${v.toString()} (0x${v.toString(16)})`
}

const decodePublicKeyInfo = (bytes: Uint8Array, attrs: KeyAttributeSet): string => {
  const kt =
    attrs.ckKeyType !== null
      ? (CKK_NAMES[attrs.ckKeyType] ?? 'unknown algorithm')
      : 'unknown algorithm'
  return `SPKI for ${kt}, ${bytes.length} bytes`
}

// ── Collapsible section ────────────────────────────────────────────────────

const CollapsibleSection = ({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="space-y-1">
      <Button
        variant="ghost"
        onClick={() => setOpen((o) => !o)}
        className="h-auto p-0 flex items-center gap-1.5 w-full justify-start text-left text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
        aria-expanded={open}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {title}
      </Button>
      {open && <div className="overflow-x-auto">{children}</div>}
    </div>
  )
}

// ── Raw attributes table ──────────────────────────────────────────────────
// Every field hsm_getKeyAttributes can populate, one row each, compact —
// the fallback view for anything the grouped sections above don't surface.

const RAW_FIELDS: Array<{
  label: string
  key: keyof KeyAttributeSet
  kind: 'bool' | 'ulong' | 'bytes' | 'str'
}> = [
  { label: 'CKA_UNIQUE_ID', key: 'ckUniqueId', kind: 'str' },
  { label: 'CKA_LABEL', key: 'ckLabel', kind: 'str' },
  { label: 'CKA_CLASS', key: 'ckClass', kind: 'ulong' },
  { label: 'CKA_KEY_TYPE', key: 'ckKeyType', kind: 'ulong' },
  { label: 'CKA_ID', key: 'ckId', kind: 'bytes' },
  { label: 'CKA_PARAMETER_SET', key: 'ckParameterSet', kind: 'ulong' },
  { label: 'CKA_KEY_GEN_MECHANISM', key: 'ckKeyGenMechanism', kind: 'ulong' },
  { label: 'CKA_MODIFIABLE', key: 'ckModifiable', kind: 'bool' },
  { label: 'CKA_COPYABLE', key: 'ckCopyable', kind: 'bool' },
  { label: 'CKA_DESTROYABLE', key: 'ckDestroyable', kind: 'bool' },
  { label: 'CKA_TOKEN', key: 'ckToken', kind: 'bool' },
  { label: 'CKA_PRIVATE', key: 'ckPrivate', kind: 'bool' },
  { label: 'CKA_LOCAL', key: 'ckLocal', kind: 'bool' },
  { label: 'CKA_DERIVE', key: 'ckDerive', kind: 'bool' },
  { label: 'CKA_SENSITIVE', key: 'ckSensitive', kind: 'bool' },
  { label: 'CKA_EXTRACTABLE', key: 'ckExtractable', kind: 'bool' },
  { label: 'CKA_ALWAYS_SENSITIVE', key: 'ckAlwaysSensitive', kind: 'bool' },
  { label: 'CKA_NEVER_EXTRACTABLE', key: 'ckNeverExtractable', kind: 'bool' },
  { label: 'CKA_ENCRYPT', key: 'ckEncrypt', kind: 'bool' },
  { label: 'CKA_DECRYPT', key: 'ckDecrypt', kind: 'bool' },
  { label: 'CKA_SIGN', key: 'ckSign', kind: 'bool' },
  { label: 'CKA_VERIFY', key: 'ckVerify', kind: 'bool' },
  { label: 'CKA_WRAP', key: 'ckWrap', kind: 'bool' },
  { label: 'CKA_UNWRAP', key: 'ckUnwrap', kind: 'bool' },
  { label: 'CKA_ENCAPSULATE', key: 'ckEncapsulate', kind: 'bool' },
  { label: 'CKA_DECAPSULATE', key: 'ckDecapsulate', kind: 'bool' },
  { label: 'CKA_TRUSTED', key: 'ckTrusted', kind: 'bool' },
  { label: 'CKA_WRAP_WITH_TRUSTED', key: 'ckWrapWithTrusted', kind: 'bool' },
  { label: 'CKA_ALWAYS_AUTHENTICATE', key: 'ckAlwaysAuthenticate', kind: 'bool' },
  { label: 'CKA_START_DATE', key: 'ckStartDate', kind: 'bytes' },
  { label: 'CKA_END_DATE', key: 'ckEndDate', kind: 'bytes' },
  { label: 'CKA_ALLOWED_MECHANISMS', key: 'ckAllowedMechanisms', kind: 'bytes' },
  { label: 'CKA_VALUE_LEN', key: 'ckValueLen', kind: 'ulong' },
  { label: 'CKA_CHECK_VALUE', key: 'ckCheckValue', kind: 'bytes' },
  { label: 'CKA_HSS_KEYS_REMAINING', key: 'ckHssKeysRemaining', kind: 'ulong' },
  { label: 'CKA_XMSS_KEYS_REMAINING', key: 'ckXmssKeysRemaining', kind: 'ulong' },
  { label: 'CKA_EC_PARAMS', key: 'ckEcParams', kind: 'bytes' },
  { label: 'CKA_EC_POINT', key: 'ckEcPoint', kind: 'bytes' },
  { label: 'CKA_MODULUS_BITS', key: 'ckModulusBits', kind: 'ulong' },
  { label: 'CKA_MODULUS', key: 'ckModulus', kind: 'bytes' },
  { label: 'CKA_PUBLIC_EXPONENT', key: 'ckPublicExponent', kind: 'bytes' },
  { label: 'CKA_PUBLIC_KEY_INFO', key: 'ckPublicKeyInfo', kind: 'bytes' },
]

const RawAttrRow = ({
  field,
  attrs,
}: {
  field: (typeof RAW_FIELDS)[number]
  attrs: KeyAttributeSet
}) => {
  const { label, key, kind } = field
  const raw = attrs[key]
  const hasValue = raw !== null && raw !== undefined
  const stateKind = attrKind(attrs, key, hasValue)
  if (stateKind !== 'value') return <Row label={label}>{<StatusText kind={stateKind} />}</Row>
  switch (kind) {
    case 'bool':
      return <Row label={label}>{(raw as boolean) ? 'CK_TRUE' : 'CK_FALSE'}</Row>
    case 'ulong':
      return <Row label={label}>{`0x${(raw as number).toString(16).padStart(8, '0')}`}</Row>
    case 'str':
      return <Row label={label}>{(raw as string).length ? (raw as string) : '(empty)'}</Row>
    case 'bytes': {
      const bytes = raw as Uint8Array
      return <Row label={label}>{bytes.length ? bytesToHex(bytes) : '(empty)'}</Row>
    }
  }
}

// ── Key attribute inspect modal ───────────────────────────────────────────────

export const KeyAttrModal = ({
  hsmKey,
  attrs,
  onClose,
}: {
  hsmKey: HsmKey
  attrs: KeyAttributeSet
  onClose: () => void
}) => {
  const isEcFamily =
    attrs.ckKeyType === CKK_EC ||
    attrs.ckKeyType === CKK_EC_EDWARDS ||
    attrs.ckKeyType === CKK_EC_MONTGOMERY
  const isRsa = attrs.ckKeyType === CKK_RSA
  const hasKeyMaterial = isEcFamily || isRsa || attrs.ckPublicKeyInfo !== null

  return createPortal(
    <div
      role="presentation"
      className="fixed inset-0 embed-backdrop bg-black/60 flex items-center justify-center z-[100] p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div className="glass-panel w-full max-w-lg max-h-[85vh] overflow-y-auto p-5 space-y-4 shadow-xl z-[101] bg-background border border-border">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-sm">{hsmKey.label}</h3>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              handle = {hsmKey.handle}
            </p>
            {hsmKey.purpose && hsmKey.purpose !== 'general' && (
              <div className="mt-1">
                <PurposeBadge purpose={hsmKey.purpose} />
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={onClose}>
            <X size={14} />
          </Button>
        </div>

        {/* Diagnostic: surface when C_GetAttributeValue returned no usable
            data. ckClass is the most fundamental attribute — every key has it,
            so if it's null the underlying read failed entirely (stale session,
            destroyed object, terminated worker). */}
        {attrs.ckClass === null && attrs.ckKeyType === null && (
          <div className="rounded border border-status-warning/30 bg-status-warning/10 px-3 py-2 text-xs text-status-warning">
            Could not read PKCS#11 attributes for this key. The session or object handle may have
            expired (e.g., the strongSwan worker terminated, or the daemon closed its session). The
            handle and label are still shown above for reference.
          </div>
        )}

        {/* Identity */}
        <CollapsibleSection title="Identity" defaultOpen>
          <table className="w-full table-fixed text-xs font-mono border-collapse">
            <tbody>
              <StrRow label="CKA_UNIQUE_ID" attrs={attrs} field="ckUniqueId" />
              <StrRow label="CKA_LABEL" attrs={attrs} field="ckLabel" />
              <UlongRow label="CKA_CLASS" attrs={attrs} field="ckClass" names={CKO_NAMES} />
              <UlongRow label="CKA_KEY_TYPE" attrs={attrs} field="ckKeyType" names={CKK_NAMES} />
              <BytesRow label="CKA_ID" attrs={attrs} field="ckId" />
              {attrs.ckKeyGenMechanism !== null && (
                <UlongRow
                  label="CKA_KEY_GEN_MECHANISM"
                  attrs={attrs}
                  field="ckKeyGenMechanism"
                  names={CKM_KEYGEN_NAMES}
                />
              )}
              {attrs.ckParameterSet !== null && (
                <UlongRow
                  label="CKA_PARAMETER_SET"
                  attrs={attrs}
                  field="ckParameterSet"
                  names={
                    attrs.ckKeyType !== null
                      ? PARAMETER_SET_NAMES_BY_KEY_TYPE[attrs.ckKeyType]
                      : undefined
                  }
                />
              )}
              {attrs.ckValueLen !== null && (
                <Row label="CKA_VALUE_LEN">{attrs.ckValueLen} bytes</Row>
              )}
              {attrs.ckCheckValue && (
                <Row label="CKA_CHECK_VALUE (KCV)">
                  <span className="text-status-success font-bold">
                    {Array.from(attrs.ckCheckValue.slice(0, 3))
                      .map((b) => b.toString(16).padStart(2, '0'))
                      .join('')
                      .toUpperCase()}
                  </span>
                </Row>
              )}
              {attrs.ckHssKeysRemaining !== null && (
                <Row label="CKA_HSS_KEYS_REMAINING">
                  <span className="tabular-nums">
                    {attrs.ckHssKeysRemaining.toLocaleString()} remaining
                  </span>
                </Row>
              )}
              {attrs.ckXmssKeysRemaining !== null && (
                <Row label="CKA_XMSS_KEYS_REMAINING">
                  <span className="tabular-nums">
                    {attrs.ckXmssKeysRemaining.toLocaleString()} remaining
                  </span>
                </Row>
              )}
            </tbody>
          </table>
        </CollapsibleSection>

        {/* Capabilities */}
        <CollapsibleSection title="Capabilities" defaultOpen>
          <table className="w-full text-xs font-mono border-collapse">
            <tbody>
              {BOOL_ATTRS.map(({ label, key }) => (
                <BoolRow key={key} label={label} attrs={attrs} field={key} />
              ))}
            </tbody>
          </table>
        </CollapsibleSection>

        {/* Policy & lifecycle */}
        <CollapsibleSection title="Policy & lifecycle" defaultOpen={false}>
          <table className="w-full table-fixed text-xs font-mono border-collapse">
            <tbody>
              <BoolRow label="CKA_MODIFIABLE" attrs={attrs} field="ckModifiable" />
              <BoolRow label="CKA_COPYABLE" attrs={attrs} field="ckCopyable" />
              <BoolRow label="CKA_DESTROYABLE" attrs={attrs} field="ckDestroyable" />
              <BoolRow label="CKA_TRUSTED" attrs={attrs} field="ckTrusted" />
              <BoolRow label="CKA_WRAP_WITH_TRUSTED" attrs={attrs} field="ckWrapWithTrusted" />
              <BoolRow label="CKA_ALWAYS_AUTHENTICATE" attrs={attrs} field="ckAlwaysAuthenticate" />
              <BytesRow
                label="CKA_ALLOWED_MECHANISMS"
                attrs={attrs}
                field="ckAllowedMechanisms"
                decode={(b) => `${b.length / 4} mechanism(s) pinned`}
              />
              <BytesRow
                label="CKA_START_DATE"
                attrs={attrs}
                field="ckStartDate"
                decode={(b) =>
                  b.length === 8
                    ? `${String.fromCharCode(...b.slice(0, 4))}-${String.fromCharCode(...b.slice(4, 6))}-${String.fromCharCode(...b.slice(6, 8))}`
                    : `${b.length} bytes`
                }
              />
              <BytesRow
                label="CKA_END_DATE"
                attrs={attrs}
                field="ckEndDate"
                decode={(b) =>
                  b.length === 8
                    ? `${String.fromCharCode(...b.slice(0, 4))}-${String.fromCharCode(...b.slice(4, 6))}-${String.fromCharCode(...b.slice(6, 8))}`
                    : `${b.length} bytes`
                }
              />
            </tbody>
          </table>
        </CollapsibleSection>

        {/* Key material — EC/EdDSA/Montgomery curve, RSA modulus/exponent, SPKI */}
        {hasKeyMaterial && (
          <CollapsibleSection title="Key material" defaultOpen>
            <table className="w-full table-fixed text-xs font-mono border-collapse">
              <tbody>
                {isEcFamily && (
                  <>
                    <BytesRow
                      label="CKA_EC_PARAMS"
                      attrs={attrs}
                      field="ckEcParams"
                      decode={decodeEcParams}
                    />
                    <BytesRow
                      label="CKA_EC_POINT"
                      attrs={attrs}
                      field="ckEcPoint"
                      decode={decodeEcPoint}
                    />
                  </>
                )}
                {isRsa && (
                  <>
                    <UlongRow label="CKA_MODULUS_BITS" attrs={attrs} field="ckModulusBits" />
                    <BytesRow
                      label="CKA_MODULUS"
                      attrs={attrs}
                      field="ckModulus"
                      decode={decodeModulus}
                    />
                    <BytesRow
                      label="CKA_PUBLIC_EXPONENT"
                      attrs={attrs}
                      field="ckPublicExponent"
                      decode={decodePublicExponent}
                    />
                  </>
                )}
                <BytesRow
                  label="CKA_PUBLIC_KEY_INFO"
                  attrs={attrs}
                  field="ckPublicKeyInfo"
                  decode={decodePublicKeyInfo}
                />
              </tbody>
            </table>
          </CollapsibleSection>
        )}

        {/* Raw attributes — every field, compact, collapsed by default */}
        <CollapsibleSection title="Raw attributes" defaultOpen={false}>
          <table className="w-full table-fixed text-xs font-mono border-collapse">
            <tbody>
              {RAW_FIELDS.map((f) => (
                <RawAttrRow key={f.key} field={f} attrs={attrs} />
              ))}
            </tbody>
          </table>
        </CollapsibleSection>

        <p className="text-xs text-muted-foreground">
          Session object · read via C_GetAttributeValue
        </p>
      </div>
    </div>,
    document.body
  )
}

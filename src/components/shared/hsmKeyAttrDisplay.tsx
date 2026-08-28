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
 */
import { createPortal } from 'react-dom'
import { AppWindow, Globe, Key as KeyIcon, ShieldCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { HsmKey, HsmKeyPurpose } from '@/components/Playground/hsm/HsmContext'
import { CKK_NAMES } from '@/components/Playground/keystore/discoverHsmObjects'
import { SLH_DSA_PUB_BYTES, type KeyAttributeSet } from '@/wasm/softhsm'

export { CKK_NAMES }

export const CKO_NAMES: Record<number, string> = {
  0x00: 'CKO_DATA',
  0x01: 'CKO_CERTIFICATE',
  0x02: 'CKO_PUBLIC_KEY',
  0x03: 'CKO_PRIVATE_KEY',
  0x04: 'CKO_SECRET_KEY',
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

/** Estimate key material size from PKCS#11 attributes. Returns null if unknown. */
export const estimateKeySize = (attrs: KeyAttributeSet): number | null => {
  // Symmetric: CKA_VALUE_LEN is authoritative
  if (attrs.ckValueLen !== null) return attrs.ckValueLen

  const cls = attrs.ckClass // 2=pub, 3=priv
  const ps = attrs.ckParameterSet
  const kt = attrs.ckKeyType

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
  return createPortal(
    <div
      role="presentation"
      className="fixed inset-0 embed-backdrop bg-black/60 flex items-center justify-center z-[100] p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div className="glass-panel w-full max-w-md p-5 space-y-4 shadow-xl z-[101] bg-background border border-border">
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

        {/* Identity attributes */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Identity
          </p>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-xs font-mono border-collapse">
              <tbody>
                <tr className="border-b border-border/40">
                  <td className="py-1.5 pr-4 text-muted-foreground w-44">CKA_CLASS</td>
                  <td className="py-1.5 text-foreground break-all">
                    {fmtUlong(attrs.ckClass, CKO_NAMES)}
                  </td>
                </tr>
                <tr className="border-b border-border/40">
                  <td className="py-1.5 pr-4 text-muted-foreground">CKA_KEY_TYPE</td>
                  <td className="py-1.5 text-foreground break-all">
                    {fmtUlong(attrs.ckKeyType, CKK_NAMES)}
                  </td>
                </tr>
                {attrs.ckKeyGenMechanism !== null && (
                  <tr className="border-b border-border/40">
                    <td className="py-1.5 pr-4 text-muted-foreground">CKA_KEY_GEN_MECHANISM</td>
                    <td className="py-1.5 text-foreground break-all">
                      {fmtUlong(attrs.ckKeyGenMechanism, CKM_KEYGEN_NAMES)}
                    </td>
                  </tr>
                )}
                {attrs.ckParameterSet !== null && (
                  <tr className="border-b border-border/40">
                    <td className="py-1.5 pr-4 text-muted-foreground">CKA_PARAMETER_SET</td>
                    <td className="py-1.5 text-foreground break-all">
                      {'0x' + attrs.ckParameterSet.toString(16).padStart(2, '0')}
                    </td>
                  </tr>
                )}
                {attrs.ckValueLen !== null && (
                  <tr className="border-b border-border/40">
                    <td className="py-1.5 pr-4 text-muted-foreground">CKA_VALUE_LEN</td>
                    <td className="py-1.5 text-foreground">{attrs.ckValueLen} bytes</td>
                  </tr>
                )}
                {attrs.ckCheckValue && (
                  <tr className="border-b border-border/40">
                    <td className="py-1.5 pr-4 text-muted-foreground">CKA_CHECK_VALUE (KCV)</td>
                    <td className="py-1.5 text-status-success font-bold font-mono break-all">
                      {Array.from(attrs.ckCheckValue.slice(0, 3))
                        .map((b) => b.toString(16).padStart(2, '0'))
                        .join('')
                        .toUpperCase()}
                    </td>
                  </tr>
                )}
                {attrs.ckHssKeysRemaining !== null && (
                  <tr className="border-b border-border/40">
                    <td className="py-1.5 pr-4 text-muted-foreground">CKA_HSS_KEYS_REMAINING</td>
                    <td className="py-1.5 text-foreground tabular-nums">
                      {attrs.ckHssKeysRemaining.toLocaleString()} remaining
                    </td>
                  </tr>
                )}
                {attrs.ckXmssKeysRemaining !== null && (
                  <tr className="border-b border-border/40">
                    <td className="py-1.5 pr-4 text-muted-foreground">CKA_XMSS_KEYS_REMAINING</td>
                    <td className="py-1.5 text-foreground tabular-nums">
                      {attrs.ckXmssKeysRemaining.toLocaleString()} remaining
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Boolean capabilities */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Capabilities
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border-collapse">
              <tbody>
                {BOOL_ATTRS.map(({ label, key }) => (
                  <tr key={key} className="border-b border-border/40">
                    <td className="py-1 pr-4 text-muted-foreground w-40">{label}</td>
                    <td className="py-1">
                      <BoolCell value={attrs[key] as boolean | null} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Session object · read via C_GetAttributeValue
        </p>
      </div>
    </div>,
    document.body
  )
}

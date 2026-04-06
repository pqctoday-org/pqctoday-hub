// SPDX-License-Identifier: GPL-3.0-only
/**
 * HsmKeyInspector — portable PKCS#11 key table with attribute inspection.
 *
 * Unlike HsmKeyTable (which is hardwired to useHsmContext for the Playground),
 * this component accepts keys and module refs as props so it can be embedded
 * in any module that uses the useHSM hook (e.g. TEEHSMTrustedChannel).
 */
import { useState, useMemo, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { AppWindow, Eye, Globe, Key as KeyIcon, Lock, ShieldCheck, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type {
  HsmFamily,
  HsmKey,
  HsmKeyPurpose,
  HsmKeyRole,
} from '@/components/Playground/hsm/HsmContext'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import {
  hsm_destroyObject,
  hsm_getKeyAttributes,
  SLH_DSA_PUB_BYTES,
  type KeyAttributeSet,
} from '@/wasm/softhsm'
import { formatBytes } from '@/components/Playground/keystore/keySizeUtils'

// ── Attribute display helpers ─────────────────────────────────────────────────

const CKO_NAMES: Record<number, string> = {
  0x00: 'CKO_DATA',
  0x01: 'CKO_CERTIFICATE',
  0x02: 'CKO_PUBLIC_KEY',
  0x03: 'CKO_PRIVATE_KEY',
  0x04: 'CKO_SECRET_KEY',
}

const CKK_NAMES: Record<number, string> = {
  0x00: 'CKK_RSA',
  0x03: 'CKK_EC',
  0x10: 'CKK_GENERIC_SECRET',
  0x1f: 'CKK_AES',
  0x40: 'CKK_EC_EDWARDS',
  0x41: 'CKK_EC_MONTGOMERY',
  0x49: 'CKK_ML_KEM',
  0x4a: 'CKK_ML_DSA',
  0x4b: 'CKK_SLH_DSA',
}

const CKM_KEYGEN_NAMES: Record<number, string> = {
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

const ML_KEM_SIZES: Record<number, { pub: number; priv: number }> = {
  0x1: { pub: 800, priv: 1632 },
  0x2: { pub: 1184, priv: 2400 },
  0x3: { pub: 1568, priv: 3168 },
}

const ML_DSA_SIZES: Record<number, { pub: number; priv: number }> = {
  0x1: { pub: 1312, priv: 2560 },
  0x2: { pub: 1952, priv: 4032 },
  0x3: { pub: 2592, priv: 4896 },
}

const estimateKeySize = (attrs: KeyAttributeSet): number | null => {
  if (attrs.ckValueLen !== null) return attrs.ckValueLen
  const cls = attrs.ckClass
  const ps = attrs.ckParameterSet
  const kt = attrs.ckKeyType
  if (ps === null || cls === null) return null
  const field = cls === 0x02 ? 'pub' : cls === 0x03 ? 'priv' : null
  if (!field) return null
  if (kt === 0x49 && ps in ML_KEM_SIZES) return ML_KEM_SIZES[ps]?.[field] ?? null
  if (kt === 0x4a && ps in ML_DSA_SIZES) return ML_DSA_SIZES[ps]?.[field] ?? null
  if (kt === 0x4b && ps in SLH_DSA_PUB_BYTES) {
    const pubSize = SLH_DSA_PUB_BYTES[ps] ?? null
    if (pubSize === null) return null
    return field === 'pub' ? pubSize : pubSize * 2
  }
  return null
}

const fmtUlong = (v: number | null, names: Record<number, string>): string => {
  if (v === null) return '—'
  return names[v]
    ? `${names[v]} (0x${v.toString(16).padStart(2, '0')})`
    : `0x${v.toString(16).padStart(8, '0')}`
}

const BoolCell = ({ value }: { value: boolean | null }) => {
  if (value === null) return <span className="text-muted-foreground text-xs">—</span>
  return value ? (
    <span className="text-status-success text-xs font-medium">CK_TRUE</span>
  ) : (
    <span className="text-muted-foreground text-xs">CK_FALSE</span>
  )
}

const BOOL_ATTRS: Array<{ label: string; key: keyof KeyAttributeSet }> = [
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

const PurposeBadge = ({ purpose }: { purpose?: HsmKeyPurpose }) => {
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

const KeyAttrModal = ({
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
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4"
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

        {/* Identity attributes */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Identity
          </p>
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

        {/* Boolean capabilities */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Capabilities
          </p>
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

        <p className="text-xs text-muted-foreground">
          Session object · read via C_GetAttributeValue
        </p>
      </div>
    </div>,
    document.body
  )
}

// ── Role styling ──────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<HsmKeyRole, string> = {
  public: 'Public',
  private: 'Private',
  secret: 'Secret',
}

const ROLE_COLORS: Record<HsmKeyRole, string> = {
  public: 'text-status-success',
  private: 'text-status-warning',
  secret: 'text-status-info',
}

// ── Auto-detect family/role from PKCS#11 attributes ──────────────────────────

const CKK_TO_FAMILY: Record<number, HsmFamily> = {
  0x00: 'rsa',
  0x03: 'ecdsa',
  0x10: 'hmac',
  0x1f: 'aes',
  0x40: 'eddsa',
  0x49: 'ml-kem',
  0x4a: 'ml-dsa',
  0x4b: 'slh-dsa',
  0x46: 'hss',
  0x47: 'xmss',
  0x48: 'xmss',
}

const CKO_TO_ROLE: Record<number, HsmKeyRole> = {
  0x02: 'public',
  0x03: 'private',
  0x04: 'secret',
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface HsmKeyInspectorProps {
  keys: HsmKey[]
  moduleRef: React.MutableRefObject<SoftHSMModule | null>
  hSessionRef: React.MutableRefObject<number>
  onRemoveKey?: (handle: number) => void
  onClear?: () => void
  /** Optional title override (default: "HSM Key Registry") */
  title?: string
}

// ── Main component ────────────────────────────────────────────────────────────

export const HsmKeyInspector = ({
  keys,
  moduleRef,
  hSessionRef,
  onRemoveKey,
  onClear,
  title = 'HSM Key Registry',
}: HsmKeyInspectorProps) => {
  const [inspectedKey, setInspectedKey] = useState<HsmKey | null>(null)
  const [attrs, setAttrs] = useState<KeyAttributeSet | null>(null)
  const [confirmHandle, setConfirmHandle] = useState<number | null>(null)

  // Batch-query key sizes via an effect so ref access stays out of render
  const [keySizeMap, setKeySizeMap] = useState<Map<number, number | null>>(new Map())
  const keyTracker = useMemo(() => keys.map((k) => k.handle).join(','), [keys])
  useEffect(() => {
    const M = moduleRef.current
    const hSession = hSessionRef.current
    const map = new Map<number, number | null>()
    for (const k of keys) {
      if (!M || !hSession) {
        map.set(k.handle, null)
        continue
      }
      try {
        const a = hsm_getKeyAttributes(M, hSession, k.handle)
        map.set(k.handle, estimateKeySize(a))
      } catch {
        map.set(k.handle, null)
      }
    }

    setKeySizeMap(map)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyTracker]) // moduleRef and hSessionRef are stable refs — intentionally omitted

  const totalBytes = useMemo(() => {
    let sum = 0
    for (const v of keySizeMap.values()) {
      if (v !== null) sum += v
    }
    return sum
  }, [keySizeMap])

  const openInspect = useCallback(
    (key: HsmKey) => {
      const M = moduleRef.current
      const hSession = hSessionRef.current
      if (!M || !hSession) return
      try {
        const a = hsm_getKeyAttributes(M, hSession, key.handle)
        setAttrs(a)
        setInspectedKey(key)
      } catch {
        // key may be invalid or destroyed — fail silently
      }
    },
    [moduleRef, hSessionRef]
  )

  const destroyKey = useCallback(
    (key: HsmKey) => {
      const M = moduleRef.current
      const hSession = hSessionRef.current
      if (!M || !hSession) return
      try {
        hsm_destroyObject(M, hSession, key.handle)
        onRemoveKey?.(key.handle)
      } catch {
        // key may already be destroyed
      }
      setConfirmHandle(null)
    },
    [moduleRef, hSessionRef, onRemoveKey]
  )

  // Auto-detect family/role for AES keys — pre-computed in an effect to avoid ref access during render
  const [resolvedKeys, setResolvedKeys] = useState<HsmKey[]>(keys)
  useEffect(() => {
    const M = moduleRef.current
    const hSession = hSessionRef.current

    setResolvedKeys(
      keys.map((k) => {
        if (k.family !== 'aes' || k.role !== 'secret') return k
        if (!M || !hSession) return k
        try {
          const a = hsm_getKeyAttributes(M, hSession, k.handle)
          return {
            ...k,
            family: a.ckKeyType !== null ? (CKK_TO_FAMILY[a.ckKeyType] ?? k.family) : k.family,
            role: a.ckClass !== null ? (CKO_TO_ROLE[a.ckClass] ?? k.role) : k.role,
          }
        } catch {
          return k
        }
      })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyTracker]) // moduleRef/hSessionRef are stable refs — intentionally omitted

  if (keys.length === 0) {
    return (
      <div className="glass-panel p-5 flex flex-col items-center gap-2 text-muted-foreground">
        <Lock size={24} className="opacity-30" />
        <p className="text-sm">No keys yet — click Execute to run the provisioning flow.</p>
      </div>
    )
  }

  return (
    <>
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <KeyIcon size={14} className="text-primary" />
              {title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 ml-5">
              {keys.length} {keys.length === 1 ? 'key' : 'keys'}
              {totalBytes > 0 && <> &middot; {formatBytes(totalBytes)}</>}
            </p>
          </div>
          {onClear && keys.length > 0 && (
            <button
              onClick={onClear}
              className="text-[10px] px-2 py-0.5 rounded border border-border hover:bg-muted text-muted-foreground transition-colors"
              title="Clear all key objects from the Key Inspector"
            >
              Clear Keys
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-1.5 pr-3 font-medium w-8" />
                <th className="text-left py-1.5 pr-4 font-medium hidden sm:table-cell">Handle</th>
                <th className="text-left py-1.5 pr-4 font-medium">Label</th>
                <th className="text-left py-1.5 pr-4 font-medium">Purpose</th>
                <th className="text-left py-1.5 pr-4 font-medium hidden sm:table-cell">Role</th>
                <th className="text-right py-1.5 pr-4 font-medium">Size</th>
                <th className="text-left py-1.5 pr-4 font-medium hidden md:table-cell">
                  Generated
                </th>
                <th className="text-left py-1.5 font-medium w-8" />
              </tr>
            </thead>
            <tbody className="font-mono">
              {resolvedKeys.map((k) => (
                <tr key={k.handle} className="border-b border-border/40 hover:bg-muted/30">
                  <td className="py-1 pr-3">
                    <button
                      type="button"
                      onClick={() => openInspect(k)}
                      className="text-muted-foreground hover:text-primary transition-colors p-0.5 rounded"
                      aria-label={`Inspect key ${k.handle}`}
                    >
                      <Eye size={12} />
                    </button>
                  </td>
                  <td className="py-1.5 pr-4 text-muted-foreground hidden sm:table-cell">
                    {k.handle}
                  </td>
                  <td className="py-1.5 pr-4 text-foreground">{k.label}</td>
                  <td className="py-1.5 pr-4 font-sans">
                    <PurposeBadge purpose={k.purpose} />
                  </td>
                  <td
                    className={`py-1.5 pr-4 font-sans hidden sm:table-cell ${ROLE_COLORS[k.role] ?? ''}`}
                  >
                    {ROLE_LABELS[k.role] ?? k.role}
                  </td>
                  <td className="py-1.5 pr-4 text-muted-foreground text-right tabular-nums">
                    {(() => {
                      const size = keySizeMap.get(k.handle)
                      return size != null ? formatBytes(size) : '—'
                    })()}
                  </td>
                  <td className="py-1.5 pr-4 text-muted-foreground hidden md:table-cell">
                    {k.generatedAt}
                  </td>
                  <td className="py-1 pl-1">
                    {confirmHandle === k.handle ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => destroyKey(k)}
                          className="text-status-error text-[10px] font-sans font-medium hover:underline"
                          aria-label={`Confirm destroy key ${k.handle}`}
                        >
                          destroy?
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmHandle(null)}
                          className="text-muted-foreground text-[10px] font-sans hover:underline"
                        >
                          cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmHandle(k.handle)}
                        className="text-muted-foreground hover:text-status-error transition-colors p-0.5 rounded"
                        aria-label={`Delete key ${k.handle}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground">
          Session objects — not persisted to token. Click <Eye size={10} className="inline" /> to
          inspect PKCS#11 attributes.
        </p>
      </div>

      {inspectedKey && attrs && (
        <KeyAttrModal
          hsmKey={inspectedKey}
          attrs={attrs}
          onClose={() => {
            setInspectedKey(null)
            setAttrs(null)
          }}
        />
      )}
    </>
  )
}

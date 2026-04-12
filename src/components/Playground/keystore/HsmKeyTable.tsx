// SPDX-License-Identifier: GPL-3.0-only
/**
 * HsmKeyTable — displays PKCS#11 key handles registered via HsmContext.
 * All keys are session objects (non-persistent) — no export/download.
 */
import { useState, useMemo, useRef } from 'react'
import { Eye, Key as KeyIcon, Lock, RefreshCw, Trash2, X } from 'lucide-react'
import { Button } from '../../ui/button'
import { useHsmContext, type HsmKey, type HsmFamily, type HsmKeyRole } from '../hsm/HsmContext'
import {
  hsm_getKeyAttributes,
  hsm_destroyObject,
  hsm_findAllObjects,
  SLH_DSA_PUB_BYTES,
  type KeyAttributeSet,
} from '../../../wasm/softhsm'
import { formatBytes } from './keySizeUtils'

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
  0x00001080: 'CKM_AES_KEY_GEN',
  0x00000350: 'CKM_GENERIC_SECRET_KEY_GEN',
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
const estimateKeySize = (attrs: KeyAttributeSet): number | null => {
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

// ── Attribute modal ───────────────────────────────────────────────────────────

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

export const KeyAttrModal = ({
  hsmKey,
  attrs,
  onClose,
}: {
  hsmKey: HsmKey
  attrs: KeyAttributeSet
  onClose: () => void
}) => (
  <div
    role="presentation"
    className="fixed inset-0 embed-backdrop bg-black/60 flex items-center justify-center z-50 p-4"
    onClick={(e) => e.target === e.currentTarget && onClose()}
    onKeyDown={(e) => e.key === 'Escape' && onClose()}
  >
    <div className="glass-panel w-full max-w-md p-5 space-y-4 shadow-xl z-[101] bg-background border border-border">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-sm">{hsmKey.label}</h3>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">handle = {hsmKey.handle}</p>
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

      <p className="text-xs text-muted-foreground">Session object · read via C_GetAttributeValue</p>
    </div>
  </div>
)

// ── Role styling ──────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  public: 'Public',
  private: 'Private',
  secret: 'Secret',
}

const ROLE_COLORS: Record<string, string> = {
  public: 'text-status-success',
  private: 'text-status-warning',
  secret: 'text-status-info',
}

// ── Main component ────────────────────────────────────────────────────────────

export const HsmKeyTable = () => {
  const { hsmKeys, moduleRef, crossCheckModuleRef, hSessionRef, addHsmKey, removeHsmKey } =
    useHsmContext()
  const [inspectedKey, setInspectedKey] = useState<HsmKey | null>(null)
  const [attrs, setAttrs] = useState<KeyAttributeSet | null>(null)
  const [confirmHandle, setConfirmHandle] = useState<number | null>(null)
  const [discoverCount, setDiscoverCount] = useState<number | null>(null)
  const [discovering, setDiscovering] = useState(false)

  // Cache PKCS#11 attribute reads per handle to avoid re-querying on every render.
  // Only new handles (not yet in cache) trigger C_GetAttributeValue calls.
  const attrCache = useRef(new Map<number, KeyAttributeSet | null>())

  // Batch-query key sizes from PKCS#11 attributes (synchronous WASM calls)
  const keySizeMap = useMemo(() => {
    const map = new Map<number, number | null>()
    for (const k of hsmKeys) {
      if (!attrCache.current.has(k.handle)) {
        const M = k.engine === 'rust' ? crossCheckModuleRef.current : moduleRef.current
        const hSession = hSessionRef.current
        if (!M || !hSession) {
          attrCache.current.set(k.handle, null)
        } else {
          try {
            attrCache.current.set(k.handle, hsm_getKeyAttributes(M, hSession, k.handle))
          } catch {
            attrCache.current.set(k.handle, null)
          }
        }
      }
      const a = attrCache.current.get(k.handle) ?? null
      map.set(k.handle, a ? estimateKeySize(a) : null)
    }
    return map
  }, [hsmKeys, moduleRef, crossCheckModuleRef, hSessionRef])

  const totalBytes = useMemo(() => {
    let sum = 0
    for (const v of keySizeMap.values()) {
      if (v !== null) sum += v
    }
    return sum
  }, [keySizeMap])

  const openInspect = (key: HsmKey) => {
    // Route to the correct engine — Rust keys live on crossCheckModuleRef
    const M = key.engine === 'rust' ? crossCheckModuleRef.current : moduleRef.current
    const hSession = hSessionRef.current
    if (!M || !hSession) return
    try {
      const a = hsm_getKeyAttributes(M, hSession, key.handle)
      setAttrs(a)
      setInspectedKey(key)
    } catch {
      // handle invalid / destroyed keys silently
    }
  }

  const destroyKey = (key: HsmKey) => {
    const M = key.engine === 'rust' ? crossCheckModuleRef.current : moduleRef.current
    const hSession = hSessionRef.current
    if (!M || !hSession) return
    try {
      hsm_destroyObject(M, hSession, key.handle)
      removeHsmKey(key.handle)
      attrCache.current.delete(key.handle)
    } catch {
      // key may already be destroyed
    }
    setConfirmHandle(null)
  }

  const discoverObjects = () => {
    const M = moduleRef.current
    const hSession = hSessionRef.current
    if (!M || !hSession) return
    setDiscovering(true)
    try {
      const handles = hsm_findAllObjects(M, hSession, [])
      const knownHandles = new Set(hsmKeys.map((k) => k.handle))
      let added = 0
      for (const h of handles) {
        if (knownHandles.has(h)) continue
        try {
          const a = hsm_getKeyAttributes(M, hSession, h)
          const family: HsmFamily =
            a.ckKeyType !== null ? (CKK_TO_FAMILY[a.ckKeyType] ?? 'aes') : 'aes'
          const role: HsmKeyRole =
            a.ckClass !== null ? (CKO_TO_ROLE[a.ckClass] ?? 'secret') : 'secret'
          const typeName = a.ckKeyType !== null ? (CKK_NAMES[a.ckKeyType] ?? 'Unknown') : 'Unknown'
          addHsmKey({
            handle: h,
            family,
            role,
            label: `${typeName} (discovered)`,
            generatedAt: new Date().toLocaleTimeString(),
          })
          added++
        } catch {
          // skip objects that can't be queried
        }
      }
      setDiscoverCount(added)
      setTimeout(() => setDiscoverCount(null), 3000)
    } finally {
      setDiscovering(false)
    }
  }

  if (hsmKeys.length === 0) {
    return (
      <div className="glass-panel p-6 flex flex-col items-center gap-2 text-muted-foreground">
        <Lock size={28} className="opacity-30" />
        <p className="text-sm">No HSM keys generated yet.</p>
        <p className="text-xs">Use the KEM or Sign tabs to generate key pairs.</p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 text-xs"
          onClick={discoverObjects}
          disabled={discovering}
        >
          <RefreshCw size={12} className={discovering ? 'animate-spin mr-1.5' : 'mr-1.5'} />
          Discover Objects
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <KeyIcon size={14} className="text-primary" /> HSM Key Registry
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 ml-5">
              {hsmKeys.length} {hsmKeys.length === 1 ? 'key' : 'keys'}
              {totalBytes > 0 && <> &middot; {formatBytes(totalBytes)}</>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {discoverCount !== null && (
              <span className="text-xs text-status-success animate-fade-in">
                +{discoverCount} discovered
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={discoverObjects}
              disabled={discovering}
              aria-label="Discover PKCS#11 objects"
            >
              <RefreshCw size={12} className={discovering ? 'animate-spin mr-1.5' : 'mr-1.5'} />
              Discover
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-1.5 pr-3 font-medium w-8" />
                <th className="text-left py-1.5 pr-4 font-medium hidden sm:table-cell">Handle</th>
                <th className="text-left py-1.5 pr-4 font-medium">Label</th>
                <th className="text-left py-1.5 pr-4 font-medium">Role</th>
                <th className="text-right py-1.5 pr-4 font-medium">Size</th>
                <th className="text-left py-1.5 pr-4 font-medium hidden md:table-cell">
                  Generated
                </th>
                <th className="text-left py-1.5 font-medium w-8" />
              </tr>
            </thead>
            <tbody className="font-mono">
              {hsmKeys.map((k) => (
                <tr key={k.handle} className="border-b border-border/40 hover:bg-muted/30">
                  <td className="py-1 pr-3">
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => openInspect(k)}
                      className="text-muted-foreground hover:text-primary transition-colors p-0.5 rounded"
                      aria-label={`Inspect key ${k.handle}`}
                    >
                      <Eye size={12} />
                    </Button>
                  </td>
                  <td className="py-1.5 pr-4 text-muted-foreground hidden sm:table-cell">
                    {k.handle}
                  </td>
                  <td className="py-1.5 pr-4 text-foreground">{k.label}</td>
                  <td className={`py-1.5 pr-4 font-sans ${ROLE_COLORS[k.role] ?? ''}`}>
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
                        <Button
                          variant="ghost"
                          type="button"
                          onClick={() => destroyKey(k)}
                          className="text-status-error text-[10px] font-sans font-medium hover:underline"
                          aria-label={`Confirm destroy key ${k.handle}`}
                        >
                          destroy?
                        </Button>
                        <Button
                          variant="ghost"
                          type="button"
                          onClick={() => setConfirmHandle(null)}
                          className="text-muted-foreground text-[10px] font-sans hover:underline"
                        >
                          cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        type="button"
                        onClick={() => setConfirmHandle(k.handle)}
                        className="text-muted-foreground hover:text-status-error transition-colors p-0.5 rounded"
                        aria-label={`Delete key ${k.handle}`}
                      >
                        <Trash2 size={12} />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground">
          Session objects — not persisted to token. Handles are valid until session closes.
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

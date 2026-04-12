// SPDX-License-Identifier: GPL-3.0-only
/**
 * KeyInspectTable — read-only PKCS#11 key table for learning module demos.
 * Prop-driven alternative to HsmKeyTable (no HsmContext dependency).
 */
/* eslint-disable security/detect-object-injection */
/* eslint-disable react-hooks/refs */
import React, { useState, useMemo } from 'react'
import { Eye, Key as KeyIcon, Lock, X } from 'lucide-react'
import { Button } from '../ui/button'
import type { HsmKey } from '@/components/Playground/hsm/HsmContext'
import {
  hsm_getKeyAttributes,
  SLH_DSA_PUB_BYTES,
  type KeyAttributeSet,
  type SoftHSMModule,
} from '@/wasm/softhsm'
import { formatBytes } from '@/components/Playground/keystore/keySizeUtils'

export interface KeyInspectTableProps {
  keys: HsmKey[]
  moduleRef: React.MutableRefObject<SoftHSMModule | null>
  hSessionRef: React.MutableRefObject<number>
}

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

// ── PQC key material sizes (bytes) by CKA_KEY_TYPE + CKA_PARAMETER_SET ──────

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

// ── Attribute modal ───────────────────────────────────────────────────────────

const KeyAttrModal = ({
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
    <div className="glass-panel w-full max-w-md p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-sm">{hsmKey.label}</h3>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">handle = {hsmKey.handle}</p>
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={onClose}>
          <X size={14} />
        </Button>
      </div>

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

export const KeyInspectTable: React.FC<KeyInspectTableProps> = ({
  keys,
  moduleRef,
  hSessionRef,
}) => {
  const [inspectedKey, setInspectedKey] = useState<HsmKey | null>(null)
  const [attrs, setAttrs] = useState<KeyAttributeSet | null>(null)

  const keySizeMap = useMemo(() => {
    const map = new Map<number, number | null>()
    for (const k of keys) {
      const M = moduleRef.current
      const hSession = hSessionRef.current
      if (!M || !hSession) {
        map.set(k.handle, null)
        continue
      }
      try {
        map.set(k.handle, estimateKeySize(hsm_getKeyAttributes(M, hSession, k.handle)))
      } catch {
        map.set(k.handle, null)
      }
    }
    return map
  }, [keys, moduleRef, hSessionRef])

  const openInspect = (key: HsmKey) => {
    const M = moduleRef.current
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

  if (keys.length === 0) {
    return (
      <div className="glass-panel p-6 flex flex-col items-center gap-2 text-muted-foreground">
        <Lock size={28} className="opacity-30" />
        <p className="text-sm">No keys generated yet.</p>
        <p className="text-xs">Run the live demo to generate and inspect keys.</p>
      </div>
    )
  }

  return (
    <>
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center gap-2">
          <KeyIcon size={14} className="text-primary" />
          <h3 className="font-semibold text-sm">
            HSM Key Registry
            <span className="ml-2 text-muted-foreground font-normal">
              {keys.length} {keys.length === 1 ? 'key' : 'keys'}
            </span>
          </h3>
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
                <th className="text-left py-1.5 font-medium hidden md:table-cell">Generated</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {keys.map((k) => (
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
                  <td className="py-1.5 text-muted-foreground hidden md:table-cell">
                    {k.generatedAt}
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

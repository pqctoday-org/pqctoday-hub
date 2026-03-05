// SPDX-License-Identifier: GPL-3.0-only
/**
 * HsmKeyTable — displays PKCS#11 key handles registered via HsmContext.
 * All keys are session objects (non-persistent) — no export/download.
 */
import { useState } from 'react'
import { Eye, Key as KeyIcon, Lock, X } from 'lucide-react'
import { Button } from '../../ui/button'
import { useHsmContext, type HsmKey } from '../hsm/HsmContext'
import { hsm_getKeyAttributes, type KeyAttributeSet } from '../../../wasm/softhsm'

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
  { label: 'CKA_SENSITIVE', key: 'ckSensitive' },
  { label: 'CKA_EXTRACTABLE', key: 'ckExtractable' },
  { label: 'CKA_ENCRYPT', key: 'ckEncrypt' },
  { label: 'CKA_DECRYPT', key: 'ckDecrypt' },
  { label: 'CKA_SIGN', key: 'ckSign' },
  { label: 'CKA_VERIFY', key: 'ckVerify' },
  { label: 'CKA_WRAP', key: 'ckWrap' },
  { label: 'CKA_UNWRAP', key: 'ckUnwrap' },
  { label: 'CKA_DERIVE', key: 'ckDerive' },
]

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
    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
    onClick={(e) => e.target === e.currentTarget && onClose()}
    onKeyDown={(e) => e.key === 'Escape' && onClose()}
  >
    <div className="glass-panel w-full max-w-md p-5 space-y-4">
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
        <table className="w-full text-xs font-mono border-collapse">
          <tbody>
            <tr className="border-b border-border/40">
              <td className="py-1.5 pr-4 text-muted-foreground w-40">CKA_CLASS</td>
              <td className="py-1.5 text-foreground">{fmtUlong(attrs.ckClass, CKO_NAMES)}</td>
            </tr>
            <tr className="border-b border-border/40">
              <td className="py-1.5 pr-4 text-muted-foreground">CKA_KEY_TYPE</td>
              <td className="py-1.5 text-foreground">{fmtUlong(attrs.ckKeyType, CKK_NAMES)}</td>
            </tr>
            {attrs.ckValueLen !== null && (
              <tr className="border-b border-border/40">
                <td className="py-1.5 pr-4 text-muted-foreground">CKA_VALUE_LEN</td>
                <td className="py-1.5 text-foreground">{attrs.ckValueLen} bytes</td>
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
  const { hsmKeys, moduleRef, hSessionRef } = useHsmContext()
  const [inspectedKey, setInspectedKey] = useState<HsmKey | null>(null)
  const [attrs, setAttrs] = useState<KeyAttributeSet | null>(null)

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

  if (hsmKeys.length === 0) {
    return (
      <div className="glass-panel p-6 flex flex-col items-center gap-2 text-muted-foreground">
        <Lock size={28} className="opacity-30" />
        <p className="text-sm">No HSM keys generated yet.</p>
        <p className="text-xs">Use the KEM or Sign tabs to generate key pairs.</p>
      </div>
    )
  }

  return (
    <>
      <div className="glass-panel p-4 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <KeyIcon size={14} className="text-primary" /> HSM Key Registry
          <span className="text-xs text-muted-foreground font-normal">({hsmKeys.length} keys)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-1.5 pr-3 font-medium w-8" />
                <th className="text-left py-1.5 pr-4 font-medium">Handle</th>
                <th className="text-left py-1.5 pr-4 font-medium">Label</th>
                <th className="text-left py-1.5 pr-4 font-medium">Role</th>
                <th className="text-left py-1.5 font-medium">Generated</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {hsmKeys.map((k) => (
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
                  <td className="py-1.5 pr-4 text-muted-foreground">{k.handle}</td>
                  <td className="py-1.5 pr-4 text-foreground">{k.label}</td>
                  <td className={`py-1.5 pr-4 font-sans ${ROLE_COLORS[k.role] ?? ''}`}>
                    {ROLE_LABELS[k.role] ?? k.role}
                  </td>
                  <td className="py-1.5 text-muted-foreground">{k.generatedAt}</td>
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

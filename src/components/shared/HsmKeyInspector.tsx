// SPDX-License-Identifier: GPL-3.0-only
/**
 * HsmKeyInspector — portable PKCS#11 key table with attribute inspection.
 *
 * Unlike HsmKeyTable (which is hardwired to useHsmContext for the Playground),
 * this component accepts keys and module refs as props so it can be embedded
 * in any module that uses the useHSM hook (e.g. TEEHSMTrustedChannel).
 */
import { useState, useMemo, useEffect, useCallback } from 'react'
import { Eye, Key as KeyIcon, Lock, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { HsmKey, HsmKeyRole } from '@/components/Playground/hsm/HsmContext'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { hsm_destroyObject, hsm_getKeyAttributes, type KeyAttributeSet } from '@/wasm/softhsm'
import { formatBytes } from '@/components/Playground/keystore/keySizeUtils'
import {
  resolveKeyHandle,
  isSessionGoneError,
} from '@/components/Playground/keystore/resolveKeyHandle'
import { keyIdentity } from '@/components/Playground/keystore/keyIdentity'
import { estimateKeySize, KeyAttrModal, PurposeBadge } from '@/components/shared/hsmKeyAttrDisplay'
import { CKK_TO_FAMILY, CKO_TO_ROLE } from '@/components/Playground/keystore/discoverHsmObjects'

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

// ── Props ─────────────────────────────────────────────────────────────────────

export interface HsmKeyInspectorProps {
  keys: HsmKey[]
  moduleRef: React.MutableRefObject<SoftHSMModule | null>
  hSessionRef: React.MutableRefObject<number>
  /** Takes the full key, not a bare handle — the parent binds identity/scope. */
  onRemoveKey?: (key: HsmKey) => void
  /** Parent supplies the already-scoped clear (e.g. `() => clearHsmKeys({ slotId })`). */
  onClear?: () => void
  /** Optional title override (default: "HSM Key Registry") */
  title?: string
  /**
   * Override how key attributes are read. When set, replaces direct hsm_getKeyAttributes
   * calls in both the size-estimate effect and the inspect modal. Used by VPN sim to
   * route keys whose handles live in a strongSwan worker WASM through worker RPC.
   * Returning null means "could not read attributes" (treated like a thrown error).
   */
  attrsResolver?: (key: HsmKey) => Promise<KeyAttributeSet | null>
}

// ── Main component ────────────────────────────────────────────────────────────

export const HsmKeyInspector = ({
  keys,
  moduleRef,
  hSessionRef,
  onRemoveKey,
  onClear,
  title = 'HSM Key Registry',
  attrsResolver,
}: HsmKeyInspectorProps) => {
  const [inspectedKey, setInspectedKey] = useState<HsmKey | null>(null)
  const [attrs, setAttrs] = useState<KeyAttributeSet | null>(null)
  const [confirmHandle, setConfirmHandle] = useState<number | null>(null)

  // Batch-query key sizes via an effect so ref access stays out of render
  const [keySizeMap, setKeySizeMap] = useState<Map<number, number | null>>(new Map())
  const keyTracker = useMemo(() => keys.map((k) => k.handle).join(','), [keys])
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const M = moduleRef.current
      const hSession = hSessionRef.current
      const map = new Map<number, number | null>()
      for (const k of keys) {
        let a: KeyAttributeSet | null = null
        if (attrsResolver) {
          try {
            a = await attrsResolver(k)
          } catch {
            a = null
          }
        } else if (M && hSession) {
          try {
            const liveHandle = resolveKeyHandle(M, hSession, k)
            a = liveHandle !== null ? hsm_getKeyAttributes(M, hSession, liveHandle) : null
          } catch (err) {
            a = null
            if (isSessionGoneError(err)) onRemoveKey?.(k)
          }
        }
        map.set(k.handle, a ? estimateKeySize(a) : null)
      }
      if (!cancelled) setKeySizeMap(map)
    }
    void run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyTracker, attrsResolver, onRemoveKey]) // moduleRef and hSessionRef are stable refs — intentionally omitted

  const totalBytes = useMemo(() => {
    let sum = 0
    for (const v of keySizeMap.values()) {
      if (v !== null) sum += v
    }
    return sum
  }, [keySizeMap])

  const openInspect = useCallback(
    async (key: HsmKey) => {
      if (attrsResolver) {
        try {
          const a = await attrsResolver(key)
          if (a) {
            setAttrs(a)
            setInspectedKey(key)
          }
        } catch {
          // resolver failed — fail silently
        }
        return
      }
      const M = moduleRef.current
      const hSession = hSessionRef.current
      if (!M || !hSession) return
      try {
        const liveHandle = resolveKeyHandle(M, hSession, key)
        const a = hsm_getKeyAttributes(M, hSession, liveHandle ?? 0)
        setAttrs(a)
        setInspectedKey(key)
      } catch (err) {
        if (isSessionGoneError(err)) onRemoveKey?.(key)
        // otherwise: key may be invalid or destroyed — fail silently
      }
    },
    [moduleRef, hSessionRef, attrsResolver, onRemoveKey]
  )

  const destroyKey = useCallback(
    (key: HsmKey) => {
      const M = moduleRef.current
      const hSession = hSessionRef.current
      if (!M || !hSession) return
      try {
        const liveHandle = resolveKeyHandle(M, hSession, key)
        if (liveHandle !== null) hsm_destroyObject(M, hSession, liveHandle)
        onRemoveKey?.(key)
      } catch (err) {
        // key may already be destroyed — but if the SESSION is gone,
        // remove the row too, or Destroy would be stuck failing on it.
        if (isSessionGoneError(err)) onRemoveKey?.(key)
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
          const liveHandle = resolveKeyHandle(M, hSession, k)
          if (liveHandle === null) return k
          const a = hsm_getKeyAttributes(M, hSession, liveHandle)
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
      // Same rationale as Pkcs11LogPanel's hooks: an empty inspector is still
      // an inspector, so it carries the testid and reports a count of 0 rather
      // than reading as "this tool has no key inventory at all".
      <div
        className="glass-panel p-5 flex flex-col items-center gap-2 text-muted-foreground"
        data-testid="hsm-key-inspector"
        data-hsm-key-count={0}
      >
        <Lock size={24} className="opacity-30" />
        <p className="text-sm">No keys yet — click Execute to run the provisioning flow.</p>
      </div>
    )
  }

  return (
    <>
      <div
        className="glass-panel p-4 space-y-3"
        data-testid="hsm-key-inspector"
        data-hsm-key-count={keys.length}
      >
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
            <Button
              variant="ghost"
              onClick={onClear}
              className="text-[10px] px-2 py-0.5 rounded border border-border hover:bg-muted text-muted-foreground transition-colors"
              title="Clear all key objects from the Key Inspector"
            >
              Clear Keys
            </Button>
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
                <tr key={keyIdentity(k)} className="border-b border-border/40 hover:bg-muted/30">
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

// SPDX-License-Identifier: GPL-3.0-only
/**
 * HsmKeyTable — displays PKCS#11 key handles registered via HsmContext.
 * All keys are session objects (non-persistent) — no export/download.
 */
import { useState, useMemo, useRef, useEffect } from 'react'
import { Eye, Key as KeyIcon, Lock, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '../../ui/button'
import { useHsmContext, type HsmKey } from '../hsm/HsmContext'
import {
  hsm_getKeyAttributes,
  hsm_destroyObject,
  type KeyAttributeSet,
} from '../../../wasm/softhsm'
import { formatBytes } from './keySizeUtils'
import { discoverHsmObjects } from './discoverHsmObjects'
import { estimateKeySize, KeyAttrModal } from '@/components/shared/hsmKeyAttrDisplay'

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
  const hsmCtx = useHsmContext()
  const { hsmKeys, moduleRef, crossCheckModuleRef, hSessionRef, removeHsmKey } = hsmCtx
  const [inspectedKey, setInspectedKey] = useState<HsmKey | null>(null)
  const [attrs, setAttrs] = useState<KeyAttributeSet | null>(null)
  const [confirmHandle, setConfirmHandle] = useState<number | null>(null)
  const [discoverCount, setDiscoverCount] = useState<number | null>(null)
  const [discovering, setDiscovering] = useState(false)

  // Cache PKCS#11 attribute reads per handle to avoid re-querying on every render.
  // Only new handles (not yet in cache) trigger C_GetAttributeValue calls.
  const attrCache = useRef(new Map<number, KeyAttributeSet | null>())

  // Batch-query key sizes from PKCS#11 attributes (synchronous WASM calls
  // that log through the shared HsmContext call log — done in an effect,
  // not render, since a logging module call synchronously updates
  // HsmProvider's log state, which React disallows during another
  // component's render).
  const [keySizeMap, setKeySizeMap] = useState<Map<number, number | null>>(new Map())

  useEffect(() => {
    const map = new Map<number, number | null>()
    for (const k of hsmKeys) {
      if (!attrCache.current.has(k.handle)) {
        const M =
          k.engine === 'rust'
            ? (crossCheckModuleRef.current ?? moduleRef.current)
            : moduleRef.current
        const hSession = k.sessionHandle ?? hSessionRef.current
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
    setKeySizeMap(map)
  }, [hsmKeys, moduleRef, crossCheckModuleRef, hSessionRef])

  const totalBytes = useMemo(() => {
    let sum = 0
    for (const v of keySizeMap.values()) {
      if (v !== null) sum += v
    }
    return sum
  }, [keySizeMap])

  const openInspect = (key: HsmKey) => {
    // In dual mode, Rust keys live on crossCheckModuleRef; in Rust-only mode fall back to moduleRef
    const M =
      key.engine === 'rust' ? (crossCheckModuleRef.current ?? moduleRef.current) : moduleRef.current
    const hSession = key.sessionHandle ?? hSessionRef.current
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
    setDiscovering(true)
    try {
      const added = discoverHsmObjects(hsmCtx)
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

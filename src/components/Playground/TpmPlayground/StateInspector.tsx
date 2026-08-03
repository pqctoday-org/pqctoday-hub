import { useEffect, useState } from 'react'
import { Database, KeyRound, HardDrive } from 'lucide-react'
import type { TpmObjectEntry } from './TpmPlayground'
import { executeTpmCommand } from '../../../wasm/tpmBridge'
import { buildGetCapabilityCmd, getU32, TPM_CAP_HANDLES } from '../../../wasm/tpmSerializer'

interface StateInspectorProps {
  objects: TpmObjectEntry[]
  isWasmReady: boolean
}

/**
 * Parse a TPM2_GetCapability(TPM_CAP_HANDLES) response into the handle list.
 * NO_SESSIONS response layout: header(10) + moreData(1) + capability(4) +
 * TPML_HANDLE{count(4), handle[count](4 each)}.
 */
function parsePersistentHandles(resp: Uint8Array): number[] {
  const rc = getU32(resp, 6)
  if (rc !== 0 || resp.length < 15) return []
  const countOff = 15
  const count = getU32(resp, countOff)
  const handles: number[] = []
  for (let i = 0; i < count; i++) {
    const off = countOff + 4 + i * 4
    if (resp.length < off + 4) break
    handles.push(getU32(resp, off))
  }
  return handles
}

/** This WASM build has 3 transient object slots, shared by every tab — see
 *  tpmBridge.ts. Exceeding them fails with TPM_RC_OBJECT_MEMORY (0x902). */
const TRANSIENT_SLOT_BUDGET = 3

export function StateInspector({ objects, isWasmReady }: StateInspectorProps) {
  const [persistentHandles, setPersistentHandles] = useState<number[]>([])
  const [transientHandles, setTransientHandles] = useState<number[] | null>(null)

  useEffect(() => {
    if (!isWasmReady) return
    let cancelled = false
    // Persistent handle range starts at 0x81000000 (Table 2, TPM_HT_PERSISTENT)
    // — this is where the V2.7 EK/AK handles auto-provisioned at boot live
    // (0x81010060-0x81010066), which the locally-tracked `objects` array
    // never sees since they aren't created via this tab's CreatePrimary.
    const cmd = buildGetCapabilityCmd(TPM_CAP_HANDLES, 0x81000000, 16)
    executeTpmCommand(cmd)
      .then((resp) => {
        if (!cancelled) setPersistentHandles(parsePersistentHandles(resp))
      })
      .catch(() => {
        // Informational only — leave the persistent-handle section empty.
      })
    return () => {
      cancelled = true
    }
  }, [isWasmReady])

  // Transient range (0x80000000, TPM_HT_TRANSIENT). The `objects` array above
  // is this tab's own bookkeeping, so it cannot see objects loaded by the
  // Learn tab, Command Builder or Compliance Runner — yet all of them draw on
  // the SAME 3-slot budget. Exhausting it fails with TPM_RC_OBJECT_MEMORY, a
  // cross-tab collision that was previously invisible, with flushAllTransient()
  // as its only mitigation and nothing showing occupancy.
  useEffect(() => {
    if (!isWasmReady) return
    let cancelled = false
    const cmd = buildGetCapabilityCmd(TPM_CAP_HANDLES, 0x80000000, 16)
    executeTpmCommand(cmd)
      .then((resp) => {
        if (!cancelled) setTransientHandles(parsePersistentHandles(resp))
      })
      .catch(() => {
        // Leave as null — "couldn't ask" must not render as "0 in use".
      })
    return () => {
      cancelled = true
    }
  }, [isWasmReady, objects])

  return (
    <div className="space-y-6">
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/30 px-4 py-2 border-b border-border text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
          <Database className="h-4 w-4" />
          Active Object Table
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs text-muted-foreground mb-2">
            Transient objects created from the Command Builder tab in this session.
          </p>

          {/* Live occupancy, queried from the TPM rather than counted from the
              local list — the budget is shared across every tab. */}
          {transientHandles !== null && (
            <div
              className={`mb-3 rounded border px-3 py-2 text-xs ${
                transientHandles.length >= TRANSIENT_SLOT_BUDGET
                  ? 'border-status-error/40 bg-status-error/10 text-status-error'
                  : 'border-border bg-muted/20 text-muted-foreground'
              }`}
            >
              <span className="font-bold">
                Transient slots: {transientHandles.length}/{TRANSIENT_SLOT_BUDGET} in use
              </span>
              {transientHandles.length > 0 && (
                <span className="ml-2 font-mono text-[10px]">
                  {transientHandles.map((h) => `0x${h.toString(16)}`).join(', ')}
                </span>
              )}
              <div className="mt-1 leading-relaxed">
                {transientHandles.length >= TRANSIENT_SLOT_BUDGET
                  ? 'Full — the next CreatePrimary/Load will fail with TPM_RC_OBJECT_MEMORY (0x902) until something is flushed.'
                  : 'This budget is shared by the Learn, Command Builder, Compliance and Attestation tabs, so objects loaded elsewhere count here too.'}
              </div>
            </div>
          )}

          {objects.length === 0 ? (
            <div className="border border-border rounded p-3 bg-background flex items-start gap-3 opacity-50">
              <div className="text-sm text-muted-foreground italic w-full text-center py-2">
                No objects loaded.
              </div>
            </div>
          ) : (
            objects.map((obj, i) => (
              <div
                key={i}
                className="border border-border rounded p-3 bg-secondary/5 flex items-start gap-3"
              >
                <KeyRound className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                <div className="space-y-1 w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{obj.handle}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">
                      {obj.algorithm}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">{obj.description}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-background border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/30 px-4 py-2 border-b border-border text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
          <HardDrive className="h-4 w-4" />
          Persistent Handles (live TPM2_GetCapability query)
        </div>
        <div className="p-4 space-y-2">
          <p className="text-xs text-muted-foreground mb-2">
            Queried directly from the WASM TPM — includes the V2.7 EK/AK handles provisioned at
            boot, visible here even though they weren&apos;t created from this tab.
          </p>
          {persistentHandles.length === 0 ? (
            <div className="text-sm text-muted-foreground italic w-full text-center py-2 opacity-50">
              {isWasmReady
                ? 'No persistent handles reported.'
                : 'Waiting for TPM initialization...'}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {persistentHandles.map((h) => (
                <span
                  key={h}
                  className="text-xs font-mono px-2 py-1 rounded bg-secondary/10 text-secondary border border-secondary/30"
                >
                  0x{h.toString(16).padStart(8, '0')}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

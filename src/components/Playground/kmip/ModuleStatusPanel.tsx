// SPDX-License-Identifier: GPL-3.0-only
//
// ModuleStatusPanel — per-module status strip for the modular-policy plan
// (WS-7A/7B, 2026-08-28 gaps-remediation plan). `KmipEngine`'s
// `policyModulesStatus()`/`setPolicyModuleEnabled()`/`deactivatePolicyModule()`
// have existed since the modular-policy plan itself; this is their first UI
// surface — until now the only way to see or change which modules were
// active was to call the wasm binding directly from devtools.
//
// WS-7B decision (asked, not guessed): catalog picks keep replacing the
// whole active set atomically — no separate "add module" affordance was
// added here. The interactive surface this component adds is narrower:
// per-module enable/disable and deactivate, the two mutations that don't
// require deciding a catalog interaction model at all.
//
// Renders nothing when no module preset is active (a legacy single-YAML
// policy, or the built-in permissive default) — `policyModulesStatus()`
// then reports an empty `modules` list.
import { useCallback, useEffect, useState } from 'react'
import { Boxes, Power, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { KmipEngine, PolicyModulesStatus } from '@/wasm/kmip/kmipEngine'

/** Controls can change module state from outside this component entirely —
 * the acceptance test for this panel is literally "toggle a module from
 * devtools, watch the panel update" — so it polls rather than only reading
 * once at mount. 1.5s keeps a devtools toggle feeling near-live without
 * meaningfully taxing a wasm call this cheap. Its own buttons re-poll
 * immediately instead of waiting for the next tick. */
const POLL_MS = 1500

export function ModuleStatusPanel({ engine }: { engine: KmipEngine }) {
  const [status, setStatus] = useState<PolicyModulesStatus | null>(null)

  const poll = useCallback(() => {
    try {
      setStatus(engine.policyModulesStatus())
    } catch {
      setStatus(null)
    }
  }, [engine])

  useEffect(() => {
    // The first read fires off a macrotask rather than calling `poll()`
    // directly here — a setState call synchronous with the effect body
    // itself is a cascading-render anti-pattern (react-hooks/set-state-in-
    // effect); nesting it one tick out avoids that without any real delay.
    const immediate = setTimeout(poll, 0)
    const id = setInterval(poll, POLL_MS)
    return () => {
      clearTimeout(immediate)
      clearInterval(id)
    }
  }, [poll])

  if (!status || status.modules.length === 0) return null

  const toggleEnabled = (name: string, enabled: boolean) => {
    engine.setPolicyModuleEnabled(name, !enabled)
    poll()
  }
  const deactivate = (name: string) => {
    engine.deactivatePolicyModule(name)
    poll()
  }

  return (
    <div className="mt-3 flex items-center gap-2 flex-wrap">
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Boxes size={11} /> Modules
      </span>
      {status.modules.map((m) => (
        <div
          key={m.name}
          title={`fingerprint ${m.fingerprint}`}
          className={cn(
            'inline-flex items-center gap-1 rounded border pl-1.5 pr-0.5 py-0.5 text-[10px]',
            m.enabled
              ? 'border-border bg-muted/30 text-foreground'
              : 'border-border/50 bg-muted/10 text-muted-foreground'
          )}
        >
          <span
            className={cn(
              'h-1.5 w-1.5 shrink-0 rounded-full',
              m.enabled ? 'bg-status-success' : 'bg-muted-foreground'
            )}
          />
          <span className={cn(!m.enabled && 'line-through')}>{m.name}</span>
          <span className="font-mono text-muted-foreground">
            {m.scopes.join('+')} · {m.rules}r
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleEnabled(m.name, m.enabled)}
            title={m.enabled ? `Disable ${m.name}` : `Enable ${m.name}`}
            className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
          >
            <Power size={10} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deactivate(m.name)}
            title={`Deactivate ${m.name} (removes it — re-select the preset to bring it back)`}
            className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
          >
            <X size={10} />
          </Button>
        </div>
      ))}
      <span
        className={cn(
          'ml-1 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide',
          status.uncoveredOps === 'deny'
            ? 'bg-status-success/15 text-status-success'
            : 'bg-status-warning/15 text-status-warning'
        )}
        title="What the engine does with a request whose op no active module's scope covers"
      >
        uncovered ops: {status.uncoveredOps}
      </span>
    </div>
  )
}

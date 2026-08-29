// SPDX-License-Identifier: GPL-3.0-only
//
// ScopeConflictModal — WS-7B (2026-08-28 gaps-remediation plan), built as
// future-proofing per an explicit decision, not wired to a live call site.
//
// The engine's real `ScopeConflict { scope, incumbent }` (rule.rs's
// `Engine::activate`, surfaced through `activatePolicyModule`/
// `activateModulePreset`'s `LoadPolicyResult.error`) can only fire today when
// activating a module whose scope overlaps a DIFFERENT already-active one.
// `activateModulePreset` (the only catalog-driven activation path) always
// calls `clearPolicyModules()` first — WS-7B's own decision keeps catalog
// picks atomic-replace, so nothing survives to conflict with — and
// `ModuleStatusPanel`'s enable/disable toggle calls `setPolicyModuleEnabled`,
// which `engine.rs::set_module_enabled` explicitly does NOT re-validate
// scopes for. So there is genuinely no reachable UI path to this error yet.
// This component exists so a FUTURE work stream that adds one (a real
// per-module "activate" affordance, once that catalog-interaction decision
// gets revisited) has the presentation ready rather than needing to design
// it from scratch under time pressure.
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface ScopeConflictDetails {
  /** The scope both modules claim, e.g. `"encryption"`. */
  scope: string
  /** The already-active module that owns `scope`. */
  incumbent: string
  /** The module the user was trying to activate. */
  attempted: string
}

export function ScopeConflictModal({
  conflict,
  onDeactivateIncumbent,
  onCancel,
}: {
  conflict: ScopeConflictDetails
  /** Deactivate the incumbent, then retry activating `conflict.attempted`. */
  onDeactivateIncumbent: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" onClick={onCancel} />
      <div
        className="relative w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Scope conflict"
      >
        <div className="flex items-center gap-2 text-status-warning">
          <AlertTriangle size={18} />
          <span className="font-semibold text-foreground">Scope conflict</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="font-mono text-foreground">{conflict.incumbent}</span> already covers the{' '}
          <span className="font-mono text-foreground">{conflict.scope}</span> scope. Activating{' '}
          <span className="font-mono text-foreground">{conflict.attempted}</span> would claim it too
          — a scope can only belong to one active module at a time.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="h-8 px-3 text-[12.5px] text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            variant="gradient"
            onClick={onDeactivateIncumbent}
            className="h-8 px-3 text-[12.5px]"
          >
            Deactivate {conflict.incumbent} and continue
          </Button>
        </div>
      </div>
    </div>
  )
}

// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Decommission Checklist — retire one classical asset safely: deprecate ->
 * remove -> verify removed -> log. The point learners often miss is the third
 * step: you must verify the classical material is GONE, not just that PQC was
 * added. Anchored to the NIST IR 8547 deprecate-2030 / disallow-2035 schedule.
 */

const STAGES = [
  {
    id: 'deprecate',
    label: 'Deprecate',
    detail:
      'Mark the classical key/algorithm deprecated; block new use; set a removal date inside the IR 8547 window (disallowed 2035).',
  },
  {
    id: 'remove',
    label: 'Remove',
    detail:
      'Cut over dependents to the PQC/hybrid replacement, then remove the classical key material and trust anchors.',
  },
  {
    id: 'verify-removed',
    label: 'Verify removed',
    detail:
      'Confirm by observation that the classical material is GONE — not just that PQC was added. Re-scan; the old key must no longer appear.',
  },
  {
    id: 'log',
    label: 'Log',
    detail:
      'Record the decommissioning in the log/evidence dossier: what was removed, when, by whom, and the verification evidence.',
  },
]

export function DecommissionChecklist() {
  const [done, setDone] = useState<Set<string>>(new Set())

  const toggle = (id: string) =>
    setDone((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const complete = done.size === STAGES.length

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4">
        <h3 className="font-semibold text-foreground mb-1">Retire one classical asset</h3>
        <p className="text-sm text-muted-foreground">
          Example: an RSA-2048 TLS server key being replaced by ML-KEM hybrid. Walk all four stages
          — the one teams skip is <strong>verify removed</strong>.
        </p>
      </div>

      <ol className="space-y-2">
        {STAGES.map((stage, i) => {
          const on = done.has(stage.id)
          return (
            <li key={stage.id}>
              <Button
                variant="ghost"
                onClick={() => toggle(stage.id)}
                className={`glass-panel h-auto w-full flex-col items-start justify-start whitespace-normal border p-3 text-left ${
                  on ? 'border-status-success/40 bg-status-success/5' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-2">
                  {on ? (
                    <CheckCircle2 size={16} className="text-status-success" />
                  ) : (
                    <Circle size={16} className="text-muted-foreground/40" />
                  )}
                  <span className="text-sm font-semibold text-foreground">
                    {i + 1}. {stage.label}
                  </span>
                </div>
                <p className="ml-6 mt-1 text-xs text-muted-foreground">{stage.detail}</p>
              </Button>
            </li>
          )
        })}
      </ol>

      {complete && (
        <div className="glass-panel p-4 border border-status-success/30 text-sm text-foreground">
          Asset retired and verified-removed, with an audit trail. Repeat per asset, prioritised by
          the IR 8547 deprecation schedule.
        </div>
      )}
    </div>
  )
}

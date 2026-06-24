// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState } from 'react'
import { CheckCircle2, Circle, ScanLine, ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SAMPLE_INVENTORY } from '@/data/cryptoEstate'

/**
 * Decommission Tracker — work the classical estate (the shared
 * @/data/cryptoEstate, quantum-vulnerable assets, worst-risk first) through
 * deprecate → remove → verify-removed → log. "Remove" is gated on clearing
 * dependents; "verify removed" runs a re-scan that fails if the asset was not
 * actually removed — the step teams skip. Schedule: NIST IR 8547 (disallow 2035).
 */

type StageId = 'deprecate' | 'remove' | 'verify' | 'log'
const STAGES: { id: StageId; label: string }[] = [
  { id: 'deprecate', label: 'Deprecate' },
  { id: 'remove', label: 'Remove' },
  { id: 'verify', label: 'Verify removed' },
  { id: 'log', label: 'Log' },
]

const ASSETS = SAMPLE_INVENTORY.filter((a) => a.quantumVulnerable).sort(
  (x, y) => y.riskScore - x.riskScore
)

interface St {
  stages: Set<StageId>
  depsCleared: boolean
  scan: 'unscanned' | 'present' | 'gone'
}
const initial = (): Record<string, St> =>
  Object.fromEntries(
    ASSETS.map((a) => [a.id, { stages: new Set<StageId>(), depsCleared: false, scan: 'unscanned' }])
  )

export function DecommissionChecklist() {
  const [state, setState] = useState<Record<string, St>>(initial)

  const patch = (id: string, fn: (s: St) => St) => setState((p) => ({ ...p, [id]: fn(p[id]) })) // eslint-disable-line security/detect-object-injection

  const advance = (id: string, stage: StageId) =>
    patch(id, (s) => {
      if (stage === 'remove' && !s.depsCleared) return s
      if (stage === 'verify') {
        const removed = s.stages.has('remove')
        return {
          ...s,
          scan: removed ? 'gone' : 'present',
          stages: removed ? new Set([...s.stages, 'verify']) : s.stages,
        }
      }
      if (stage === 'log' && !s.stages.has('verify')) return s
      return { ...s, stages: new Set([...s.stages, stage]) }
    })

  const fullyDone = (s: St) => STAGES.every((st) => s.stages.has(st.id))
  const doneCount = useMemo(() => ASSETS.filter((a) => fullyDone(state[a.id])).length, [state])

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4">
        <h3 className="mb-1 font-semibold text-foreground">Decommission the classical estate</h3>
        <p className="text-sm text-muted-foreground">
          {ASSETS.length} quantum-vulnerable assets, worst-risk first. Each must reach{' '}
          <strong>verify removed</strong> — the old key gone, not just PQC added. You can&apos;t{' '}
          <em>remove</em> until dependents are migrated.
        </p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded bg-muted">
          <div
            className="h-full bg-status-success transition-all"
            style={{ width: `${(doneCount / ASSETS.length) * 100}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {doneCount}/{ASSETS.length} retired & verified
        </p>
      </div>

      {ASSETS.map((asset) => {
        const s = state[asset.id]
        return (
          <div key={asset.id} className="glass-panel p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-sm font-medium text-foreground">{asset.name}</span>
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  {asset.currentAlgorithm}
                </span>
              </div>
              <span className="shrink-0 text-xs text-status-warning">risk {asset.riskScore}/5</span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {STAGES.map((stage, i) => {
                const on = s.stages.has(stage.id)
                const gate =
                  (stage.id === 'remove' && !s.depsCleared) ||
                  (stage.id === 'log' && !s.stages.has('verify')) ||
                  (i > 0 && !s.stages.has(STAGES[i - 1].id))
                return (
                  <Button
                    key={stage.id}
                    variant="outline"
                    size="sm"
                    disabled={!on && gate}
                    onClick={() => advance(asset.id, stage.id)}
                    className={on ? 'border-status-success/40 text-status-success' : ''}
                  >
                    {on ? (
                      <CheckCircle2 size={13} className="mr-1" />
                    ) : (
                      <Circle size={13} className="mr-1" />
                    )}
                    {stage.label}
                  </Button>
                )
              })}
              {fullyDone(s) && <ShieldOff size={14} className="text-status-success" />}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
              <label className="flex cursor-pointer items-center gap-1.5 text-muted-foreground">
                <input
                  type="checkbox"
                  checked={s.depsCleared}
                  onChange={(e) =>
                    patch(asset.id, (st) => ({ ...st, depsCleared: e.target.checked }))
                  }
                />
                Dependents migrated
              </label>
              {s.scan === 'present' && (
                <span className="flex items-center gap-1 text-status-error">
                  <ScanLine size={12} /> re-scan: STILL present — not removed
                </span>
              )}
              {s.scan === 'gone' && (
                <span className="flex items-center gap-1 text-status-success">
                  <ScanLine size={12} /> re-scan: confirmed gone
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

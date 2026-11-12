// SPDX-License-Identifier: AGPL-3.0-only
import { useMemo, useState } from 'react'
import { CheckCircle2, Circle, ScanLine, ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SAMPLE_INVENTORY } from '@/data/cryptoEstate'
import { observedAbsent, retirementObservation } from './DecommissionChecklist.observations'

/**
 * Decommission Tracker — work the classical estate (the shared
 * @/data/cryptoEstate, quantum-vulnerable assets, worst-risk first) through
 * deprecate → remove → verify-removed → log. "Remove" is gated on clearing
 * dependents. The observation step reads separately authored fictional records, including a
 * dependent-copy failure. No real system is scanned or changed.
 */

type StageId = 'deprecate' | 'remove' | 'verify' | 'log'
const STAGES: { id: StageId; label: string }[] = [
  { id: 'deprecate', label: 'Deprecate' },
  { id: 'remove', label: 'Remove' },
  { id: 'verify', label: 'Read initial sample observation' },
  { id: 'log', label: 'Log' },
]

const ASSETS = SAMPLE_INVENTORY.filter((a) => a.quantumVulnerable).sort(
  (x, y) => y.riskScore - x.riskScore
)

interface St {
  stages: Set<StageId>
  depsCleared: boolean
  scan: 'unscanned' | 'present' | 'gone' | 'unavailable'
  cleanup: boolean
  observation: 'initial' | 'followup' | null
}
const initial = (): Record<string, St> =>
  Object.fromEntries(
    ASSETS.map((a) => [
      a.id,
      {
        stages: new Set<StageId>(),
        depsCleared: false,
        scan: 'unscanned',
        cleanup: false,
        observation: null,
      },
    ])
  )

export function DecommissionChecklist() {
  const [state, setState] = useState<Record<string, St>>(initial)

  const patch = (id: string, fn: (s: St) => St) => setState((p) => ({ ...p, [id]: fn(p[id]) })) // eslint-disable-line security/detect-object-injection

  const advance = (id: string, stage: StageId) =>
    patch(id, (s) => {
      if (stage === 'remove' && !s.depsCleared) return s
      if (stage === 'verify') {
        if (!s.stages.has('remove')) return s
        const observation = retirementObservation(id)
        const absent = observedAbsent(observation)
        const stages = new Set(s.stages)
        stages.delete('verify')
        stages.delete('log')
        if (absent) stages.add('verify')
        return {
          ...s,
          scan: !observation ? 'unavailable' : absent ? 'gone' : 'present',
          stages,
          observation: 'initial',
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
        <h3 className="mb-1 font-semibold text-foreground">Decommissioning observation exercise</h3>
        <p className="text-sm text-muted-foreground">
          Explore the retirement stages for {ASSETS.length} fictional assets, ordered by their
          sample risk scores. Mark sample dependents migrated before selecting <em>Remove</em>.
        </p>
        <p role="note" className="mt-2 text-sm text-muted-foreground">
          Read independently authored fictional observation records after marking the removal
          action. A dependent copy can remain even when Remove is selected. This exercise does not
          scan or delete real keys. In production, use discovery and monitoring tools to check for
          remaining keys, trusted public keys and dependent copies; record what was checked and any
          remaining exceptions before claiming retirement.
        </p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded bg-muted">
          <div
            className="h-full bg-status-success transition-all"
            style={{ width: `${(doneCount / ASSETS.length) * 100}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {doneCount}/{ASSETS.length} sample retirements checked within supplied observation scope
        </p>
      </div>

      {ASSETS.map((asset) => {
        const s = state[asset.id]
        return (
          <section key={asset.id} aria-label={asset.name} className="glass-panel p-3">
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
                const on =
                  s.stages.has(stage.id) && (stage.id !== 'verify' || s.observation === 'initial')
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
                    patch(asset.id, (st) =>
                      e.target.checked
                        ? { ...st, depsCleared: true }
                        : {
                            stages: new Set(st.stages.has('deprecate') ? ['deprecate'] : []),
                            depsCleared: false,
                            scan: 'unscanned',
                            cleanup: false,
                            observation: null,
                          }
                    )
                  }
                />
                Sample dependents marked migrated
              </label>
              {s.scan === 'present' && (
                <span className="flex items-center gap-1 text-status-error">
                  <ScanLine size={12} /> Sample observation: dependent copy still present — not
                  complete
                </span>
              )}
              {s.scan === 'unavailable' && (
                <span role="status">Sample observation unavailable — not complete</span>
              )}
              {s.scan === 'gone' && (
                <span className="flex items-center gap-1 text-status-success">
                  <ScanLine size={12} /> Sample observation: absent within the supplied scope
                </span>
              )}
            </div>
            {s.observation &&
              (() => {
                const record = retirementObservation(asset.id, s.observation === 'followup')
                return record ? (
                  <div className="mt-3 text-xs space-y-1" aria-label="Sample observation record">
                    <p>Record: {record.id}</p>
                    <p>Scope: {record.scope}</p>
                    <p>Method: {record.method}</p>
                    <p>Primary use observed: {record.primaryPresent ? 'Present' : 'Absent'}</p>
                    <p>
                      Dependent copies observed:{' '}
                      {record.dependentCopies.length
                        ? record.dependentCopies.join('; ')
                        : 'None in this supplied scope'}
                    </p>
                  </div>
                ) : null
              })()}
            {asset.id === 'sw-batch-signer' && s.stages.has('remove') && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={s.scan !== 'present' || s.cleanup}
                  onClick={() => patch(asset.id, (st) => ({ ...st, cleanup: true }))}
                >
                  Perform sample dependent-copy cleanup
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!s.cleanup}
                  className={
                    s.observation === 'followup' && s.stages.has('verify')
                      ? 'border-status-success/40 text-status-success'
                      : ''
                  }
                  onClick={() =>
                    patch(asset.id, (st) => {
                      const record = retirementObservation(asset.id, true)
                      const absent = observedAbsent(record)
                      const stages = new Set(st.stages)
                      stages.delete('verify')
                      stages.delete('log')
                      if (absent) stages.add('verify')
                      return {
                        ...st,
                        stages,
                        scan: !record ? 'unavailable' : absent ? 'gone' : 'present',
                        observation: 'followup',
                      }
                    })
                  }
                >
                  {s.observation === 'followup' && s.stages.has('verify') && (
                    <CheckCircle2 size={13} className="mr-1" />
                  )}
                  Read follow-up sample observation
                </Button>
                {s.cleanup && (
                  <p className="w-full text-xs">
                    Sample cleanup action recorded. Read the separate follow-up observation; the
                    action alone does not verify absence.
                  </p>
                )}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() =>
                patch(asset.id, () => ({
                  stages: new Set(),
                  depsCleared: false,
                  scan: 'unscanned',
                  cleanup: false,
                  observation: null,
                }))
              }
            >
              Reset sample asset
            </Button>
          </section>
        )
      })}
    </div>
  )
}

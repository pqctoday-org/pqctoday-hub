// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { CheckCircle2, DatabaseBackup, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClaimLine } from '../components/ClaimLine'
import {
  evaluateW16Drill,
  W16_SCENARIOS,
  type DrScenarioId,
  type W16Choice,
} from '../data/lifecycleOpsData'

interface Props {
  initialPreset?: string
}

export const DrDrillWorkshop: React.FC<Props> = ({ initialPreset }) => {
  const defaultScenario: DrScenarioId =
    initialPreset === 'hsm-site-loss' ||
    initialPreset === 'mpc-vendor-outage' ||
    initialPreset === 'poisoned-backup'
      ? initialPreset
      : 'hsm-site-loss'

  const [choice, setChoice] = useState<W16Choice>({
    scenarioId: defaultScenario,
    backupSource:
      defaultScenario === 'poisoned-backup'
        ? 'known-good-pre-incident'
        : defaultScenario === 'mpc-vendor-outage'
          ? 'vendor-recovery-kit'
          : 'latest-backup',
    restoreOrder: 'config-and-inventory-first',
    quorumPresent: true,
    reconcileChainBeforeResume: true,
  })

  const meta = W16_SCENARIOS.find((s) => s.id === choice.scenarioId) ?? W16_SCENARIOS[0]
  const result = evaluateW16Drill(choice)

  return (
    <div className="space-y-6">
      <div className="glass-panel p-5 space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <DatabaseBackup size={16} className="text-primary" aria-hidden="true" />
          W16: Select Disaster Recovery Scenario &amp; Restore Procedure
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {W16_SCENARIOS.map((sc) => (
            <Button
              key={sc.id}
              variant={choice.scenarioId === sc.id ? 'default' : 'outline'}
              onClick={() => setChoice((prev) => ({ ...prev, scenarioId: sc.id }))}
              className="h-auto p-3 flex flex-col items-start text-left whitespace-normal"
            >
              <span className="text-xs font-bold">{sc.title}</span>
              <span className="text-[10px] opacity-80 mt-0.5">{sc.rtoTarget}</span>
            </Button>
          ))}
        </div>

        <div className="p-3 rounded-lg bg-muted/30 border border-border text-xs space-y-1">
          <p className="text-foreground/90">{meta.brief}</p>
          <p className="text-muted-foreground">
            <strong>Targets:</strong> {meta.rtoTarget} · {meta.rpoTarget}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
            <span className="font-semibold text-foreground block">1. Backup Source</span>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'latest-backup', label: 'Latest automated backup' },
                  { id: 'known-good-pre-incident', label: 'Known-good pre-incident + replay' },
                  { id: 'vendor-recovery-kit', label: 'Client-held recovery kit' },
                ] as const
              ).map((opt) => (
                <Button
                  key={opt.id}
                  size="sm"
                  variant={choice.backupSource === opt.id ? 'default' : 'outline'}
                  onClick={() => setChoice((prev) => ({ ...prev, backupSource: opt.id }))}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
            <span className="font-semibold text-foreground block">2. Restore Order</span>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={
                  choice.restoreOrder === 'config-and-inventory-first' ? 'default' : 'outline'
                }
                onClick={() =>
                  setChoice((prev) => ({ ...prev, restoreOrder: 'config-and-inventory-first' }))
                }
              >
                Validate config &amp; inventory before keys
              </Button>
              <Button
                size="sm"
                variant={choice.restoreOrder === 'keys-first' ? 'default' : 'outline'}
                onClick={() => setChoice((prev) => ({ ...prev, restoreOrder: 'keys-first' }))}
              >
                Restore keys immediately
              </Button>
            </div>
          </div>

          <label className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/20 cursor-pointer">
            <input
              type="checkbox"
              checked={choice.quorumPresent}
              onChange={() =>
                setChoice((prev) => ({ ...prev, quorumPresent: !prev.quorumPresent }))
              }
            />
            <span>Enforce live-key quorum for backup decryption &amp; restore</span>
          </label>

          <label className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/20 cursor-pointer">
            <input
              type="checkbox"
              checked={choice.reconcileChainBeforeResume}
              onChange={() =>
                setChoice((prev) => ({
                  ...prev,
                  reconcileChainBeforeResume: !prev.reconcileChainBeforeResume,
                }))
              }
            />
            <span>Reconcile nonces, spend counters &amp; in-flight txs before resuming</span>
          </label>
        </div>
      </div>

      <div
        className={`p-5 rounded-xl border space-y-3 text-xs ${
          result.verdict === 'safe'
            ? 'bg-status-success/10 border-status-success/30'
            : 'bg-status-warning/10 border-status-warning/30'
        }`}
      >
        <div className="flex items-center gap-2 font-bold text-foreground text-sm">
          {result.verdict === 'safe' ? (
            <CheckCircle2 size={16} className="text-status-success shrink-0" aria-hidden="true" />
          ) : (
            <ShieldAlert size={16} className="text-status-warning shrink-0" aria-hidden="true" />
          )}
          <span>{result.rtoAssessment}</span>
        </div>
        <p className="text-foreground/90">
          <strong>Attacker foothold risk:</strong> {result.attackerFootholdRisk}
        </p>
        <p className="text-foreground/90">
          <strong>Configuration rollback risk:</strong> {result.configRollbackRisk}
        </p>
        <p className="text-muted-foreground">
          <strong>Clones, cloud copies &amp; findings:</strong> {result.undiscoveredCopiesNote}
        </p>
        <ClaimLine id={meta.claimId} />
      </div>
    </div>
  )
}

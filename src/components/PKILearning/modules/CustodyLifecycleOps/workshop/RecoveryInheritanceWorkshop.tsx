// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { CheckCircle2, LifeBuoy, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  evaluateW10Plan,
  type HolderProfileId,
  type RecoveryMechanismId,
  type W10PlanConfig,
} from '../data/lifecycleOpsData'

const HOLDERS: { id: HolderProfileId; label: string; summary: string }[] = [
  {
    id: 'custody-desk',
    label: 'Institutional Custody Desk',
    summary: 'Multi-operator quorum with regulated continuity.',
  },
  {
    id: 'family-office',
    label: 'Family Office',
    summary: 'Multi-generational treasury balancing duress and inheritance.',
  },
  {
    id: 'individual',
    label: 'Individual Self-Custody',
    summary: 'Single-owner vault needing safe heir handover.',
  },
]

const MECHANISMS: { id: RecoveryMechanismId; label: string }[] = [
  { id: 'slip39-shares', label: 'SLIP-0039 Shamir Shares' },
  { id: 'hsm-quorum-backup', label: 'HSM M-of-N Backup Cards (Vendor Pattern)' },
  { id: 'vendor-recovery-kit', label: 'Client-Held MPC Recovery Kit (Vendor Pattern)' },
  { id: 'miniscript-timelock', label: 'Bitcoin Timelock + Miniscript (BIP-65/68/379)' },
  { id: 'smart-account-guardians', label: 'Smart-Account Guardians + Delay (Safe/ERC-4337)' },
]

export const RecoveryInheritanceWorkshop: React.FC = () => {
  const [config, setConfig] = useState<W10PlanConfig>({
    holder: 'family-office',
    mechanism: 'miniscript-timelock',
    delayWindow: '90-days-plus',
    independentGuardianChannels: true,
    rehearsedSchedule: true,
    heirPath: 'sealed-quorum-or-timelock',
  })

  const evaluation = evaluateW10Plan(config)

  return (
    <div className="space-y-6">
      <div className="glass-panel p-5 space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <LifeBuoy size={16} className="text-primary" aria-hidden="true" />
          W10: Configure Holder Profile, Recovery Mechanism &amp; Heir Path
        </h3>
        <p className="text-xs text-muted-foreground">
          Classical disruption events only (post-quantum horizon planning is in Module B, optional
          further reading). Inheritance options teach technical patterns only, not legal or estate
          advice.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {HOLDERS.map((h) => (
            <Button
              key={h.id}
              variant={config.holder === h.id ? 'default' : 'outline'}
              onClick={() => setConfig((prev) => ({ ...prev, holder: h.id }))}
              className="h-auto p-3 flex flex-col items-start text-left whitespace-normal"
            >
              <span className="text-xs font-bold">{h.label}</span>
              <span className="text-[11px] opacity-80 mt-0.5">{h.summary}</span>
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {MECHANISMS.map((m) => (
            <Button
              key={m.id}
              variant={config.mechanism === m.id ? 'default' : 'outline'}
              onClick={() => setConfig((prev) => ({ ...prev, mechanism: m.id }))}
              className="h-auto py-2 px-3 text-xs justify-start text-left whitespace-normal"
            >
              {m.label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
            <span className="font-semibold text-foreground block">
              Recovery Delay &amp; Veto Window
            </span>
            <div className="flex flex-wrap gap-2">
              {(['none', '7-days', '90-days-plus'] as const).map((d) => (
                <Button
                  key={d}
                  size="sm"
                  variant={config.delayWindow === d ? 'default' : 'outline'}
                  onClick={() => setConfig((prev) => ({ ...prev, delayWindow: d }))}
                >
                  {d === 'none'
                    ? 'No delay'
                    : d === '7-days'
                      ? '7-day delay + veto'
                      : '90+ day timelock'}
                </Button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
            <span className="font-semibold text-foreground block">Heir / Succession Path</span>
            <div className="flex flex-wrap gap-2">
              {(['none', 'seed-in-will', 'sealed-quorum-or-timelock'] as const).map((hp) => (
                <Button
                  key={hp}
                  size="sm"
                  variant={config.heirPath === hp ? 'default' : 'outline'}
                  onClick={() => setConfig((prev) => ({ ...prev, heirPath: hp }))}
                >
                  {hp === 'none'
                    ? 'None'
                    : hp === 'seed-in-will'
                      ? 'Seed in will'
                      : 'Sealed quorum / timelock'}
                </Button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/20 cursor-pointer">
            <input
              type="checkbox"
              checked={config.independentGuardianChannels}
              onChange={() =>
                setConfig((prev) => ({
                  ...prev,
                  independentGuardianChannels: !prev.independentGuardianChannels,
                }))
              }
            />
            <span>Guardians verified on independent out-of-band channels</span>
          </label>

          <label className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/20 cursor-pointer">
            <input
              type="checkbox"
              checked={config.rehearsedSchedule}
              onChange={() =>
                setConfig((prev) => ({ ...prev, rehearsedSchedule: !prev.rehearsedSchedule }))
              }
            />
            <span>Scheduled recovery rehearsals logged with canary keys</span>
          </label>
        </div>
      </div>

      {/* 5-event evaluation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {evaluation.outcomes.map((o) => (
          <div
            key={o.eventId}
            className={`p-4 rounded-xl border space-y-1 ${
              o.status === 'handled'
                ? 'bg-status-success/10 border-status-success/30'
                : 'bg-status-warning/10 border-status-warning/30'
            }`}
          >
            <div className="flex items-center gap-2">
              {o.status === 'handled' ? (
                <CheckCircle2
                  size={15}
                  className="text-status-success shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <ShieldAlert
                  size={15}
                  className="text-status-warning shrink-0"
                  aria-hidden="true"
                />
              )}
              <h4 className="text-xs font-bold text-foreground">{o.eventLabel}</h4>
            </div>
            <p className="text-xs text-muted-foreground">{o.detail}</p>
          </div>
        ))}
      </div>

      {/* SPOFs and G1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="glass-panel p-4 space-y-2">
          <h4 className="font-bold text-foreground">Single Points of Failure Flagged</h4>
          {evaluation.singlePointsOfFailure.length === 0 ? (
            <p className="text-status-success">
              No major single points of failure flagged in this sample plan.
            </p>
          ) : (
            <ul className="list-disc pl-4 space-y-1 text-status-warning">
              {evaluation.singlePointsOfFailure.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="glass-panel p-4 space-y-2">
          <h4 className="font-bold text-foreground">Rule G1 Authority Assumptions</h4>
          <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
            {evaluation.g1Assumptions.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

// SPDX-License-Identifier: GPL-3.0-only
import { FileText, AlertTriangle, X } from 'lucide-react'
import { WAVES_FALLBACK } from './waves'
import { DECISIONS } from '@/data/migrationAssets'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { Button } from '../../ui/button'
import { Pill, DECISION_ICON, TONE_DOT } from './workbenchUi'
import type { MigrationPosture } from './useMigrationPlan'
import { downloadPlanCbom } from './cbomExport'

interface PlanTabProps {
  posture: MigrationPosture
  onGoToReplace: () => void
}

export function PlanTab({ posture, onGoToReplace }: PlanTabProps) {
  const choice = useMigrateSelectionStore((s) => s.choice)
  const removeFromPlan = useMigrateSelectionStore((s) => s.removeFromPlan)
  const chooseProduct = useMigrateSelectionStore((s) => s.chooseProduct)
  const plan = useMigrateSelectionStore((s) => s.plan)

  // Flatten planned foundation domains → one entry per selected product.
  const foundationItems = posture.foundations.flatMap((f) =>
    (choice[f.id] ?? []).map((product) => ({ id: f.id, label: f.label, product }))
  )

  if (posture.plannedAssets.length === 0 && foundationItems.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center">
        <p className="text-sm font-semibold text-foreground">Nothing in your plan yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Pick the cryptography you run to build a sequenced migration plan.
        </p>
        <Button variant="outline" size="sm" className="mt-3" onClick={onGoToReplace}>
          ← Add what you run
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        Your assets, sequenced by exposure — <strong>external-facing traffic first</strong>. Each
        carries its chosen product and CNSA deadline.
      </p>

      {posture.gaps.length > 0 && (
        <div className="rounded-xl border border-status-error/25 bg-status-error/[0.07] p-3">
          <div className="flex items-center gap-2 text-status-error">
            <AlertTriangle size={16} aria-hidden />
            <span className="text-sm font-semibold">
              {posture.gaps.length} asset{posture.gaps.length > 1 ? 's have' : ' has'} no GA
              quantum-safe product yet
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {posture.gaps.map((g) => g.label).join(', ')} — deploy a crypto gateway with a hard
            sunset date. Mitigation is never permanent.
          </p>
        </div>
      )}

      {posture.waves.map((group) => {
        const meta = WAVES_FALLBACK[group.wave]
        return (
          <div key={group.wave} className="overflow-hidden rounded-xl border border-border">
            <div className="flex items-center gap-2.5 bg-muted/40 px-3 py-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold ${meta.tileClass}`}
              >
                {group.wave}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-foreground">{meta.title}</span>
                <span className="block text-[11px] text-muted-foreground">{meta.subtitle}</span>
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {group.assets.length} in plan
              </span>
            </div>
            <div className="flex flex-col divide-y divide-border">
              {group.assets.map((asset) => {
                const decision = DECISIONS[asset.decision]
                const chosen = choice[asset.id] ?? []
                return (
                  <div key={asset.id} className="flex items-center gap-2.5 px-3 py-2.5">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${TONE_DOT[decision.tone]}`}
                      title={decision.label}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-semibold text-foreground">{asset.label}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          → {asset.target}
                        </span>
                      </span>
                      <span className="block text-[11px] text-muted-foreground">
                        {chosen.length > 0
                          ? `Chosen: ${chosen.join(', ')}`
                          : asset.decision === 'mitigate'
                            ? 'No product — mitigate'
                            : 'No product chosen yet'}
                      </span>
                    </span>
                    <Pill tone={decision.tone} icon={DECISION_ICON[asset.decision]}>
                      {decision.label}
                    </Pill>
                    <span className="font-mono text-[11px] text-status-warning">
                      {asset.cnsaYear}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromPlan(asset.id)}
                      aria-label={`Remove ${asset.label} from plan`}
                      className="h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {foundationItems.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="flex items-center gap-2.5 bg-muted/40 px-3 py-2">
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-foreground">
                Foundations &amp; infrastructure
              </span>
              <span className="block text-[11px] text-muted-foreground">
                Cross-cutting building blocks &amp; tooling — no fixed wave
              </span>
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {foundationItems.length} in plan
            </span>
          </div>
          {/* Grouped by sub-category (domain), each with its chosen products. */}
          <div className="flex flex-col divide-y divide-border">
            {posture.foundations.map((f) => {
              const products = choice[f.id] ?? []
              if (products.length === 0) return null
              return (
                <div key={f.id}>
                  <div className="flex items-center justify-between bg-muted/20 px-3 py-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {f.label}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {products.length}
                    </span>
                  </div>
                  <div className="flex flex-col divide-y divide-border/50">
                    {products.map((product) => (
                      <div
                        key={`${f.id}::${product}`}
                        className="flex items-center gap-2.5 py-2.5 pl-6 pr-3"
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary/60"
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1 text-sm font-semibold text-foreground">
                          {product}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => chooseProduct(f.id, product)}
                          aria-label={`Remove ${product} from plan`}
                          className="h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          variant="gradient"
          size="sm"
          onClick={() =>
            downloadPlanCbom({ planIds: plan, choice, timestamp: new Date().toISOString() })
          }
        >
          <FileText size={14} /> Export plan + CBOM
        </Button>
      </div>
    </div>
  )
}

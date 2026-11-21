// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { Link } from 'react-router'
import { Shield, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DEFENCE_OPTIONS, SYSTEM_PROFILES } from '../data/defencePlannerData'
import { ClaimLine } from '../components/ClaimLine'

export const DefencePlanner: React.FC = () => {
  const [profileId, setProfileId] = useState<string>(SYSTEM_PROFILES[0].id)
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set(['push-protection-oidc', 'hsm-immutable-policy'])
  )

  const profile = SYSTEM_PROFILES.find((p) => p.id === profileId) ?? SYSTEM_PROFILES[0]

  const toggleOption = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const coveredRecommended = profile.recommendedOptionIds.filter((id) => selectedIds.has(id))
  const missingRecommended = DEFENCE_OPTIONS.filter(
    (opt) => profile.recommendedOptionIds.includes(opt.id) && !selectedIds.has(opt.id)
  )

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gradient">Step 5: Layered Defence Planner</h3>
            <p className="text-sm text-muted-foreground">
              Choose one of the three sample systems and select controls across layers to inspect
              which evidenced AI-era risk deltas are mitigated and what residual risk remains.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Sample system profiles">
          {SYSTEM_PROFILES.map((p) => (
            <Button
              key={p.id}
              type="button"
              variant={p.id === profile.id ? 'gradient' : 'outline'}
              onClick={() => setProfileId(p.id)}
              className="text-xs"
              aria-pressed={p.id === profile.id}
            >
              {p.name}
            </Button>
          ))}
        </div>

        <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
          <p className="text-sm font-semibold text-foreground">{profile.name}</p>
          <p className="text-xs text-muted-foreground">{profile.summary}</p>
          <p className="text-xs text-foreground/90">
            <strong>Primary exposure profile:</strong> {profile.baselineRiskNote}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DEFENCE_OPTIONS.map((opt) => {
            const active = selectedIds.has(opt.id)
            const recommended = profile.recommendedOptionIds.includes(opt.id)
            return (
              <Button
                key={opt.id}
                type="button"
                variant="ghost"
                onClick={() => toggleOption(opt.id)}
                aria-pressed={active}
                className={`h-auto w-full flex-col items-stretch justify-start whitespace-normal text-left p-3.5 rounded-lg border transition-colors space-y-1.5 ${
                  active
                    ? 'bg-primary/10 border-primary/50'
                    : 'bg-card border-border hover:bg-muted/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 w-full">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                    {opt.layer}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {recommended ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-status-info/15 text-status-info border border-status-info/30">
                        Priority for system
                      </span>
                    ) : null}
                    {active ? <CheckCircle2 size={14} className="text-status-success" /> : null}
                  </div>
                </div>
                <p className="text-xs font-semibold text-foreground">{opt.controlLabel}</p>
                <p className="text-[11px] text-muted-foreground">{opt.addressesDelta}</p>
              </Button>
            )
          })}
        </div>

        <div className="p-4 rounded-lg bg-card border border-border space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-foreground">
              Residual Risk &amp; Coverage Summary ({coveredRecommended.length}/
              {profile.recommendedOptionIds.length} priority layers selected)
            </h4>
          </div>

          {missingRecommended.length > 0 ? (
            <div className="p-3 rounded bg-status-warning/10 border border-status-warning/30 text-xs space-y-1">
              <p className="font-semibold text-foreground">Unaddressed Priority Layers</p>
              <ul className="list-disc pl-4 text-muted-foreground space-y-0.5">
                {missingRecommended.map((m) => (
                  <li key={m.id}>
                    <strong>{m.layer}:</strong> {m.controlLabel}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-3 rounded bg-status-success/10 border border-status-success/30 text-xs text-foreground">
              All priority layers for {profile.name} are selected. Review the residual operational
              assumptions below—controls reduce exposure but never replace runtime verification.
            </div>
          )}

          <div className="space-y-2">
            {DEFENCE_OPTIONS.filter((o) => selectedIds.has(o.id)).map((opt) => (
              <div
                key={opt.id}
                className="text-xs text-muted-foreground border-t border-border/50 pt-2"
              >
                <p>
                  <strong className="text-foreground">{opt.layer} residual boundary:</strong>{' '}
                  {opt.residualRisk}
                </p>
                {opt.relatedLink ? (
                  <p className="mt-1">
                    Deep dive:{' '}
                    <Link to={opt.relatedLink.to} className="text-primary hover:underline">
                      {opt.relatedLink.label}
                    </Link>
                    {opt.plainTextFurtherReading ? ` · ${opt.plainTextFurtherReading}` : ''}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <ClaimLine id="AI-x" chip="Executive Verdict & Layer Synthesis" />
      </section>
    </div>
  )
}

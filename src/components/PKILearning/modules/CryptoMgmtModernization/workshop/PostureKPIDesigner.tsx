// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { POSTURE_KPIS, type KpiAudience } from '../data/postureKPIs'
import { PILLARS, type PillarId } from '../data/maturityModel'

const AUDIENCE_LABELS: Record<KpiAudience, string> = {
  board: 'Board',
  cio: 'CIO',
  ciso: 'CISO',
  architect: 'Architect',
  ops: 'Ops',
}

export const PostureKPIDesigner: React.FC = () => {
  const [selected, setSelected] = useState<string[]>([
    'cbom-coverage-certs',
    'cert-expiry-risk-30d',
    'auto-renew-pct',
    'fips-coverage',
    'cmvp-freshness',
    'policy-drift-rate',
  ])
  const [audience, setAudience] = useState<KpiAudience>('board')

  const toggle = (id: string) =>
    setSelected((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]))

  const filteredByAudience = useMemo(
    () => POSTURE_KPIS.filter((k) => k.audience.includes(audience)),
    [audience]
  )

  const selectedForPreview = useMemo(
    () => POSTURE_KPIS.filter((k) => selected.includes(k.id)),
    [selected]
  )

  const byPillar = useMemo(() => {
    const out: Record<PillarId, typeof POSTURE_KPIS> = {
      inventory: [],
      governance: [],
      lifecycle: [],
      observability: [],
      assurance: [],
    }
    POSTURE_KPIS.forEach((k) => out[k.pillar].push(k))
    return out
  }, [])

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Pick the KPIs you want to track. Flip the audience filter to see what a board vs. ops
        dashboard emphasizes — selected KPIs are combined into a live preview below.
      </p>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted-foreground">Audience filter:</span>
        {(Object.keys(AUDIENCE_LABELS) as KpiAudience[]).map((a) => (
          <Button
            key={a}
            variant={audience === a ? 'gradient' : 'outline'}
            onClick={() => setAudience(a)}
            className="text-xs"
          >
            {AUDIENCE_LABELS[a]}
          </Button>
        ))}
        <span className="text-[11px] text-muted-foreground ml-2">
          ({filteredByAudience.length} KPIs relevant to {AUDIENCE_LABELS[audience]})
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PILLARS.map((p) => (
          <div key={p.id} className="bg-muted/40 rounded-lg p-3 border border-border">
            <div className="font-bold text-sm text-foreground mb-2">{p.label}</div>
            <div className="space-y-2">
              {byPillar[p.id].map((k) => {
                const hidden = !k.audience.includes(audience)
                const inputId = `cmm-kpi-${k.id}`
                return (
                  <label
                    key={k.id}
                    htmlFor={inputId}
                    className={`flex items-start gap-2 text-xs cursor-pointer rounded p-1 hover:bg-muted/40 ${
                      hidden ? 'opacity-40' : ''
                    }`}
                  >
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={selected.includes(k.id)}
                      onChange={() => toggle(k.id)}
                      className="mt-0.5 accent-primary"
                      aria-label={k.name}
                    />
                    <div className="flex-1">
                      <div className="font-bold text-foreground">{k.name}</div>
                      <div className="text-[10px] text-muted-foreground">{k.description}</div>
                      <div className="text-[10px] text-muted-foreground italic mt-0.5">
                        Example: {k.example}
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-background rounded-lg p-4 border-2 border-primary/30">
        <div className="flex justify-between items-center mb-3">
          <div>
            <div className="font-bold text-foreground">CPM Posture Dashboard — Preview</div>
            <div className="text-[11px] text-muted-foreground">
              Filtered for {AUDIENCE_LABELS[audience]} · {selectedForPreview.length} KPIs
            </div>
          </div>
          <Button variant="outline" onClick={() => setSelected([])} className="text-xs">
            Clear
          </Button>
        </div>
        {selectedForPreview.length === 0 ? (
          <p className="text-xs text-muted-foreground italic p-4 text-center">
            Pick at least one KPI above.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {selectedForPreview.map((k) => (
              <div key={k.id} className="bg-muted/40 rounded-lg p-3 border border-border">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {PILLARS.find((p) => p.id === k.pillar)?.label}
                </div>
                <div className="text-xs font-bold text-foreground mt-1">{k.name}</div>
                <div className="text-lg font-bold text-primary mt-1">{k.example}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

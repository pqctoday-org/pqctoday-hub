// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useState } from 'react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Button } from '@/components/ui/button'
import {
  PILLARS,
  MATURITY_LEVEL_LABELS,
  type MaturityLevel,
  type PillarId,
} from '../data/maturityModel'

type Scores = Record<PillarId, MaturityLevel>

const initialScores = (): Scores =>
  PILLARS.reduce((acc, p) => ({ ...acc, [p.id]: 1 as MaturityLevel }), {} as Scores)

export const MaturityAssessment: React.FC = () => {
  const [scores, setScores] = useState<Scores>(initialScores())

  const setScore = (id: PillarId, level: MaturityLevel) => setScores((s) => ({ ...s, [id]: level }))

  const chartData = useMemo(
    () => PILLARS.map((p) => ({ pillar: p.label, score: scores[p.id], fullMark: 5 })),
    [scores]
  )

  const average = useMemo(
    () => PILLARS.reduce((sum, p) => sum + scores[p.id], 0) / PILLARS.length,
    [scores]
  )

  const weakest = useMemo(() => {
    const sorted = [...PILLARS].sort((a, b) => scores[a.id] - scores[b.id])
    return sorted[0]
  }, [scores])

  const nextMilestone = useMemo(() => {
    if (average < 2)
      return 'Establish a unified CBOM and a baseline cert-expiry dashboard within 90 days.'
    if (average < 3)
      return 'Document policy, roll out ACME for public TLS, and subscribe to CMVP change notices.'
    if (average < 4)
      return 'Automate cert renewal end-to-end, instrument SIEM drift alerts, launch FIPS-freshness KPI.'
    return 'Drive policy-as-code enforcement, continuous CMVP/ACVP sync, and board-level attestation exports.'
  }, [average])

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Rate your organization from 1 (Ad-hoc) to 5 (Optimized) on each pillar. Re-run this every
        annual PDCA cycle — the radar chart below makes year-over-year gains visible.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {PILLARS.map((p) => (
            <div key={p.id} className="bg-muted/40 rounded-lg p-4 border border-border">
              <div className="flex justify-between items-start gap-3 mb-2">
                <div>
                  <div className="font-bold text-foreground">{p.label}</div>
                  <p className="text-xs text-muted-foreground mt-1">{p.question}</p>
                </div>
                <div className="text-sm font-bold text-primary whitespace-nowrap">
                  L{scores[p.id]} · {MATURITY_LEVEL_LABELS[scores[p.id]]}
                </div>
              </div>
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <Button
                    key={lvl}
                    variant={scores[p.id] === lvl ? 'gradient' : 'outline'}
                    onClick={() => setScore(p.id, lvl as MaturityLevel)}
                    className="flex-1 py-1 text-xs font-bold"
                  >
                    {lvl}
                  </Button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground italic">
                {p.indicators[scores[p.id]]}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-muted/40 rounded-lg p-4 border border-border">
            <div className="font-bold text-foreground mb-2">CPM Posture Radar</div>
            <div className="w-full h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={chartData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="pillar" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} tickCount={6} />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.35}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="flex justify-between items-center mb-2">
              <div className="font-bold text-foreground">Overall score</div>
              <div className="text-xl font-bold text-primary">{average.toFixed(1)} / 5.0</div>
            </div>
            <div className="text-xs text-muted-foreground mb-3">
              Weakest pillar: <strong className="text-foreground">{weakest.label}</strong> (L
              {scores[weakest.id]} · {MATURITY_LEVEL_LABELS[scores[weakest.id]]})
            </div>
            <div className="text-sm font-bold text-accent mb-1">Recommended next milestone</div>
            <p className="text-xs text-foreground/80">{nextMilestone}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

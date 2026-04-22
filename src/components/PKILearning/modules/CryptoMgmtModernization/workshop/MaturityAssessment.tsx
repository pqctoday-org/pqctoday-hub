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
  Legend,
} from 'recharts'
import { Button } from '@/components/ui/button'
import {
  PILLARS,
  MATURITY_LEVEL_LABELS,
  ASSET_CLASSES,
  ASSET_CLASS_LABELS,
  ASSET_CLASS_META,
  type MaturityLevel,
  type PillarId,
  type AssetClass,
} from '../data/maturityModel'

type AssetScores = Record<AssetClass, MaturityLevel>
type Scores = Record<PillarId, AssetScores>

const initialScores = (): Scores =>
  PILLARS.reduce(
    (acc, p) => ({
      ...acc,
      [p.id]: ASSET_CLASSES.reduce(
        (a, ac) => ({ ...a, [ac]: 1 as MaturityLevel }),
        {} as AssetScores
      ),
    }),
    {} as Scores
  )

export const MaturityAssessment: React.FC = () => {
  const [scores, setScores] = useState<Scores>(initialScores())

  const setScore = (pillarId: PillarId, ac: AssetClass, level: MaturityLevel) =>
    setScores((s) => ({ ...s, [pillarId]: { ...s[pillarId], [ac]: level } }))

  const chartData = useMemo(
    () =>
      PILLARS.map((p) => ({
        pillar: p.label,
        certificates: scores[p.id].certificates,
        libraries: scores[p.id].libraries,
        software: scores[p.id].software,
        keys: scores[p.id].keys,
        fullMark: 5,
      })),
    [scores]
  )

  const allScores = useMemo(
    () => PILLARS.flatMap((p) => ASSET_CLASSES.map((ac) => scores[p.id][ac])),
    [scores]
  )

  const average = useMemo(
    () => allScores.reduce((s, v) => s + v, 0) / allScores.length,
    [allScores]
  )

  const weakest = useMemo(() => {
    let minScore = 6 as MaturityLevel
    let weakPillar = PILLARS[0]
    let weakAsset: AssetClass = 'certificates'
    for (const p of PILLARS) {
      for (const ac of ASSET_CLASSES) {
        if (scores[p.id][ac] < minScore) {
          minScore = scores[p.id][ac]
          weakPillar = p
          weakAsset = ac
        }
      }
    }
    return { pillar: weakPillar, asset: weakAsset, score: minScore }
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

  const cswp39Tier = useMemo(() => {
    if (average < 2)
      return {
        label: 'Tier 1 — Partial',
        description:
          'Crypto practices unstructured; teams select their own algorithms; no formal policy; supply-chain crypto risks unknown.',
      }
    if (average < 3)
      return {
        label: 'Tier 2 — Risk-Informed',
        description:
          'Management-approved crypto policy exists but not organisation-wide; cryptographic architecture being developed; risk assessments drive prioritisation.',
      }
    if (average < 4)
      return {
        label: 'Tier 3 — Repeatable',
        description:
          'Crypto agility formally integrated into risk management; roles defined; automated discovery and remediation tools deployed; agility practices tested.',
      }
    return {
      label: 'Tier 4 — Adaptive',
      description:
        'Crypto agility measured and reported to executives; linked to financial and mission objectives; policies updated in near-real-time as standards and threats evolve.',
    }
  }, [average])

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Rate your organization from 1 (Ad-hoc) to 5 (Optimized) on each pillar for each of the four
        asset classes. Re-run this every annual PDCA cycle — the radar chart makes year-over-year
        gains visible per asset class.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {PILLARS.map((p) => {
            const minLevel = Math.min(
              ...ASSET_CLASSES.map((ac) => scores[p.id][ac])
            ) as MaturityLevel
            return (
              <div key={p.id} className="bg-muted/40 rounded-lg p-4 border border-border">
                <div className="mb-2">
                  <div className="font-bold text-foreground">{p.label}</div>
                  <p className="text-xs text-muted-foreground mt-1">{p.question}</p>
                </div>
                <div className="space-y-2 mb-2">
                  {ASSET_CLASSES.map((ac) => (
                    <div key={ac} className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground w-28 shrink-0">
                        {ASSET_CLASS_LABELS[ac]}
                      </span>
                      <div className="flex gap-1 flex-1">
                        {([1, 2, 3, 4, 5] as MaturityLevel[]).map((lvl) => (
                          <Button
                            key={lvl}
                            variant={scores[p.id][ac] === lvl ? 'gradient' : 'outline'}
                            onClick={() => setScore(p.id, ac, lvl)}
                            className="flex-1 py-0.5 text-[11px] font-bold h-7 min-w-0"
                          >
                            {lvl}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground italic">{p.indicators[minLevel]}</p>
              </div>
            )
          })}
        </div>

        <div className="space-y-4">
          <div className="bg-muted/40 rounded-lg p-4 border border-border">
            <div className="font-bold text-foreground mb-2">CPM Posture Radar</div>
            <div className="w-full h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={chartData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="pillar" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} tickCount={6} />
                  {ASSET_CLASSES.map((ac) => (
                    <Radar
                      key={ac}
                      name={ASSET_CLASS_META[ac].label}
                      dataKey={ac}
                      stroke={ASSET_CLASS_META[ac].stroke}
                      fill={ASSET_CLASS_META[ac].fill}
                      fillOpacity={0.12}
                    />
                  ))}
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
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
              Weakest combination:{' '}
              <strong className="text-foreground">{weakest.pillar.label}</strong>
              {' · '}
              <strong className="text-foreground">{ASSET_CLASS_LABELS[weakest.asset]}</strong>
              {' (L'}
              {weakest.score} · {MATURITY_LEVEL_LABELS[weakest.score]})
            </div>
            <div className="text-sm font-bold text-accent mb-1">Recommended next milestone</div>
            <p className="text-xs text-foreground/80">{nextMilestone}</p>
            <div className="mt-3 p-3 bg-muted/40 rounded-lg border border-border space-y-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                NIST CSWP.39 Alignment
              </span>
              <p className="text-sm text-foreground font-medium">{cswp39Tier.label}</p>
              <p className="text-xs text-muted-foreground">{cswp39Tier.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

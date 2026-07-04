// SPDX-License-Identifier: GPL-3.0-only
/**
 * PatentsInsightsRedesign — the prioritised Insights tab. Recomposes the existing
 * chart primitives (lifted/exported from PatentsInsights) into a clear hierarchy:
 * a filing-year hero, four landscape donuts (the shape questions), four
 * leaderboards (the rankings that matter), and the long-tail breakdowns collapsed
 * behind one "More breakdowns" disclosure. Every chart click filters AND (via the
 * orchestrator's onFilter) switches to Explore.
 */
import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PatentsFilingYearChart } from '@/components/Patents/PatentsFilingYearChart'
import {
  BarChart,
  DonutChart,
  PieCard,
  countBy,
  countByList,
  inferRegion,
  NIST_STATUS_LABELS,
} from '@/components/Patents/PatentsInsights'
import type { PatentItem, InsightsFilter } from '@/types/PatentTypes'

interface Props {
  patents: PatentItem[]
  onFilter: (filter: InsightsFilter) => void
}

const AGILITY_LABEL_TO_ID: Record<string, string> = {
  'Classical only': 'classical_only',
  Hybrid: 'hybrid',
  'PQC only': 'pqc_only',
  Negotiated: 'negotiated',
  Unclear: 'unclear',
}

const REGION_COLORS: Record<string, string> = {
  Americas: 'hsl(var(--primary))',
  Europe: 'hsl(var(--secondary))',
  APAC: 'hsl(var(--warning))',
  'Middle East & Africa': 'hsl(var(--info))',
  Unknown: 'hsl(var(--muted-foreground))',
}

const PALETTE = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--warning))',
  'hsl(var(--info))',
  'hsl(var(--success))',
  'hsl(var(--destructive))',
  'hsl(var(--muted-foreground))',
]

const maxOf = (rows: { value: number }[]) => rows.reduce((m, r) => Math.max(m, r.value), 0)

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-panel rounded-xl p-3">
      <h3 className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  )
}

function DonutCard({
  title,
  segments,
  onClick,
}: {
  title: string
  segments: { label: string; value: number; color: string }[]
  onClick?: (label: string) => void
}) {
  const total = segments.reduce((s, x) => s + x.value, 0)
  return (
    <ChartCard title={title}>
      <div className="flex items-center gap-3">
        <DonutChart segments={segments} onClickSegment={onClick} hideLegend />
        <ul className="min-w-0 flex-1 space-y-0.5">
          {segments
            .filter((s) => s.value > 0)
            .map((s) => {
              const pct = total ? Math.round((s.value / total) * 100) : 0
              const row = (
                <span className="flex items-center gap-1.5 text-[11.5px]">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${s.color}`} aria-hidden="true" />
                  <span className="truncate text-muted-foreground">{s.label}</span>
                  <span className="ml-auto shrink-0 font-mono text-muted-foreground">
                    {s.value} · {pct}%
                  </span>
                </span>
              )
              return onClick ? (
                <li key={s.label}>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onClick(s.label)}
                    className="h-auto w-full justify-start p-0.5 font-normal hover:bg-muted/40"
                  >
                    {row}
                  </Button>
                </li>
              ) : (
                <li key={s.label} className="p-0.5">
                  {row}
                </li>
              )
            })}
        </ul>
      </div>
    </ChartCard>
  )
}

function Leaderboard({
  title,
  rows,
  colorClass,
  onClick,
  labelTransform,
}: {
  title: string
  rows: { label: string; value: number }[]
  colorClass?: string
  onClick: (label: string) => void
  labelTransform?: (l: string) => string
}) {
  return (
    <ChartCard title={title}>
      <BarChart
        data={rows.slice(0, 8)}
        maxValue={maxOf(rows)}
        total={rows.reduce((s, r) => s + r.value, 0)}
        colorClass={colorClass}
        onClickItem={onClick}
        maxItems={8}
        labelTransform={labelTransform}
      />
    </ChartCard>
  )
}

export function PatentsInsightsRedesign({ patents, onFilter }: Props) {
  const [moreOpen, setMoreOpen] = useState(false)

  const agility = useMemo(
    () => [
      {
        label: 'Classical only',
        value: patents.filter((p) => p.cryptoAgilityMode === 'classical_only').length,
        color: 'bg-status-error',
      },
      {
        label: 'Hybrid',
        value: patents.filter((p) => p.cryptoAgilityMode === 'hybrid').length,
        color: 'bg-status-warning',
      },
      {
        label: 'PQC only',
        value: patents.filter((p) => p.cryptoAgilityMode === 'pqc_only').length,
        color: 'bg-status-success',
      },
      {
        label: 'Negotiated',
        value: patents.filter((p) => p.cryptoAgilityMode === 'negotiated').length,
        color: 'bg-primary',
      },
      {
        label: 'Unclear',
        value: patents.filter((p) => p.cryptoAgilityMode === 'unclear').length,
        color: 'bg-muted-foreground',
      },
    ],
    [patents]
  )
  const relevance = useMemo(
    () => [
      {
        label: 'Core invention',
        value: patents.filter((p) => p.quantumRelevance === 'core_invention').length,
        color: 'bg-primary',
      },
      {
        label: 'Dependent claim',
        value: patents.filter((p) => p.quantumRelevance === 'dependent_claim_only').length,
        color: 'bg-status-warning',
      },
      {
        label: 'Background only',
        value: patents.filter((p) => p.quantumRelevance === 'background_only').length,
        color: 'bg-muted-foreground',
      },
      {
        label: 'None',
        value: patents.filter((p) => p.quantumRelevance === 'none').length,
        color: 'bg-border',
      },
    ],
    [patents]
  )
  const regionRows = useMemo(() => countBy(patents, (p) => inferRegion(p.assignee)), [patents])
  const quantumTech = useMemo(
    () =>
      countByList(patents, (p) => p.quantumTechnology)
        .filter((r) => r.label && r.label !== 'none')
        .slice(0, 8),
    [patents]
  )
  const quantumTechColors = useMemo(
    () => Object.fromEntries(quantumTech.map((r, i) => [r.label, PALETTE[i % PALETTE.length]])),
    [quantumTech]
  )

  const assignees = useMemo(() => countBy(patents, (p) => p.assignee || 'Unknown'), [patents])
  const pqcAlgos = useMemo(() => countByList(patents, (p) => p.pqcAlgorithms), [patents])
  const classicalAlgos = useMemo(
    () => countByList(patents, (p) => p.classicalAlgorithms),
    [patents]
  )
  const domains = useMemo(() => countByList(patents, (p) => p.applicationDomain), [patents])

  const protocols = useMemo(() => countByList(patents, (p) => p.protocols), [patents])
  const threats = useMemo(() => countByList(patents, (p) => p.threatModel), [patents])
  const standards = useMemo(() => countByList(patents, (p) => p.standardsReferenced), [patents])
  const hardware = useMemo(() => countByList(patents, (p) => p.hardwareComponents), [patents])
  const strategies = useMemo(
    () =>
      countBy(patents, (p) =>
        p.migrationStrategy ? p.migrationStrategy.replace(/_/g, ' ') : 'unknown'
      ),
    [patents]
  )
  const nistStatus = useMemo(
    () => countByList(patents, (p) => p.nistRoundStatus.map((n) => n.status)),
    [patents]
  )

  return (
    <div className="space-y-4">
      {/* Filing-year hero */}
      <div className="glass-panel rounded-xl p-3">
        <h3 className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
          Filing activity over time
        </h3>
        <PatentsFilingYearChart patents={patents} />
      </div>

      {/* Four landscape donuts */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DonutCard
          title="Crypto agility"
          segments={agility}
          onClick={(l) => onFilter({ agility: AGILITY_LABEL_TO_ID[l] ?? l })}
        />
        <DonutCard title="Quantum relevance in claims" segments={relevance} />
        <PieCard
          title="Patents by region"
          data={regionRows}
          colorMap={REGION_COLORS}
          onFilter={(l) => onFilter({ region: l })}
        />
        <PieCard
          title="Quantum hardware"
          data={quantumTech}
          colorMap={quantumTechColors}
          onFilter={(l) => onFilter({ quantumTech: l })}
        />
      </div>

      {/* Four leaderboards */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Leaderboard
          title="Top assignees"
          rows={assignees}
          onClick={(l) => onFilter({ assignee: l })}
        />
        <Leaderboard
          title="PQC algorithm coverage"
          rows={pqcAlgos}
          colorClass="bg-success"
          onClick={(l) => onFilter({ pqc: l })}
        />
        <Leaderboard
          title="Classical algorithms replaced"
          rows={classicalAlgos}
          colorClass="bg-destructive"
          onClick={(l) => onFilter({ classicalAlgorithm: l })}
        />
        <Leaderboard
          title="Application domains"
          rows={domains}
          onClick={(l) => onFilter({ domain: l })}
        />
      </div>

      {/* More breakdowns disclosure */}
      <div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setMoreOpen((o) => !o)}
          aria-expanded={moreOpen}
          className="flex h-auto w-full items-center justify-center gap-1.5 py-2 text-[13px]"
        >
          {moreOpen ? 'Hide' : 'More'} breakdowns
          <ChevronDown
            size={14}
            className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </Button>
        {moreOpen && (
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Leaderboard
              title="Protocol coverage"
              rows={protocols}
              onClick={(l) => onFilter({ protocol: l })}
            />
            <Leaderboard title="Threat models" rows={threats} onClick={() => undefined} />
            <Leaderboard title="Standards referenced" rows={standards} onClick={() => undefined} />
            <Leaderboard
              title="Hardware components"
              rows={hardware}
              onClick={(l) => onFilter({ hardwareComponent: l })}
              labelTransform={(l) => l.replace(/_/g, ' ')}
            />
            <Leaderboard title="Migration strategy" rows={strategies} onClick={() => undefined} />
            <Leaderboard
              title="NIST round status"
              rows={nistStatus}
              onClick={(l) => onFilter({ nistStatus: l })}
              labelTransform={(l) => NIST_STATUS_LABELS[l] ?? l}
            />
          </div>
        )}
      </div>

      <p className="pt-2 text-center text-[11px] text-muted-foreground">
        Patent data sourced from USPTO. For research and education — not legal or IP advice.
      </p>
    </div>
  )
}

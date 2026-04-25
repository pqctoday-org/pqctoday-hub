// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState } from 'react'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PatentItem, InsightsFilter } from '@/types/PatentTypes'

export type { InsightsFilter }

interface Props {
  patents: PatentItem[]
  onFilter?: (filter: InsightsFilter) => void
}

export const NIST_STATUS_LABELS: Record<string, string> = {
  fips_203: 'FIPS 203 (ML-KEM)',
  fips_204: 'FIPS 204 (ML-DSA)',
  fips_205: 'FIPS 205 (SLH-DSA)',
  round4_candidate: 'Round 4 Candidate',
  withdrawn: 'Withdrawn',
  stateful_hash_standard: 'Stateful Hash Standard',
  proprietary: 'Proprietary',
  classical: 'Classical',
}

function BarChart({
  data,
  maxValue,
  total,
  colorClass = 'bg-primary',
  onClickItem,
  maxItems = 20,
  labelTransform,
}: {
  data: { label: string; value: number }[]
  maxValue: number
  total?: number
  colorClass?: string
  onClickItem?: (label: string) => void
  maxItems?: number
  labelTransform?: (label: string) => string
}) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? data : data.slice(0, maxItems)
  const hasMore = data.length > maxItems

  return (
    <div className="space-y-1.5">
      {visible.map(({ label, value }) => {
        const sharePct = total ? Math.round((value / total) * 100) : null
        const displayLabel = labelTransform ? labelTransform(label) : label
        const rowContent = (
          <>
            <div
              className="w-32 shrink-0 text-xs text-muted-foreground truncate text-right group-hover:text-foreground transition-colors"
              title={displayLabel}
            >
              {displayLabel}
            </div>
            <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
              <div
                className={`h-full rounded ${colorClass} transition-all ${onClickItem ? 'group-hover:opacity-75' : ''}`}
                style={{ width: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%` }}
              />
            </div>
            <div className="w-20 shrink-0 text-xs font-semibold text-foreground tabular-nums text-right">
              {value}
              {sharePct !== null && (
                <span className="font-normal text-muted-foreground"> · {sharePct}%</span>
              )}
            </div>
          </>
        )
        return onClickItem ? (
          <Button
            key={label}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onClickItem(label)}
            className="h-auto w-full p-0 cursor-pointer group flex items-center gap-3 text-left hover:bg-transparent justify-start"
          >
            {rowContent}
          </Button>
        ) : (
          <div key={label} className="flex items-center gap-3">
            {rowContent}
          </div>
        )
      })}
      {hasMore && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((e) => !e)}
          className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground hover:bg-transparent transition-colors pt-0.5"
        >
          {expanded ? 'Show less' : `Show all ${data.length}`}
        </Button>
      )}
    </div>
  )
}

// CSS conic-gradient donut — no SVG math required
const DONUT_CSS_COLORS: Record<string, string> = {
  'bg-status-error': 'hsl(var(--destructive))',
  'bg-status-warning': 'hsl(var(--warning))',
  'bg-status-success': 'hsl(var(--success))',
  'bg-primary': 'hsl(var(--primary))',
  'bg-muted-foreground': 'hsl(var(--muted-foreground))',
  'bg-border': 'hsl(var(--border))',
}

// Colors for quantum-tech pie slices (keyed by raw tag value)
const QT_PIE_COLORS: Record<string, string> = {
  entanglement: 'hsl(var(--accent))',
  qrng: 'hsl(var(--warning))',
  qkd: 'hsl(var(--primary))',
  satellite_qkd: 'hsl(var(--primary) / 0.45)',
  quantum_computing: 'hsl(var(--info))',
}

const REGION_COLORS: Record<string, string> = {
  Americas: 'hsl(var(--primary))',
  Europe: 'hsl(var(--accent))',
  APAC: 'hsl(var(--warning))',
  Oceania: 'hsl(var(--success))',
  'Middle East & Africa': 'hsl(var(--info))',
  Unknown: 'hsl(var(--muted-foreground))',
}

const AGILITY_KEY_MAP: Record<string, string> = {
  'Classical only': 'classical_only',
  Hybrid: 'hybrid',
  'PQC only': 'pqc_only',
  Negotiated: 'negotiated',
  Unclear: 'unclear',
}

const RELEVANCE_KEY_MAP: Record<string, string> = {
  'Core invention': 'core_invention',
  'Dependent claim only': 'dependent_claim_only',
  'Background only': 'background_only',
  None: 'none',
}

function DonutChart({
  segments,
  solid = false,
  size = 72,
  onClickSegment,
  keyMap,
}: {
  segments: { label: string; value: number; color: string }[]
  solid?: boolean
  size?: number
  onClickSegment?: (label: string) => void
  keyMap?: Record<string, string>
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return null

  const positiveSegments = segments.filter((s) => s.value > 0)
  // Cumulative percentages computed via reduce (no render-time mutation).
  const cumulativePcts = positiveSegments.reduce<number[]>((acc, seg) => {
    const prev = acc.length > 0 ? acc[acc.length - 1] : 0
    return [...acc, prev + (seg.value / total) * 100]
  }, [])
  const stops = positiveSegments.map((seg, i) => {
    const start = i === 0 ? 0 : cumulativePcts[i - 1]
    const end = cumulativePcts[i]
    const cssColor = DONUT_CSS_COLORS[seg.color] ?? 'hsl(var(--muted))'
    return `${cssColor} ${start.toFixed(1)}% ${end.toFixed(1)}%`
  })

  return (
    <div className="flex items-center gap-6">
      <div
        className="shrink-0 rounded-full"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${stops.join(', ')})`,
          ...(solid
            ? {}
            : {
                WebkitMask: 'radial-gradient(circle at center, transparent 38%, black 39%)',
                mask: 'radial-gradient(circle at center, transparent 38%, black 39%)',
              }),
        }}
      />
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {positiveSegments.map((seg) => (
          <Button
            key={seg.label}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onClickSegment?.((keyMap ?? AGILITY_KEY_MAP)[seg.label] ?? seg.label)}
            disabled={!onClickSegment}
            className={`h-auto p-0 flex items-center gap-1.5 text-xs text-muted-foreground hover:bg-transparent transition-colors ${
              onClickSegment ? 'hover:text-foreground cursor-pointer' : 'cursor-default'
            }`}
          >
            <span className={`inline-block h-2 w-2 rounded-sm shrink-0 ${seg.color}`} />
            {seg.label}
            <span className="font-semibold text-foreground">
              {seg.value}
              <span className="font-normal"> · {Math.round((seg.value / total) * 100)}%</span>
            </span>
          </Button>
        ))}
      </div>
    </div>
  )
}

function PieCard({
  title,
  data,
  colorMap,
  hint,
  footnote,
  onFilter,
}: {
  title: string
  data: { label: string; value: number }[]
  colorMap: Record<string, string>
  hint?: string
  footnote?: string
  onFilter?: (label: string) => void
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return null

  // Cumulative percentages computed via reduce (no render-time mutation).
  const cumulativePcts = data.reduce<number[]>((acc, d) => {
    const prev = acc.length > 0 ? acc[acc.length - 1] : 0
    return [...acc, prev + (d.value / total) * 100]
  }, [])
  const stops = data.map((d, i) => {
    const start = i === 0 ? 0 : cumulativePcts[i - 1]
    const end = cumulativePcts[i]
    const color = colorMap[d.label] ?? 'hsl(var(--muted-foreground))'
    return `${color} ${start.toFixed(1)}% ${end.toFixed(1)}%`
  })

  return (
    <div className="glass-panel rounded-lg p-4 flex flex-col gap-3">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {title}
      </div>
      {hint && <p className="text-[10px] text-muted-foreground -mt-2">{hint}</p>}
      <div className="flex items-center gap-4">
        <div
          className="shrink-0 rounded-full"
          style={{ width: 80, height: 80, background: `conic-gradient(${stops.join(', ')})` }}
        />
        <div className="space-y-1 min-w-0">
          {data.map((d) => (
            <Button
              key={d.label}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onFilter?.(d.label)}
              disabled={!onFilter}
              className={`h-auto p-0 flex items-center gap-1.5 w-full justify-start text-left text-xs text-muted-foreground hover:bg-transparent transition-colors ${
                onFilter ? 'hover:text-foreground cursor-pointer' : 'cursor-default'
              }`}
            >
              <span
                className="inline-block h-2 w-2 rounded-sm shrink-0"
                style={{ background: colorMap[d.label] ?? 'hsl(var(--muted-foreground))' }}
              />
              <span className="truncate">{d.label.replace(/_/g, ' ')}</span>
              <span className="ml-auto pl-2 font-semibold text-foreground tabular-nums">
                {d.value}
                <span className="font-normal text-muted-foreground">
                  {' '}
                  · {Math.round((d.value / total) * 100)}%
                </span>
              </span>
            </Button>
          ))}
        </div>
      </div>
      {footnote && <p className="text-[10px] text-muted-foreground">{footnote}</p>}
    </div>
  )
}

// SVG area sparkline for time series
function Section({
  title,
  hint,
  children,
  action,
}: {
  title: string
  hint?: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="glass-panel rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {title}
          </h3>
          {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function countBy<T>(items: T[], key: (item: T) => string): { label: string; value: number }[] {
  const map = new Map<string, number>()
  items.forEach((item) => {
    const k = key(item)
    map.set(k, (map.get(k) ?? 0) + 1)
  })
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

function countByList<T>(
  items: T[],
  key: (item: T) => string[]
): { label: string; value: number }[] {
  const map = new Map<string, number>()
  items.forEach((item) => {
    key(item).forEach((k) => {
      if (k && k !== 'none') map.set(k, (map.get(k) ?? 0) + 1)
    })
  })
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

// Best-effort region inference from assignee string
const REGION_RULES: { pattern: RegExp; region: string }[] = [
  // Europe
  {
    pattern:
      /siemens|bosch|giesecke|nagravision|swiss re|thales(?! dis cpp usa)|\bsap\b|nokia|ericsson|philips|infineon|st micro|arm limited|entrust.*canada|blackberry|01 communique/i,
    region: 'Europe',
  },
  {
    pattern: /aktiengesellschaft|gmbh|ltd\b.*\buk\b|\bplc\b|s\.a\.\b|s\.r\.l\b/i,
    region: 'Europe',
  },
  // APAC
  {
    pattern: /huawei|alibaba|tencent|baidu|inspur|inventec|hikvision|byd|xiaomi|oppo|vivo/i,
    region: 'APAC',
  },
  { pattern: /samsung|lg electronics|sk hynix|kt corp|hyundai/i, region: 'APAC' },
  {
    pattern:
      /nippon|ntt|fujitsu|hitachi|toshiba|sony|panasonic|sharp|ricoh|softbank|rakuten|nec corp/i,
    region: 'APAC',
  },
  { pattern: /commonwealth scientific|csiro|atlassian/i, region: 'APAC' },
  { pattern: /jio platforms|wipro|infosys|tata/i, region: 'APAC' },
  // Oceania
  { pattern: /commonwealth scientific|csiro|atlassian|canva|afterpay|seek\b/i, region: 'Oceania' },
  // Middle East & Africa
  {
    pattern: /radware|checkpoint|amdocs|elbit|nice systems|lendoit|cellebrite/i,
    region: 'Middle East & Africa',
  },
  { pattern: /saudi|emirates|etisalat|du telecom/i, region: 'Middle East & Africa' },
  // Americas (catch-all for known US/CA companies and .N.A. / Inc. / LLC / Corp)
]

export function inferRegion(assignee: string): string {
  if (!assignee) return 'Unknown'
  for (const { pattern, region } of REGION_RULES) {
    if (pattern.test(assignee)) return region
  }
  // Heuristic: if it contains common US legal suffixes, it's Americas
  if (
    /\b(inc\.|llc|corp\.|n\.a\.|incorporated|limited liability|university of|national lab)/i.test(
      assignee
    )
  )
    return 'Americas'
  return 'Unknown'
}

export function PatentsInsights({ patents, onFilter }: Props) {
  const [assigneeSortDir, setAssigneeSortDir] = useState<'desc' | 'asc'>('desc')

  const topAssignees = useMemo(() => {
    const sorted = countBy(patents, (p) => p.assignee || 'Unknown')
    return assigneeSortDir === 'desc' ? sorted : [...sorted].reverse()
  }, [patents, assigneeSortDir])

  const domains = useMemo(
    () => countByList(patents, (p) => p.applicationDomain).slice(0, 12),
    [patents]
  )

  const pqcAlgos = useMemo(
    () => countByList(patents, (p) => p.pqcAlgorithms).slice(0, 12),
    [patents]
  )

  const threatModels = useMemo(
    () => countByList(patents, (p) => p.threatModel).slice(0, 10),
    [patents]
  )

  const migrationStrategies = useMemo(
    () =>
      countBy(patents, (p) =>
        p.migrationStrategy ? p.migrationStrategy.replace(/_/g, ' ') : 'unknown'
      ),
    [patents]
  )

  const dataTypes = useMemo(
    () => countByList(patents, (p) => p.dataTypesProtected).slice(0, 10),
    [patents]
  )

  const standardsReferenced = useMemo(
    () => countByList(patents, (p) => p.standardsReferenced).slice(0, 12),
    [patents]
  )

  const regionCounts = useMemo(() => countBy(patents, (p) => inferRegion(p.assignee)), [patents])

  const protocols = useMemo(() => countByList(patents, (p) => p.protocols).slice(0, 12), [patents])

  const classicalAlgos = useMemo(
    () => countByList(patents, (p) => p.classicalAlgorithms).slice(0, 12),
    [patents]
  )

  const hardwareComponentCounts = useMemo(
    () => countByList(patents, (p) => p.hardwareComponents).slice(0, 10),
    [patents]
  )

  const nistStatusCounts = useMemo(
    () => countByList(patents, (p) => p.nistRoundStatus.map((n) => n.status)),
    [patents]
  )

  const agilitySegments = useMemo(
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

  const relevanceSegments = useMemo(
    () => [
      {
        label: 'Core invention',
        value: patents.filter((p) => p.quantumRelevance === 'core_invention').length,
        color: 'bg-primary',
      },
      {
        label: 'Dependent claim only',
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

  const quantumTechBreakdown = useMemo(
    () => countByList(patents, (p) => p.quantumTechnology).slice(0, 8),
    [patents]
  )

  const maxAssignee = Math.max(...topAssignees.map((a) => a.value), 1)
  const maxDomain = domains[0]?.value ?? 1
  const maxAlgo = pqcAlgos[0]?.value ?? 1
  const maxThreat = threatModels[0]?.value ?? 1
  const maxStrategy = migrationStrategies[0]?.value ?? 1
  const maxDataType = dataTypes[0]?.value ?? 1
  const maxStandard = standardsReferenced[0]?.value ?? 1
  const maxProtocol = protocols[0]?.value ?? 1
  const maxClassical = classicalAlgos[0]?.value ?? 1
  const maxHardware = hardwareComponentCounts[0]?.value ?? 1
  const maxNistStatus = nistStatusCounts[0]?.value ?? 1

  return (
    <div className="p-4 space-y-4">
      {/* Top row: 4 pie/donut charts */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <PieCard
          title="Quantum Hardware"
          data={quantumTechBreakdown}
          colorMap={QT_PIE_COLORS}
          hint={onFilter ? 'Click a slice to filter the Explore tab' : undefined}
          footnote="by tag · patents may carry multiple"
          onFilter={onFilter ? (label) => onFilter({ quantumTech: label }) : undefined}
        />
        <Section
          title="Crypto Agility Distribution"
          hint={onFilter ? 'Click a segment to filter the Explore tab' : undefined}
        >
          <DonutChart
            segments={agilitySegments}
            keyMap={AGILITY_KEY_MAP}
            onClickSegment={onFilter ? (key) => onFilter({ agility: key }) : undefined}
          />
        </Section>
        <Section
          title="Quantum Relevance in Claims"
          hint={onFilter ? 'Click a segment to filter the Explore tab' : undefined}
        >
          <DonutChart
            segments={relevanceSegments}
            keyMap={RELEVANCE_KEY_MAP}
            onClickSegment={onFilter ? (key) => onFilter({ quantumRelevance: key }) : undefined}
          />
        </Section>
        <PieCard
          title="Patents by Region"
          data={regionCounts}
          colorMap={REGION_COLORS}
          hint={onFilter ? 'Click a slice to filter the Explore tab' : undefined}
          onFilter={onFilter ? (label) => onFilter({ region: label }) : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Assignees */}
        <Section
          title="Assignees by Patent Count"
          hint={onFilter ? 'Click a row to filter the Explore tab' : undefined}
          action={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAssigneeSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
              className="h-auto p-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:bg-transparent transition-colors shrink-0"
              title={assigneeSortDir === 'desc' ? 'Sort ascending' : 'Sort descending'}
            >
              <ArrowUpDown className="h-3 w-3" />
              {assigneeSortDir === 'desc' ? 'Most → least' : 'Least → most'}
            </Button>
          }
        >
          <BarChart
            data={topAssignees}
            maxValue={maxAssignee}
            total={patents.length}
            colorClass="bg-primary"
            onClickItem={onFilter ? (label) => onFilter({ assignee: label }) : undefined}
          />
        </Section>

        {/* Protocol coverage */}
        <Section
          title="Protocol Coverage"
          hint={onFilter ? 'Click a row to filter the Explore tab' : undefined}
        >
          <BarChart
            data={protocols}
            maxValue={maxProtocol}
            total={patents.length}
            colorClass="bg-accent/70"
            onClickItem={onFilter ? (label) => onFilter({ protocol: label }) : undefined}
          />
        </Section>

        {/* Application domain */}
        <Section
          title="Application Domain Frequency"
          hint={onFilter ? 'Click a row to filter the Explore tab' : undefined}
        >
          <BarChart
            data={domains}
            maxValue={maxDomain}
            total={patents.length}
            colorClass="bg-primary/70"
            onClickItem={onFilter ? (label) => onFilter({ domain: label }) : undefined}
          />
        </Section>

        {/* PQC algorithm leaderboard */}
        <Section title="PQC Algorithm Coverage">
          {pqcAlgos.length === 0 ? (
            <p className="text-xs text-muted-foreground">No PQC algorithms in this corpus.</p>
          ) : (
            <BarChart
              data={pqcAlgos}
              maxValue={maxAlgo}
              total={patents.length}
              colorClass="bg-success/70"
            />
          )}
        </Section>

        {/* Threat model */}
        <Section title="Threat Model Frequency">
          <BarChart
            data={threatModels}
            maxValue={maxThreat}
            total={patents.length}
            colorClass="bg-destructive/70"
          />
        </Section>

        {/* Migration strategy */}
        <Section title="Migration Strategy Breakdown">
          <BarChart
            data={migrationStrategies}
            maxValue={maxStrategy}
            total={patents.length}
            colorClass="bg-accent"
          />
        </Section>

        {/* Data types protected */}
        <Section title="Data Types Protected">
          <BarChart
            data={dataTypes}
            maxValue={maxDataType}
            total={patents.length}
            colorClass="bg-primary/60"
          />
        </Section>

        {/* Standards referenced */}
        <Section title="Standards Referenced">
          <BarChart
            data={standardsReferenced}
            maxValue={maxStandard}
            total={patents.length}
            colorClass="bg-warning/70"
          />
        </Section>

        {/* Classical algorithms replaced */}
        <Section
          title="Classical Algorithms Replaced"
          hint={onFilter ? 'Click a row to filter the Explore tab' : undefined}
        >
          <BarChart
            data={classicalAlgos}
            maxValue={maxClassical}
            total={patents.length}
            colorClass="bg-destructive/50"
            onClickItem={onFilter ? (label) => onFilter({ classicalAlgorithm: label }) : undefined}
          />
        </Section>

        {/* Hardware components */}
        <Section
          title="Hardware Components"
          hint={onFilter ? 'Click a row to filter the Explore tab' : undefined}
        >
          <BarChart
            data={hardwareComponentCounts}
            maxValue={maxHardware}
            total={patents.length}
            colorClass="bg-warning/50"
            onClickItem={onFilter ? (label) => onFilter({ hardwareComponent: label }) : undefined}
          />
        </Section>

        {/* NIST round status */}
        <Section
          title="NIST Round Status"
          hint={onFilter ? 'Click a row to filter the Explore tab' : undefined}
        >
          <BarChart
            data={nistStatusCounts}
            maxValue={maxNistStatus}
            total={patents.length}
            colorClass="bg-success/50"
            labelTransform={(label) => NIST_STATUS_LABELS[label] ?? label}
            onClickItem={onFilter ? (label) => onFilter({ nistStatus: label }) : undefined}
          />
        </Section>
      </div>

      <p className="text-xs text-muted-foreground text-center pt-2">
        Patent data sourced from USPTO public records. AI-generated enrichments are for research
        purposes only and do not constitute legal or IP advice.
      </p>
    </div>
  )
}

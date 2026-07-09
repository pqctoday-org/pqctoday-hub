// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import {
  Area,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  CRQC_DRIVERS,
  CRQC_DRIVER_MILESTONES,
  CRQC_MODALITY_TRACKS,
  CRQC_QUBIT_THRESHOLDS,
  CRQC_TRAJECTORY,
  getCrqcConsensus,
} from '@/components/PKILearning/modules/QuantumThreats/data/quantumConstants'

/**
 * CrqcTrajectoryChart — "how close is Q-Day?"
 *
 * Three plain-language views:
 *  1. Logical-qubit trajectory (5 yrs demonstrated + 10 yr forecast band) scaled
 *     against the qubits to break a Bitcoin/ECC-256 key and RSA-2048.
 *  2. The competing quantum-technology tracks — recent progress + the challenge
 *     ahead to scale, per vendor.
 *  3. The contributing factors (hardware, algorithms, error correction, noise,
 *     AI, HPC) as cards: what each means, plus its dated milestones.
 *
 * Renders curated data verbatim from `quantumConstants`. The forecast band is an
 * illustrative span of vendor roadmaps, not a prediction.
 */

const X_MIN = 2020
const X_MAX = 2035
const TODAY = 2026

// Q-Day window — derived from CRQC_ESTIMATES via getCrqcConsensus() (Threats #1)
// rather than a separately hardcoded guess, so it agrees with the hero's stated
// window and the economics calculator's default Z.
const { qdayLow: QDAY_LOW, qdayHigh: QDAY_HIGH } = getCrqcConsensus()

const AXIS_ORDER = [
  'Hardware',
  'Algorithms',
  'Error correction',
  'Noise reduction',
  'AI / ML',
  'HPC / architecture',
] as const

const AXIS_COLOR = new Map<string, string>([
  ['Hardware', 'var(--color-primary)'],
  ['Algorithms', 'var(--color-warning)'],
  ['Error correction', 'var(--color-info)'],
  ['Noise reduction', 'var(--color-success)'],
  ['AI / ML', 'var(--color-destructive)'],
  ['HPC / architecture', 'var(--color-secondary)'],
])
const axisColor = (axis: string) => AXIS_COLOR.get(axis) ?? 'var(--color-muted-foreground)'

const fmtQubits = (v: number) =>
  v >= 1000 ? `${v % 1000 === 0 ? v / 1000 : (v / 1000).toFixed(1)}k` : `${v}`

interface ChartRow {
  year: number
  demonstrated?: number
  forecast?: [number, number]
}

function TrajectoryTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ payload: ChartRow }>
  label?: number
}) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <div className="font-semibold text-foreground">{label}</div>
      {row.demonstrated != null && (
        <div className="text-muted-foreground">
          Demonstrated: <span className="text-primary font-medium">{row.demonstrated} LQ</span>
        </div>
      )}
      {row.forecast && (
        <div className="text-muted-foreground">
          Forecast:{' '}
          <span className="text-warning font-medium">
            {fmtQubits(row.forecast[0])}–{fmtQubits(row.forecast[1])} LQ
          </span>
        </div>
      )}
    </div>
  )
}

export const CrqcTrajectoryChart: React.FC = () => {
  const data = useMemo<ChartRow[]>(() => CRQC_TRAJECTORY.map((p) => ({ ...p })), [])

  const axisLayman = useMemo(() => {
    const m = new Map<string, string>()
    for (const d of CRQC_DRIVERS) m.set(d.category, d.layman)
    return m
  }, [])

  const milestonesByAxis = useMemo(() => {
    const m = new Map<string, typeof CRQC_DRIVER_MILESTONES>()
    for (const ms of CRQC_DRIVER_MILESTONES) {
      const list = m.get(ms.axis) ?? []
      list.push(ms)
      m.set(ms.axis, list)
    }
    return m
  }, [])

  return (
    <section
      className="rounded-lg border border-border bg-muted/20 p-3"
      aria-labelledby="crqc-trajectory-heading"
      data-testid="crqc-trajectory-chart"
    >
      <h3 id="crqc-trajectory-heading" className="text-sm font-bold text-foreground">
        Trajectory to Q-Day
      </h3>
      <p className="text-xs text-muted-foreground mt-0.5">
        Demonstrated logical qubits (last 5 years) and a forecast band (next 10), against the qubits
        needed to break a Bitcoin/ECC-256 key (~
        {CRQC_QUBIT_THRESHOLDS.bitcoinEcc256.toLocaleString()}) and RSA-2048 (~
        {CRQC_QUBIT_THRESHOLDS.rsa2048.toLocaleString()}). The forecast band spans
        conservative→aggressive vendor roadmaps — a range, not a prediction.
      </p>

      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} margin={{ top: 14, right: 12, bottom: 4, left: -6 }}>
          <ReferenceArea
            x1={QDAY_LOW}
            x2={QDAY_HIGH}
            fill="var(--color-destructive)"
            fillOpacity={0.07}
            ifOverflow="extendDomain"
          />
          <XAxis
            dataKey="year"
            type="number"
            domain={[X_MIN, X_MAX]}
            ticks={[2020, 2022, 2024, 2026, 2028, 2030, 2032, 2034]}
            tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            scale="log"
            domain={[1, 400000]}
            ticks={[1, 10, 100, 1000, 10000, 100000]}
            tickFormatter={fmtQubits}
            tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            width={40}
            allowDataOverflow
          />
          <Tooltip content={<TrajectoryTooltip />} />

          <Area
            dataKey="forecast"
            stroke="var(--color-warning)"
            strokeWidth={1}
            strokeDasharray="4 3"
            fill="var(--color-warning)"
            fillOpacity={0.12}
            connectNulls
            isAnimationActive={false}
          />
          <Line
            dataKey="demonstrated"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={{ r: 2.5, fill: 'var(--color-primary)' }}
            connectNulls
            isAnimationActive={false}
          />

          <ReferenceLine
            y={CRQC_QUBIT_THRESHOLDS.bitcoinEcc256}
            stroke="var(--color-warning)"
            strokeDasharray="5 3"
            label={{
              value: `Bitcoin / ECC-256 ~${CRQC_QUBIT_THRESHOLDS.bitcoinEcc256.toLocaleString()}`,
              position: 'insideTopLeft',
              fontSize: 9,
              fill: 'var(--color-warning)',
            }}
          />
          <ReferenceLine
            y={CRQC_QUBIT_THRESHOLDS.rsa2048}
            stroke="var(--color-destructive)"
            strokeDasharray="5 3"
            label={{
              value: `RSA-2048 ~${CRQC_QUBIT_THRESHOLDS.rsa2048.toLocaleString()}`,
              position: 'insideBottomLeft',
              fontSize: 9,
              fill: 'var(--color-destructive)',
            }}
          />
          <ReferenceLine
            x={TODAY}
            stroke="var(--color-muted-foreground)"
            strokeDasharray="2 2"
            label={{
              value: 'today',
              position: 'top',
              fontSize: 9,
              fill: 'var(--color-muted-foreground)',
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground -mt-1">
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-3" style={{ background: 'var(--color-primary)' }} />
          Demonstrated logical qubits
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-2 w-3 rounded-sm"
            style={{ background: 'var(--color-warning)', opacity: 0.4 }}
          />
          Forecast band (vendor roadmaps)
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-2 w-3 rounded-sm"
            style={{ background: 'var(--color-destructive)', opacity: 0.2 }}
          />
          Q-Day window ~{QDAY_LOW}–{QDAY_HIGH}
        </span>
      </div>

      {/* Quantum-technology tracks — recent progress + challenge to scale */}
      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
          Quantum-technology tracks · recent progress &amp; the challenge to scale
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
          {CRQC_MODALITY_TRACKS.map((t) => (
            <div
              key={t.technology}
              className="rounded-md border border-border bg-background/40 p-2.5"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-semibold text-foreground">{t.technology}</span>
                <span className="text-[10px] text-primary font-medium shrink-0">
                  {t.bestLogical > 0 ? `${t.bestLogical} logical qubits` : 'NISQ (no logical yet)'}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground">{t.vendors}</div>
              <div className="mt-1.5 text-[10px] leading-snug">
                <span className="font-semibold text-success">Recent progress: </span>
                <span className="text-muted-foreground">{t.recentProgress}</span>
              </div>
              <div className="mt-1 text-[10px] leading-snug">
                <span className="font-semibold text-warning">Challenge to scale: </span>
                <span className="text-muted-foreground">{t.scaleChallenge}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contributing factors — one card each: meaning + dated milestones */}
      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
          Contributing factors · what each one means &amp; key milestones
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
          {AXIS_ORDER.map((axis) => (
            <div key={axis} className="rounded-md border border-border bg-background/40 p-2.5">
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ background: axisColor(axis) }}
                />
                <span className="text-xs font-semibold text-foreground">{axis}</span>
              </div>
              <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
                {axisLayman.get(axis)}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {(milestonesByAxis.get(axis) ?? []).map((m) => (
                  <span
                    key={`${axis}-${m.year}`}
                    title={m.label}
                    className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[9px] text-muted-foreground"
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full border shrink-0"
                      style={{
                        background: m.forecast ? 'transparent' : axisColor(axis),
                        borderColor: axisColor(axis),
                      }}
                    />
                    <span className="font-medium text-foreground">{m.year}</span>
                    {m.short}
                    {m.forecast ? ' · roadmap' : ''}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground/80 mt-2">
          Each chip is a dated breakthrough — a filled dot means it has been demonstrated, a hollow
          dot means it is a vendor roadmap target. The biggest qubit-count reductions so far came
          from algorithms and error correction, not AI.
        </p>
      </div>
    </section>
  )
}

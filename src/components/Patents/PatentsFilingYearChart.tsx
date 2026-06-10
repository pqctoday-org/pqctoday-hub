// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import type { PatentItem } from '@/types/PatentTypes'

// Same definition the view's "PQC only" toggle uses.
function isPqc(p: PatentItem): boolean {
  return (
    p.pqcAlgorithms.length > 0 ||
    p.cryptoAgilityMode === 'pqc_only' ||
    p.cryptoAgilityMode === 'hybrid'
  )
}

interface YearRow {
  year: number
  pqc: number
  classical: number
}

/**
 * Patents by filing year, stacked classical (bottom) + PQC (top) in the SAME
 * bar. Filing year (earliest application year) is 100% populated, so it shows
 * the real timeline. Stacking the two crypto classes makes the PQC-vs-classical
 * ratio — and how it shifts toward PQC over time — readable at a glance.
 *
 * Operates on the already-filtered `patents` (respects the PQC-only toggle): on
 * PQC-only the classical segment is simply zero; on "PQC + classical" both
 * segments show and the migration trend appears.
 */
export function PatentsFilingYearChart({ patents }: { patents: PatentItem[] }) {
  const { data, total } = useMemo(() => {
    const pqcByYear = new Map<number, number>()
    const classicalByYear = new Map<number, number>()
    for (const p of patents) {
      if (p.filingYear <= 0) continue
      const map = isPqc(p) ? pqcByYear : classicalByYear
      map.set(p.filingYear, (map.get(p.filingYear) ?? 0) + 1)
    }
    const years = [...new Set([...pqcByYear.keys(), ...classicalByYear.keys()])]
    if (years.length === 0) return { data: [] as YearRow[], total: 0 }
    const min = Math.min(...years)
    const max = Math.max(...years)
    const data: YearRow[] = []
    for (let y = min; y <= max; y++) {
      data.push({ year: y, pqc: pqcByYear.get(y) ?? 0, classical: classicalByYear.get(y) ?? 0 })
    }
    return { data, total: patents.length }
  }, [patents])

  if (data.length === 0) return null

  const hasClassical = data.some((d) => d.classical > 0)

  return (
    <div className="glass-panel rounded-lg p-3">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3">
        <h3 className="text-sm font-medium text-foreground">Patents by filing year</h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {hasClassical && (
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span
                  className="inline-block h-2 w-2 rounded-sm"
                  style={{ background: 'var(--color-primary)' }}
                />
                PQC
              </span>
              <span className="flex items-center gap-1">
                <span
                  className="inline-block h-2 w-2 rounded-sm"
                  style={{ background: 'var(--color-muted-foreground)' }}
                />
                Classical
              </span>
            </span>
          )}
          <span>
            {total.toLocaleString()} patents · {data[0].year}–{data[data.length - 1].year}
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: -18 }}>
          <XAxis
            dataKey="year"
            tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={32}
          />
          <Tooltip
            cursor={{ fill: 'var(--color-muted)', opacity: 0.3 }}
            contentStyle={{
              background: 'var(--color-popover)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: 'var(--color-foreground)', fontWeight: 600 }}
            labelFormatter={(year) => `Filed ${year}`}
            formatter={(value, name) => [`${value}`, name === 'pqc' ? 'PQC' : 'Classical']}
          />
          {/* Classical on the bottom, PQC stacked on top (rounded cap). */}
          <Bar dataKey="classical" stackId="a" fill="var(--color-muted-foreground)" />
          <Bar dataKey="pqc" stackId="a" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

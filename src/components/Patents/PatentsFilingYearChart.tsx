// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import type { PatentItem } from '@/types/PatentTypes'

/**
 * Full-width "PQC patents by filing year" bar chart. Filing year (earliest
 * application year) is the truest "when was this invention made" axis and is
 * 100% populated, so it shows the real progression of PQC patenting over time.
 *
 * Operates on the already-filtered `patents` (respects the PQC-only toggle), so
 * the bars reflect exactly what the table shows.
 */
export function PatentsFilingYearChart({ patents }: { patents: PatentItem[] }) {
  const { data, total } = useMemo(() => {
    const counts = new Map<number, number>()
    for (const p of patents) {
      if (p.filingYear > 0) counts.set(p.filingYear, (counts.get(p.filingYear) ?? 0) + 1)
    }
    const years = [...counts.keys()]
    if (years.length === 0) return { data: [] as { year: number; count: number }[], total: 0 }
    const min = Math.min(...years)
    const max = Math.max(...years)
    // Contiguous range so gaps read as zero (a true timeline, no skipped years).
    const data = []
    for (let y = min; y <= max; y++) data.push({ year: y, count: counts.get(y) ?? 0 })
    return { data, total: patents.length }
  }, [patents])

  if (data.length === 0) return null

  const peak = Math.max(...data.map((d) => d.count))

  return (
    <div className="glass-panel rounded-lg p-3">
      <div className="mb-1 flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-foreground">PQC patents by filing year</h3>
        <span className="text-xs text-muted-foreground">
          {total.toLocaleString()} patents · {data[0].year}–{data[data.length - 1].year}
        </span>
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
            formatter={(value: number) => [`${value} patents`, '']}
            labelFormatter={(year) => `Filed ${year}`}
          />
          <Bar dataKey="count" radius={[3, 3, 0, 0]} fill="var(--color-primary)">
            {data.map((d) => (
              // Newest-year bar accented so the latest activity stands out.
              <Cell
                key={d.year}
                fill={d.count === peak ? 'var(--color-accent)' : 'var(--color-primary)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

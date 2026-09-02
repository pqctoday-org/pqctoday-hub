// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import type { ComplianceRecord } from './types'
import {
  buildMonthlyPqcCertificationTrend,
  isAmbiguousPqcMatch,
} from './pqcCertificationTrendModel'

interface PqcCertificationTrendChartProps {
  data: ComplianceRecord[]
  /** Genuine "as of" date for the underlying snapshot — the same value
   *  ComplianceTable already receives as `lastUpdated` (computeRecordsSnapshotDate).
   *  Falls back to the wall clock only when the data hasn't loaded yet. */
  asOf: Date | null
}

const MONTH_ABBR = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

function formatMonthTick(ym: string): string {
  const [year, month] = ym.split('-')
  return `${MONTH_ABBR[Number(month) - 1]} '${year.slice(2)}`
}

function formatMonthLong(ym: string): string {
  const [year, month] = ym.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Monthly PQC-certification issuance, stacked by scheme (Product Records tab).
 * Confirmed-algorithm certs only — see pqcCertificationTrendModel. Rows flagged
 * only "Potentially PQC (Name Match)" are excluded from the bars but tallied in
 * the footnote so the exclusion stays visible rather than silently lowering the
 * count.
 */
export function PqcCertificationTrendChart({ data, asOf }: PqcCertificationTrendChartProps) {
  const referenceDate = useMemo(() => asOf ?? new Date(), [asOf])

  const trend = useMemo(
    () => buildMonthlyPqcCertificationTrend(data, referenceDate),
    [data, referenceDate]
  )

  const totalCertified = useMemo(() => trend.reduce((sum, t) => sum + t.total, 0), [trend])

  const ambiguousCount = useMemo(
    () => data.filter((r) => r.date >= '2024-01-01' && isAmbiguousPqcMatch(r.pqcCoverage)).length,
    [data]
  )

  if (totalCertified === 0 || trend.length === 0) return null

  // Keep roughly 9 visible x-axis labels regardless of range length, so the
  // ~30-month range doesn't collide the way showing every month would.
  const tickInterval = Math.max(0, Math.ceil(trend.length / 9) - 1)

  return (
    <div className="glass-panel rounded-lg p-3">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3">
        <h3 className="text-sm font-medium text-foreground">PQC certifications by month</h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-sm"
                style={{ background: 'var(--color-primary)' }}
              />
              ACVP
            </span>
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-sm"
                style={{ background: 'var(--color-secondary)' }}
              />
              FIPS
            </span>
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-sm"
                style={{ background: 'var(--color-accent)' }}
              />
              CC
            </span>
          </span>
          <span>
            {totalCertified.toLocaleString()} certified · {formatMonthLong(trend[0].month)}–
            {formatMonthLong(trend[trend.length - 1].month)}
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={trend} margin={{ top: 6, right: 4, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="month"
            tickFormatter={formatMonthTick}
            tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
            interval={tickInterval}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={36}
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
            labelFormatter={(ym) => formatMonthLong(ym)}
            formatter={(value, name) => [
              `${value}`,
              name === 'acvp' ? 'ACVP' : name === 'fips' ? 'FIPS' : 'CC',
            ]}
          />
          <Bar dataKey="acvp" stackId="a" fill="var(--color-primary)" />
          <Bar dataKey="fips" stackId="a" fill="var(--color-secondary)" />
          <Bar dataKey="cc" stackId="a" fill="var(--color-accent)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        Confirmed PQC algorithm only (ML-KEM, ML-DSA, SLH-DSA, LMS/HSS/XMSS, Falcon) in the
        certificate's validated scope
        {ambiguousCount > 0 &&
          ` — excludes ${ambiguousCount} record${ambiguousCount === 1 ? '' : 's'} flagged only as a potential name match`}
        . Data as of{' '}
        {referenceDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
        .
      </p>
    </div>
  )
}

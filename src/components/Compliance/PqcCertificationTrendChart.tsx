// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import type { ComplianceRecord } from './types'
import {
  buildMonthlyPqcCertificationTrend,
  isAmbiguousPqcMatch,
} from './pqcCertificationTrendModel'
import { formatIsoDate } from './recordSemantics'

interface PqcCertificationTrendChartProps {
  /** Records already filtered to the reader's record scope (current only by default). */
  data: ComplianceRecord[]
  /** Newest certificate date in the snapshot (computeRecordsSnapshotDate) — the
   *  axis ends at its month. Not a retrieval date. Falls back to the wall clock
   *  only when the data hasn't loaded yet. */
  asOf: Date | null
}

const SERIES_LABEL: Record<string, string> = {
  acvp: 'NIST CAVP',
  fips: 'FIPS 140-3',
  cc: 'CC / EUCC (named in ST)',
  cspn: 'CSPN (ANSSI, named in ST)',
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
  const hasCspn = useMemo(() => trend.some((t) => t.cspn > 0), [trend])

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
        <h3 className="text-sm font-medium text-foreground">
          Certification records naming PQC, by month
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-sm"
                style={{ background: 'var(--color-primary)' }}
              />
              {SERIES_LABEL.acvp}
            </span>
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-sm"
                style={{ background: 'var(--color-secondary)' }}
              />
              {SERIES_LABEL.fips}
            </span>
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-sm"
                style={{ background: 'var(--color-accent)' }}
              />
              {SERIES_LABEL.cc}
            </span>
            {hasCspn && (
              <span className="flex items-center gap-1">
                <span
                  className="inline-block h-2 w-2 rounded-sm"
                  style={{ background: 'var(--color-tertiary)' }}
                />
                {SERIES_LABEL.cspn}
              </span>
            )}
          </span>
          <span>
            {totalCertified.toLocaleString()} records · {formatMonthLong(trend[0].month)}–
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
            // recharts 3.10 retyped labelFormatter's first parameter from the
            // axis value to ReactNode (a MINOR bump — caught by CI's Build
            // step as TS2345 on 2026-09-22, PR #709). With a categorical
            // XAxis on `month` it is that row's 'YYYY-MM' string at runtime,
            // so narrow rather than coerce: String(non-string) would feed
            // formatMonthLong a value it splits into NaN and render the words
            // "Invalid Date" into the tooltip, which looks like real data.
            // Falling back to the raw label instead keeps the failure visible.
            labelFormatter={(ym) => (typeof ym === 'string' ? formatMonthLong(ym) : ym)}
            formatter={(value, name) => [`${value}`, SERIES_LABEL[String(name)] ?? String(name)]}
          />
          <Bar dataKey="acvp" stackId="a" fill="var(--color-primary)" />
          <Bar dataKey="fips" stackId="a" fill="var(--color-secondary)" />
          <Bar
            dataKey="cc"
            stackId="a"
            fill="var(--color-accent)"
            radius={hasCspn ? undefined : [3, 3, 0, 0]}
          />
          {hasCspn && (
            <Bar dataKey="cspn" stackId="a" fill="var(--color-tertiary)" radius={[3, 3, 0, 0]} />
          )}
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        Records naming a PQC algorithm (ML-KEM, ML-DSA, SLH-DSA, LMS/HSS/XMSS, Falcon): FIPS 140-3
        from the certificate's Approved Algorithms list, NIST CAVP from the algorithm validation,
        and CC / EUCC / CSPN where the algorithm is named in the Security Target (a claim, not a
        validation of PQC support)
        {ambiguousCount > 0 &&
          ` — excludes ${ambiguousCount} record${ambiguousCount === 1 ? '' : 's'} flagged only as a potential name match`}
        {asOf && `. Newest record dated ${formatIsoDate(asOf.toISOString())}`}.
      </p>
    </div>
  )
}

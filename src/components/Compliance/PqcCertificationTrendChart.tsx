// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useMemo, useState } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { Button } from '@/components/ui/button'
import type { ComplianceRecord } from './types'
import type { CertificationXref, SoftwareItem } from '@/types/MigrateTypes'
import {
  buildListingStageTrend,
  buildProductStageTimeline,
  FIPS_STAGES,
  type FipsStage,
  type InProcessData,
  type InProcessMatch,
  type StagePoint,
} from './fipsStageProgressModel'
import { formatIsoDate } from './recordSemantics'

interface PqcCertificationTrendChartProps {
  /** Records already filtered to the reader's record scope (current only by default). */
  data: ComplianceRecord[]
  /** Newest certificate date in the snapshot (computeRecordsSnapshotDate) — the
   *  axis ends at its month. Not a retrieval date. Falls back to the wall clock
   *  only when the data hasn't loaded yet. */
  asOf: Date | null
}

type View = 'products' | 'listings'

/** The FIPS 140-3 track, in order (user decision, 2026-09-26). CAVP is the
 *  prerequisite, not a certificate; "in progress" only when NIST lists the
 *  module (Modules In Process / Implementation Under Test). */
const STAGE_LABEL: Record<View, Record<FipsStage, string>> = {
  products: {
    none: 'No PQC validation yet',
    cavp: 'Prerequisite met (CAVP)',
    in_progress: 'In progress (NIST IUT / MIP)',
    certified: 'Certified',
  },
  listings: {
    none: 'FIPS 140-3 certificate, no PQC',
    cavp: 'PQC CAVP validation',
    in_progress: 'IUT / MIP listing',
    certified: 'FIPS 140-3 certificate with PQC',
  },
}

const STAGE_COLOR: Record<FipsStage, string> = {
  // A visible grey on both themes — var(--color-muted) vanished on the light background.
  none: 'hsl(var(--muted-foreground) / 0.35)',
  cavp: 'var(--color-primary)',
  in_progress: 'var(--color-warning)',
  certified: 'var(--color-success)',
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

interface CatalogueData {
  products: SoftwareItem[]
  certsByProduct: Map<string, CertificationXref[]>
}

/** Small NIST JSON files published beside compliance-data.json. A missing file
 *  degrades to "no in-process data", never to a broken chart. */
async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path)
    return res.ok ? ((await res.json()) as T) : null
  } catch {
    return null
  }
}

/**
 * PQC progress along the FIPS 140-3 track, by month (Product Records tab):
 * no PQC → prerequisite met (CAVP) → in progress (NIST lists the module) →
 * certified. Two views:
 *   Products — our catalogue's products that ship PQC, by the stage each had
 *              reached that month (counts; "no PQC validation yet" is in the
 *              legend, not drawn — see `drawn` below).
 *   NIST listings — industry-wide listings appearing at each stage that month.
 * The model and its limits live in fipsStageProgressModel.ts.
 */
export function PqcCertificationTrendChart({ data, asOf }: PqcCertificationTrendChartProps) {
  const [view, setView] = useState<View>('products')
  const [inProcess, setInProcess] = useState<
    (InProcessData & { mipMeta?: { notDisplayed?: number } }) | null
  >(null)
  const [matches, setMatches] = useState<InProcessMatch[]>([])
  const [catalogue, setCatalogue] = useState<CatalogueData | null>(null)
  const referenceDate = useMemo(() => asOf ?? new Date(), [asOf])

  useEffect(() => {
    let live = true
    void fetchJson<InProcessData & { mipMeta?: { notDisplayed?: number } }>(
      '/data/fips-in-process.json'
    ).then((d) => live && setInProcess(d))
    void fetchJson<{ matches: InProcessMatch[] }>('/data/fips-in-process-matches.json').then(
      (d) => live && setMatches(d?.matches ?? [])
    )
    return () => {
      live = false
    }
  }, [])

  // The catalogue is large: load it only for the view that needs it, as its own
  // chunk (the Migrate page's), not inside the Compliance bundle.
  useEffect(() => {
    if (view !== 'products' || catalogue) return
    let live = true
    void Promise.all([import('@/data/migrateData'), import('@/data/certificationXrefData')]).then(
      ([m, x]) =>
        live && setCatalogue({ products: m.softwareData, certsByProduct: x.certsByProduct })
    )
    return () => {
      live = false
    }
  }, [view, catalogue])

  const productTimeline = useMemo(
    () =>
      catalogue
        ? buildProductStageTimeline(
            catalogue.products,
            catalogue.certsByProduct,
            matches,
            referenceDate
          )
        : null,
    [catalogue, matches, referenceDate]
  )
  const listingTrend = useMemo(
    () =>
      buildListingStageTrend(
        data,
        inProcess,
        referenceDate,
        '2024-01',
        inProcess?.mipMeta?.notDisplayed ?? null
      ),
    [data, inProcess, referenceDate]
  )

  const points: StagePoint[] =
    view === 'products' ? (productTimeline?.points ?? []) : listingTrend.points
  const latest = points[points.length - 1]
  const tickInterval = Math.max(0, Math.ceil(points.length / 9) - 1)
  const labels = STAGE_LABEL[view]
  // Products view: "no PQC validation yet" is ~89% of the 575 products that
  // ship PQC (measured 2026-09-26), so drawing it — as counts or as shares —
  // flattens the three stages that show progress into slivers. It stays in the
  // legend with its count and is not drawn. The listings view draws all four:
  // there the no-PQC band is FIPS certificates, comparable in size.
  const drawn: readonly FipsStage[] =
    view === 'products' ? FIPS_STAGES.filter((s) => s !== 'none') : FIPS_STAGES

  return (
    <div className="glass-panel rounded-lg p-3" data-testid="fips-stage-chart">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-sm font-medium text-foreground">
          PQC progress along the FIPS 140-3 track, by month
        </h3>
        <div className="flex items-center gap-1" role="group" aria-label="Chart view">
          {(['products', 'listings'] as View[]).map((v) => (
            <Button
              key={v}
              type="button"
              size="sm"
              variant={view === v ? 'secondary' : 'ghost'}
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className="h-6 px-2 text-xs"
            >
              {v === 'products' ? 'Catalogue products' : 'NIST listings'}
            </Button>
          ))}
        </div>
      </div>

      <div className="mb-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {FIPS_STAGES.map((s) => (
          <span key={s} className="flex items-center gap-1">
            <span
              className="inline-block h-2 w-2 rounded-sm"
              style={{ background: STAGE_COLOR[s] }}
            />
            {labels[s]}
            {latest && <span className="text-foreground/70">· {latest[s].toLocaleString()}</span>}
            {!drawn.includes(s) && <span className="italic">(not drawn)</span>}
          </span>
        ))}
      </div>

      {points.length === 0 ? (
        <p className="py-10 text-center text-xs text-muted-foreground">Loading…</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={points} margin={{ top: 6, right: 4, bottom: 0, left: 0 }}>
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
              // recharts 3.10 types the label as ReactNode; it is the row's
              // 'YYYY-MM' at runtime — narrow rather than coerce (see #709).
              labelFormatter={(ym) => (typeof ym === 'string' ? formatMonthLong(ym) : ym)}
              formatter={(value, name) => [
                `${value}`,
                labels[String(name) as FipsStage] ?? String(name),
              ]}
            />
            {drawn.map((s, i) => (
              <Bar
                key={s}
                dataKey={s}
                stackId="a"
                fill={STAGE_COLOR[s]}
                radius={i === drawn.length - 1 ? [3, 3, 0, 0] : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}

      <p className="mt-1.5 text-[11px] text-muted-foreground" data-testid="fips-stage-note">
        {view === 'products' ? (
          <>
            How many of the {productTimeline?.universe.toLocaleString() ?? '…'} catalogue products
            that ship PQC had reached each stage that month; the rest have no PQC validation yet —
            dated from the product&apos;s own first PQC CAVP validation, NIST listing and
            PQC-covering certificate. A CAVP validation is the prerequisite for FIPS 140-3, not a
            certificate; &ldquo;in progress&rdquo; only when NIST lists the module as Implementation
            Under Test or Modules In Process.
            {!!productTimeline?.undated &&
              ` ${productTimeline.undated} product${productTimeline.undated === 1 ? ' is' : 's are'} at a stage we cannot yet date, and ${productTimeline.undated === 1 ? 'is' : 'are'} drawn at the last stage we can.`}{' '}
            NIST keeps no history of its in-process lists, so the in-progress band covers modules
            listed now; it grows history from 26 September 2026.
          </>
        ) : (
          <>
            NIST listings appearing each month, industry-wide: FIPS 140-3 certificates by whether
            their Approved Algorithms include PQC, PQC CAVP validations, and in-process listings —
            Implementation Under Test by IUT date, Modules In Process by the date of their current
            review stage (NIST publishes no entry date)
            {listingTrend.inProcessNotDisplayed
              ? `; NIST withholds ${listingTrend.inProcessNotDisplayed} in-process modules by vendor request`
              : ''}
            . Counts listings, not distinct modules — one module can appear at several stages.
          </>
        )}
        {asOf && ` Newest record dated ${formatIsoDate(asOf.toISOString())}.`}
      </p>
    </div>
  )
}

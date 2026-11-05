// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Settlement Exposure Modeller.
 *
 * Pick a settlement rail, set how long its data stays sensitive, and see the
 * harvest-now-decrypt-later exposure against the CRQC bands the hub already
 * carries. The point is not a precise year — nobody has one — it is that the
 * answer is driven by *retention*, which is a business fact the learner knows,
 * rather than by a CRQC date, which nobody knows.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Landmark, TriangleAlert, ShieldCheck, Clock } from 'lucide-react'
import { SETTLEMENT_RAILS } from '../data/bankingData'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { Button } from '@/components/ui/button'
import { CRQC_ESTIMATES } from '@/data/regulatoryTimelines'
import { UnresolvedEstimatesNotice } from '@/components/common/UnresolvedEstimatesNotice'

/** Conservative / central / optimistic CRQC arrival bands, in calendar years. */
const CRQC_BANDS = [
  { id: 'early', label: `Early (${CRQC_ESTIMATES.lowerBound})`, year: CRQC_ESTIMATES.lowerBound },
  { id: 'central', label: `Central (${CRQC_ESTIMATES.moderate})`, year: CRQC_ESTIMATES.moderate },
  { id: 'late', label: `Late (${CRQC_ESTIMATES.upperBound})`, year: CRQC_ESTIMATES.upperBound },
] as const

const RETENTION_PRESETS = [3, 5, 7, 10, 15, 25]

export const SettlementExposureModeller = () => {
  const [railId, setRailId] = useState(SETTLEMENT_RAILS[0].id)
  const [retention, setRetention] = useState(7)
  const [bandId, setBandId] = useState<(typeof CRQC_BANDS)[number]['id']>('central')

  const rail = SETTLEMENT_RAILS.find((r) => r.id === railId) ?? SETTLEMENT_RAILS[0]
  const band = CRQC_BANDS.find((b) => b.id === bandId) ?? CRQC_BANDS[1]

  const result = useMemo(() => {
    const sampleCaptureYear = 2026
    // Mosca's theorem is X + Y > Z: data shelf life (X) plus the time to migrate
    // (Y) against the time until a CRQC (Z). This model sets the migration-time
    // term Y to zero, which is the form that matters here: data captured in the sample year is
    // still sensitive when a CRQC arrives if
    //   captureYear + retention > crqcYear.
    // A real migration time only widens the window, so the result is a floor.
    const stillSensitiveUntil = sampleCaptureYear + retention
    const exposedYears = stillSensitiveUntil - band.year
    const exposed = exposedYears > 0
    // Strict captureYear + retention > crqcYear means captures after this boundary
    // (and before the assumed CRQC year) remain within the selected lifetime.
    const captureYearBoundary = band.year - retention
    return { stillSensitiveUntil, exposedYears, exposed, captureYearBoundary }
  }, [retention, band])

  return (
    <div className="space-y-6">
      <UnresolvedEstimatesNotice detail="workshopExample" />
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Landmark size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gradient">Settlement Exposure Modeller</h3>
            <p className="text-sm text-muted-foreground">
              Harvest-now-decrypt-later exposure for a settlement rail, driven by how long its data
              stays sensitive.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              This model compares data shelf life plus migration duration with the time until a CRQC
              (related reading in the{' '}
              <Link
                to="/library?ref=FRB-FEDS-2025093-Blockchain-PQC"
                className="text-primary hover:underline"
              >
                Federal Reserve&rsquo;s harvest-now-decrypt-later paper
              </Link>
              ). The model sets the migration-time term to zero, so treat the result as a floor: a
              migration that takes longer widens the exposure.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 [&>*]:min-w-0">
          <div>
            <FilterDropdown
              label="Settlement rail"
              selectedId={railId}
              onSelect={setRailId}
              items={SETTLEMENT_RAILS.map((r) => ({ id: r.id, label: r.label }))}
            />
          </div>
          <fieldset className="border-0 p-0 m-0">
            <legend className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">
              Confidentiality lifetime
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {RETENTION_PRESETS.map((y) => (
                <Button
                  key={y}
                  type="button"
                  variant={retention === y ? 'gradient' : 'outline'}
                  onClick={() => setRetention(y)}
                  className="px-2.5 py-1 text-xs"
                  aria-pressed={retention === y}
                  aria-label={`${y} year confidentiality lifetime`}
                >
                  {y}y
                </Button>
              ))}
            </div>
          </fieldset>
          <div>
            <FilterDropdown
              label="CRQC arrival assumption"
              selectedId={bandId}
              onSelect={(v) => setBandId(v as (typeof CRQC_BANDS)[number]['id'])}
              items={CRQC_BANDS.map((b) => ({ id: b.id, label: b.label }))}
            />
          </div>
        </div>
      </section>

      <section
        className={`glass-panel p-6 border-l-4 ${
          result.exposed ? 'border-l-status-error' : 'border-l-status-success'
        }`}
      >
        <div className="flex items-start gap-3">
          {result.exposed ? (
            <TriangleAlert size={20} className="text-status-error shrink-0 mt-0.5" />
          ) : (
            <ShieldCheck size={20} className="text-status-success shrink-0 mt-0.5" />
          )}
          <div className="space-y-2">
            <p className="font-semibold">
              {result.exposed
                ? `Exposed by ${result.exposedYears} year${result.exposedYears === 1 ? '' : 's'}`
                : 'Not exposed under this assumption'}
            </p>
            <p className="text-sm text-muted-foreground">
              Traffic captured in the sample year 2026 has a selected confidentiality lifetime
              ending in <strong>{result.stillSensitiveUntil}</strong>. A CRQC assumed for{' '}
              <strong>{band.year}</strong>{' '}
              {result.exposed
                ? 'falls within that selected lifetime — potential exposure in this illustrative model.'
                : 'falls at or after that selected lifetime ends — no overlap under this model’s strict comparison.'}
            </p>
            <p className="text-sm text-muted-foreground">
              <Clock size={13} className="inline mr-1 -mt-0.5" />
              The capture-year boundary is <strong>{result.captureYearBoundary}</strong>. Under the
              strict comparison used here, traffic captured after this boundary and before the
              assumed CRQC year remains within the selected confidentiality lifetime at that year.
              Capture at the boundary ends its lifetime in the assumed CRQC year and is not counted
              as overlap. These coarse year-level assumptions do not establish attacker holdings or
              a migration deadline.
            </p>
          </div>
        </div>
      </section>

      <section className="glass-panel p-6 space-y-3">
        <h4 className="font-semibold">{rail.label}</h4>
        <p className="text-sm text-muted-foreground">{rail.description}</p>
        <dl className="grid gap-3 sm:grid-cols-3 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Protected today by
            </dt>
            <dd className="mt-0.5">{rail.classical}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Data lifetime</dt>
            <dd className="mt-0.5">{rail.dataLifetime}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">PQC posture</dt>
            <dd className="mt-0.5">{rail.pqcPosture}</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}

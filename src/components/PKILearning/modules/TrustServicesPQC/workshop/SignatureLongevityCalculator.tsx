// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Signature Longevity Calculator.
 *
 * An illustrative scenario: set how long a signature must remain evaluable and
 * see which degradation stages fall inside that window, against an assumed
 * signing algorithm and an assumed policy cutoff that are shown on the page.
 * The output people find uncomfortable is the renewal obligation: it is driven
 * by the archive you already have, not by new signing volume. Neither a
 * retention period nor the assumed cutoff proves that a signature survives.
 */
import { useMemo, useState } from 'react'
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { LTV_STAGES, LTV_SCENARIO, longevityScenario } from '../data/trustServicesData'
import { Button } from '@/components/ui/button'

const ARCHIVE_EXAMPLE = {
  signerExpiry: 2029,
  timestampDeadline: 2034,
  hashDeadline: 2032,
  reviewYears: [2031, 2032, 2034],
} as const

function ArchiveRenewalPractice() {
  const [renewalYear, setRenewalYear] = useState<number>(2034)
  const [replaceHash, setReplaceHash] = useState(false)
  const deadline = replaceHash ? ARCHIVE_EXAMPLE.hashDeadline : ARCHIVE_EXAMPLE.timestampDeadline
  const inTime = renewalYear < deadline

  return (
    <section className="glass-panel space-y-4 p-4 sm:p-6" aria-labelledby="archive-renewal">
      <div className="space-y-2">
        <h4 id="archive-renewal" className="font-semibold">
          Choose an archive renewal plan
        </h4>
        <p className="text-sm text-muted-foreground">
          In this fictional archive the original signer’s certificate expires in{' '}
          {ARCHIVE_EXAMPLE.signerExpiry}. You already have a trusted time of signing and retained
          certificate chain and status evidence. The active archive timestamp must be renewed before{' '}
          {ARCHIVE_EXAMPLE.timestampDeadline}. If the hash is being retired, the earlier deadline is{' '}
          {ARCHIVE_EXAMPLE.hashDeadline}. These are the sample archive’s policy dates.
        </p>
      </div>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={replaceHash}
          onChange={(event) => setReplaceHash(event.target.checked)}
        />
        The archive hash must be replaced
      </label>
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">Planned renewal year</legend>
        <div className="flex flex-wrap gap-2">
          {ARCHIVE_EXAMPLE.reviewYears.map((year) => (
            <Button
              key={year}
              type="button"
              variant={renewalYear === year ? 'gradient' : 'outline'}
              aria-pressed={renewalYear === year}
              onClick={() => setRenewalYear(year)}
              className="min-h-11"
            >
              {year}
            </Button>
          ))}
        </div>
      </fieldset>
      <div role="status" className="space-y-1 rounded-md border border-border p-3 text-sm">
        <p className="font-semibold">
          {inTime ? 'Before the example deadline' : 'Deadline missed in this example'}
        </p>
        <p>
          {replaceHash
            ? 'Hash-tree renewal covers the original records and the existing archive evidence with a new hash tree and timestamp.'
            : 'Timestamp renewal timestamps the existing archive timestamp with an acceptable timestamp service while retaining the existing hash protection.'}
        </p>
        <p className="text-muted-foreground">
          {inTime
            ? 'This schedule leaves time to validate the records and obtain renewal evidence.'
            : 'A timestamp collected after trust is lost cannot repair the gap. Review independently preserved evidence.'}
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        This exercise checks the dates and evidence required by these assumptions. It does not
        validate an archive. See{' '}
        <a
          className="underline underline-offset-2"
          href="https://www.rfc-editor.org/rfc/rfc4998.html#section-5"
        >
          RFC 4998 §5
        </a>{' '}
        for renewal and{' '}
        <a
          className="underline underline-offset-2"
          href="https://www.rfc-editor.org/rfc/rfc3161.html#section-4"
        >
          RFC 3161 §4
        </a>{' '}
        for using a timestamp with a signature.
      </p>
    </section>
  )
}

const HORIZONS = [
  { years: 3, label: '3y — commercial contract' },
  { years: 7, label: '7y — tax/audit retention' },
  { years: 10, label: '10y — corporate records' },
  { years: 30, label: '30y — notarial deed' },
  { years: 100, label: '100y — land registry' },
]

/** Which stages bite inside a given horizon, by the lower bound of each stage. */
const STAGE_ONSET: Record<string, number> = {
  creation: 0,
  'cert-expiry': 1,
  'revocation-data': 3,
  'algorithm-weakens': 5,
  archival: 20,
}

export const SignatureLongevityCalculator = () => {
  const [horizon, setHorizon] = useState(30)

  const { inScope, scenario } = useMemo(() => {
    const inScope = LTV_STAGES.filter((s) => STAGE_ONSET[s.id] <= horizon)
    // Illustrative scenario: signed this year with the assumed classical algorithm, checked
    // against one assumed policy cutoff. The dates are shown to the learner, not hidden.
    const scenario = longevityScenario(horizon, new Date().getFullYear())
    return { inScope, scenario }
  }, [horizon])

  const spansAlgorithmChange = scenario.endsAfterCutoff

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Clock size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gradient">Signature Longevity Calculator</h3>
            <p className="text-sm text-muted-foreground">
              How long must this signature stay evaluable, and what does that oblige you to do?
            </p>
          </div>
        </div>

        <fieldset className="border-0 p-0 m-0">
          <legend className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">
            Required validity horizon
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {HORIZONS.map((h) => (
              <Button
                key={h.years}
                type="button"
                variant={horizon === h.years ? 'gradient' : 'outline'}
                onClick={() => setHorizon(h.years)}
                className="px-3 py-1 text-xs"
                aria-pressed={horizon === h.years}
              >
                {h.label}
              </Button>
            ))}
          </div>
        </fieldset>
      </section>

      <section
        className={`glass-panel p-6 border-l-4 ${
          spansAlgorithmChange ? 'border-l-status-warning' : 'border-l-status-success'
        }`}
      >
        <div className="flex items-start gap-3">
          {spansAlgorithmChange ? (
            <AlertTriangle size={20} className="text-status-warning shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 size={20} className="text-status-success shrink-0 mt-0.5" />
          )}
          <div className="space-y-2">
            <p className="font-semibold">
              {spansAlgorithmChange
                ? 'In this scenario the horizon runs past the assumed policy cutoff'
                : 'In this scenario the horizon ends no later than the assumed policy cutoff'}
            </p>
            <p className="text-xs text-muted-foreground">
              Illustrative scenario, not a prediction. Assumed: signed in{' '}
              <strong>{scenario.signingYear}</strong> with {LTV_SCENARIO.algorithm}, needed until{' '}
              <strong>{scenario.endYear}</strong>, checked against one policy cutoff,{' '}
              <strong>{scenario.cutoffYear}</strong> ({LTV_SCENARIO.policyCutoffBasis}).
            </p>
            <p className="text-sm text-muted-foreground">
              {spansAlgorithmChange ? (
                <>
                  Review this {horizon}-year archive’s validation policy and current evidence.
                  Preserve evidence from the original signing and renew archive protection before
                  the active timestamp or hash becomes unacceptable. The work scales with the
                  records already in the archive.
                </>
              ) : (
                <>
                  Ending by {scenario.cutoffYear} does not prove the signature survives its window.
                  Capture trusted time, the certificate chain and status evidence under your policy.
                  Ordinary expiry of the original signing certificate can still allow evaluation at
                  the earlier proven time. Monitor the archive timestamp and hash for their own
                  renewal deadlines.
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      <ArchiveRenewalPractice />

      <section className="space-y-3">
        <h4 className="font-semibold">Stages inside a {horizon}-year window</h4>
        <p className="text-xs text-muted-foreground">
          The stage windows are this module&apos;s illustrative ranges, not dates for your algorithm
          or your certificates.
        </p>
        {inScope.map((s) => (
          <div key={s.id} className="glass-panel p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h5 className="font-medium">{s.label}</h5>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {s.horizon}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{s.risk}</p>
            <p className="mt-1 text-sm text-foreground">{s.action}</p>
          </div>
        ))}
      </section>
    </div>
  )
}

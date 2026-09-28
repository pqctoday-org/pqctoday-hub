// SPDX-License-Identifier: GPL-3.0-only
import { ExternalLink, Grid3x3 } from 'lucide-react'
import clsx from 'clsx'
import {
  COVERAGE_MATRIX_HREF,
  formatParameters,
  type CaseEvidenceRecord,
} from '@/data/validation/caseEvidence'
import { EVIDENCE_CLASSES, EVIDENCE_CLASS_SHORT } from '@/data/validation/evidenceClasses'

/** Public coverage matrix URL, honouring the deploy base path. */
export const coverageMatrixUrl = (): string =>
  `${(import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')}${COVERAGE_MATRIX_HREF}`

/**
 * Per-result evidence, rendered from the generated per-case records (plan
 * WS-I): the class chip, and on demand the exact case, operation, parameters,
 * polarity, source, exercised capabilities and limitations, plus a link to
 * the public coverage matrix. Used by the Playground workbench and the
 * Algorithms / Learn KAT views, so a case reads the same everywhere.
 *
 * `records` empty → the result is not a registered case (skip or error rows,
 * unregistered tests): no badge, never a guessed one.
 */
export const CaseEvidenceBadge = ({
  records,
  className,
}: {
  records: readonly CaseEvidenceRecord[]
  className?: string
}) => {
  if (records.length === 0) return null
  const classes = [...new Set(records.map((r) => r.evidenceClass))]
  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      <div className="flex flex-wrap gap-1">
        {classes.map((c) => (
          <span
            key={c}
            data-testid="case-evidence-badge"
            data-evidence={c}
            title={`${EVIDENCE_CLASSES[c].label} — permitted claim: ${EVIDENCE_CLASSES[c].permittedClaim}`}
            className={clsx(
              'inline-block w-fit whitespace-nowrap rounded border px-1.5 py-0.5 text-[10px] font-medium',
              c === 'nist-acvp-reference-sample'
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-border bg-muted/40 text-muted-foreground'
            )}
          >
            {EVIDENCE_CLASS_SHORT[c]}
          </span>
        ))}
      </div>
      <details data-testid="case-evidence-details" className="group text-[10.5px]">
        <summary className="cursor-pointer text-primary hover:underline w-fit">
          case, source &amp; limits
        </summary>
        <div className="mt-1 space-y-2 rounded border border-border bg-muted/20 p-2 text-muted-foreground">
          {records.map((r) => (
            <dl key={r.id} className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
              <dt className="font-medium text-foreground">Claim</dt>
              <dd>{EVIDENCE_CLASSES[r.evidenceClass].permittedClaim}</dd>
              <dt className="font-medium text-foreground">Case</dt>
              <dd className="break-all font-mono">
                {r.caseId}
                {r.upstream?.tgId !== undefined &&
                  ` · upstream tg${r.upstream.tgId}/tc${r.upstream.tcId ?? '?'}`}
                {r.upstream?.label && ` · ${r.upstream.label}`}
              </dd>
              {(r.algorithm || r.operation) && (
                <>
                  <dt className="font-medium text-foreground">Operation</dt>
                  <dd>
                    {[r.algorithm, r.operation, r.testType].filter(Boolean).join(' · ')} ·{' '}
                    {r.polarity === 'negative' ? 'negative (must be rejected)' : 'positive'}
                  </dd>
                </>
              )}
              {Object.keys(r.parameters).length > 0 && (
                <>
                  <dt className="font-medium text-foreground">Parameters</dt>
                  <dd>{formatParameters(r.parameters)}</dd>
                </>
              )}
              <dt className="font-medium text-foreground">Exercises</dt>
              <dd className="font-mono">{r.exercises.join('; ') || '—'}</dd>
              <dt className="font-medium text-foreground">Source</dt>
              <dd>
                {r.source ? (
                  <>
                    {r.source.citation}
                    {r.source.url && (
                      <>
                        {' '}
                        <a
                          href={r.source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-primary hover:underline"
                        >
                          source <ExternalLink size={9} />
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  'none — values produced at run time'
                )}
              </dd>
              {r.limitations.length > 0 && (
                <>
                  <dt className="font-medium text-foreground">Limits</dt>
                  <dd>
                    <ul className="list-disc space-y-0.5 pl-3">
                      {r.limitations.map((l) => (
                        <li key={l}>{l}</li>
                      ))}
                    </ul>
                  </dd>
                </>
              )}
            </dl>
          ))}
          <a
            href={coverageMatrixUrl()}
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <Grid3x3 size={10} aria-hidden="true" /> Full coverage matrix and open gaps
          </a>
        </div>
      </details>
    </div>
  )
}

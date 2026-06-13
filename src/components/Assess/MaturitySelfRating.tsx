// SPDX-License-Identifier: GPL-3.0-only
/**
 * Maturity self-rating L0–L4 input (gap-closer #6, Assess #7 · Foundations phase).
 *
 * A controlled, keyboard-accessible per-domain L0–L4 capability ladder. The
 * parent owns the `ratings` state and receives changes via `onChange`; the
 * aggregate (fed into the QRA) is derived with `aggregateMaturity`.
 *
 * Additive: rendering this component has no effect on the existing wizard or
 * scoring. It only collects a self-rating that the QRA builder can consume.
 *
 * Accessibility: each domain is a radiogroup; the five ladder rungs are
 * radio-role buttons navigable with the keyboard. Uses the shared `Button`
 * UI-kit component (raw <button> is lint-blocked).
 */
import React from 'react'
import { Gauge } from 'lucide-react'
import { Button } from '../ui/button'
import clsx from 'clsx'
import {
  MATURITY_DOMAINS,
  MATURITY_DOMAIN_ORDER,
  aggregateMaturity,
  type MaturityDomainId,
  type MaturityDomainRating,
  type MaturityLevel,
} from '../../hooks/assessment/maturity'

export interface MaturitySelfRatingProps {
  /** Controlled per-domain ratings (one entry per domain). */
  ratings: MaturityDomainRating[]
  /** Fires with the full next ratings array whenever a rung is picked. */
  onChange: (next: MaturityDomainRating[]) => void
  /** Optional heading override. */
  title?: string
  className?: string
}

const LEVELS: MaturityLevel[] = [0, 1, 2, 3, 4]

const BAND_LABEL: Record<string, string> = {
  nascent: 'Nascent',
  developing: 'Developing',
  defined: 'Defined',
  managed: 'Managed',
  optimised: 'Optimised',
}

export const MaturitySelfRating: React.FC<MaturitySelfRatingProps> = ({
  ratings,
  onChange,
  title = 'Quantum-Readiness Maturity (self-rating)',
  className,
}) => {
  const levelFor = (domain: MaturityDomainId): MaturityLevel | null =>
    ratings.find((r) => r.domain === domain)?.level ?? null

  const setLevel = (domain: MaturityDomainId, level: MaturityLevel) => {
    const exists = ratings.some((r) => r.domain === domain)
    const next = exists
      ? ratings.map((r) => (r.domain === domain ? { ...r, level } : r))
      : [...ratings, { domain, level }]
    onChange(next)
  }

  const aggregate = aggregateMaturity(ratings)

  return (
    <section
      className={clsx('glass-panel p-5', className)}
      data-testid="maturity-self-rating"
      aria-labelledby="maturity-self-rating-title"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-full bg-primary/10">
            <Gauge className="text-primary" size={18} aria-hidden="true" />
          </span>
          <div>
            <h3 id="maturity-self-rating-title" className="text-base font-bold text-foreground">
              {title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Rate each domain L0 (none) to L4 (optimised). Feeds your Quantum Readiness Assessment.
            </p>
          </div>
        </div>
        <div className="text-right shrink-0" aria-live="polite">
          <p className="text-2xl font-bold text-primary tabular-nums">
            {aggregate.ratedCount > 0 ? aggregate.score : '—'}
            {aggregate.ratedCount > 0 && (
              <span className="text-sm text-muted-foreground">/100</span>
            )}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {aggregate.ratedCount > 0
              ? `${BAND_LABEL[aggregate.band]} · ${aggregate.ratedCount}/${MATURITY_DOMAIN_ORDER.length} rated`
              : 'Not yet rated'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {MATURITY_DOMAIN_ORDER.map((domainId) => {
          // eslint-disable-next-line security/detect-object-injection
          const domain = MATURITY_DOMAINS[domainId]
          const current = levelFor(domainId)
          return (
            <div key={domainId}>
              <div className="flex items-baseline justify-between gap-2 mb-1.5">
                <p className="text-sm font-semibold text-foreground">{domain.label}</p>
                <p className="text-[11px] text-muted-foreground hidden sm:block">
                  {domain.description}
                </p>
              </div>
              <div
                role="radiogroup"
                aria-label={`${domain.label} maturity level`}
                className="grid grid-cols-5 gap-1.5"
              >
                {LEVELS.map((level) => {
                  const selected = current === level
                  return (
                    <Button
                      key={level}
                      type="button"
                      variant="ghost"
                      role="radio"
                      aria-checked={selected}
                      // eslint-disable-next-line security/detect-object-injection
                      title={domain.ladder[level]}
                      onClick={() => setLevel(domainId, level)}
                      className={clsx(
                        'h-auto py-2 flex-col gap-0.5 border whitespace-normal',
                        selected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40'
                      )}
                    >
                      <span className="text-xs font-bold">L{level}</span>
                    </Button>
                  )
                })}
              </div>
              {current !== null && (
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  {/* eslint-disable-next-line security/detect-object-injection */}
                  {domain.ladder[current]}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

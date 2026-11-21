// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import { Info } from 'lucide-react'
import { getStandard } from '@/data/standardsRegistry'
import {
  SOURCE_CLAIMS,
  type ClaimMaturity,
  type SourceClaim,
  type SourceClaimId,
} from '../data/sourceClaims'

const MATURITY_BADGE: Record<ClaimMaturity, string> = {
  demonstrated: 'bg-status-success/15 text-status-success border-status-success/40',
  reported: 'bg-status-warning/15 text-status-warning border-status-warning/40',
  hypothesised: 'bg-status-info/15 text-status-info border-status-info/40',
}

/**
 * Renders a rubric-backed claim statement with its maturity chip, causal-role
 * classification, primary Library links, and an expandable Capability Rubric drawer.
 */
export const ClaimLine: React.FC<{ id: SourceClaimId; chip?: string }> = ({ id, chip }) => {
  // eslint-disable-next-line security/detect-object-injection
  const claim: SourceClaim = SOURCE_CLAIMS[id]
  const primaryStd = claim.sourceId ? getStandard(claim.sourceId) : null
  const extraStds = (claim.extraSourceIds ?? []).map((sid) => getStandard(sid))

  return (
    <div className="p-3.5 rounded-lg bg-muted/50 border border-border space-y-2" data-claim={id}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-card border border-border text-muted-foreground">
          {claim.id}
        </span>
        <span
          className={`inline-block text-[10px] px-2 py-0.5 rounded border font-bold uppercase tracking-wide ${
            MATURITY_BADGE[claim.claimStatus]
          }`}
        >
          {claim.claimStatus}
        </span>
        <span className="inline-block text-[10px] px-2 py-0.5 rounded border bg-card border-border text-muted-foreground">
          AI role: {claim.causalRole}
        </span>
        <span className="inline-block text-[10px] px-2 py-0.5 rounded border bg-card border-border text-muted-foreground">
          scope: {claim.scopeLevel}
        </span>
        {chip ? (
          <span className="inline-block text-[10px] px-2 py-0.5 rounded border font-bold bg-primary/10 text-primary border-primary/30">
            {chip}
          </span>
        ) : null}
      </div>

      <p className="text-sm text-foreground leading-relaxed">{claim.text}</p>

      <p className="text-xs text-muted-foreground">
        {primaryStd ? (
          <>
            Source:{' '}
            <Link to={primaryStd.deepLink} className="text-primary hover:underline font-medium">
              {claim.edition}
            </Link>
            {extraStds.length > 0 ? (
              <>
                {' '}
                (also:{' '}
                {extraStds.map((s, idx) => (
                  <React.Fragment key={s.id}>
                    {idx > 0 ? ', ' : ''}
                    <Link to={s.deepLink} className="text-primary hover:underline">
                      {s.id}
                    </Link>
                  </React.Fragment>
                ))}
                )
              </>
            ) : null}
            , {claim.locator}
          </>
        ) : (
          <>
            {claim.recordType} (as-of {claim.asOfDate}) &middot; {claim.locator} &middot; Premises:{' '}
            {claim.premiseIds.join(', ')}
          </>
        )}
      </p>

      <details className="text-xs text-muted-foreground border-t border-border/60 pt-2">
        <summary className="cursor-pointer font-medium text-foreground/80 hover:text-primary select-none">
          Capability rubric details (discovery, reproduction, patch, exploitation &amp; limits)
        </summary>
        <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
          <div>
            <dt className="font-semibold text-foreground/90">Assistance mode</dt>
            <dd>{claim.assistanceMode}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground/90">Model &amp; tools</dt>
            <dd>{claim.modelAndTools}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground/90">Discovery</dt>
            <dd>{claim.discovery}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground/90">Reproduction</dt>
            <dd>{claim.reproduction}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground/90">Patch / mitigation</dt>
            <dd>{claim.patch}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground/90">Successful exploitation</dt>
            <dd>{claim.successfulExploitation}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground/90">Independently reproduced</dt>
            <dd>{claim.independentlyReproduced}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground/90">Human effort / cost</dt>
            <dd>
              {claim.humanEffort}; {claim.costAndAttempts}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground/90">Success rate</dt>
            <dd>{claim.successRate}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground/90">Target &amp; version</dt>
            <dd>{claim.targetAndVersion}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground/90">Adversary access</dt>
            <dd>{claim.adversaryAccess}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground/90">Production impact</dt>
            <dd>{claim.productionImpact}</dd>
          </div>
        </dl>
      </details>
    </div>
  )
}

/** Lesson-authored framing or boundary note, clearly separated from primary-source claims. */
export const ReadingNote: React.FC<{ title?: string; children: React.ReactNode }> = ({
  title = 'Evidence boundary',
  children,
}) => (
  <div className="p-4 rounded-lg bg-status-info/10 border border-status-info/30 space-y-2">
    <h3 className="font-semibold text-foreground flex items-center gap-2">
      <Info size={16} /> {title}
    </h3>
    <div className="text-sm text-muted-foreground space-y-2">{children}</div>
  </div>
)

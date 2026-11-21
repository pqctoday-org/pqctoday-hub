// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import { Info, ShieldAlert } from 'lucide-react'
import { getStandard } from '@/data/standardsRegistry'
import {
  ANALYSIS_CLAIMS,
  SOURCE_CLAIMS,
  type AnalysisClaimId,
  type SourceClaimId,
} from '../data/sourceClaims'

const FORCE_LABELS: Record<(typeof SOURCE_CLAIMS)[SourceClaimId]['force'], string> = {
  'binding-statute': 'Binding Statute / Rule',
  'binding-rts': 'Binding Technical Standard (RTS)',
  'supervisory-guidance': 'Supervisory Guidance',
  'accounting-context': 'Accounting Context (Not Key Control)',
  'permissibility-context': 'Permissibility Context (Not Key Control)',
  'international-policy': 'International Policy Recommendation',
  'industry-standard': 'Industry Standard (Not Regulation)',
  'assurance-standard': 'Assurance Standard',
  'market-practice-broker': 'Market Practice (Insurer / Broker)',
  'technical-research': 'Technical Research',
}

/** A sourced statement bound to a single Library document with edition and locator. */
export const ClaimLine: React.FC<{ id: SourceClaimId; chip?: string }> = ({ id, chip }) => {
  // eslint-disable-next-line security/detect-object-injection
  const claim = SOURCE_CLAIMS[id]
  const std = getStandard(claim.sourceId)
  const forceLabel = FORCE_LABELS[claim.force]
  return (
    <div className="p-3 rounded-lg bg-muted/50 border border-border" data-claim={id}>
      <div className="flex flex-wrap items-center gap-1.5 mb-1">
        {chip ? (
          <span className="inline-block text-[10px] px-2 py-0.5 rounded border font-bold bg-primary/10 text-primary border-primary/30">
            {chip}
          </span>
        ) : null}
        <span className="inline-block text-[10px] px-2 py-0.5 rounded border font-medium bg-muted text-muted-foreground border-border">
          {forceLabel}
        </span>
      </div>
      <p className="text-sm text-foreground">{claim.text}</p>
      <p className="text-xs text-muted-foreground mt-1">
        Source:{' '}
        <Link to={std.deepLink} className="text-primary hover:underline">
          {claim.edition}
        </Link>
        , {claim.locator}
      </p>
    </div>
  )
}

/** An ANALYSIS or NEGATIVE conclusion carrying premise IDs, Rule G1 assumptions, and as-of date. */
export const AnalysisLine: React.FC<{ id: AnalysisClaimId; title?: string }> = ({ id, title }) => {
  // eslint-disable-next-line security/detect-object-injection
  const entry = ANALYSIS_CLAIMS[id]
  return (
    <div
      className="p-3 rounded-lg bg-status-info/10 border border-status-info/30 space-y-1.5"
      data-analysis-claim={id}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border font-bold bg-status-info/15 text-status-info border-status-info/40">
          <ShieldAlert size={11} aria-hidden="true" /> {entry.kind} · as of {entry.asOfDate}
        </span>
        {title ? <span className="text-xs font-semibold text-foreground">{title}</span> : null}
      </div>
      <p className="text-sm text-foreground">{entry.text}</p>
      <p className="text-xs text-muted-foreground">
        <strong className="text-foreground">Rule G1:</strong> {entry.g1Authorities}
      </p>
      <p className="text-[11px] text-muted-foreground">Premises: {entry.premiseIds.join(', ')}</p>
    </div>
  )
}

/** Wording that is the lesson's own framing, educational boundary, or scope note. */
export const ReadingNote: React.FC<{ title?: string; children: React.ReactNode }> = ({
  title = 'Educational scope & authority framing',
  children,
}) => (
  <div className="p-4 rounded-lg bg-status-info/10 border border-status-info/30 space-y-2">
    <h3 className="font-semibold text-foreground flex items-center gap-2">
      <Info size={16} aria-hidden="true" /> {title}
    </h3>
    <div className="text-sm text-muted-foreground space-y-2">{children}</div>
  </div>
)

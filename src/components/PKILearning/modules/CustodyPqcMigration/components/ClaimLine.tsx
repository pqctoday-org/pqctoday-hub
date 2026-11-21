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

const MATURITY_BADGE: Record<ClaimMaturity, { label: string; className: string }> = {
  standard: {
    label: 'Standard',
    className: 'bg-status-success/15 text-status-success border-status-success/40',
  },
  draft: {
    label: 'Draft',
    className: 'bg-status-warning/15 text-status-warning border-status-warning/40',
  },
  research: {
    label: 'Research',
    className: 'bg-primary/15 text-primary border-primary/40',
  },
  'vendor-shipped': {
    label: 'Vendor shipped',
    className: 'bg-status-info/15 text-status-info border-status-info/40',
  },
  'vendor-announced': {
    label: 'Vendor announced',
    className: 'bg-status-warning/15 text-status-warning border-status-warning/40',
  },
  prototype: {
    label: 'Prototype',
    className: 'bg-status-error/15 text-status-error border-status-error/40',
  },
}

/** A claim anchored to one Library document, with maturity label, edition, and locator. */
export const ClaimLine: React.FC<{ id: SourceClaimId; chip?: string }> = ({ id, chip }) => {
  // eslint-disable-next-line security/detect-object-injection
  const claim: SourceClaim = SOURCE_CLAIMS[id]
  const std = getStandard(claim.sourceId)
  const maturity = MATURITY_BADGE[claim.maturity]

  return (
    <div className="p-3 rounded-lg bg-muted/50 border border-border" data-claim={id}>
      <div className="flex flex-wrap items-center gap-1.5 mb-1">
        {chip ? (
          <span className="inline-block text-[10px] px-2 py-0.5 rounded border font-bold bg-primary/10 text-primary border-primary/30">
            {chip}
          </span>
        ) : null}
        <span
          className={`inline-block text-[10px] px-2 py-0.5 rounded border font-semibold ${maturity.className}`}
        >
          {maturity.label}
        </span>
        {claim.asOfDate ? (
          <span className="inline-block text-[10px] px-2 py-0.5 rounded border border-border bg-background/60 text-muted-foreground">
            As of {claim.asOfDate}
          </span>
        ) : null}
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

/** Lesson analysis, Rule G1 authority assumptions, or negative-claim framing. */
export const ReadingNote: React.FC<{ title?: string; children: React.ReactNode }> = ({
  title = 'Authority assumptions & framing',
  children,
}) => (
  <div className="p-4 rounded-lg bg-status-info/10 border border-status-info/30 space-y-2">
    <h3 className="font-semibold text-foreground flex items-center gap-2">
      <Info size={16} aria-hidden="true" /> {title}
    </h3>
    <div className="text-sm text-muted-foreground space-y-2">{children}</div>
  </div>
)

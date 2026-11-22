// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import { Info } from 'lucide-react'
import { getStandard } from '@/data/standardsRegistry'
import { SOURCE_CLAIMS, type SourceClaimId } from '../data/sourceClaims'

/** A sentence the lesson makes about a named document, with the document edition and place it rests on. */
export const ClaimLine: React.FC<{ id: SourceClaimId; chip?: string }> = ({ id, chip }) => {
  // eslint-disable-next-line security/detect-object-injection
  const claim = SOURCE_CLAIMS[id]
  const std = getStandard(claim.sourceId)
  return (
    <div className="p-3 rounded-lg bg-muted/50 border border-border" data-claim={id}>
      {chip ? (
        <span className="inline-block text-[10px] px-2 py-0.5 rounded border font-bold mb-1 bg-primary/10 text-primary border-primary/30">
          {chip}
        </span>
      ) : null}
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

/** Wording that is the lesson's own reading or arithmetic, not a statement from a source. */
export const ReadingNote: React.FC<{ title?: string; children: React.ReactNode }> = ({
  title = 'This lesson’s reading',
  children,
}) => (
  <div className="p-4 rounded-lg bg-status-info/10 border border-status-info/30 space-y-2">
    <h3 className="font-semibold text-foreground flex items-center gap-2">
      <Info size={16} /> {title}
    </h3>
    <div className="text-sm text-muted-foreground space-y-2">{children}</div>
  </div>
)

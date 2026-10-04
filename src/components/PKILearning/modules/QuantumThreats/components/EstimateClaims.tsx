// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { ClaimList } from '@/components/common/ClaimCard'
import {
  UnresolvedEstimatesNotice,
  UNRESOLVED_ESTIMATES_DETAIL,
} from '@/components/common/UnresolvedEstimatesNotice'
import { claimsWithTopic, type OpenClaim } from '@/data/openClaimsData'
import { headStatements } from '@/data/openClaimsView'
import type { CRQCEstimate } from '../data/quantumConstants'

interface EstimateClaimsProps {
  /** The estimates whose claims are shown, in this order. */
  estimates: readonly CRQCEstimate[]
  /** Heading level of each claim sentence (the block's own headings sit one level above). */
  headingLevel?: 3 | 4 | 5
  /** Also list the open questions that no estimate above stands for. */
  includeOtherOpenQuestions?: boolean
  /** Fold the cards into a "what each source says" control (for tight spaces such as workshops). */
  collapsible?: boolean
  /**
   * How the approved sentence is shown. `notice` (default): the whole "estimates are still open"
   * note, lead and all. `sentence`: only the second half, for a page that already shows the lead
   * in a note of its own right above, so the lead is not said twice.
   */
  intro?: 'notice' | 'sentence'
}

/** The claim shown for each estimate, then any other open question; nothing when no claims file exists. */
export function claimsForEstimates(
  estimates: readonly CRQCEstimate[],
  includeOtherOpenQuestions: boolean
): { forEstimates: OpenClaim[]; otherOpen: OpenClaim[] } {
  const forEstimates = headStatements(
    estimates.map((e) => e.claimId).filter((id): id is string => Boolean(id))
  )
  if (!includeOtherOpenQuestions) return { forEstimates, otherOpen: [] }
  const shown = new Set(forEstimates.map((c) => c.id))
  // An open claim that only appears as the earlier statement of a shown claim is reached
  // through that card, so it is not listed a second time.
  for (const c of forEstimates) for (const e of c.earlier ?? []) shown.add(e.claim)
  return {
    forEstimates,
    otherOpen: claimsWithTopic('open-questions').filter((c) => !shown.has(c.id)),
  }
}

/**
 * What the sources behind the CRQC estimates actually say, one claim card each: its state
 * (open question, settled, did not hold, replaced), who said it, the exact words, and what
 * changed from an earlier statement. Where credible sources differ, each is shown and none is
 * picked. The years the page uses are not changed by anything here.
 */
export const EstimateClaims: React.FC<EstimateClaimsProps> = ({
  estimates,
  headingLevel = 4,
  includeOtherOpenQuestions = false,
  collapsible = false,
  intro = 'notice',
}) => {
  const { forEstimates, otherOpen } = claimsForEstimates(estimates, includeOtherOpenQuestions)
  if (forEstimates.length === 0 && otherOpen.length === 0) return null
  const SubHeading = `h${Math.max(2, headingLevel - 1)}` as 'h2' | 'h3' | 'h4'

  const sentence = (
    <p data-testid="claims-sentence" className="text-xs leading-relaxed text-muted-foreground">
      {UNRESOLVED_ESTIMATES_DETAIL.claimsShown}
    </p>
  )

  const body = (
    <div className="space-y-4">
      {collapsible && (
        // The control above says this in words; the heading keeps the outline in order for
        // screen readers once the cards are open.
        <SubHeading className="sr-only">What each source says, in its own words</SubHeading>
      )}
      {collapsible && intro === 'sentence' && sentence}
      {forEstimates.length > 0 && <ClaimList claims={forEstimates} headingLevel={headingLevel} />}
      {otherOpen.length > 0 && (
        <div className="space-y-2">
          <SubHeading className="text-sm font-semibold text-foreground">
            Other questions that are still open
          </SubHeading>
          <ClaimList claims={otherOpen} headingLevel={headingLevel} />
        </div>
      )}
    </div>
  )

  return (
    <div data-testid="estimate-claims" className="mt-4 space-y-3">
      {intro === 'notice' && <UnresolvedEstimatesNotice detail="claimsShown" />}
      {collapsible ? (
        <details className="rounded-md border border-border bg-muted/20">
          <summary className="cursor-pointer rounded-md px-3 py-2 text-xs font-semibold text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
            What each source says, in its own words
          </summary>
          <div className="p-3">{body}</div>
        </details>
      ) : (
        <>
          {intro === 'sentence' && sentence}
          <SubHeading className="text-sm font-semibold text-foreground">
            What the sources say, in their own words
          </SubHeading>
          {body}
        </>
      )}
    </div>
  )
}

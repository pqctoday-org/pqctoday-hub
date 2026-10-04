// SPDX-License-Identifier: GPL-3.0-only
import React, { useId } from 'react'
import { CheckCircle2, ExternalLink, HelpCircle, History, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  CLAIM_STATE_LABELS,
  getOpenClaim,
  type ClaimChange,
  type ClaimEarlier,
  type ClaimSource,
  type ClaimState,
  type OpenClaim,
} from '@/data/openClaimsData'
import { formatClaimDate, relationLabel } from '@/data/openClaimsView'

type HeadingLevel = 3 | 4 | 5 | 6

interface StateStyle {
  Icon: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>
  className: string
}

const STATE_STYLES: Record<ClaimState, StateStyle> = {
  Open: {
    Icon: HelpCircle,
    className: 'text-status-warning bg-status-warning/10 border-status-warning/30',
  },
  Settled: {
    Icon: CheckCircle2,
    className: 'text-status-success bg-status-success/10 border-status-success/30',
  },
  Broken: {
    Icon: XCircle,
    className: 'text-status-error bg-status-error/10 border-status-error/30',
  },
  Superseded: {
    Icon: History,
    className: 'text-muted-foreground bg-muted/50 border-border',
  },
}

/** The state of a claim, always as words next to the icon, so colour is never the only signal. */
export const ClaimStateMark: React.FC<{ state: ClaimState }> = ({ state }) => {
  // eslint-disable-next-line security/detect-object-injection -- state is a checked ClaimState
  const { Icon, className } = STATE_STYLES[state]
  return (
    <span
      data-testid="claim-state"
      className={cn(
        'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-semibold',
        className
      )}
    >
      <Icon size={12} aria-hidden />
      {CLAIM_STATE_LABELS[state]}
    </span>
  )
}

const ExternalSourceLink: React.FC<{ href: string; children: React.ReactNode }> = ({
  href,
  children,
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 rounded text-primary underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
  >
    <span>{children}</span>
    <ExternalLink size={12} aria-hidden />
    <span className="sr-only"> (opens in a new tab)</span>
  </a>
)

const Quote: React.FC<{ children: string; cite?: string }> = ({ children, cite }) => (
  <blockquote
    cite={cite}
    className="border-l-2 border-border pl-3 text-xs italic leading-relaxed text-foreground/80"
  >
    {'“'}
    {children}
    {'”'}
  </blockquote>
)

const SourceBlock: React.FC<{ source: ClaimSource }> = ({ source }) => (
  <li
    data-testid="claim-source"
    className="space-y-1.5 rounded-md border border-border bg-muted/30 p-3 text-xs"
  >
    <p className="font-semibold text-foreground">
      <ExternalSourceLink href={source.url}>{source.name}</ExternalSourceLink>
    </p>
    <p className="text-muted-foreground">
      <span className="font-medium text-foreground">What it says:</span> {source.states}
    </p>
    <Quote cite={source.url}>{source.quote}</Quote>
  </li>
)

/** Where credible sources give answers that cannot both be right, each one is shown, side by side. */
const Sources: React.FC<{ claim: OpenClaim; level: HeadingLevel }> = ({ claim, level }) => {
  if (claim.sources.length === 0) return null
  const sideBySide = claim.inConflict === true && claim.sources.length > 1
  const Sub = `h${level}` as const
  return (
    <div className="space-y-2">
      <Sub className="text-xs font-semibold text-foreground">
        {claim.sources.length > 1 ? 'What each source says' : 'The source'}
      </Sub>
      {sideBySide && (
        <p className="text-xs text-muted-foreground">
          These sources give answers that cannot both be right, so we show each one rather than pick
          a single answer.
        </p>
      )}
      <ul
        data-testid={sideBySide ? 'claim-sources-side-by-side' : 'claim-sources'}
        className={cn('gap-3', sideBySide ? 'grid grid-cols-1 sm:grid-cols-2' : 'flex flex-col')}
      >
        {claim.sources.map((s, i) => (
          // the same source can appear twice with different quotes, so the position joins the key
          <SourceBlock key={`${i}|${s.name}|${s.url}`} source={s} />
        ))}
      </ul>
    </div>
  )
}

const WhatChanged: React.FC<{ changes: ClaimChange[] }> = ({ changes }) => (
  <details
    data-testid="claim-what-changed"
    className="rounded-md border border-border bg-muted/20 text-xs"
  >
    <summary className="cursor-pointer rounded-md px-3 py-2 font-semibold text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
      What changed ({changes.length} {changes.length === 1 ? 'point' : 'points'})
    </summary>
    <ul className="space-y-3 px-3 pb-3 pt-1">
      {changes.map((c, i) => (
        <li key={`${i}|${c.point}`} className="space-y-1.5">
          <p className="font-medium text-foreground">{c.point}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="space-y-1 rounded border border-border bg-card p-2">
              <p className="font-semibold text-muted-foreground">Earlier</p>
              <p className="text-foreground">{c.before.text}</p>
              <Quote>{c.before.quote}</Quote>
            </div>
            <div className="space-y-1 rounded border border-border bg-card p-2">
              <p className="font-semibold text-muted-foreground">Newer</p>
              <p className="text-foreground">{c.after.text}</p>
              <Quote>{c.after.quote}</Quote>
            </div>
          </div>
        </li>
      ))}
    </ul>
  </details>
)

interface EarlierProps {
  link: ClaimEarlier
  headingLevel: HeadingLevel
  lookup: (id: string) => OpenClaim | undefined
  path: readonly string[]
}

/** One earlier statement: how the newer one relates to it, what changed, and the older one itself. */
const EarlierStatement: React.FC<EarlierProps> = ({ link, headingLevel, lookup, path }) => {
  const older = path.includes(link.claim) ? undefined : lookup(link.claim)
  return (
    <li data-testid="claim-earlier" className="space-y-2 text-xs">
      <p className="text-foreground">
        <span className="font-semibold">{relationLabel(link.relation)}.</span> {link.detail}
      </p>
      {link.changes && link.changes.length > 0 && <WhatChanged changes={link.changes} />}
      {older && (
        <details
          data-testid="claim-earlier-statement"
          className="rounded-md border border-border bg-muted/20"
        >
          <summary className="cursor-pointer rounded-md px-3 py-2 font-semibold text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
            Read the earlier statement by {link.madeBy}
          </summary>
          <div className="p-3">
            <ClaimCard
              claim={older}
              headingLevel={Math.min(6, headingLevel + 2) as HeadingLevel}
              lookup={lookup}
              path={[...path, link.claim]}
              className="border-dashed"
            />
          </div>
        </details>
      )}
      {!older && link.url && (
        <p>
          <ExternalSourceLink href={link.url}>Read the earlier source</ExternalSourceLink>
        </p>
      )}
    </li>
  )
}

export interface ClaimCardProps {
  claim: OpenClaim
  /** Heading level for the claim sentence (default 3). */
  headingLevel?: HeadingLevel
  className?: string
  /** Resolves an earlier claim by id; defaults to the published claims file. */
  lookup?: (id: string) => OpenClaim | undefined
  /** Ids already open above this card, so a cycle in the data cannot loop. */
  path?: readonly string[]
}

/**
 * One claim, as the reader should see it: its state as words and an icon, the one-sentence
 * claim, who made it and when it was last checked, why it is in that state, each source with
 * its link and exact words (side by side when sources disagree), what changed from an earlier
 * statement, and the earlier statements themselves. It never averages and never picks one
 * answer for the reader.
 */
export const ClaimCard: React.FC<ClaimCardProps> = ({
  claim,
  headingLevel = 3,
  className,
  lookup = getOpenClaim,
  path = [],
}) => {
  const headingId = useId()
  const Heading = `h${headingLevel}` as const
  const subLevel = Math.min(6, headingLevel + 1) as HeadingLevel
  const Sub = `h${subLevel}` as const
  const checked = formatClaimDate(claim.lastChecked)
  const here = [...path, claim.id]
  const newerNote = claim.newerStatements?.some((n) => n.relation !== 'adds-to')
  return (
    <article
      aria-labelledby={headingId}
      data-testid="claim-card"
      data-claim-id={claim.id}
      data-state={claim.state}
      className={cn('space-y-3 rounded-lg border border-border bg-card p-4', className)}
    >
      <div className="flex flex-wrap items-center gap-2">
        <ClaimStateMark state={claim.state} />
        {claim.inConflict && (
          <span
            data-testid="claim-conflict"
            className="rounded border border-status-warning/30 px-1.5 py-0.5 text-[11px] font-semibold text-status-warning"
          >
            Sources disagree
          </span>
        )}
        {claim.derivedBy && (
          <span className="rounded border border-border px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            Worked out by this site
          </span>
        )}
      </div>
      <Heading id={headingId} className="text-sm font-semibold leading-snug text-foreground">
        {claim.claim}
      </Heading>
      <p className="text-xs text-muted-foreground">
        Made by {claim.madeBy}
        {checked && (
          <>
            {' '}
            {'·'} Last checked {checked}
          </>
        )}
      </p>
      <p className="text-xs leading-relaxed text-foreground/90">
        <span className="font-semibold">Why:</span> {claim.reason}
      </p>
      {newerNote && claim.state !== 'Superseded' && (
        <p className="text-xs text-muted-foreground">A newer statement updates this one.</p>
      )}
      <Sources claim={claim} level={subLevel} />
      {claim.earlier && claim.earlier.length > 0 && (
        <div className="space-y-2">
          <Sub className="text-xs font-semibold text-foreground">Earlier statements</Sub>
          <ul className="space-y-3">
            {claim.earlier.map((e, i) => (
              <EarlierStatement
                key={`${i}|${e.claim}`}
                link={e}
                headingLevel={headingLevel}
                lookup={lookup}
                path={here}
              />
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}

/** A list of claim cards, each at the same heading level. */
export const ClaimList: React.FC<{
  claims: readonly OpenClaim[]
  headingLevel?: HeadingLevel
  className?: string
}> = ({ claims, headingLevel = 3, className }) => {
  if (claims.length === 0) return null
  return (
    <ul className={cn('space-y-3', className)} data-testid="claim-list">
      {claims.map((c) => (
        <li key={c.id}>
          <ClaimCard claim={c} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  )
}

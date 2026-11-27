// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The four states every block has (UX grammar v2.1, section 3.3): Loading, Empty, Error and
 * Partial data. A block wraps its content in a BlockFrame; the heading stays in every state.
 */
import * as React from 'react'
import { cn } from '@/lib/utils'
import { RoleButton } from './RoleButton'
import { verbLabel } from './verbs'

export type BlockStatus = 'ready' | 'loading' | 'empty' | 'error' | 'partial'

export interface BlockStateProps {
  /** Defaults to ready. */
  status?: BlockStatus
  /** Empty: what is missing, plural: "records" gives "No records match these filters." */
  emptyThing?: string
  /** Empty: the active filter in words: "Severity: High". */
  activeFilter?: string
  /** Empty with a filter on: shows Clear filters. */
  onClearFilters?: () => void
  /** Empty with nothing recorded: shows Suggest a record. */
  onSuggest?: () => void
  /** Error: shows Try again. */
  onRetry?: () => void
  /** Error: shows Report a problem. */
  onReport?: () => void
  /** Partial: the note shown above the content ("2 of 9 titles are taken from the summary"). */
  partialNote?: string
  /** Loading: a skeleton in the block's own shape; the default is three bars. */
  skeleton?: React.ReactNode
}

export interface BlockFrameProps extends BlockStateProps {
  /** The block's heading (H3 style). It stays in every state and names the block for assistive technology. */
  title: string
  /** Hides the heading visually but keeps it for assistive technology. */
  hideTitle?: boolean
  className?: string
  children?: React.ReactNode
}

export function BlockSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2" data-skeleton>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-10 rounded-2xl bg-muted motion-safe:animate-pulse" />
      ))}
    </div>
  )
}

export function BlockFrame({
  title,
  hideTitle,
  status = 'ready',
  emptyThing = 'records',
  activeFilter,
  onClearFilters,
  onSuggest,
  onRetry,
  onReport,
  partialNote,
  skeleton,
  className,
  children,
}: BlockFrameProps) {
  const headingId = React.useId()
  return (
    <section
      aria-labelledby={headingId}
      aria-busy={status === 'loading' ? true : undefined}
      data-block-status={status}
      className={cn('flex flex-col gap-3', className)}
    >
      <h3 id={headingId} className={cn('type-block-title', hideTitle && 'sr-only')}>
        {title}
      </h3>
      {status === 'loading' && (
        <div role="status" aria-label={`Loading ${title}`}>
          {skeleton ?? <BlockSkeleton />}
        </div>
      )}
      {status === 'empty' && (
        <div className="flex flex-col items-start gap-2 py-2">
          <p className="type-body font-semibold">No {emptyThing} match these filters.</p>
          {activeFilter && <p className="type-small text-muted-foreground">{activeFilter}</p>}
          {onClearFilters ? (
            <RoleButton onClick={onClearFilters}>{verbLabel('clearFilters')}</RoleButton>
          ) : onSuggest ? (
            <RoleButton onClick={onSuggest}>{verbLabel('suggestRecord')}</RoleButton>
          ) : null}
        </div>
      )}
      {status === 'error' && (
        <div role="alert" className="flex flex-col items-start gap-2 py-2">
          <p className="type-body font-semibold">
            We couldn&rsquo;t load {title}. The rest of the page still works. Nothing you chose was
            lost.
          </p>
          <div className="flex flex-wrap gap-2">
            {onRetry && <RoleButton onClick={onRetry}>{verbLabel('tryAgain')}</RoleButton>}
            {onReport && (
              <RoleButton emphasis="quiet" onClick={onReport}>
                {verbLabel('reportProblem')}
              </RoleButton>
            )}
          </div>
        </div>
      )}
      {status === 'partial' && partialNote && (
        <p data-partial-note className="type-small text-muted-foreground">
          {partialNote}
        </p>
      )}
      {(status === 'ready' || status === 'partial') && children}
    </section>
  )
}

// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The strip on a lesson or section that changed since the learner last read it (phase P6).
 * It says what changed in plain words, names the learner's own older comments, and offers one action each way:
 * see the update, or mark it seen. It shows nothing when there is nothing to say. It never changes progress.
 */
import { useId } from 'react'
import { AlertTriangle } from 'lucide-react'
import { StoryButton, StatusChip } from '@/components/storybook'
import { useUpdatesStore } from '@/store/useUpdatesStore'
import { engagementOf, buildCatalog } from '@/services/myWork/updates'
import { parseTag } from '@/services/myWork/tags'
import { trackMyWork } from '@/services/myWork/myWorkAnalytics'
import { useRevisedStrip } from './useUpdates'

const catalog = buildCatalog()

export interface RevisedSectionStripProps {
  /** The lesson, section or step tag of the page this sits on. */
  tag: string
  /** Open the Updates view. When omitted the strip offers only "Mark seen". */
  onReview?: () => void
  className?: string
}

export function RevisedSectionStrip({ tag, onReview, className }: RevisedSectionStripProps) {
  const uid = useId()
  const strip = useRevisedStrip(tag)
  const markNoticeSeen = useUpdatesStore((s) => s.markNoticeSeen)
  if (!strip) return null
  const moduleTag = parseTag(tag)?.moduleTag ?? tag
  const lesson = catalog[moduleTag]

  return (
    <div
      role="status"
      aria-labelledby={`${uid}-t`}
      className={`rounded-2xl border-2 border-ink bg-caution px-4 py-3 text-caution-foreground ${className ?? ''}`}
      data-testid="revised-strip"
    >
      <p id={`${uid}-t`} className="flex flex-wrap items-center gap-2 text-sm font-bold">
        <AlertTriangle size={16} aria-hidden="true" />
        <StatusChip status="changed" label={`Revised · version ${strip.current}`} />
        {strip.lessonTitle} changed since you last read it
      </p>
      <p className="mt-1 text-sm">
        You last read version {strip.since}.
        {strip.staleComments > 0 &&
          (strip.staleComments === 1
            ? ' One of your comments here was written before this change.'
            : ` ${strip.staleComments} of your comments here were written before this change.`)}{' '}
        Your progress is unchanged.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {onReview && (
          <StoryButton
            variant="secondary"
            onClick={() => {
              trackMyWork('update_reviewed', 1)
              onReview()
            }}
          >
            Review update
          </StoryButton>
        )}
        <StoryButton
          variant="quiet"
          onClick={() => {
            if (
              markNoticeSeen(moduleTag, strip.current, lesson ? engagementOf(lesson) : undefined).ok
            ) {
              trackMyWork('update_marked_seen', 1)
            }
          }}
        >
          Mark seen
        </StoryButton>
      </div>
    </div>
  )
}

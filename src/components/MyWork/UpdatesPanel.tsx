// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Updates (handoff 6.8, 7.8; requirements U01 to U06, X08).
 *
 * One card per material change to something the learner works with, in terms of their own work: what changed,
 * which objectives it touches, why it matters, and one action. A notice comes once per learner and per material
 * revision (U04); "Mark seen" records it and the Updates count clears. Broader changes wait in an on-demand digest
 * ("What changed for me"), so a learner's foreground work is not interrupted (U06). Progress is never changed (U02).
 */
import { useId, useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import {
  StickerCard,
  StoryButton,
  StoryRow,
  Chip,
  Eyebrow,
  StatusChip,
} from '@/components/storybook'
import type { PersonaId } from '@/data/personaIds'
import type { UpdateNotice, UpdatesObjective } from '@/services/myWork/updates'
import { addressOf } from '@/services/myWork/tags'
import { trackMyWork } from '@/services/myWork/myWorkAnalytics'
import { FAILURE_WORDS, type StorageFailureReason } from '@/store/deviceLocalJson'
import { useUpdates } from './useUpdates'
import { useTagLabels } from './useTagLabels'

export interface UpdatesPanelProps {
  /** The learner's objectives with their steps. Lane C's objective maps onto this structure. */
  objectives?: readonly UpdatesObjective[]
  /** The learner's role, to filter the digest to what concerns them. */
  personaId?: PersonaId | null
  /** Open a Hub address. Defaults to the router. */
  onOpen?: (href: string) => void
  /** Told the number of unseen notices whenever it changes (for the tab). */
  onUnseenCountChange?: (count: number) => void
  className?: string
}

const releasedOn = (iso?: string | null): string | undefined => {
  if (!iso) return undefined
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? undefined
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const NOTICE_LABEL: Record<UpdateNotice['kind'], string> = {
  revised: 'Revised',
  'new-optional': 'New optional practice',
  moved: 'Moved',
  retired: 'Retired',
}

function why(n: UpdateNotice): string[] {
  const lines: string[] = []
  const current = n.affects.find((a) => a.role === 'current-step')
  if (n.kind === 'revised') {
    if (current) lines.push(`It is your current step in ${current.objectiveTitle}.`)
    else if (n.affects.length > 0)
      lines.push(`It is a step in ${n.affects.map((a) => a.objectiveTitle).join(' and ')}.`)
    if (n.affects.some((a) => a.status === 'completed'))
      lines.push('You completed it earlier. That stays on record.')
    if (n.newPrerequisites.length > 0)
      lines.push(
        `It now lists ${n.newPrerequisites.map((p) => p.title).join(' and ')} to take first.`
      )
    if (n.staleCommentTags.length > 0)
      lines.push(
        n.staleCommentTags.length === 1
          ? 'One of your comments was written before this change.'
          : `${n.staleCommentTags.length} of your comments were written before this change.`
      )
  } else if (n.kind === 'new-optional') {
    lines.push('Added as optional, so your required progress is unchanged.')
  } else if (n.kind === 'moved' && n.replacement) {
    lines.push(`It is now ${n.replacement.title}. Your progress and comments are kept.`)
  } else if (n.kind === 'retired') {
    lines.push('No replacement is named. Your progress and comments are kept.')
  }
  return lines
}

export function UpdatesPanel({
  objectives = [],
  personaId = null,
  onOpen,
  onUnseenCountChange,
  className,
}: UpdatesPanelProps) {
  const uid = useId()
  const navigate = useNavigate()
  const open = (href: string) => (onOpen ? onOpen(href) : navigate(href))
  const { labelOf } = useTagLabels()
  const { notices, unseenCount, release, digest, isLoadingRevisions, markSeen, markDigestSeen } =
    useUpdates(objectives, personaId)
  const [digestOpen, setDigestOpen] = useState(false)
  const [failed, setFailed] = useState<{
    what: string
    retry: () => void
    reason: StorageFailureReason
  } | null>(null)

  // Tell the host the count (kept out of render so a host state update is not caused while rendering).
  const [lastCount, setLastCount] = useState<number | null>(null)
  if (lastCount !== unseenCount) {
    setLastCount(unseenCount)
    queueMicrotask(() => onUnseenCountChange?.(unseenCount))
  }

  function seen(n: UpdateNotice) {
    if (!markSeen(n)) {
      setFailed({ what: 'This notice', reason: 'blocked', retry: () => seen(n) })
      return
    }
    setFailed(null)
    trackMyWork('update_marked_seen', 1)
  }
  function digestSeen() {
    if (!markDigestSeen()) {
      setFailed({ what: 'That', reason: 'blocked', retry: digestSeen })
      return
    }
    setFailed(null)
  }

  const digestEntries = digest.flatMap((s) => s.entries.map((e) => ({ type: s.type, entry: e })))

  return (
    <StickerCard
      as="section"
      aria-labelledby={`${uid}-h`}
      padding="roomy"
      className={className}
      data-testid="updates-panel"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={`${uid}-h`} className="text-xl font-extrabold text-heading">
            Updates
            {unseenCount > 0 && (
              <span
                className="ml-2 align-middle text-sm font-bold text-muted-foreground"
                data-testid="updates-count"
              >
                ({unseenCount} new)
              </span>
            )}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            What changed in the lessons you work with.{' '}
            {release.seen && release.seen !== release.current
              ? `Compared with release ${release.seen}, which you last looked at${
                  releasedOn(release.seenAt) ? ` on ${releasedOn(release.seenAt)}` : ''
                }; the Hub is on ${release.current}.`
              : `You have seen release ${release.current}.`}
          </p>
        </div>
      </div>

      {failed && (
        <div
          role="alert"
          className="mt-3 rounded-2xl border-2 border-ink bg-caution px-4 py-3 text-sm text-caution-foreground"
        >
          <p className="flex items-center gap-2 font-bold">
            <AlertTriangle size={16} aria-hidden="true" />
            {failed.what} was not marked as seen
          </p>
          <p className="mt-1">{FAILURE_WORDS[failed.reason]} Nothing else was changed.</p>
          <StoryButton variant="secondary" className="mt-2" onClick={failed.retry}>
            Try again
          </StoryButton>
        </div>
      )}

      {notices.length === 0 ? (
        <p className="mt-6 text-base font-bold text-heading" data-testid="updates-empty">
          {isLoadingRevisions
            ? 'Checking for changes…'
            : 'You’re up to date for your saved objectives.'}
        </p>
      ) : (
        <ul className="mt-4 space-y-3" aria-label="Updates for your work">
          {notices.map((n) => {
            const lines = why(n)
            const date = releasedOn(n.releasedAt)
            return (
              <StoryRow
                as="li"
                key={n.id}
                data-testid="update-notice"
                data-kind={n.kind}
                tone={n.tier === 0 ? 'highlight' : 'default'}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip
                    status={n.kind === 'new-optional' ? 'active' : 'changed'}
                    label={`${NOTICE_LABEL[n.kind]}${n.kind === 'revised' ? ` · version ${n.revision}` : ''}`}
                  />
                  {date && <span className="text-xs text-muted-foreground">Released {date}</span>}
                  {n.kind === 'new-optional' && n.affects.length > 1 && (
                    <Chip>{`${n.affects.length === 2 ? 'Both' : 'All'} objectives`}</Chip>
                  )}
                </div>
                <p className="mt-2 text-sm font-bold text-heading">{n.title}</p>
                {n.kind === 'revised' && (
                  <p className="mt-1 text-sm text-foreground">
                    Revised from version {n.since} to version {n.revision}.
                    {n.staleCommentTags.length > 0 && (
                      <>
                        {' '}
                        Your comments on{' '}
                        {[...new Set(n.staleCommentTags)].map((t) => labelOf(t)).join(', ')}.
                      </>
                    )}
                  </p>
                )}
                {n.kind === 'new-optional' && (
                  <Eyebrow className="mt-1">
                    {n.affects.map((a) => a.objectiveTitle).join(' · ')}
                  </Eyebrow>
                )}
                {lines.map((l) => (
                  <p key={l} className="mt-1 text-sm text-foreground">
                    {l}
                  </p>
                ))}
                <div className="mt-2 flex flex-wrap gap-2">
                  {n.kind === 'moved' && n.replacement ? (
                    <StoryButton
                      variant="secondary"
                      onClick={() => open(addressOf(n.replacement!.tag))}
                    >
                      Open {n.replacement.title}
                    </StoryButton>
                  ) : n.kind === 'retired' ? (
                    n.affects[0] && (
                      <StoryButton variant="secondary" onClick={() => open('/learn?view=journey')}>
                        Inspect {n.affects[0].objectiveTitle}
                      </StoryButton>
                    )
                  ) : (
                    <StoryButton
                      variant="secondary"
                      onClick={() => {
                        trackMyWork('update_reviewed', 1)
                        open(addressOf(n.tag))
                      }}
                    >
                      {n.kind === 'new-optional' ? 'Open it' : 'Review update'}
                    </StoryButton>
                  )}
                  <StoryButton variant="quiet" onClick={() => seen(n)}>
                    Mark seen
                  </StoryButton>
                </div>
              </StoryRow>
            )
          })}
        </ul>
      )}

      <div className="mt-6">
        <StoryButton
          variant="secondary"
          aria-expanded={digestOpen}
          aria-controls={`${uid}-digest`}
          onClick={() => {
            setDigestOpen((v) => !v)
            if (!digestOpen) trackMyWork('updates_digest_opened', digestEntries.length)
          }}
        >
          What changed for me
          {digestOpen ? (
            <ChevronUp size={16} aria-hidden="true" />
          ) : (
            <ChevronDown size={16} aria-hidden="true" />
          )}
        </StoryButton>
        {digestOpen && (
          <div id={`${uid}-digest`} className="mt-3" data-testid="updates-digest">
            {digestEntries.length === 0 ? (
              <p className="text-sm text-foreground">
                Nothing new since release {release.seen ?? release.current}.
              </p>
            ) : (
              <>
                <ul className="space-y-2">
                  {digestEntries.slice(0, 12).map(({ type, entry }) => (
                    <StoryRow as="li" key={`${type}:${entry.title}`}>
                      <Eyebrow>{type}</Eyebrow>
                      <p className="mt-1 text-sm font-bold text-heading">{entry.title}</p>
                    </StoryRow>
                  ))}
                </ul>
                {digestEntries.length > 12 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {digestEntries.length - 12} more on the full release notes page.
                  </p>
                )}
                <StoryButton variant="quiet" onClick={digestSeen}>
                  Mark all as seen
                </StoryButton>
              </>
            )}
          </div>
        )}
      </div>
    </StickerCard>
  )
}

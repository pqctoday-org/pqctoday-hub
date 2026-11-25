// SPDX-License-Identifier: AGPL-3.0-only
import { useCallback, useEffect, useMemo } from 'react'
import { useRevisions } from '@/hooks/useRevisions'
import { getCurrentVersion } from '@/store/useVersionStore'
import { MODULE_ID_RENAMES } from '@/components/PKILearning/manifest/contentVersion'
import { getUnseenChangelogSections } from '@/components/ui/WhatsNewModal'
import type { PersonaId } from '@/data/personaIds'
import type { ChangelogSection } from '@/utils/changelogParser'
import { useMyWorkStore } from '@/store/useMyWorkStore'
import { useUpdatesStore } from '@/store/useUpdatesStore'
import {
  buildCatalog,
  computeUpdateNotices,
  engagementOf,
  lessonsToEngage,
  revisedStrip,
  type RevisedStrip,
  type UpdateNotice,
  type UpdatesObjective,
} from '@/services/myWork/updates'
import { parseTag } from '@/services/myWork/tags'

const catalog = buildCatalog()

/** Bring the learner's receipts up to date with the lessons they work with. Idempotent. */
function useEngagement(objectives: readonly UpdatesObjective[]) {
  const comments = useMyWorkStore((s) => s.comments)
  const engaged = useUpdatesStore((s) => s.engaged)
  const seedRelease = useUpdatesStore((s) => s.seedRelease)
  const noteEngaged = useUpdatesStore((s) => s.noteEngaged)
  useEffect(() => {
    seedRelease(getCurrentVersion())
    const fresh = lessonsToEngage(catalog, objectives, comments, engaged)
    if (Object.keys(fresh).length > 0) noteEngaged(fresh)
  }, [objectives, comments, engaged, seedRelease, noteEngaged])
}

export interface UseUpdates {
  notices: UpdateNotice[]
  /** The notices still to be seen: the number on the Updates tab. It clears when they are seen. */
  unseenCount: number
  release: { seen: string | null; seenAt: string | null; current: string }
  digest: ChangelogSection[]
  isLoadingRevisions: boolean
  markSeen: (notice: UpdateNotice) => boolean
  markDigestSeen: () => boolean
}

export function useUpdates(
  objectives: readonly UpdatesObjective[],
  personaId: PersonaId | null = null
): UseUpdates {
  useEngagement(objectives)
  const { revisions, isLoading } = useRevisions()
  const comments = useMyWorkStore((s) => s.comments)
  const engaged = useUpdatesStore((s) => s.engaged)
  const seen = useUpdatesStore((s) => s.noticesSeen)
  const releaseSeen = useUpdatesStore((s) => s.learnerReleaseSeen)
  const releaseSeenAt = useUpdatesStore((s) => s.releaseSeenAt)
  const markNoticeSeen = useUpdatesStore((s) => s.markNoticeSeen)
  const markReleaseSeen = useUpdatesStore((s) => s.markReleaseSeen)

  const notices = useMemo(
    () =>
      computeUpdateNotices({
        catalog,
        objectives,
        comments,
        engaged,
        seen,
        revisions,
        renames: MODULE_ID_RENAMES,
        releaseSeenAt,
      }),
    [objectives, comments, engaged, seen, revisions, releaseSeenAt]
  )

  const current = getCurrentVersion()
  const digest = useMemo(
    () => (releaseSeen ? getUnseenChangelogSections(releaseSeen, personaId) : []),
    [releaseSeen, personaId]
  )

  const markSeen = useCallback(
    (notice: UpdateNotice) => {
      const lesson = catalog[notice.tag]
      return markNoticeSeen(notice.tag, notice.revision, lesson ? engagementOf(lesson) : undefined)
        .ok
    },
    [markNoticeSeen]
  )
  const markDigestSeen = useCallback(() => markReleaseSeen(current).ok, [markReleaseSeen, current])

  return {
    notices,
    unseenCount: notices.length,
    release: { seen: releaseSeen, seenAt: releaseSeenAt, current },
    digest,
    isLoadingRevisions: isLoading,
    markSeen,
    markDigestSeen,
  }
}

/** The number for the Updates tab: how many notices the learner has not yet seen. */
export function useUnseenUpdateCount(objectives: readonly UpdatesObjective[]): number {
  return useUpdates(objectives).unseenCount
}

/** The strip a lesson or section page shows when it was revised past what the learner last read, or null. */
export function useRevisedStrip(tag: string): RevisedStrip | null {
  const comments = useMyWorkStore((s) => s.comments)
  const engaged = useUpdatesStore((s) => s.engaged)
  const seen = useUpdatesStore((s) => s.noticesSeen)
  const seedRelease = useUpdatesStore((s) => s.seedRelease)
  const noteEngaged = useUpdatesStore((s) => s.noteEngaged)
  const lessonTag = parseTag(tag)?.moduleTag
  // The learner is on this lesson page: from now on a later revision is noticed.
  useEffect(() => {
    if (!lessonTag) return
    seedRelease(getCurrentVersion())
    const fresh = lessonsToEngage(
      catalog,
      [],
      comments.filter((c) => c.tag.startsWith(lessonTag)),
      engaged
    )
    const base = catalog[lessonTag]
    if (base && !(lessonTag in engaged) && !(lessonTag in fresh)) {
      noteEngaged({ [lessonTag]: engagementOf(base) })
    } else if (Object.keys(fresh).length > 0) {
      noteEngaged(fresh)
    }
  }, [lessonTag, comments, engaged, seedRelease, noteEngaged])
  return useMemo(
    () => revisedStrip(tag, catalog, engaged, seen, comments),
    [tag, engaged, seen, comments]
  )
}

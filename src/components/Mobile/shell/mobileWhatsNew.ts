// SPDX-License-Identifier: GPL-3.0-only
import { useVersionStore } from '@/store/useVersionStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { getUnseenChangelogSections } from '@/components/ui/WhatsNewModal'

export interface MobileWhatsNewStatus {
  hasUnread: boolean
  count: number
}

/**
 * Real "unread since your last visit" status for the ⋯ button's red dot and
 * the What's new row's sub-label (handoff: "6px red unread dot... when there
 * is unread news", "'What's new' carries its unread count"). Previously left
 * off — this codebase had no per-item read state anywhere. It does, in
 * useVersionStore: `lastSeenVersion` (persisted, bumped by markAllSeen on
 * dismiss) already drives the desktop WhatsNewModal's own unseen-entry count
 * via getUnseenChangelogSections. This reads the exact same real fields and
 * function rather than inventing a second tracking mechanism — `count` is
 * the same number the desktop modal itself would show right now.
 *
 * Deliberately narrower than desktop's full hasUnseenChanges() (which also
 * folds in changed CSV data sources and Learn-module content-version bumps,
 * neither of which have a per-item label a "N since your last visit" count
 * could honestly summarize on one line). Changelog entries alone are what a
 * user reads as "news."
 */
export function useMobileWhatsNewStatus(): MobileWhatsNewStatus {
  const { lastSeenVersion } = useVersionStore()
  const { selectedPersona } = usePersonaStore()
  const sections = getUnseenChangelogSections(lastSeenVersion, selectedPersona)
  const count = sections.reduce((sum, s) => sum + s.entries.length, 0)
  return { hasUnread: count > 0, count }
}

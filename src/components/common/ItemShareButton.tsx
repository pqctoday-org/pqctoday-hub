// SPDX-License-Identifier: GPL-3.0-only
import { ShareButton } from '@/components/ui/ShareButton'

/**
 * Share control for ONE resource, placed inside the drawer / modal / sheet
 * that shows it (next to its close button).
 *
 * Overlays cover the top-bar Share, so every item overlay carries its own.
 * `path` is the item's CLEAN canonical link — the page plus the parameter
 * that reopens this item, never the reader's filters, tab or sort — e.g.
 * `/library?ref=FIPS-203`. Build it with the page's own link helper rather
 * than copying window.location, so pop-ups that do not write the URL
 * (nested ones, For-You pop-ups) share the right thing too.
 */
export function ItemShareButton({
  title,
  path,
  className,
}: {
  /** What is being shared, e.g. "FIPS 203 — PQC Today". */
  title: string
  path: string
  className?: string
}) {
  return (
    <ShareButton title={title} url={path} portal className={className} buttonClassName="h-8 w-8" />
  )
}

/** "<item> — PQC Today", the share title convention used by the top bar. */
export function itemShareTitle(name: string): string {
  return `${name} — PQC Today`
}

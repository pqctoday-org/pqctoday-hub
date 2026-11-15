// SPDX-License-Identifier: AGPL-3.0-only
import { BookOpen, ExternalLink } from 'lucide-react'
import { Link } from 'react-router'
import clsx from 'clsx'
import type { Leader } from '@/data/leadersData'

/**
 * "github.com/open-quantum-safe/liboqs" instead of a 120-character URL. The
 * full URL stays in the title and the href.
 */
export function shortResourceLabel(url: string): string {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    const path = u.pathname.replace(/\/+$/, '')
    const label = `${host}${path}`
    return label.length > 60 ? `${label.slice(0, 57)}…` : label
  } catch {
    return url
  }
}

/**
 * The two kinds of cited evidence on a leader row, shown as two lists:
 * `keyResourceRefs` are Library reference ids (opened in /library), and
 * `keyResourceUrl` are external links. They are NOT paired by position: the
 * arrays differ in length on 31 rows, and on most equal-length rows the URL at
 * position i is not the Library document at position i, so pairing them linked
 * chips to the wrong document.
 */
export function LeaderKeyResources({
  leader,
  size = 'sm',
  limit,
  onNavigate,
}: {
  leader: Leader
  /** 'xs' for the expanded card / table row, 'sm' for the pop-up and phone sheet. */
  size?: 'xs' | 'sm'
  /** Show at most this many per list, with "…and N more". */
  limit?: number
  /** Called when an in-app Library link is followed (the pop-up closes itself). */
  onNavigate?: () => void
}) {
  const refs = leader.keyResourceRefs ?? []
  const urls = leader.keyResourceUrl ?? []
  if (refs.length === 0 && urls.length === 0) return null

  const linkClass = clsx(
    'font-medium text-secondary hover:text-secondary/80 transition-colors flex items-center gap-1.5 min-w-0',
    size === 'xs' ? 'text-xs' : 'text-sm'
  )
  const headingClass = clsx(
    'text-muted-foreground uppercase tracking-wider font-bold mb-1.5',
    size === 'xs' ? 'text-[10px]' : 'text-xs'
  )
  const iconSize = size === 'xs' ? 11 : 12
  const shown = <T,>(items: T[]) => (limit ? items.slice(0, limit) : items)
  const more = (n: number) =>
    limit && n > limit ? (
      <span className="text-[10px] text-muted-foreground italic mt-0.5">…and {n - limit} more</span>
    ) : null

  return (
    <div
      className="rounded-lg bg-muted/20 border border-border p-2.5 space-y-2.5"
      data-testid="leader-key-resources"
    >
      {refs.length > 0 && (
        <div>
          <p className={headingClass}>
            {refs.length === 1 ? 'Cited in the Library' : `Cited in the Library (${refs.length})`}
          </p>
          <div className="flex flex-col gap-0.5">
            {shown(refs).map((ref, i) => (
              <Link
                key={`${i}-${ref}`}
                to={`/library?ref=${encodeURIComponent(ref)}`}
                onClick={onNavigate}
                className={linkClass}
                title={`Open in Library: ${ref}`}
              >
                <BookOpen size={iconSize} className="shrink-0" aria-hidden="true" />
                <span className="truncate">{ref}</span>
              </Link>
            ))}
            {more(refs.length)}
          </div>
        </div>
      )}
      {urls.length > 0 && (
        <div>
          <p className={headingClass}>
            {urls.length === 1 ? 'External source' : `External sources (${urls.length})`}
          </p>
          <div className="flex flex-col gap-0.5">
            {shown(urls).map((url, i) => (
              <a
                key={`${i}-${url}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
                title={url}
              >
                <ExternalLink size={iconSize} className="shrink-0" aria-hidden="true" />
                <span className="truncate">{shortResourceLabel(url)}</span>
              </a>
            ))}
            {more(urls.length)}
          </div>
        </div>
      )}
    </div>
  )
}

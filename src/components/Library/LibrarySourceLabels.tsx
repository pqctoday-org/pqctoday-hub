// SPDX-License-Identifier: AGPL-3.0-only
import type { LibraryItem } from '@/data/libraryData'
import { CMS_SOURCE_ROLES, cmsSourceRole, sourceReviewContext } from './librarySourceContext'

export function LibraryReviewProcess({
  item,
  compact = false,
}: {
  item: LibraryItem
  compact?: boolean
}) {
  const context = sourceReviewContext(item)
  return (
    <div
      className="text-[11.5px] leading-relaxed text-muted-foreground"
      data-testid="library-review-process"
    >
      <span className="font-semibold text-foreground/80">Source process:</span> {context.label}
      {!compact && <p className="mt-1">{context.detail}</p>}
    </div>
  )
}

/** These three documents answer different implementation questions. Keep all three sources
 * discoverable even when the catalogue contains only the base and extension records. */
export function CmsSourceGuide({
  item,
  compact = false,
}: {
  item: LibraryItem
  compact?: boolean
}) {
  const source = cmsSourceRole(item)
  if (!source) return null
  if (compact)
    return (
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
        RFC {source.number}: {source.role}
      </p>
    )
  return (
    <section
      aria-label="CMS specification roles"
      className="rounded-lg border border-border p-3 text-[12px] leading-relaxed"
    >
      <h3 className="font-semibold text-foreground">
        Choose the CMS specification for your question
      </h3>
      <ul className="mt-2 space-y-2">
        {CMS_SOURCE_ROLES.map((entry) => (
          <li key={entry.number}>
            <a
              href={`https://www.rfc-editor.org/rfc/rfc${entry.number}.html`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              RFC {entry.number} — {entry.title}
            </a>
            <p className="text-muted-foreground">{entry.role}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

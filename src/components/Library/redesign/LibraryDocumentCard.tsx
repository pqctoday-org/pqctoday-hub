// SPDX-License-Identifier: GPL-3.0-only
/**
 * LibraryDocumentCard — the redesign's medium-density card. Shows the essentials
 * (refId + status, title, lifecycle + ≤2 categories + urgency, org · date, trust
 * + source, bookmark + Open) and opens the detail drawer on click. The dense data
 * the live card carried (CSWP-39 grid, region chips, analysis) lives in the drawer.
 */
import { Building2, Bookmark, ExternalLink, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { LibraryItem } from '@/data/libraryData'
import { ReviewedBadge } from '@/components/ui/ReviewedBadge'
import {
  lifecycleLabel,
  lifecyclePillClass,
  urgencyPillClass,
  trustInfo,
  formatLibDate,
} from './libraryPills'
import { documentWeight } from '@/data/libraryDocumentWeight'

interface LibraryDocumentCardProps {
  item: LibraryItem
  bookmarked: boolean
  onToggleBookmark: (referenceId: string) => void
  onOpen: (referenceId: string) => void
}

export function LibraryDocumentCard({
  item,
  bookmarked,
  onToggleBookmark,
  onOpen,
}: LibraryDocumentCardProps) {
  const trust = trustInfo(item.referenceId)
  const weight = documentWeight(item.referenceId)
  const cats = (item.categories ?? []).slice(0, 2)
  const showUrgency = item.migrationUrgency === 'Critical' || item.migrationUrgency === 'High'
  // The lifecycle pill reflects the most-advanced edition across this record and
  // its prior revisions (matches the live card), not just the current row.
  const lifecycleBucket = item.groupStatusBucket ?? item.documentStatusBucket
  const revisionCount = item.priorRevisions?.length ?? 0

  return (
    // 2026-08-02 a11y fix: this was `role="button" tabIndex={0}` on the card
    // itself, which made every card a focusable widget CONTAINING another
    // focusable widget — `ReviewedBadge` below renders a real <Button>. axe
    // flags that as `nested-interactive` (serious), 789 nodes on /library, and
    // it is a genuine defect: a screen reader announces the card as one button
    // and its inner control becomes unreachable.
    //
    // Now the standard card pattern: the container is inert, and the TITLE is
    // the focusable primary action. Mouse users keep click-anywhere via the
    // container's onClick; keyboard and screen-reader users tab to a real,
    // named button. The badge is then a sibling control, not a nested one.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- deliberate: this click is a REDUNDANT mouse convenience (click anywhere on the card), not the card's only affordance. Full keyboard and screen-reader access is the title <Button> below, which is a real, named control. Giving this container a role + tabIndex instead is exactly what caused the nested-interactive violation this change fixes.
    <div
      onClick={() => onOpen(item.referenceId)}
      className="glass-panel flex min-h-[172px] cursor-pointer flex-col rounded-2xl p-3.5 transition-colors hover:border-primary/40 hover:bg-card focus-within:border-primary/40"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[12px] font-semibold text-primary">{item.referenceId}</span>
        {item.status && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              item.status === 'New' ? 'bg-success/15 text-success' : 'bg-primary/15 text-primary'
            }`}
          >
            {item.status}
          </span>
        )}
      </div>

      <h3 className="mt-1.5 text-[14px] font-bold leading-snug text-foreground">
        {/* The card's one focusable control — see the container comment. Styled
            to look like plain text; `text-left`/`whitespace-normal` undo the
            Button base styles so the title still wraps and clamps as before. */}
        <Button
          variant="ghost"
          onClick={(e) => {
            // The container also handles clicks; without this the same card
            // would open twice on a title click.
            e.stopPropagation()
            onOpen(item.referenceId)
          }}
          className="line-clamp-2 h-auto w-full justify-start whitespace-normal p-0 text-left text-[14px] font-bold leading-snug text-foreground hover:bg-transparent"
        >
          {item.documentTitle}
        </Button>
      </h3>

      {/* B+ remediation 3.3 (2026-08-10): "what this settles", plus how long it
          is. The sentence is `short_description`, already authored for ~90% of
          active rows and previously visible only after opening the detail
          drawer — the list itself carried no educational content at all. The
          weight line is DERIVED from the download manifest's recorded size
          (libraryDocumentWeight.ts); a reader could not previously tell a
          two-page note from a 2.5 MB standard without opening it.

          The handoff asked for a page count. We do not hold one, and deriving
          it from PDF bytes is a guess — so this reports the size we actually
          recorded and what that means for reading time, rather than an
          invented figure. */}
      {item.shortDescription?.trim() && (
        <p className="mt-1.5 line-clamp-2 text-[12px] leading-snug text-muted-foreground">
          {item.shortDescription.trim()}
        </p>
      )}
      {weight && (
        <p className="mt-1 text-[11px] font-mono text-muted-foreground/80">{weight.label}</p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span
          className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${lifecyclePillClass(
            lifecycleBucket
          )}`}
        >
          {lifecycleLabel(lifecycleBucket)}
        </span>
        {cats.map((c) => (
          <span
            key={c}
            className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[11px] text-muted-foreground"
          >
            {c}
          </span>
        ))}
        {showUrgency && (
          <span
            className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${urgencyPillClass(
              item.migrationUrgency
            )}`}
          >
            {item.migrationUrgency}
          </span>
        )}
        {revisionCount > 0 && (
          <span
            className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[11px] text-muted-foreground"
            title={`${revisionCount} earlier revision${revisionCount === 1 ? '' : 's'} — open for details`}
          >
            <Layers size={10} aria-hidden="true" />
            {revisionCount} rev{revisionCount === 1 ? '' : 's'}
          </span>
        )}
        <ReviewedBadge domain="library" entityId={item.referenceId} showUnreviewed={false} />
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-[12px] text-muted-foreground">
        <Building2 size={13} aria-hidden="true" className="shrink-0" />
        <span className="truncate">{item.authorsOrOrganization || 'Unknown'}</span>
        {item.lastUpdateDate && (
          <span className="ml-auto shrink-0 font-mono text-[11px]">
            {formatLibDate(item.lastUpdateDate)}
          </span>
        )}
      </div>

      <div className="mt-auto flex items-center gap-2 border-t border-border pt-2.5">
        {trust.score != null && (
          <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${trust.pillClass}`}>
            Trust {trust.score}
          </span>
        )}
        <span className="text-[11px] text-muted-foreground">{trust.source}</span>
        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
            aria-pressed={bookmarked}
            onClick={(e) => {
              e.stopPropagation()
              onToggleBookmark(item.referenceId)
            }}
            className="h-auto px-1.5 py-1 max-md:min-h-[44px] max-md:min-w-[44px]"
          >
            <Bookmark
              size={15}
              className={bookmarked ? 'fill-primary text-primary' : 'text-muted-foreground'}
              aria-hidden="true"
            />
          </Button>
          {item.accessType === 'paid' && item.freeSummaryUrl ? (
            /* Paid standards are still named — the name stays useful even when
               the document is sold — but "Open" would promise a document the
               reader can't reach. Lead with the free summary, and say plainly
               that it is a summary rather than the standard. */
            <a
              href={item.freeSummaryUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="A free abstract describing this standard — not the standard itself, which must be purchased."
              className="flex items-center gap-1 rounded-md px-1.5 py-1 max-md:min-h-[44px] text-[12px] font-semibold text-primary hover:bg-primary/10"
            >
              Free summary
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          ) : item.accessType === 'paid' ? (
            <span
              className="px-1.5 py-1 text-[12px] font-medium text-status-warning"
              title="This standard is sold by its publisher. No free copy or summary is available."
            >
              Purchase required
            </span>
          ) : item.downloadUrl ? (
            <a
              href={item.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 rounded-md px-1.5 py-1 max-md:min-h-[44px] text-[12px] font-semibold text-primary hover:bg-primary/10"
            >
              Open
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          ) : (
            <span
              className="px-1.5 py-1 text-[12px] font-medium text-muted-foreground"
              title="No public source link is available for this document yet."
            >
              Source not available
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

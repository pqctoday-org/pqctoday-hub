// SPDX-License-Identifier: GPL-3.0-only
/**
 * LibraryDocumentCard — the redesign's medium-density card. Shows the essentials
 * (refId + status, title, lifecycle + ≤2 categories + urgency, org · date, trust
 * + source, bookmark + Open) and opens the detail drawer on click. The dense data
 * the live card carried (CSWP-39 grid, region chips, analysis) lives in the drawer.
 */
import { Building2, Bookmark, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { LibraryItem } from '@/data/libraryData'
import {
  lifecycleLabel,
  lifecyclePillClass,
  urgencyPillClass,
  trustInfo,
  formatLibDate,
} from './libraryPills'

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
  const cats = (item.categories ?? []).slice(0, 2)
  const showUrgency = item.migrationUrgency === 'Critical' || item.migrationUrgency === 'High'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(item.referenceId)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(item.referenceId)
        }
      }}
      className="glass-panel flex min-h-[172px] cursor-pointer flex-col rounded-2xl p-3.5 transition-colors hover:border-primary/40 hover:bg-card"
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

      <h3 className="mt-1.5 line-clamp-2 text-[14px] font-bold leading-snug text-foreground">
        {item.documentTitle}
      </h3>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span
          className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${lifecyclePillClass(
            item.documentStatusBucket
          )}`}
        >
          {lifecycleLabel(item.documentStatusBucket)}
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
            className="h-auto px-1.5 py-1"
          >
            <Bookmark
              size={15}
              className={bookmarked ? 'fill-primary text-primary' : 'text-muted-foreground'}
              aria-hidden="true"
            />
          </Button>
          {item.downloadUrl && (
            <a
              href={item.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[12px] font-semibold text-primary hover:bg-primary/10"
            >
              Open
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

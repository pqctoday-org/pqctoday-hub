// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { FileClock, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EndorseButton } from '@/components/ui/EndorseButton'
import { FlagButton } from '@/components/ui/FlagButton'
import { Skeleton } from '@/components/ui/skeleton'

export interface PageActionStripProps {
  /**
   * Page title — used as the default endorse/flag `resourceLabel` when
   * `endorseLabel`/`flagLabel` aren't given. Mirrors `PageHeader`'s own
   * `endorseLabel ?? title` fallback so this props shape is a drop-in
   * superset once `PageHeader.tsx` delegates its rendering here.
   */
  title?: string
  /**
   * Pre-formatted freshness string, e.g.
   * "timeline_07312026.csv • Updated: 7/31/2026". Renders the info icon
   * (tooltip = this exact string) only when set.
   */
  dataSource?: string
  /**
   * True while the page's freshness metadata is still being fetched.
   * Shows a skeleton placeholder instead of rendering nothing — fixes the
   * old per-page inconsistency where some pages briefly (or permanently,
   * if metadata never loads) showed no data-source indicator at all.
   * Ignored once `dataSource` itself is set.
   */
  dataSourceLoading?: boolean
  /** Renders the export icon (tooltip "Export CSV") only when provided. */
  onExport?: () => void
  /** Renders EndorseButton (icon variant) only when provided. */
  endorseUrl?: string
  endorseLabel?: string
  endorseResourceType?: string
  /** Renders FlagButton (icon variant) only when provided. */
  flagUrl?: string
  flagLabel?: string
  flagResourceType?: string
  /**
   * Page-specific chips/badges with no generic equivalent, rendered last —
   * e.g. a Learn module's WIP chip and its reviewed badge. Small inline
   * elements only; anything structural belongs on the page, not in the bar.
   */
  extra?: ReactNode
  testId?: string
  className?: string
}

/**
 * Standardized compact page-action row — §3 of
 * `HEADER-TOPBAR-STANDARDIZATION-PLAN-2026-08-01.md`. Replaces the
 * ad hoc, per-page-inconsistent desktop action row `PageHeader.tsx` renders
 * for these same fields today.
 *
 * Icon + short visible text label + small font (2026-08-01 follow-up: "there
 * is no text at all next to the icons" — the original icon-only-with-tooltip
 * design was rejected). Same visual family as the top bar's other buttons
 * (Ask/Share/FAQ/Sources/Glossary/Guide/Search) — small text-[11px] labels,
 * ghost/no-border styling, not a different button style living side by side.
 */
export const PageActionStrip = ({
  title,
  dataSource,
  dataSourceLoading = false,
  onExport,
  endorseUrl,
  endorseLabel,
  endorseResourceType,
  flagUrl,
  flagLabel,
  flagResourceType,
  extra,
  testId,
  className = '',
}: PageActionStripProps) => {
  const showSkeleton = dataSourceLoading && !dataSource
  const showInfo = Boolean(dataSource) || showSkeleton
  const hasAnything =
    showInfo || Boolean(onExport) || Boolean(endorseUrl) || Boolean(flagUrl) || Boolean(extra)

  // 2026-08-01 bug fix ("info does not seem to work"): this used to be a
  // plain <span title=...> — a hover-only native tooltip with no click
  // behavior at all, so clicking it visibly did nothing (and it was
  // unreachable by touch/keyboard). Now a real toggleable popover, same
  // click-outside/Escape pattern used elsewhere in this app (e.g. the old
  // RegionIndustryPill).
  const [infoOpen, setInfoOpen] = useState(false)
  const infoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!infoOpen) return
    const onPointerDown = (e: MouseEvent) => {
      if (infoRef.current && !infoRef.current.contains(e.target as Node)) setInfoOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInfoOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [infoOpen])

  if (!hasAnything) return null

  return (
    <div className={`flex items-center gap-0.5 ${className}`.trim()} data-testid={testId}>
      {showSkeleton && (
        <span
          className="inline-flex items-center gap-1 px-2 py-1.5"
          role="status"
          aria-label="Loading data source information"
        >
          <Skeleton className="h-3.5 w-3.5 rounded-full" />
        </span>
      )}
      {!showSkeleton && dataSource && (
        <div className="relative" ref={infoRef}>
          <Button
            variant="ghost"
            onClick={() => setInfoOpen((o) => !o)}
            aria-haspopup="dialog"
            aria-expanded={infoOpen}
            className="flex items-center gap-1 px-2 py-1.5 h-auto rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
            aria-label={`Data source: ${dataSource}`}
            title={dataSource}
          >
            <FileClock size={13} aria-hidden="true" />
            <span>Info</span>
          </Button>
          {infoOpen && (
            <div
              role="dialog"
              aria-label="Data source"
              className="glass-panel absolute left-0 top-full z-50 mt-2 w-72 p-3 text-xs text-foreground shadow-xl"
            >
              {dataSource}
            </div>
          )}
        </div>
      )}
      {onExport && (
        <Button
          variant="ghost"
          onClick={onExport}
          className="flex items-center gap-1 px-2 py-1.5 h-auto rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
          aria-label="Export CSV"
          title="Export CSV"
        >
          <Download size={13} aria-hidden="true" />
          <span>Export</span>
        </Button>
      )}
      {endorseUrl && (
        <EndorseButton
          endorseUrl={endorseUrl}
          resourceLabel={endorseLabel ?? title ?? 'Page'}
          resourceType={endorseResourceType ?? 'Page'}
          variant="text"
          label="Endorse"
          className="!text-xs !px-2 !py-1.5 !min-h-0"
        />
      )}
      {flagUrl && (
        <FlagButton
          flagUrl={flagUrl}
          resourceLabel={flagLabel ?? title ?? 'Page'}
          resourceType={flagResourceType ?? 'Page'}
          variant="text"
          label="Flag"
          className="!text-xs !px-2 !py-1.5 !min-h-0"
        />
      )}
      {extra}
    </div>
  )
}

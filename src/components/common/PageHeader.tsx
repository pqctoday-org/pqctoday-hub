// SPDX-License-Identifier: GPL-3.0-only
import { useState, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExportButton } from '@/components/ui/ExportButton'
import { EndorseButton } from '@/components/ui/EndorseButton'
import { FlagButton } from '@/components/ui/FlagButton'

interface PageHeaderProps {
  icon: LucideIcon
  title: string
  description: string
  /** Pre-formatted string, e.g. "timeline_03082026.csv • Updated: 3/8/2026" */
  dataSource?: string
  /**
   * Rich replacement for the `dataSource` string in the desktop action row.
   * When provided it renders instead of `dataSource` (e.g. a small inline
   * chart). `dataSource` is still used as the mobile-row fallback.
   */
  dataSourceNode?: ReactNode
  onExport?: () => void
  /** When provided, renders an EndorseButton in the action cluster */
  endorseUrl?: string
  endorseLabel?: string
  endorseResourceType?: string
  /** When provided, renders a FlagButton in the action cluster */
  flagUrl?: string
  flagLabel?: string
  flagResourceType?: string
  testId?: string
  /**
   * Page-specific action(s) rendered inside the shared action cluster (both the
   * desktop row and the mobile menu). Pass small buttons so they sit naturally
   * among the standard actions — e.g. /learn rides its Quiz entry here instead
   * of building a bespoke header.
   */
  actions?: ReactNode
  /**
   * Renders `actions` inline to the right of the description on md+ instead of
   * in the action row underneath (2026-08-02). Opt-in, because it only pays off
   * for a page whose ONLY action is `actions` — /learn passes a single Quiz
   * button and everything else (dataSource, export, endorse, flag) now lives in
   * the global top bar, so the action row was one full row of vertical space
   * spent on one button. Pages that still render dataSource/export/endorse/flag
   * should leave this off: those stay in the row below regardless, and pulling
   * only `actions` out would split one cluster across two places.
   * No effect on mobile — the 3-dot menu is unchanged.
   */
  actionsInline?: boolean
}

/**
 * Standard page header used across all data pages.
 * Renders a centered title block with icon, subtitle, and data-source row + action buttons.
 *
 * Sources / Share / Glossary / FAQ / Guide / Assistant / role-switcher used to
 * live here too, but the persona-journeys A-grade redesign's MainLayout top
 * bar (2026-08-01) now renders all of those globally on every route — keeping
 * them here as well just duplicated the same buttons in a second row directly
 * underneath. This component now only renders what's genuinely page-specific
 * and has no global equivalent: the data-source display, export, endorse/flag,
 * and the `actions` passthrough slot.
 */
export const PageHeader = ({
  icon: Icon,
  title,
  description,
  dataSource,
  dataSourceNode,
  onExport,
  endorseUrl,
  endorseLabel,
  endorseResourceType,
  flagUrl,
  flagLabel,
  flagResourceType,
  testId,
  actions,
  actionsInline = false,
}: PageHeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // Close mobile menu on outside click
  useEffect(() => {
    if (!mobileMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (!mobileMenuRef.current?.contains(e.target as Node)) setMobileMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [mobileMenuOpen])

  const hasActions = dataSource || dataSourceNode || onExport || endorseUrl || flagUrl || actions
  /** Everything in the md+ action row EXCEPT `actions` — used to decide whether
   *  that row still has a reason to exist once `actionsInline` lifts `actions`
   *  out of it. */
  const hasDesktopRowContent = !!(dataSource || dataSourceNode || onExport || endorseUrl || flagUrl)

  // Only `actions` and `onExport` live behind the mobile 3-dot menu now — no
  // point showing an empty dropdown toggle when neither is present.
  const hasMobileMenu = !!(actions || onExport)

  return (
    <div className="text-center mb-2 md:mb-12" data-testid={testId}>
      <h1 className="text-xl md:text-4xl font-bold mb-1 md:mb-4 text-gradient flex items-center justify-center gap-2 md:gap-3">
        <Icon className="w-5 h-5 md:w-9 md:h-9 text-primary shrink-0" aria-hidden="true" />
        {title}
      </h1>
      {/* Mobile: compact single-line description */}
      <p className="md:hidden text-xs text-muted-foreground max-w-xl mx-auto mb-2 line-clamp-2 px-4">
        {description}
      </p>
      {/* Tablet+: full description. With `actionsInline` the description and
          the action node share one centered row, so a page whose only action is
          a single button doesn't spend a second row on it. */}
      {actionsInline && actions ? (
        <div className="hidden md:flex items-center justify-center gap-4 mb-4">
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl">{description}</p>
          <div className="shrink-0">{actions}</div>
        </div>
      ) : (
        <p className="hidden md:block text-sm md:text-base text-muted-foreground max-w-2xl mx-auto mb-4">
          {description}
        </p>
      )}

      {/* Mobile-only action row — 3-dot menu on small screens */}
      {hasActions && (
        <div className="flex md:hidden justify-center items-center gap-2 mb-2">
          {endorseUrl && (
            <EndorseButton
              endorseUrl={endorseUrl}
              resourceLabel={endorseLabel ?? title}
              resourceType={endorseResourceType ?? 'Page'}
              variant="text"
            />
          )}
          {flagUrl && (
            <FlagButton
              flagUrl={flagUrl}
              resourceLabel={flagLabel ?? title}
              resourceType={flagResourceType ?? 'Page'}
              variant="text"
            />
          )}
          {hasMobileMenu && (
            <div className="relative" ref={mobileMenuRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen((p) => !p)}
                aria-label="More actions"
                aria-expanded={mobileMenuOpen}
                className="min-h-[44px] min-w-[44px] p-0"
              >
                <MoreHorizontal size={20} />
              </Button>
              {mobileMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-lg shadow-xl p-2 flex flex-col gap-1 min-w-[180px]"
                  role="menu"
                >
                  {actions}
                  {onExport && <ExportButton onExport={onExport} />}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tablet + desktop action row — visible at md+. Suppressed entirely when
          `actionsInline` moved the only occupant up beside the description. */}
      {hasActions && !(actionsInline && !hasDesktopRowContent) && (
        <div className="hidden md:flex justify-center items-center gap-3 text-[10px] md:text-xs text-muted-foreground font-mono">
          {dataSourceNode ?? (dataSource && <p>{dataSource}</p>)}
          {!actionsInline && actions}
          {onExport && <ExportButton onExport={onExport} />}
          {endorseUrl && (
            <EndorseButton
              endorseUrl={endorseUrl}
              resourceLabel={endorseLabel ?? title}
              resourceType={endorseResourceType ?? 'Page'}
            />
          )}
          {flagUrl && (
            <FlagButton
              flagUrl={flagUrl}
              resourceLabel={flagLabel ?? title}
              resourceType={flagResourceType ?? 'Page'}
            />
          )}
        </div>
      )}
    </div>
  )
}

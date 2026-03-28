// SPDX-License-Identifier: GPL-3.0-only
import { useState, useRef, useEffect } from 'react'
import type { LucideIcon } from 'lucide-react'
import { MessageCircle, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SourcesButton } from '@/components/ui/SourcesButton'
import { ShareButton } from '@/components/ui/ShareButton'
import { GlossaryButton } from '@/components/ui/GlossaryButton'
import { ExportButton } from '@/components/ui/ExportButton'
import { EndorseButton } from '@/components/ui/EndorseButton'
import { FlagButton } from '@/components/ui/FlagButton'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import type { ViewType } from '@/data/authoritativeSourcesData'

interface PageHeaderProps {
  icon: LucideIcon
  title: string
  description: string
  /** Pre-formatted string, e.g. "timeline_03082026.csv • Updated: 3/8/2026" */
  dataSource?: string
  viewType?: ViewType
  shareTitle?: string
  shareText?: string
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
}

/**
 * Standard page header used across all data pages.
 * Renders a centered title block with icon, subtitle, and data-source row + action buttons.
 */
export const PageHeader = ({
  icon: Icon,
  title,
  description,
  dataSource,
  viewType,
  shareTitle,
  shareText,
  onExport,
  endorseUrl,
  endorseLabel,
  endorseResourceType,
  flagUrl,
  flagLabel,
  flagResourceType,
  testId,
}: PageHeaderProps) => {
  const openChat = useRightPanelStore((s) => s.open)
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

  const hasActions = dataSource || viewType || shareTitle || onExport || endorseUrl || flagUrl

  return (
    <div className="text-center mb-2 md:mb-12" data-testid={testId}>
      <h2 className="text-xl md:text-4xl font-bold mb-1 md:mb-4 text-gradient flex items-center justify-center gap-2 md:gap-3">
        <Icon className="w-5 h-5 md:w-9 md:h-9 text-primary shrink-0" aria-hidden="true" />
        {title}
      </h2>
      <p className="hidden lg:block text-sm md:text-base text-muted-foreground max-w-2xl mx-auto mb-4">
        {description}
      </p>

      {/* Mobile/tablet action row — visible below lg */}
      {hasActions && (
        <div className="flex lg:hidden justify-center items-center gap-2 mb-2">
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
                {viewType && <SourcesButton viewType={viewType} />}
                {shareTitle && <ShareButton title={shareTitle} text={shareText} />}
                <GlossaryButton />
                {onExport && <ExportButton onExport={onExport} />}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    openChat('chat')
                  }}
                  className="w-full justify-start gap-2 min-h-[44px]"
                  role="menuitem"
                >
                  <MessageCircle size={15} aria-hidden="true" />
                  PQC Assistant
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Desktop action row — visible at lg+ */}
      {hasActions && (
        <div className="hidden lg:flex justify-center items-center gap-3 text-[10px] md:text-xs text-muted-foreground font-mono">
          {dataSource && <p>{dataSource}</p>}
          {viewType && <SourcesButton viewType={viewType} />}
          {shareTitle && <ShareButton title={shareTitle} text={shareText} />}
          <GlossaryButton />
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
          <Button
            variant="gradient"
            onClick={() => openChat('chat')}
            className="w-8 h-8 rounded-full shadow-md shadow-primary/25 p-0 shrink-0"
            aria-label="Open PQC Assistant"
          >
            <MessageCircle size={15} aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  )
}

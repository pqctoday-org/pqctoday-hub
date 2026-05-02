// SPDX-License-Identifier: GPL-3.0-only
import { useState, useRef, useEffect } from 'react'
import type { LucideIcon } from 'lucide-react'
import { MessageCircle, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SourcesButton } from '@/components/ui/SourcesButton'
import { ShareButton } from '@/components/ui/ShareButton'
import { GlossaryButton } from '@/components/ui/GlossaryButton'
import { FAQButton } from '@/components/ui/FAQButton'
import { UserManualButton } from '@/components/ui/UserManualButton'
import { ExportButton } from '@/components/ui/ExportButton'
import { EndorseButton } from '@/components/ui/EndorseButton'
import { FlagButton } from '@/components/ui/FlagButton'
import { PersonaChip } from '@/components/Persona/PersonaChip'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import type { ViewType } from '@/data/authoritativeSourcesData'
import { useEmbedState } from '@/embed/EmbedProvider'
import type { PageId } from '@/data/userManualData'

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
  /** When provided, renders a page-specific Guide button */
  pageId?: PageId
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
  pageId,
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

  const hasActions =
    dataSource || viewType || shareTitle || onExport || endorseUrl || flagUrl || pageId

  const embedState = useEmbedState()
  const showAssistant =
    !embedState.isEmbedded || embedState.policy.features.assistantEnabled !== false

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
      {/* Tablet+: full description */}
      <p className="hidden md:block text-sm md:text-base text-muted-foreground max-w-2xl mx-auto mb-4">
        {description}
      </p>

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
                <FAQButton />
                {pageId && <UserManualButton pageId={pageId} />}
                {onExport && <ExportButton onExport={onExport} />}
                {showAssistant && (
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
                    Assistant
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tablet + desktop action row — visible at md+ */}
      {hasActions && (
        <div className="hidden md:flex justify-center items-center gap-3 text-[10px] md:text-xs text-muted-foreground font-mono">
          {dataSource && <p>{dataSource}</p>}
          {viewType && <SourcesButton viewType={viewType} />}
          {shareTitle && <ShareButton title={shareTitle} text={shareText} />}
          <GlossaryButton />
          {pageId && <UserManualButton pageId={pageId} />}
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
          {showAssistant && (
            <Button
              variant="ghost"
              onClick={() => openChat('chat')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-foreground text-sm font-medium transition-colors border border-primary/20"
              aria-label="Open PQC Assistant"
            >
              <MessageCircle size={14} aria-hidden="true" />
              <span>Assistant</span>
            </Button>
          )}
          <PersonaChip />
        </div>
      )}
    </div>
  )
}

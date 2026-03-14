// SPDX-License-Identifier: GPL-3.0-only
import { ExternalLink, Calendar, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import type { LibraryItem } from '../../data/libraryData'
import { useEffect, useRef, useState } from 'react'
import FocusLock from 'react-focus-lock'
import { AskAssistantButton } from '../ui/AskAssistantButton'
import { EndorseButton } from '../ui/EndorseButton'
import { FlagButton } from '../ui/FlagButton'
import { buildLibraryEndorsementUrl, buildLibraryFlagUrl } from './libraryEndorsement'
import { libraryEnrichments } from '../../data/libraryEnrichmentData'
import { DocumentAnalysis } from './DocumentAnalysis'
import { leadersData } from '../../data/leadersData'

/** Strip parenthetical annotations and honorific prefixes, then lowercase. */
function normalizeLeaderName(raw: string): string {
  return raw
    .replace(/\s*\(.*?\)/g, '')
    .replace(/^(Dr\.|Prof\.|Dr |Prof )\s*/i, '')
    .trim()
    .toLowerCase()
}

/** Built once at module load: normalized name → Leader. */
const leaderByNormalizedName = new Map(leadersData.map((l) => [normalizeLeaderName(l.name), l]))

interface LibraryDetailPopoverProps {
  isOpen: boolean
  onClose: () => void
  item: LibraryItem | null
}

export const LibraryDetailPopover = ({ isOpen, onClose, item }: LibraryDetailPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null)
  const [pngVisible, setPngVisible] = useState(false)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  // Reset PNG visibility when item changes
  useEffect(() => {
    return () => {
      setPngVisible(false)
    }
  }, [item])

  // Body scroll lock while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen || !item) return null

  // Pass 1: reverse keyResourceUrl lookup (authoritative)
  const seen = new Set<string>()
  const relatedLeaders = []
  for (const l of leadersData) {
    if (l.keyResourceUrl?.includes(item.referenceId)) {
      relatedLeaders.push(l)
      seen.add(l.id)
    }
  }

  // Pass 2: name-match from enrichment leadersContributions (additive, deduplicated)
  const enrichment = libraryEnrichments[item.referenceId]
  if (enrichment) {
    for (const contrib of enrichment.leadersContributions) {
      const leader = leaderByNormalizedName.get(normalizeLeaderName(contrib))
      if (leader && !seen.has(leader.id)) {
        relatedLeaders.push(leader)
        seen.add(leader.id)
      }
    }
  }

  const style: React.CSSProperties = { zIndex: 9999 }

  // Derive PNG URL from localFile if available (e.g. "public/library/FIPS_203.pdf" → "/library/FIPS_203.png")
  const stem = item.localFile
    ?.split('/')
    .pop()
    ?.replace(/\.[^.]+$/, '')
  const pngUrl = stem ? `/library/${stem}.png` : null

  const content = (
    <>
      {/* Backdrop — dims background, existing mousedown handler closes on outside click */}
      <div className="fixed inset-0 bg-black/60" style={{ zIndex: 9998 }} aria-hidden="true" />

      {/* A-002: Focus trap for accessibility */}
      <FocusLock returnFocus>
        <div
          ref={popoverRef}
          className="fixed bottom-0 left-0 right-0 w-full max-h-[90dvh] rounded-t-2xl md:bottom-auto md:left-1/2 md:right-auto md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[60vw] md:max-w-[1200px] md:max-h-[85dvh] md:rounded-xl border border-border overflow-hidden animate-in slide-in-from-bottom-4 duration-300 flex flex-col bg-popover text-popover-foreground shadow-2xl"
          style={style}
          role="dialog"
          aria-modal="true"
          aria-labelledby="popover-title"
        >
          {/* Drag handle — visible on mobile only */}
          <div className="md:hidden flex justify-center pt-2 pb-1 shrink-0" aria-hidden="true">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Header */}
          <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-start gap-4 flex-shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-status-info text-status-info border-status-info/50">
                  {item.documentType?.trim()}
                </span>
                <span className="text-xs text-muted-foreground">{item.referenceId?.trim()}</span>
              </div>
              <h3 id="popover-title" className="text-lg font-bold text-foreground leading-tight">
                {item.documentTitle?.trim()}
              </h3>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Ask button hidden on mobile — shown in content area instead */}
              <div className="hidden sm:contents">
                <AskAssistantButton
                  question={`What is the significance of "${item.documentTitle?.trim()}"${item.authorsOrOrganization ? ` by ${item.authorsOrOrganization}` : ''}${item.documentType ? ` (${item.documentType})` : ''} for PQC migration?${item.shortDescription ? ` Summary: ${item.shortDescription}` : ''}`}
                />
              </div>
              <EndorseButton
                endorseUrl={buildLibraryEndorsementUrl(item, true)}
                resourceLabel={item.referenceId}
                resourceType="Library"
              />
              <FlagButton
                flagUrl={buildLibraryFlagUrl(item, true)}
                resourceLabel={item.referenceId}
                resourceType="Library"
              />
              <button
                onClick={onClose}
                aria-label="Close details"
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="p-4 overflow-y-auto space-y-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {/* Ask button — mobile only, shown here since header is crowded on small screens */}
            <div className="sm:hidden">
              <AskAssistantButton
                question={`What is the significance of "${item.documentTitle?.trim()}"${item.authorsOrOrganization ? ` by ${item.authorsOrOrganization}` : ''}${item.documentType ? ` (${item.documentType})` : ''} for PQC migration?${item.shortDescription ? ` Summary: ${item.shortDescription}` : ''}`}
              />
            </div>
            {/* PNG Preview — shown only if the file exists (onError hides it) */}
            {pngUrl && (
              <img
                src={pngUrl}
                alt={`First page preview of ${item.documentTitle}`}
                className={`w-full max-h-52 object-contain bg-muted/30 rounded-lg ${pngVisible ? 'block' : 'hidden'}`}
                onLoad={() => setPngVisible(true)}
                onError={() => setPngVisible(false)}
              />
            )}

            {/* Description */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0">
                Description
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.shortDescription?.trim() || 'No description available.'}
              </p>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 w-full">
              <div className="flex flex-row items-baseline gap-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
                  Status:
                </h4>
                <p className="text-sm text-foreground">{item.documentStatus?.trim()}</p>
              </div>

              <div className="flex flex-row items-baseline gap-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
                  Authors:
                </h4>
                <p
                  className="text-sm text-foreground truncate"
                  title={item.authorsOrOrganization?.trim()}
                >
                  {item.authorsOrOrganization?.trim()}
                </p>
              </div>

              <div className="flex flex-row items-center gap-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
                  Published:
                </h4>
                <div className="flex items-center gap-1.5 text-foreground text-sm">
                  <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span>{item.initialPublicationDate?.trim()}</span>
                </div>
              </div>

              <div className="flex flex-row items-center gap-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
                  Updated:
                </h4>
                <div className="flex items-center gap-1.5 text-foreground text-sm">
                  <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span>{item.lastUpdateDate?.trim()}</span>
                </div>
              </div>

              {item.regionScope && (
                <div className="flex flex-row items-baseline gap-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
                    Region:
                  </h4>
                  <p className="text-sm text-muted-foreground">{item.regionScope?.trim()}</p>
                </div>
              )}

              {item.migrationUrgency && (
                <div className="flex flex-row items-baseline gap-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
                    Urgency:
                  </h4>
                  <p className="text-sm text-muted-foreground">{item.migrationUrgency?.trim()}</p>
                </div>
              )}

              {item.applicableIndustries && (
                <div className="flex flex-row items-baseline gap-2 col-span-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
                    Industries:
                  </h4>
                  <p
                    className="text-sm text-muted-foreground truncate"
                    title={
                      Array.isArray(item.applicableIndustries)
                        ? item.applicableIndustries.join(', ')
                        : (item.applicableIndustries as string)?.trim()
                    }
                  >
                    {Array.isArray(item.applicableIndustries)
                      ? item.applicableIndustries.join(', ')
                      : (item.applicableIndustries as string)?.trim()}
                  </p>
                </div>
              )}
            </div>

            {/* Download Link */}
            {item.downloadUrl && (
              <div className="pt-2 border-t border-border">
                <a
                  href={item.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                >
                  <ExternalLink size={14} />
                  Open Document
                </a>
              </div>
            )}

            {/* Document Analysis — enriched dimensions */}
            {libraryEnrichments[item.referenceId] && (
              <DocumentAnalysis
                enrichment={libraryEnrichments[item.referenceId]}
                relatedLeaders={relatedLeaders}
              />
            )}
          </div>
        </div>
      </FocusLock>
    </>
  )

  return createPortal(content, document.body)
}

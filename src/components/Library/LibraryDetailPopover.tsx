// SPDX-License-Identifier: GPL-3.0-only
import { ExternalLink, Calendar, X } from 'lucide-react'
import { ShareButton } from '../ui/ShareButton'
import { createPortal } from 'react-dom'
import type { LibraryItem } from '../../data/libraryData'
import { useEffect, useRef, useState } from 'react'
import FocusLock from 'react-focus-lock'
import { motion } from 'framer-motion'
import { AskAssistantButton } from '../ui/AskAssistantButton'
import { EndorseButton } from '../ui/EndorseButton'
import { FlagButton } from '../ui/FlagButton'
import { buildLibraryEndorsementUrl, buildLibraryFlagUrl } from './libraryEndorsement'
import { libraryEnrichments } from '../../data/libraryEnrichmentData'
import { DocumentAnalysis } from './DocumentAnalysis'
import { leadersData } from '../../data/leadersData'
import clsx from 'clsx'
import { useIsEmbedded } from '../../embed/EmbedProvider'
import { useModalPosition } from '../../hooks/useModalPosition'
import { Button } from '@/components/ui/button'

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
  const isEmbedded = useIsEmbedded()
  const positionStyle = useModalPosition(isEmbedded)

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
          className={clsx(
            'pointer-events-none flex justify-center',
            isEmbedded ? 'absolute inset-x-0' : 'fixed inset-0 items-end md:items-center'
          )}
          style={{
            zIndex: 9999,
            ...(isEmbedded
              ? {
                  position: 'absolute',
                  // Instead of transform -50%, we manually offset top a bit to fake vertical centering
                  // and use 0 bottom/left/right so the flex row naturally horizontal centers
                  top: `max(20px, calc(${positionStyle.top} - 350px))`,
                }
              : {}),
          }}
        >
          <motion.div
            ref={popoverRef}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose()
              }
            }}
            className="w-full max-h-[90dvh] md:max-h-[85dvh] rounded-t-2xl md:w-[80vw] md:max-w-[1200px] md:rounded-xl border border-border overflow-hidden flex flex-col bg-popover text-popover-foreground shadow-2xl pointer-events-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="popover-title"
          >
            {/* Drag handle — visible on mobile only */}
            <div className="md:hidden flex justify-center pt-2 pb-1 shrink-0" aria-hidden="true">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="p-4 border-b border-border bg-muted/20 flex flex-col gap-3 flex-shrink-0 relative">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-status-info text-status-info border-status-info/50">
                      {item.documentType?.trim()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.referenceId?.trim()}
                    </span>
                  </div>
                  <h3
                    id="popover-title"
                    className="text-lg font-bold text-foreground leading-tight"
                  >
                    {item.documentTitle?.trim()}
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  onClick={onClose}
                  aria-label="Close details"
                  className="p-1.5 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                  style={{ marginTop: '-4px', marginRight: '-4px' }}
                >
                  <X size={18} aria-hidden="true" />
                </Button>
              </div>
              {/* Actions Row */}
              <div className="hidden md:flex items-center gap-2 flex-wrap">
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
                <ShareButton
                  title={item.documentTitle}
                  url={`${window.location.origin}/library?ref=${item.referenceId}`}
                />
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 overflow-y-auto pb-24 md:pb-4 flex flex-col md:grid md:grid-cols-[1.5fr_1fr] md:gap-6 md:items-start relative">
              <div className="space-y-4 order-2 md:order-1">
                {/* Ask button — mobile only, shown here since header is crowded on small screens */}
                <div className="sm:hidden">
                  <AskAssistantButton
                    question={`What is the significance of "${item.documentTitle?.trim()}"${item.authorsOrOrganization ? ` by ${item.authorsOrOrganization}` : ''}${item.documentType ? ` (${item.documentType})` : ''} for PQC migration?${item.shortDescription ? ` Summary: ${item.shortDescription}` : ''}`}
                  />
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Description
                  </h4>
                  <p className="text-sm text-foreground leading-relaxed">
                    {item.shortDescription?.trim() || 'No description available.'}
                  </p>
                </div>

                {/* Document Analysis — enriched dimensions */}
                {libraryEnrichments[item.referenceId] && (
                  <DocumentAnalysis
                    enrichment={libraryEnrichments[item.referenceId]}
                    relatedLeaders={relatedLeaders}
                  />
                )}
              </div>

              <div className="space-y-4 order-1 md:order-2 md:sticky md:top-0">
                {/* PNG Preview — shown only if the file exists (onError hides it) */}
                {pngUrl && (
                  <img
                    src={pngUrl}
                    alt={`First page preview of ${item.documentTitle}`}
                    className={`w-full max-h-52 object-contain bg-muted/30 rounded-lg border border-border ${pngVisible ? 'block' : 'hidden'}`}
                    onLoad={() => setPngVisible(true)}
                    onError={() => setPngVisible(false)}
                  />
                )}

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 p-3 bg-muted/20 border border-border rounded-lg">
                  <div className="flex flex-row items-baseline gap-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0 w-20">
                      Status:
                    </h4>
                    <p className="text-sm text-foreground font-medium">
                      {item.documentStatus?.trim()}
                    </p>
                  </div>

                  <div className="flex flex-row items-baseline gap-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0 w-20">
                      Authors:
                    </h4>
                    <p className="text-sm text-foreground break-words line-clamp-3">
                      {item.authorsOrOrganization?.trim()}
                    </p>
                  </div>

                  <div className="flex flex-row items-center gap-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0 w-20">
                      Published:
                    </h4>
                    <div className="flex items-center gap-1.5 text-foreground text-sm">
                      <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span>{item.initialPublicationDate?.trim()}</span>
                    </div>
                  </div>

                  <div className="flex flex-row items-center gap-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0 w-20">
                      Updated:
                    </h4>
                    <div className="flex items-center gap-1.5 text-foreground text-sm">
                      <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span>{item.lastUpdateDate?.trim()}</span>
                    </div>
                  </div>

                  {item.regionScope && (
                    <div className="flex flex-row items-baseline gap-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0 w-20">
                        Region:
                      </h4>
                      <p className="text-sm text-foreground">{item.regionScope?.trim()}</p>
                    </div>
                  )}

                  {item.migrationUrgency && (
                    <div className="flex flex-row items-baseline gap-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0 w-20">
                        Urgency:
                      </h4>
                      <p className="text-sm text-foreground">{item.migrationUrgency?.trim()}</p>
                    </div>
                  )}

                  {item.applicableIndustries && (
                    <div className="flex flex-col gap-1 mt-1 col-span-full">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Industries:
                      </h4>
                      <p className="text-sm text-foreground break-words">
                        {Array.isArray(item.applicableIndustries)
                          ? item.applicableIndustries.join(', ')
                          : (item.applicableIndustries as string)?.trim()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Download Link Desktop Only */}
                {item.downloadUrl && (
                  <div className="hidden md:block pt-4 text-center">
                    <a
                      href={item.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold rounded-lg transition-colors"
                    >
                      <ExternalLink size={16} />
                      Open Document
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Sticky Footer */}
            <div className="md:hidden sticky bottom-0 left-0 right-0 p-3 bg-popover/90 backdrop-blur-md border-t border-border flex items-center justify-between gap-2 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] shrink-0 z-10 w-[calc(100%+1px)] -ml-[0.5px]">
              {item.downloadUrl && (
                <a
                  href={item.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors truncate"
                >
                  <ExternalLink size={16} className="shrink-0" />
                  <span className="truncate">Open Document</span>
                </a>
              )}
              <div className="flex items-center gap-1 shrink-0">
                <EndorseButton
                  endorseUrl={buildLibraryEndorsementUrl(item, true)}
                  resourceLabel={item.referenceId}
                  resourceType="Library"
                />
                <ShareButton
                  title={item.documentTitle}
                  url={`${window.location.origin}/library?ref=${item.referenceId}`}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </FocusLock>
    </>
  )

  return createPortal(content, document.body)
}

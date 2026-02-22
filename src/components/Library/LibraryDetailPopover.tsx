import { ExternalLink, Calendar, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import type { LibraryItem } from '../../data/libraryData'
import { useEffect, useRef, useState } from 'react'
import FocusLock from 'react-focus-lock'

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

  if (!isOpen || !item) return null

  const style: React.CSSProperties = { zIndex: 9999 }

  // Derive PNG URL from localFile if available (e.g. "public/library/FIPS_203.pdf" → "/library/FIPS_203.png")
  const stem = item.localFile
    ?.split('/')
    .pop()
    ?.replace(/\.[^.]+$/, '')
  const pngUrl = stem ? `/library/${stem}.png` : null

  const content = (
    // A-002: Focus trap for accessibility
    <FocusLock returnFocus>
      <div
        ref={popoverRef}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] sm:w-[85vw] md:w-[60vw] max-w-[1200px] max-h-[85vh] border border-border rounded-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col bg-popover text-popover-foreground shadow-2xl"
        style={style}
        role="dialog"
        aria-modal="true"
        aria-labelledby="popover-title"
      >
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
          <button
            onClick={onClose}
            aria-label="Close details"
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors flex-shrink-0"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto space-y-4">
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
        </div>
      </div>
    </FocusLock>
  )

  return createPortal(content, document.body)
}

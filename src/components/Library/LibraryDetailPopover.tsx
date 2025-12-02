import { ExternalLink, Calendar, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import type { LibraryItem } from '../../data/libraryData'
import { useEffect, useRef, useState } from 'react'

interface LibraryDetailPopoverProps {
  isOpen: boolean
  onClose: () => void
  item: LibraryItem | null
  position: { x: number; y: number } | null
}

export const LibraryDetailPopover = ({
  isOpen,
  onClose,
  item,
  position,
}: LibraryDetailPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null)
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth)

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

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

  if (!isOpen || !item || !position) return null

  // Popover width - responsive to viewport
  const POPOVER_WIDTH = Math.min(576, viewportWidth * 0.9) // Max 36rem (576px) or 90% of viewport
  const HALF_WIDTH = POPOVER_WIDTH / 2
  const MARGIN = 20 // Safety margin from screen edges
  const ESTIMATED_POPOVER_HEIGHT = 400 // Approximate height of popover

  // Calculate left position with boundary checks
  let left = position.x
  let transformX = '-50%'

  // Check left boundary
  if (left - HALF_WIDTH < MARGIN) {
    left = MARGIN
    transformX = '0%' // Align left edge
  }
  // Check right boundary
  else if (left + HALF_WIDTH > viewportWidth - MARGIN) {
    left = viewportWidth - MARGIN
    transformX = '-100%' // Align right edge
  }

  // Calculate vertical position with boundary checks
  const top = position.y
  let transformY = '-100%' // Default: position above the element
  let translateYOffset = '-10px' // Small offset above

  // Check if popover would extend above the top of the screen
  if (position.y - ESTIMATED_POPOVER_HEIGHT < MARGIN) {
    // Position below the element instead
    transformY = '0%'
    translateYOffset = '10px' // Small offset below
  }

  // Calculate position style to keep it on screen
  const style: React.CSSProperties = {
    position: 'fixed',
    left: left,
    top: top,
    transform: `translate(${transformX}, ${transformY}) translateY(${translateYOffset})`,
    zIndex: 9999, // Ensure it's on top of everything
    backgroundColor: '#111827', // Force opaque dark gray (Tailwind gray-900)
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', // Strong shadow
    maxWidth: `${POPOVER_WIDTH}px`, // Ensure it never exceeds calculated width
  }

  const content = (
    <div
      ref={popoverRef}
      className="max-w-[36rem] w-[90vw] border border-white/20 rounded-xl overflow-hidden animate-in zoom-in-95 duration-200"
      style={style}
      role="dialog"
      aria-modal="true"
      aria-labelledby="popover-title"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {item.documentType}
            </span>
            <span className="text-xs text-muted">{item.referenceId}</span>
          </div>
          <h3 id="popover-title" className="text-lg font-bold text-white leading-tight">
            {item.documentTitle}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-muted hover:text-white transition-colors p-1 rounded hover:bg-white/10"
          aria-label="Close details"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
        {/* Top Section: Description (Full Width) */}
        <div>
          <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            Description
          </h4>
          <p className="text-sm text-gray-300 leading-relaxed">
            {item.shortDescription || 'No description available.'}
          </p>
        </div>

        {/* Bottom Section: Metadata Grid (4 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Column 1: Status & Authors */}
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                Status
              </h4>
              <p className="text-sm text-white">{item.documentStatus}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                Authors/Org
              </h4>
              <p className="text-sm text-white">{item.authorsOrOrganization}</p>
            </div>
          </div>

          {/* Column 2: Dates */}
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                Initial Pub. Date
              </h4>
              <div className="flex items-center gap-1.5 text-white text-sm">
                <Calendar className="w-3 h-3 text-muted shrink-0" />
                <span>{item.initialPublicationDate}</span>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                Last Update
              </h4>
              <div className="flex items-center gap-1.5 text-white text-sm">
                <Calendar className="w-3 h-3 text-muted shrink-0" />
                <span>{item.lastUpdateDate}</span>
              </div>
            </div>
          </div>

          {/* Column 3: Scope & Urgency */}
          <div className="space-y-6">
            {item.regionScope && (
              <div>
                <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  Region Scope
                </h4>
                <p className="text-sm text-gray-300">{item.regionScope}</p>
              </div>
            )}
            {item.migrationUrgency && (
              <div>
                <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  Migration Urgency
                </h4>
                <p className="text-sm text-gray-300">{item.migrationUrgency}</p>
              </div>
            )}
          </div>

          {/* Column 4: Industries */}
          <div className="space-y-6">
            {item.applicableIndustries && (
              <div>
                <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  Applicable Industries
                </h4>
                <p className="text-sm text-gray-300">{item.applicableIndustries}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer: Download Link */}
        {item.downloadUrl && (
          <div className="pt-2 border-t border-white/10 mt-2">
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
  )

  return createPortal(content, document.body)
}

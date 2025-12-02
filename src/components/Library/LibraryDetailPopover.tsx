import { ExternalLink, Calendar, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import type { LibraryItem } from '../../data/libraryData'
import { useEffect, useRef } from 'react'

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

  // Center the popover
  const style: React.CSSProperties = {
    position: 'fixed',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 9999, // Ensure it's on top of everything
    backgroundColor: '#111827', // Force opaque dark gray (Tailwind gray-900)
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', // Strong shadow
    width: '60vw', // 60% of viewport width (20% margins on each side)
    maxWidth: '1200px', // Optional max width for very large screens
    maxHeight: '85vh', // Ensure it fits vertically
  }

  const content = (
    <div
      ref={popoverRef}
      className="border border-white/20 rounded-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
          {/* Status */}
          <div className="flex flex-row items-baseline gap-2">
            <h4 className="text-xs font-semibold text-muted uppercase tracking-wider shrink-0">
              Status:
            </h4>
            <p className="text-sm text-white">{item.documentStatus}</p>
          </div>

          {/* Authors/Org */}
          <div className="flex flex-row items-baseline gap-2">
            <h4 className="text-xs font-semibold text-muted uppercase tracking-wider shrink-0">
              Authors:
            </h4>
            <p className="text-sm text-white truncate" title={item.authorsOrOrganization}>
              {item.authorsOrOrganization}
            </p>
          </div>

          {/* Initial Pub. Date */}
          <div className="flex flex-row items-center gap-2">
            <h4 className="text-xs font-semibold text-muted uppercase tracking-wider shrink-0">
              Published:
            </h4>
            <div className="flex items-center gap-1.5 text-white text-sm">
              <Calendar className="w-3 h-3 text-muted shrink-0" />
              <span>{item.initialPublicationDate}</span>
            </div>
          </div>

          {/* Last Update */}
          <div className="flex flex-row items-center gap-2">
            <h4 className="text-xs font-semibold text-muted uppercase tracking-wider shrink-0">
              Updated:
            </h4>
            <div className="flex items-center gap-1.5 text-white text-sm">
              <Calendar className="w-3 h-3 text-muted shrink-0" />
              <span>{item.lastUpdateDate}</span>
            </div>
          </div>

          {/* Region Scope */}
          {item.regionScope && (
            <div className="flex flex-row items-baseline gap-2">
              <h4 className="text-xs font-semibold text-muted uppercase tracking-wider shrink-0">
                Region:
              </h4>
              <p className="text-sm text-gray-300">{item.regionScope}</p>
            </div>
          )}

          {/* Migration Urgency */}
          {item.migrationUrgency && (
            <div className="flex flex-row items-baseline gap-2">
              <h4 className="text-xs font-semibold text-muted uppercase tracking-wider shrink-0">
                Urgency:
              </h4>
              <p className="text-sm text-gray-300">{item.migrationUrgency}</p>
            </div>
          )}

          {/* Applicable Industries */}
          {item.applicableIndustries && (
            <div className="flex flex-row items-baseline gap-2">
              <h4 className="text-xs font-semibold text-muted uppercase tracking-wider shrink-0">
                Industries:
              </h4>
              <p className="text-sm text-gray-300 truncate" title={Array.isArray(item.applicableIndustries) ? item.applicableIndustries.join(', ') : item.applicableIndustries}>
                {Array.isArray(item.applicableIndustries) ? item.applicableIndustries.join(', ') : item.applicableIndustries}
              </p>
            </div>
          )}
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

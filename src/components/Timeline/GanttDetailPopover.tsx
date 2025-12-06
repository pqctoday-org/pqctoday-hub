import { ExternalLink, Calendar } from 'lucide-react'
import { createPortal } from 'react-dom'
import type { TimelinePhase } from '../../types/timeline'
import { phaseColors } from '../../data/timelineData'
import { useEffect, useRef, useState } from 'react'

interface GanttDetailPopoverProps {
  isOpen: boolean
  onClose: () => void
  phase: TimelinePhase | null
  position: { x: number; y: number } | null
}

export const GanttDetailPopover = ({
  isOpen,
  onClose,
  phase,
  position,
}: GanttDetailPopoverProps) => {
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

  if (!isOpen || !phase || !position) return null

  const colors = phaseColors[phase.phase] || {
    start: '#94a3b8',
    end: '#cbd5e1',
    glow: 'rgba(148, 163, 184, 0.5)',
  }

  // Get source details from the first event (assuming main event details are primary)
  const primaryEvent = phase.events[0]
  const sourceUrl = primaryEvent?.sourceUrl
  const sourceDate = primaryEvent?.sourceDate

  // Popover width - responsive to viewport
  const POPOVER_WIDTH = Math.min(576, viewportWidth * 0.9) // Max 36rem (576px) or 90% of viewport
  const HALF_WIDTH = POPOVER_WIDTH / 2
  const MARGIN = 20 // Safety margin from screen edges
  const ESTIMATED_POPOVER_HEIGHT = 300 // Approximate height of popover

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
    >
      {/* Header with Phase Color */}
      <div
        className="p-3 border-b border-white/10"
        style={{
          background: `linear-gradient(to bottom, ${colors.glow} 0%, transparent 100%)`,
        }}
      >
        {/* Badge and Title */}
        <div className="flex items-center gap-2">
          <div
            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-foreground flex-shrink-0"
            style={{ backgroundColor: colors.start }}
          >
            {phase.phase}
          </div>
          <h3 className="text-xs font-bold text-foreground leading-tight">{phase.title}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <p className="text-xs text-gray-300 leading-relaxed break-words">{phase.description}</p>
        </div>

        {/* Table Layout for Details: 4 columns (Label Value Label Value) */}
        <div className="pt-3 border-t border-white/5">
          <table className="w-full text-xs border-collapse">
            <tbody>
              {/* Row 1: Start and End */}
              <tr>
                <td className="py-1.5 pr-3 text-muted-foreground uppercase tracking-wider font-medium text-[10px] whitespace-nowrap w-1">
                  Start
                </td>
                <td className="py-1.5 pr-6 font-mono text-foreground text-[10px]">
                  {phase.startYear}
                </td>

                <td className="py-1.5 pr-3 text-muted-foreground uppercase tracking-wider font-medium text-[10px] whitespace-nowrap w-1">
                  End
                </td>
                <td className="py-1.5 font-mono text-foreground text-[10px]">{phase.endYear}</td>
              </tr>

              {/* Row 2: Source and Date */}
              <tr>
                <td className="py-1.5 pr-3 text-muted-foreground uppercase tracking-wider font-medium text-[10px] whitespace-nowrap">
                  Source
                </td>
                <td className="py-1.5 pr-6">
                  {sourceUrl ? (
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors truncate max-w-[120px]"
                      title={sourceUrl}
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">View</span>
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-[10px]">-</span>
                  )}
                </td>

                <td className="py-1.5 pr-3 text-muted-foreground uppercase tracking-wider font-medium text-[10px] whitespace-nowrap">
                  Date
                </td>
                <td className="py-1.5">
                  <div className="flex items-center gap-1.5 text-foreground text-[10px]">
                    <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="truncate">{sourceDate || '-'}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

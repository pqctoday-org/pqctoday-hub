import { ExternalLink, Calendar } from 'lucide-react'
import { createPortal } from 'react-dom'
import type { TimelinePhase } from '../../types/timeline'
import { phaseColors } from '../../data/timelineData'
import { useEffect, useRef } from 'react'

interface GanttDetailPopoverProps {
  isOpen: boolean
  onClose: () => void
  phase: TimelinePhase | null
}

export const GanttDetailPopover = ({ isOpen, onClose, phase }: GanttDetailPopoverProps) => {
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

  if (!isOpen || !phase) return null

  const colors = phaseColors[phase.phase] || {
    start: 'hsl(var(--muted-foreground))',
    end: 'hsl(var(--muted))',
    glow: 'hsl(var(--ring))',
  }

  // Get source details from the first event (assuming main event details are primary)
  const primaryEvent = phase.events[0]
  const sourceUrl = primaryEvent?.sourceUrl
  const sourceDate = primaryEvent?.sourceDate

  // Center the popover
  const style: React.CSSProperties = {
    zIndex: 9999, // Ensure it's on top of everything
  }

  const content = (
    <div
      ref={popoverRef}
      className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[36rem] bg-popover text-popover-foreground shadow-2xl border border-border rounded-xl overflow-hidden animate-in zoom-in-95 duration-200"
      style={style}
    >
      {/* Header with Phase Color */}
      <div
        className="p-3 border-b border-border"
        style={{
          background: `linear-gradient(to bottom, ${colors.glow} 0%, transparent 100%)`,
        }}
      >
        {/* Badge and Title */}
        <div className="flex items-center gap-2">
          <div
            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-black flex-shrink-0"
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
          <p className="text-xs text-muted-foreground leading-relaxed break-words">
            {phase.description}
          </p>
        </div>

        {/* Table Layout for Details: 4 columns (Label Value Label Value) */}
        <div className="pt-3 border-t border-border">
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

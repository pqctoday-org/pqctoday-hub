import { ExternalLink, Calendar } from 'lucide-react'
import { createPortal } from 'react-dom'
import type { TimelinePhase, Phase } from '../../types/timeline'
import { phaseColors } from '../../data/timelineData'
import { useEffect, useRef } from 'react'
import { StatusBadge } from '../common/StatusBadge'

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

  const colors = phaseColors[phase.phase as Phase] || {
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
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider text-black flex-shrink-0"
            style={{ backgroundColor: colors.start }}
          >
            {phase.phase}
          </div>
          <h3 className="text-xs font-bold text-foreground leading-tight">{phase.title}</h3>
          <StatusBadge status={phase.status} size="sm" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground leading-relaxed break-words">
            {phase.description}
          </p>
        </div>

        {/* Detail grid: 2×2 on small screens, 4-col inline on sm+ */}
        <div className="pt-3 border-t border-border">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-xs">
            <div>
              <span className="block text-muted-foreground uppercase tracking-wider font-medium text-xs">
                Start
              </span>
              <span className="font-mono text-foreground">{phase.startYear}</span>
            </div>
            <div>
              <span className="block text-muted-foreground uppercase tracking-wider font-medium text-xs">
                End
              </span>
              <span className="font-mono text-foreground">{phase.endYear}</span>
            </div>
            <div>
              <span className="block text-muted-foreground uppercase tracking-wider font-medium text-xs">
                Source
              </span>
              {sourceUrl ? (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors"
                  title={sourceUrl}
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span>View</span>
                </a>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
            <div>
              <span className="block text-muted-foreground uppercase tracking-wider font-medium text-xs">
                Date
              </span>
              <div className="flex items-center gap-1.5 text-foreground">
                <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="truncate">{sourceDate || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

import type { GanttCountryData } from '../../types/timeline'
import { CountryFlag } from '../common/CountryFlag'
import { phaseColors } from '../../data/timelineData'
import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { GanttDetailPopover } from './GanttDetailPopover'
import type { TimelinePhase } from '../../types/timeline'

interface MobileTimelineListProps {
  data: GanttCountryData[]
}

export const MobileTimelineList = ({ data }: MobileTimelineListProps) => {
  const [selectedPhase, setSelectedPhase] = useState<TimelinePhase | null>(null)
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null)

  const handleCardClick = (phase: TimelinePhase, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setPopoverPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    })
    setSelectedPhase(phase)
  }

  const handleClosePopover = () => {
    setSelectedPhase(null)
    setPopoverPosition(null)
  }

  // Helper to determine the "Current" or most relevant phase to show
  const getCurrentPhase = (phases: TimelinePhase[]) => {
    const currentYear = new Date().getFullYear()
    // Find phase active now
    const active = phases.find((p) => p.startYear <= currentYear && p.endYear >= currentYear)
    // If none active, find next starting one
    if (!active) {
      return phases.find((p) => p.startYear > currentYear) || phases[phases.length - 1]
    }
    return active
  }

  return (
    <div className="flex flex-col gap-4 pb-8">
      {data.map((countryData) => {
        const { country, phases } = countryData
        // Sort phases to find the most relevant one to display as a "preview"
        // We'll just take the first one or logic for "current" if needed,
        // but for this list let's show all phases as compact rows or just the main one.
        // DECISION: Show a card per country, with a summary.

        const primaryPhase = getCurrentPhase(phases)

        return (
          <div
            key={country.countryName}
            className="glass-panel p-4 flex flex-col gap-3 active:scale-[0.98] transition-transform"
          >
            {/* Header: Flag + Name + Org */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-6 rounded-sm overflow-hidden shadow-sm flex-shrink-0">
                  <CountryFlag
                    code={country.flagCode}
                    width={32}
                    height={24}
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-foreground leading-tight">{country.countryName}</h3>
                  <p className="text-xs text-muted-foreground">{country.bodies[0]?.name}</p>
                </div>
              </div>
            </div>

            {/* Content: Summary of Phase */}
            {primaryPhase ? (
              <button
                type="button"
                className="w-full text-left mt-1 p-3 rounded-lg bg-muted/20 border border-border flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={(e) => handleCardClick(primaryPhase, e)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: phaseColors[primaryPhase.phase]?.start || '#fff',
                      boxShadow: `0 0 8px ${phaseColors[primaryPhase.phase]?.glow || 'transparent'}`,
                    }}
                  />
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      {primaryPhase.phase}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {primaryPhase.startYear} -{' '}
                      {primaryPhase.endYear === 2035 ? '2035+' : primaryPhase.endYear}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground/50" />
              </button>
            ) : (
              <div className="text-xs text-muted-foreground italic">No active timeline data</div>
            )}

            {/* Tiny indicator for other phases */}
            <div className="flex gap-1 mt-1">
              {phases.map((p, i) => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full"
                  style={{ backgroundColor: phaseColors[p.phase]?.start || '#333', opacity: 0.5 }}
                />
              ))}
            </div>
          </div>
        )
      })}

      <GanttDetailPopover
        isOpen={!!selectedPhase}
        onClose={handleClosePopover}
        phase={selectedPhase}
        position={popoverPosition}
      />
    </div>
  )
}

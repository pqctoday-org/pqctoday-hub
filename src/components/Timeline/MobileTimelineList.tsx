/* eslint-disable security/detect-object-injection */
import type { GanttCountryData } from '../../types/timeline'
import { CountryFlag } from '../common/CountryFlag'
import { phaseColors } from '../../data/timelineData'
import { ChevronRight, Flag } from 'lucide-react'
import { useState } from 'react'
import { GanttDetailPopover } from './GanttDetailPopover'
import type { TimelinePhase } from '../../types/timeline'
import { motion } from 'framer-motion'

interface MobileTimelineListProps {
  data: GanttCountryData[]
}

export const MobileTimelineList = ({ data }: MobileTimelineListProps) => {
  const [selectedPhase, setSelectedPhase] = useState<TimelinePhase | null>(null)
  // Track current phase index for each country
  const [phaseIndices, setPhaseIndices] = useState<Record<string, number>>({})

  const handleCardClick = (phase: TimelinePhase) => {
    setSelectedPhase(phase)
  }

  const handleClosePopover = () => {
    setSelectedPhase(null)
  }

  const getCurrentPhaseIndex = (countryName: string) => {
    return phaseIndices[countryName] ?? 0
  }

  const handleSwipe = (countryName: string, direction: 'left' | 'right', totalPhases: number) => {
    const currentIndex = getCurrentPhaseIndex(countryName)
    let newIndex = currentIndex

    if (direction === 'left' && currentIndex < totalPhases - 1) {
      newIndex = currentIndex + 1
    } else if (direction === 'right' && currentIndex > 0) {
      newIndex = currentIndex - 1
    }

    setPhaseIndices((prev) => ({
      ...prev,
      [countryName]: newIndex,
    }))
  }

  return (
    <div className="flex flex-col gap-4 pb-8" data-testid="mobile-timeline-list">
      {data.map((countryData) => {
        const { country, phases } = countryData
        const currentIndex = getCurrentPhaseIndex(country.countryName)
        const currentPhase = phases[currentIndex]

        return (
          <div
            key={country.countryName}
            className="glass-panel p-4 flex flex-col gap-3"
            data-testid={`country-card-${country.countryName}`}
          >
            {/* Header: Flag + Name + Org */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-6 rounded-sm overflow-hidden shadow-sm flex-shrink-0">
                  <CountryFlag
                    code={country.flagCode}
                    width={32}
                    height={24}
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-foreground leading-tight">{country.countryName}</h3>
                  <p className="text-xs text-muted-foreground">{country.bodies[0]?.name}</p>
                </div>
              </div>
            </div>

            {/* Swipeable Phase Content */}
            {currentPhase ? (
              <div className="relative overflow-hidden">
                <motion.div
                  key={currentIndex}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(_, info) => {
                    const threshold = 50
                    if (info.offset.x > threshold) {
                      handleSwipe(country.countryName, 'right', phases.length)
                    } else if (info.offset.x < -threshold) {
                      handleSwipe(country.countryName, 'left', phases.length)
                    }
                  }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <button
                    type="button"
                    className="w-full text-left p-3 rounded-lg bg-muted/20 border border-border flex items-center justify-between hover:bg-muted/30 transition-colors"
                    onClick={() => handleCardClick(currentPhase)}
                  >
                    <div className="flex items-center gap-3">
                      {currentPhase.type === 'Milestone' ? (
                        <Flag
                          size={14}
                          className="flex-shrink-0"
                          style={{
                            color: phaseColors[currentPhase.phase]?.start || 'hsl(var(--primary))',
                            filter: `drop-shadow(0 0 4px ${phaseColors[currentPhase.phase]?.glow || 'hsl(var(--primary) / 0.5)'})`,
                          }}
                        />
                      ) : (
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor:
                              phaseColors[currentPhase.phase]?.start || 'hsl(var(--primary))',
                            boxShadow: `0 0 8px ${phaseColors[currentPhase.phase]?.glow || 'hsl(var(--primary) / 0.5)'}`,
                          }}
                        />
                      )}
                      <div>
                        <span className="text-xs font-bold text-foreground block">
                          {currentPhase.phase}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {currentPhase.startYear} -{' '}
                          {currentPhase.endYear === 2035 ? '2035+' : currentPhase.endYear}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground/50" />
                  </button>
                </motion.div>

                {/* Phase Indicators (Dots) */}
                <div className="flex gap-1.5 mt-3 justify-center">
                  {phases.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setPhaseIndices((prev) => ({
                          ...prev,
                          [country.countryName]: i,
                        }))
                      }
                      className="transition-all"
                      aria-label={`Go to phase ${i + 1}: ${p.phase}`}
                    >
                      <div
                        className={`rounded-full transition-all ${
                          i === currentIndex ? 'w-6 h-1.5' : 'w-1.5 h-1.5'
                        }`}
                        style={{
                          backgroundColor:
                            i === currentIndex
                              ? phaseColors[p.phase]?.start || 'hsl(var(--primary))'
                              : 'hsl(var(--muted-foreground) / 0.3)',
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground italic">No active timeline data</div>
            )}
          </div>
        )
      })}

      <GanttDetailPopover
        isOpen={!!selectedPhase}
        onClose={handleClosePopover}
        phase={selectedPhase}
      />
    </div>
  )
}

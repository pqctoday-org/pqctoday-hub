// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import type { GanttCountryData, Phase } from '../../types/timeline'
import { CountryFlag } from '../common/CountryFlag'
import { phaseColors, getCountryLastVerified } from '../../data/timelineData'
import { ChevronRight, ChevronLeft, Flag, Rows3, GalleryHorizontal } from 'lucide-react'
import { useState, useEffect } from 'react'
import { GanttDetailPopover } from './GanttDetailPopover'
import type { TimelinePhase } from '../../types/timeline'
import { motion } from 'framer-motion'
import { StatusBadge } from '../common/StatusBadge'
import { Button } from '@/components/ui/button'

interface MobileTimelineListProps {
  data: GanttCountryData[]
  /** Initial view when the reader has no stored preference yet. Defaults to
   *  'swipe' (unchanged existing behavior) — the mobile UX layer's Timeline
   *  screen (design handoff §17: "Compact is the default view") passes
   *  'compact' explicitly. A reader's own past choice, once made, still wins
   *  either way — this only affects the very first render. */
  defaultMode?: MobileViewMode
}

// Alongside the existing one-phase-at-a-time swipe carousel, "compact" shows every
// phase for a country at once (condensed rows) — a whole-country overview option
// for users who want to scan a country's full timeline without swiping through it
// phase by phase. Doesn't replace the carousel; it's a toggle. The choice is
// remembered across visits (07-19 follow-up remediation, O2) so a user who picks
// "All phases" — the field-use case ops flagged — isn't dropped back into the
// swipe default every time they return.
type MobileViewMode = 'swipe' | 'compact'

const VIEW_MODE_STORAGE_KEY = 'timeline-mobile-view-mode'

function readStoredViewMode(fallback: MobileViewMode): MobileViewMode {
  const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY)
  if (stored === 'compact' || stored === 'swipe') return stored
  return fallback
}

export const MobileTimelineList = ({ data, defaultMode = 'swipe' }: MobileTimelineListProps) => {
  const [selectedPhase, setSelectedPhase] = useState<TimelinePhase | null>(null)
  // Track current phase index for each country
  const [phaseIndices, setPhaseIndices] = useState<Record<string, number>>({})
  const [viewMode, setViewModeState] = useState<MobileViewMode>(() =>
    readStoredViewMode(defaultMode)
  )

  const setViewMode = (mode: MobileViewMode) => {
    setViewModeState(mode)
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode)
  }

  // Track swipe hint visibility
  const [showSwipeHint, setShowSwipeHint] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('timeline-swipe-hint-dismissed')
    if (!dismissed) {
      const timer = setTimeout(() => {
        setShowSwipeHint(true)
        const hideTimer = setTimeout(() => {
          setShowSwipeHint(false)
          localStorage.setItem('timeline-swipe-hint-dismissed', 'true')
        }, 5000)
        return () => clearTimeout(hideTimer)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [])

  const dismissSwipeHint = () => {
    if (showSwipeHint) {
      setShowSwipeHint(false)
      localStorage.setItem('timeline-swipe-hint-dismissed', 'true')
    }
  }

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
      {/* Swipe vs compact whole-country-overview toggle */}
      <div
        className="flex items-center gap-1 self-end rounded-lg border border-border bg-muted/20 p-0.5"
        role="group"
        aria-label="Mobile timeline view"
      >
        <Button
          variant="ghost"
          type="button"
          onClick={() => setViewMode('swipe')}
          aria-pressed={viewMode === 'swipe'}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
            viewMode === 'swipe'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <GalleryHorizontal size={12} aria-hidden="true" />
          Swipe
        </Button>
        <Button
          variant="ghost"
          type="button"
          onClick={() => setViewMode('compact')}
          aria-pressed={viewMode === 'compact'}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
            viewMode === 'compact'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Rows3 size={12} aria-hidden="true" />
          All phases
        </Button>
      </div>

      {viewMode === 'compact' &&
        data.map((countryData) => {
          const { country, phases } = countryData
          const lastVerified = getCountryLastVerified(country)
          return (
            <div
              key={`compact-${country.countryName}`}
              className="glass-panel p-4 flex flex-col gap-3"
              data-testid={`country-card-compact-${country.countryName}`}
            >
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
                  {lastVerified && (
                    <p className="text-[9px] text-muted-foreground font-mono">
                      Verified {lastVerified}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                {phases.length === 0 ? (
                  <div className="text-xs text-muted-foreground italic">
                    No active timeline data
                  </div>
                ) : (
                  phases.map((phase, i) => (
                    <Button
                      variant="ghost"
                      type="button"
                      key={i}
                      onClick={() => handleCardClick(phase)}
                      className="w-full flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor:
                              phaseColors[phase.phase as Phase]?.start || 'hsl(var(--primary))',
                          }}
                        />
                        <span className="text-xs font-medium text-foreground truncate">
                          {phase.phase}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate hidden xs:inline">
                          {phase.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono flex-shrink-0">
                        {phase.startYear}–{phase.endYear === 2035 ? '2035+' : phase.endYear}
                      </span>
                    </Button>
                  ))
                )}
              </div>
            </div>
          )
        })}

      {viewMode === 'swipe' &&
        data.map((countryData) => {
          const { country, phases } = countryData
          const currentIndex = getCurrentPhaseIndex(country.countryName)
          const currentPhase = phases[currentIndex]
          const lastVerified = getCountryLastVerified(country)

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
                    <h3 className="font-bold text-foreground leading-tight">
                      {country.countryName}
                    </h3>
                    <p className="text-xs text-muted-foreground">{country.bodies[0]?.name}</p>
                    {lastVerified && (
                      <p className="text-[9px] text-muted-foreground font-mono">
                        Verified {lastVerified}
                      </p>
                    )}
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
                        dismissSwipeHint()
                      } else if (info.offset.x < -threshold) {
                        handleSwipe(country.countryName, 'left', phases.length)
                        dismissSwipeHint()
                      }
                    }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="cursor-grab active:cursor-grabbing group"
                    aria-label={`Timeline phases for ${country.countryName}`}
                    role="region"
                  >
                    <Button
                      variant="ghost"
                      type="button"
                      className="w-full text-left p-3 rounded-lg bg-muted/20 border border-border flex items-center justify-between hover:bg-muted/30 transition-colors relative"
                      onClick={() => handleCardClick(currentPhase)}
                    >
                      {/* Swipe Hint overlay */}
                      {showSwipeHint && currentIndex === 0 && (
                        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                          <div className="bg-background/90 text-foreground text-xs px-3 py-1 rounded-full shadow-md flex items-center gap-2 border border-border/50 backdrop-blur-sm animate-pulse">
                            <span>← Swipe →</span>
                          </div>
                        </div>
                      )}

                      {/* Subtle Side Chevrons on Hover */}
                      <ChevronLeft
                        size={16}
                        className="absolute left-1 opacity-0 group-hover:opacity-30 transition-opacity hidden sm:block"
                      />

                      <div className="flex items-center gap-3 pl-2 sm:pl-4">
                        {currentPhase.type === 'Milestone' ? (
                          <Flag
                            size={14}
                            className="flex-shrink-0"
                            style={{
                              color:
                                phaseColors[currentPhase.phase as Phase]?.start ||
                                'hsl(var(--primary))',
                              filter: `drop-shadow(0 0 4px ${phaseColors[currentPhase.phase as Phase]?.glow || 'hsl(var(--primary) / 0.5)'})`,
                            }}
                          />
                        ) : (
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor:
                                phaseColors[currentPhase.phase as Phase]?.start ||
                                'hsl(var(--primary))',
                              boxShadow: `0 0 8px ${phaseColors[currentPhase.phase as Phase]?.glow || 'hsl(var(--primary) / 0.5)'}`,
                            }}
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground block">
                              {currentPhase.phase}
                            </span>
                            <StatusBadge status={currentPhase.status} size="sm" />
                          </div>
                          <span className="text-[10px] sm:text-xs text-muted-foreground font-mono">
                            {currentPhase.startYear} -{' '}
                            {currentPhase.endYear === 2035 ? '2035+' : currentPhase.endYear}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[9px] text-muted-foreground tracking-wider uppercase pr-2 sm:pr-4">
                          Phase {currentIndex + 1} of {phases.length}
                        </span>
                        <ChevronRight
                          size={16}
                          className="text-muted-foreground/50 opacity-100 group-hover:opacity-30 transition-opacity hidden sm:block mr-2"
                        />
                      </div>
                    </Button>
                  </motion.div>

                  {/* Phase Indicators (Dots) */}
                  <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
                    {phases.map((p, i) => (
                      <Button
                        variant="ghost"
                        key={i}
                        type="button"
                        onClick={() =>
                          setPhaseIndices((prev) => ({
                            ...prev,
                            [country.countryName]: i,
                          }))
                        }
                        className="flex items-center justify-center min-w-[44px] min-h-[44px] transition-all"
                        aria-label={`Go to phase ${i + 1}: ${p.phase}`}
                      >
                        <div
                          className={`rounded-full transition-all ${
                            i === currentIndex ? 'w-6 h-1.5' : 'w-1.5 h-1.5'
                          }`}
                          style={{
                            backgroundColor:
                              i === currentIndex
                                ? phaseColors[p.phase as Phase]?.start || 'hsl(var(--primary))'
                                : 'hsl(var(--muted-foreground) / 0.3)',
                          }}
                        />
                      </Button>
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

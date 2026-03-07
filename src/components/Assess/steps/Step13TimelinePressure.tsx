// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'

import { Info } from 'lucide-react'

import { useAssessmentStore } from '../../../store/useAssessmentStore'

import { timelineData, transformToGanttData } from '../../../data/timelineData'

import { Button } from '../../ui/button'
import clsx from 'clsx'

import { PersonaHint } from './PersonaHint'

const Step13TimelinePressure = () => {
  const { country, timelinePressure, setTimelinePressure, timelineUnknown, setTimelineUnknown } =
    useAssessmentStore()

  // Build country-specific deadline options from the timeline
  const countryDeadlines = useMemo(() => {
    if (!country) return []
    const ganttData = transformToGanttData(timelineData)
    const entry = ganttData.find((g) => g.country.countryName === country)
    if (!entry) return []
    return entry.phases.filter((p) => p.phase === 'Deadline')
  }, [country])

  const staticOptions = [
    {
      value: 'within-1y' as const,
      label: 'Regulatory Deadline Within 1 Year',
      description: 'We have a compliance mandate requiring PQC adoption within 12 months.',
    },
    {
      value: 'within-2-3y' as const,
      label: 'Regulatory Deadline Within 2-3 Years',
      description: 'Our compliance framework requires PQC adoption by 2028-2029.',
    },
    {
      value: 'internal-deadline' as const,
      label: 'Internal Deadline Set',
      description: 'Our organization has set its own PQC migration target date.',
    },
    {
      value: 'no-deadline' as const,
      label: 'No Specific Deadline',
      description: 'We have no regulatory or internal deadline for PQC migration.',
    },
  ]

  const hasCountryDeadlines = countryDeadlines.length > 0

  const unknownButton = (
    <>
      <Button
        variant="ghost"
        aria-pressed={timelineUnknown}
        onClick={() => setTimelineUnknown(!timelineUnknown)}
        className={clsx(
          'w-full h-auto p-3 justify-start gap-2 whitespace-normal border',
          timelineUnknown
            ? 'border-muted-foreground bg-muted/20 text-foreground hover:bg-muted/20'
            : 'border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground hover:bg-transparent'
        )}
      >
        <Info size={14} className="shrink-0" />
        I&apos;m not sure — help me choose
      </Button>
      {timelineUnknown && (
        <p className="text-xs text-muted-foreground italic">
          Recommended for {country || 'your region'}. You can adjust any selection.
        </p>
      )}
    </>
  )

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">Do you have a migration deadline?</h3>
      <p className="text-sm text-muted-foreground">
        Timeline pressure affects how aggressively migration must be prioritized.
      </p>

      <PersonaHint stepKey="timeline" />

      {hasCountryDeadlines ? (
        <>
          {unknownButton}
          <div className="glass-panel p-4 border-l-4 border-l-primary mb-2">
            <div className="flex items-start gap-2">
              <Info size={16} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Deadlines below are sourced from {country}&apos;s official PQC regulatory timeline.
              </p>
            </div>
          </div>

          <div
            className="space-y-3 transition-opacity"
            role="radiogroup"
            aria-label="Migration deadline"
          >
            {countryDeadlines.map((phase) => {
              const derived = deriveTimelinePressure(phase.endYear)
              const isSelected = timelinePressure === derived
              return (
                <Button
                  key={phase.title}
                  variant="ghost"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setTimelinePressure(derived)}
                  className={clsx(
                    'w-full h-auto p-4 flex-col items-start whitespace-normal border',
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary hover:bg-primary/10'
                      : 'border-border text-muted-foreground hover:border-primary/30 hover:bg-transparent'
                  )}
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="font-bold text-sm">{phase.title}</span>
                    <span className="text-xs font-mono bg-muted/40 px-2 py-0.5 rounded shrink-0">
                      {phase.startYear === phase.endYear
                        ? phase.endYear
                        : `${phase.startYear}–${phase.endYear}`}
                    </span>
                  </div>
                  {phase.description && (
                    <p className="text-xs mt-1 opacity-80 line-clamp-2">{phase.description}</p>
                  )}
                </Button>
              )
            })}

            {/* Always show fallback options */}
            <div className="border-t border-border pt-3 mt-2 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Other options</p>
              {staticOptions
                .filter((o) => o.value === 'no-deadline')
                .map((opt) => (
                  <Button
                    key={opt.value}
                    variant="ghost"
                    role="radio"
                    aria-checked={timelinePressure === opt.value}
                    onClick={() => setTimelinePressure(opt.value)}
                    className={clsx(
                      'w-full h-auto p-4 flex-col items-start whitespace-normal border',
                      timelinePressure === opt.value
                        ? 'border-primary bg-primary/10 text-primary hover:bg-primary/10'
                        : 'border-border text-muted-foreground hover:border-primary/30 hover:bg-transparent'
                    )}
                  >
                    <span className="font-bold text-sm">{opt.label}</span>
                    <p className="text-xs mt-1 opacity-80">{opt.description}</p>
                  </Button>
                ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {unknownButton}
          <div
            className="space-y-3 transition-opacity"
            role="radiogroup"
            aria-label="Migration timeline pressure"
          >
            {staticOptions.map((opt) => (
              <Button
                key={opt.value}
                variant="ghost"
                role="radio"
                aria-checked={timelinePressure === opt.value}
                onClick={() => setTimelinePressure(opt.value)}
                className={clsx(
                  'w-full h-auto p-4 flex-col items-start whitespace-normal border',
                  timelinePressure === opt.value
                    ? 'border-primary bg-primary/10 text-primary hover:bg-primary/10'
                    : 'border-border text-muted-foreground hover:border-primary/30 hover:bg-transparent'
                )}
              >
                <span className="font-bold text-sm">{opt.label}</span>
                <p className="text-xs mt-1 opacity-80">{opt.description}</p>
              </Button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export { Step13TimelinePressure }

const CURRENT_YEAR = new Date().getFullYear()

function deriveTimelinePressure(
  endYear?: number
): 'within-1y' | 'within-2-3y' | 'internal-deadline' {
  if (!endYear) return 'internal-deadline'
  if (endYear <= CURRENT_YEAR + 1) return 'within-1y'
  if (endYear <= CURRENT_YEAR + 3) return 'within-2-3y'
  return 'internal-deadline'
}

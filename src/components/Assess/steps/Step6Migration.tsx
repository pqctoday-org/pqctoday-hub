import { Info } from 'lucide-react'

import { useAssessmentStore } from '../../../store/useAssessmentStore'

import { InlineTooltip } from '../../ui/InlineTooltip'

import clsx from 'clsx'

import { PersonaHint } from './PersonaHint'

const Step6Migration = () => {
  const { migrationStatus, setMigrationStatus } = useAssessmentStore()

  const statuses = [
    {
      value: 'started' as const,
      label: 'Already Started',
      description: 'We have begun implementing PQC algorithms in production or testing.',
    },
    {
      value: 'planning' as const,
      label: 'Planning to Start',
      description: "We have a roadmap or budget allocated but haven't started implementation.",
    },
    {
      value: 'not-started' as const,
      label: 'Not Started',
      description: 'We have not begun any PQC migration activities.',
    },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">
        What is your <InlineTooltip term="PQC">PQC</InlineTooltip> migration status?
      </h3>
      <p className="text-sm text-muted-foreground">
        Understanding where you are in the migration journey helps prioritize recommendations.
      </p>

      <PersonaHint stepKey="migration" />

      {/* I don't know escape hatch */}
      <button
        aria-pressed={migrationStatus === 'unknown'}
        onClick={() => setMigrationStatus('unknown')}
        className={clsx(
          'w-full p-3 rounded-lg border text-left text-sm font-medium transition-colors flex items-center gap-2',
          migrationStatus === 'unknown'
            ? 'border-muted-foreground bg-muted/20 text-foreground'
            : 'border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground'
        )}
      >
        <Info size={14} className="shrink-0" />I don&apos;t know / Not sure about our migration
        status
      </button>
      <div
        className={clsx(
          'space-y-3 transition-opacity',
          migrationStatus === 'unknown' && 'opacity-40 pointer-events-none'
        )}
        role="radiogroup"
        aria-label="Migration status"
        aria-disabled={migrationStatus === 'unknown'}
      >
        {statuses.map((s) => (
          <button
            key={s.value}
            role="radio"
            aria-checked={migrationStatus === s.value}
            onClick={() => setMigrationStatus(s.value)}
            className={clsx(
              'w-full p-4 rounded-lg border text-left transition-colors',
              migrationStatus === s.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/30'
            )}
          >
            <span className="font-bold text-sm">{s.label}</span>
            <p className="text-xs mt-1 opacity-80">{s.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

export { Step6Migration }

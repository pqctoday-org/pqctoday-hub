import { Info } from 'lucide-react'

import { useAssessmentStore } from '../../../store/useAssessmentStore'

import { AVAILABLE_INFRASTRUCTURE } from '../../../hooks/assessmentData'

import { InlineTooltip } from '../../ui/InlineTooltip'

import clsx from 'clsx'

import { PersonaHint } from './PersonaHint'

const Step11Infrastructure = () => {
  const { infrastructure, toggleInfrastructure, infrastructureUnknown, setInfrastructureUnknown } =
    useAssessmentStore()

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">
        What infrastructure affects your cryptography?
      </h3>
      <p className="text-sm text-muted-foreground">
        Infrastructure dependencies can significantly impact migration complexity and timelines.
      </p>

      <PersonaHint stepKey="infra" />

      <div className="glass-panel p-4 border-l-4 border-l-warning mb-4">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <InlineTooltip term="HSM">HSMs</InlineTooltip> and legacy systems are typically the
            hardest to migrate to <InlineTooltip term="PQC">PQC</InlineTooltip> algorithms.
          </p>
        </div>
      </div>

      {/* None of these / I don't know — Step 3 model */}
      <button
        aria-pressed={infrastructureUnknown}
        onClick={() => setInfrastructureUnknown(!infrastructureUnknown)}
        className={clsx(
          'w-full p-3 rounded-lg border text-left text-sm font-medium transition-colors flex items-center gap-2',
          infrastructureUnknown
            ? 'border-muted-foreground bg-muted/20 text-foreground'
            : 'border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground'
        )}
      >
        <Info size={14} className="shrink-0" />
        None of these / I don&apos;t know
      </button>

      <div
        className={clsx(
          'grid grid-cols-1 md:grid-cols-2 gap-2 transition-opacity',
          infrastructureUnknown && 'opacity-40 pointer-events-none'
        )}
        role="group"
        aria-label="Infrastructure selection"
        aria-disabled={infrastructureUnknown}
      >
        {AVAILABLE_INFRASTRUCTURE.map((item) => (
          <button
            key={item}
            aria-pressed={infrastructure.includes(item)}
            onClick={() => toggleInfrastructure(item)}
            className={clsx(
              'p-3 rounded-lg border text-left text-sm font-medium transition-colors',
              infrastructure.includes(item)
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
            )}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}

export { Step11Infrastructure }

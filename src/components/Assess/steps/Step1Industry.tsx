import { useAssessmentStore } from '../../../store/useAssessmentStore'

import { AVAILABLE_INDUSTRIES } from '../../../hooks/assessmentData'

import clsx from 'clsx'

const Step1Industry = () => {
  const { industry, setIndustry } = useAssessmentStore()

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">What industry are you in?</h3>
      <p className="text-sm text-muted-foreground">
        Quantum risk varies significantly by sector. Select the industry that best describes your
        organization.
      </p>
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-2"
        role="radiogroup"
        aria-label="Industry selection"
      >
        {AVAILABLE_INDUSTRIES.map((ind) => (
          <button
            key={ind}
            role="radio"
            aria-checked={industry === ind}
            onClick={() => setIndustry(ind)}
            className={clsx(
              'p-3 rounded-lg border text-left text-sm font-medium transition-colors',
              industry === ind
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
            )}
          >
            {ind}
          </button>
        ))}
      </div>
    </div>
  )
}

export { Step1Industry }

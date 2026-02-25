import { useAssessmentStore } from '../../../store/useAssessmentStore'

import { Button } from '../../ui/button'

import clsx from 'clsx'

import { PersonaHint } from './PersonaHint'

const Step9OrgScale = () => {
  const { systemCount, setSystemCount, teamSize, setTeamSize } = useAssessmentStore()

  const systemOptions = [
    { value: '1-10' as const, label: '1-10 systems' },
    { value: '11-50' as const, label: '11-50 systems' },
    { value: '51-200' as const, label: '51-200 systems' },
    { value: '200-plus' as const, label: '200+ systems' },
  ]

  const teamOptions = [
    { value: '1-10' as const, label: '1-10 engineers' },
    { value: '11-50' as const, label: '11-50 engineers' },
    { value: '51-200' as const, label: '51-200 engineers' },
    { value: '200-plus' as const, label: '200+ engineers' },
  ]

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-foreground">What is your organizational scale?</h3>
      <p className="text-sm text-muted-foreground">
        Migration scope and team capacity directly affect timelines and effort.
      </p>

      <PersonaHint stepKey="scale" />

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Systems using cryptography</h4>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Number of systems">
          {systemOptions.map((opt) => (
            <Button
              key={opt.value}
              variant="ghost"
              role="radio"
              aria-checked={systemCount === opt.value}
              onClick={() => setSystemCount(opt.value)}
              className={clsx(
                'h-auto p-3 border',
                systemCount === opt.value
                  ? 'border-primary bg-primary/10 text-primary hover:bg-primary/10'
                  : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground hover:bg-transparent'
              )}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Engineering team size</h4>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Team size">
          {teamOptions.map((opt) => (
            <Button
              key={opt.value}
              variant="ghost"
              role="radio"
              aria-checked={teamSize === opt.value}
              onClick={() => setTeamSize(opt.value)}
              className={clsx(
                'h-auto p-3 border',
                teamSize === opt.value
                  ? 'border-primary bg-primary/10 text-primary hover:bg-primary/10'
                  : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground hover:bg-transparent'
              )}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

export { Step9OrgScale }

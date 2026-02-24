import { Info } from 'lucide-react'

import { useAssessmentStore } from '../../../store/useAssessmentStore'

import { InlineTooltip } from '../../ui/InlineTooltip'

import clsx from 'clsx'

import { PersonaHint } from './PersonaHint'

import { usePersonaStore } from '../../../store/usePersonaStore'
import { PERSONA_STEP_HINTS } from '../../../data/personaWizardHints'

const Step10CryptoAgility = () => {
  const { cryptoAgility, setCryptoAgility } = useAssessmentStore()
  const persona = usePersonaStore((s) => s.selectedPersona)
  const recommendedOptions = persona
    ? PERSONA_STEP_HINTS[persona]?.agility?.recommendedOptions // eslint-disable-line security/detect-object-injection
    : undefined

  const options = [
    {
      value: 'fully-abstracted' as const,
      label: 'Fully Abstracted',
      description: 'Crypto library wrappers or config-driven — easy to swap algorithms.',
    },
    {
      value: 'partially-abstracted' as const,
      label: 'Partially Abstracted',
      description: 'Some systems use wrappers, others have algorithms hardcoded.',
    },
    {
      value: 'hardcoded' as const,
      label: 'Hardcoded Throughout',
      description: 'Algorithms are embedded directly in application code.',
    },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">
        How easily can you swap cryptographic algorithms?
      </h3>
      <p className="text-sm text-muted-foreground">
        <InlineTooltip term="Crypto Agility">Crypto agility</InlineTooltip> is a major factor in
        migration complexity. Abstracted implementations are far easier to migrate.
      </p>

      <PersonaHint stepKey="agility" />

      {/* I don't know escape hatch */}
      <button
        aria-pressed={cryptoAgility === 'unknown'}
        onClick={() => setCryptoAgility('unknown')}
        className={clsx(
          'w-full p-3 rounded-lg border text-left text-sm font-medium transition-colors flex items-center gap-2',
          cryptoAgility === 'unknown'
            ? 'border-muted-foreground bg-muted/20 text-foreground'
            : 'border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground'
        )}
      >
        <Info size={14} className="shrink-0" />I don&apos;t know / We haven&apos;t assessed our
        cryptographic agility
      </button>
      <div
        className={clsx(
          'space-y-3 transition-opacity',
          cryptoAgility === 'unknown' && 'opacity-40 pointer-events-none'
        )}
        role="radiogroup"
        aria-label="Crypto agility level"
        aria-disabled={cryptoAgility === 'unknown'}
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            role="radio"
            aria-checked={cryptoAgility === opt.value}
            onClick={() => setCryptoAgility(opt.value)}
            className={clsx(
              'w-full p-4 rounded-lg border text-left transition-colors',
              cryptoAgility === opt.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/30'
            )}
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">{opt.label}</span>
              {recommendedOptions?.includes(opt.value) && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                  Recommended
                </span>
              )}
            </div>
            <p className="text-xs mt-1 opacity-80">{opt.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

export { Step10CryptoAgility }

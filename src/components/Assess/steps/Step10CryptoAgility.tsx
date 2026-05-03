// SPDX-License-Identifier: GPL-3.0-only
import { Info } from 'lucide-react'

import { useAssessmentStore } from '../../../store/useAssessmentStore'

import { InlineTooltip } from '../../ui/InlineTooltip'

import { Button } from '../../ui/button'
import clsx from 'clsx'

import { PersonaHint } from './PersonaHint'

import { usePersonaStore } from '../../../store/usePersonaStore'
import {
  PERSONA_STEP_HINTS,
  getPersonaStepContent,
  getPersonaOptionDescriptions,
} from '../../../data/personaWizardHints'

const Step10CryptoAgility = () => {
  const { cryptoAgility, setCryptoAgility, agilityUnknown, setAgilityUnknown, industry } =
    useAssessmentStore()
  const persona = usePersonaStore((s) => s.selectedPersona)
  const experienceLevel = usePersonaStore((s) => s.experienceLevel)
  const recommendedOptions = persona
    ? PERSONA_STEP_HINTS[persona]?.agility?.recommendedOptions // eslint-disable-line security/detect-object-injection
    : undefined
  const stepContent = getPersonaStepContent(persona, 'agility', experienceLevel, industry)
  const optionDescs = getPersonaOptionDescriptions(persona, 'agility', industry)

  const options = [
    {
      value: 'fully-abstracted' as const,
      label: 'Fully Abstracted',
      description:
        optionDescs['fully-abstracted'] ??
        'Crypto library wrappers or config-driven — easy to swap algorithms.',
    },
    {
      value: 'partially-abstracted' as const,
      label: 'Partially Abstracted',
      description:
        optionDescs['partially-abstracted'] ??
        'Some systems use wrappers, others have algorithms hardcoded.',
    },
    {
      value: 'hardcoded' as const,
      label: 'Hardcoded Throughout',
      description:
        optionDescs['hardcoded'] ?? 'Algorithms are embedded directly in application code.',
    },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">
        {stepContent.title ?? 'How easily can you swap cryptographic algorithms?'}
      </h3>
      <p className="text-sm text-muted-foreground">
        {stepContent.description ?? (
          <>
            <InlineTooltip term="Crypto Agility">Crypto agility</InlineTooltip> is a major factor in
            migration complexity. Abstracted implementations are far easier to migrate.
          </>
        )}
      </p>

      <PersonaHint stepKey="agility" />

      {/* Smart defaults escape hatch */}
      <Button
        variant="ghost"
        aria-pressed={agilityUnknown}
        onClick={() => setAgilityUnknown(!agilityUnknown)}
        className={clsx(
          'w-full h-auto p-3 justify-start gap-2 whitespace-normal border',
          agilityUnknown
            ? 'border-muted-foreground bg-muted/20 text-foreground hover:bg-muted/20'
            : 'border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground hover:bg-transparent'
        )}
        data-workshop-target="assess-not-sure"
      >
        <Info size={14} className="shrink-0" />
        I&apos;m not sure — help me choose
      </Button>
      {agilityUnknown && (
        <p className="text-xs text-muted-foreground italic">
          Recommended for {industry || 'your industry'}. You can adjust any selection.
        </p>
      )}
      <div
        className="space-y-3 transition-opacity"
        role="radiogroup"
        aria-label="Crypto agility level"
      >
        {options.map((opt) => (
          <Button
            key={opt.value}
            variant="ghost"
            role="radio"
            aria-checked={cryptoAgility === opt.value}
            onClick={() => setCryptoAgility(opt.value)}
            className={clsx(
              'w-full h-auto p-4 flex-col items-start whitespace-normal border',
              cryptoAgility === opt.value
                ? 'border-primary bg-primary/10 text-primary hover:bg-primary/10'
                : 'border-border text-muted-foreground hover:border-primary/30 hover:bg-transparent'
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
          </Button>
        ))}
      </div>
    </div>
  )
}

export { Step10CryptoAgility }

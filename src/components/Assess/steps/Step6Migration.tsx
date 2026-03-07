// SPDX-License-Identifier: GPL-3.0-only
import { Info } from 'lucide-react'

import { useAssessmentStore } from '../../../store/useAssessmentStore'
import { usePersonaStore } from '../../../store/usePersonaStore'

import { InlineTooltip } from '../../ui/InlineTooltip'

import { Button } from '../../ui/button'

import clsx from 'clsx'

import { PersonaHint } from './PersonaHint'
import {
  getPersonaStepContent,
  getPersonaOptionDescriptions,
} from '../../../data/personaWizardHints'

const Step6Migration = () => {
  const { migrationStatus, setMigrationStatus, migrationUnknown, setMigrationUnknown, industry } =
    useAssessmentStore()
  const persona = usePersonaStore((s) => s.selectedPersona)
  const experienceLevel = usePersonaStore((s) => s.experienceLevel)
  const stepContent = getPersonaStepContent(persona, 'migration', experienceLevel)
  const optionDescs = getPersonaOptionDescriptions(persona, 'migration')

  const statuses = [
    {
      value: 'started' as const,
      label: 'Already Started',
      description:
        optionDescs['started'] ??
        'We have begun implementing PQC algorithms in production or testing.',
    },
    {
      value: 'planning' as const,
      label: 'Planning to Start',
      description:
        optionDescs['planning'] ??
        "We have a roadmap or budget allocated but haven't started implementation.",
    },
    {
      value: 'not-started' as const,
      label: 'Not Started',
      description: optionDescs['not-started'] ?? 'We have not begun any PQC migration activities.',
    },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">
        {stepContent.title ?? (
          <>
            What is your <InlineTooltip term="PQC">PQC</InlineTooltip> migration status?
          </>
        )}
      </h3>
      <p className="text-sm text-muted-foreground">
        {stepContent.description ??
          'Understanding where you are in the migration journey helps prioritize recommendations.'}
      </p>

      <PersonaHint stepKey="migration" />

      {/* Smart defaults escape hatch */}
      <Button
        variant="ghost"
        aria-pressed={migrationUnknown}
        onClick={() => setMigrationUnknown(!migrationUnknown)}
        className={clsx(
          'w-full h-auto p-3 justify-start gap-2 whitespace-normal border',
          migrationUnknown
            ? 'border-muted-foreground bg-muted/20 text-foreground hover:bg-muted/20'
            : 'border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground hover:bg-transparent'
        )}
      >
        <Info size={14} className="shrink-0" />
        I&apos;m not sure — help me choose
      </Button>
      {migrationUnknown && (
        <p className="text-xs text-muted-foreground italic">
          Recommended for {industry || 'your industry'}. You can adjust any selection.
        </p>
      )}
      <div className="space-y-3 transition-opacity" role="radiogroup" aria-label="Migration status">
        {statuses.map((s) => (
          <Button
            key={s.value}
            variant="ghost"
            role="radio"
            aria-checked={migrationStatus === s.value}
            onClick={() => setMigrationStatus(s.value)}
            className={clsx(
              'w-full h-auto p-4 flex-col items-start whitespace-normal border',
              migrationStatus === s.value
                ? 'border-primary bg-primary/10 text-primary hover:bg-primary/10'
                : 'border-border text-muted-foreground hover:border-primary/30 hover:bg-transparent'
            )}
          >
            <span className="font-bold text-sm">{s.label}</span>
            <p className="text-xs mt-1 opacity-80">{s.description}</p>
          </Button>
        ))}
      </div>
    </div>
  )
}

export { Step6Migration }

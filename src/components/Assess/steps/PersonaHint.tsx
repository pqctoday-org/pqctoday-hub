// SPDX-License-Identifier: GPL-3.0-only
import { usePersonaStore } from '../../../store/usePersonaStore'
import { PERSONA_STEP_HINTS, resolveHintKey } from '../../../data/personaWizardHints'
import { Info } from 'lucide-react'

export const PersonaHint = ({ stepKey }: { stepKey: string }) => {
  const persona = usePersonaStore((s) => s.selectedPersona)
  const experienceLevel = usePersonaStore((s) => s.experienceLevel)
  if (!persona) return null
  const hintKey = resolveHintKey(stepKey)
  const hint = PERSONA_STEP_HINTS[persona]?.[hintKey] // eslint-disable-line security/detect-object-injection
  if (!hint) return null

  // Pick proficiency-appropriate hint text
  const hintText =
    experienceLevel === 'curious'
      ? (hint.hintBeginner ?? hint.hint)
      : experienceLevel === 'expert'
        ? (hint.hintExpert ?? hint.hint)
        : hint.hint

  return (
    <div className="glass-panel p-3 border-l-4 border-l-primary/50 mt-3">
      <div className="flex items-start gap-2">
        <Info size={14} className="text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-medium text-primary">For you: </span>
          {hintText}
        </p>
      </div>
    </div>
  )
}

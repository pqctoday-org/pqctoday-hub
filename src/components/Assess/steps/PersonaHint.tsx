import { usePersonaStore } from '../../../store/usePersonaStore'
import { PERSONA_STEP_HINTS } from '../../../data/personaWizardHints'
import { Info } from 'lucide-react'

export const PersonaHint = ({ stepKey }: { stepKey: string }) => {
  const persona = usePersonaStore((s) => s.selectedPersona)
  if (!persona) return null
  const hint = PERSONA_STEP_HINTS[persona]?.[stepKey] // eslint-disable-line security/detect-object-injection
  if (!hint) return null

  return (
    <div className="glass-panel p-3 border-l-4 border-l-primary/50 mt-3">
      <div className="flex items-start gap-2">
        <Info size={14} className="text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-medium text-primary">For you: </span>
          {hint.hint}
        </p>
      </div>
    </div>
  )
}

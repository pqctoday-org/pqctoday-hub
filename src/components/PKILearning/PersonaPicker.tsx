/* eslint-disable security/detect-object-injection */
import { motion } from 'framer-motion'
import { Briefcase, Code, ShieldCheck, GraduationCap, Sparkles } from 'lucide-react'
import { usePersonaStore } from '../../store/usePersonaStore'
import { useAssessmentStore } from '../../store/useAssessmentStore'
import {
  PERSONAS,
  inferPersonaFromAssessment,
  type PersonaId,
  type LearningPersona,
} from '../../data/learningPersonas'
import { logEvent } from '../../utils/analytics'

const ICON_MAP = {
  Briefcase,
  Code,
  ShieldCheck,
  GraduationCap,
} as const

const PERSONA_ORDER: PersonaId[] = ['executive', 'developer', 'architect', 'researcher']

export const PersonaPicker = () => {
  const { setPersona, markPickerSeen } = usePersonaStore()
  const assessment = useAssessmentStore()

  const suggestedPersona = inferPersonaFromAssessment({
    isComplete: assessment.isComplete,
    teamSize: assessment.teamSize,
    migrationStatus: assessment.migrationStatus,
    cryptoAgility: assessment.cryptoAgility,
  })

  const handleSelect = (personaId: PersonaId) => {
    setPersona(personaId)
    logEvent('Learning', 'Persona Selected', personaId)
  }

  const handleDismiss = () => {
    markPickerSeen()
    logEvent('Learning', 'Persona Dismissed', 'show-all')
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-panel p-6 md:p-8"
      aria-labelledby="persona-picker-heading"
    >
      <div className="mb-6">
        <h2 id="persona-picker-heading" className="text-2xl font-bold mb-2 text-gradient">
          Choose Your Learning Path
        </h2>
        <p className="text-muted-foreground">
          Select your role to get a curated set of modules in the right order for you.
        </p>
        {suggestedPersona && (
          <p className="mt-2 text-sm text-primary flex items-center gap-1.5">
            <Sparkles size={14} />
            Based on your assessment, we recommend:{' '}
            <strong>{PERSONAS[suggestedPersona].label}</strong>
          </p>
        )}
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        role="radiogroup"
        aria-label="Learning persona"
      >
        {PERSONA_ORDER.map((personaId, index) => {
          const persona: LearningPersona = PERSONAS[personaId]
          const Icon = ICON_MAP[persona.icon]
          const isSuggested = personaId === suggestedPersona

          return (
            <motion.button
              key={personaId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              role="radio"
              aria-checked={false}
              className={`glass-panel p-5 text-left transition-all hover:border-primary/50 cursor-pointer ${
                isSuggested ? 'border-primary/30 ring-1 ring-primary/20' : ''
              }`}
              onClick={() => handleSelect(personaId)}
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-full bg-primary/10 text-primary shrink-0">
                  <Icon size={22} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-foreground">{persona.label}</h3>
                    {isSuggested && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{persona.subtitle}</p>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {persona.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {persona.recommendedPath.length} modules &middot; ~
                    {Math.round(persona.estimatedMinutes / 60)}h
                  </p>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>

      <div className="mt-5 text-center">
        <button
          onClick={handleDismiss}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
        >
          Show all modules instead
        </button>
      </div>
    </motion.section>
  )
}

// SPDX-License-Identifier: GPL-3.0-only
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Users,
  Briefcase,
  Code,
  ShieldCheck,
  GraduationCap,
  Server,
  Sparkles,
  CheckCircle,
  Building2,
  Globe,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '../../ui/button'
import { usePersonaStore } from '../../../store/usePersonaStore'
import {
  PERSONA_STEP_HINTS,
  STEP_CONTEXT_INFO,
  resolveHintKey,
  type PersonaStepHint,
} from '../../../data/personaWizardHints'
import type { PersonaId } from '../../../data/learningPersonas'

interface StepPersonaInfoModalProps {
  stepKey: string | null
  open: boolean
  onClose: () => void
}

const PERSONA_META: { id: PersonaId; label: string; icon: LucideIcon }[] = [
  { id: 'executive', label: 'Executive / GRC', icon: Briefcase },
  { id: 'developer', label: 'Developer', icon: Code },
  { id: 'architect', label: 'Security Architect', icon: ShieldCheck },
  { id: 'researcher', label: 'Researcher', icon: GraduationCap },
  { id: 'ops', label: 'IT Ops / DevOps', icon: Server },
]

function HintDetail({ hint, label }: { hint: PersonaStepHint; label: string }) {
  return (
    <div className="space-y-1.5">
      {hint.title && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Title override:</span> &ldquo;{hint.title}
          &rdquo;
        </p>
      )}
      {hint.description && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Description:</span> &ldquo;
          {hint.description}&rdquo;
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Hint ({label}):</span> {hint.hint}
      </p>
      {hint.hintBeginner && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Beginner hint:</span> {hint.hintBeginner}
        </p>
      )}
      {hint.hintExpert && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Expert hint:</span> {hint.hintExpert}
        </p>
      )}
      {hint.suggestUnknown && (
        <p className="text-xs text-status-info">
          <CheckCircle size={10} className="inline mr-1" />
          Auto-suggests &ldquo;I don&apos;t know&rdquo; for this persona
        </p>
      )}
      {hint.recommendedOptions && hint.recommendedOptions.length > 0 && (
        <p className="text-xs text-muted-foreground">
          <Sparkles size={10} className="inline mr-1 text-primary" />
          <span className="font-medium text-foreground">Recommended:</span>{' '}
          {hint.recommendedOptions.join(', ')}
        </p>
      )}
      {hint.optionDescriptions && Object.keys(hint.optionDescriptions).length > 0 && (
        <div className="text-xs text-muted-foreground mt-1">
          <span className="font-medium text-foreground">Option text overrides:</span>
          <ul className="ml-4 mt-1 list-disc space-y-0.5">
            {Object.entries(hint.optionDescriptions).map(([key, desc]) => (
              <li key={key}>
                <span className="font-medium text-foreground">{key}:</span> {desc}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function StepPersonaInfoModal({ stepKey, open, onClose }: StepPersonaInfoModalProps) {
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  if (!stepKey) return null

  // Resolve wizard step key to hint key (e.g., 'credential-lifetime' → 'credential')
  const hintKey = resolveHintKey(stepKey)

  // Collect hints for all personas for this step
  const personaHints = PERSONA_META.map((p) => ({
    ...p,
    // eslint-disable-next-line security/detect-object-injection
    hint: PERSONA_STEP_HINTS[p.id]?.[hintKey] as PersonaStepHint | undefined,
  }))

  const hasAnyHints = personaHints.some((p) => p.hint)

  // Context info (industry/country/proficiency effects)
  // eslint-disable-next-line security/detect-object-injection
  const contextInfo = STEP_CONTEXT_INFO[hintKey]
  const hasContextInfo =
    contextInfo &&
    (contextInfo.industryEffect || contextInfo.countryEffect || contextInfo.proficiencyEffect)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 embed-backdrop bg-black/60 backdrop-blur-sm z-50"
          />

          <div className="fixed inset-0 embed-backdrop z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel p-6 max-w-lg w-full max-h-[85dvh] overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-labelledby="persona-info-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-primary" />
                  <h2 id="persona-info-modal-title" className="text-lg font-bold text-foreground">
                    How This Step Is Personalized
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="p-2 h-auto w-auto rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                  aria-label="Close"
                >
                  <X size={18} />
                </Button>
              </div>

              {/* Explanation */}
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Your experience is shaped by your persona (role), selected industry and country, and
                proficiency level. The underlying questions and scoring remain the same &mdash; only
                the presentation and defaults change.
              </p>

              {/* Persona hints section */}
              {!hasAnyHints ? (
                <div className="rounded-lg border border-border bg-muted/10 px-4 py-3">
                  <p className="text-xs text-muted-foreground text-center">
                    This step has no persona-specific customizations. All personas see the same
                    question and options.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {personaHints.map((p) => {
                    const PersonaIcon = p.icon
                    const isActive = selectedPersona === p.id

                    return (
                      <div
                        key={p.id}
                        className={
                          isActive
                            ? 'glass-panel p-3 border-l-4 border-l-primary'
                            : 'rounded-lg border border-border p-3'
                        }
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <PersonaIcon
                            size={14}
                            className={isActive ? 'text-primary' : 'text-muted-foreground'}
                          />
                          <span
                            className={
                              isActive
                                ? 'text-sm font-semibold text-primary'
                                : 'text-sm font-medium text-foreground'
                            }
                          >
                            {p.label}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                              Active
                            </span>
                          )}
                        </div>
                        {p.hint ? (
                          <HintDetail hint={p.hint} label={p.label} />
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            No customizations for this step.
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Context effects section — industry, country, proficiency */}
              {hasContextInfo && (
                <div className="mt-5 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">
                      How Your Preferences Affect This Step
                    </h3>
                  </div>
                  <div className="space-y-2.5">
                    {contextInfo.industryEffect && (
                      <div className="flex items-start gap-2">
                        <Building2 size={12} className="text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Industry: </span>
                          {contextInfo.industryEffect}
                        </p>
                      </div>
                    )}
                    {contextInfo.countryEffect && (
                      <div className="flex items-start gap-2">
                        <Globe size={12} className="text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Country: </span>
                          {contextInfo.countryEffect}
                        </p>
                      </div>
                    )}
                    {contextInfo.proficiencyEffect && (
                      <div className="flex items-start gap-2">
                        <GraduationCap
                          size={12}
                          className="text-muted-foreground shrink-0 mt-0.5"
                        />
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Proficiency: </span>
                          {contextInfo.proficiencyEffect}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Footer */}
              {!selectedPersona && (
                <div className="rounded-lg border border-border bg-muted/10 px-4 py-3 mt-4">
                  <p className="text-xs text-muted-foreground text-center leading-relaxed">
                    No persona selected. Choose a persona from the Landing page to tailor questions
                    to your role.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

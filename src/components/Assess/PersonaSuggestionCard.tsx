// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useState } from 'react'
import { Sparkles, ArrowRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { inferPersonaFromAssessment, PERSONAS } from '@/data/learningPersonas'
import { logEvent, personaLabel, logPersonaSelected } from '@/utils/analytics'

const STORAGE_KEY = 'persona-suggestion-suppressed-until'
const SUPPRESS_DAYS = 30

function readSuppressionExpiry(): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? parseInt(raw, 10) || 0 : 0
  } catch {
    return 0
  }
}

function writeSuppressionExpiry(epochMs: number) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, String(epochMs))
  } catch {
    /* localStorage unavailable */
  }
}

/**
 * End-of-wizard persona suggestion (P13-P1-04).
 *
 * Compares the user's current `selectedPersona` to the persona inferred from
 * their assessment answers (`inferPersonaFromAssessment`). If they differ and
 * the suggestion isn't suppressed, renders a non-blocking banner with
 * "Switch to {suggested}" + "Stay with {current}" buttons. The Stay choice
 * writes a 30-day suppression key to localStorage so the prompt doesn't
 * re-appear on every report visit.
 */
export const PersonaSuggestionCard: React.FC = () => {
  const assessmentStatus = useAssessmentStore((s) => s.assessmentStatus)
  const teamSize = useAssessmentStore((s) => s.teamSize)
  const migrationStatus = useAssessmentStore((s) => s.migrationStatus)
  const cryptoAgility = useAssessmentStore((s) => s.cryptoAgility)
  const currentCrypto = useAssessmentStore((s) => s.currentCrypto)
  const complianceRequirements = useAssessmentStore((s) => s.complianceRequirements)
  const cryptoUseCases = useAssessmentStore((s) => s.cryptoUseCases)
  const infrastructure = useAssessmentStore((s) => s.infrastructure)
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const setPersona = usePersonaStore((s) => s.setPersona)
  const [dismissed, setDismissed] = useState<boolean>(() => readSuppressionExpiry() > Date.now())

  const inferred = useMemo(
    () =>
      inferPersonaFromAssessment({
        assessmentStatus,
        teamSize: teamSize ?? '',
        migrationStatus: migrationStatus ?? '',
        cryptoAgility: cryptoAgility ?? '',
        currentCrypto,
        complianceRequirements,
        cryptoUseCases,
        infrastructure,
      }),
    [
      assessmentStatus,
      teamSize,
      migrationStatus,
      cryptoAgility,
      currentCrypto,
      complianceRequirements,
      cryptoUseCases,
      infrastructure,
    ]
  )

  if (assessmentStatus !== 'complete') return null
  if (!inferred) return null
  if (inferred === selectedPersona) return null
  if (dismissed) return null

  // eslint-disable-next-line security/detect-object-injection
  const inferredLabel = PERSONAS[inferred].label
  // eslint-disable-next-line security/detect-object-injection
  const currentLabel = selectedPersona ? PERSONAS[selectedPersona].label : null

  const handleSwitch = () => {
    setPersona(inferred)
    logPersonaSelected(inferred, 'assessment')
    logEvent('Persona Suggestion', 'Switched', personaLabel(inferred))
    setDismissed(true)
  }

  const handleStay = () => {
    writeSuppressionExpiry(Date.now() + SUPPRESS_DAYS * 24 * 60 * 60 * 1000)
    logEvent('Persona Suggestion', 'Stayed', personaLabel(selectedPersona ?? 'none'))
    setDismissed(true)
  }

  const handleClose = () => {
    writeSuppressionExpiry(Date.now() + SUPPRESS_DAYS * 24 * 60 * 60 * 1000)
    logEvent('Persona Suggestion', 'Dismissed', personaLabel(selectedPersona ?? 'none'))
    setDismissed(true)
  }

  return (
    <div className="glass-panel border border-primary/30 bg-primary/5 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3 flex-wrap">
        <Sparkles size={16} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground font-medium">
            Based on your answers, the <span className="text-primary">{inferredLabel}</span>{' '}
            learning path may fit you better
            {currentLabel && (
              <>
                {' '}
                than <span className="text-muted-foreground">{currentLabel}</span>
              </>
            )}
            .
          </p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Switching adapts the report sections, nav menu, and recommended workshops — you can
            change back any time from the role chip in the page header.
          </p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Button variant="gradient" size="sm" onClick={handleSwitch} className="gap-1.5">
              Switch to {inferredLabel}
              <ArrowRight size={12} aria-hidden="true" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleStay}>
              {currentLabel ? `Stay with ${currentLabel}` : 'Stay'}
            </Button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          aria-label="Dismiss suggestion"
          className="h-6 w-6 p-0 shrink-0 -mr-1"
        >
          <X size={12} aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

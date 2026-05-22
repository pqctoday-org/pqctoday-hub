// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { HelpCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePersonaStore } from '@/store/usePersonaStore'
import { getWizardStepRationale } from '@/data/personaWizardHints'

/**
 * "Why we ask" inline rationale (P13-P1-02).
 *
 * For curious explorers (selectedPersona === 'curious' OR experienceLevel ===
 * 'curious') the rationale renders inline as plain text so it can be read
 * without an extra click. Everyone else gets a small "Why?" pill that opens
 * the same copy in a collapsed disclosure — the rationale is one click away
 * but doesn't add density to the wizard for experts.
 *
 * Returns null when the step has no registered rationale.
 */
export const WhyWeAskHint: React.FC<{ stepKey: string }> = ({ stepKey }) => {
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const experienceLevel = usePersonaStore((s) => s.experienceLevel)
  const rationale = getWizardStepRationale(stepKey)
  const [expanded, setExpanded] = useState(false)

  if (!rationale) return null

  const isCurious = selectedPersona === 'curious' || experienceLevel === 'curious'

  if (isCurious) {
    return (
      <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
        <HelpCircle size={12} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
        <p>
          <span className="font-medium text-foreground">Why we ask: </span>
          {rationale}
        </p>
      </div>
    )
  }

  return (
    <div className="mt-2">
      {!expanded ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(true)}
          className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground gap-1"
          aria-expanded={false}
        >
          <HelpCircle size={12} aria-hidden="true" />
          Why we ask
        </Button>
      ) : (
        <div className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed glass-panel p-2 rounded-md">
          <HelpCircle size={12} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
          <p className="flex-1">{rationale}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(false)}
            aria-label="Hide rationale"
            className="h-5 w-5 p-0 shrink-0 -mr-1"
          >
            <X size={10} aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  )
}

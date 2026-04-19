// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Link } from 'react-router-dom'
import { Target, ExternalLink } from 'lucide-react'
import type { PersonaId } from '@/data/learningPersonas'
import { isSupportedPitchPersona } from './pitchVariants'
import { personaLabel } from './pitchVariants/sectionDefaults'

interface PersonaPitchBannerProps {
  persona: PersonaId | null
  objective: string
}

export const PersonaPitchBanner: React.FC<PersonaPitchBannerProps> = ({ persona, objective }) => {
  const supported = isSupportedPitchPersona(persona)
  const effectiveLabel = supported ? personaLabel(persona) : 'Executive / Board (default)'

  return (
    <div
      className="glass-panel p-4 flex items-start gap-3 border-l-4 border-primary/60"
      role="status"
      aria-live="polite"
    >
      <Target size={20} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">
          {supported ? (
            <>
              This pitch has been customized for the{' '}
              <span className="text-primary">{effectiveLabel}</span> role.
            </>
          ) : (
            <>
              No role selected — showing the <span className="text-primary">{effectiveLabel}</span>{' '}
              variant.
            </>
          )}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          <span className="font-medium text-foreground">Objective:</span> {objective}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          <Link
            to="/#personalization-heading"
            className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
          >
            {supported ? 'Change role' : 'Pick your role'}
            <ExternalLink size={10} />
          </Link>{' '}
          to tailor the pitch for Executive, Developer, Architect, or Operations audiences.
        </p>
      </div>
    </div>
  )
}

// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Briefcase, Code, ShieldCheck, GraduationCap, Server, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PERSONAS } from '@/data/learningPersonas'
import type { PersonaId } from '@/data/learningPersonas'
import { usePersonaStore } from '@/store/usePersonaStore'
import { logPersonaSelected } from '@/utils/analytics'

const PERSONA_ICONS = {
  Briefcase,
  Code,
  ShieldCheck,
  GraduationCap,
  Server,
  Lightbulb,
} as const

const PERSONA_ORDER: PersonaId[] = [
  'curious',
  'executive',
  'developer',
  'architect',
  'ops',
  'researcher',
]

interface Props {
  onClose: () => void
}

export const PersonaSwitchModal: React.FC<Props> = ({ onClose }) => {
  const { selectedPersona, setPersona } = usePersonaStore()
  const containerRef = useRef<HTMLDivElement>(null)

  // Trap focus within modal
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    containerRef.current?.focus()
    return () => {
      prev?.focus()
    }
  }, [])

  // Esc to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSelect = (id: PersonaId) => {
    if (id !== selectedPersona) {
      setPersona(id)
      logPersonaSelected(id, 'switch')
    }
    onClose()
  }

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-overlay bg-black/60" onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="persona-switch-title"
        tabIndex={-1}
        className="fixed inset-0 z-overlay flex items-center justify-center p-4 pointer-events-none outline-none"
      >
        <div className="glass-panel rounded-2xl p-6 w-full max-w-lg shadow-2xl pointer-events-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 id="persona-switch-title" className="text-base font-semibold text-foreground">
                Switch your role
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Content and navigation adapt to your selection
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 shrink-0"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={16} />
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PERSONA_ORDER.map((id) => {
              const persona = PERSONAS[id]
              const Icon = PERSONA_ICONS[persona.icon]
              const isActive = selectedPersona === id

              return (
                <Button
                  key={id}
                  variant="ghost"
                  onClick={() => handleSelect(id)}
                  className={`h-auto flex flex-col items-start gap-1.5 px-3 py-3 rounded-xl border transition-colors text-left ${
                    isActive
                      ? 'border-primary/40 bg-primary/10 text-foreground'
                      : 'border-border bg-card/60 hover:border-primary/30 hover:bg-card text-muted-foreground hover:text-foreground'
                  }`}
                  aria-pressed={isActive}
                >
                  <Icon
                    size={16}
                    className={isActive ? 'text-primary' : 'text-muted-foreground'}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-foreground leading-snug">
                    {persona.label}
                  </span>
                  <span className="text-xs text-muted-foreground leading-snug line-clamp-2">
                    {persona.subtitle}
                  </span>
                </Button>
              )
            })}
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import {
  Briefcase,
  Code,
  ShieldCheck,
  GraduationCap,
  Server,
  Lightbulb,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PERSONAS } from '@/data/learningPersonas'
import type { PersonaId } from '@/data/learningPersonas'
import { usePersonaStore } from '@/store/usePersonaStore'
import { PersonaSwitchModal } from './PersonaSwitchModal'

const PERSONA_ICONS: Record<string, React.ElementType> = {
  Briefcase,
  Code,
  ShieldCheck,
  GraduationCap,
  Server,
  Lightbulb,
}

// Short display labels that fit the compact chip
const SHORT_LABELS: Record<PersonaId, string> = {
  executive: 'Executive',
  developer: 'Developer',
  architect: 'Architect',
  ops: 'IT Ops',
  researcher: 'Researcher',
  curious: 'Explorer',
}

export const PersonaChip: React.FC = () => {
  const { selectedPersona } = usePersonaStore()
  const [modalOpen, setModalOpen] = useState(false)

  if (!selectedPersona) return null

  const persona = PERSONAS[selectedPersona]
  const Icon = PERSONA_ICONS[persona.icon]

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setModalOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Current role: ${persona.label}. Click to switch role.`}
        className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 h-auto rounded-lg border-border bg-primary/5 hover:border-primary/30 hover:bg-primary/10 text-sm text-foreground transition-colors"
      >
        <Icon size={14} className="text-primary shrink-0" aria-hidden="true" />
        <span className="text-xs font-medium">{SHORT_LABELS[selectedPersona]}</span>
        <ChevronDown size={12} className="text-muted-foreground shrink-0" aria-hidden="true" />
      </Button>

      {modalOpen && <PersonaSwitchModal onClose={() => setModalOpen(false)} />}
    </>
  )
}

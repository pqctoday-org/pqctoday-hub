// SPDX-License-Identifier: GPL-3.0-only
/**
 * ReportControlDeck — the redesign's consolidated control bar: a derived track
 * label (Fast / Full report — NOT a toggle; it reflects which assessment was
 * completed) and a persona segmented control that re-leads the whole report via
 * the GLOBAL persona lens (usePersonaStore), consistent with the Library/Patents
 * redesigns. Hidden in print and on shared (read-only) reports.
 */
import { Zap, ClipboardCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePersonaStore } from '@/store/usePersonaStore'
import type { PersonaId } from '@/data/learningPersonas'

const PERSONAS: { id: PersonaId; label: string }[] = [
  { id: 'executive', label: 'Executive' },
  { id: 'architect', label: 'Architect' },
  { id: 'developer', label: 'Developer' },
  { id: 'researcher', label: 'Researcher' },
  { id: 'ops', label: 'Ops' },
  { id: 'curious', label: 'Curious' },
]

interface ReportControlDeckProps {
  /** True when the report came from a comprehensive assessment. */
  fullTrack: boolean
  /** Suppress on shared read-only reports. */
  shared?: boolean
}

export function ReportControlDeck({ fullTrack, shared = false }: ReportControlDeckProps) {
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const setPersona = usePersonaStore((s) => s.setPersona)
  if (shared) return null

  return (
    <div className="glass-panel flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl p-3 print:hidden">
      <span className="flex items-center gap-1.5">
        <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Track
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[12px] font-bold ${
            fullTrack ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
          }`}
        >
          {fullTrack ? (
            <ClipboardCheck size={12} aria-hidden="true" />
          ) : (
            <Zap size={12} aria-hidden="true" />
          )}
          {fullTrack ? 'Full report' : 'Fast report'}
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">
          {fullTrack ? '13 questions · ~5 min' : '6 questions · ~3 min'}
        </span>
      </span>

      <span aria-hidden="true" className="hidden h-5 w-px bg-border sm:block" />

      <span className="flex flex-wrap items-center gap-1.5">
        <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Viewing as
        </span>
        <span role="radiogroup" aria-label="Viewing the report as" className="flex flex-wrap gap-1">
          {PERSONAS.map(({ id, label }) => {
            const active = selectedPersona === id
            return (
              <Button
                key={id}
                type="button"
                variant="ghost"
                role="radio"
                aria-checked={active}
                onClick={() => setPersona(active ? null : id)}
                className={`h-auto min-h-[44px] md:min-h-0 rounded-lg px-2.5 py-1 text-[12.5px] font-bold transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'border border-input text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </Button>
            )
          })}
        </span>
      </span>
    </div>
  )
}

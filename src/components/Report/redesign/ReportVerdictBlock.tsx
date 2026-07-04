// SPDX-License-Identifier: GPL-3.0-only
/**
 * ReportVerdictBlock — the redesign's persona-aware "verdict": the same assessed
 * risk re-led for the active role. Sits above the existing "Do this first" hero so
 * the user gets a one-paragraph read of what their result MEANS for them before the
 * full report scroll. Persona comes from the global lens (usePersonaStore).
 */
import { Sparkles } from 'lucide-react'
import { reportVerdict } from '@/data/reportVerdicts'
import type { PersonaId } from '@/data/learningPersonas'
import type { AssessmentResult } from '@/hooks/assessmentTypes'

interface ReportVerdictBlockProps {
  persona: PersonaId | null
  result: AssessmentResult
}

export function ReportVerdictBlock({ persona, result }: ReportVerdictBlockProps) {
  const verdict = reportVerdict(persona, result)
  return (
    <div className="glass-panel rounded-2xl p-4 print:border-0 print:p-0">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Verdict
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2 py-0.5 text-[11px] font-semibold text-secondary print:hidden">
          <Sparkles size={11} aria-hidden="true" />
          {verdict.tag}
        </span>
      </div>
      <p className="text-[14px] leading-relaxed text-foreground">{verdict.narrative}</p>
    </div>
  )
}

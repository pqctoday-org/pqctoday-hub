// SPDX-License-Identifier: GPL-3.0-only
/**
 * LearningFrameBanner — Compliance copy.
 *
 * Same component shape as the Command Center version. Renders a small,
 * top-of-page banner that names what kind of page this is so visitors don't
 * mistake the catalog for a workspace.
 *
 * Density derives from the persona store (see `BusinessCenter/lib/density`).
 */
import { Library } from 'lucide-react'
import { usePersonaStore } from '@/store/usePersonaStore'
import { deriveDensity } from '@/components/BusinessCenter/lib/density'

const DENSITY_LABEL: Record<ReturnType<typeof deriveDensity>, string> = {
  basic: 'Basic',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

export function LearningFrameBanner() {
  const persona = usePersonaStore((s) => s.selectedPersona)
  const experienceLevel = usePersonaStore((s) => s.experienceLevel)
  const density = deriveDensity(persona, experienceLevel)

  return (
    <div
      data-testid="compliance-learning-frame-banner"
      className="flex items-start gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5"
    >
      <Library size={18} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary mr-2">
          Reference
        </span>
        <span className="text-sm text-foreground">
          A catalog of standards, certifications, and regulations governing PQC. Use it to find what
          applies to your context — not as a workspace.
        </span>
      </div>
      <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground whitespace-nowrap shrink-0 self-center">
        Density: <span className="text-foreground font-semibold">{DENSITY_LABEL[density]}</span>
      </span>
    </div>
  )
}

// SPDX-License-Identifier: GPL-3.0-only
/**
 * LearningFrameBanner — names what kind of artifact the page is.
 *
 * Replaces the old "Work in progress" warning banner on the Command Center.
 * The Command Center is a *worked example* of a PQC program organised around
 * NIST CSWP.39 Fig 3 — not a real GRC console. This banner sets that contract
 * up front, so first-time learners don't read the page as a workspace they're
 * already behind on.
 */
import type { LucideIcon } from 'lucide-react'
import { GraduationCap } from 'lucide-react'
import type { Density } from './lib/density'

export interface LearningFrameBannerProps {
  /** Short kind-label, e.g. "Worked example", "Reference", "Workspace". */
  kind: string
  /** One-line description of what the page is and isn't. */
  description: string
  /** Density label rendered on the right (e.g. "Density: Basic"). Optional. */
  densityLabel?: Density
  /** Override the default icon. */
  icon?: LucideIcon
}

const DENSITY_LABEL: Record<Density, string> = {
  basic: 'Basic',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

export function LearningFrameBanner({
  kind,
  description,
  densityLabel,
  icon: Icon = GraduationCap,
}: LearningFrameBannerProps) {
  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-lg border border-primary/30 bg-primary/5 mb-4"
      data-testid="learning-frame-banner"
    >
      <Icon className="w-4 h-4 shrink-0 mt-0.5 text-primary" aria-hidden="true" />
      <div className="flex-1 min-w-0 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary shrink-0">
          {kind}
        </span>
        <span className="text-xs text-foreground/85 leading-relaxed">{description}</span>
      </div>
      {densityLabel && (
        <span
          className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
          title="Density adapts to your selected persona. Change persona to see more or less detail."
        >
          Density: <span className="text-foreground font-bold">{DENSITY_LABEL[densityLabel]}</span>
        </span>
      )}
    </div>
  )
}

// SPDX-License-Identifier: GPL-3.0-only
import { Sparkles } from 'lucide-react'

/**
 * Header-level chip for report sections whose figures depend on fields the
 * quick-track assessment never collects (vendor dependency, infrastructure)
 * — those inputs fall back to neutral scoring defaults, not the user's real
 * answers (see `computeMigrationCostFromProfile` in roiMath.ts, which
 * substitutes a 1.0 multiplier for every unset field). Mirrors the
 * `FilteredChip` header-badge pattern already used on this page (threat
 * landscape section), but purely informational — no restore action.
 */
export function DefaultsUsedChip() {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/30 print:hidden"
      title="The fast assessment doesn't collect vendor dependency or infrastructure — this section uses neutral defaults for those, not your actual answers."
    >
      <Sparkles size={11} aria-hidden="true" />
      Uses fast-track defaults
    </span>
  )
}

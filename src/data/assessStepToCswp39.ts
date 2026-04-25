// SPDX-License-Identifier: GPL-3.0-only
import type { CSWP39StepId } from '@/components/shared/CSWP39StepBadge'

/**
 * Maps an /assess wizard step key to the CSWP.39 process step it primarily
 * contributes to. Used by the CSWP39StepBadge rendered next to the wizard
 * step indicator so users see how each input feeds the Command Center
 * (Govern → Inventory → Identify Gaps → Prioritise → Implement).
 *
 * Some steps span multiple CSWP.39 steps (e.g., sensitivity feeds both
 * Inventory metadata and Identify Gaps prioritisation). The mapping picks
 * the primary affiliation; the resource panels on /business surface the
 * cross-references.
 */
export const ASSESS_STEP_TO_CSWP39: Record<string, CSWP39StepId> = {
  industry: 'govern',
  country: 'govern',
  crypto: 'inventory',
  sensitivity: 'inventory',
  compliance: 'govern',
  migration: 'implement',
  'use-cases': 'inventory',
  retention: 'inventory',
  'credential-lifetime': 'inventory',
  scale: 'prioritise',
  agility: 'implement',
  infra: 'identify-gaps',
  timeline: 'prioritise',
}

// SPDX-License-Identifier: GPL-3.0-only
import type { PersonaId } from '@/data/learningPersonas'

type ViewAccess = 'gated' | 'preview' | 'unlocked'

/**
 * Whether the Playground's engineering-workbench controls (engine choice,
 * ACVP and conformance suites, KMIP dev tab, workbench tabs) are hidden.
 *
 * Executive and GRC readers never see them. Curious readers see them once
 * they choose "Show every control" (viewAccess 'unlocked'): the Explore
 * callout and the simplified-view notices promise exactly that (owner
 * decision C3, 16 Oct 2026).
 */
export function hidesWorkbench(role: PersonaId | null, viewAccess: ViewAccess): boolean {
  if (role === 'executive' || role === 'grc') return true
  if (role === 'curious') return viewAccess !== 'unlocked'
  return false
}

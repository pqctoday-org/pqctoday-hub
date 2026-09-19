// SPDX-License-Identifier: GPL-3.0-only
//
// The Learn → landscape reverse edge, kept in a module that imports ONLY the
// landscape loader. industryCrossRefs.ts imports the workshop registry (every
// Playground tool component), and mounting anything from it inside the Learn
// ModuleShell pulled the SAB/threads tools into every module's component tree
// — the workshopRequirements driftguard caught it on pki-workshop/digital-id
// the first time this panel was wired through industryCrossRefs (2026-09-17).

import type { IndustryUseCase } from '@/data/industryLandscapeData'
import { protocolModulesForUseCase } from './landscapeProtocolModules'

export interface LandscapeIndustryForModule {
  industry: string
  /** Use-case labels on that industry that name this module. */
  useCaseLabels: string[]
  href: string
  /** Round 9, wave 1.6: 'sector' when the row's learn_module_id names the module,
   *  'protocol' when its target protocol or mechanism does (landscapeProtocolModules). */
  edge: 'sector' | 'protocol'
}

/**
 * Reverse of `learnModulesForIndustry`: the landscape industries whose rows
 * name a Learn module, for the module page's "In the Industry Landscape"
 * back-link (2026-09-17, audit L2 — the mapping was one-way). Read from the
 * landscape CSV so a data change is never also a code change here.
 */
export function landscapeIndustriesForModule(
  moduleId: string,
  useCases: IndustryUseCase[]
): LandscapeIndustryForModule[] {
  const byIndustry = new Map<string, { labels: string[]; edge: 'sector' | 'protocol' }>()
  for (const uc of useCases) {
    const sector = uc.learnModuleId === moduleId
    const protocol = !sector && protocolModulesForUseCase(uc).some((l) => l.moduleId === moduleId)
    if (!sector && !protocol) continue
    const entry = byIndustry.get(uc.industry) ?? { labels: [], edge: 'protocol' as const }
    entry.labels.push(uc.useCaseLabel)
    if (sector) entry.edge = 'sector'
    byIndustry.set(uc.industry, entry)
  }
  return [...byIndustry.entries()]
    .sort((a, b) => (a[1].edge === b[1].edge ? 0 : a[1].edge === 'sector' ? -1 : 1))
    .map(([industry, { labels, edge }]) => ({
      industry,
      useCaseLabels: labels,
      href: `/algorithms?tab=landscape&industry=${encodeURIComponent(industry)}`,
      edge,
    }))
}

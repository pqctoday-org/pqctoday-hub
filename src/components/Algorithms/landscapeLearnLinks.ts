// SPDX-License-Identifier: GPL-3.0-only
//
// The Learn → landscape reverse edge, kept in a module that imports ONLY the
// landscape loader. industryCrossRefs.ts imports the workshop registry (every
// Playground tool component), and mounting anything from it inside the Learn
// ModuleShell pulled the SAB/threads tools into every module's component tree
// — the workshopRequirements driftguard caught it on pki-workshop/digital-id
// the first time this panel was wired through industryCrossRefs (2026-09-17).

import type { IndustryUseCase } from '@/data/industryLandscapeData'

export interface LandscapeIndustryForModule {
  industry: string
  /** Use-case labels on that industry that name this module. */
  useCaseLabels: string[]
  href: string
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
  const byIndustry = new Map<string, string[]>()
  for (const uc of useCases) {
    if (uc.learnModuleId !== moduleId) continue
    const list = byIndustry.get(uc.industry) ?? []
    list.push(uc.useCaseLabel)
    byIndustry.set(uc.industry, list)
  }
  return [...byIndustry.entries()].map(([industry, useCaseLabels]) => ({
    industry,
    useCaseLabels,
    href: `/algorithms?tab=landscape&industry=${encodeURIComponent(industry)}`,
  }))
}

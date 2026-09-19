// SPDX-License-Identifier: GPL-3.0-only
/**
 * Round 9 (2026-09-19) — exports the discoverability signals the B+ tracker's
 * census reads (`pqctoday-priv/design_handoff_bplus_remediation/round9-census90.py`)
 * from the live registries, so the census measures what the app renders and
 * not a regex over source. A `.local.test` because the registries import Vite
 * only modules that plain tsx cannot execute (see export-learn-manifest-snapshot).
 *
 * Run:  ROUND9_SIGNALS_OUT=/path/out.json npx vitest run --config vitest.local.config.ts scripts/export-round9-signals
 * Without the env var the suite is a no-op that passes.
 */
import { it } from 'vitest'
import fs from 'fs'
import { NEXT_STEPS } from '@/data/nextSteps'
import { playgroundToolRelations, businessToolRelations } from '@/data/toolRelations'
import { toolsForRole } from '@/data/roleTools'
import { PERSONA_FEATURED_TOOL_IDS } from '@/components/Playground/cryptoLabMeta'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'
import { getBusinessRoleSequence } from '@/data/businessRoleConfig'
import { PERSONA_IDS } from '@/data/personaIds'
import { loadIndustryLandscape } from '@/data/industryLandscapeData'
import { PAGE_RELATIONS } from '@/data/pageRelations'
import { boardRelatedLinks } from '@/data/boardRelatedLinks'
import { PERSONA_JOURNEY_BOARD_VARIANTS } from '@/data/generated/roleBoardContent.generated'
import { protocolModulesForUseCase } from '@/components/Algorithms/landscapeProtocolModules'

it('exports the round-9 discoverability signals when asked', () => {
  const out = process.env.ROUND9_SIGNALS_OUT
  if (!out) return
  const live = WORKSHOP_TOOLS.filter((t) => !t.sandbox && !t.wip)
  // rail position per persona: sortTools puts the role's recommended tools
  // first (stable), so position = index in that order within the category.
  const railPos: Record<string, Record<string, number>> = {}
  for (const t of live) railPos[t.id] = {}
  for (const p of [...PERSONA_IDS, 'none'] as const) {
    const byCat = new Map<string, typeof live>()
    for (const t of live) byCat.set(t.category, [...(byCat.get(t.category) ?? []), t])
    for (const [, arr] of byCat) {
      const sorted = [...arr].sort((a, b) => {
        const sa = p !== 'none' && a.recommendedPersonas.includes(p) ? 0 : 1
        const sb = p !== 'none' && b.recommendedPersonas.includes(p) ? 0 : 1
        return sa - sb
      })
      sorted.forEach((t, i) => (railPos[t.id][p] = i + 1))
    }
  }
  // business grid position per persona (BusinessToolsGrid rankFor, category groups)
  const gridPos: Record<string, Record<string, number>> = {}
  for (const t of BUSINESS_TOOLS) gridPos[t.id] = {}
  for (const p of [...PERSONA_IDS, 'none'] as const) {
    const seq = p === 'none' ? [] : getBusinessRoleSequence(p).steps.map((s) => s.id)
    const rank = (t: (typeof BUSINESS_TOOLS)[number]) => {
      if (p === 'none') return 1
      const i = seq.indexOf(t.id)
      if (i !== -1) return -100 + i
      const audience = t.audience ?? 'business'
      const mine = (p === 'executive' || p === 'grc') && audience === 'business' ? true : audience === p
      return mine ? 0 : 1
    }
    const byCat = new Map<string, typeof BUSINESS_TOOLS>()
    for (const t of BUSINESS_TOOLS) byCat.set(t.category, [...(byCat.get(t.category) ?? []), t])
    for (const [, arr] of byCat) {
      arr
        .map((t, i) => ({ t, i }))
        .sort((a, b) => rank(a.t) - rank(b.t) || a.i - b.i)
        .forEach(({ t }, i) => (gridPos[t.id][p] = i + 1))
    }
  }
  const relatedInbound: Record<string, string[]> = {}
  for (const t of live)
    for (const e of playgroundToolRelations(t.id))
      relatedInbound[e.to] = [...(relatedInbound[e.to] ?? []), `/playground/${t.id}`]
  for (const t of BUSINESS_TOOLS)
    for (const e of businessToolRelations(t.id))
      relatedInbound[e.to] = [...(relatedInbound[e.to] ?? []), `/business/tools/${t.id}`]
  for (const [route, es] of Object.entries(PAGE_RELATIONS))
    for (const e of es) relatedInbound[e.to] = [...(relatedInbound[e.to] ?? []), route]
  const nextStepIn: Record<string, string[]> = {}
  for (const [from, s] of Object.entries(NEXT_STEPS)) nextStepIn[s.to] = [...(nextStepIn[s.to] ?? []), from]
  const roleRows: Record<string, string[]> = {}
  for (const p of PERSONA_IDS) {
    const r = toolsForRole(p)
    roleRows[p] = [...r.playground.map((t) => `/playground/${t.id}`), ...r.business.map((t) => `/business/tools/${t.id}`)]
  }
  // landscape rows per module: sector column plus the protocol edge (wave 1.6)
  const landscapeInbound: Record<string, number> = {}
  for (const uc of loadIndustryLandscape().useCases) {
    const ids = new Set<string>([uc.learnModuleId, ...protocolModulesForUseCase(uc).map((l) => l.moduleId)].filter(Boolean))
    for (const id of ids) landscapeInbound[id] = (landscapeInbound[id] ?? 0) + 1
  }
  // board "Related on this site" links per route (variant moduleIds / workshopIds / businessToolIds, rendered since round 9)
  const boardLinks: Record<string, number> = {}
  for (const p of PERSONA_IDS)
    for (const v of PERSONA_JOURNEY_BOARD_VARIANTS[p])
      for (const l of boardRelatedLinks(v)) boardLinks[l.to] = (boardLinks[l.to] ?? 0) + 1
  fs.writeFileSync(
    out,
    JSON.stringify(
      { nextSteps: NEXT_STEPS, nextStepIn, relatedInbound, railPos, gridPos, roleRows, marquee: PERSONA_FEATURED_TOOL_IDS, landscapeInbound, boardLinks },
      null,
      1
    )
  )
})

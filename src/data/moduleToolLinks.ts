// SPDX-License-Identifier: AGPL-3.0-only
/**
 * moduleToolLinks — the reverse of `WorkshopTool.moduleLink`, derived.
 *
 * Why this file exists (WS12 gap 3 / WS22 Phase 1 Stage 3, 2026-08-21):
 *   `ModuleShell` renders its "Related tool" footer link only when a manifest
 *   hand-declares `playgroundTool` — true for 17 of 65 modules. But the tool
 *   side already carries the same edge in the opposite direction: every
 *   non-sandbox `WorkshopTool` that opens a lesson has a `moduleLink`
 *   (workshopRegistry.tsx), and those point at 19 distinct modules. Three of
 *   them — confidential-computing, iam-pqc, secure-boot-pqc — had a real tool
 *   pointing straight at them and rendered nothing back, purely because nobody
 *   filled in the reverse field. This is WS6d's own insight one hop further:
 *   "No new data, only surfacing what's already there."
 *
 * ── Where the edge comes from now ──────────────────────────────────────────
 * The tools data file (`src/data/tools_*.csv`, read through
 * `tools.generated.ts`) names each tool's lesson in its `module` column, and
 * the reverse map and the title map below are derived from it. The generated
 * file is plain data with no component imports, so reading it here costs
 * kilobytes — a live import of `WORKSHOP_TOOLS` from `ModuleShell` measured
 * **2.11 MB of eager JS** on 2026-08-21 (the registry folds into a bucket the
 * eager `App` chunk already pulls; the precache gate failed at 16.24 MB against
 * its 15.00 MB cap) and must stay out of this file. `moduleRelations.driftguard
 * .test.ts` re-derives the same map from each tool's `moduleLink` in the real
 * registry on every run, so a link and its `module` cell cannot disagree.
 *
 * Precedence: an explicitly declared `playgroundTool` always wins; this is the
 * fallback for the modules that never declared one.
 */
import type { ResolvedModuleManifest } from '@/components/PKILearning/manifest/types'
import { PLAYGROUND_TOOL_RECORDS } from '@/data/generated/tools.generated'

/** `/learn/iam-pqc?tab=workshop&step=2` → `iam-pqc`; anything else → null. */
export function moduleIdFromToolLink(moduleLink: string): string | null {
  if (!moduleLink.startsWith('/learn/')) return null
  const slug = moduleLink.slice('/learn/'.length).split(/[?#]/)[0]
  return slug ? slug : null
}

/**
 * module id → every browser-runnable tool whose row names it, in the order of
 * the tools data file.
 *
 * B+ round 8, Wave B (2026-09-18 — WS17 signal 13): the single-valued map
 * below showed one tool per module, so the second to fifth tools that link to
 * a module (entropy-randomness has five) were never offered back from it.
 * ModuleShell renders the whole list now.
 */
export const TOOLS_BY_MODULE_ID: ReadonlyMap<string, readonly string[]> = (() => {
  const byModule = new Map<string, string[]>()
  for (const record of PLAYGROUND_TOOL_RECORDS) {
    if (!record.module) continue
    const tools = byModule.get(record.module) ?? []
    tools.push(record.toolId)
    byModule.set(record.module, tools)
  }
  return byModule
})()

/**
 * module id → the first browser-runnable tool whose row names it, in the order
 * of the tools data file. Kept for callers that want one tool (the mobile
 * practice card); derived from the multi-valued map above.
 */
export const TOOL_BY_MODULE_ID: ReadonlyMap<string, string> = new Map(
  [...TOOLS_BY_MODULE_ID.entries()].map(([moduleId, tools]) => [moduleId, tools[0]!])
)

/**
 * tool id → display name, for the "Also in the Playground" row ModuleShell
 * renders. Read from the same data file, for the same eager-size reason as above.
 */
export const TOOL_TITLE_BY_ID: ReadonlyMap<string, string> = new Map(
  PLAYGROUND_TOOL_RECORDS.map((record) => [record.toolId, record.name])
)

/**
 * The playground tool to offer from a module: its own declaration first, then
 * the reverse of any tool that already links to it.
 */
export function resolveModuleTool(manifest: ResolvedModuleManifest): string | undefined {
  return manifest.playgroundTool ?? TOOL_BY_MODULE_ID.get(manifest.id)
}

/**
 * Every playground tool a module should offer: its own declaration first, then
 * each tool whose `moduleLink` points here, without duplicates.
 */
export function resolveModuleTools(manifest: ResolvedModuleManifest): string[] {
  const out: string[] = []
  const primary = resolveModuleTool(manifest)
  if (primary) out.push(primary)
  for (const t of TOOLS_BY_MODULE_ID.get(manifest.id) ?? []) if (!out.includes(t)) out.push(t)
  return out
}

/**
 * Wave B / B2 (2026-08-29, bplus-remediation-plan-08292026.md): modules
 * excluded from the mobile "Practice on your phone" card even though they
 * have a real twin per `resolveModuleTool` — user sign-off, not a data gap:
 *   - mls-group-messaging: the tool's own registry entry says it "needs a
 *     wider screen" (read-only credit only on mobile).
 *   - vpn-ssh-pqc: its Android-only twin is Chromium-gated on iOS.
 *   - confidential-computing: its twin (tee-channel) is too narrow a tool
 *     for a first mobile practice step.
 * Two modules the plan's own B2 table also proposed (crypto-agility →
 * cacp-kmip, hsm-pqc → hsm) were dropped entirely, not just excluded: no
 * `WorkshopTool.moduleLink` in workshopRegistry.tsx actually points at
 * either module (verified directly against the registry, 2026-08-29) — that
 * table's two extra rows were wrong, not a real, drift-guarded link like the
 * 16 below.
 */
const MOBILE_PRACTICE_EXCLUDED = new Set([
  'mls-group-messaging',
  'vpn-ssh-pqc',
  'confidential-computing',
])

/**
 * The mobile "Practice on your phone" twin for a module (MobileModuleShell's
 * B2 card), or undefined when none exists or it's on the exclusion list
 * above. Same resolution as `resolveModuleTool` — the mobile shortlist is a
 * subset, not a different data source.
 */
export function mobilePracticeTool(manifest: ResolvedModuleManifest): string | undefined {
  if (MOBILE_PRACTICE_EXCLUDED.has(manifest.id)) return undefined
  return resolveModuleTool(manifest)
}

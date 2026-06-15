// SPDX-License-Identifier: GPL-3.0-only
/**
 * Resource contract (WS-07) — the single seam between the Simulation and the rest
 * of the hub. The sim is the app's most cross-coupled page; instead of reaching
 * into BusinessCenter / PKILearning / Playground from a dozen import sites, it
 * consumes them here. `resourceContract.test.ts` asserts every symbol below still
 * exists with the expected shape, so an upstream rename/removal fails CI instead
 * of breaking a live player session.
 *
 * Keep this list as the authoritative inventory of the sim's external deps.
 */

// ── BusinessCenter ───────────────────────────────────────────────────────────
export {
  BUSINESS_TOOLS,
  ARTIFACT_TYPE_TO_TOOL_ID,
} from '@/components/BusinessCenter/businessToolsRegistry'
export { BUSINESS_TOOL_COMPONENTS } from '@/components/BusinessCenter/businessToolComponents'

// ── PKILearning ──────────────────────────────────────────────────────────────
export { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
export { SIM_LEARN_MODULES, isEmbeddableModule } from '@/components/PKILearning/simEmbedModules'
export { EmbeddedLearnProvider } from '@/components/PKILearning/embeddedLearnContext'

// ── Playground ───────────────────────────────────────────────────────────────
export { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'

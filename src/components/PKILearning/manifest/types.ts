// SPDX-License-Identifier: GPL-3.0-only
/**
 * ModuleManifest — the single source of truth for one learn module (A1).
 *
 * Supersets the ~6 parallel maps in moduleData.ts (MODULE_CATALOG,
 * MODULE_STEP_COUNTS, LEARN_SECTIONS, WORKSHOP_STEPS, MODULE_TRACKS,
 * MODULE_PLAYGROUND_TOOL/MODULE_TAXONOMY) plus the lazy route component and the
 * sim-embeddable flag. During the migration those maps become *derived views*
 * over the manifest collection (see ./derive) and a conformance test asserts the
 * derivation reproduces today's hand-written maps byte-for-byte.
 *
 * Manifests are co-located per module (modules/<X>/manifest.ts) and assembled by
 * ./registry via import.meta.glob — mirroring how src/simulation/index.ts
 * assembles the phase trees.
 */
import type { ComponentType } from 'react'
import type { PhaseId } from '@/data/frameworkPhases'

export interface TabItem {
  value: string
  label: string
}

/**
 * A named route through a module's sections (2026-07-30).
 *
 * Added for modules that legitimately serve more than one audience, where
 * demanding the whole runtime from everyone would be wrong. The Financial
 * Services & Payments module is the first: it merges cards, banking, and
 * retail, three industries deep-link into it, and a banking learner has no
 * reason to study POS key injection.
 *
 * When a module declares `learnPaths`, completion is evaluated against the
 * learner's active path rather than every section (see useModuleStore), and
 * the catalogue card advertises per-path durations rather than one total.
 * Modules without `learnPaths` behave exactly as before.
 */
export interface LearnPath {
  /** slug used in `?path=` */
  id: string
  label: string
  /** section the learner lands on when arriving via this path */
  entrySection: string
  /** sections required to complete the module *via this path* */
  sections: string[]
  /** human duration for this path alone, e.g. '45 min' */
  duration: string
  /** one line on who this path is for; shown in the path picker */
  audience?: string
}

export interface ModuleManifest {
  /** slug — equals the route path and the MODULE_CATALOG key */
  id: string
  /** 'LM-NNN' tracking id (absent on quiz/assess) */
  lm_id?: string
  title: string
  description: string
  /** human duration, e.g. '60 min' */
  duration: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  workInProgress?: boolean
  /** single phase, or an array for spanning modules */
  frameworkPhase: PhaseId | PhaseId[]

  /** canonical track name; absent for quiz/assess (not in any track) */
  track?: string
  /** position within its track (preserves MODULE_TRACKS ordering) */
  trackOrder?: number

  /** ordered Learn-tab sections (absent for custom/special modules) */
  learnSections?: { id: string; label: string }[]
  /**
   * Named routes through `learnSections` for multi-audience modules. When
   * present, `duration` remains the whole-module total and each path
   * advertises its own. See {@link LearnPath}.
   */
  learnPaths?: LearnPath[]
  /** ordered Workshop steps; their length is the canonical step count */
  workshopSteps?: { id: string; label: string }[]
  /** step count for modules with no workshopSteps (quiz/assess only) */
  stepCountOverride?: number

  /** tab set; defaults to the standard 6 (see STANDARD_TABS) when omitted */
  tabs?: TabItem[]
  /** custom modules (Quiz) own their whole body — no ModuleTabBar */
  custom?: boolean

  /** lazy route component (absent for the synthetic 'assess' entry) */
  load?: () => Promise<{ default: ComponentType }>
  /** mountable in-place inside /simulation */
  embeddable?: boolean

  playgroundTool?: string
  taxonomy?: { algorithms?: string[]; standards?: string[] }

  /**
   * Hand-authored module graph (WS2-module-graph.md — unbuilt as of
   * 2026-08-21, so both arrays are empty on all 65 manifests today).
   *
   * These exist as the OVERRIDE SEAM for `src/data/moduleRelations.ts`: the
   * "Related modules" panel computes its list from `track`/`frameworkPhase`/
   * `taxonomy`, and the moment a manifest populates either array here the
   * authored set is rendered INSTEAD of the computed one — never appended to
   * it. Two related-modules sources stacking is the failure mode this seam
   * exists to prevent; see the header of moduleRelations.ts.
   */
  prerequisiteIds?: string[]
  followOnIds?: string[]

  /**
   * Per-module learn-content version (B2). Bump when this module's content
   * materially changes so the "What's New" surface can show "<module> updated".
   * Absent ⇒ treated as 1. Independent of the persist/migrate store versions.
   */
  contentVersion?: number

  /**
   * Program/governance modules that map onto the CSWP.39 simulation (C1). When
   * true, ModuleShell shows a "Practice in the Simulation" CTA on the standalone
   * Learn page (hidden when the module is itself embedded inside the sim).
   */
  practiceInSim?: boolean

  /**
   * One-line "why this matters" framing rendered as a callout under the module
   * header (P2.1). Optional and rendered only when present, so it can be filled
   * in progressively starting with the highest-traffic modules.
   */
  whyThisMatters?: string
}

/** The default tab set used by a standard module when `tabs` is omitted. */
export const STANDARD_TABS: TabItem[] = [
  { value: 'learn', label: 'Learn' },
  { value: 'visual', label: 'Visual' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'exercises', label: 'Exercises' },
  { value: 'references', label: 'References' },
  { value: 'tools', label: 'Tools & Products' },
]

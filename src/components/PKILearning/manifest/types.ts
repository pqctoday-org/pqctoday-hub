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
   * Per-module learn-content version (B2). Bump when this module's content
   * materially changes so the "What's New" surface can show "<module> updated".
   * Absent ⇒ treated as 1. Independent of the persist/migrate store versions.
   */
  contentVersion?: number
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

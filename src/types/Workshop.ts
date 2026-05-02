// SPDX-License-Identifier: GPL-3.0-only
import type { PersonaId } from '@/data/learningPersonas'
import type { ExperienceLevel } from '@/store/usePersonaStore'

export type WorkshopRegion = 'US' | 'CA' | 'AU' | 'EU' | 'UK' | 'JP' | 'OTHER'

export type WorkshopChapterKind = 'intro' | 'prereq' | 'foundations' | 'region' | 'action' | 'close'

export type WorkshopCue =
  | { tMs: number; kind: 'navigate'; route: string; query?: Record<string, string> }
  | { tMs: number; kind: 'caption'; text: string }
  | { tMs: number; kind: 'spotlight'; selector: string; padding?: number }
  | {
      tMs: number
      kind: 'callout'
      selector: string
      label: string
      arrow?: 'left' | 'right' | 'top' | 'bottom'
    }
  | { tMs: number; kind: 'click'; selector: string }
  | { tMs: number; kind: 'highlight-tab'; tabName: string }
  /**
   * Select a tab by name. Resolution priority (in `useWorkshopOverlayStore.applyCue`):
   *   1. element with `data-workshop-target="tab-<slug>"` (auto-emitted by `<TabsTrigger>`)
   *   2. `[role="tab"]` whose textContent matches `tabName`
   *   3. any `<button>` whose textContent matches `tabName` (case-insensitive)
   */
  | { tMs: number; kind: 'select-tab'; tabName: string }
  /**
   * Expand a collapsible section. Targets the toggle button (typically
   * `aria-expanded="false"`); idempotent — no-op if already expanded.
   */
  | { tMs: number; kind: 'expand-section'; selector: string }
  | { tMs: number; kind: 'collapse-section'; selector: string }
  /**
   * Smooth-scroll a selector into view. Falls back to absolute Y position
   * `topPx` if the selector resolves to nothing.
   */
  | { tMs: number; kind: 'scroll-to'; selector?: string; topPx?: number }
  /**
   * Type into an input or textarea using a fixture key (resolved against
   * the flow's per-step fixtures). Used by Video Mode to auto-fill wizard
   * inputs without human typing.
   */
  | { tMs: number; kind: 'fill-from-fixture'; selector: string; fixtureKey: string }
  /** Type a literal string. Prefer fixtures so demo data stays editable. */
  | { tMs: number; kind: 'fill-literal'; selector: string; value: string }
  /** Choose a dropdown option by visible label, from a fixture key. */
  | { tMs: number; kind: 'select-from-fixture'; selector: string; fixtureKey: string }
  | { tMs: number; kind: 'advance' }

/**
 * Per-step fixture data for Video Mode auto-fill. Stored either inline on the
 * flow or in `public/workshop-fixtures/<flowId>.json` (loaded at video start).
 * Keys are arbitrary strings the cue references (e.g. "country", "industry");
 * values are strings, string arrays, booleans, or numbers depending on the
 * input type.
 */
export type WorkshopFixtureValue = string | string[] | boolean | number
export type WorkshopFixtures = Record<string, Record<string, WorkshopFixtureValue>>
// stepId → key → value

export type WorkshopCompletionSignal =
  | { kind: 'route-visited'; route: string }
  | { kind: 'assessment-complete' }
  | { kind: 'bookmark-added'; surface: 'compliance' | 'leaders' | 'library' | 'timeline' }
  | { kind: 'module-progress'; moduleId: string; minSteps: number }
  | { kind: 'filter-applied'; surface: 'threats' | 'leaders' | 'compliance'; key: string }

export interface WorkshopStep {
  id: string
  chapter: WorkshopChapterKind
  region?: WorkshopRegion
  title: string
  estMinutes: number
  whyItMatters: string
  page: { route: string; query?: Record<string, string> }
  tasks: string[]
  expectedOutput: string
  narration: string
  completionSignal?: WorkshopCompletionSignal
  cues?: WorkshopCue[]
}

export interface WorkshopChapter {
  id: string
  title: string
  estMinutes: number
  steps: WorkshopStep[]
}

export interface FlowMatch {
  roles: PersonaId[] | '*'
  proficiencies: ExperienceLevel[] | '*'
  industries: string[] | '*'
  regions: WorkshopRegion[] | '*'
}

export interface WorkshopFlow {
  id: string
  title: string
  match: FlowMatch
  totalEstMinutes: number
  intro: WorkshopChapter
  prerequisites: WorkshopChapter
  common: WorkshopChapter[]
  regions?: Partial<Record<WorkshopRegion, WorkshopChapter>>
  close: WorkshopChapter
  /** Inline fixtures for Video Mode auto-fill (rare — prefer fixturesUrl). */
  fixtures?: WorkshopFixtures
  /** Path to external fixtures JSON, relative to public/. */
  fixturesUrl?: string
}

export interface ResolvedFlowContext {
  role: PersonaId
  proficiency: ExperienceLevel
  industry: string
  region: WorkshopRegion
}

// SPDX-License-Identifier: GPL-3.0-only
/**
 * Embed contract (WS-09) — the rules a hub resource must satisfy to render INSIDE
 * the simulation (under the sim header) instead of navigating away.
 *
 * A step is embeddable when its backing component exists in the registries the
 * sim consumes through the resource contract:
 *  - learn: `moduleId` is a registered, embeddable Learn module (SIM_LEARN_MODULES).
 *  - activity: `artifactType` maps to a Business-Center tool that has a mounted
 *    component (BUSINESS_TOOL_COMPONENTS).
 *  - workshop: `workshopId` maps to a Playground tool (WORKSHOP_TOOL_COMPONENTS).
 *  - catalog: the Migrate product catalog embedded via a MemoryRouter (C7).
 *  - reference → the assessment engine: the `assess-engine` reference step opens
 *    the AssessWizard embedded in the sim (re-run / refine the assessment without
 *    leaving the board). Recognized by `isAssessStep`.
 *  - reference → the timeline: the `timeline` reference step opens the interactive
 *    Gantt chart scoped to the player's assessed country (C6). `isTimelineStep`.
 *
 * Behavioural side of the contract (enforced by the embed shell, not this guard):
 *  - renders headless — chrome (tabs/quiz/nav) is trimmed by EmbeddedLearnProvider;
 *  - signals completion — the embed header exposes a Mark-complete toggle;
 *  - no hard navigation — outbound `/learn` anchors are blocked in the embed pane.
 *
 * `embedContract.test.ts` asserts every tree step that the sim offers to embed
 * actually resolves to a real component, so a tool can't ship embed-broken.
 */
import {
  ARTIFACT_TYPE_TO_TOOL_ID,
  BUSINESS_TOOL_COMPONENTS,
  WORKSHOP_TOOL_COMPONENTS,
  isEmbeddableModule,
} from './resourceContract'
import type { TreeStep } from '@/simulation'

/**
 * ── RECIPE: add an embeddable resource KIND (C0) ────────────────────────────
 * Every embeddable kind needs these SIX elements wired together. Adding a kind
 * means touching exactly these, each guarded by `embedContract.test.ts`:
 *
 *   1. A `StepKind` literal in `src/simulation/types.ts` + the step's id field
 *      (e.g. `moduleId` / `artifactType` / `refId`).
 *   2. An id → component registry re-exported via `resourceContract.ts`
 *      (e.g. SIM_LEARN_MODULES, BUSINESS_TOOL_COMPONENTS).
 *   3. A `canEmbedStep` branch here that returns true iff (2) resolves.
 *   4. An embed-pane mount arm in `SimulationView` that renders the component.
 *   5. A completion branch in `isStepComplete` (the standard completion
 *      convention — one predicate for all kinds).
 *   6. Generator support in `scripts/gen-sim-trees.mjs` (helper + URL/registry
 *      maps) so authored trees can reference the kind.
 *
 * `embedContract.test.ts` enforces (3) + (5) for every kind and asserts every
 * tree step the sim offers to embed resolves to a real component.
 */

/**
 * True for the `assess-engine` reference step — the assessment opens EMBEDDED in
 * the sim (AssessWizard under the "Simulation mode" bar) instead of navigating to
 * the full /assess page. This is for re-running / refining the assessment from
 * inside the sim once you're past the initial assessment gate.
 */
export function isAssessStep(s: TreeStep): boolean {
  return s.kind === 'reference' && s.refId === 'assess-engine'
}

/**
 * True for a `timeline` reference step — the interactive Gantt opens EMBEDDED
 * (pre-scoped to the player's jurisdiction / a `?country=` or `?region=` param)
 * instead of navigating out to the full /timeline page.
 */
export function isTimelineStep(s: TreeStep): boolean {
  return s.kind === 'reference' && s.refId === 'timeline'
}

/** True when this step can be rendered embedded in the sim (vs. navigated to). */
export function canEmbedStep(s: TreeStep): boolean {
  if (s.kind === 'learn') return !!s.moduleId && isEmbeddableModule(s.moduleId)
  if (s.kind === 'activity' && s.artifactType) {
    const toolId = ARTIFACT_TYPE_TO_TOOL_ID[s.artifactType]
    // eslint-disable-next-line security/detect-object-injection
    return !!toolId && !!BUSINESS_TOOL_COMPONENTS[toolId]
  }

  if (s.kind === 'workshop' && s.workshopId) return !!WORKSHOP_TOOL_COMPONENTS[s.workshopId]
  if (s.kind === 'catalog') return true
  if (isAssessStep(s)) return true
  if (isTimelineStep(s)) return true
  return false
}

/**
 * The state a completion check needs, injected by the caller — the sim reads it
 * from its stores; tests pass mocks. Keeps `isStepComplete` a pure, testable
 * function of (step, context) rather than reaching into stores itself.
 */
export interface StepCompletionContext {
  /** learn: the module's progress status is 'completed'. */
  isModuleComplete: (moduleId: string) => boolean
  /** activity: an artifact of this type exists in the doc store. */
  hasArtifact: (type: NonNullable<TreeStep['artifactType']>) => boolean
  /** reference: this ref id has been visited. */
  isRefVisited: (refId: string) => boolean
  /** workshop: this workshop/tool id has been visited/completed. */
  isWorkshopComplete: (workshopId: string) => boolean
  /** catalog: the player has added ≥1 product to "My Products" (via the Migrate catalog). */
  hasCatalogPicks: () => boolean
}

/**
 * STANDARD COMPLETION CONVENTION (C0): one predicate that answers "is this
 * embedded resource complete?" for EVERY embeddable step kind. A new embeddable
 * kind declares its completion HERE (one place), and `embedContract.test.ts`
 * verifies every kind resolves both a component (`canEmbedStep`) AND a completion
 * branch here. The sim layers game logic (AI-team delegation) on top of this
 * resource-level signal — that overlay is not part of the contract.
 */
export function isStepComplete(s: TreeStep, ctx: StepCompletionContext): boolean {
  switch (s.kind) {
    case 'learn':
      return !!s.moduleId && ctx.isModuleComplete(s.moduleId)
    case 'activity':
      return !!s.artifactType && ctx.hasArtifact(s.artifactType)
    case 'reference':
      return !!s.refId && ctx.isRefVisited(s.refId)
    case 'workshop':
      return !!s.workshopId && ctx.isWorkshopComplete(s.workshopId)
    case 'catalog':
      return ctx.hasCatalogPicks()
    default:
      return false
  }
}

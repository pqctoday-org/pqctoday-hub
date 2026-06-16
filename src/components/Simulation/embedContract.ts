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
 *  - reference → the assessment engine: the `assess-engine` reference step opens
 *    the AssessWizard embedded in the sim (re-run / refine the assessment without
 *    leaving the board). Recognized by `isAssessStep`.
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
  isEmbeddableModule,
} from './resourceContract'
import type { TreeStep } from '@/simulation'

/**
 * True for the `assess-engine` reference step — the assessment opens EMBEDDED in
 * the sim (AssessWizard under the "Simulation mode" bar) instead of navigating to
 * the full /assess page. This is for re-running / refining the assessment from
 * inside the sim once you're past the initial assessment gate.
 */
export function isAssessStep(s: TreeStep): boolean {
  return s.kind === 'reference' && s.refId === 'assess-engine'
}

/** True when this step can be rendered embedded in the sim (vs. navigated to). */
export function canEmbedStep(s: TreeStep): boolean {
  if (s.kind === 'learn') return !!s.moduleId && isEmbeddableModule(s.moduleId)
  if (s.kind === 'activity' && s.artifactType) {
    const toolId = ARTIFACT_TYPE_TO_TOOL_ID[s.artifactType]
    // eslint-disable-next-line security/detect-object-injection
    return !!toolId && !!BUSINESS_TOOL_COMPONENTS[toolId]
  }
  if (isAssessStep(s)) return true
  return false
}

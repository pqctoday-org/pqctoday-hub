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

/** True when this step can be rendered embedded in the sim (vs. navigated to). */
export function canEmbedStep(s: TreeStep): boolean {
  if (s.kind === 'learn') return !!s.moduleId && isEmbeddableModule(s.moduleId)
  if (s.kind === 'activity' && s.artifactType) {
    const toolId = ARTIFACT_TYPE_TO_TOOL_ID[s.artifactType]
    // eslint-disable-next-line security/detect-object-injection
    return !!toolId && !!BUSINESS_TOOL_COMPONENTS[toolId]
  }
  return false
}

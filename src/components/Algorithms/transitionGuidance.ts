// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The 2030 "deprecated" / 2035 "disallowed" dates shown for classical
 * algorithms come from NIST IR 8547, which is still an initial public draft
 * (November 2024) and is written for US federal systems. The Algorithms
 * views label those dates as proposed guidance rather than a universal
 * deadline.
 */
export const TRANSITION_GUIDANCE_NOTE =
  'These dates come from NIST IR 8547, an initial public draft (November 2024) of transition guidance for US federal systems. They are proposed, not final, and other jurisdictions set their own dates.'

/** True for a "20xx (Deprecated)" / "20xx (Disallowed)" transition label. */
export function isTransitionGuidanceDate(label: string): boolean {
  return /\b20\d\d\b/.test(label) && /deprecated|disallowed/i.test(label)
}

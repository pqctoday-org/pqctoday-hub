// SPDX-License-Identifier: GPL-3.0-only
/**
 * B+ round 8, Wave D (2026-09-18) — modules whose guided workshop is offered
 * inside the phone shell (MobileModuleShell) instead of the "switch to a
 * laptop" banner.
 *
 * The desktop workshop component renders unchanged inside the phone chrome,
 * so a module qualifies on evidence, not on a rewrite: every step of its
 * stepper was walked at 390 × 844 with the mobile shell off (scratch probe,
 * 2026-09-18) and showed 0 px horizontal overflow, no element wider than the
 * viewport, 0 page errors and 0 serious axe nodes. The user's decision was
 * "start with the cheapest five"; these five are the interactive workshops
 * (form inputs on their steps) from the passing set. Four more passed the
 * same probe with read-only steps and can join by adding their id here:
 * sbom, government-defense-pqc, trust-services-pqc, dnssec-pqc.
 *
 * A module whose workshop needs a wider screen (canvas, side-by-side panes,
 * PKCS#11 workbenches) stays OFF this list and keeps the honest banner or its
 * playground twin (moduleToolLinks.ts `mobilePracticeTool`).
 */
export const MOBILE_WORKSHOP_READY: ReadonlySet<string> = new Set([
  'compliance-strategy',
  'verification-closure',
  'pqc-business-case',
  'crypto-registry',
  'cbom',
])

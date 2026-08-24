// SPDX-License-Identifier: GPL-3.0-only
/**
 * The mobile UX layer (design_handoff_pqc_mobile_ux/IMPLEMENTATION-PLAN.md).
 *
 * Isolation contract (plan §5):
 *  - Mounted from exactly two places: `MainLayout.tsx` (behind
 *    `useIsMobileShell()`) and `SimulationView.tsx` (its own phone block,
 *    O-3). No other desktop file imports from this directory.
 *  - Files under here may import data modules, hooks and stores freely, but
 *    never a desktop VIEW component (anything under `src/components/<Feature>/`
 *    that isn't `ui` or `Mobile` itself) — see the `no-restricted-imports`
 *    rule scoped to this directory in eslint.config.js. If a screen needs
 *    data trapped inside a desktop view file, extract it as a pure-move
 *    (plan §5.4) instead of reaching into the component.
 *  - Every component here reads through the flag in `useIsMobileShell()`
 *    (or is mounted by something that already did) — never render mobile
 *    chrome based on viewport alone.
 */
export { MobileSheet } from './primitives/Sheet'
export type { MobileSheetProps } from './primitives/Sheet'
export { MobileProgress } from './primitives/Progress'
export type { MobileProgressProps } from './primitives/Progress'
export { MobileBadge } from './primitives/Badge'
export type { MobileBadgeProps } from './primitives/Badge'

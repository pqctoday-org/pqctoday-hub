// SPDX-License-Identifier: GPL-3.0-only
/**
 * trapRemediation (WP2.7) — maps a specific trap/pitfall title to the Learn
 * module that actually teaches the misconception behind it, so the Trap
 * Insights board and the run-complete reflection point at the lesson that
 * fixes THAT trap — not just the first Learn module of the phase it happened
 * in (simTrapTally.ts's prior behavior, simulation-mode-review-07182026.md).
 *
 * Deliberately partial, not silently capped: covers P0-P3's 21 framework
 * pitfalls (verified against src/simulation/trees — every value here is a
 * real, registered module id) as the first tranche. `remediation()` in
 * simTrapTally.ts falls back to the phase-first-module behavior for any
 * trap title not yet mapped, so an unmapped trap degrades gracefully rather
 * than breaking. trapRemediation.test.ts drift-guards every value against
 * MODULE_CATALOG and lists what's still unmapped so the gap stays visible.
 */

/** Trap/pitfall title -> the Learn module id that teaches the fix. */
export const TRAP_REMEDIATION: Record<string, string> = {
  // P0 — Executive Mandate
  'Frame PQC as an innovation project': 'pqc-governance',
  'Commit only a single-year budget': 'pqc-business-case',
  'Leave business units off the SteerCo': 'pqc-governance',
  'Delegate the program to vendors': 'vendor-risk',
  'Lock systems down prematurely': 'quantum-threats',

  // P1 — Discovery & Inventory
  'Run an interview-only inventory': 'cbom',
  'Keep the inventory in a spreadsheet': 'cbom',
  'Wait for 100% completeness': 'data-asset-sensitivity',
  'Skip OT and embedded systems': 'iot-ot-pqc',
  'Trust a single discovery tool': 'cbom',
  'Rely on the CMDB alone for asset discovery': 'crypto-mgmt-modernization',
  'Treat discovery as one-time': 'cbom',
  'Ignore the immediate classical-crypto findings': 'quantum-threats',

  // P2 — CBOM
  'Insist on 100% CBOM coverage': 'cbom',
  'Keep the CBOM as a static document': 'cbom',
  'Ignore the SBOM↔CBOM linkage': 'cbom',

  // P3 — Risk Scoring
  'Give everything equal priority': 'pqc-risk-management',
  'Ignore migration feasibility': 'pqc-risk-management',
  'Produce the QRA once and freeze it': 'pqc-risk-management',
  'Migrate RSA before ECC for "strength"': 'quantum-threats',
  'Skip the legal / data-retention review': 'data-asset-sensitivity',
}

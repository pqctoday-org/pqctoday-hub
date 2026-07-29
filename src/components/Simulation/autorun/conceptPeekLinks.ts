// SPDX-License-Identifier: GPL-3.0-only
/**
 * conceptPeekLinks — the "learn more" Learn module for each concept peek
 * (WP2.3). Drift-guarded by conceptPeekLinks.test.ts against MODULE_CATALOG,
 * so a renamed/removed module fails the build instead of shipping a dead link.
 */
import type { TourConceptId } from './execTourConfig'

export const CONCEPT_LEARN_MODULE: Record<TourConceptId, string> = {
  hndl: 'quantum-threats',
  tnfl: 'quantum-threats',
  mosca: 'pqc-101',
  hybrid: 'hybrid-crypto',
  'two-track': 'pqc-risk-management',
  'crypto-agility': 'crypto-agility',
  'urgency-drivers': 'pqc-business-case',
  'cbom-fields': 'cbom',
  'weakest-domain-maturity': 'pqc-governance',
  'kpi-pack': 'pqc-governance',
  readiness: 'migration-program',
  // 07-29 review G-M1 — compromise response lives in the SOC module (monitoring,
  // triggers, response runbooks for PQC estates); /threats covers the sector view.
  'incident-response': 'soc-implementation-pqc',
}

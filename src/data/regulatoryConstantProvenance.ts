// SPDX-License-Identifier: GPL-3.0-only
/**
 * Where every hand-coded date in regulatoryTimelines.ts comes from (timeline
 * remediation r2 W-K, 2026-09-25).
 *
 * regulatoryTimelines.ts is read by ~49 Learn, Simulation and Report files, but
 * only the per-country sim deadlines were derived from the reviewed timeline
 * CSV; every other date was typed by hand with no link to evidence. Each one is
 * classified here, and regulatoryConstantProvenance.test.ts enforces it:
 *
 *   timeline         restates a reviewed timeline row; the test fails when the
 *                    row is withheld/deprecated or its value differs.
 *   generated        read from timelineFacts.generated.ts (reviewed rows only).
 *   derived          computed from another constant (e.g. an order's date + N
 *                    days); the test recomputes it.
 *   policy_constant  an official document outside the timeline's scope or not
 *                    yet a timeline row; `evidence` names it. Not reviewed by
 *                    the timeline lane.
 *   planning         a planning assumption or research range, not a
 *                    regulatory deadline. Must never be shown as one.
 *   unsourced        no reviewed source found — listed for the user; do not
 *                    present it as a requirement. (The one such constant,
 *                    ANSSI_TIMELINE.migrationPlanTarget, was removed 2026-09-25.)
 */

export type ProvenanceKind =
  'timeline' | 'generated' | 'derived' | 'policy_constant' | 'planning' | 'unsourced'

export interface ConstantProvenance {
  kind: ProvenanceKind
  /** timeline: the row's stable event_id. */
  eventId?: string
  /** timeline: which CSV column the constant restates. */
  field?: 'StartYear' | 'EndYear' | 'SourceDate'
  /** generated: the country code in TIMELINE_COUNTRY_DEADLINE_YEAR. */
  country?: string
  /** derived: base constant path and day offset. */
  from?: string
  days?: number
  /** policy_constant / planning / unsourced: what backs it (or does not). */
  evidence?: string
  note?: string
}

/** Keyed "<EXPORT>.<field>" for object constants, "<EXPORT>[<label>]" for lists. */
export const REGULATORY_CONSTANT_PROVENANCE: Readonly<Record<string, ConstantProvenance>> = {
  // ── CNSA 2.0 ──
  'CNSA_2_0.softwarePreferred': {
    kind: 'timeline',
    eventId: 'united-states-nsa-software-firmware-signing-transition',
    field: 'EndYear',
  },
  'CNSA_2_0.networkingRequired': {
    kind: 'timeline',
    eventId: 'united-states-nsa-nss-acquisitions-cnsa-2-0-required',
    field: 'StartYear',
  },
  'CNSA_2_0.softwareExclusive': {
    kind: 'timeline',
    eventId: 'united-states-nsa-cnsa-2-0-exclusive-network-signing',
    field: 'StartYear',
    note: 'Was read from the US sim deadline, i.e. EO 14412 key establishment — a different policy that happens to share the year. Decoupled 2026-09-25.',
  },
  'CNSA_2_0.networkingExclusive': {
    kind: 'timeline',
    eventId: 'united-states-nsa-cnsa-2-0-exclusive-os-web-cloud',
    field: 'StartYear',
  },
  'CNSA_2_0.fullEnforcement': {
    kind: 'policy_constant',
    evidence:
      'NSA CNSA 2.0 FAQ (library "NSA CNSA 2.0 FAQ"): "NSA intends that all NSS will be quantum-resistant by 2035"',
  },
  'CNSA_2_0.publishedDate': {
    kind: 'timeline',
    eventId: 'united-states-nsa-cnsa-2-0-published',
    field: 'SourceDate',
  },
  // ── NIST IR 8547 ──
  'NIST_DEPRECATION.deprecateClassical': {
    kind: 'policy_constant',
    evidence: 'NIST IR 8547 (library "NIST IR 8547") — an initial public DRAFT',
    note: "Its timeline row was deprecated (wrong page). A draft's proposed date: present it as NIST's proposal, not a final requirement.",
  },
  'NIST_DEPRECATION.disallowClassical': {
    kind: 'timeline',
    eventId: 'united-states-nist-112-bit-security-algorithms-fully-disallowed',
    field: 'StartYear',
    note: 'binding_force = draft (NIST IR 8547 initial public draft).',
  },
  'NIST_DEPRECATION.fipsFinalized': {
    kind: 'timeline',
    eventId: 'united-states-nist-fips-203-204-205-published',
    field: 'SourceDate',
  },
  // ── EO 14412 / M-26-15 ──
  'EO_14412.signedDate': {
    kind: 'timeline',
    eventId: 'united-states-white-house-securing-the-nation-against-advanced-cryptographic-att',
    field: 'SourceDate',
  },
  'EO_14412.publishedDate': {
    kind: 'timeline',
    eventId: 'united-states-federal-agencies-key-establishment-migration-deadline-eo-june-22-2',
    field: 'SourceDate',
  },
  'EO_14412.keyEstablishment': { kind: 'generated', country: 'US' },
  'EO_14412.digitalSignatures': {
    kind: 'timeline',
    eventId: 'united-states-federal-agencies-digital-signature-migration-deadline-eo-june-22-2',
    field: 'StartYear',
  },
  'EO_14412.farProposedRuleDue': {
    kind: 'derived',
    from: 'EO_14412.signedDate',
    days: 180,
    note: 'The order gives "within 180 days", not a calendar date.',
  },
  'EO_14412.cbomGuidanceDue': {
    kind: 'derived',
    from: 'EO_14412.signedDate',
    days: 270,
    note: 'The order gives "within 270 days"; it never writes "March 19, 2027" (review r2).',
  },
  'EO_14412.fullMigration': {
    kind: 'policy_constant',
    evidence: 'OMB M-26-15 (library "OMB-M-26-15")',
  },
  // ── ANSSI / BSI ──
  'BSI_TIMELINE.quantumSafeDefault': { kind: 'generated', country: 'DE' },
  // ── CRQC research range ──
  'CRQC_ESTIMATES.lowerBound': {
    kind: 'planning',
    note: 'Research range, not a deadline.',
  },
  'CRQC_ESTIMATES.moderate': { kind: 'planning', note: 'Research range, not a deadline.' },
  'CRQC_ESTIMATES.upperBound': { kind: 'planning', note: 'Research range, not a deadline.' },
  'CRQC_ESTIMATES.workshopDefault': { kind: 'planning', note: 'Workshop simulation default.' },
  // ── "2026–2030 squeeze" ribbon ──
  'SQUEEZE_2026_2030[NIS2 PQC Amendment]': {
    kind: 'policy_constant',
    evidence: 'COM(2026) 13 (EU Commission proposal)',
    note: 'Not a timeline row; a proposal, not an adopted requirement.',
  },
  'SQUEEZE_2026_2030[G7 Financial PQC Roadmap]': {
    kind: 'timeline',
    eventId: 'g7-g7-ceg-g7-financial-sector-pqc-roadmap',
    field: 'SourceDate',
    note: 'The ribbon detail ("2030–2032 targets") rests on the critical-systems row that review r2 WITHHELD: its document does not state that window.',
  },
  'SQUEEZE_2026_2030[CA/B 200-day certs]': {
    kind: 'policy_constant',
    evidence: 'CA/Browser Forum Ballot SC-081v3 (library "CAB-Forum-SC-081v3")',
  },
  "SQUEEZE_2026_2030[Let's Encrypt MTC]": {
    kind: 'policy_constant',
    evidence: "Let's Encrypt announcement (a CA, outside the timeline's scope)",
  },
  'SQUEEZE_2026_2030[FIPS 140-2 sunset]': {
    kind: 'policy_constant',
    evidence: 'NIST CMVP FIPS 140-2 sunset (September 2026)',
  },
  'SQUEEZE_2026_2030[CMMC Level 2]': {
    kind: 'policy_constant',
    evidence: 'DoD CMMC program (library "CMMC-2.0-MODEL")',
  },
  'SQUEEZE_2026_2030[CNSA 2.0 procurement gate]': {
    kind: 'timeline',
    note: 'The ribbon shows month precision (-01) for a year-level target; the source supports the year only.',
    eventId: 'united-states-nsa-nss-acquisitions-cnsa-2-0-required',
    field: 'StartYear',
  },
  'SQUEEZE_2026_2030[CA/B 100-day certs]': {
    kind: 'policy_constant',
    evidence: 'CA/Browser Forum Ballot SC-081v3',
  },
  'SQUEEZE_2026_2030[Chrome QR Root Store]': {
    kind: 'policy_constant',
    evidence: 'Google Chrome root-program announcement (a vendor, outside the timeline scope)',
  },
  'SQUEEZE_2026_2030[CA/B 47-day certs]': {
    kind: 'policy_constant',
    evidence: 'CA/Browser Forum Ballot SC-081v3',
  },
  'SQUEEZE_2026_2030[CNSA 2.0 software]': {
    kind: 'timeline',
    note: 'The ribbon shows month precision (-01) for a year-level target; the source supports the year only.',
    eventId: 'united-states-nsa-cnsa-2-0-exclusive-network-signing',
    field: 'StartYear',
  },
  'SQUEEZE_2026_2030[Canada / NCSC UK]': {
    kind: 'timeline',
    note: 'The ribbon shows month precision (-01) for a year-level target; the source supports the year only.',
    eventId: 'canada-cccs-high-priority-systems-complete',
    field: 'StartYear',
  },
  // ── CA/B certificate lifetimes and the 5-year template ──
  'CAB_FORUM_CERT_LIFETIME[2026-03]': {
    kind: 'policy_constant',
    evidence: 'CA/Browser Forum Ballot SC-081v3',
  },
  'CAB_FORUM_CERT_LIFETIME[2027-03]': {
    kind: 'policy_constant',
    evidence: 'CA/Browser Forum Ballot SC-081v3',
  },
  'CAB_FORUM_CERT_LIFETIME[2029-03]': {
    kind: 'policy_constant',
    evidence: 'CA/Browser Forum Ballot SC-081v3',
  },
  ROADMAP_5_YEAR: {
    kind: 'planning',
    note: 'An organisational planning template (Phase 4 §4.2), not a regulatory deadline.',
  },
}

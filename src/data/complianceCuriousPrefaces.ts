// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Plain-English "About this regulation" prefaces shown to the curious persona
 * on `/compliance` framework detail (P11-P1-04). Renders above the technical
 * body so a first-time visitor can orient themselves before reading the
 * detailed obligations.
 *
 * Keyed by the framework's `id` from `complianceData.ts` (case-sensitive).
 * Coverage is intentionally partial — only the frameworks most likely to be
 * a curious user's first encounter get prefaces; everything else falls back
 * to the existing technical description.
 */
export const COMPLIANCE_CURIOUS_PREFACES: Record<string, string> = {
  NIST: 'The US National Institute of Standards and Technology standardized ML-KEM, ML-DSA, and SLH-DSA after an international evaluation process. Many migration programs reference NIST standards, but each regulator and organization sets its own scope and timetable.',
  ENISA:
    "The European Union's cybersecurity agency. ENISA's PQC reports and the EUCC certification scheme are how the EU coordinates the same algorithms NIST chose — but there's no single binding EU-wide PQC mandate yet, so ENISA's guidance is influential rather than (currently) enforceable law.",
  BSI: "Germany's federal information-security agency. Its TR-02102 series tells every German company which algorithms are still allowed, which are deprecated, and on what timeline — the most technically detailed national PQC guidance in Europe.",
  ANSSI:
    "France's national cybersecurity authority. ANSSI tends to publish stricter PQC guidance than the EU average — it recommends (not legally mandates) hybrid PQC for new systems from 2025, with standalone PQC becoming an option from 2030, and that recommendation is the de facto floor for French government contracts.",
  'FIPS-140-3':
    'The US Federal Information Processing Standard for cryptographic modules. A FIPS 140-3 certificate records validation of a defined module, version, configuration, and operational environments — not every product that embeds it. FIPS 203/204/205 define algorithms; ACVP algorithm validation and CMVP module validation are separate evidence steps.',
  'CNSA-2':
    'The NSA\'s "Commercial National Security Algorithm" suite, version 2. CNSA 2.0 is the deadline that matters most for US defense and federal contracts — it\'s staged by category: software and firmware signing should prefer PQC by 2025 and must use it exclusively by 2030, with web/cloud, networking, OS, and legacy systems phasing in through 2033.',
  DORA: "The EU's Digital Operational Resilience Act requires in-scope financial entities to manage ICT risk and resilience. It does not explicitly mandate PQC; using it to justify PQC preparation is a risk-management interpretation that must be tested against the entity's scope and controls.",
  NIS2: "The EU's second Network and Information Security directive expands cybersecurity risk-management and reporting duties for in-scope entities. It addresses cryptography and encryption policies but does not set a specific PQC migration mandate or algorithm schedule.",
  'PCI-DSS':
    'The Payment Card Industry Data Security Standard applies to entities that store, process, or transmit payment-card data within its scope. PCI DSS v4.0.1 requires an inventory and at least annual review of cipher suites and protocols, but it does not explicitly mandate PQC.',
  HIPAA:
    "The US Health Insurance Portability and Accountability Act protects electronic health information but does not mandate PQC. Long confidentiality periods can make quantum migration relevant to an organization's documented risk analysis.",
  SOX: 'The US Sarbanes-Oxley Act establishes financial reporting and recordkeeping obligations; it does not prescribe PQC. Quantum migration may be relevant where cryptography protects records or controls that must remain reliable over long periods.',
  GDPR: 'The EU General Data Protection Regulation requires security appropriate to risk but does not name PQC. Long-lived personal data may make harvest-now-decrypt-later exposure relevant to a documented risk assessment.',
}

export function getComplianceCuriousPreface(frameworkId: string): string | undefined {
  // eslint-disable-next-line security/detect-object-injection
  return COMPLIANCE_CURIOUS_PREFACES[frameworkId]
}

// SPDX-License-Identifier: GPL-3.0-only
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
  NIST: 'The US National Institute of Standards and Technology — the lab that picked the first three post-quantum algorithms (ML-KEM, ML-DSA, SLH-DSA) and wrote the timeline every other regulator points to. If you only learn about one body on this page, make it this one.',
  ENISA:
    "The European Union's cybersecurity agency. ENISA's PQC reports and the EUCC certification scheme are how the EU enforces the same algorithms NIST chose, but with its own audit trail and a 2027 mandate window.",
  BSI: "Germany's federal information-security agency. Its TR-02102 series tells every German company which algorithms are still allowed, which are deprecated, and which must be retired by 2030.",
  ANSSI:
    'France\'s national cybersecurity authority. ANSSI tends to publish stricter PQC guidance than the EU average — when ANSSI says "hybrid mandatory until 2030," that\'s the floor for French government contracts.',
  FIPS: 'The US Federal Information Processing Standards. FIPS 203/204/205 are the formal names for ML-KEM, ML-DSA, and SLH-DSA — once a product claims "FIPS-validated" it has passed a federal lab test against those exact specs.',
  'CNSA-2':
    'The NSA\'s "Commercial National Security Algorithm" suite, version 2. CNSA 2.0 is the deadline that matters most for US defense and federal contracts — software signing must move to PQC by 2025, web traffic by 2030, and everything else by 2033.',
  DORA: "The EU's Digital Operational Resilience Act. DORA forces financial firms (banks, insurers, market infrastructure) to prove their crypto can survive a quantum break — and to test that resilience continuously, not just once.",
  NIS2: 'The EU\'s second Network and Information Security directive. NIS2 vastly expands which sectors must report cybersecurity incidents within 24 hours and prove "state-of-the-art" crypto — and PQC is on the way to becoming part of "state-of-the-art."',
  'PCI-DSS':
    'The Payment Card Industry Data Security Standard. Anyone handling credit-card numbers has to meet PCI-DSS. The v4 update (mandatory March 2025) added crypto-agility requirements that explicitly point toward PQC.',
  HIPAA:
    "The US Health Insurance Portability and Accountability Act. HIPAA-protected health records have to stay private for decades — which means today's encrypted backups already need to plan for quantum decryption.",
  SOX: 'The US Sarbanes-Oxley Act. SOX makes public-company financial records auditable for 7+ years — so anything encrypted today must still be defensible in a future where quantum decryption is real.',
  GDPR: 'The EU General Data Protection Regulation. GDPR\'s "security of processing" rules don\'t name PQC explicitly, but its multi-decade retention windows make harvest-now-decrypt-later attacks a legal liability today.',
}

export function getComplianceCuriousPreface(frameworkId: string): string | undefined {
  // eslint-disable-next-line security/detect-object-injection
  return COMPLIANCE_CURIOUS_PREFACES[frameworkId]
}

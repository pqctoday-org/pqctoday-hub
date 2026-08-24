// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the ExecQuantumImpact module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0, EO_14412 } from '@/data/regulatoryTimelines'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'exec-quantum-impact',
  version: '1.0.1',
  lastReviewed: '2026-08-23',
  lastEdited: '2026-08-23',

  standards: [
    getStandard('NSA CNSA 2.0'),
    getStandard('NIST IR 8547'),
    getStandard('NSM-10'),
    getStandard('EO-14306'),
    getStandard('EO-2026-06-22-Securing-the-Nation'),
    getStandard('OMB-M-26-15'),
    getStandard('EU-NIS-CG-Roadmap-v1.1'),
    getStandard('DORA-REG-2022-2554'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('FIPS 203'),
  ],

  algorithms: [
    // No algorithm references detected — add manually if needed
  ],

  deadlines: [
    {
      label: 'CNSA 2.0 software signing preferred',
      year: CNSA_2_0.softwarePreferred,
      source: 'CNSA 2.0',
    },
    { label: 'CNSA 2.0 software exclusive', year: CNSA_2_0.softwareExclusive, source: 'CNSA 2.0' },
    {
      label: 'EO 14412: federal civilian key establishment on PQC',
      year: EO_14412.keyEstablishment,
      source: 'EO 14412',
    },
    {
      label: 'EO 14412: federal civilian digital signatures on PQC',
      year: EO_14412.digitalSignatures,
      source: 'EO 14412',
    },
  ],

  narratives: {
    overview:
      'The Executive Quantum Impact module equips C-suite leaders, CISOs, and board members with the strategic context and decision-making tools needed to act on the quantum computing threat. It addresses the six most material business risks (HNDL data exposure, regulatory deadlines, board liability, vendor supply chain, competitive disadvantage, and cyber insurance gaps), provides a nine-criterion organizational self-assessment, and walks through building an actionable PQC migration roadmap framed ...',
    keyConcepts:
      'Harvest Now, Decrypt Later (HNDL) — adversaries are recording encrypted traffic today to decrypt once a cryptographically relevant quantum computer (CRQC) arrives; data with long confidentiality requirements (health records, IP, state secrets) is already at risk regardless of the CRQC timeline; the HNDL window is the number of years remaining data must stay confidential minus years until a CRQC is available.',
    workshopSummary:
      'The workshop has 3 interactive steps: Threat Impact Explorer — six-panel executive briefing covering HNDL exposure (critical, already happening), regulatory deadline mapping (critical, 2025–2035), board and fiduciary liability (high, growing annually), vendor and supply chain risk (high, 2025–2028 assessment window), competitive disadvantage (medium, 2026–2030), and rising cyber insurance costs (medium, 2026–2030); each panel includes an example scenario illustrating the business impact.',
    relatedStandards:
      "NSA CNSA 2.0 (Commercial National Security Algorithm Suite 2.0 — 2022 advisory). NIST IR 8547 (Transition to Post-Quantum Cryptography Standards — initial public draft, November 2024). NSM-10 (National Security Memorandum on Promoting U.S. Leadership in Quantum Computing, May 2022). EO 14306 (Presidential order sustaining PQC migration, June 2025). EO 14412, 'Securing the Nation Against Advanced Cryptographic Attacks' (signed 22 June 2026) — the operative US federal civilian PQC mandate: key establishment by 31 December 2030, digital signatures by 31 December 2031, for High Value Assets, high-impact systems and covered contractors; National Security Systems stay under CNSA 2.0. OMB M-26-15 (24 June 2026) — its implementing guidance, setting the five-phase agency migration schedule and requiring agency PQC migration plans at OMB. EU Coordinated Implementation Roadmap for PQC (v1.1, June 2025). DORA (EU Digital Operational Resilience Act, enforcement January 2025).",
  },
}

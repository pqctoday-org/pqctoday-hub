// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Parallel PQC standardisation tracks running outside the NIST process.
 * Survey-level entries for all bodies; drill-down detail for the most
 * active three (KpqC, CACR, ISO/IEC).
 */

export type BodyDepth = 'drill-down' | 'survey'
export type ProcessStage = 'open-call' | 'evaluation' | 'finalists' | 'standardised' | 'monitoring'

export interface StandardsBody {
  id: string
  name: string
  region: string
  /** Survey-level entries get a one-paragraph card; drill-downs get a full panel. */
  depth: BodyDepth
  /** Current process stage (most-active project) */
  stage: ProcessStage
  /** One-line role description */
  role: string
  /** Detailed narrative (used on drill-down panels) */
  detail: string
  /** Reference URL */
  url: string
  /** Relationship to NIST: 'aligned' (adopts NIST output), 'parallel' (independent process), 'overlay' (profiles NIST output for a region/sector) */
  nistRelation: 'aligned' | 'parallel' | 'overlay'
}

export const WORLDWIDE_BODIES: StandardsBody[] = [
  // ── Drill-down: three most-active non-NIST processes ───────────────────
  {
    id: 'kpqc',
    name: 'KpqC (Korea PQC Competition)',
    region: 'South Korea',
    depth: 'drill-down',
    stage: 'finalists',
    role: 'National PQC standardisation competition run by KISA + Korean Cryptography Forum.',
    detail:
      "Launched in 2022 as Korea's own PQC competition, modelled on the NIST process. The final results were announced on 16 January 2025: NTRU+ and SMAUG-T (KEMs) and AIMer and HAETAE (signatures). KpqC explicitly aims for algorithm independence from US standards in case of cryptopolitical fragmentation. Several KpqC submissions are also NIST on-ramp candidates (e.g., HAETAE), creating a deliberate two-track validation path.",
    url: 'https://www.kpqc.or.kr/',
    nistRelation: 'parallel',
  },
  {
    id: 'cacr-china',
    name: 'CACR PQC Competition (China)',
    region: 'China',
    depth: 'drill-down',
    stage: 'finalists',
    role: 'Chinese Association for Cryptologic Research national PQC contest, complemented by OSCCA standards work.',
    detail:
      'CACR, a research organisation rather than a standardisation body, ran a competition beginning in 2018 that covered both symmetric and asymmetric algorithms, aiming to prompt new post-quantum designs rather than to standardise new schemes.',
    url: 'https://www.cacrnet.org.cn/',
    nistRelation: 'parallel',
  },
  {
    id: 'iso-iec-sc27',
    name: 'ISO/IEC JTC 1 / SC 27',
    region: 'International',
    depth: 'drill-down',
    stage: 'standardised',
    role: 'International standards body adopting NIST PQC outputs as ISO/IEC standards.',
    detail:
      'SC 27 / WG 2 is integrating NIST PQC algorithms into the ISO/IEC 18033 (encryption) and ISO/IEC 14888 (digital signatures) families. ISO/IEC 14888-4 was published in June 2024 and covers stateful signature mechanisms with appendix whose security rests on the properties of the hash function beneath them.',
    url: 'https://www.iso.org/committee/45306.html',
    nistRelation: 'aligned',
  },

  // ── Survey: lighter mentions ───────────────────────────────────────────
  {
    id: 'cryptrec',
    name: 'CRYPTREC (Japan)',
    region: 'Japan',
    depth: 'survey',
    stage: 'monitoring',
    role: 'Japanese government cryptographic algorithm evaluation programme.',
    detail:
      'CRYPTREC maintains the e-Government Recommended Ciphers List and monitors PQC developments. Expected to add NIST PQC algorithms to the monitored list once domestic implementation guidance is mature.',
    url: 'https://www.cryptrec.go.jp/en/',
    nistRelation: 'aligned',
  },
  {
    id: 'ietf',
    name: 'IETF (CFRG, pquip, lamps)',
    region: 'International (standards-setting)',
    depth: 'survey',
    stage: 'evaluation',
    role: 'Internet protocol integration — PQC bindings to TLS, IPsec, SSH, X.509, JOSE/COSE.',
    detail:
      'CFRG reviews PQC primitives for IETF use; the pquip WG produces deployment guidance; lamps defines X.509 PQC bindings (e.g., ML-DSA OIDs, hybrid composite signatures); tls WG specifies hybrid key exchange. The codepoints, not the math, are decided here.',
    url: 'https://datatracker.ietf.org/wg/pquip/about/',
    nistRelation: 'overlay',
  },
  {
    id: 'etsi-qsc',
    name: 'ETSI Quantum-Safe Cryptography',
    region: 'Europe',
    depth: 'survey',
    stage: 'evaluation',
    role: 'European telecom-focused technical reports and migration guidance.',
    detail:
      "ETSI TC CYBER's Quantum-Safe Cryptography WG publishes technical reports on PQC migration, while ETSI TS 119 312 lists cryptographic suites for creating and validating digital signatures, electronic timestamps, and related certificates.",
    url: 'https://www.etsi.org/technologies/quantum-safe-cryptography',
    nistRelation: 'overlay',
  },
  {
    id: 'eu-pqcrypto',
    name: 'EU PQ-Crypto research stream',
    region: 'European Union',
    depth: 'survey',
    stage: 'evaluation',
    role: 'Horizon Europe funding for research on the transition to quantum-resistant cryptography.',
    detail:
      'The European Commission designs supportive measures on PQC with actions under the Digital Europe Programme and the Horizon Europe Programme (EU NIS Cooperation Group roadmap, June 2025). Horizon Europe included a call, “Transition towards Quantum-Resistant Cryptography” (HORIZON-CL3-2022-CS-01), which closed on 16 November 2022 (GSMA PQ.01, February 2023). Not a standards body.',
    url: 'https://cordis.europa.eu/',
    nistRelation: 'aligned',
  },
  {
    id: 'bsi',
    name: 'BSI (Germany)',
    region: 'Germany',
    depth: 'survey',
    stage: 'standardised',
    role: 'German federal IT security agency; publishes Technical Guidelines (TR-02102) covering recommended algorithms.',
    detail:
      'BSI maintains a conservative position — recommends hybrid PQC + classical combinations and continues to list FrodoKEM as an acceptable lattice-conservative KEM fallback alongside ML-KEM. Authoritative reference for German federal procurement.',
    url: 'https://www.bsi.bund.de/EN/Topics/Cryptography/cryptography_node.html',
    nistRelation: 'overlay',
  },
  {
    id: 'anssi',
    name: 'ANSSI (France)',
    region: 'France',
    depth: 'survey',
    stage: 'standardised',
    role: 'French national cybersecurity agency; mandatory hybrid PQC for high-sensitivity systems.',
    detail:
      'ANSSI position: PQC alone is too young — production deployments must use hybrid (classical + PQC). Issued guidance specifying acceptable hybrid combinations and migration phases for French government and CIIP-classified operators.',
    url: 'https://cyber.gouv.fr/en/publications',
    nistRelation: 'overlay',
  },
]

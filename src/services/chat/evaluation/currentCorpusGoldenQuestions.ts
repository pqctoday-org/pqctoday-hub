// SPDX-License-Identifier: AGPL-3.0-only
import type { QueryIntent } from '../RetrievalService'

/**
 * Questions added for the September 2026 corpus expansion.
 *
 * Keep this fixture reusable: the retrieval regression suite and the optional
 * on-device model comparison must evaluate the same questions. Prefixes point
 * at the corpus records that actually contain the answer, rather than merely
 * topically related records.
 */
export interface CurrentCorpusGoldenQuestion {
  id: string
  query: string
  expectedIntent: QueryIntent
  mustInclude: string[]
  /** Answer-bearing prefixes expected from semantic search for this phrasing. */
  semanticMustInclude: string[]
  expectedSources: string[]
  minTop5Hits: number
  /** Terms expected in a useful grounded answer; used by the model A/B runner. */
  answerTerms: string[]
}

export const CURRENT_CORPUS_BASELINE = {
  // Generation date (UTC) of the corpus the golden questions were last calibrated
  // against: 4.138.0, 18,000 chunks, 2026-10-01. golden-queries.test.ts requires
  // the shipped corpus to be this generation or NEWER, so a routine reindex does
  // not need a bump here. Raise it only when the golden questions are
  // recalibrated against a newer corpus.
  generatedDate: '2026-10-01',
  // Floor against a shrunken corpus. Lowered 2026-10-03 for 4.146.0 (17,082
  // chunks): that release stopped indexing the 1,133 deprecated patent rows the
  // Patents page does not show (their links opened "not found") — a deliberate
  // drop, not a loss. Same ~10-chunk margin as before (18,000 → 17,990).
  minimumChunkCount: 17_070,
} as const

export const CURRENT_CORPUS_GOLDEN_QUESTIONS: CurrentCorpusGoldenQuestion[] = [
  {
    id: 'learning-modules-available',
    query: 'What learning modules are available?',
    expectedIntent: 'catalog_lookup',
    mustInclude: ['user-manual-learn'],
    semanticMustInclude: ['user-manual-learn'],
    expectedSources: ['user-manual', 'modules'],
    minTop5Hits: 1,
    answerTerms: ['75', 'Foundations', 'Applied Crypto'],
  },
  {
    id: 'ml-kem-supporting-libraries',
    query: 'Which cryptographic libraries in the PQC Today catalog support ML-KEM?',
    expectedIntent: 'catalog_lookup',
    mustInclude: ['software-openssl', 'software-bouncy-castle-java'],
    semanticMustInclude: ['software-openssl', 'software-bouncy-castle-java'],
    expectedSources: ['migrate'],
    minTop5Hits: 1,
    answerTerms: ['ML-KEM', 'OpenSSL', 'Bouncy Castle'],
  },
  {
    id: 'rfc-9881-ml-dsa-x509',
    query: 'What does RFC 9881 standardize for ML-DSA certificates?',
    expectedIntent: 'standard_query',
    mustInclude: ['library-RFC 9881', 'glossary-182'],
    semanticMustInclude: ['glossary-182'],
    expectedSources: ['library'],
    minTop5Hits: 1,
    answerTerms: ['RFC 9881', 'ML-DSA', 'X.509'],
  },
  {
    id: 'rfc-9941-ssh-hybrid',
    query: 'How does RFC 9941 protect SSH with post-quantum key exchange?',
    expectedIntent: 'standard_query',
    mustInclude: ['library-RFC 9941'],
    semanticMustInclude: ['doc-enrichment-International:IETF — RFC 9941'],
    expectedSources: ['library'],
    minTop5Hits: 1,
    answerTerms: ['RFC 9941', 'SSH', 'sntrup761'],
  },
  {
    id: 'fips-206-status',
    query: 'Has NIST published FIPS 206 or released a public draft?',
    expectedIntent: 'standard_query',
    mustInclude: ['glossary-168'],
    semanticMustInclude: ['glossary-168'],
    expectedSources: ['glossary'],
    minTop5Hits: 1,
    answerTerms: ['FIPS 206', 'not published', 'FN-DSA'],
  },
  {
    id: 'anssi-cnsa-hybrid-disagreement',
    query: 'How do ANSSI and CNSA 2.0 differ on hybrid PQC deployment?',
    expectedIntent: 'standard_query',
    mustInclude: ['library-ANSSI-PQC-Position-2022'],
    semanticMustInclude: ['reg-timeline-anssi'],
    expectedSources: ['library'],
    minTop5Hits: 0,
    answerTerms: ['ANSSI', 'CNSA 2.0', 'hybrid'],
  },
  {
    id: 'uae-pqc-index',
    query: 'What is the UAE Crypto Discovery Tool and PQC Index?',
    expectedIntent: 'catalog_lookup',
    mustInclude: ['doc-enrichment-United Arab Emirates:UAE CSC'],
    semanticMustInclude: ['timeline-244'],
    expectedSources: ['document-enrichment'],
    minTop5Hits: 0,
    answerTerms: ['UAE', 'national initiative', 'cryptographic inventory'],
  },
  {
    id: 'finma-migration-guidance',
    query: 'What does FINMA expect institutions to do for quantum-safe migration?',
    expectedIntent: 'definition',
    mustInclude: ['threat-FINA-010', 'trusted-source-finma'],
    semanticMustInclude: ['threat-FINA-010'],
    expectedSources: ['threats'],
    minTop5Hits: 1,
    answerTerms: ['FINMA', 'risk analysis', 'cryptographic inventory'],
  },
  {
    id: 'acvp-pqc-tests',
    query: 'Which post-quantum algorithms does NIST ACVP test?',
    expectedIntent: 'standard_query',
    mustInclude: ['library-NIST-ACVP'],
    semanticMustInclude: ['library-NIST-ACVP'],
    expectedSources: ['library'],
    minTop5Hits: 0,
    answerTerms: ['ACVP', 'ML-KEM', 'ML-DSA'],
  },
  {
    id: 'nist-2035-deadline',
    query: 'What does NIST IR 8547 require by 2035 for classical public-key cryptography?',
    expectedIntent: 'standard_query',
    mustInclude: ['glossary-170'],
    semanticMustInclude: ['reg-timeline-nist-deprecation'],
    expectedSources: ['glossary'],
    minTop5Hits: 1,
    answerTerms: ['2035', 'disallowance', 'classical public-key cryptography'],
  },
  {
    id: 'ml-kem-implementation-attacks',
    query: 'What implementation attack risks apply to ML-KEM-768?',
    expectedIntent: 'general',
    mustInclude: ['impl-attacks-ML-KEM-768'],
    semanticMustInclude: ['impl-attacks-ML-KEM-768'],
    expectedSources: ['implementation-attacks'],
    minTop5Hits: 1,
    answerTerms: ['ML-KEM-768', 'side-channel'],
  },
  {
    id: 'cap-module-pqc-101',
    query: 'What production tool capabilities should I require after PQC 101?',
    expectedIntent: 'catalog_lookup',
    mustInclude: ['cap-module-pqc-101'],
    semanticMustInclude: ['cap-module-pqc-101'],
    expectedSources: ['capability-checklist'],
    minTop5Hits: 1,
    answerTerms: ['FIPS 203', 'FIPS 204', 'ACVP'],
  },
  {
    id: 'cap-module-hybrid-crypto',
    query: 'How should I evaluate production tool capabilities and evidence for hybrid-crypto?',
    expectedIntent: 'recommendation',
    mustInclude: ['cap-module-hybrid-crypto'],
    semanticMustInclude: ['cap-module-hybrid-crypto'],
    expectedSources: ['capability-checklist'],
    minTop5Hits: 1,
    answerTerms: ['X25519MLKEM768', 'RFC 10024', 'pcap'],
  },
  {
    id: 'cap-module-hsm-pqc',
    query: 'How should I evaluate production tool capabilities for HSM PQC operations?',
    expectedIntent: 'recommendation',
    mustInclude: ['cap-module-hsm-pqc'],
    semanticMustInclude: ['cap-module-hsm-pqc'],
    expectedSources: ['capability-checklist'],
    minTop5Hits: 1,
    answerTerms: ['PKCS#11', 'ML-KEM', 'ML-DSA'],
  },
  {
    id: 'cap-playground-hybrid-encrypt',
    query:
      'What does the hybrid-encrypt playground check establish and what is its sandbox limitation?',
    expectedIntent: 'definition',
    mustInclude: ['cap-playground-hybrid-encrypt'],
    semanticMustInclude: ['cap-playground-hybrid-encrypt'],
    expectedSources: ['capability-checklist'],
    minTop5Hits: 1,
    answerTerms: ['SP 800-56C', 'FIPS 203', 'AES-256-GCM'],
  },
  {
    id: 'cap-playground-cacp-kmip',
    query:
      'What does the cacp-kmip playground check establish for OASIS KMIP 3.0 production tools?',
    expectedIntent: 'catalog_lookup',
    mustInclude: ['cap-playground-cacp-kmip'],
    semanticMustInclude: ['cap-playground-cacp-kmip'],
    expectedSources: ['capability-checklist'],
    minTop5Hits: 1,
    answerTerms: ['KMIP 3.0', 'TTLV', 'X25519MLKEM768'],
  },
  {
    id: 'cap-playground-hsm-capacity',
    query: 'What is the sandbox limitation of the hsm-capacity playground capability checklist?',
    expectedIntent: 'catalog_lookup',
    mustInclude: ['cap-playground-hsm-capacity'],
    semanticMustInclude: ['cap-playground-hsm-capacity'],
    expectedSources: ['capability-checklist'],
    minTop5Hits: 1,
    answerTerms: ['NVRAM', 'PKCS#11 v3.2', '3,309 B'],
  },
  {
    id: 'cap-business-roi-calculator',
    query:
      'What enterprise ITFM and FinOps tool capabilities are required in the roi-calculator capability checklist?',
    expectedIntent: 'catalog_lookup',
    mustInclude: ['cap-business-roi-calculator'],
    semanticMustInclude: ['cap-business-roi-calculator'],
    expectedSources: ['capability-checklist'],
    minTop5Hits: 1,
    answerTerms: ['ITFM', 'FinOps', 'CMDB'],
  },
  {
    id: 'cap-business-migration-verification',
    query:
      'What 5-point technical migration evidence is required in the migration-verification capability checklist?',
    expectedIntent: 'general',
    mustInclude: ['cap-business-migration-verification'],
    semanticMustInclude: ['cap-business-migration-verification'],
    expectedSources: ['capability-checklist'],
    minTop5Hits: 1,
    answerTerms: ['wire negotiation', 'tamper', 'dossier'],
  },
  {
    id: 'biz-exercise-cost-model-explorer',
    query:
      'In the cost-model-explorer decision exercise, what does a small spread between two estimates using the same incomplete inventory establish?',
    expectedIntent: 'general',
    mustInclude: ['biz-exercise-cost-model-explorer'],
    semanticMustInclude: ['biz-exercise-cost-model-explorer'],
    expectedSources: ['business-center'],
    minTop5Hits: 1,
    answerTerms: ['correlated', 'incomplete inventory', 'Monte Carlo'],
  },
  {
    id: 'biz-exercise-breach-simulator',
    query: 'In the breach-simulator decision exercise, what does the Mosca verdict compare?',
    expectedIntent: 'comparison',
    mustInclude: ['biz-exercise-breach-simulator'],
    semanticMustInclude: ['biz-exercise-breach-simulator'],
    expectedSources: ['business-center'],
    minTop5Hits: 1,
    answerTerms: ['Data lifetime', 'migration time', 'CRQC'],
  },
  {
    id: 'infographic-assumptions-tls-basics',
    query: 'What are the sample handshake latency and TCP initcwnd assumptions for tls-basics?',
    expectedIntent: 'definition',
    mustInclude: ['infographic-assumptions-tls-basics'],
    semanticMustInclude: ['infographic-assumptions-tls-basics'],
    expectedSources: ['module-content'],
    minTop5Hits: 1,
    answerTerms: ['RFC 6928', '14,600 B', 'X25519MLKEM768'],
  },
  {
    id: 'infographic-assumptions-pki-enrollment',
    query:
      'How do ML-KEM-768 keys prove possession in CMPv3 enrollment in the pki-enrollment-protocols sample assumptions?',
    expectedIntent: 'general',
    mustInclude: ['infographic-assumptions-pki-enrollment-protocols'],
    semanticMustInclude: ['infographic-assumptions-pki-enrollment-protocols'],
    expectedSources: ['module-content'],
    minTop5Hits: 1,
    answerTerms: ['POPOPrivKey', 'RFC 9810', 'RFC 10073'],
  },
  {
    id: 'infographic-assumptions-hsm-pqc',
    query:
      'What are the dual-partition HA and rollback assumptions for LMS and XMSS state in hsm-pqc?',
    expectedIntent: 'catalog_lookup',
    mustInclude: ['infographic-assumptions-hsm-pqc'],
    semanticMustInclude: ['infographic-assumptions-hsm-pqc'],
    expectedSources: ['module-content'],
    minTop5Hits: 1,
    answerTerms: ['SP 800-208', 'stateful', 'rollback'],
  },
  {
    id: 'rfc-10073-composite-ml-dsa',
    query: 'What does RFC 10073 standardize for Composite ML-DSA in X.509 PKI?',
    expectedIntent: 'standard_query',
    mustInclude: ['library-RFC-10073'],
    semanticMustInclude: ['library-RFC-10073'],
    expectedSources: ['library'],
    minTop5Hits: 1,
    answerTerms: ['RFC 10073', 'Composite ML-DSA', 'X.509'],
  },
]

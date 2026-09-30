// SPDX-License-Identifier: GPL-3.0-only
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
  generatedDate: '2026-09-30',
  minimumChunkCount: 17_990,
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
    answerTerms: ['62', 'Foundations', 'Applied Crypto'],
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
]

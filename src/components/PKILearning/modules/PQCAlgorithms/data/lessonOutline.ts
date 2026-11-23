// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The Learn tab's arrangement: sections, leads, blocks and the claim ids each block shows, in order. A lead or a
 * bridge only points at what follows; every statement of fact is a claim in ./sourceClaims.
 */
import type { SourceClaimId } from './sourceClaims'

export type PanelKind = 'none' | 'developers' | 'validation'

export interface OutlineBlock {
  heading: string
  /** `none` renders in the page; the others render in a collapsed role-tagged panel */
  panel: PanelKind
  /** One signpost sentence shown under the heading, or empty */
  bridge: string
  claims: SourceClaimId[]
}

export interface OutlineSection {
  id: string
  title: string
  lead: string
  blocks: OutlineBlock[]
  goDeeper: { label: string; to: string }[]
}

export const LESSON_OUTLINE: OutlineSection[] = [
  {
    id: 'two-jobs-new-tools',
    title: 'Two jobs, new tools',
    lead: 'This section introduces the core cryptographic jobs covered in this lesson and how they fit together in a system.',
    blocks: [
      {
        heading: 'Key establishment and key derivation',
        panel: 'none',
        bridge: '',
        claims: ['ALG-A25', 'ALG-A26', 'ALG-A27'],
      },
      {
        heading: 'Authentication and digital signatures',
        panel: 'none',
        bridge: 'Next, we look at the separate role of authentication and digital signatures.',
        claims: ['ALG-A28', 'ALG-A29', 'ALG-B03'],
      },
      {
        heading: 'Symmetric algorithms in the transition',
        panel: 'none',
        bridge:
          'Alongside public-key tools, this block looks at what published guidance says about symmetric cryptography.',
        claims: ['ALG-D21', 'ALG-E09'],
      },
    ],
    goDeeper: [
      { label: 'PQC 101', to: '/learn/pqc-101' },
      { label: 'Quantum Threats', to: '/learn/quantum-threats' },
      { label: 'TLS Basics', to: '/learn/tls-basics' },
    ],
  },
  {
    id: 'the-families-at-a-glance',
    title: 'The families at a glance',
    lead: 'This section introduces mathematical families and then discusses FALCON and HQC.',
    blocks: [
      {
        heading: 'Mathematical families',
        panel: 'none',
        bridge: '',
        claims: ['ALG-D03', 'ALG-D04', 'ALG-D28', 'ALG-D29', 'ALG-H05'],
      },
      {
        heading: 'FALCON and HQC',
        panel: 'none',
        bridge: 'The following points discuss FN-DSA and HQC.',
        claims: ['ALG-D05', 'ALG-D09', 'ALG-D10', 'ALG-D11', 'ALG-H07'],
      },
    ],
    goDeeper: [{ label: 'PQC Candidates & Lifecycle', to: '/learn/pqc-candidates' }],
  },
  {
    id: 'ml-kem-fips-203',
    title: 'ML-KEM (FIPS 203)',
    lead: 'This section introduces ML-KEM, then walks through its operations, parameter sets, sizes, and implementation panels.',
    blocks: [
      {
        heading: 'What ML-KEM is and how KEMs compare to classical methods',
        panel: 'none',
        bridge: '',
        claims: ['ALG-A01', 'ALG-A02', 'ALG-A14', 'ALG-A03', 'ALG-A23', 'ALG-A24'],
      },
      {
        heading: 'How key generation, encapsulation, and decapsulation work',
        panel: 'none',
        bridge:
          'With the concept of a KEM in place, we now trace the operations that establish a shared secret.',
        claims: ['ALG-A04', 'ALG-A05', 'ALG-A06', 'ALG-A07', 'ALG-A15'],
      },
      {
        heading: 'Parameter sets and sizes',
        panel: 'none',
        bridge: 'Next, we look at the available parameter sets and their byte sizes.',
        claims: ['ALG-A08', 'ALG-A09', 'ALG-A10', 'ALG-A11', 'ALG-A12', 'ALG-A13'],
      },
      {
        heading: 'Input checks, rejection handling, and key formats',
        panel: 'developers',
        bridge:
          'For developers, the standards specify concrete rules for input checking, rejection handling, and key storage.',
        claims: ['ALG-A17', 'ALG-A18', 'ALG-A16', 'ALG-A21', 'ALG-A22'],
      },
      {
        heading: 'Randomness and intermediate data requirements',
        panel: 'validation',
        bridge:
          'For validation engineers, the standard also sets requirements for random bit generation and intermediate data.',
        claims: ['ALG-A19', 'ALG-A20'],
      },
    ],
    goDeeper: [
      { label: 'Hybrid Cryptography', to: '/learn/hybrid-crypto' },
      { label: 'TLS Basics', to: '/learn/tls-basics' },
      { label: 'KMS', to: '/learn/kms-pqc' },
    ],
  },
  {
    id: 'ml-dsa-fips-204',
    title: 'ML-DSA (FIPS 204)',
    lead: 'This section covers ML-DSA, its core signing and verification operations, and its parameter sets and sizes. Expandable developer panels detail signing modes, context strings, pre-hashing, and key storage.',
    blocks: [
      {
        heading: 'What ML-DSA is and how it works',
        panel: 'none',
        bridge: '',
        claims: ['ALG-B01', 'ALG-B02', 'ALG-B11', 'ALG-B04', 'ALG-B05'],
      },
      {
        heading: 'Parameter sets and sizes',
        panel: 'none',
        bridge:
          'The following points list the parameter sets and their corresponding key and signature sizes.',
        claims: ['ALG-B06', 'ALG-B25', 'ALG-B08', 'ALG-B09', 'ALG-B10', 'ALG-H03', 'ALG-H04'],
      },
      {
        heading: 'Hedged and deterministic signing',
        panel: 'developers',
        bridge:
          'For developers, the standard specifies how signing randomness and signing modes are handled.',
        claims: ['ALG-B12', 'ALG-B22', 'ALG-B13', 'ALG-B14'],
      },
      {
        heading: 'Context strings, pre-hashing, and seed storage',
        panel: 'developers',
        bridge:
          'Additional developer options cover context strings, pre-hashing, and private-key storage.',
        claims: ['ALG-B15', 'ALG-B16', 'ALG-B17', 'ALG-B18', 'ALG-B19', 'ALG-B20'],
      },
    ],
    goDeeper: [
      { label: 'PKI', to: '/learn/pki-workshop' },
      { label: 'Code Signing', to: '/learn/code-signing' },
    ],
  },
  {
    id: 'hash-based-signatures-in-brief',
    title: 'Hash-based signatures in brief',
    lead: 'This section provides a brief introduction to hash-based signature schemes.',
    blocks: [
      {
        heading: 'SLH-DSA',
        panel: 'none',
        bridge: '',
        claims: ['ALG-C01', 'ALG-C02', 'ALG-C03', 'ALG-C05'],
      },
      {
        heading: 'LMS and XMSS',
        panel: 'none',
        bridge: 'Next, we contrast stateless schemes with stateful hash-based signatures.',
        claims: ['ALG-C10', 'ALG-C19', 'ALG-C16', 'ALG-C17'],
      },
      {
        heading: 'SLH-DSA parameter sets and signature sizes',
        panel: 'developers',
        bridge:
          'For developers, the following points summarize SLH-DSA parameter set options and representative sizes.',
        claims: ['ALG-C04', 'ALG-C07', 'ALG-C08'],
      },
      {
        heading: 'Validation and hardware-module requirements',
        panel: 'validation',
        bridge:
          'For validation engineers, the standards specify security category mappings and hardware-module constraints.',
        claims: ['ALG-C06', 'ALG-C18'],
      },
    ],
    goDeeper: [
      { label: 'SLH-DSA', to: '/learn/slh-dsa' },
      { label: 'Stateful Hash Signatures', to: '/learn/stateful-signatures' },
    ],
  },
  {
    id: 'how-standards-bodies-map-use-cases-to-algorithms',
    title: 'How standards bodies map use cases to algorithms',
    lead: "This section compares what named standards bodies and protocol specifications publish for post-quantum algorithms and parameter sets. Reading each body's stated position side by side helps you map requirements to your own environment.",
    blocks: [
      {
        heading: 'Security categories',
        panel: 'none',
        bridge: '',
        claims: ['ALG-D12', 'ALG-D13', 'ALG-D14'],
      },
      {
        heading: 'NIST',
        panel: 'none',
        bridge:
          'With security categories defined, we now compare what each named body publishes, starting with NIST.',
        claims: ['ALG-H01', 'ALG-A34', 'ALG-D19'],
      },
      {
        heading: 'NSA CNSA 2.0',
        panel: 'none',
        bridge: 'Next is the NSA CNSA 2.0 guidance and its stated scope.',
        claims: ['ALG-E17', 'ALG-E02', 'ALG-E03', 'ALG-E04'],
      },
      {
        heading: 'BSI',
        panel: 'none',
        bridge: 'Next is what the BSI publishes in its technical guideline.',
        claims: ['ALG-G19', 'ALG-G01', 'ALG-G04'],
      },
      {
        heading: 'ANSSI',
        panel: 'none',
        bridge: 'Next is the published position of ANSSI.',
        claims: ['ALG-G21', 'ALG-G11', 'ALG-G12'],
      },
      {
        heading: 'UK NCSC',
        panel: 'none',
        bridge: 'Here is what the UK NCSC publishes in its guidance.',
        claims: ['ALG-G22', 'ALG-G15'],
      },
      {
        heading: 'TLS 1.3',
        panel: 'none',
        bridge:
          'Finally, we look at how IETF specifications address post-quantum key establishment in TLS 1.3.',
        claims: ['ALG-F05', 'ALG-F10'],
      },
    ],
    goDeeper: [
      { label: 'Hybrid Cryptography', to: '/learn/hybrid-crypto' },
      { label: 'Crypto Agility', to: '/learn/crypto-agility' },
      { label: 'Compliance', to: '/learn/compliance-strategy' },
    ],
  },
  {
    id: 'common-pitfalls-noted-in-the-standards',
    title: 'Implementation considerations',
    lead: 'This section examines selected implementation and usage considerations.',
    blocks: [
      {
        heading: 'Pre-standard Kyber and Dilithium differences',
        panel: 'none',
        bridge: '',
        claims: ['ALG-A30', 'ALG-A31', 'ALG-B23', 'ALG-B24'],
      },
      {
        heading: 'KEM key confirmation and ephemeral key handling',
        panel: 'none',
        bridge:
          'Beyond algorithm versions, the guidance also highlights operational pitfalls in how KEMs are used.',
        claims: ['ALG-A32', 'ALG-A33'],
      },
      {
        heading: 'Stateful key reuse and compliance pitfalls',
        panel: 'developers',
        bridge:
          'For developers, the standards call out critical hazards around stateful key reuse and pre-standard implementations.',
        claims: ['ALG-C13', 'ALG-E05'],
      },
    ],
    goDeeper: [{ label: 'PQC Implementation Security', to: '/learn/pqc-implementation-security' }],
  },
]

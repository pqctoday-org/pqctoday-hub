// SPDX-License-Identifier: AGPL-3.0-only
//
// Migration asset taxonomy for the "PQC Migration Workbench" (/migrate redesign).
//
// The redesign reframes the Migrate page around the cryptography a user RUNS
// ("what you run") rather than a flat product directory. Each catalog product
// must surface under at least one asset/domain, otherwise it becomes
// unreachable once the standalone "Browse catalog" destination is removed.
//
// This file is the single source of truth for:
//   1. the domain taxonomy (replace-assets + foundation/tooling buckets),
//   2. the 10 seeded "replace what you run" assets (reference data, per handoff),
//   3. the decision taxonomy (Drop-in / Hybrid / Re-key / Roadmap / Mitigate),
//   4. `classifyProductDomain()` — the pure mapping from a catalog row
//      (category_name + infrastructure_layer) to a domain.
//
// The coverage invariant ("every active catalog row maps to a domain") is
// enforced by migrationAssets.coverage.test.ts. If the product catalog grows a
// new category that no keyword matches, that test fails — extend MATCH_RULES /
// LAYER_FALLBACK below rather than letting products silently disappear.

import type { PersonaId } from './learningPersonas'

// ---------------------------------------------------------------------------
// Domain ids
// ---------------------------------------------------------------------------

/** "Replace what you run" assets — a concrete crypto function a user operates. */
export type ReplaceAssetId =
  'tls' | 'vpn' | 'ssh' | 'email' | 'msg' | 'codesign' | 'certs' | 'hsm' | 'kms' | 'atrest'

/**
 * Foundation / cross-cutting buckets. These catch the ~70% of the catalog that
 * is NOT a 1:1 replacement for a single running asset (libraries, platforms,
 * network gear, tooling, government programs). Without these, the asset-first
 * IA would orphan most products.
 */
export type FoundationDomainId =
  | 'identity'
  | 'blockchain'
  | 'network'
  | 'hardware'
  | 'platform'
  | 'foundations'
  | 'discovery'
  | 'programs'

export type DomainId = ReplaceAssetId | FoundationDomainId

// ---------------------------------------------------------------------------
// Decision taxonomy — replaces "PQC status" with "what do I DO"
// ---------------------------------------------------------------------------

export type DecisionKey = 'dropin' | 'hybrid' | 'rekey' | 'roadmap' | 'mitigate'

export interface Decision {
  key: DecisionKey
  label: string
  /** maps to a semantic status token (see src/styles/index.css) */
  tone: 'success' | 'primary' | 'info' | 'warning' | 'destructive'
}

export const DECISIONS: Record<DecisionKey, Decision> = {
  dropin: { key: 'dropin', label: 'Upgrade / configure', tone: 'success' },
  hybrid: { key: 'hybrid', label: 'Evaluate transition mode', tone: 'primary' },
  rekey: { key: 'rekey', label: 'Re-key / re-wrap', tone: 'info' },
  roadmap: { key: 'roadmap', label: 'Check product evidence', tone: 'warning' },
  mitigate: { key: 'mitigate', label: 'Use interim controls', tone: 'destructive' },
}

// ---------------------------------------------------------------------------
// Domain registry — every domain the UI can render a section/list for
// ---------------------------------------------------------------------------

export interface DomainMeta {
  id: DomainId
  label: string
  /**
   * 'replace' → a thing you run, shown in the "What you run" master list with a
   * decision + wave. 'foundation' → cross-cutting building blocks / tooling /
   * programs, shown in a separate "Foundations & infrastructure" section so the
   * catalog stays fully reachable.
   */
  kind: 'replace' | 'foundation'
}

export const DOMAINS: Record<DomainId, DomainMeta> = {
  tls: { id: 'tls', label: 'TLS key exchange', kind: 'replace' },
  vpn: { id: 'vpn', label: 'IPsec / IKEv2 VPN', kind: 'replace' },
  ssh: { id: 'ssh', label: 'SSH remote access', kind: 'replace' },
  email: { id: 'email', label: 'Secure email', kind: 'replace' },
  msg: { id: 'msg', label: 'Messaging E2EE', kind: 'replace' },
  codesign: { id: 'codesign', label: 'Code & firmware signing', kind: 'replace' },
  certs: { id: 'certs', label: 'X.509 cert signatures', kind: 'replace' },
  hsm: { id: 'hsm', label: 'HSM-protected keys', kind: 'replace' },
  kms: { id: 'kms', label: 'Cloud KMS / key APIs', kind: 'replace' },
  atrest: { id: 'atrest', label: 'Data-at-rest encryption', kind: 'replace' },
  identity: { id: 'identity', label: 'Identity & access', kind: 'foundation' },
  blockchain: { id: 'blockchain', label: 'Blockchain & digital assets', kind: 'foundation' },
  network: { id: 'network', label: 'Network security & encryptors', kind: 'foundation' },
  hardware: { id: 'hardware', label: 'Cryptographic hardware', kind: 'foundation' },
  platform: { id: 'platform', label: 'Platforms & infrastructure', kind: 'foundation' },
  foundations: { id: 'foundations', label: 'Crypto libraries & frameworks', kind: 'foundation' },
  discovery: { id: 'discovery', label: 'Discovery & validation tooling', kind: 'foundation' },
  programs: { id: 'programs', label: 'National & sector PQC programs', kind: 'foundation' },
}

// ---------------------------------------------------------------------------
// Seeded "replace what you run" assets (reference data, per handoff §Domain model)
// ---------------------------------------------------------------------------

export interface ReplaceAsset {
  id: ReplaceAssetId
  label: string
  /** sub-label: where this typically runs */
  where: string
  classical: string
  target: string
  decision: DecisionKey
  /** sequencing wave (1 = external-facing first) */
  wave: 1 | 2 | 3 | 4
  /** harvest-now-decrypt-later exposure */
  hndl: boolean
  note: string
  /** personas for whom this asset floats to the top of the list */
  focusPersonas: PersonaId[]
}

export const REPLACE_ASSETS: ReplaceAsset[] = [
  {
    id: 'tls',
    label: 'TLS key exchange',
    where: 'Public web servers, load balancers, API gateways',
    classical: 'RSA-2048 / X25519',
    target: 'X25519 + ML-KEM-768 (example)',
    decision: 'dropin',
    wave: 1,
    hndl: true,
    note: 'A current general-purpose path is hybrid X25519 + ML-KEM-768 where both endpoints support a standardized profile. Treat this as an implementation example, not a universal setting: test clients and middleboxes, document fallback policy, and verify the profile your authority or sector requires. CNSA 2.0 uses ML-KEM-1024 for NSS, not this example parameter set.',
    focusPersonas: ['architect', 'executive', 'grc'],
  },
  {
    id: 'vpn',
    label: 'IPsec / IKEv2 VPN',
    where: 'Site-to-site tunnels, remote-access VPN concentrators',
    classical: 'RSA + ECDH',
    target: 'RFC 9370 + a profiled PQ KEM',
    decision: 'dropin',
    wave: 1,
    hndl: true,
    note: 'RFC 9370 defines how IKEv2 can perform multiple key exchanges; it does not itself assign ML-KEM transform identifiers or prove that a product implements a particular profile. Verify the applicable IETF/authority profile, both peers, firmware, validation boundary, and downgrade behavior. NSA has identified an IKE hybrid construction for CNSA 2.0 use.',
    focusPersonas: ['architect'],
  },
  {
    id: 'certs',
    label: 'X.509 cert signatures',
    where: 'Internal PKI, TLS server/client certs, document signing',
    classical: 'RSA-2048 / ECDSA',
    target: 'ML-DSA PKI (profile-dependent)',
    decision: 'hybrid',
    wave: 2,
    hndl: false,
    note: 'Plan an application-specific PKI transition only after the certificate/profile standards and relying-party support are identified. NIST discusses dual-signature techniques but leaves their use to each application. For NSS, NSA FAQ v2.2 instead describes parallel classical and quantum-resistant PKIs and says not to invent multiple-algorithm certificates.',
    focusPersonas: ['architect'],
  },
  {
    id: 'ssh',
    label: 'SSH remote access',
    where: 'Server administration, automation, jump hosts',
    classical: 'ECDSA / ECDH',
    target: 'mlkem768x25519',
    decision: 'dropin',
    wave: 2,
    hndl: false,
    note: 'OpenSSH 10.0 made mlkem768x25519-sha256 its default key exchange after OpenSSH 9.9 introduced it. Upgrade and test both endpoints, but assess host/user authentication separately: changing key exchange does not migrate signature credentials and is not a claim of CNSA 2.0 conformance.',
    focusPersonas: ['architect'],
  },
  {
    id: 'codesign',
    label: 'Code & firmware signing',
    where: 'Software releases, firmware images, package repositories',
    classical: 'RSA-3072 / ECDSA',
    target: 'ML-DSA / hash-based signatures (policy-dependent)',
    decision: 'hybrid',
    wave: 2,
    hndl: false,
    note: 'Choose the signature scheme from the policy and verifier profile for the product. General NIST standards include ML-DSA and SLH-DSA; CNSA 2.0 instead specifies ML-DSA-87 for general signatures and allows LMS/XMSS for software or firmware, while FAQ v2.2 says SLH-DSA is not approved for NSS. Inventory immutable verifiers and update paths before changing signatures.',
    focusPersonas: ['architect', 'developer'],
  },
  {
    id: 'hsm',
    label: 'HSM-protected keys',
    where: 'Network/cloud HSMs, root-of-trust key custody',
    classical: 'RSA-wrapped',
    target: 'ML-DSA / ML-KEM',
    decision: 'roadmap',
    wave: 3,
    hndl: false,
    note: 'PQC support depends on the device, firmware, API and validation boundary. PKCS#11 v3.2 mechanism definitions do not mean that a particular HSM implements them or that its FIPS 140-3 certificate covers PQC. Check the vendor evidence and certificate security policy before committing a timeline.',
    focusPersonas: ['ops'],
  },
  {
    id: 'kms',
    label: 'Cloud KMS / key APIs',
    where: 'Cloud key-management services, envelope encryption',
    classical: 'RSA/ECDH TLS',
    target: 'PQC-capable transport and key services',
    decision: 'roadmap',
    wave: 3,
    hndl: true,
    note: 'Separate the KMS API transport from the key operations performed by the service. A hybrid TLS endpoint does not establish PQC support for stored-key generation, wrapping, signing or the provider HSM. Verify each operation and its validation boundary in provider evidence.',
    focusPersonas: ['ops', 'executive', 'grc', 'developer'],
  },
  {
    id: 'msg',
    label: 'Messaging E2EE',
    where: 'Secure messengers, real-time collaboration',
    classical: 'X25519 ratchet',
    target: 'PQC-enhanced agreement (protocol-specific)',
    decision: 'dropin',
    wave: 3,
    hndl: false,
    note: 'Messaging protocols are migrating through protocol-specific constructions, versions and staged rollouts. Identify which conversations and devices actually negotiate the documented PQC mode; a product announcement or one PQC handshake does not establish end-to-end coverage.',
    focusPersonas: [],
  },
  {
    id: 'email',
    label: 'Secure email (S/MIME, PGP)',
    where: 'Encrypted email, long-retention archives',
    classical: 'RSA',
    target: 'PQC mail profiles (still ecosystem-dependent)',
    decision: 'mitigate',
    wave: 4,
    hndl: true,
    note: 'Do not infer deployable end-to-end PQC email from an algorithm implementation alone. Track the applicable S/MIME or OpenPGP profile, client and gateway interoperability, certificate support and product evidence. Use data-retention and compensating controls while the required ecosystem remains unavailable.',
    focusPersonas: [],
  },
  {
    id: 'atrest',
    label: 'Data-at-rest encryption',
    where: 'Disk/DB encryption, backups, object stores',
    classical: 'AES-256 + RSA wrap',
    target: 'AES-256 + PQC-aware key establishment',
    decision: 'rekey',
    wave: 4,
    hndl: true,
    note: 'AES-256 is not the main Shor-algorithm exposure, but the surrounding key establishment, wrapping, recovery and access paths may use RSA or ECC. Whether re-wrapping is sufficient or data must be re-encrypted depends on the architecture, key hierarchy, retention and assurance requirements.',
    focusPersonas: ['ops', 'developer'],
  },
]

// ---------------------------------------------------------------------------
// Classifier — catalog row → domain
// ---------------------------------------------------------------------------
//
// Ordered keyword rules over `category_name` (case-insensitive substring),
// first match wins, then an infrastructure_layer fallback. Mirrors the audited
// Python pass that maps 852/852 active rows. KEEP THE ORDER: more specific
// domains must precede broader catch-alls (e.g. 'codesign' before 'certs',
// 'foundations' before 'programs').

const MATCH_RULES: ReadonlyArray<readonly [DomainId, readonly string[]]> = [
  ['tls', ['tls', 'ssl']],
  ['vpn', ['vpn', 'ipsec', 'secure tunnel']],
  ['ssh', ['ssh', 'remote access', 'vdi']],
  ['email', ['email', 'collaboration']],
  ['msg', ['messaging', 'secure communication', 'message broker', 'communications']],
  [
    'codesign',
    [
      'code signing',
      'software integrity',
      'secure boot',
      'firmware',
      'supply chain',
      'devsecops',
      'ci/cd',
      'artifact',
    ],
  ],
  ['certs', ['pki', 'public key infrastructure', 'certificate', 'digital signature']],
  [
    'hsm',
    [
      'hsm',
      'hardware security module',
      'trusted platform module',
      'tpm',
      'secure element',
      'smart card',
      // Payment HSMs / payment cryptography systems (payShield, Vectera, etc.).
      // Precise phrase so "Payment PQC Research" still falls through to programs.
      'payment cryptography',
    ],
  ],
  ['kms', ['key management', 'kms', 'secrets', 'key manag']],
  [
    'atrest',
    [
      'data storage',
      'storage',
      'database encryption',
      'disk and file',
      'disk',
      'file encryption',
      'data security',
      'data-at-rest',
      'backup',
      'data protection',
    ],
  ],
  ['identity', ['identity', 'iam', 'ciam', 'verifiable credential']],
  // NOTE: do NOT add bare 'payment' here — payment cryptography systems are
  // routed to 'hsm' above; 'cbdc' stays (central-bank digital currency is DLT).
  ['blockchain', ['blockchain', 'dlt', 'digital asset', 'custody', 'cbdc']],
  // discovery/tooling is more specific than the broad 'platform'/'network'
  // catch-alls below — e.g. "Cryptographic Discovery Platforms" is tooling, not
  // a generic platform — so it must rank ahead of them.
  ['discovery', ['discovery', 'analyzer', 'testing', 'validation', 'security testing']],
  [
    'network',
    [
      'network',
      '5g',
      'telecom',
      'dns',
      'sase',
      'zero trust',
      'cdn',
      'edge',
      'satellite',
      'space',
      'railway',
      'automotive',
      'file transfer',
      'time protocol',
      'ntp',
    ],
  ],
  // Cryptographic hardware: chips/semiconductors, PQC hardware IP/accelerators,
  // confidential computing. MUST precede 'platform' (which would otherwise
  // catch 'confidential computing' / hardware via its broad list + the Hardware
  // layer fallback). IoT *hardware* is handled layer-aware in the classifier.
  [
    'hardware',
    [
      'semiconductor',
      'pqc hardware',
      'hardware accelerator',
      'hardware ip',
      'confidential computing',
    ],
  ],
  [
    'platform',
    [
      'operating system',
      'application server',
      'web server',
      'web browser',
      'browser',
      'container',
      'orchestration',
      'service mesh',
      'cloud',
      'confidential computing',
      'iot',
      'ot security',
      'industrial control',
      'enterprise server',
      'enterprise platform',
      'platform',
      'os ',
      'printing',
      'ai/ml',
      'machine learning',
      'microcontroller',
      'embedded',
      'developer platform',
      'it automation',
      'encryptor',
    ],
  ],
  [
    'foundations',
    [
      'library',
      'libraries',
      'sdk',
      'agility',
      'provider',
      'crypto provider',
      'qrng',
      'random number',
      'quantum key distribution',
      'qkd',
      'quantum encryption',
      'quantum key',
      'quantum-safe',
      'quantum random',
    ],
  ],
  [
    'programs',
    [
      'national',
      'regional',
      'continental',
      'strategy',
      'program',
      'roadmap',
      'research',
      'r&d',
      'mandate',
      'guidance',
      'standard',
      'migration platform',
      'migration',
      'education',
      'testbed',
      'qci',
      'qsn',
      'healthcare',
      'defense',
      'bank',
    ],
  ],
]

const LAYER_FALLBACK: ReadonlyArray<readonly [string, DomainId]> = [
  ['librar', 'foundations'],
  ['hardware', 'platform'],
  ['network', 'network'],
  ['cloud', 'platform'],
  ['database', 'atrest'],
  ['security stack', 'network'],
  ['secsoftware', 'network'],
  ['appservers', 'platform'],
  ['application', 'platform'],
]

/**
 * Map a catalog product to a single domain. Returns `null` only if no rule
 * matches — which the coverage test forbids for any active catalog row.
 */
export function classifyProductDomain(
  categoryName: string,
  infrastructureLayer: string
): DomainId | null {
  const cat = (categoryName || '').toLowerCase()
  const layer = (infrastructureLayer || '').toLowerCase()
  // IoT *hardware* → cryptographic hardware; IoT software/cloud stays in
  // platform (handled by the 'iot' keyword in the platform rule below).
  if (cat.includes('iot') && layer.includes('hardware')) return 'hardware'
  for (const [domain, keywords] of MATCH_RULES) {
    for (const kw of keywords) {
      if (cat.includes(kw)) return domain
    }
  }
  for (const [needle, domain] of LAYER_FALLBACK) {
    if (layer.includes(needle)) return domain
  }
  if (layer === 'os') return 'platform'
  return null
}

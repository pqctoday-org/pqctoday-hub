// SPDX-License-Identifier: GPL-3.0-only
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
  | 'tls'
  | 'vpn'
  | 'ssh'
  | 'email'
  | 'msg'
  | 'codesign'
  | 'certs'
  | 'hsm'
  | 'kms'
  | 'atrest'

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
  /** true → a GA quantum-safe path exists (counts toward readiness %). */
  ready: boolean
}

export const DECISIONS: Record<DecisionKey, Decision> = {
  dropin: { key: 'dropin', label: 'Drop-in', tone: 'success', ready: true },
  hybrid: { key: 'hybrid', label: 'Hybrid config', tone: 'primary', ready: true },
  rekey: { key: 'rekey', label: 'Re-key', tone: 'info', ready: true },
  roadmap: { key: 'roadmap', label: 'Track roadmap', tone: 'warning', ready: false },
  mitigate: { key: 'mitigate', label: 'Mitigate', tone: 'destructive', ready: false },
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
  /** CNSA 2.0 deadline year driving urgency */
  cnsaYear: number
  /** harvest-now-decrypt-later exposure */
  hndl: boolean
  deadlineLabel: string
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
    target: 'ML-KEM-768',
    decision: 'dropin',
    wave: 1,
    cnsaYear: 2025,
    hndl: true,
    deadlineLabel: 'External-facing — highest HNDL exposure',
    note: 'Enable hybrid X25519+ML-KEM-768 key exchange on edge TLS terminators. Drop-in for modern stacks (OpenSSL 3.5+, BoringSSL, recent CDNs) — no application change required.',
    focusPersonas: ['architect'],
  },
  {
    id: 'vpn',
    label: 'IPsec / IKEv2 VPN',
    where: 'Site-to-site tunnels, remote-access VPN concentrators',
    classical: 'RSA + ECDH',
    target: 'ML-KEM-1024',
    decision: 'dropin',
    wave: 1,
    cnsaYear: 2030,
    hndl: true,
    deadlineLabel: 'Long-lived tunnels — harvest-now risk',
    note: 'Use IKEv2 multiple-key-exchange (RFC 9370) with ML-KEM-1024. Most enterprise VPN vendors ship or roadmap this; verify firmware level before relying on it.',
    focusPersonas: ['architect'],
  },
  {
    id: 'certs',
    label: 'X.509 cert signatures',
    where: 'Internal PKI, TLS server/client certs, document signing',
    classical: 'RSA-2048 / ECDSA',
    target: 'ML-DSA-65',
    decision: 'hybrid',
    wave: 2,
    cnsaYear: 2030,
    hndl: false,
    deadlineLabel: 'CNSA 2.0 signature deadline',
    note: 'Issue hybrid / composite certificates (ML-DSA-65 + ECDSA) during transition. Requires CA + relying-party support; plan a dual-trust period.',
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
    cnsaYear: 2030,
    hndl: false,
    deadlineLabel: 'CNSA 2.0 deadline',
    note: 'OpenSSH 9.x defaults to the hybrid mlkem768x25519-sha256 key exchange. Upgrade clients + servers; no key reissue needed for the KEX itself.',
    focusPersonas: ['architect'],
  },
  {
    id: 'codesign',
    label: 'Code & firmware signing',
    where: 'Software releases, firmware images, package repositories',
    classical: 'RSA-3072 / ECDSA',
    target: 'ML-DSA-65 / SLH-DSA',
    decision: 'hybrid',
    wave: 2,
    cnsaYear: 2030,
    hndl: false,
    deadlineLabel: 'Firmware outlives the signing key',
    note: 'Adopt SLH-DSA (stateless, conservative) or ML-DSA for long-lived firmware. Verifiers in the field must understand the new algorithm before you switch — stage a hybrid signature period.',
    focusPersonas: ['architect'],
  },
  {
    id: 'hsm',
    label: 'HSM-protected keys',
    where: 'Network/cloud HSMs, root-of-trust key custody',
    classical: 'RSA-wrapped',
    target: 'ML-DSA / ML-KEM',
    decision: 'roadmap',
    wave: 3,
    cnsaYear: 2030,
    hndl: false,
    deadlineLabel: 'Gated on vendor firmware',
    note: 'PQC support depends on HSM firmware + PKCS#11 v3.2. Track your vendor roadmap; validate FIPS 140-3 PQC module status before committing migration timelines.',
    focusPersonas: ['ops'],
  },
  {
    id: 'kms',
    label: 'Cloud KMS / key APIs',
    where: 'Cloud key-management services, envelope encryption',
    classical: 'RSA/ECDH TLS',
    target: 'ML-KEM hybrid TLS',
    decision: 'roadmap',
    wave: 3,
    cnsaYear: 2030,
    hndl: true,
    deadlineLabel: 'API transport carries HNDL risk',
    note: 'The KMS API transport (TLS) is the near-term exposure; key-wrap algorithm support follows the provider roadmap. Prefer providers exposing hybrid KEM key-wrap.',
    focusPersonas: ['ops'],
  },
  {
    id: 'msg',
    label: 'Messaging E2EE',
    where: 'Secure messengers, real-time collaboration',
    classical: 'X25519 ratchet',
    target: 'ML-KEM ratchet',
    decision: 'dropin',
    wave: 3,
    cnsaYear: 2033,
    hndl: false,
    deadlineLabel: 'Forward-secret but harvestable',
    note: 'Protocols like PQXDH add ML-KEM to the key agreement. If you run a platform, upgrade the protocol library; if you consume one, track the vendor’s PQC ratchet rollout.',
    focusPersonas: [],
  },
  {
    id: 'email',
    label: 'Secure email (S/MIME, PGP)',
    where: 'Encrypted email, long-retention archives',
    classical: 'RSA',
    target: 'ML-KEM + ML-DSA',
    decision: 'mitigate',
    wave: 4,
    cnsaYear: 2033,
    hndl: true,
    deadlineLabel: 'No GA quantum-safe product yet',
    note: 'PQC S/MIME (LAMPS composite) is still draft-stage with no GA product. Mitigate: shorten retention of sensitive mail, gateway-encrypt with a hard sunset date, and track the LAMPS drafts.',
    focusPersonas: [],
  },
  {
    id: 'atrest',
    label: 'Data-at-rest encryption',
    where: 'Disk/DB encryption, backups, object stores',
    classical: 'AES-256 + RSA wrap',
    target: 'AES-256 + ML-KEM wrap',
    decision: 'rekey',
    wave: 4,
    cnsaYear: 2035,
    hndl: true,
    deadlineLabel: 'Symmetric-safe; re-wrap the keys',
    note: 'AES-256 itself is quantum-resistant — the exposure is the RSA/ECDH key-wrapping of the data-encryption keys. Re-wrap DEKs under an ML-KEM hybrid KEK; no bulk re-encryption needed.',
    focusPersonas: ['ops'],
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
  for (const [domain, keywords] of MATCH_RULES) {
    for (const kw of keywords) {
      if (cat.includes(kw)) return domain
    }
  }
  const layer = (infrastructureLayer || '').toLowerCase()
  for (const [needle, domain] of LAYER_FALLBACK) {
    if (layer.includes(needle)) return domain
  }
  if (layer === 'os') return 'platform'
  return null
}

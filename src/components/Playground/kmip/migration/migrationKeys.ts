// SPDX-License-Identifier: GPL-3.0-only
//
// Migration tab — the seven-key classical estate and the policy rail.
//
// The single source of truth for what the estate contains. Every card
// generates its key LABEL-ONLY: the OpSpec carries `name` (+ the usage
// intent) and nothing else — which algorithm each label means is entirely
// the active policy's decision, via `name_pattern` rules in
// `public/kmip-policies/migration-*.yaml`. Keep the default labels in sync
// with those patterns (unit-tested in migrationKeys.test.ts).

export type MigrationKeyKind = 'symmetric' | 'kem' | 'sign'

export interface MigrationKeyConfig {
  /** Stable card id — NOT the label (labels are user-editable). */
  id: string
  /** Business-role key name the policies pattern-match on. */
  defaultLabel: string
  kind: MigrationKeyKind
  /** Human operation this key performs — shown on the card + migration map. */
  operation: string
  /** One-line business story shown on the card. */
  blurb: string
  /** What each policy resolves this label to (display hints for the migration
   * map; the ENGINE result is always what's shown live on the card/keystore). */
  classicalAlgorithm: string
  hybridAlgorithm: string
  pqcAlgorithm: string
}

export const MIGRATION_KEYS: MigrationKeyConfig[] = [
  {
    id: 'vault',
    defaultLabel: 'vault-archive-cipher',
    kind: 'symmetric',
    operation: 'Encrypt / Decrypt',
    blurb: 'Long-term records vault — bulk encryption at rest.',
    classicalAlgorithm: 'AES-256',
    hybridAlgorithm: 'AES-256',
    pqcAlgorithm: 'AES-256',
  },
  {
    id: 'payments',
    defaultLabel: 'payments-db-cipher',
    kind: 'symmetric',
    operation: 'Encrypt / Decrypt',
    blurb: 'Legacy payments database cipher, sized in 2014.',
    classicalAlgorithm: 'AES-128',
    hybridAlgorithm: 'AES-256',
    pqcAlgorithm: 'AES-256',
  },
  {
    id: 'partner',
    defaultLabel: 'partner-tls-kex',
    kind: 'kem',
    operation: 'Key agreement',
    blurb: 'Key agreement for the partner TLS channel.',
    classicalAlgorithm: 'X25519',
    hybridAlgorithm: 'X25519MLKEM768',
    pqcAlgorithm: 'ML-KEM-768',
  },
  {
    id: 'interbank',
    defaultLabel: 'interbank-vpn-kex',
    kind: 'kem',
    operation: 'Key agreement',
    blurb: 'Key agreement for the interbank VPN backbone.',
    classicalAlgorithm: 'X448',
    hybridAlgorithm: 'X25519MLKEM768',
    pqcAlgorithm: 'ML-KEM-1024',
  },
  {
    id: 'firmware',
    defaultLabel: 'firmware-release-signing',
    kind: 'sign',
    operation: 'Sign / Verify',
    blurb: 'Signs every firmware release the fleet installs.',
    classicalAlgorithm: 'RSA-2048',
    hybridAlgorithm: 'ML-DSA-44',
    pqcAlgorithm: 'ML-DSA-44',
  },
  {
    id: 'api',
    defaultLabel: 'api-gateway-signing',
    kind: 'sign',
    operation: 'Sign / Verify',
    blurb: 'Signs API gateway tokens (millions/day).',
    classicalAlgorithm: 'ECDSA-P256',
    hybridAlgorithm: 'ML-DSA-44',
    pqcAlgorithm: 'ML-DSA-44',
  },
  {
    id: 'code',
    defaultLabel: 'code-commit-signing',
    kind: 'sign',
    operation: 'Sign / Verify',
    blurb: 'Signs source-control commits and tags.',
    classicalAlgorithm: 'Ed25519',
    hybridAlgorithm: 'ML-DSA-44',
    pqcAlgorithm: 'ML-DSA-44',
  },
]

export interface MigrationPolicyChip {
  /** File under /kmip-policies/. */
  file: string
  name: string
  label: string
  blurb: string
  /** False while the policy ships in a later milestone — chip renders
   * disabled with the blurb as the explanation. */
  available: boolean
}

export const MIGRATION_POLICIES: MigrationPolicyChip[] = [
  {
    file: 'migration-classical.yaml',
    name: 'migration-classical',
    label: 'Classical',
    blurb: 'The estate as it runs today — label-mapped classical algorithms; PQC denied.',
    available: true,
  },
  {
    file: 'migration-hybrid.yaml',
    name: 'migration-hybrid',
    label: 'Hybrid',
    blurb:
      'Belt-and-braces: key agreement → X25519MLKEM768 (classical + PQC in one key), signing → ML-DSA-44. Exercise an at-risk key to migrate it. (Composite signatures are a later milestone.)',
    available: true,
  },
  {
    file: 'migration-pqc.yaml',
    name: 'migration-pqc',
    label: 'Full PQC',
    blurb:
      'Pure ML-KEM / ML-DSA targets. Switch, then exercise any at-risk key (Encrypt / Sign / Establish) — the engine rekeys it to its PQC successor on first use.',
    available: true,
  },
]

/** Dedicated PKCS#11 slot for the Migration tab's engine instance, so its
 * keystore is hermetic beside the Agility workbench (slot 0) and the corpus
 * replay's per-test slots (small integers alloc'd upward). */
export const MIGRATION_SLOT = 77

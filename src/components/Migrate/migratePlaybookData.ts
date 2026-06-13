// SPDX-License-Identifier: GPL-3.0-only
/**
 * Static reference content for the Phase-5 rollout playbook surfaced on /migrate.
 *
 * Closes Migrate gap-closer rows 4–7:
 *  - Wave-sequencing overlay (§5.4, p.105)        → MIGRATION_WAVES
 *  - Data-at-rest strategy chooser (§5.6, p.108)  → DATA_AT_REST_STRATEGIES
 *  - Defense-in-depth note (§5.5, p.106)          → DEFENSE_IN_DEPTH
 *  - AI-assisted-migration provenance (§5.7,p.109)→ AI_PROVENANCE_GATES
 *
 * Content-only; rendered by `MigratePlaybookPanel`. Additive — never shown until
 * the user opens the playbook section.
 */

export interface MigrationWave {
  wave: number
  title: string
  focus: string
  prerequisites: string[]
}

/** Wave 0–5 rollout ladder (framework §5.4 wave-sequencing). */
export const MIGRATION_WAVES: MigrationWave[] = [
  {
    wave: 0,
    title: 'Foundations & crypto-agility',
    focus:
      'Stand up dual-stack PKI, agility libraries, and a test harness before touching production.',
    prerequisites: ['Approved QRA / migration plan', 'Crypto-agile build pipeline'],
  },
  {
    wave: 1,
    title: 'Internet-facing & HNDL-exposed',
    focus:
      'Public TLS endpoints, VPN concentrators and anything harvesting-now-decrypt-later can reach.',
    prerequisites: ['Wave 0 complete', 'Hybrid KEM validated in staging'],
  },
  {
    wave: 2,
    title: 'Long-lived data & signatures',
    focus:
      'Data with a long confidentiality lifetime, code-signing and document-signing workflows.',
    prerequisites: ['Wave 1 stable', 'Signature algorithm + HSM firmware ready'],
  },
  {
    wave: 3,
    title: 'Internal services & east-west traffic',
    focus: 'Service mesh, internal mTLS, message queues and inter-service auth.',
    prerequisites: ['Wave 1–2 in production', 'Internal CA issuing hybrid certs'],
  },
  {
    wave: 4,
    title: 'Endpoints, identity & access',
    focus: 'Device certificates, IAM tokens, smartcards and client-side crypto.',
    prerequisites: ['Wave 3 rollout underway', 'Endpoint agents updated'],
  },
  {
    wave: 5,
    title: 'Legacy, embedded & constrained',
    focus:
      'Hard-to-change firmware, OT/embedded and constrained devices — plan compensating controls.',
    prerequisites: ['All prior waves done', 'Vendor PQC firmware available or mitigation in place'],
  },
]

export interface DataAtRestStrategy {
  id: 'reencrypt' | 'keywrap' | 'cryptoshred'
  title: string
  whenToUse: string
  tradeoff: string
}

/** Data-at-rest migration strategy chooser (framework §5.6). */
export const DATA_AT_REST_STRATEGIES: DataAtRestStrategy[] = [
  {
    id: 'reencrypt',
    title: 'Re-encrypt in place',
    whenToUse: 'Data must remain confidential for many years and you can afford a bulk rewrite.',
    tradeoff:
      'Highest assurance; most expensive — full read-decrypt-encrypt-write pass over the corpus.',
  },
  {
    id: 'keywrap',
    title: 'Key-wrap / envelope upgrade',
    whenToUse: 'Bulk data uses a DEK wrapped by a KEK — wrap the KEK with a PQC KEM instead.',
    tradeoff:
      'Cheap and fast; protects the key hierarchy but the bulk ciphertext stays classical-AES.',
  },
  {
    id: 'cryptoshred',
    title: 'Crypto-shred & re-issue',
    whenToUse: 'Data is short-lived or reproducible — destroy old keys and re-key new writes.',
    tradeoff: 'Cheapest; only safe when losing access to historical plaintext is acceptable.',
  },
]

/** Defense-in-depth layers to pair with PQC during the transition (framework §5.5). */
export const DEFENSE_IN_DEPTH: { title: string; detail: string }[] = [
  {
    title: 'AES-256 symmetric core',
    detail:
      'Grover only halves symmetric strength — AES-256 stays quantum-resistant under the bulk layer.',
  },
  {
    title: 'Tokenization',
    detail:
      'Replace sensitive values with tokens so the protected data never sits in the migrating store.',
  },
  {
    title: 'Network segmentation',
    detail:
      'Contain harvest-now-decrypt-later exposure by isolating systems that cannot yet go hybrid.',
  },
]

/** Human-review gates for AI-assisted migration (framework §5.7 provenance). */
export const AI_PROVENANCE_GATES: { title: string; detail: string }[] = [
  {
    title: 'Provenance tagging',
    detail: 'Record which migration changes were AI-suggested vs human-authored in the change log.',
  },
  {
    title: 'Human-review gate',
    detail:
      'No AI-generated crypto change reaches production without a named human reviewer sign-off.',
  },
  {
    title: 'Independent validation',
    detail: 'Re-run the test/interop suite on AI-modified code paths before promoting the wave.',
  },
]

// SPDX-License-Identifier: GPL-3.0-only
//
// Crypto Lab taxonomy — the editorial metadata the redesign layers on top of the
// tool registry: intent "verbs" (the "I want to…" row) and per-category
// sub-groups (so the big categories aren't a flat wall of cards).
//
// SINGLE SOURCE OF TRUTH, keyed by tool id so it works for both native tools and
// the GENERATED `sbx-*` sandbox tools (built from `sandboxScenarios.ts`). Seeded
// from the design handoff prototype (`crypto-lab/data.js`).
//
// This file is guarded by `cryptoLabTaxonomy.test.ts`: every grid tool must have
// ≥1 verb and must resolve to a real sub-group (never the "Other" fallback) in
// categories that define sub-groups. When a new sandbox scenario syncs in, that
// test goes red until it's filed here — so nothing can silently disappear.
import {
  PenLine,
  Lock,
  ArrowLeftRight,
  KeyRound,
  ScrollText,
  Network,
  Gauge,
  Search,
} from 'lucide-react'
import type React from 'react'
import type { WorkshopTool } from './workshopRegistry'

export type VerbId =
  | 'sign'
  | 'encrypt'
  | 'exchange'
  | 'keys'
  | 'certs'
  | 'simulate'
  | 'benchmark'
  | 'discover'

export interface Verb {
  id: VerbId
  label: string
  icon: React.ElementType
}

/** The intent row — "I want to…". Order here is display order. */
export const VERBS: readonly Verb[] = [
  { id: 'sign', label: 'Sign / verify', icon: PenLine },
  { id: 'encrypt', label: 'Encrypt / wrap', icon: Lock },
  { id: 'exchange', label: 'Key exchange', icon: ArrowLeftRight },
  { id: 'keys', label: 'Generate keys', icon: KeyRound },
  { id: 'certs', label: 'Certificates / PKI', icon: ScrollText },
  { id: 'simulate', label: 'Simulate a protocol', icon: Network },
  { id: 'benchmark', label: 'Size / benchmark', icon: Gauge },
  { id: 'discover', label: 'Discover / audit', icon: Search },
]

export const VALID_VERB_IDS: ReadonlySet<VerbId> = new Set(VERBS.map((v) => v.id))

/**
 * Tools surfaced ONLY as a marquee "environment" card (full app), never as a
 * single-concept grid/search card — kept in the registry for routing.
 *
 * The environment trio is the existing FEATURE_PLAYGROUNDS: Interactive / HSM /
 * KMIP. Only KMIP maps to a registry tool (`cacp-kmip` → /playground/cacp), so
 * only it is filtered to avoid double-listing. (Decision 2026-06-27: keep
 * "Interactive Playground", so `openssl-studio` stays a normal grid tool.)
 */
export const ENVIRONMENT_TOOL_IDS: ReadonlySet<string> = new Set(['cacp-kmip'])

/** Fallback bucket so an unfiled tool can never vanish from a grouped category. */
export const OTHER_GROUP = 'Other'

/** id → intent verbs. Every grid tool must appear here with ≥1 verb. */
export const VERB_TAGS: Record<string, VerbId[]> = {
  // ── HSM / PKCS#11 (browser) ──
  'slh-dsa': ['sign'],
  'lms-hss': ['sign', 'keys'],
  'hybrid-encrypt': ['encrypt', 'exchange'],
  'envelope-encrypt': ['encrypt'],
  'token-migration': ['sign'],
  'tee-channel': ['exchange', 'encrypt'],
  'firmware-signing': ['sign'],
  'kdf-derivation': ['exchange', 'keys'],
  'hsm-capacity': ['benchmark'],
  'hybrid-sigs': ['sign'],
  // ── Entropy & Random (browser) ──
  'rng-demo': ['keys'],
  'entropy-test': ['discover'],
  'qrng-demo': ['keys'],
  'source-combining': ['keys'],
  'drbg-demo': ['keys'],
  // ── Certificates & Proofs (browser) ──
  'pki-workshop': ['certs'],
  'hybrid-certs': ['certs'],
  'merkle-proof': ['certs', 'discover'],
  'cert-capacity': ['benchmark'],
  // ── Digital Identity (browser) ──
  'digital-id': ['certs'],
  // ── Blockchain & Digital Assets (browser) ──
  'bitcoin-flow': ['sign', 'keys'],
  'solana-flow': ['sign', 'keys'],
  'hd-wallet': ['keys'],
  // ── Protocol Simulations (browser) ──
  'tls-simulator': ['simulate'],
  'vpn-sim': ['simulate'],
  'pqc-ssh-sim': ['simulate'],
  'suci-flow': ['simulate', 'exchange'],
  'tpm-playground': ['simulate', 'keys'],
  'mls-group-messaging': ['simulate', 'exchange'],
  // ── OpenSSL Studio family (browser) ──
  'openssl-studio': ['keys', 'sign', 'encrypt', 'exchange', 'certs'],
  'pki-enrollment': ['certs'],
  'email-signing': ['sign', 'encrypt'],
  'api-security-jwt': ['sign', 'encrypt'],
  // ── Sandbox scenarios (Docker, access-gated) ──
  'sbx-tls': ['simulate'],
  'sbx-ssh': ['simulate'],
  'sbx-vpn': ['simulate'],
  // 'sbx-tpm-playground' omitted: WIP-gated in pqctoday-sandbox (empty,
  // unimplemented catalog stub — 07-2026 playground audit graded it F) and
  // dropped from the hub's sync:sandbox projection until real content lands.
  'sbx-pki': ['certs'],
  'sbx-cert-validation': ['certs'],
  'sbx-hybrid-certs': ['certs'],
  // 'sbx-mtc' omitted: removed from pqctoday-sandbox in v0.7.0 (#50).
  'sbx-cloud-kms': ['encrypt'],
  // 'sbx-secrets-vault' omitted: removed from pqctoday-sandbox in v0.6.0 —
  // performed no PQC at all (RSA-2048 key + AES-256-GCM symmetric wrap only;
  // its one X25519MLKEM768 probe wasn't mode-gated, so the classical run
  // also reported quantum_safe: true).
  'sbx-smime': ['sign', 'encrypt'],
  // 'sbx-wireguard' omitted: removed from pqctoday-sandbox in v0.9.0 — no
  // shipped PQ-WireGuard implementation to demo (Rosenpass is pre-standard
  // Kyber-512, not ML-KEM; upstream WireGuard/Mullvad have no usable release).
  'sbx-cbom-compliance': ['discover'],
  'sbx-tpm-pqc-migration': ['keys', 'certs'],
  'sbx-supply-chain-signing': ['sign'],
  'sbx-sequoia': ['sign'],
  // 'sbx-crypto-discovery' omitted: removed from pqctoday-sandbox in v0.6.0 —
  // only observed a hybrid group via `openssl s_client`, generated no key and
  // signed nothing; no PQC operation actually ran.
  'sbx-pqctoday-kmip': ['keys', 'sign', 'encrypt'],
  'sbx-sops': ['encrypt'],
  'sbx-browser-tls': ['simulate', 'discover'],
  'sbx-migration-impact': ['benchmark'],
  // 'sbx-haproxy' omitted: removed from pqctoday-sandbox in v0.6.0 — never
  // passed `-groups` (the flag was documented in a comment, not the actual
  // command); certificate was ECDSA P-256, every "post-quantum" output field
  // just restated the mode argument.
  'sbx-ab-handshake-bench': ['benchmark'],
  'sbx-hsm-perf-bench': ['benchmark'],
  // 'sbx-pqcflow' omitted: removed from pqctoday-sandbox in v0.6.0 — ran one
  // hybrid handshake purely to generate traffic to capture; implemented no
  // post-quantum cryptography itself.
  'sbx-api-security-jwt': ['sign'],
  'sbx-stepca': ['certs'],
  'sbx-database-postgres': ['simulate'],
  'sbx-firmware-hss': ['sign'],
  'sbx-osslsigncode': ['sign'],
  'sbx-iot-mqtt': ['simulate', 'benchmark'],
}

export interface SubGroup {
  label: string
  ids: string[]
}

/**
 * category → ordered sub-groups. Categories absent here render a flat grid.
 * Member ids must match each tool's REAL `category` in the registry (the test
 * enforces this).
 */
export const SUBGROUPS: Record<string, SubGroup[]> = {
  'HSM / PKCS#11': [
    {
      label: 'Signatures & attestation',
      ids: [
        'slh-dsa',
        'lms-hss',
        'token-migration',
        'firmware-signing',
        'hybrid-sigs',
        'sbx-firmware-hss',
      ],
    },
    {
      label: 'Encryption & key wrap',
      // 'sbx-secrets-vault' omitted: see VERB_TAGS comment above.
      ids: ['hybrid-encrypt', 'envelope-encrypt', 'tee-channel', 'sbx-cloud-kms', 'sbx-sops'],
    },
    {
      label: 'Key management & sizing',
      ids: ['kdf-derivation', 'sbx-pqctoday-kmip', 'sbx-tpm-pqc-migration', 'hsm-capacity'],
    },
  ],
  'Certificates & Proofs': [
    {
      label: 'Issuance & validation',
      ids: ['pki-workshop', 'sbx-pki', 'sbx-stepca', 'sbx-cert-validation'],
    },
    {
      label: 'Formats, proofs & sizing',
      // 'sbx-mtc' omitted: see VERB_TAGS comment above.
      ids: ['hybrid-certs', 'sbx-hybrid-certs', 'cert-capacity', 'merkle-proof'],
    },
    {
      label: 'Supply chain & signing',
      ids: ['sbx-supply-chain-signing', 'sbx-sequoia', 'sbx-osslsigncode', 'sbx-cbom-compliance'],
    },
  ],
  'Protocol Simulations': [
    {
      label: 'TLS & web',
      // 'sbx-haproxy' omitted: see VERB_TAGS comment above.
      ids: ['tls-simulator', 'sbx-tls', 'sbx-browser-tls', 'sbx-database-postgres'],
    },
    {
      label: 'SSH & VPN tunnels',
      ids: ['pqc-ssh-sim', 'sbx-ssh', 'vpn-sim', 'sbx-vpn'],
    },
    {
      label: 'Messaging & mobile',
      ids: ['mls-group-messaging', 'suci-flow', 'sbx-iot-mqtt'],
    },
    {
      label: 'Hardware & TPM',
      // 'sbx-tpm-playground' omitted: see VERB_TAGS comment above.
      ids: ['tpm-playground'],
    },
    {
      label: 'Benchmark & discovery',
      // 'sbx-crypto-discovery' / 'sbx-pqcflow' omitted: see VERB_TAGS comment above.
      ids: ['sbx-migration-impact', 'sbx-ab-handshake-bench', 'sbx-hsm-perf-bench'],
    },
  ],
}

/** Run context, derived — never stored on the registry. */
export function runFor(tool: WorkshopTool): 'browser' | 'sandbox' {
  return tool.sandbox ? 'sandbox' : 'browser'
}

/** Intent verbs for a tool id (empty if none assigned). */
export function verbsFor(id: string): VerbId[] {
  // eslint-disable-next-line security/detect-object-injection -- lookup by tool id
  return VERB_TAGS[id] ?? []
}

/**
 * Sub-group label for a tool within its category. Returns null for flat
 * categories; for grouped categories always returns a label — unfiled tools get
 * `OTHER_GROUP` so they can never disappear from the grid.
 */
export function subGroupFor(tool: WorkshopTool): string | null {
  const groups = SUBGROUPS[tool.category]
  if (!groups) return null
  const hit = groups.find((g) => g.ids.includes(tool.id))
  return hit ? hit.label : OTHER_GROUP
}

/** True when a tool is shown only as an environment card, not in the grid. */
export function isEnvironmentTool(id: string): boolean {
  return ENVIRONMENT_TOOL_IDS.has(id)
}

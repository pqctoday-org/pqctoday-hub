// SPDX-License-Identifier: GPL-3.0-only
/**
 * moduleToolLinks — the reverse of `WorkshopTool.moduleLink`, derived.
 *
 * Why this file exists (WS12 gap 3 / WS22 Phase 1 Stage 3, 2026-08-21):
 *   `ModuleShell` renders its "Related tool" footer link only when a manifest
 *   hand-declares `playgroundTool` — true for 17 of 65 modules. But the tool
 *   side already carries the same edge in the opposite direction: every
 *   non-sandbox `WorkshopTool` has a required, populated `moduleLink`
 *   (workshopRegistry.tsx), and those point at 19 distinct modules. Three of
 *   them — confidential-computing, iam-pqc, secure-boot-pqc — had a real tool
 *   pointing straight at them and rendered nothing back, purely because nobody
 *   filled in the reverse field. This is WS6d's own insight one hop further:
 *   "No new data, only surfacing what's already there."
 *
 * ── Why this is a checked-in constant and not a live import ────────────────
 * The obvious implementation reads `WORKSHOP_TOOLS` and inverts it at load
 * time. Measured 2026-08-21, that costs **2.11 MB of eager JS**: `ModuleShell`
 * is reached by all 64 non-custom module chunks, so a static edge from it into
 * `workshopRegistry` changes Rollup's shared-chunk assignment and folds the
 * registry into a bucket the eager `App` chunk already pulls. The precache
 * gate measured 16.24 MB against its 15.00 MB cap — a failed build.
 *
 * So the map is a plain literal with NO imports (the `ModuleManifest` import
 * below is type-only and erases), and `moduleRelations.driftguard.test.ts`
 * re-derives it from the real registry on every run and fails on any
 * difference. A new tool cannot ship with a moduleLink this file does not know
 * about — the guard, not a hand-maintained habit, is what keeps it true.
 *
 * Precedence: an explicitly declared `playgroundTool` always wins; this is the
 * fallback for the modules that never declared one.
 */
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

/** `/learn/iam-pqc?tab=workshop&step=2` → `iam-pqc`; anything else → null. */
export function moduleIdFromToolLink(moduleLink: string): string | null {
  if (!moduleLink.startsWith('/learn/')) return null
  const slug = moduleLink.slice('/learn/'.length).split(/[?#]/)[0]
  return slug ? slug : null
}

/**
 * module id → every browser-runnable tool whose `moduleLink` targets it, in
 * registry order. Derived from `WORKSHOP_TOOLS`; kept in sync by the drift
 * guard, never edited by hand from anything but the guard's output.
 *
 * B+ round 8, Wave B (2026-09-18 — WS17 signal 13): the single-valued map
 * below showed one tool per module, so the second to fifth tools that link to
 * a module (entropy-randomness has five) were never offered back from it.
 * ModuleShell renders the whole list now.
 */
export const TOOLS_BY_MODULE_ID: ReadonlyMap<string, readonly string[]> = new Map([
  ['pki-workshop', ['hsm-capacity', 'pki-workshop', 'cert-capacity']],
  ['hybrid-crypto', ['hybrid-encrypt', 'hybrid-sigs', 'hybrid-certs']],
  ['kms-pqc', ['envelope-encrypt', 'kdf-derivation']],
  ['iam-pqc', ['token-migration']],
  ['secure-boot-pqc', ['firmware-signing', 'tpm-playground']],
  ['slh-dsa', ['slh-dsa']],
  ['stateful-signatures', ['lms-hss']],
  ['confidential-computing', ['tee-channel']],
  ['tls-basics', ['tls-simulator']],
  ['vpn-ssh-pqc', ['vpn-sim', 'pqc-ssh-sim']],
  ['5g-security', ['suci-flow']],
  ['mls-group-messaging', ['mls-group-messaging']],
  [
    'entropy-randomness',
    ['rng-demo', 'qrng-demo', 'entropy-test', 'drbg-demo', 'source-combining'],
  ],
  ['merkle-tree-certs', ['merkle-proof']],
  ['digital-id', ['digital-id']],
  ['digital-assets', ['bitcoin-flow', 'hd-wallet', 'solana-flow']],
  ['api-security-jwt', ['api-security-jwt']],
  ['pki-enrollment-protocols', ['pki-enrollment']],
  ['email-signing', ['email-signing']],
])

/**
 * module id → the first browser-runnable tool whose `moduleLink` targets it,
 * in registry order. Kept for callers that want one tool (the mobile practice
 * card); derived from the multi-valued map above.
 */
export const TOOL_BY_MODULE_ID: ReadonlyMap<string, string> = new Map(
  [...TOOLS_BY_MODULE_ID.entries()].map(([moduleId, tools]) => [moduleId, tools[0]!])
)

/**
 * tool id → display name, for the "Also in the Playground" row ModuleShell
 * renders. A literal for the same reason as the maps above (no eager
 * WORKSHOP_TOOLS import); the drift guard re-derives it from the registry.
 */
export const TOOL_TITLE_BY_ID: ReadonlyMap<string, string> = new Map([
  ['cacp-kmip', 'KMIP Control Plane'],
  ['hsm-capacity', 'HSM Capacity Calculator'],
  ['hybrid-encrypt', 'Hybrid KEM + ECDH'],
  ['envelope-encrypt', 'Envelope Encryption'],
  ['token-migration', 'Multi-Algorithm Signing'],
  ['firmware-signing', 'Firmware Signing'],
  ['slh-dsa', 'SLH-DSA Sign & Verify'],
  ['lms-hss', 'Stateful Hash Signatures'],
  ['hybrid-sigs', 'Hybrid Signature Spectrums'],
  ['kdf-derivation', 'SP 800-108 KDF'],
  ['tee-channel', 'TEE-HSM Secure Channel'],
  ['tls-simulator', 'TLS 1.3 Simulator'],
  ['vpn-sim', 'PQC VPN Simulator'],
  ['pqc-ssh-sim', 'PQC SSH Simulator'],
  ['suci-flow', '5G SUCI Construction'],
  ['mls-group-messaging', 'MLS Group Messaging'],
  ['tpm-playground', 'TPM 2.0 PQC Playground'],
  ['rng-demo', 'Random Generation'],
  ['qrng-demo', 'QRNG Demo'],
  ['entropy-test', 'Entropy Testing'],
  ['drbg-demo', 'SP 800-90A DRBG'],
  ['source-combining', 'Source Combining'],
  ['pki-workshop', 'PKI Workshop'],
  ['cert-capacity', 'Cert Capacity Calculator'],
  ['hybrid-certs', 'Hybrid Certificates'],
  ['merkle-proof', 'Merkle Tree Workshop'],
  ['digital-id', 'EUDI Wallet Architecture'],
  ['bitcoin-flow', 'Bitcoin Transaction'],
  ['hd-wallet', 'HD Wallet Derivation'],
  ['solana-flow', 'Solana Transaction'],
  ['openssl-studio', 'OpenSSL Studio'],
  ['api-security-jwt', 'API Security & JWT Workshop'],
  ['pki-enrollment', 'PKI Enrollment (EST + CMP)'],
  ['email-signing', 'S/MIME & CMS Workshop'],
])

/**
 * The playground tool to offer from a module: its own declaration first, then
 * the reverse of any tool that already links to it.
 */
export function resolveModuleTool(manifest: ModuleManifest): string | undefined {
  return manifest.playgroundTool ?? TOOL_BY_MODULE_ID.get(manifest.id)
}

/**
 * Every playground tool a module should offer: its own declaration first, then
 * each tool whose `moduleLink` points here, without duplicates.
 */
export function resolveModuleTools(manifest: ModuleManifest): string[] {
  const out: string[] = []
  const primary = resolveModuleTool(manifest)
  if (primary) out.push(primary)
  for (const t of TOOLS_BY_MODULE_ID.get(manifest.id) ?? []) if (!out.includes(t)) out.push(t)
  return out
}

/**
 * Wave B / B2 (2026-08-29, bplus-remediation-plan-08292026.md): modules
 * excluded from the mobile "Practice on your phone" card even though they
 * have a real twin per `resolveModuleTool` — user sign-off, not a data gap:
 *   - mls-group-messaging: the tool's own registry entry says it "needs a
 *     wider screen" (read-only credit only on mobile).
 *   - vpn-ssh-pqc: its Android-only twin is Chromium-gated on iOS.
 *   - confidential-computing: its twin (tee-channel) is too narrow a tool
 *     for a first mobile practice step.
 * Two modules the plan's own B2 table also proposed (crypto-agility →
 * cacp-kmip, hsm-pqc → hsm) were dropped entirely, not just excluded: no
 * `WorkshopTool.moduleLink` in workshopRegistry.tsx actually points at
 * either module (verified directly against the registry, 2026-08-29) — that
 * table's two extra rows were wrong, not a real, drift-guarded link like the
 * 16 below.
 */
const MOBILE_PRACTICE_EXCLUDED = new Set([
  'mls-group-messaging',
  'vpn-ssh-pqc',
  'confidential-computing',
])

/**
 * The mobile "Practice on your phone" twin for a module (MobileModuleShell's
 * B2 card), or undefined when none exists or it's on the exclusion list
 * above. Same resolution as `resolveModuleTool` — the mobile shortlist is a
 * subset, not a different data source.
 */
export function mobilePracticeTool(manifest: ModuleManifest): string | undefined {
  if (MOBILE_PRACTICE_EXCLUDED.has(manifest.id)) return undefined
  return resolveModuleTool(manifest)
}

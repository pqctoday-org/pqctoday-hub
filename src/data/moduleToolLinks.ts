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
 * module id → the id of the first browser-runnable tool whose `moduleLink`
 * targets it, in registry order. Derived from `WORKSHOP_TOOLS`; kept in sync by
 * the drift guard, never edited by hand from anything but the guard's output.
 */
export const TOOL_BY_MODULE_ID: ReadonlyMap<string, string> = new Map([
  ['slh-dsa', 'slh-dsa'],
  ['stateful-signatures', 'lms-hss'],
  ['hybrid-crypto', 'hybrid-encrypt'],
  ['kms-pqc', 'envelope-encrypt'],
  ['iam-pqc', 'token-migration'],
  ['confidential-computing', 'tee-channel'],
  ['secure-boot-pqc', 'firmware-signing'],
  ['vpn-ssh-pqc', 'vpn-sim'],
  ['entropy-randomness', 'rng-demo'],
  ['pki-workshop', 'pki-workshop'],
  ['merkle-tree-certs', 'merkle-proof'],
  ['5g-security', 'suci-flow'],
  ['digital-id', 'digital-id'],
  ['digital-assets', 'bitcoin-flow'],
  ['tls-basics', 'tls-simulator'],
  ['pki-enrollment-protocols', 'pki-enrollment'],
  ['email-signing', 'email-signing'],
  ['api-security-jwt', 'api-security-jwt'],
  ['mls-group-messaging', 'mls-group-messaging'],
])

/**
 * The playground tool to offer from a module: its own declaration first, then
 * the reverse of any tool that already links to it.
 */
export function resolveModuleTool(manifest: ModuleManifest): string | undefined {
  return manifest.playgroundTool ?? TOOL_BY_MODULE_ID.get(manifest.id)
}

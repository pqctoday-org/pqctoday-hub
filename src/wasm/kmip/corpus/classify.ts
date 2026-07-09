// SPDX-License-Identifier: GPL-3.0-only
//
// classify.ts — pre-flight skip classification for a corpus test, ported
// verbatim from pqctoday-hsm/kmip/conformance/harness/dispatcher_replay.py.
// Each skip category is a real, cited reason a test can't meaningfully
// pass/fail in this harness (not a workaround for a bug) — see the
// per-table comments for the spec/policy citation.
import type { KmipNode } from '../ttlv/nodes'

export type SkipReason = {
  status: 'SKIP_DEPRECATED' | 'SKIP_POLICY_VARIANT' | 'SKIP_OP' | 'SKIP_TRANSPORT'
  detail: string
}

/** OASIS tests exercising cryptographic mechanisms the softhsmrustv3
 * PKCS#11 backend does NOT implement by policy (deprecated, intentionally
 * out of scope — see kmip/DEPRECATED.md). */
const DEPRECATED_ALGO_TESTS: Record<string, string> = {
  'BL-M-12-30.xml': 'DSA — deprecated (NIST SP 800-186 §5.4)',
  'BL-M-13-30.xml': 'DSA — deprecated (NIST SP 800-186 §5.4)',
  'SKFF-M-4-30.xml': '3DES — deprecated (NIST SP 800-131A r2 §1.2.1)',
  'SKFF-M-8-30.xml': '3DES — deprecated (NIST SP 800-131A r2 §1.2.1)',
  'SKFF-M-12-30.xml': '3DES — deprecated (NIST SP 800-131A r2 §1.2.1)',
}

/** OASIS tests whose first request assumes Managed Object state left over
 * from an earlier transcript in the same profile run. Mirrors the Python
 * harness's `_CHAINED_TEST_GROUPS` (Honest-Maximum Phase 2.1, 2026-07-07):
 * instead of skipping these, the listed prerequisite transcripts are
 * replayed first ON THE SAME ENGINE, then the test itself runs — the spec
 * itself sequences these transcripts within one profile run, so shared
 * state is the CORRECT reading, not a harness compromise. The native
 * baseline passes both; so does this port. */
export const CHAINED_TEST_GROUPS: Record<string, string[]> = {
  'TL-M-3-30.xml': ['TL-M-2-30.xml'],
  'SASED-M-3-30.xml': ['SASED-M-2-30.xml'],
}

/** OASIS tests that pin one of several MUTUALLY EXCLUSIVE conformant
 * server behaviors (RNGSeed: full-consume / partial-consume / ignore-seed
 * / deny — KMIP 3.0 §6.1.45 permits any). Engine 0.12.0 made all four
 * modes real via `ops/deps.rs::RngSeedMode`, and the native harness now
 * passes these three by constructing per-test Deps with the pinned mode —
 * but the wasm binding (`KmipPlayground::new`) hardcodes
 * `DepsConfig::default()` (full-consume) with no config seam, so the
 * variants stay unreplayable HERE until the binding exposes it. */
const POLICY_VARIANT_TESTS: Record<string, string> = {
  'CS-RNG-O-2-30.xml':
    'RNGSeed variant: partial-consume. Real in the engine (RngSeedMode) and passing natively; the wasm binding pins DepsConfig::default() — no seam to select it here yet',
  'CS-RNG-O-3-30.xml':
    'RNGSeed variant: ignore-seed. Real in the engine (RngSeedMode) and passing natively; the wasm binding pins DepsConfig::default() — no seam to select it here yet',
  'CS-RNG-O-4-30.xml':
    'RNGSeed variant: deny. Real in the engine (RngSeedMode) and passing natively; the wasm binding pins DepsConfig::default() — no seam to select it here yet',
}

/** OASIS tests whose expected outcome depends on `MaximumResponseSize`
 * (KMIP 3.0 §9.10) enforcement — the client declares a byte-size cap on
 * the RequestHeader; a too-big response must be replaced with
 * `OperationFailed / ResponseTooLarge`. Confirmed (by reading
 * `pqctoday-hsm/kmip/src/server/listener.rs` lines ~176-236) that this
 * check lives ENTIRELY in the native TLS listener — it inspects the
 * already-`dispatch()`-produced response's encoded byte length, which
 * `dispatch()` itself never sees or enforces. `KmipPlayground::submit`
 * calls `dispatch()` directly, with no listener wrapping it, so this
 * wasm build has no seam to implement this check on — a real,
 * WASM-vs-native architectural gap (matching Validate/Certify/ReCertify's
 * crypto-backend gap in kind, just for a different reason), not a bug in
 * this replay port. The native/Python harness (which runs the real TLS
 * listener) correctly passes all three of these. */
const TRANSPORT_TESTS: Record<string, string> = {
  'MSGENC-HTTPS-M-1-30.xml':
    'MaximumResponseSize (§9.10) enforcement lives in the native TLS listener, not dispatch() — no seam to implement it on in this wasm build',
  'MSGENC-JSON-M-1-30.xml':
    'MaximumResponseSize (§9.10) enforcement lives in the native TLS listener, not dispatch() — no seam to implement it on in this wasm build',
  'MSGENC-XML-M-1-30.xml':
    'MaximumResponseSize (§9.10) enforcement lives in the native TLS listener, not dispatch() — no seam to implement it on in this wasm build',
}

/** The 3 native-gated (Validate/Certify/ReCertify — wasm32 crypto-backend
 * gap) + 4 zero-handler (Notify/Put server-to-client scope boundary;
 * DelegatedLogin/Re-Provision no handler) ops. Engine 0.12.0's honest
 * maximum made the other 8 formerly-listed ops real (split keys, async
 * quartet, ObtainLease, SetConstraints) — everything else in the 66-op
 * enum genuinely works IN THIS WASM BUILD, so a test is only unreplayable
 * if it needs one of these 7. */
const PERMANENTLY_UNSUPPORTED_OPS = new Set([
  'Validate',
  'Certify',
  'ReCertify',
  'Notify',
  'Put',
  'DelegatedLogin',
  'Re-Provision',
])

/** Collect every Operation enum value a transcript's request side
 * invokes. */
export function operationsUsed(transcript: KmipNode[]): Set<string> {
  const ops = new Set<string>()
  const walk = (n: KmipNode) => {
    if (n.tag === 'Operation' && n.type === 'Enumeration' && typeof n.value === 'string')
      ops.add(n.value)
    for (const c of n.children ?? []) walk(c)
  }
  for (const msg of transcript) {
    if (msg.tag === 'RequestMessage') walk(msg)
  }
  return ops
}

/** Pre-flight classification: deprecated-algo / precondition / policy-variant
 * skips are name-based (don't need the parsed transcript); SKIP_OP needs
 * the parsed transcript's operation set. Returns `null` when the test
 * should actually be replayed. */
export function classifyByName(fileName: string): SkipReason | null {
  if (fileName in DEPRECATED_ALGO_TESTS)
    return { status: 'SKIP_DEPRECATED', detail: DEPRECATED_ALGO_TESTS[fileName] }
  if (fileName in POLICY_VARIANT_TESTS)
    return { status: 'SKIP_POLICY_VARIANT', detail: POLICY_VARIANT_TESTS[fileName] }
  if (fileName in TRANSPORT_TESTS)
    return { status: 'SKIP_TRANSPORT', detail: TRANSPORT_TESTS[fileName] }
  return null
}

export function classifyByOps(ops: Set<string>): SkipReason | null {
  const unsupported = Array.from(ops).filter((op) => PERMANENTLY_UNSUPPORTED_OPS.has(op))
  if (unsupported.length > 0) {
    return { status: 'SKIP_OP', detail: `unsupported ops: ${unsupported.sort().join(', ')}` }
  }
  return null
}

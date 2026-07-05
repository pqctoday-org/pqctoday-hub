// SPDX-License-Identifier: GPL-3.0-only
//
// classify.ts — pre-flight skip classification for a corpus test, ported
// verbatim from pqctoday-hsm/kmip/conformance/harness/dispatcher_replay.py.
// Each skip category is a real, cited reason a test can't meaningfully
// pass/fail in this harness (not a workaround for a bug) — see the
// per-table comments for the spec/policy citation.
import type { KmipNode } from '../ttlv/nodes'

export type SkipReason = {
  status: 'SKIP_DEPRECATED' | 'SKIP_PRECONDITION' | 'SKIP_POLICY_VARIANT' | 'SKIP_OP' | 'SKIP_TRANSPORT'
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
 * from an earlier transcript in the same profile run. This harness (like
 * the Python original) runs each test hermetically (a fresh engine per
 * test), so any cross-test state is intentionally wiped — not a gap in
 * the Locate-by-attribute pipeline itself (verified by the M-1/M-2
 * transcripts in the same families). */
const PRECONDITION_TESTS: Record<string, string> = {
  'TL-M-3-30.xml': 'Locate-by-ApplicationSpecificInformation of object Created in TL-M-2; hermetic per-test isolation wipes it',
  'SASED-M-3-30.xml': 'Locate-by-GroupLink of SecretData Registered in SASED-M-2; hermetic per-test isolation wipes it',
}

/** OASIS tests that pin one of several MUTUALLY EXCLUSIVE conformant
 * server behaviors (e.g. RNGSeed: full-consume / partial-consume /
 * ignore-seed / deny — KMIP 3.0 §6.1.45 permits any). We implement
 * full-consume; the others would require per-test policy injection this
 * hermetic harness doesn't do. */
const POLICY_VARIANT_TESTS: Record<string, string> = {
  'CS-RNG-O-2-30.xml': 'RNGSeed policy variant: partial-consume (DataLength=16). We implement full-consume per CS-RNG-O-1',
  'CS-RNG-O-3-30.xml': 'RNGSeed policy variant: ignore-seed (DataLength=0). We implement full-consume per CS-RNG-O-1',
  'CS-RNG-O-4-30.xml': 'RNGSeed policy variant: deny (PermissionDenied). We implement full-consume per CS-RNG-O-1',
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
  'MSGENC-HTTPS-M-1-30.xml': 'MaximumResponseSize (§9.10) enforcement lives in the native TLS listener, not dispatch() — no seam to implement it on in this wasm build',
  'MSGENC-JSON-M-1-30.xml': 'MaximumResponseSize (§9.10) enforcement lives in the native TLS listener, not dispatch() — no seam to implement it on in this wasm build',
  'MSGENC-XML-M-1-30.xml': 'MaximumResponseSize (§9.10) enforcement lives in the native TLS listener, not dispatch() — no seam to implement it on in this wasm build',
}

/** The 3 native-gated (Validate/Certify/ReCertify — wasm32 crypto-backend
 * gap) + 12 zero-handler (advertised-only, §11) ops. Unlike the Python
 * harness's `IMPLEMENTED_OPS` allowlist (which the KMIP3.0 Commands-tab
 * audit found 7 ops stale — see kmip commit 110a7f9), this is the
 * complement: everything else in the 66-op enum genuinely works, so a
 * test is only unreplayable if it needs one of these 15. */
const PERMANENTLY_UNSUPPORTED_OPS = new Set([
  'Validate',
  'Certify',
  'ReCertify',
  'ObtainLease',
  'Poll',
  'Notify',
  'Put',
  'CreateSplitKey',
  'SetConstraints',
  'QueryAsynchronousRequests',
  'Process',
  'Cancel',
  'JoinSplitKey',
  'DelegatedLogin',
  'Re-Provision',
])

/** Collect every Operation enum value a transcript's request side
 * invokes. */
export function operationsUsed(transcript: KmipNode[]): Set<string> {
  const ops = new Set<string>()
  const walk = (n: KmipNode) => {
    if (n.tag === 'Operation' && n.type === 'Enumeration' && typeof n.value === 'string') ops.add(n.value)
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
  if (fileName in DEPRECATED_ALGO_TESTS) return { status: 'SKIP_DEPRECATED', detail: DEPRECATED_ALGO_TESTS[fileName] }
  if (fileName in PRECONDITION_TESTS) return { status: 'SKIP_PRECONDITION', detail: PRECONDITION_TESTS[fileName] }
  if (fileName in POLICY_VARIANT_TESTS) return { status: 'SKIP_POLICY_VARIANT', detail: POLICY_VARIANT_TESTS[fileName] }
  if (fileName in TRANSPORT_TESTS) return { status: 'SKIP_TRANSPORT', detail: TRANSPORT_TESTS[fileName] }
  return null
}

export function classifyByOps(ops: Set<string>): SkipReason | null {
  const unsupported = Array.from(ops).filter((op) => PERMANENTLY_UNSUPPORTED_OPS.has(op))
  if (unsupported.length > 0) {
    return { status: 'SKIP_OP', detail: `unsupported ops: ${unsupported.sort().join(', ')}` }
  }
  return null
}

// SPDX-License-Identifier: GPL-3.0-only
/**
 * Drift guard for the `standards[]` ordering convention (see ModuleContentTypes).
 *
 * `accuracy_spotcheck.py` reads only the first four documents it selects from a
 * module's `standards[]`, chosen by deterministic even stride. Everything outside
 * that selection is never opened, so its claims are never checked. Declaration
 * order therefore decides what gets verified.
 *
 * That matters most on the policy-facing tracks. A governance or executive module
 * whose sampled evidence is entirely cryptographic specifications gets its claims
 * about deadlines, mandates and controls graded against algorithm internals — which
 * is what was happening to pqc-governance until 2026-08-21 (2 of 5 claims graded;
 * reordering took it to 5 of 5).
 *
 * This test fails when a NEW policy-track module lands in that state. The five
 * already there are listed explicitly rather than silently tolerated — each is a
 * real finding owed a reorder (plan item WS3.2).
 */
import { describe, it, expect } from 'vitest'
import { MODULE_CITED_STANDARDS } from './moduleContentRegistry'
import { MANIFESTS } from '@/components/PKILearning/manifest/registry'

/** Mirrors `_stride_sample()` in accuracy_spotcheck.py — keep the two in step. */
function strideSample<T>(items: T[], n: number): T[] {
  if (n <= 0 || n >= items.length) return items
  const stride = items.length / n
  return Array.from({ length: n }, (_, i) => items[Math.floor(i * stride)])
}

/**
 * Mirrors `_MAX_EVIDENCE_DOCS` in pqctoday-priv/maintenance/accuracy_spotcheck.py.
 * 0 means NO CAP — every declared standard is opened.
 *
 * DUPLICATED ON PURPOSE, AND THE FIRST ATTEMPT PROVED WHY. This briefly read the value
 * straight out of accuracy_spotcheck.py, to avoid the stale-copy trap that had just bitten
 * audit_module_citation_coverage.py. That works locally and CANNOT work in CI: the hub's
 * workflow checks out the hub alone, pqctoday-priv is a separate private repo, and the read
 * died with ENOENT in a simulated CI checkout. Several scripts in ci.yml already no-op for
 * exactly this reason.
 *
 * The dependency only runs one way — priv can see the hub, the hub can never see priv — so
 * the constant lives here and pqctoday-priv/maintenance/test_hub_stride_constant_agrees.py
 * asserts the two agree. Keep them in step by changing accuracy_spotcheck.py and letting
 * that test fail; do not re-introduce a cross-repo read.
 */
const MAX_EVIDENCE_DOCS = 0
const POLICY_TRACKS = new Set(['Executive', 'Role Guides'])

/**
 * The generic PQC specifications nearly every module cites as background —
 * FIPS 203/204/205/206 and SP 800-227. Deliberately NARROW.
 *
 * The first version of this test asked whether the sampled set was entirely
 * "crypto specs", counting every FIPS, SP and RFC. That was wrong in both
 * directions, and running it proved it: it false-positived `dev-quantum-impact`,
 * whose subject genuinely IS RFC 8446 and RFC 9980, while completely MISSING
 * `pqc-governance` — the case that motivated the guard in the first place —
 * because one non-matching entry was enough to clear it.
 *
 * An RFC is a protocol document and usually the module's subject; SP 800-208 and
 * SP 800-90A are narrow enough to be a subject too. What signals a mis-ordered
 * policy module is the *generic* set crowding out everything specific.
 */
const GENERIC_PQC_SPEC = /^(FIPS 20[3-6]|NIST SP 800-227)$/i

/** Sampled sets with this many generic specs have no room left for the subject. */
const CROWDED_OUT = 3

/**
 * Known offenders as of 2026-08-21, measured with the stride above. Each is a
 * policy-track module whose sampled evidence is all crypto specs, so the
 * spot-check cannot check what the module actually teaches. Remove entries from
 * this list as they are reordered — never add to it without reading WS3.2 first.
 */
const KNOWN_UNORDERED = new Set<string>([
  // Empty as of 2026-08-22. Nine modules were reordered to get here: five found by
  // the first (weaker) rule, then four more the corrected rule surfaced. Keep the
  // set and both tests — the guard's job is the NEXT module that lands here.
])

describe('standards[] ordering on policy-track modules', () => {
  const offenders: string[] = []
  for (const manifest of MANIFESTS) {
    if (!POLICY_TRACKS.has(manifest.track ?? '')) continue
    const cited = MODULE_CITED_STANDARDS[manifest.id]
    if (!cited || cited.length === 0) continue
    const sampled = strideSample(cited, MAX_EVIDENCE_DOCS)
    const generic = sampled.filter((s) => GENERIC_PQC_SPEC.test(s.id)).length
    if (generic >= CROWDED_OUT) offenders.push(manifest.id)
  }

  it('no NEW policy module has its subject crowded out by generic PQC specs', () => {
    // THE PREMISE IS CONDITIONAL, and as of 2026-08-22 it does not hold. This guard
    // exists because the spot-check opened only four documents per module by even
    // stride, so declaration ORDER decided what was ever verified. That cap was lifted
    // the same day: every declared standard is now read, and ordering cannot crowd
    // anything out of the evidence.
    //
    // Kept rather than deleted because the cap is still settable by
    // LEARN_MAX_EVIDENCE_DOCS and MAX_EVIDENCE_DOCS is read from that file — if the cap
    // ever returns, this guards again on its own.
    //
    // NOT addressed here: whether ordering still matters to a READER scanning the
    // References tab. That is a real question and a different one.
    if (MAX_EVIDENCE_DOCS <= 0) return
    expect(offenders.filter((id) => !KNOWN_UNORDERED.has(id))).toEqual([])
  })

  it('the known-offender list has not gone stale', () => {
    // A module reordered without being removed from the list here would leave the
    // allowlist quietly over-broad, which is how a ratchet stops ratcheting.
    const fixed = [...KNOWN_UNORDERED].filter((id) => !offenders.includes(id))
    expect(fixed, `reordered — remove from KNOWN_UNORDERED: ${fixed.join(', ')}`).toEqual([])
  })

  it('samples the same way the spot-check does', () => {
    // Guards the mirrored stride: 6 entries -> indices 0,1,3,4; 8 -> 0,2,4,6.
    expect(strideSample([0, 1, 2, 3, 4, 5], 4)).toEqual([0, 1, 3, 4])
    expect(strideSample([0, 1, 2, 3, 4, 5, 6, 7], 4)).toEqual([0, 2, 4, 6])
    expect(strideSample([0, 1, 2], 4)).toEqual([0, 1, 2])
  })
})

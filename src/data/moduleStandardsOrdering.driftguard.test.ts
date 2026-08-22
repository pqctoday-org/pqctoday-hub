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
  if (n >= items.length) return items
  const stride = items.length / n
  return Array.from({ length: n }, (_, i) => items[Math.floor(i * stride)])
}

const MAX_EVIDENCE_DOCS = 4
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

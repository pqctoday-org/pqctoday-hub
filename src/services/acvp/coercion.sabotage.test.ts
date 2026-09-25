// SPDX-License-Identifier: GPL-3.0-only
// J-3 sabotage: "unsupported parameter coercion" (plan F-3 — never silently
// coerce an unsupported option to a default). Each case mutates ONE option of
// a real public NIST ACVP-Server prompt and proves the prototype either
// refuses the file at the exact path, or keeps the mutated test out of the
// engine and out of response.json — it is never answered as something else.
import { describe, it, expect } from 'vitest'
import { executePrepared, preparePrompt } from './run'
import { UNSUPPORTED_REASONS } from './dispatch'
import { createExpectedResultsFakeEngine } from './testing/expectedResultsFakeEngine'
import { readFixture, type FixtureName } from './node/fixtures'
import type { JsonObject } from './ir'

const repo = process.cwd()
const load = (n: FixtureName) => JSON.parse(readFixture(repo, n, 'prompt.json')) as JsonObject
type Group = JsonObject & { tgId: number; tests: Array<JsonObject & { tcId: number }> }
const groups = (doc: JsonObject) => doc.testGroups as Group[]

const REFUSED: Array<[string, FixtureName, (d: JsonObject) => void, RegExp]> = [
  [
    'ML-DSA parameterSet outside FIPS 204',
    'ML-DSA-sigVer-FIPS204',
    (d) => (groups(d)[0].parameterSet = 'ML-DSA-99'),
    /^\$\.testGroups\[0\]\.parameterSet$/,
  ],
  [
    'ML-DSA preHash value the prototype does not know',
    'ML-DSA-sigVer-FIPS204',
    (d) => (groups(d)[0].preHash = 'prehash-sha3'),
    /^\$\.testGroups\[0\]\.preHash$/,
  ],
  [
    'ML-DSA signatureInterface value the prototype does not know',
    'ML-DSA-sigVer-FIPS204',
    (d) => (groups(d)[0].signatureInterface = 'raw'),
    /^\$\.testGroups\[0\]\.signatureInterface$/,
  ],
  [
    'ML-DSA hashAlg outside the ACVP vocabulary',
    'ML-DSA-sigVer-FIPS204',
    (d) => (groups(d).find((g) => g.preHash === 'preHash')!.tests[0].hashAlg = 'SHA2-1024'),
    /\.tests\[0\]\.hashAlg$/,
  ],
  [
    'ML-DSA internal group without its externalMu flag',
    'ML-DSA-sigVer-FIPS204',
    (d) => delete groups(d).find((g) => g.signatureInterface === 'internal')!.externalMu,
    /\.externalMu$/,
  ],
  [
    'ML-KEM parameterSet outside FIPS 203',
    'ML-KEM-encapDecap-FIPS203',
    (d) => (groups(d).find((g) => g.function === 'decapsulation')!.parameterSet = 'ML-KEM-2048'),
    /\.parameterSet$/,
  ],
  [
    'ML-KEM function the prototype does not know',
    'ML-KEM-encapDecap-FIPS203',
    (d) => (groups(d)[0].function = 'decapsulate'),
    /^\$\.testGroups\[0\]\.function$/,
  ],
]

describe('SABOTAGE: an unknown option is refused at its path, never coerced', () => {
  it.each(REFUSED)('%s', async (_label, fixture, mutate, at) => {
    const doc = load(fixture)
    mutate(doc)
    const p = await preparePrompt(JSON.stringify(doc))
    expect(p.ok).toBe(false)
    if (!p.ok) expect(p.diagnostics.map((d) => d.path)).toContainEqual(expect.stringMatching(at))
  })
})

describe('SABOTAGE: a known-but-unsupported option is dispositioned, not answered', () => {
  it('a pre-hash test switched to SHA2-512/256 becomes unsupported(test), is never sent to the engine, and has no response entry', async () => {
    const doc = load('ML-DSA-sigVer-FIPS204')
    const g = groups(doc).find(
      (x) => x.preHash === 'preHash' && x.tests.some((t) => t.hashAlg === 'SHA2-256')
    )!
    const t = g.tests.find((x) => x.hashAlg === 'SHA2-256')!
    t.hashAlg = 'SHA2-512/256'
    const text = JSON.stringify(doc)
    const p = await preparePrompt(text)
    if (!p.ok) throw new Error(JSON.stringify(p.diagnostics))
    const item = p.plan.items.find((i) => i.tgId === g.tgId && i.tcId === t.tcId)!
    expect(item).toMatchObject({
      kind: 'unsupported',
      scope: 'test',
      reason: UNSUPPORTED_REASONS.mlDsaHashAlg('SHA2-512/256'),
    })

    const engine = createExpectedResultsFakeEngine(
      readFixture(repo, 'ML-DSA-sigVer-FIPS204', 'expectedResults.json'),
      text
    )
    const run = await executePrepared(p, { engine, codePath: 'cli', appVersion: null })
    expect(engine.calls.some((c) => 'signature' in c && c.signature === t.signature)).toBe(false)
    const rg = (run.response.vectorSetResponse.testGroups as JsonObject[]).find(
      (x) => x.tgId === g.tgId
    )
    const answered = ((rg?.tests ?? []) as JsonObject[]).map((x) => x.tcId)
    expect(answered).not.toContain(t.tcId)
  })

  it('an ML-KEM decapsulation group relabelled as encapsulation is refused (its VAL test type and fields do not fit), so its ciphertexts are never decapsulated as encapsulation answers', async () => {
    const doc = load('ML-KEM-encapDecap-FIPS203')
    const idx = groups(doc).findIndex((x) => x.function === 'decapsulation')
    groups(doc)[idx].function = 'encapsulation'
    const p = await preparePrompt(JSON.stringify(doc))
    expect(p.ok).toBe(false)
    if (!p.ok) expect(p.diagnostics.map((d) => d.path)).toContain(`$.testGroups[${idx}].testType`)
  })
})

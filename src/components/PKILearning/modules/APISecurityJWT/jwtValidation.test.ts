// SPDX-License-Identifier: GPL-3.0-only
import { beforeAll, describe, expect, it } from 'vitest'
import { buildScenarios, generateLabKey, labPolicy, type Scenario } from './attackScenarios'
import { naiveVerify, validateJwt } from './jwtValidation'
import type { JwsKeyPair } from './jwtUtils'

const NOW = 1_800_000_000

describe('attack lab: strict validator vs naive verifier', () => {
  let key: JwsKeyPair
  let scenarios: Scenario[]
  beforeAll(async () => {
    key = await generateLabKey()
    scenarios = await buildScenarios(key, NOW)
  })

  it('builds the six scenarios', () => {
    expect(scenarios.map((s) => s.id)).toEqual([
      'legit',
      'alg-none',
      'tampered',
      'wrong-audience',
      'expired',
      'wrong-type',
    ])
  })

  it('the strict validator accepts only the legitimate token, failing each attack at its own check', async () => {
    for (const s of scenarios) {
      const r = await validateJwt(s.token, labPolicy(key.publicKey, NOW))
      const failed = r.checks.find((c) => !c.passed)
      expect(failed?.id ?? null, s.id).toBe(s.expectedFailure)
      expect(r.valid, s.id).toBe(s.expectedFailure === null)
    }
  })

  it('the naive verifier is fooled exactly where the lab says it is', async () => {
    for (const s of scenarios) {
      const r = await naiveVerify(s.token, key.publicKey)
      expect(r.accepted, s.id).toBe(s.naiveAccepts)
    }
  })

  it('rejects a token signed by a different key even with every claim correct', async () => {
    const other = await generateLabKey()
    const forged = (await buildScenarios(other, NOW))[0].token
    const r = await validateJwt(forged, labPolicy(key.publicKey, NOW))
    expect(r.valid).toBe(false)
    expect(r.checks.at(-1)?.id).toBe('signature')
  })

  it('accepts a token within the clock-skew allowance and an array audience', async () => {
    const legit = scenarios[0].token
    const r = await validateJwt(legit, { ...labPolicy(key.publicKey, NOW + 600 + 30) })
    expect(r.valid).toBe(true)
    const multi = (
      await import('./jwtUtils').then((m) =>
        m.signJWS({
          alg: 'ML-DSA-65',
          header: { typ: 'at+jwt' },
          payload: {
            iss: 'https://auth.example.com',
            aud: ['https://other.example.com', 'https://api.example.com'],
            exp: NOW + 60,
          },
          keyPair: key,
          backend: 'noble',
        })
      )
    ).token
    expect((await validateJwt(multi, labPolicy(key.publicKey, NOW))).valid).toBe(true)
  })

  it('reports a malformed token at the format check', async () => {
    const r = await validateJwt('not.a', labPolicy(key.publicKey, NOW))
    expect(r.checks).toHaveLength(1)
    expect(r.checks[0]).toMatchObject({ id: 'format', passed: false })
  })
})

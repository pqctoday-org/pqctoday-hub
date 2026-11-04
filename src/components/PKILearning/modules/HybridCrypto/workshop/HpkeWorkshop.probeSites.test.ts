// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Every protected-key probe in the HPKE workshop goes through
 * requireProtectedKeyReadRefusal, which accepts only the measured
 * C_GetAttributeValue / CKR_ATTRIBUTE_SENSITIVE refusal. The old pattern, a bare
 * catch that turned any error into "CKR_ATTRIBUTE_SENSITIVE, as expected", must
 * not come back at any of the four sites (single-call proposal, v3.3 draft and
 * pure ML-KEM, v3.2 hybrid chain). Runtime behaviour of the helper is in
 * services/protectedKeyRead*.test.ts; this guards the call sites.
 */
import { describe, it, expect } from 'vitest'
import source from './HpkeWorkshop.tsx?raw'

describe('HPKE workshop protected-key probe call sites', () => {
  it('uses the checked helper at exactly the three code sites that probe', () => {
    const calls = source.match(/requireProtectedKeyReadRefusal\(/g) ?? []
    expect(calls).toHaveLength(3)
  })

  it('no longer turns every read error into an expected refusal', () => {
    expect(source).not.toContain('unexpectedly succeeded — this should never happen')
    expect(source).not.toContain('CKR_ATTRIBUTE_SENSITIVE, as expected')
    expect(source).not.toMatch(/catch\s*\{\s*extractProof/)
  })

  it('states the limit of a single refused read next to the probe', () => {
    expect(source).toContain('One refused read does not establish both attribute values')
  })
})

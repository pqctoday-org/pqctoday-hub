// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { PERSONA_STEP_HINTS } from './personaWizardHints'

describe('persona wizard hints — certification engineer compliance step', () => {
  const hint = PERSONA_STEP_HINTS['cert-engineer'].compliance.hint

  it('does not turn every framework date into a certificate-listing deadline', () => {
    expect(hint).not.toMatch(/each deadline becomes/i)
    expect(hint).not.toMatch(/date by which a certificate must list/i)
  })

  it('separates inventory, advisory and validation milestones and names the validation stages', () => {
    expect(hint).toMatch(/inventory milestone/i)
    expect(hint).toMatch(/advisory target/i)
    expect(hint).toMatch(/validation obligation/i)
    // Algorithm validation and module certification are different stages.
    expect(hint).toMatch(/CAVP/)
    expect(hint).toMatch(/CMVP/)
  })
})

describe('persona wizard hints — credential lifetimes', () => {
  it('does not give two years as a TLS leaf lifetime for publicly trusted certificates', () => {
    for (const [persona, steps] of Object.entries(PERSONA_STEP_HINTS)) {
      const credential = steps.credential
      if (!credential) continue
      const text = `${credential.hint} ${credential.hintExpert ?? ''}`
      expect(text, persona).not.toMatch(/TLS leaf \(90d via ACME to 2yr\)/)
    }
    const ops = PERSONA_STEP_HINTS.ops.credential
    const text = `${ops.hint} ${ops.hintExpert ?? ''}`
    expect(text).toMatch(
      /publicly trusted certificates issued from 15 March 2026 are capped at 200 days/
    )
    expect(text).toMatch(/private PKI follows your own policy/)
  })
})

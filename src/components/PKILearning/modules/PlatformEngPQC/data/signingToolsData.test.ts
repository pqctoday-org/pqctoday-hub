// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { SIGNING_TOOLS } from './signingToolsData'

describe('Sigstore PQC readiness wording', () => {
  it('separates experimental/current Cosign support from the future Sigstore target', () => {
    const cosign = SIGNING_TOOLS.find((tool) => tool.id === 'cosign')!
    expect(cosign.pqcReadiness).toBe('unconfirmed')
    expect(cosign.pqcNotes).toMatch(/not operational/i)
    expect(cosign.pqcNotes).toMatch(/current Cosign release notes do not document ML-DSA/i)
    expect(cosign.pqcNotes).toMatch(/mid-2027/i)
    expect(cosign.pqcNotes).toMatch(/not current Cosign support/i)
    expect(cosign.pqcNotes).toMatch(/2029\/2030/i)
  })

  it('describes the PQC Sigstore design as a separate stack and altered keyless flow', () => {
    const bundle = SIGNING_TOOLS.find((tool) => tool.id === 'sigstore-bundle')!
    expect(bundle.pqcReadiness).toBe('roadmap')
    expect(bundle.pqcNotes).toMatch(/separate PQC public instance/i)
    expect(bundle.pqcNotes).toMatch(/initially opt-in/i)
    expect(bundle.limitations.join(' ')).toMatch(/not model it as a simple in-place/i)
  })
})

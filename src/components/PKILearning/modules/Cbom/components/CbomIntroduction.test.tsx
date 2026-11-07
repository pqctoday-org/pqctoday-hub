// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../../embed/EmbedProvider'
import { CbomIntroduction } from './CbomIntroduction'

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {}
})

function contextText(): string {
  render(
    <EmbedProvider>
      <MemoryRouter>
        <CbomIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    </EmbedProvider>
  )
  const heading = screen.queryByRole('heading', { name: /Key identity, provenance/ })
  if (heading) fireEvent.click(heading)
  else fireEvent.click(screen.getByText(/Key identity, provenance/))
  return (document.body.textContent ?? '').replace(/\s+/g, ' ')
}

describe('CBOM introduction: key identity', () => {
  it('requires a matching scheme, hash and encoding before correlating content-derived ids', () => {
    const t = contextText()
    expect(t).toMatch(/can correlate, but only when the scheme, hash and input encoding match/)
    expect(t).toMatch(/RFC 5280 also allows other methods/)
    expect(t).toMatch(/so it is not an SPKI hash/)
    expect(t).toMatch(/KMIP Digest is computed over the key material in a stated key format type/)
    expect(t).not.toMatch(/Correlate .* on the SPKI fingerprint/)
  })

  it('explains short KCV collisions and does not treat a match alone as unique proof', () => {
    const t = contextText()
    expect(t).toMatch(/two different keys can have the same value/)
    expect(t).toMatch(/about 4,800 random keys already give a 50% chance of at least one collision/)
    expect(t).toMatch(/strong evidence rather than proof of a unique key/)
  })

  it('states what metadata and normalization a production tool needs', () => {
    const t = contextText()
    expect(t).toMatch(
      /the identifier scheme, the hash algorithm, the exact input encoding and the source/
    )
    expect(t).toMatch(/normalization step that turns each source.s form into the comparable one/)
  })
})

describe('CBOM introduction: attestation', () => {
  it('teaches what to verify and does not equate attestation with non-exportability', () => {
    const t = contextText()
    expect(t).not.toMatch(/proves a key.s origin \(generated in hardware, non-exportable\)/)
    expect(t).toMatch(
      /Attestation is evidence about a key, and what it proves depends on what you verify/
    )
    expect(t).toMatch(/chain validates to a trust anchor you accept and nothing in it is revoked/)
    expect(t).toMatch(/bound to the specific public key/)
    expect(t).toMatch(/only the first key-description extension in the chain can be trusted/)
  })

  it('separates HSM residency from the export and backup configuration and asks what a sample proves', () => {
    const t = contextText()
    expect(t).toMatch(/Hardware residency is not the same as non-exportability/)
    expect(t).toMatch(/CKA_EXTRACTABLE/)
    expect(t).toMatch(/whether it is non-exportable depends on its configuration/)
    expect(t).toMatch(
      /which of origin, hardware residency, non-exportability, key binding and freshness it actually proves, and which it leaves unproven/
    )
  })
})

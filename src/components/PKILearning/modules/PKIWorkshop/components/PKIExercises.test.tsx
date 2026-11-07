// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../../embed/EmbedProvider'
import { PKIExercises } from './PKIExercises'
import rootCaGeneratorSource from '../RootCAGenerator.tsx?raw'

function pageText(): string {
  render(
    <EmbedProvider>
      <MemoryRouter>
        <PKIExercises onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    </EmbedProvider>
  )
  return (document.body.textContent ?? '').replace(/\s+/g, ' ')
}

describe('PKI exercises: hash-based root CA', () => {
  it('asks only for an SLH-DSA parameter set that the Root CA generator offers', () => {
    const offered = [...rootCaGeneratorSource.matchAll(/-algorithm (slh-dsa-[a-z0-9-]+)/g)].map(
      (m) => m[1]
    )
    expect(offered.length).toBeGreaterThan(0)
    const text = pageText()
    const asked = [...text.matchAll(/Generate a Root CA using (SLH-DSA-[A-Z0-9]+-\d+[sf])/g)].map(
      (m) => m[1].toLowerCase()
    )
    expect(asked.length).toBe(1)
    for (const name of asked) expect(offered).toContain(name)
  })

  it('compares signature and public-key sizes at the same security category', () => {
    const text = pageText()
    expect(text).toContain('29,792-byte signature and a 64-byte public key')
    expect(text).toContain('4,627 bytes and 2,592 bytes for ML-DSA-87')
    expect(text).toMatch(/also category 5/)
    expect(text).toMatch(/128-bit variants .* are not offered by this generator/)
    // the 128s parameter set is no longer the thing the learner is told to generate
    expect(text).not.toMatch(/Generate a Root CA using SLH-DSA-SHA2-128s/)
  })
})

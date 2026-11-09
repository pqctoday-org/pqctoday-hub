// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../../embed/EmbedProvider'
import { AccelerationIntroduction } from './AccelerationIntroduction'

function pageText(): string {
  render(
    <EmbedProvider>
      <MemoryRouter>
        <AccelerationIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    </EmbedProvider>
  )
  return (document.body.textContent ?? '').replace(/\s+/g, ' ')
}

describe('Hardware acceleration introduction: masking and ASIC agility', () => {
  it('describes masking as reducing specified leakage under tested assumptions and order', () => {
    const t = pageText()
    expect(t).not.toMatch(/It defeats power and electromagnetic analysis/)
    expect(t).not.toMatch(/unrelated to the key/)
    expect(t).toMatch(
      /designed to reduce the leakage that power and electromagnetic analysis can use/
    )
    expect(t).toMatch(
      /depends on the masking order .* and on the leakage model and assumptions the design was analysed and tested under/
    )
    expect(t).toMatch(/not a blanket guarantee/)
    expect(t).toMatch(
      /Being built as an ASIC does not by itself show that a design resists physical attacks/
    )
  })

  it('distinguishes immutable circuits from updateable microcode or firmware', () => {
    const t = pageText()
    expect(t).not.toMatch(/cannot follow a new parameter set or a revised standard\. Their reward/)
    expect(t).toMatch(
      /hard-wired logic or microcode in ROM cannot follow a new parameter set or a revised standard/
    )
    expect(t).toMatch(
      /writable, authenticated microcode or firmware can change the steps or parameters/
    )
  })

  it('does not call the engine fully side-channel protected on the strength of the core-masking area figure', () => {
    const t = pageText()
    expect(t).not.toMatch(/A complete, side-channel-protected ML-DSA \+ ML-KEM engine/)
    expect(t).toMatch(/leaves out part of the final side-channel protection/)
  })
})

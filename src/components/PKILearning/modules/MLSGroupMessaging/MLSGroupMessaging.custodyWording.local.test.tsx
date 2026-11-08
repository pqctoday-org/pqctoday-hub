// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MLSIntroduction } from './components/MLSIntroduction'

const flat = (s: string) => s.replace(/\s+/g, ' ')

describe('MLS introduction: post-compromise security and key custody wording', () => {
  const introText = () => {
    render(
      <MemoryRouter>
        <MLSIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    )
    return flat(document.body.textContent ?? '')
  }

  it('makes post-compromise security conditional on a committed fresh leaf key', () => {
    const t = introText()
    expect(t.match(/once a committed fresh leaf key replaces the compromised one/g)).toHaveLength(2)
  })

  it('does not claim the keys live in an HSM or that HPKE runs inside the token', () => {
    const t = introText()
    expect(t).toMatch(
      /signature keys are held as token objects of a PKCS#11 module \(a software token in this sample\)/
    )
    expect(t).toMatch(
      /raw private-key bytes are not returned through this interface \(the sample token is software in the same process\)/
    )
    expect(t).not.toMatch(/signature keys live in an HSM/)
    expect(t).not.toMatch(/HPKE runs end-to-end inside the token/)
    expect(t).not.toMatch(/never raw bytes/)
  })
})

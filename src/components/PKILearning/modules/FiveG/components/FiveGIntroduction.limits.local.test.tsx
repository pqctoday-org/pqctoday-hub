// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { EmbedProvider } from '../../../../../embed/EmbedProvider'
import { FiveGIntroduction } from './FiveGIntroduction'

function introText(): string {
  render(
    <EmbedProvider>
      <MemoryRouter initialEntries={['/learn/5g-security']}>
        <FiveGIntroduction onNavigateToSimulate={() => {}} />
      </MemoryRouter>
    </EmbedProvider>
  )
  return document.body.textContent ?? ''
}

describe('FiveGIntroduction identity privacy', () => {
  it('teaches that the null-scheme gives no privacy and says when it is used', () => {
    const text = introText()
    expect(text).toMatch(/null-scheme returns its input\s+unchanged and gives no privacy/)
    expect(text).toMatch(/unauthenticated emergency/)
    expect(text).toMatch(/no Home Network Public Key is provisioned/)
  })

  it('does not claim the SUCI is always encrypted on the device or always computed on the USIM', () => {
    const text = introText()
    expect(text).not.toMatch(/encrypting the subscriber identity before it ever leaves the device/)
    expect(text).not.toMatch(/SUCI encrypts identity on the USIM/)
    expect(text).not.toMatch(/The USIM encrypts the subscriber/)
    expect(text).toMatch(/USIM or the phone \(ME\) computes it/)
    expect(text).toMatch(/the ME calculates it when the indication is absent/)
  })

  it('says a captured SUCI leaves the network identifiers and routing indicator readable', () => {
    const text = introText()
    expect(text).toMatch(
      /Home Network Identifier \(MCC and MNC\) and the Routing\s+Indicator are not concealed/
    )
  })
})

describe('FiveGIntroduction hybrid combiner', () => {
  it("presents the SHA-256 combination as the playground's own, unanalysed construction", () => {
    const text = introText()
    expect(text).toMatch(/playground's own construction/)
    expect(text).toMatch(/No 3GPP specification\s+defines it/)
    expect(text).toMatch(/cites no security analysis/)
  })

  it('does not guarantee that breaking one component leaves Z secret', () => {
    const text = introText()
    expect(text).not.toMatch(/binds both secrets so that breaking either/)
    expect(text).not.toMatch(/insufficient to recover Z/)
    expect(text).toMatch(/not evidence that Z stays secret/)
    // the counterexample the lesson points to: a combiner over the shared secrets alone
    expect(text).toMatch(/does not preserve IND-CCA\s+security whatever the KDF/)
  })
})

// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { QKDExercises } from './QKDExercises'

function pageText(): string {
  render(
    <MemoryRouter>
      <QKDExercises onNavigateToWorkshop={() => {}} />
    </MemoryRouter>
  )
  return (document.body.textContent ?? '').replace(/\s+/g, ' ')
}

describe('QKD exercises: HSM key derivation from a QKD secret', () => {
  it('calls the sample a classical mock and does not say the key is never sent over any network', () => {
    const t = pageText()
    expect(t).toMatch(/a classical mock of an ETSI GS QKD 014 key delivery/)
    expect(t).toMatch(/This workshop is a classical mock/)
    expect(t).toMatch(/nothing here is quantum-generated/)
    expect(t).not.toMatch(/never sent over any network/)
    expect(t).not.toMatch(/without transmitting the secret/)
    expect(t).not.toMatch(/established by quantum physics/)
  })

  it('names the local HTTPS key delivery and the bytes the remote applications do not exchange', () => {
    const t = pageText()
    expect(t).toMatch(
      /fetches the key from its own local key manager \(KME\) over HTTPS with mutual authentication \(TLS 1\.2 or higher\)/
    )
    expect(t).toMatch(/not between the two remote applications/)
    expect(t).toMatch(
      /exchange only the key_ID reference \(how the master SAE notifies the slave SAE is outside GS QKD 014\), not the secret bytes/
    )
  })
})

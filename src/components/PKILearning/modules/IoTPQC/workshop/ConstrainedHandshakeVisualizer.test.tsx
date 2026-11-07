// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ConstrainedHandshakeVisualizer } from './ConstrainedHandshakeVisualizer'

describe('ConstrainedHandshakeVisualizer: loss and retransmission are stated by DTLS version', () => {
  const text = () => {
    const { container } = render(
      <ConstrainedHandshakeVisualizer initial={{ kemId: 'ml-kem-768', sigId: 'ml-dsa-65' }} />
    )
    return (container.textContent ?? '').replace(/\s+/g, ' ')
  }

  it('does not teach whole-flight retransmission as universal', () => {
    const t = text()
    expect(t).toMatch(/DTLS 1\.2 retransmits everything in the flight on a timeout/)
    expect(t).toMatch(/DTLS 1\.3 lets the peer acknowledge the records it received/)
    expect(t).not.toMatch(/and DTLS retransmits whole flights/)
  })

  it('states the model assumption (one clean pass, no loss simulated) and carries no unsupported error band', () => {
    const t = text()
    expect(t).toMatch(/does not simulate loss or retransmission/)
    expect(t).not.toMatch(/±\s*10/)
  })
})

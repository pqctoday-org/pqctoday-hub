// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { HNFLTimeline } from './HNFLTimeline'

describe('HNFL timeline scenario and signature-history scope', () => {
  it('labels the year as a scenario and avoids claiming old signatures change', () => {
    const { container } = render(<HNFLTimeline />)
    const text = (container.textContent ?? '').replace(/\s+/g, ' ')
    expect(screen.getByLabelText('CRQC Planning Year (Scenario)')).toBeInTheDocument()
    expect(text).toMatch(/scenario input, not an arrival prediction/)
    expect(text).toMatch(/This does not change old files or signatures/)
    expect(text).toMatch(/preserved timestamps and archive evidence/)
    expect(text).toMatch(
      /algorithm-specific estimate does not establish a general TLS handshake attack time/
    )
    expect(text).not.toMatch(/retroactively forged/)
    expect(text).not.toMatch(/every past and future signature becomes forgeable/)
    expect(text).not.toMatch(/on-setup.*during handshakes/i)
  })
})

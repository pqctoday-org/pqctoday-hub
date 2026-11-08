// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { EmbedProvider } from '../../../../../embed/EmbedProvider'
import { OTPQCIntroduction } from './OTPQCIntroduction'

describe('OTPQC introduction: BACnet/SC hybrid group', () => {
  it('does not present a hybrid ML-KEM group as a routine stack update', () => {
    const { container } = render(
      <EmbedProvider>
        <MemoryRouter initialEntries={['/learn/ot-pqc?section=sectors']}>
          <OTPQCIntroduction onNavigateToWorkshop={() => {}} />
        </MemoryRouter>
      </EmbedProvider>
    )
    const t = (container.textContent ?? '').replace(/\s+/g, ' ')
    expect(t).toMatch(/BACnet\/SC brings TLS 1\.3 and X\.509/)
    expect(t).not.toMatch(/hybrid ML-KEM group is a stack update/)
    expect(t).toMatch(/a hybrid group depends on the profile, the TLS stack and both peers/)
  })
})

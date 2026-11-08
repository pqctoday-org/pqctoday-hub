// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../../embed/EmbedProvider'
import { HealthcarePQCIntroduction } from './HealthcarePQCIntroduction'

function introText(section?: string): string {
  const path = section ? `/learn/healthcare-pqc?section=${section}` : '/learn/healthcare-pqc'
  render(
    <EmbedProvider>
      <MemoryRouter initialEntries={[path]}>
        <HealthcarePQCIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    </EmbedProvider>
  )
  return (document.body.textContent ?? '').replace(/\s+/g, ' ')
}

describe('HealthcarePQCIntroduction biometric section', () => {
  it('does not equate a biometric breach with automatic, irreversible loss of every identity', () => {
    const text = introText()
    expect(text).not.toMatch(/permanently compromises every identity/i)
    expect(text).not.toMatch(/a biometric breach is irreversible/i)
    expect(text).not.toMatch(/cannot be rotated, revoked, or reissued after a breach/i)
  })

  it('separates the trait, the raw sample, the stored template and the authentication attack', () => {
    const text = introText()
    expect(text).toMatch(/Keep four things apart/)
    for (const word of ['trait', 'raw sample', 'template', 'authentication attack']) {
      expect(text).toContain(word)
    }
  })

  it('teaches the remedies: minimisation and deletion, template protection, PAD, second factor', () => {
    const text = introText()
    expect(text).toMatch(/keep as little as possible and delete what is no longer needed/i)
    expect(text).toMatch(/template-protection schemes can make it revocable/i)
    expect(text).toMatch(/presentation attack detection \(PAD\)/i)
    expect(text).toMatch(/physical authenticator/i)
  })

  it('keeps the genomic family-risk lesson', () => {
    const text = introText()
    expect(text).toMatch(/shared with relatives/i)
    expect(text).toMatch(/biological relatives/i)
  })

  it('quotes the OPM figure as a subset of the 21.5 million affected people', () => {
    const text = introText()
    expect(text).toMatch(/approximately 5\.6 million of the 21\.5 million/)
  })
})

describe('HealthcarePQCIntroduction constrained-device section', () => {
  it('puts hash-based signature state on the signer, not on the verifying pacemaker', () => {
    const text = introText('device-safety')
    expect(text).not.toMatch(/the device must track which one-time keys have been used/i)
    expect(text).toMatch(/the state belongs to the signer/i)
    expect(text).toMatch(/The pacemaker holds no such state/i)
  })

  it('keeps anti-rollback separate from signature state and places FN-DSA floating-point cost on the signer', () => {
    const text = introText('device-safety')
    expect(text).toMatch(/anti-rollback\) is a separate mechanism/i)
    expect(text).toMatch(/floating-point cost is in signing/i)
    expect(text).toMatch(/verification is integer-only/i)
  })
})

describe('HealthcarePQCIntroduction real incidents', () => {
  it('keeps the real pacemaker advisory separate from the hypothetical quantum scenarios', () => {
    const text = introText('device-safety')
    expect(text).toMatch(/ICSMA-17-241-01/)
    expect(text).toMatch(
      /ordinary authentication and rate-limiting weakness that needed no quantum computer/
    )
    expect(text).toMatch(/hypothetical devices and are kept separate/)
  })
})

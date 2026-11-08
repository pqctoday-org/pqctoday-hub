// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { SMIME_CERT_EXTENSIONS } from './emailSigningConstants'

describe('S/MIME certificate extension descriptions', () => {
  it('does not call the mailbox address in subjectAltName a requirement of S/MIME in general', () => {
    const san = SMIME_CERT_EXTENSIONS.find((e) => e.name === 'subjectAltName')!
    expect(san.description).not.toMatch(/required/i)
    expect(san.description).toMatch(/commonly carried in S\/MIME certificates/)
  })
})

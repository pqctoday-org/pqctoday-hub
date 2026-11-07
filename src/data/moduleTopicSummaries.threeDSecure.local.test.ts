// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { MODULE_TOPIC_SUMMARIES } from './moduleTopicSummaries'

describe('payments topic summary: 3-D Secure signing', () => {
  const summary = MODULE_TOPIC_SUMMARIES['emv-payment-pqc'] ?? ''

  it('does not state that ECDSA signs the cardholder challenge', () => {
    expect(summary).toBeTruthy()
    expect(summary).not.toMatch(/3-D Secure 2\.x ECDSA challenge signing/)
  })

  it('describes the open-source picture and says the signing details are not verified here', () => {
    expect(summary).toMatch(/signing details this module does not verify/)
    expect(summary).toMatch(/ES256 \(ECDSA P-256\) or PS256 \(RSA-PSS\)/)
    expect(summary).toMatch(/P-256 Diffie-Hellman key agreement for the challenge channel/)
    expect(summary).toMatch(/device information encrypted to the directory server's public key/)
  })
})

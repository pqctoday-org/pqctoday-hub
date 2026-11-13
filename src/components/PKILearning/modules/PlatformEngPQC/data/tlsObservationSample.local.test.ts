// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  TLS_CAPTURE_SAMPLES,
  parseTlsObservation,
  groupDecision,
  tlsObservationMetric,
} from './tlsObservationSample'

describe('TLS observation sample parsing', () => {
  it('separates different captured groups despite identical cipher suite and authentication', () => {
    const hybrid = parseTlsObservation(TLS_CAPTURE_SAMPLES.hybrid.output, 0)
    const classical = parseTlsObservation(TLS_CAPTURE_SAMPLES.classical.output, 0)
    expect(hybrid.cipherSuite).toBe(classical.cipherSuite)
    expect(hybrid.authSignature).toBe(classical.authSignature)
    expect(hybrid.negotiatedGroup).toBe('X25519MLKEM768')
    expect(classical.negotiatedGroup).toBe('X25519')
    expect(groupDecision(hybrid)).toBe('Group allowed by sample policy')
    expect(groupDecision(classical)).toBe('Group allowed by sample policy')
  })
  it('does not derive a missing or contradictory group from the cipher suite', () => {
    const missing = TLS_CAPTURE_SAMPLES.hybrid.output.replace(
      'Negotiated TLS1.3 group: X25519MLKEM768\n',
      ''
    )
    expect(groupDecision(parseTlsObservation(missing, 0))).toBe('Negotiated group not observed')
    expect(
      parseTlsObservation(
        TLS_CAPTURE_SAMPLES.hybrid.output + '\nPeer Temp Key: X25519, 253 bits',
        0
      ).negotiatedGroup
    ).toBe('')
  })
  it('blocks verified classification after process or certificate verification failure', () => {
    expect(parseTlsObservation(TLS_CAPTURE_SAMPLES.hybrid.output, 1)).toMatchObject({
      result: 'failed',
      negotiatedGroup: '',
    })
    expect(
      parseTlsObservation(TLS_CAPTURE_SAMPLES.hybrid.output + '\nVerification error: untrusted', 0)
        .result
    ).toBe('failed')
    expect(parseTlsObservation('Ciphersuite: TLS_AES_256_GCM_SHA384', 0).result).toBe('incomplete')
  })
  it('marks a known group outside the declared policy without claiming an attack', () => {
    const observation = parseTlsObservation(
      TLS_CAPTURE_SAMPLES.hybrid.output.replace('X25519MLKEM768', 'secp384r1'),
      0
    )
    expect(groupDecision(observation)).toBe('Group outside sample policy')
  })
  it('escapes untrusted label quotes, backslashes and newlines', () => {
    const metric = tlsObservationMetric({
      result: 'incomplete',
      protocol: 'TLS',
      cipherSuite: 'a"b\\c\nd',
      negotiatedGroup: '',
      authSignature: '',
    })
    expect(metric).toContain('cipher_suite="a\\"b\\\\c\\nd"')
    expect(metric.trim().split('\n')).toHaveLength(3)
  })
})

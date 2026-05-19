// SPDX-License-Identifier: GPL-3.0-only
/**
 * smimeMultipart KAT tests.
 *
 * The wrapper is a deterministic MIME formatter — given fixed input bytes
 * and explicit headers (date pinned), the output is byte-equal across
 * runs. These tests pin known-good outputs as KAT vectors per the
 * feedback-unit-tests-kat rule.
 */
import { describe, expect, it } from 'vitest'
import { smimeEnvelopeSigned, smimeEnvelopeEncrypted } from './smimeMultipart'

// Three deterministic input bytes. The base64 of [0xDE, 0xAD, 0xBE, 0xEF]
// is "3q2+7w==" — pinned in the assertions below.
const KAT_BYTES = new Uint8Array([0xde, 0xad, 0xbe, 0xef])

// Headers with a fixed date so the output is reproducible.
const KAT_HEADERS = {
  from: 'alice@example.com',
  to: 'bob@example.com',
  subject: 'KAT test',
  date: 'Mon, 16 May 2026 00:00:00 GMT',
}

describe('smimeMultipart — signed envelope KAT', () => {
  it('produces the exact MIME header + base64 body for known bytes', () => {
    const out = smimeEnvelopeSigned(KAT_BYTES, KAT_HEADERS)
    const expected = [
      'From: alice@example.com',
      'To: bob@example.com',
      'Subject: KAT test',
      'Date: Mon, 16 May 2026 00:00:00 GMT',
      'MIME-Version: 1.0',
      'Content-Type: application/pkcs7-mime; smime-type=signed-data; name="smime.p7m"',
      'Content-Transfer-Encoding: base64',
      'Content-Disposition: attachment; filename="smime.p7m"',
      '',
      '3q2+7w==',
      '',
    ].join('\r\n')
    expect(out).toBe(expected)
  })

  it('uses signed-data smime-type token', () => {
    const out = smimeEnvelopeSigned(KAT_BYTES, KAT_HEADERS)
    expect(out).toContain('smime-type=signed-data')
    expect(out).not.toContain('enveloped-data')
  })

  it('wraps base64 at 64 columns', () => {
    // 100 bytes → 136 base64 chars → wraps to 64 + 64 + 8.
    const big = new Uint8Array(100).fill(0x41) // all 'A' bytes
    const out = smimeEnvelopeSigned(big, KAT_HEADERS)
    const bodyStart = out.indexOf('\r\n\r\n') + 4
    const bodyLines = out
      .slice(bodyStart)
      .split('\r\n')
      .filter((l) => l.length > 0)
    expect(bodyLines[0]).toHaveLength(64)
    expect(bodyLines[1]).toHaveLength(64)
    expect(bodyLines[2].length).toBeLessThanOrEqual(64)
  })
})

describe('smimeMultipart — encrypted envelope KAT', () => {
  it('produces the exact MIME header + base64 body for known bytes', () => {
    const out = smimeEnvelopeEncrypted(KAT_BYTES, KAT_HEADERS)
    const expected = [
      'From: alice@example.com',
      'To: bob@example.com',
      'Subject: KAT test',
      'Date: Mon, 16 May 2026 00:00:00 GMT',
      'MIME-Version: 1.0',
      'Content-Type: application/pkcs7-mime; smime-type=enveloped-data; name="smime.p7m"',
      'Content-Transfer-Encoding: base64',
      'Content-Disposition: attachment; filename="smime.p7m"',
      '',
      '3q2+7w==',
      '',
    ].join('\r\n')
    expect(out).toBe(expected)
  })

  it('uses enveloped-data smime-type token', () => {
    const out = smimeEnvelopeEncrypted(KAT_BYTES, KAT_HEADERS)
    expect(out).toContain('smime-type=enveloped-data')
    expect(out).not.toContain('signed-data')
  })
})

describe('smimeMultipart — encoding correctness vs the spec', () => {
  it('base64 of empty payload is the empty string', () => {
    const out = smimeEnvelopeSigned(new Uint8Array(0), KAT_HEADERS)
    expect(out).toMatch(/\r\n\r\n\r\n$/) // empty body between blank-line separator and trailing CRLF
  })

  it('every header line uses CRLF, not bare LF', () => {
    const out = smimeEnvelopeSigned(KAT_BYTES, KAT_HEADERS)
    const headerSection = out.split('\r\n\r\n')[0]
    expect(headerSection).not.toMatch(/[^\r]\n/) // any \n must be preceded by \r
  })

  it('does not depend on system date when date header is provided', () => {
    const a = smimeEnvelopeSigned(KAT_BYTES, KAT_HEADERS)
    const b = smimeEnvelopeSigned(KAT_BYTES, KAT_HEADERS)
    expect(a).toBe(b)
  })
})

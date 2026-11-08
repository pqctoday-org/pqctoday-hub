// SPDX-License-Identifier: AGPL-3.0-only
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { content } from './content'

describe('TLS Basics: Encrypted Client Hello citation', () => {
  it('cites the RFC 9849 Library row and states what it supports in the lesson text', () => {
    expect(content.standards.map((s) => s.id)).toContain('RFC-9849')
    const source = readFileSync(join(__dirname, 'components/TLSIntroduction.tsx'), 'utf8')
    expect(source).toContain(
      "Encrypted Client Hello (ECH), published as RFC 9849, encrypts the inner ClientHello with HPKE under the server's ECH key."
    )
  })
})

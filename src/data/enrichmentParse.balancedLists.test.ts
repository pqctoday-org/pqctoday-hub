// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { parseEnrichmentMarkdown } from './enrichmentParse'

const list = (value: string) =>
  parseEnrichmentMarkdown(`## Fixture\n- **Security Levels & Parameters**: ${value}\n`).Fixture
    .securityLevels

describe('enrichment lists retain balanced parameter names', () => {
  it.each([
    ['ML-KEM (512, 768), ML-DSA; AES', ['ML-KEM (512, 768)', 'ML-DSA', 'AES']],
    ['Profile [AES, SHA]; ML-KEM', ['Profile [AES, SHA]', 'ML-KEM']],
    ['Parameters {x, y}, TLS', ['Parameters {x, y}', 'TLS']],
    [
      'Profile ([AES, SHA], {ML-KEM, ML-DSA}); TLS',
      ['Profile ([AES, SHA], {ML-KEM, ML-DSA})', 'TLS'],
    ],
    ['Profile (mode A; mode B), TLS', ['Profile (mode A; mode B)', 'TLS']],
  ])('preserves names in %s', (raw, expected) => expect(list(raw as string)).toEqual(expected))

  it('keeps ordinary comma/semicolon grammar, trimming, empty items and the sentinel', () => {
    expect(list(' TLS , IPsec; ; X.509, ')).toEqual(['TLS', 'IPsec', 'X.509'])
    expect(list('None detected')).toEqual([])
    expect(list('Label "a,b", TLS')).toEqual(['Label "a', 'b"', 'TLS'])
  })

  it.each(['A (one, two; TLS', 'A [one, two), TLS', 'A } , TLS', 'A (one, [two), three]'])(
    'falls back to existing list grammar for malformed input %s',
    (raw) => {
      expect(list(raw)).toEqual(
        raw
          .split(/[,;]/)
          .map((s) => s.trim())
          .filter(Boolean)
      )
    }
  )

  it('keeps phrase-only fields on their existing semicolon grammar', () => {
    const entry = parseEnrichmentMarkdown(
      '## Fixture\n- **Key Takeaways**: One (a; b); Two\n'
    ).Fixture
    expect(entry.keyTakeaways).toEqual(['One (a', 'b)', 'Two'])
  })
})

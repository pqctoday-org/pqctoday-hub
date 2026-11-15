// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { parseEnrichmentMarkdown } from './enrichmentParse'

const list = (value: string) =>
  parseEnrichmentMarkdown(`## Fixture\n- **Security Levels & Parameters**: ${value}\n`).Fixture
    .securityLevels

describe('enrichment lists retain balanced parameter names', () => {
  it.each([
    ['ML-KEM (512, 768), ML-DSA, AES', ['ML-KEM (512, 768)', 'ML-DSA', 'AES']],
    ['ML-KEM (512, 768); ML-DSA; AES', ['ML-KEM (512, 768)', 'ML-DSA', 'AES']],
    ['Profile [AES, SHA]; ML-KEM', ['Profile [AES, SHA]', 'ML-KEM']],
    ['Parameters {x, y}, TLS', ['Parameters {x, y}', 'TLS']],
    [
      'Profile ([AES, SHA], {ML-KEM, ML-DSA}); TLS',
      ['Profile ([AES, SHA], {ML-KEM, ML-DSA})', 'TLS'],
    ],
    ['Profile (mode A; mode B), TLS', ['Profile (mode A; mode B)', 'TLS']],
  ])('preserves names in %s', (raw, expected) => expect(list(raw as string)).toEqual(expected))

  it('keeps ordinary comma or semicolon grammar, trimming, empty items and the sentinel', () => {
    expect(list(' TLS , IPsec, , X.509, ')).toEqual(['TLS', 'IPsec', 'X.509'])
    expect(list(' TLS ; IPsec; ; X.509; ')).toEqual(['TLS', 'IPsec', 'X.509'])
    expect(list('None detected')).toEqual([])
    expect(list('Label "a,b", TLS')).toEqual(['Label "a', 'b"', 'TLS'])
  })

  it.each(['A (one, two; TLS', 'A [one, two), TLS', 'A } , TLS', 'A (one, [two), three]'])(
    'falls back to existing list grammar for malformed input %s',
    (raw) => {
      expect(list(raw)).toEqual(
        raw
          .split(raw.includes(';') ? ';' : ',')
          .map((s) => s.trim())
          .filter(Boolean)
      )
    }
  )

  it('splits a semicolon-separated value on semicolons only, keeping commas inside an item', () => {
    // ISM December 2024 timeline record: one sentence used to show as two chips
    expect(
      parseEnrichmentMarkdown(
        '## Fixture\n- **Hybrid & Transition Approaches**: Post-quantum traditional hybrid schemes (e.g. ML-KEM with RSA) are not recommended but not prohibited, and at least one algorithm must be an AACA (ISM-1996); transition to pure post-quantum schemes anticipated\n'
      ).Fixture.hybridApproaches
    ).toEqual([
      'Post-quantum traditional hybrid schemes (e.g. ML-KEM with RSA) are not recommended but not prohibited, and at least one algorithm must be an AACA (ISM-1996)',
      'transition to pure post-quantum schemes anticipated',
    ])
    expect(list('Harvest Now, Decrypt Later; quantum attack on exposed public keys')).toEqual([
      'Harvest Now, Decrypt Later',
      'quantum attack on exposed public keys',
    ])
    // a semicolon only inside a group leaves the value a comma list
    expect(list('Profile (mode A; mode B), TLS')).toEqual(['Profile (mode A; mode B)', 'TLS'])
  })

  it('keeps phrase-only fields on their existing semicolon grammar', () => {
    const entry = parseEnrichmentMarkdown(
      '## Fixture\n- **Key Takeaways**: One (a; b); Two\n'
    ).Fixture
    expect(entry.keyTakeaways).toEqual(['One (a', 'b)', 'Two'])
  })
})

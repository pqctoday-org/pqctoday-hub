// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { AGILITY_PATTERNS } from './agilityPatternsData'

const pattern = (id: string) => AGILITY_PATTERNS.find((p) => p.id === id)!

describe('algorithm negotiation teaches authenticated, fail-closed selection', () => {
  const negotiation = pattern('algorithm-negotiation')
  const example = negotiation.codeExamples[0]

  it('does not claim server-side selection prevents downgrade', () => {
    const text = [negotiation.description, ...negotiation.tradeoffs.flatMap((t) => [t.pro, t.con])]
      .concat(negotiation.codeExamples.flatMap((c) => [c.code, c.notes]))
      .join('\n')
    expect(text).not.toMatch(/Server-side selection prevents/i)
    expect(example.notes).toMatch(/does not prevent downgrade/i)
  })

  it('binds the offers and the choice into an authenticated transcript', () => {
    expect(example.code).toMatch(/transcript/i)
    expect(example.notes).toMatch(/transcript/i)
    expect(example.notes).toMatch(/CertificateVerify/)
  })

  it('enforces a minimum policy that fails closed, with an explicit fallback condition', () => {
    expect(example.code).toMatch(/minimum/i)
    expect(example.code).toMatch(/abort/i)
    expect(example.code).toMatch(/classicalFallback/)
    expect(example.notes).toMatch(/fails? closed/i)
    expect(example.notes).toMatch(/logged/i)
  })

  it('states the limit: the binding is only as strong as the authentication algorithm', () => {
    expect(example.notes).toMatch(/only as strong as the authentication algorithm/i)
  })
})

describe('provider abstraction distinguishes loading from selecting an OpenSSL implementation', () => {
  const openssl = pattern('provider-abstraction').codeExamples.find((c) =>
    /OpenSSL/.test(c.language)
  )!

  it('does not say loading a provider makes every EVP call use it', () => {
    expect(openssl.code).not.toMatch(/All EVP calls now use the configured provider/i)
    expect(openssl.code).toMatch(/does not select/i)
  })

  it('selects through a property query at fetch time', () => {
    expect(openssl.code).toMatch(/EVP_PKEY_CTX_new_from_name\(NULL, \w+, query\)/)
    expect(openssl.code).toMatch(/provider=%s/)
    expect(openssl.notes).toMatch(/property query/i)
    expect(openssl.notes).toMatch(/indeterminate/i)
  })

  it('notes that an explicit load switches off the implicit default fallback', () => {
    expect(openssl.code).toMatch(/OSSL_PROVIDER_load\(NULL, "default"\)/)
    expect(openssl.code).toMatch(/fallback/i)
  })
})

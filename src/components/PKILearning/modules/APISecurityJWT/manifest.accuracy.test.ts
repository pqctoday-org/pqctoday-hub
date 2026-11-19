// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import manifest from './manifest'
import { content } from './content'

describe('API Security & JWT catalog accuracy', () => {
  it('separates public-key forgery, HNDL and HMAC quantum risk', () => {
    expect(manifest.whyThisMatters).toMatch(/public-key-signed JWTs such as RS256 and ES256/i)
    expect(manifest.whyThisMatters).toMatch(
      /enable new tokens while verifiers still trust those keys/i
    )
    expect(manifest.whyThisMatters).toMatch(/not a harvest-now-decrypt-later threat/i)
    expect(manifest.whyThisMatters).toMatch(/HMAC-based HS256 has a different quantum risk/i)
    expect(manifest.whyThisMatters).not.toMatch(
      /Every OAuth token and API call .* could be forged retroactively/i
    )
    const standardIds = content.standards.map((standard) => standard.id)
    expect(standardIds).toContain('FIPS 204')
    expect(standardIds).toContain('RFC 7519')
    expect(standardIds).toContain('RFC 8725')
  })
})

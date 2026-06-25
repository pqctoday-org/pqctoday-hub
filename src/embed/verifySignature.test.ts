// SPDX-License-Identifier: GPL-3.0-only
/**
 * Tests for the embed URL signature verification gate (M8).
 *
 * This is the security boundary that decides whether an embedding vendor is
 * trusted, so its input-validation and canonicalization deserve direct tests.
 * Crypto-dependent steps (cert chain, ECDSA verify) need real PKI fixtures and
 * are exercised elsewhere; here we pin the cheap, high-value checks that run
 * BEFORE any vendor lookup, plus the canonical-string builder and vendor-lookup
 * failure paths (vendor registry mocked).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { findVendor } from './vendorRegistry'
import { verifyEmbedUrl, buildCanonicalString, EmbedVerificationError } from './verifySignature'

vi.mock('./vendorRegistry', () => ({ findVendor: vi.fn() }))
// certParser bundles the root-CA PEM via `?raw`, which the test sandbox blocks
// from disk. These tests stop before any cert parsing, so stub the module to
// keep that import out of the graph.
vi.mock('./certParser', () => ({ parsePemCertificate: vi.fn(), verifyChain: vi.fn() }))

const REQUIRED = ['kid', 'uid', 'exp', 'nonce', 'routes', 'persist', 'sig'] as const

/** A param set that passes every check up to the vendor lookup. */
function validParams(overrides: Record<string, string> = {}): URLSearchParams {
  const p = new URLSearchParams({
    kid: 'vendor-1',
    uid: 'user-1',
    exp: String(Math.floor(Date.now() / 1000) + 600),
    nonce: 'abcdefghijklmnop', // 16 chars (minimum)
    routes: 'learn',
    persist: 'none',
    sig: 'AAAA',
    ...overrides,
  })
  return p
}

const urlWith = (params: URLSearchParams) =>
  new URL(`https://app.example/embed?${params.toString()}`)

beforeEach(() => {
  vi.mocked(findVendor).mockReset()
})

describe('verifyEmbedUrl — input validation (pre-vendor)', () => {
  it.each(REQUIRED)('rejects a URL missing the required "%s" param', async (missing) => {
    const params = validParams()
    params.delete(missing)
    await expect(verifyEmbedUrl(urlWith(params))).rejects.toMatchObject({
      code: 'missing_params',
    })
    // a param check should never have reached the vendor registry
    expect(findVendor).not.toHaveBeenCalled()
  })

  it('rejects a nonce shorter than 16 characters', async () => {
    const params = validParams({ nonce: 'tooshort' })
    await expect(verifyEmbedUrl(urlWith(params))).rejects.toMatchObject({
      code: 'missing_params',
    })
  })

  it('rejects an unknown persist mode', async () => {
    const params = validParams({ persist: 'localStorage' })
    await expect(verifyEmbedUrl(urlWith(params))).rejects.toMatchObject({
      code: 'missing_params',
    })
  })

  it('accepts both documented persist modes far enough to reach the vendor lookup', async () => {
    vi.mocked(findVendor).mockResolvedValue(undefined)
    for (const persist of ['none', 'postMessage']) {
      await expect(verifyEmbedUrl(urlWith(validParams({ persist })))).rejects.toMatchObject({
        code: 'unknown_vendor',
      })
    }
  })
})

describe('verifyEmbedUrl — vendor lookup failures', () => {
  it('rejects an unknown vendor with its kid attached', async () => {
    vi.mocked(findVendor).mockResolvedValue(undefined)
    await expect(verifyEmbedUrl(urlWith(validParams({ kid: 'nope' })))).rejects.toMatchObject({
      code: 'unknown_vendor',
      kid: 'nope',
    })
  })

  it('rejects a revoked vendor certificate', async () => {
    vi.mocked(findVendor).mockResolvedValue({
      revoked: true,
      certPem: '',
    } as Awaited<ReturnType<typeof findVendor>>)
    await expect(verifyEmbedUrl(urlWith(validParams()))).rejects.toMatchObject({
      code: 'revoked',
    })
  })

  it('throws EmbedVerificationError instances (not bare Errors)', async () => {
    vi.mocked(findVendor).mockResolvedValue(undefined)
    await expect(verifyEmbedUrl(urlWith(validParams()))).rejects.toBeInstanceOf(
      EmbedVerificationError
    )
  })
})

describe('buildCanonicalString', () => {
  it('sorts params alphabetically by key and joins key=value with &', () => {
    const params = new URLSearchParams({ b: '2', a: '1', c: '3' })
    expect(buildCanonicalString(params)).toBe('a=1&b=2&c=3')
  })

  it('excludes the signature param (sig) and the post-verification param (ind)', () => {
    const params = new URLSearchParams({ kid: 'v1', sig: 'SIGNATURE', ind: 'x', uid: 'u1' })
    const canonical = buildCanonicalString(params)
    expect(canonical).toBe('kid=v1&uid=u1')
    expect(canonical).not.toContain('SIGNATURE')
    expect(canonical).not.toContain('ind=')
  })

  it('does NOT URL-encode values (PRD §4.3)', () => {
    const params = new URLSearchParams({ routes: 'a,b,c', nonce: 'x y' })
    // URLSearchParams decodes on read, so the canonical string holds raw values.
    expect(buildCanonicalString(params)).toBe('nonce=x y&routes=a,b,c')
  })

  it('is stable regardless of original param insertion order', () => {
    const a = new URLSearchParams('uid=u1&kid=v1&exp=10')
    const b = new URLSearchParams('exp=10&kid=v1&uid=u1')
    expect(buildCanonicalString(a)).toBe(buildCanonicalString(b))
  })
})

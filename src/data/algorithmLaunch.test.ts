// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { algorithmCatalogue } from './algorithmCatalogue'
import {
  algorithmLaunchHref,
  getAlgorithmLaunch,
  readAlgorithmLaunch,
  algorithmLaunchError,
} from './algorithmLaunch'
import { getAlgoCtasWithFallback } from './algorithmCtaMap'
import { getAlgorithmStatusAssertions } from './algorithmStatusAssertions'
import { loadPQCAlgorithmsData, getWithheldCatalogueRows } from './pqcAlgorithmsData'

it('accounts for every catalogue row with exact execution or an explicit reason', async () => {
  const visible = await loadPQCAlgorithmsData()
  expect(algorithmCatalogue).toHaveLength(127)
  expect(visible).toHaveLength(125)
  expect(getWithheldCatalogueRows()).toMatchObject({ unclassified: 0, placeholder: 2 })
  for (const row of visible) {
    const cta = getAlgoCtasWithFallback(row.name)
    expect(Boolean(cta.try) !== Boolean(cta.unavailableReason), row.name).toBe(true)
    expect(Boolean(cta.specRef || cta.specUrl), row.name).toBe(true)
    if (cta.try) {
      const url = new URL(cta.try, 'https://www.pqctoday.com')
      const launch = readAlgorithmLaunch(url.pathname.split('/')[2], url.search)
      expect(launch?.algorithm, row.name).toBe(row.name)
      expect(algorithmLaunchError(url.pathname.split('/')[2], url.search)).toBeNull()
    }
  }
})

describe('launch identity', () => {
  it.each([
    'FN-DSA-1024',
    'HQC-192',
    'HQC-256',
    'FrodoKEM-976',
    'FrodoKEM-1344',
    'MAYO-2',
    'MAYO-3',
    'MAYO-5',
  ])('retains %s rather than a smaller variant', (name) => {
    expect(
      new URL(algorithmLaunchHref(name)!, 'https://example.org').searchParams.get('algo')
    ).toBe(name.startsWith('FrodoKEM') ? `${name}-AES` : name)
  })
  it('selects X-Wing HPKE-9, separate from TLS and composite constructions', () => {
    expect(getAlgorithmLaunch('X-Wing')).toMatchObject({
      toolId: 'api-security-jwt',
      suite: 'HPKE-9',
    })
    expect(getAlgorithmLaunch('X25519MLKEM768')).toMatchObject({
      toolId: 'tls-simulator',
      parameter: 'X25519MLKEM768',
    })
    expect(getAlgorithmLaunch('id-MLKEM768-X25519-SHA3-256')).toMatchObject({
      toolId: 'hsm',
      family: 'kem',
    })
  })
  it('rejects draft sets, prefix collisions and mismatched destinations', () => {
    for (const name of [
      'SLH-DSA-SHA2-128-24',
      'ML-KEM-768-RSA-OAEP-2048',
      'ML-DSA-65-composite',
      'DH (Diffie-Hellman)',
      'sntrup761x25519-sha512',
    ]) {
      expect(algorithmLaunchHref(name)).toBeUndefined()
      expect(getAlgoCtasWithFallback(name).unavailableReason).toBeTruthy()
    }
    expect(algorithmLaunchError('hybrid-encrypt', '?launchAlgo=X-Wing')).toBeTruthy()
  })
  it('maps classical names to exact option identities', () => {
    expect(getAlgorithmLaunch('ECDH P-384')?.classical).toBe('P-384')
    expect(getAlgorithmLaunch('ECDSA P-521')?.classical).toBe('ECDSA-P521')
    expect(getAlgorithmLaunch('DH (Diffie-Hellman)')).toBeUndefined()
  })
})

describe('independent status assertions', () => {
  it('keeps BSI document/publication dates separate, with no invented expiry', () => {
    for (const row of algorithmCatalogue.filter((r) =>
      r.algorithm.startsWith('Classic-McEliece')
    )) {
      const warning = getAlgorithmStatusAssertions(row.algorithm).find(
        (a) => a.kind === 'new-use-warning'
      )!
      expect(warning.documentDate).toBe('2026-09-29')
      expect(warning.publishedAt).toBe('2026-10-01')
      expect(warning.effectiveUntil).toBeUndefined()
      expect(warning.conditions).toContain('2^99')
    }
  })
  it('does not assign ANSSI PQ hybrid guidance to classical rows', () => {
    expect(getAlgorithmStatusAssertions('X25519').some((a) => a.authority === 'ANSSI')).toBe(false)
    expect(
      getAlgorithmStatusAssertions('SLH-DSA-SHA2-128s').find((a) => a.authority === 'ANSSI')?.value
    ).toContain('Exempt')
    expect(getAlgorithmStatusAssertions('Aigis-enc-L1')[0].evidenceState).toBe('needs-review')
  })
})

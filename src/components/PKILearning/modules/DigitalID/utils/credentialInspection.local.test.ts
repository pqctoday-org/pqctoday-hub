// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { encode } from 'cborg'
import { inspectStoredCredential, recordedIsoTime, inspectedJson } from './credentialInspection'

const b64 = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url')
// Structural fixtures deliberately do not claim mathematical signature validity.
function sd(payload: Record<string, unknown> = { iat: 1, exp: 0 }) {
  const issuerJwt = `${b64({ typ: 'dc+sd-jwt', alg: 'ES256' })}.${b64(payload)}.${Buffer.from(new Uint8Array(64).fill(3)).toString('base64url')}`
  const array = ['fictional-salt', 'degree', 'Example degree']
  const raw = JSON.stringify(array),
    encoded = Buffer.from(raw).toString('base64url')
  return {
    issuerJwt,
    disclosures: [
      {
        raw,
        encoded,
        hash: 'not verified by inspection',
        salt: array[0],
        key: array[1],
        value: array[2],
      },
    ],
    raw: `${issuerJwt}~${encoded}~`,
  }
}
function mdoc(
  validity = new Map<string, unknown>([
    ['signed', '2026-01-01T00:00:00Z'],
    ['validFrom', '2026-01-01T00:00:00Z'],
    ['validUntil', '2026-02-01T00:00:00Z'],
  ])
) {
  const payload = encode(
    new Map<string, unknown>([
      ['docType', 'example.pid'],
      ['validityInfo', validity],
    ])
  )
  const cose = encode([encode(new Map([[1, -7]])), new Map(), payload, new Uint8Array(64).fill(4)])
  return {
    docType: 'example.pid',
    mobileSecurityObject: { validityInfo: {} },
    issuerSignature: Buffer.from(cose).toString('base64'),
  }
}
describe('existing stored credential bytes and signed-field inspection only', () => {
  it('extracts actual SD-JWT bytes and NumericDate zero without a duration fallback', () => {
    const wrapper = sd(),
      result = inspectStoredCredential({ format: 'dc+sd-jwt', raw: JSON.stringify(wrapper) })
    expect(result.ok).toBe(true)
    expect(result.encoded).toBe(wrapper.raw)
    expect(result.times.find((t) => t.label === 'Encoded issuer exp')).toMatchObject({
      raw: 0,
      milliseconds: 0,
      iso: '1970-01-01T00:00:00.000Z',
    })
    expect(inspectStoredCredential({ format: 'dc+sd-jwt', raw: wrapper.raw }).decoded).toEqual(
      result.decoded
    )
  })
  it.each([
    'issuerJwt',
    'encoded',
    'raw',
    'salt',
    'key',
    'value',
    'missingDisclosure',
    'missingIssuer',
  ])('rejects a stored wrapper mismatch in %s rather than using a different mirror', (field) => {
    const wrapper = sd()
    if (field === 'issuerJwt') wrapper.issuerJwt = sd({ exp: 9999999999 }).issuerJwt
    else if (field === 'missingDisclosure') wrapper.disclosures = []
    else if (field === 'missingIssuer') delete (wrapper as Partial<typeof wrapper>).issuerJwt
    else Object.assign(wrapper.disclosures[0], { [field]: 'changed' })
    const result = inspectStoredCredential({ format: 'dc+sd-jwt', raw: JSON.stringify(wrapper) })
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/wrapper/)
    expect(result.times).toEqual([])
  })
  it.each([undefined, null, '123', Infinity])(
    'missing/invalid encoded exp %s stays specifically unknown',
    (exp) => {
      const wrapper = sd({ iat: 1, exp }),
        result = inspectStoredCredential({ format: 'dc+sd-jwt', raw: JSON.stringify(wrapper) })
      expect(result.ok).toBe(true)
      const time = result.times.find((t) => t.label === 'Encoded issuer exp')!
      expect(time.milliseconds).toBeUndefined()
      expect(time.issue).toMatch(/not recorded|NumericDate/)
    }
  )
  it('decodes actual COSE/MSO dates rather than the lossy or contradictory JSON mirror', () => {
    const wrapper = mdoc()
    wrapper.mobileSecurityObject.validityInfo = { validUntil: '2099-01-01T00:00:00Z' }
    const result = inspectStoredCredential({ format: 'mso_mdoc', raw: JSON.stringify(wrapper) })
    expect(result.ok).toBe(true)
    expect(result.encoded).toBe(wrapper.issuerSignature)
    expect(result.times.find((t) => t.label === 'Encoded MSO validUntil')?.raw).toBe(
      '2026-02-01T00:00:00Z'
    )
    expect(inspectedJson(result.decoded)).toContain('cborMapEntries')
  })
  it('rejects malformed CBOR, detached/wrong-shape/wrong-width COSE and wrapper docType mismatch', () => {
    const wrapper = mdoc(),
      bytes = Buffer.from(wrapper.issuerSignature, 'base64')
    for (const input of [
      bytes.subarray(0, -1),
      Buffer.concat([bytes, Buffer.from([0])]),
      encode([1, 2, 3, 4]),
      encode([encode(new Map([[1, -7]])), new Map(), encode(new Map()), new Uint8Array(70)]),
    ]) {
      expect(
        inspectStoredCredential({
          format: 'mso_mdoc',
          raw: JSON.stringify({
            ...wrapper,
            issuerSignature: Buffer.from(input).toString('base64'),
          }),
        }).ok
      ).toBe(false)
    }
    expect(
      inspectStoredCredential({
        format: 'mso_mdoc',
        raw: JSON.stringify({ ...wrapper, docType: 'other' }),
      }).error
    ).toMatch(/docType/)
  })
  it('reports missing dates without making them one year from issuance and rejects reversed time fields', () => {
    const empty = inspectStoredCredential({
      format: 'mso_mdoc',
      raw: JSON.stringify(mdoc(new Map())),
    })
    expect(empty.ok).toBe(true)
    expect(empty.times.every((t) => t.issue === 'Field not recorded')).toBe(true)
    const reversed = new Map([
      ['validFrom', '2030-01-01T00:00:00Z'],
      ['validUntil', '2020-01-01T00:00:00Z'],
    ])
    expect(
      inspectStoredCredential({ format: 'mso_mdoc', raw: JSON.stringify(mdoc(reversed)) }).error
    ).toMatch(/later than/)
  })
  it('does not pretend parsing verifies changed signature bytes', () => {
    const wrapper = sd(),
      parts = wrapper.issuerJwt.split('.'),
      sig = Buffer.from(parts[2], 'base64url')
    sig[0] ^= 1
    parts[2] = sig.toString('base64url')
    const raw = `${parts.join('.')}~${wrapper.disclosures[0].encoded}~`
    expect(inspectStoredCredential({ format: 'dc+sd-jwt', raw }).ok).toBe(true)
    // Independent mathematical rejection belongs to the COSE/provider suite.
  })
  it.each(['', '{bad', JSON.stringify({ sampleWrapper: true }), 'invalid~'])(
    'malformed stored sample %s cannot become a parsed credential',
    (raw) => {
      expect(inspectStoredCredential({ format: 'dc+sd-jwt', raw }).ok).toBe(false)
    }
  )
  it.each(['2026-02-31T00:00:00Z', '2026-01-01T00:00:00', 'not-a-date', '2026-13-01T00:00:00Z'])(
    'rejects invalid/ambiguous stored ISO date %s',
    (raw) => {
      expect(recordedIsoTime('Stored expirationDate', raw, true).milliseconds).toBeUndefined()
    }
  )
  it('keeps exact stored offsets and converts valid calendar dates without changing their raw text', () => {
    const raw = '2028-02-29T01:02:03+01:00',
      time = recordedIsoTime('Stored expirationDate', raw, true)
    expect(time.raw).toBe(raw)
    expect(time.iso).toBe('2028-02-29T00:02:03.000Z')
  })
})

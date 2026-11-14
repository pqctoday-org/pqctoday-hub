// SPDX-License-Identifier: AGPL-3.0-only
import 'reflect-metadata'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { createECDH, createPublicKey, ECDH } from 'node:crypto'
import { createRequire } from 'node:module'
import { fromBER, OctetString } from 'asn1js'
import path from 'node:path'
import * as SoftHSM from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import { newModule, runOpenssl, readFileBin, writeFile } from '@/test/kat/openssl-driver'
import { FiveGService } from '../FiveGService'
import { assembleSUCI, visualizeStructure } from './SucOps'
import { normalizeProfileBPoint } from './suciPublicPoint'

const fields = { encryptedMSINHex: '0102030405', macTagHex: '1122334455667788' }
const fixtures: Array<{
  provider: string
  raw: Buffer
  spki: Buffer
  compressed: string
  attribute?: Buffer
}> = []
const sessions: Array<{ M: SoftHSMModule; session: number }> = []
function addFixture(provider: string, raw: Buffer, spki: Buffer) {
  expect(raw.length).toBe(65)
  expect(spki.length).toBe(91)
  fixtures.push({
    provider,
    raw,
    spki,
    compressed: ECDH.convertKey(raw, 'prime256v1', undefined, undefined, 'compressed').toString(
      'hex'
    ),
  })
}
beforeAll(async () => {
  const require_ = createRequire(import.meta.url)
  const glue = path.resolve('src/vendor/softhsm-wasm/wasm/softhsm.js')
  const createCpp = require_(glue) as (config: Record<string, unknown>) => Promise<SoftHSMModule>
  for (const [provider, load] of [
    ['Rust HSM', () => SoftHSM.getSoftHSMRustModule() as Promise<SoftHSMModule>],
    [
      'C++ HSM',
      () => createCpp({ locateFile: (file: string) => path.resolve(path.dirname(glue), file) }),
    ],
  ] as const) {
    const M = await load()
    SoftHSM.hsm_initialize(M)
    const slot = SoftHSM.hsm_initToken(M, SoftHSM.hsm_getFirstFreeSlot(M), '1234', 'SUCI point')
    const session = SoftHSM.hsm_openUserSession(M, slot, '1234', '1234')
    sessions.push({ M, session })
    const key = SoftHSM.hsm_generateECKeyPair(M, session, 'P-256', false, 'Sample public point')
    const attribute = Buffer.from(SoftHSM.hsm_extractECPoint(M, session, key.pubHandle))
    console.info(
      'Public point producer shape',
      provider,
      attribute.length,
      attribute.subarray(0, 4).toString('hex')
    )
    const decoded = fromBER(new Uint8Array(attribute).buffer)
    const raw =
      attribute.length === 65
        ? attribute
        : decoded.result instanceof OctetString && decoded.offset === attribute.length
          ? Buffer.from(decoded.result.valueBlock.valueHexView)
          : (() => {
              throw new Error('Unexpected producer CKA_EC_POINT encoding')
            })()
    const spki = createPublicKey({
      key: {
        kty: 'EC',
        crv: 'P-256',
        x: raw.subarray(1, 33).toString('base64url'),
        y: raw.subarray(33).toString('base64url'),
      },
      format: 'jwk',
    }).export({ format: 'der', type: 'spki' })
    addFixture(provider, raw, spki)
    fixtures.at(-1)!.attribute = attribute
  }
  const M = await newModule({ quiet: true })
  expect(
    runOpenssl(M, [
      'genpkey',
      '-algorithm',
      'EC',
      '-pkeyopt',
      'ec_paramgen_curve:P-256',
      '-out',
      'sample.key',
    ]).rc
  ).toBe(0)
  const exportModule = await newModule({ quiet: true })
  writeFile(exportModule, '/sample.key', readFileBin(M, '/sample.key'))
  expect(
    runOpenssl(exportModule, [
      'pkey',
      '-in',
      'sample.key',
      '-pubout',
      '-outform',
      'DER',
      '-out',
      'sample.pub',
    ]).rc
  ).toBe(0)
  const spki = Buffer.from(readFileBin(exportModule, '/sample.pub'))
  const jwk = createPublicKey({ key: spki, format: 'der', type: 'spki' }).export({ format: 'jwk' })
  addFixture(
    'OpenSSL WASM',
    Buffer.concat([
      Buffer.from([4]),
      Buffer.from(jwk.x!, 'base64url'),
      Buffer.from(jwk.y!, 'base64url'),
    ]),
    spki
  )
}, 60_000)
afterAll(() => {
  for (const { M, session } of sessions) M._C_CloseSession(session)
})
function context(publicHex: string) {
  const ctx = new FiveGService()
  ctx.state = { profile: 'B', supi: '310260123456789', ephemeralPubKeyHex: publicHex, ...fields }
  return ctx
}
for (const provider of ['Rust HSM', 'C++ HSM', 'OpenSSL WASM']) {
  it(`compresses the actual ${provider} point identically in preview and assembled sample without changing ciphertext or MAC`, async () => {
    const fixture = fixtures.find((f) => f.provider === provider)!
    const outputs = []
    for (const bytes of [fixture.attribute ?? fixture.raw, fixture.raw, fixture.spki]) {
      const hex = bytes.toString('hex')
      expect(normalizeProfileBPoint(hex).compressedHex).toBe(fixture.compressed)
      expect(normalizeProfileBPoint(hex.toUpperCase()).compressedHex.toLowerCase()).toBe(
        fixture.compressed
      )
      const ctx = context(hex)
      const before = structuredClone(ctx.state)
      const preview = await visualizeStructure(ctx)
      expect(preview).toContain(fixture.compressed)
      const assembled = await assembleSUCI(ctx, 'B')
      const wire = assembled.match(/^ {2}suci-0-310-260-0-2-1-([0-9a-f]+)$/m)?.[1]
      expect(wire).toBe(fixture.compressed + fields.encryptedMSINHex + fields.macTagHex)
      expect(Buffer.from(wire!, 'hex').subarray(0, 33)).toEqual(
        Buffer.from(fixture.compressed, 'hex')
      )
      expect(Buffer.from(wire!, 'hex').length).toBe(33 + 5 + 8)
      expect(ctx.state).toEqual(before)
      outputs.push(assembled)
    }
    expect(new Set(outputs).size).toBe(1)
  })
}
it('preserves both P-256 y-parity branches against independent Node point conversion', () => {
  const prefixes = new Set<string>()
  for (let scalar = 1; scalar <= 16 && prefixes.size < 2; scalar++) {
    const privateKey = Buffer.alloc(32)
    privateKey[31] = scalar
    const ec = createECDH('prime256v1')
    ec.setPrivateKey(privateKey)
    const raw = ec.getPublicKey(),
      expected = ec.getPublicKey(undefined, 'compressed').toString('hex')
    expect(normalizeProfileBPoint(raw.toString('hex')).compressedHex).toBe(expected)
    prefixes.add(expected.slice(0, 2))
  }
  expect([...prefixes].sort()).toEqual(['02', '03'])
})
it.each([
  ['truncated CKA wrapper', (): string => fixtures[0].attribute!.subarray(0, 66).toString('hex')],
  ['wrong wrapper tag', (): string => '05' + fixtures[0].attribute!.subarray(1).toString('hex')],
  [
    'incorrect wrapper length',
    (): string => '0440' + fixtures[0].attribute!.subarray(2).toString('hex'),
  ],
  ['trailing wrapped point', (): string => fixtures[0].attribute!.toString('hex') + '00'],
  ['empty', (): string => ''],
  ['odd hex', (): string => '04a'],
  ['nonhex', (): string => 'zz'.repeat(65)],
  ['short point', (): string => fixtures[0].raw.subarray(0, 64).toString('hex')],
  ['invalid prefix', (): string => '05' + fixtures[0].raw.subarray(1).toString('hex')],
  ['off-curve point', (): string => '04' + '00'.repeat(64)],
  ['truncated SPKI', (): string => fixtures[0].spki.subarray(0, 90).toString('hex')],
  ['trailing DER', (): string => fixtures[0].spki.toString('hex') + '00'],
  [
    'wrong named curve',
    (): string =>
      fixtures[0].spki.toString('hex').replace('06082a8648ce3d030107', '06082a8648ce3d030108'),
  ],
  [
    'wrong algorithm',
    (): string =>
      fixtures[0].spki.toString('hex').replace('06072a8648ce3d0201', '06072a8648ce3d0202'),
  ],
  ['malformed DER', (): string => '31' + fixtures[0].spki.subarray(1).toString('hex')],
] as const)('rejects %s before either Profile B success output', async (_name, input) => {
  const hex = input()
  expect(() => normalizeProfileBPoint(hex)).toThrow()
  await expect(visualizeStructure(context(hex))).rejects.toThrow()
  await expect(assembleSUCI(context(hex), 'B')).rejects.toThrow()
})
it('keeps existing Profile A and research C output behavior separate', async () => {
  const a = context('aa'.repeat(32))
  a.state.profile = 'A'
  expect(await assembleSUCI(a, 'A')).toContain('aa'.repeat(32))
  const c = context('aa'.repeat(32))
  c.state.profile = 'C'
  c.state.pqcMode = 'hybrid'
  c.state.ciphertextHex = 'bb'.repeat(1088)
  c.state.encryptedMSINHex = '2143658799'
  c.state.macTagHex = '0011223344556677'
  const assembled = await assembleSUCI(c, 'C')
  expect(assembled).toContain('PSC1 ENVELOPE ASSEMBLY (PROFILE C)')
  expect(assembled).toContain('Project sample format, not a standard')
  expect(c.state.psc1WireHex!.length / 2).toBe(1148)
  expect(() => normalizeProfileBPoint('aa'.repeat(32))).toThrow()
})

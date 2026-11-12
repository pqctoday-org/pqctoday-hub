// SPDX-License-Identifier: AGPL-3.0-only
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fromBER, Sequence, BitString } from 'asn1js'
import {
  getCertificateVerifySample,
  certificateVerifyInput,
  certificateVerifyControls,
  certificateVerifyHex,
  verifyCapturedBytes,
} from './certificateVerifySample'
import fixtures from '../../VPNSSHModule/data/tlsMeasuredSamples.json'
import * as S from '@/wasm/softhsm'

const require_ = createRequire(import.meta.url)
let engine: S.SoftHSMModule,
  session = 0
beforeAll(async () => {
  const glue = path.resolve('src/vendor/softhsm-wasm/wasm/softhsm.js')
  engine = await require_(glue)({
    locateFile: (file: string) =>
      file.endsWith('.wasm') ? path.join(path.dirname(glue), 'softhsm.wasm') : file,
  })
  S.hsm_initialize(engine)
  const slot = S.hsm_initToken(
    engine,
    S.hsm_getFirstFreeSlot(engine),
    '12345678',
    'TLSCapturedSample'
  )
  session = S.hsm_openUserSession(engine, slot, '12345678', 'user1234')
}, 30000)
afterAll(() => {
  if (engine) S.hsm_finalize(engine, session)
})

describe('captured TLS1.3 ML-DSA-65 CertificateVerify', () => {
  it('constructs the independent native-verified130-byte RFC input from the actual four messages', async () => {
    const s = await getCertificateVerifySample()
    const hash = createHash('sha256').update(s.transcript).digest()
    expect(s.transcript.length).toBe(13555)
    expect(hash.toString('hex')).toBe(
      '4960d327cfeac861fc4ca14323f3aa5721543b34e700c35933cf8b5e7caacdfa'
    )
    // Independent construction, not a call to the product serializer.
    const expected = Buffer.concat([
      Buffer.alloc(64, 32),
      Buffer.from('TLS 1.3, server CertificateVerify', 'ascii'),
      Buffer.from([0]),
      hash,
    ])
    expect(Buffer.from(s.input)).toEqual(expected)
    expect(s.input.length).toBe(130)
    expect(s.signature.length).toBe(3309)
    expect(s.publicKey.length).toBe(1952)
    const other = await certificateVerifyInput(s.transcript, 'client')
    expect(Buffer.from(other)).not.toEqual(expected)
    expect(certificateVerifyHex(other.slice(64, 97))).toBe(
      Buffer.from('TLS 1.3, client CertificateVerify').toString('hex')
    )
  })
  it('uses actual leafcertificate key bytes, not the similarly sized key from another capture', async () => {
    const s = await getCertificateVerifySample()
    const decoded = fromBER(new Uint8Array(s.leafDer).buffer)
    expect(decoded.offset).toBe(s.leafDer.length)
    const cert = decoded.result as Sequence
    const tbs = cert.valueBlock.value[0] as Sequence
    const spki = tbs.valueBlock.value[6] as Sequence
    const bits = spki.valueBlock.value[1] as BitString
    expect(bits.valueBlock.unusedBits).toBe(0)
    expect(Buffer.from(bits.valueBlock.valueHexView)).toEqual(Buffer.from(s.publicKey))
  })
  it('verifies the genuine signature and refuses transcript/context/signature/key changes in the actual shipped C++ engine', async () => {
    const s = await getCertificateVerifySample(),
      c = await certificateVerifyControls(s)
    const pub = S.hsm_importMLDSAPublicKey(engine, session, 65, s.publicKey)
    const wrong = S.hsm_importMLDSAPublicKey(engine, session, 65, c.wrongKey)
    expect(verifyCapturedBytes(engine, session, pub, s.input, s.signature)).toBe(true)
    for (const [input, sig, key] of [
      [c.changedTranscriptInput, s.signature, pub],
      [c.clientContextInput, s.signature, pub],
      [s.input, c.changedSignature, pub],
      [s.input, c.truncatedSignature, pub],
      [s.input, s.signature, wrong],
    ] as const)
      expect(verifyCapturedBytes(engine, session, key, input, sig)).toBe(false)
  })
  it('executes the same captured positive/negative verification through the offered Rust engine', async () => {
    const rust = await S.getSoftHSMRustModule()
    S.hsm_initialize(rust)
    const slot = S.hsm_initToken(rust, S.hsm_getFirstFreeSlot(rust), '12345678', 'TLSCapturedRust')
    const session = S.hsm_openUserSession(rust, slot, '12345678', 'user1234')
    try {
      const sample = await getCertificateVerifySample(),
        controls = await certificateVerifyControls(sample)
      const pub = S.hsm_importMLDSAPublicKey(rust, session, 65, sample.publicKey)
      const wrong = S.hsm_importMLDSAPublicKey(rust, session, 65, controls.wrongKey)
      expect(verifyCapturedBytes(rust, session, pub, sample.input, sample.signature)).toBe(true)
      for (const [input, sig, key] of [
        [controls.changedTranscriptInput, sample.signature, pub],
        [controls.clientContextInput, sample.signature, pub],
        [sample.input, controls.changedSignature, pub],
        [sample.input, controls.truncatedSignature, pub],
        [sample.input, sample.signature, wrong],
      ] as const)
        expect(verifyCapturedBytes(rust, session, key, input, sig)).toBe(false)
    } finally {
      S.hsm_finalize(rust, session)
    }
  }, 30000)
  it.each([5, 0x30, 0x91])(
    'does not credit a backend operational return code0x%s as signature rejection',
    async (code) => {
      const sample = await getCertificateVerifySample()
      const pub = S.hsm_importMLDSAPublicKey(engine, session, 65, sample.publicKey)
      let inject = true
      const failed = new Proxy(engine, {
        get(target, property, receiver) {
          const value = Reflect.get(target, property, receiver)
          if (property !== '_C_VerifyMessage') return value
          return (...args: number[]) => {
            if (inject) {
              inject = false
              return code
            }
            return Reflect.apply(value, target, args)
          }
        },
      })
      expect(() =>
        verifyCapturedBytes(failed, session, pub, sample.input, sample.signature)
      ).toThrow(/operation incomplete/)

      expect(verifyCapturedBytes(engine, session, pub, sample.input, sample.signature)).toBe(true)
    }
  )
  it('refuses missing, truncated and trailing encoded messages before claiming constructed/verified output', async () => {
    for (const length of [0, 3, 10]) {
      const f = structuredClone(fixtures.profiles.find((p) => p.name === 'pqc')!)
      f.messages[3].base64 = btoa(
        String.fromCharCode(
          ...Uint8Array.from(atob(f.messages[3].base64), (c) => c.charCodeAt(0)).slice(0, length)
        )
      )
      await expect(getCertificateVerifySample(f)).rejects.toThrow()
    }
    const f = structuredClone(fixtures.profiles.find((p) => p.name === 'pqc')!)
    f.messages[0].base64 = btoa(atob(f.messages[0].base64) + '\0')
    await expect(getCertificateVerifySample(f)).rejects.toThrow()
  })
})

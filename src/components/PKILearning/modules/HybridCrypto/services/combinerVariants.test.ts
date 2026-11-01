// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { XWING_LABEL, concatenationOnly, xwingCombiner, xwingPreimage } from './combinerVariants'
import { compositeKemSet } from '@/wasm/softhsm/compositeParams'
import { CKP_COMP_KEM_MLKEM768_X25519 } from '@/wasm/softhsm/constants'
import { HPKE_KEM, kemInfo } from './hpkeService'

const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
const seq = (start: number) => Uint8Array.from({ length: 32 }, (_, i) => start + i)

describe('combinerVariants', () => {
  const ssM = seq(0)
  const ssX = seq(32)
  const ctX = seq(64)
  const pkX = seq(96)

  it('uses the X-Wing label, which composite MLKEM768-X25519 and the CFRG HPKE entry share', () => {
    expect(hex(XWING_LABEL)).toBe('5c2e2f2f5e5c')
    expect(compositeKemSet(CKP_COMP_KEM_MLKEM768_X25519)?.labelHex).toBe(hex(XWING_LABEL))
    const hpke = kemInfo(HPKE_KEM.MLKEM768_X25519)
    expect('label' in hpke ? hex(hpke.label) : '').toBe(hex(XWING_LABEL))
  })

  it('builds the preimage in the draft order: ss_M, ss_X, ct_X, pk_X, label', () => {
    const p = xwingPreimage(ssM, ssX, ctX, pkX)
    expect(p.length).toBe(134)
    expect(hex(p.slice(0, 32))).toBe(hex(ssM))
    expect(hex(p.slice(32, 64))).toBe(hex(ssX))
    expect(hex(p.slice(64, 96))).toBe(hex(ctX))
    expect(hex(p.slice(96, 128))).toBe(hex(pkX))
    expect(hex(p.slice(128))).toBe(hex(XWING_LABEL))
  })

  it('matches SHA3-256 of that preimage computed independently (Python hashlib)', () => {
    expect(hex(xwingCombiner(ssM, ssX, ctX, pkX))).toBe(
      '0acca09f2fb739bc89668dbcd01ae5aebf9b72c6fe013297e3baa96854468491'
    )
  })

  it('reproduces draft-ietf-lamps-pq-composite-kem-23 Appendix F, Example 2 (id-MLKEM768-X25519-SHA3-256)', () => {
    const b = (h: string) => Uint8Array.from(h.match(/../g)!, (x) => parseInt(x, 16))
    const ss = xwingCombiner(
      b('461b74b074818906edcd2fd976008caca5247f496670ae86e34abe35e62a7ae1'),
      b('4c62bd6d6f76294f3c14d7e79dbf56e4bf82cb1fb803accfaf2a59c1663a8843'),
      b('0ec7210a4aa22bb75af9243f95a6ccf857e872efbe5e77e8e917b56178fa473f'),
      b('1e9d4f72d56cef589864e102c6d6fa86cd3ac5163839556f7555ad083f37b03b')
    )
    expect(hex(ss)).toBe('21ee673fdeac21dd78ef13bc8432a50c0ac31893cbe97d14c0e82f5fe4a28d98')
  })

  it('concatenation-only returns the two secrets unchanged, ML-KEM first', () => {
    const k = concatenationOnly(ssM, ssX)
    expect(k.length).toBe(64)
    expect(hex(k)).toBe(hex(ssM) + hex(ssX))
  })

  it('rejects inputs of the wrong length', () => {
    expect(() => xwingCombiner(ssM.slice(1), ssX, ctX, pkX)).toThrow(/ss_M must be 32 bytes/)
    expect(() => concatenationOnly(ssM, ssX.slice(2))).toThrow(/ss_X must be 32 bytes/)
  })
})

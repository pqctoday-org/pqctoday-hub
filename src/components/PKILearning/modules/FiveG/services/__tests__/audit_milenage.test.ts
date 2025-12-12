import { describe, it, expect } from 'vitest'
import { MilenageService } from '../MilenageService'
import { bytesToHex } from '../../../../../../services/crypto/FileUtils'

// Helper to hex string to Uint8Array
const hex = (h: string) => new Uint8Array(h.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)))

describe('GSMA Audit: Milenage Algorithm (TS 35.207 Set 1)', () => {
  const milenage = new MilenageService()

  // TS 35.207 Set 1 Vectors
  const K = hex('465b5ce8b199b49faa5f0a2ee238a6bc')
  const RAND = hex('23553cbe9637a89d218ae64dae47bf35')
  const SQN = hex('ff9bb4d0b607')
  const AMF = hex('b9b9')
  const OP = hex('cdc202d5123e20f62b6d676ac72cb318')

  // Expected OPc (computed from OP and K)
  const EXPECTED_OPc = 'cd63cb71954a9f4e48a5994e37a02baf'

  // Expected Outputs
  const EXP_MAC_A = '4a9ffac354dfafb3'
  const EXP_RES = 'a54211d5e3ba50bf'
  const EXP_CK = 'b40ba9a3c58b2a05bbf0d987b21bf8cb'
  const EXP_IK = 'f769bcd751044604127672711c6d3441'
  const EXP_AK = 'aa689c648370'

  it('should correctly compute OPc from OP and K', async () => {
    const opc = await milenage.computeOPc(K, OP)
    expect(bytesToHex(opc).toLowerCase()).toBe(EXPECTED_OPc)
  })

  it('should correctly compute Milenage vectors (f1, f2, f3, f4, f5)', async () => {
    const opc = hex(EXPECTED_OPc)
    const res = await milenage.compute(K, opc, RAND, SQN, AMF)

    expect(bytesToHex(res.MAC).toLowerCase()).toBe(EXP_MAC_A)
    expect(bytesToHex(res.RES).toLowerCase()).toBe(EXP_RES)
    expect(bytesToHex(res.CK).toLowerCase()).toBe(EXP_CK)
    expect(bytesToHex(res.IK).toLowerCase()).toBe(EXP_IK)
    expect(bytesToHex(res.AK).toLowerCase()).toBe(EXP_AK)
  })
})

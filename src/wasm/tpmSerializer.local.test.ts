// SPDX-License-Identifier: GPL-3.0-only
//
// Regression tests for the TPM Command Builder chaining fix (see
// tpm-playground-audit-pkcs11-cacp-parity-gap-report-07232026.md /
// tpm-playground-remediation-plan-07232026.md, Phase 0 items 1, 2, 7).
// Before this fix, TPM2_Decapsulate/TPM2_VerifyDigestSignature/
// TPM2_SignSequenceComplete/TPM2_VerifySequenceComplete always serialized
// hardcoded placeholder bytes (0xCC/0xEE/0x80FF0000) regardless of what a
// prior command in the same session actually produced — these pin that
// serializeDemoCommand now embeds real chained values when given them, and
// still falls back to a labeled placeholder for direct/programmatic callers
// that don't supply them (e.g. a caller who hasn't run the prerequisite).
//
// Venue: `*.local.test.ts` per the 2026-07-01 new-test-suite convention
// (vite.config.ts) — local gate only, not CI.
import { describe, it, expect } from 'vitest'
import { serializeDemoCommand, getU32, TPM_CC_SequenceUpdate } from './tpmSerializer'

const CT_MLKEM_768 = new Uint8Array(1088).fill(0xaa)
const SIG_MLDSA_65 = new Uint8Array(3309).fill(0x77)

describe('TPM2_Decapsulate — ciphertext chaining', () => {
  it('embeds a real chained ciphertext when provided', () => {
    const cmd = serializeDemoCommand('TPM2_Decapsulate', 'MLKEM-768', 0x81010060, {
      ciphertext: CT_MLKEM_768,
    })
    const tail = cmd.slice(cmd.length - CT_MLKEM_768.length)
    expect(Array.from(tail)).toEqual(Array.from(CT_MLKEM_768))
  })

  it('falls back to the 0xCC placeholder when no ciphertext is chained', () => {
    const cmd = serializeDemoCommand('TPM2_Decapsulate', 'MLKEM-768', 0x81010060)
    const tail = cmd.slice(cmd.length - 1088)
    expect(tail.every((b) => b === 0xcc)).toBe(true)
  })

  it('ignores a chained ciphertext of the wrong length (algorithm mismatch)', () => {
    const wrongSize = new Uint8Array(768).fill(0xaa) // MLKEM-512 size, not 768
    const cmd = serializeDemoCommand('TPM2_Decapsulate', 'MLKEM-768', 0x81010060, {
      ciphertext: wrongSize,
    })
    const tail = cmd.slice(cmd.length - 1088)
    expect(tail.every((b) => b === 0xcc)).toBe(true)
  })
})

describe('TPM2_VerifyDigestSignature — signature chaining', () => {
  it('embeds a real chained signature when provided', () => {
    const cmd = serializeDemoCommand('TPM2_VerifyDigestSignature', 'MLDSA-65', 0x81010065, {
      digestSignature: SIG_MLDSA_65,
    })
    const tail = cmd.slice(cmd.length - SIG_MLDSA_65.length)
    expect(Array.from(tail)).toEqual(Array.from(SIG_MLDSA_65))
  })

  it('falls back to the 0xEE placeholder when no signature is chained', () => {
    const cmd = serializeDemoCommand('TPM2_VerifyDigestSignature', 'MLDSA-65', 0x81010065)
    const tail = cmd.slice(cmd.length - 3309)
    expect(tail.every((b) => b === 0xee)).toBe(true)
  })
})

describe('TPM2_SignSequenceComplete — sequence handle chaining', () => {
  it('embeds the real chained sequenceHandle as the first payload field', () => {
    const cmd = serializeDemoCommand('TPM2_SignSequenceComplete', 'MLDSA-65', 0x81010065, {
      signSeqHandle: 0x80ff0003,
    })
    expect(getU32(cmd, 10)).toBe(0x80ff0003)
  })

  it('falls back to the 0x80FF0000 placeholder when no handle is chained', () => {
    const cmd = serializeDemoCommand('TPM2_SignSequenceComplete', 'MLDSA-65', 0x81010065)
    expect(getU32(cmd, 10)).toBe(0x80ff0000)
  })
})

describe('TPM2_SequenceUpdate (new command)', () => {
  it('builds with the correct command code', () => {
    const cmd = serializeDemoCommand('TPM2_SequenceUpdate', 'MLDSA-65', 0x81010065, {
      verifySeqHandle: 0x80ff0001,
    })
    // tag(2) + size(4) + cc(4) — cc is at byte offset 6
    expect(getU32(cmd, 6)).toBe(TPM_CC_SequenceUpdate)
  })

  it('embeds the real chained verifySeqHandle as the first payload field', () => {
    const cmd = serializeDemoCommand('TPM2_SequenceUpdate', 'MLDSA-65', 0x81010065, {
      verifySeqHandle: 0x80ff0002,
    })
    expect(getU32(cmd, 10)).toBe(0x80ff0002)
  })

  it('falls back to the 0x80FF0000 placeholder when no handle is chained', () => {
    const cmd = serializeDemoCommand('TPM2_SequenceUpdate', 'MLDSA-65', 0x81010065)
    expect(getU32(cmd, 10)).toBe(0x80ff0000)
  })

  it('feeds the fixed 64-byte 0xA5 message chunk, matching ComplianceRunner V185-023', () => {
    const cmd = serializeDemoCommand('TPM2_SequenceUpdate', 'MLDSA-65', 0x81010065, {
      verifySeqHandle: 0x80ff0002,
    })
    const tail = cmd.slice(cmd.length - 64)
    expect(tail.every((b) => b === 0xa5)).toBe(true)
  })

  it('does not reference a key handle at all (SequenceUpdate has no keyHandle field)', () => {
    // Payload is exactly {@sequenceHandle(4), authSize(4), RS_PW(4), nonce.size(2),
    // sessAttr(1), hmac.size(2), buffer.size(2), buffer(64)} = 83 bytes -> total 93.
    const cmd = serializeDemoCommand('TPM2_SequenceUpdate', 'MLDSA-65', 0x81010065, {
      verifySeqHandle: 0x80ff0002,
    })
    expect(cmd.length).toBe(10 + 4 + 4 + 4 + 2 + 1 + 2 + 2 + 64)
  })
})

describe('TPM2_VerifySequenceComplete — handle + signature chaining', () => {
  it('embeds both the chained verifySeqHandle and the chained signature', () => {
    const cmd = serializeDemoCommand('TPM2_VerifySequenceComplete', 'MLDSA-65', 0x81010065, {
      verifySeqHandle: 0x80ff0004,
      seqSignature: SIG_MLDSA_65,
    })
    expect(getU32(cmd, 10)).toBe(0x80ff0004)
    const tail = cmd.slice(cmd.length - SIG_MLDSA_65.length)
    expect(Array.from(tail)).toEqual(Array.from(SIG_MLDSA_65))
  })

  it('falls back to placeholders for both when nothing is chained', () => {
    const cmd = serializeDemoCommand('TPM2_VerifySequenceComplete', 'MLDSA-65', 0x81010065)
    expect(getU32(cmd, 10)).toBe(0x80ff0000)
    const tail = cmd.slice(cmd.length - 3309)
    expect(tail.every((b) => b === 0xee)).toBe(true)
  })
})

describe('TPM2_NV_ReadPublic / TPM2_NV_Read — algorithm-aware NV slot', () => {
  // V2.7 §5.3.1 EK cert NV indices — must match V2P7_EK_SPECS.nvCertIndex in
  // TpmPlayground/v2p7-reference.ts (the provisioning-side source of truth).
  const EXPECTED_NV_INDEX: Record<string, number> = {
    'MLKEM-512': 0x01c00060,
    'MLKEM-768': 0x01c00062,
    'MLKEM-1024': 0x01c00064,
    'MLDSA-44': 0x01c00070,
    'MLDSA-65': 0x01c00072,
    'MLDSA-87': 0x01c00074,
  }

  for (const [algo, expectedIndex] of Object.entries(EXPECTED_NV_INDEX)) {
    it(`TPM2_NV_ReadPublic reads the ${algo} EK cert slot (0x${expectedIndex.toString(16)})`, () => {
      const cmd = serializeDemoCommand('TPM2_NV_ReadPublic', algo)
      expect(getU32(cmd, 10)).toBe(expectedIndex)
    })

    it(`TPM2_NV_Read reads the ${algo} EK cert slot (0x${expectedIndex.toString(16)})`, () => {
      const cmd = serializeDemoCommand('TPM2_NV_Read', algo)
      expect(getU32(cmd, 10)).toBe(expectedIndex)
    })
  }

  it('falls back to the ML-DSA-65 slot for an unrecognized algorithm', () => {
    const cmd = serializeDemoCommand('TPM2_NV_ReadPublic', 'NOT-A-REAL-ALGO')
    expect(getU32(cmd, 10)).toBe(0x01c00072)
  })
})

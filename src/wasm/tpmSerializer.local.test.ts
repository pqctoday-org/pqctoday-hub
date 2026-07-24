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
import {
  serializeDemoCommand,
  getU16,
  getU32,
  TPM_CC_SequenceUpdate,
  TPM_CC_Sign,
  TPM_CC_VerifySignature,
  TPM_CC_RSA_Encrypt,
  TPM_CC_RSA_Decrypt,
  TPM_CC_HashSequenceStart,
  TPM_CC_SequenceComplete,
  TPM_CC_CreatePrimary,
  ALG_RSA,
  ALG_RSASSA,
  ALG_OAEP,
  ALG_NULL,
} from './tpmSerializer'

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

// ── Classical (pre-quantum) command builders — WS1 of the Phase 1 build.
// Wire layouts live-probed against the shipped pqctpm.wasm (WS0 spike,
// 2026-07-23); constants verified against pqctoday-tpm TpmTypes.h; section
// refs are the PUBLISHED v1.85 Part 3 (2026-03-12).

describe('TPM2_CreatePrimary — classical RSA-2048 variants (§24.1)', () => {
  // Fixed prefix: hdr(10) + primaryHandle(4) + authArea(4+9) + inSensitive(2+4)
  // → TPM2B_PUBLIC.size at offset 33, TPMT_PUBLIC starts at 35.
  const TPMT_PUBLIC_OFF = 35

  it("'RSA-2048' builds an unrestricted signing key (sym NULL, scheme NULL)", () => {
    const cmd = serializeDemoCommand('TPM2_CreatePrimary', 'RSA-2048')
    expect(getU32(cmd, 6)).toBe(TPM_CC_CreatePrimary)
    expect(getU16(cmd, TPMT_PUBLIC_OFF)).toBe(ALG_RSA)
    const attrs = getU32(cmd, TPMT_PUBLIC_OFF + 4)
    expect(attrs & 0x40000).toBe(0x40000) // sign SET
    expect(attrs & 0x10000).toBe(0) // restricted CLEAR
    expect(attrs & 0x20000).toBe(0) // decrypt CLEAR
    // params after authPolicy(2): sym(2) scheme(2) keyBits(2) exponent(4)
    expect(getU16(cmd, TPMT_PUBLIC_OFF + 10)).toBe(ALG_NULL) // symmetric
    expect(getU16(cmd, TPMT_PUBLIC_OFF + 12)).toBe(ALG_NULL) // scheme
    expect(getU16(cmd, TPMT_PUBLIC_OFF + 14)).toBe(2048)
  })

  it("'RSA-2048-DEC' builds an unrestricted decrypt key", () => {
    const cmd = serializeDemoCommand('TPM2_CreatePrimary', 'RSA-2048-DEC')
    const attrs = getU32(cmd, TPMT_PUBLIC_OFF + 4)
    expect(attrs & 0x20000).toBe(0x20000) // decrypt SET
    expect(attrs & 0x40000).toBe(0) // sign CLEAR
    expect(attrs & 0x10000).toBe(0) // restricted CLEAR
  })

  it("'RSA-2048-AK' builds a restricted signer with sym NULL + PINNED RSASSA scheme", () => {
    // The WS0 spike's first attempt gave a restricted signer an AES block
    // (the restricted-DECRYPT pattern) and the TPM refused with
    // TPM_RC_SYMMETRIC on inPublic — this pins the corrected layout.
    const cmd = serializeDemoCommand('TPM2_CreatePrimary', 'RSA-2048-AK')
    const attrs = getU32(cmd, TPMT_PUBLIC_OFF + 4)
    expect(attrs & 0x10000).toBe(0x10000) // restricted SET
    expect(attrs & 0x40000).toBe(0x40000) // sign SET
    expect(getU16(cmd, TPMT_PUBLIC_OFF + 10)).toBe(ALG_NULL) // symmetric MUST be NULL
    expect(getU16(cmd, TPMT_PUBLIC_OFF + 12)).toBe(ALG_RSASSA) // scheme pinned
    expect(getU16(cmd, TPMT_PUBLIC_OFF + 14)).toBe(0x000b) // scheme hash SHA-256
    expect(getU16(cmd, TPMT_PUBLIC_OFF + 16)).toBe(2048)
  })
})

describe('TPM2_Sign / TPM2_VerifySignature — classical signing (§20.5 / §20.2)', () => {
  it('TPM2_Sign carries RSASSA/SHA-256 inScheme and a NULL hashcheck ticket', () => {
    const cmd = serializeDemoCommand('TPM2_Sign', 'RSA-2048', 0x80000000)
    expect(getU32(cmd, 6)).toBe(TPM_CC_Sign)
    // hdr(10)+handle(4)+auth(13)+digest(2+32) → inScheme at 61
    expect(getU16(cmd, 61)).toBe(ALG_RSASSA)
    expect(getU16(cmd, 63)).toBe(0x000b)
    expect(getU16(cmd, 65)).toBe(0x8024) // TPM_ST_HASHCHECK
    expect(getU32(cmd, 67)).toBe(0x40000007) // TPM_RH_NULL
  })

  it('TPM2_VerifySignature embeds a real chained RSA signature (hashAlg-bearing TPMT_SIGNATURE)', () => {
    const sig = new Uint8Array(256).fill(0x77)
    const cmd = serializeDemoCommand('TPM2_VerifySignature', 'RSA-2048', 0x80000000, {
      rsaSignature: sig,
    })
    expect(getU32(cmd, 6)).toBe(TPM_CC_VerifySignature)
    // NO_SESSIONS: hdr(10)+handle(4)+digest(2+32) → TPMT_SIGNATURE at 48
    expect(getU16(cmd, 48)).toBe(ALG_RSASSA)
    expect(getU16(cmd, 50)).toBe(0x000b) // embedded hashAlg — RSA layout, not ML-DSA's
    expect(getU16(cmd, 52)).toBe(256)
    const tail = cmd.slice(54, 54 + 256)
    expect(tail.every((b) => b === 0x77)).toBe(true)
  })

  it('TPM2_VerifySignature falls back to the 0xEE placeholder when nothing is chained', () => {
    const cmd = serializeDemoCommand('TPM2_VerifySignature', 'RSA-2048', 0x80000000)
    const tail = cmd.slice(54, 54 + 256)
    expect(tail.every((b) => b === 0xee)).toBe(true)
  })
})

describe('TPM2_RSA_Encrypt / TPM2_RSA_Decrypt — classical key transport (§14.2 / §14.3)', () => {
  it('RSA_Encrypt is a NO_SESSIONS public-key op with OAEP/SHA-256', () => {
    const cmd = serializeDemoCommand('TPM2_RSA_Encrypt', 'RSA-2048', 0x80000000)
    expect(getU16(cmd, 0)).toBe(0x8001)
    expect(getU32(cmd, 6)).toBe(TPM_CC_RSA_Encrypt)
    // hdr(10)+handle(4)+message(2+32) → inScheme at 48
    expect(getU16(cmd, 48)).toBe(ALG_OAEP)
    expect(getU16(cmd, 50)).toBe(0x000b)
  })

  it('RSA_Decrypt embeds a real chained ciphertext', () => {
    const ct = new Uint8Array(256).fill(0xaa)
    const cmd = serializeDemoCommand('TPM2_RSA_Decrypt', 'RSA-2048', 0x80000000, {
      rsaCiphertext: ct,
    })
    expect(getU32(cmd, 6)).toBe(TPM_CC_RSA_Decrypt)
    // SESSIONS: hdr(10)+handle(4)+auth(13)+ctSize(2) → ct at 29
    expect(getU16(cmd, 27)).toBe(256)
    const body = cmd.slice(29, 29 + 256)
    expect(body.every((b) => b === 0xaa)).toBe(true)
    // inScheme after ct
    expect(getU16(cmd, 285)).toBe(ALG_OAEP)
  })

  it('RSA_Decrypt falls back to the 0xCC placeholder when nothing is chained', () => {
    const cmd = serializeDemoCommand('TPM2_RSA_Decrypt', 'RSA-2048', 0x80000000)
    const body = cmd.slice(29, 29 + 256)
    expect(body.every((b) => b === 0xcc)).toBe(true)
  })
})

describe('Classical hash sequence — HashSequenceStart / SequenceUpdate / SequenceComplete (§17.4 / §17.7 / §17.8)', () => {
  it('HashSequenceStart has NO handles and NO auth session (WS0 pinned this — a stray PW session gets refused)', () => {
    const cmd = serializeDemoCommand('TPM2_HashSequenceStart', 'RSA-2048')
    expect(getU16(cmd, 0)).toBe(0x8001) // NO_SESSIONS
    expect(getU32(cmd, 6)).toBe(TPM_CC_HashSequenceStart)
    expect(cmd.length).toBe(10 + 2 + 2) // hdr + auth.size(0) + hashAlg
    expect(getU16(cmd, 12)).toBe(0x000b)
  })

  it('SequenceUpdate chains a hash-sequence handle when no verify-sequence handle exists', () => {
    const cmd = serializeDemoCommand('TPM2_SequenceUpdate', 'RSA-2048', 0x80000000, {
      hashSeqHandle: 0x80ff0005,
    })
    expect(getU32(cmd, 10)).toBe(0x80ff0005)
  })

  it('SequenceUpdate prefers the verify-sequence handle when both are chained', () => {
    const cmd = serializeDemoCommand('TPM2_SequenceUpdate', 'MLDSA-65', 0x80000000, {
      verifySeqHandle: 0x80ff0001,
      hashSeqHandle: 0x80ff0005,
    })
    expect(getU32(cmd, 10)).toBe(0x80ff0001)
  })

  it('SequenceComplete chains the hash-sequence handle and requests a TPM_RH_NULL ticket', () => {
    const cmd = serializeDemoCommand('TPM2_SequenceComplete', 'RSA-2048', 0x80000000, {
      hashSeqHandle: 0x80ff0006,
    })
    expect(getU32(cmd, 6)).toBe(TPM_CC_SequenceComplete)
    expect(getU32(cmd, 10)).toBe(0x80ff0006)
    // hdr(10)+seq(4)+auth(13)+buffer(2) → hierarchy at 29
    expect(getU32(cmd, 29)).toBe(0x40000007)
  })
})

// SPDX-License-Identifier: GPL-3.0-only
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { bytesToHex } from '@/services/crypto/FileUtils'
import type { FiveGService } from '../FiveGService'
import { DEFAULT_OP, milenage } from '../FiveGService'

export async function retrieveCredentials(ctx: FiveGService): Promise<string> {
  // Use test vectors if injected, otherwise defaults
  let K: Uint8Array
  let OP: Uint8Array

  if (ctx.testVectors?.milenage) {
    const vec = ctx.testVectors.milenage
    K = new Uint8Array(vec.k.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)))
    OP = new Uint8Array(vec.op.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)))
  } else {
    K = new Uint8Array(16).fill(0x33)
    OP = new Uint8Array(DEFAULT_OP)
  }

  const SQN = new Uint8Array(6).fill(0x01)
  const AMF = new Uint8Array(2)
  AMF[0] = 0x80
  AMF[1] = 0x00

  // Compute OPc from K and OP
  const OPc = await milenage.computeOPc(K, OP)

  // Store in auth state
  ctx.authState.K = K
  ctx.authState.OP = OP
  ctx.authState.OPc = OPc
  ctx.authState.SQN = SQN
  ctx.authState.AMF = AMF

  return `═══════════════════════════════════════════════════════════════
            CREDENTIAL RETRIEVAL (UDM/HSM)
═══════════════════════════════════════════════════════════════

Step 1: Retrieving Encrypted Credentials from Subscriber Database...
  > Subscriber: IMSI 310260123456789

Step 2: Injecting Keys into HSM for Computation
  > K (128-bit):   ${bytesToHex(K)}
  > OP (128-bit):  ${bytesToHex(OP)}

Step 3: Computing OPc = AES(K, OP) ⊕ OP
  > OPc (128-bit): ${bytesToHex(OPc)}

Step 4: Loading Sequence State
  > SQN: ${bytesToHex(SQN)}
  > AMF: ${bytesToHex(AMF)}

[SUCCESS] Credentials retrieved. Ready for challenge generation.`
}

export async function generateRAND(ctx: FiveGService): Promise<string> {
  let RAND: Uint8Array
  if (ctx.testVectors?.milenage) {
    const vec = ctx.testVectors.milenage
    RAND = new Uint8Array(vec.rand.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)))
  } else {
    RAND = new Uint8Array(16)
    window.crypto.getRandomValues(RAND)
  }

  ctx.authState.RAND = RAND

  return `═══════════════════════════════════════════════════════════════
            RANDOM CHALLENGE GENERATION
═══════════════════════════════════════════════════════════════

Step 1: Accessing True Random Number Generator (TRNG)...
  > Source: Hardware RNG (crypto.getRandomValues)

Step 2: Generating 128-bit Challenge
  > RAND: ${bytesToHex(RAND)}
  > Length: ${RAND.length * 8} bits

[SUCCESS] RAND generated. Ready for MILENAGE computation.`
}

export async function computeAUTN(ctx: FiveGService): Promise<string> {
  if (!ctx.authState.milenageResult || !ctx.authState.SQN || !ctx.authState.AMF) {
    return '[Error] MILENAGE vectors not computed yet.'
  }

  const { MAC, AK } = ctx.authState.milenageResult
  const SQN = ctx.authState.SQN
  const AMF = ctx.authState.AMF

  // Concealed SQN = SQN ⊕ AK
  const concealedSQN = new Uint8Array(6)
  for (let i = 0; i < 6; i++) {
    concealedSQN[i] = SQN[i] ^ AK[i]
  }

  // AUTN = Concealed SQN (6) || AMF (2) || MAC-A (8) = 16 bytes
  const AUTN = new Uint8Array(16)
  AUTN.set(concealedSQN, 0)
  AUTN.set(AMF, 6)
  AUTN.set(MAC, 8)

  return `═══════════════════════════════════════════════════════════════
            AUTN ASSEMBLY
═══════════════════════════════════════════════════════════════

Step 1: Computing Concealed SQN
  > SQN:    ${bytesToHex(SQN)}
  > AK:     ${bytesToHex(AK)}
  > SQN⊕AK: ${bytesToHex(concealedSQN)}

Step 2: Assembling AUTN = (SQN⊕AK) || AMF || MAC-A
  > Concealed SQN (6 bytes): ${bytesToHex(concealedSQN)}
  > AMF (2 bytes):           ${bytesToHex(AMF)}
  > MAC-A (8 bytes):         ${bytesToHex(MAC)}

Step 3: Final AUTN (16 bytes)
  > AUTN: ${bytesToHex(AUTN)}

[SUCCESS] AUTN assembled. Network can prove its identity to the UE.`
}

export async function deriveKAUSF(ctx: FiveGService): Promise<string> {
  if (
    !ctx.authState.milenageResult ||
    !ctx.authState.RAND ||
    !ctx.authState.SQN ||
    !ctx.authState.AMF
  ) {
    return '[Error] Missing authentication vectors.'
  }

  const { CK, IK, AK } = ctx.authState.milenageResult
  const SQN = ctx.authState.SQN
  const AMF = ctx.authState.AMF

  // Key = CK || IK (32 bytes)
  const keyInput = new Uint8Array(32)
  keyInput.set(CK, 0)
  keyInput.set(IK, 16)

  // Concealed SQN for AUTN reference
  const concealedSQN = new Uint8Array(6)
  for (let i = 0; i < 6; i++) {
    concealedSQN[i] = SQN[i] ^ AK[i]
  }
  const AUTN = new Uint8Array(16)
  AUTN.set(concealedSQN, 0)
  AUTN.set(AMF, 6)
  AUTN.set(ctx.authState.milenageResult.MAC, 8)

  // Per TS 33.501 Annex A.2: KAUSF derivation
  // S = FC || P0 || L0 || P1 || L1
  // FC = 0x6A (for KAUSF)
  // P0 = serving network name (SNN)
  // L0 = length of P0 (2 bytes)
  // P1 = SQN ⊕ AK (from AUTN)
  // L1 = 0x0006
  const snn = new TextEncoder().encode('5G:mnc260.mcc310.3gppnetwork.org')
  const fc = new Uint8Array([0x6a])
  const l0 = new Uint8Array(2)
  l0[0] = (snn.length >> 8) & 0xff
  l0[1] = snn.length & 0xff
  const l1 = new Uint8Array([0x00, 0x06])

  // S = FC || P0 || L0 || P1 || L1
  const sLen = 1 + snn.length + 2 + 6 + 2
  const s = new Uint8Array(sLen)
  let offset = 0
  s.set(fc, offset)
  offset += 1
  s.set(snn, offset)
  offset += snn.length
  s.set(l0, offset)
  offset += 2
  s.set(concealedSQN, offset)
  offset += 6
  s.set(l1, offset)

  // Use OpenSSL HMAC-SHA-256 to derive KAUSF
  const keyFile = `kausf_key_${ctx.getTimestamp()}.bin`
  const dataFile = `kausf_data_${ctx.getTimestamp()}.bin`
  ctx.trackFile(keyFile)
  ctx.trackFile(dataFile)

  const cmd = `openssl dgst -sha256 -mac HMAC -macopt hexkey:${bytesToHex(keyInput)} ${dataFile}`
  const res = await openSSLService.execute(cmd, [{ name: dataFile, data: s }])
  const kausfHex = ctx.parseDigestHex(res.stdout)

  if (!kausfHex) {
    return `[Error] KAUSF derivation failed — stdout: ${res.stdout?.substring(0, 100)}`
  }

  return `═══════════════════════════════════════════════════════════════
            5G ANCHOR KEY DERIVATION (KAUSF)
═══════════════════════════════════════════════════════════════

Step 1: Constructing Key Input
  > CK: ${bytesToHex(CK)}
  > IK: ${bytesToHex(IK)}
  > Key = CK||IK: ${bytesToHex(keyInput)}

Step 2: Constructing KDF Input (TS 33.501 A.2)
  > FC:  0x6A
  > P0 (SNN): 5G:mnc260.mcc310.3gppnetwork.org
  > L0:  ${bytesToHex(l0)}
  > P1 (SQN⊕AK): ${bytesToHex(concealedSQN)}
  > L1:  0006

Step 3: HMAC-SHA-256(CK||IK, S)
  $ ${cmd}

Step 4: Result
  > KAUSF: ${kausfHex}

[SUCCESS] 5G Anchor Key derived.
[INFO] Authentication Vector Ready: RAND, AUTN, XRES*, KAUSF`
}

export async function runMilenage(ctx: FiveGService) {
  // Read from authState (populated by retrieveCredentials + generateRAND) or fall back
  let K: Uint8Array
  let OPc: Uint8Array
  let RAND: Uint8Array
  let SQN: Uint8Array
  let AMF: Uint8Array

  if (ctx.authState.K && ctx.authState.OPc && ctx.authState.RAND) {
    K = ctx.authState.K
    OPc = ctx.authState.OPc
    RAND = ctx.authState.RAND
    SQN = ctx.authState.SQN || new Uint8Array(6).fill(0x01)
    AMF = ctx.authState.AMF || new Uint8Array([0x80, 0x00])
  } else if (ctx.testVectors?.milenage) {
    const vec = ctx.testVectors.milenage
    K = new Uint8Array(vec.k.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)))
    const OP = new Uint8Array(vec.op.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)))
    RAND = new Uint8Array(vec.rand.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)))
    OPc = await milenage.computeOPc(K, OP)
    SQN = new Uint8Array(6).fill(0x01)
    AMF = new Uint8Array([0x80, 0x00])
  } else {
    K = new Uint8Array(16).fill(0x33)
    RAND = new Uint8Array(16)
    window.crypto.getRandomValues(RAND)
    OPc = await milenage.computeOPc(K, new Uint8Array(DEFAULT_OP))
    SQN = new Uint8Array(6).fill(0x01)
    AMF = new Uint8Array([0x80, 0x00])
  }

  const vectors = await milenage.compute(K, OPc, RAND, SQN, AMF)

  // Store in authState for downstream steps (computeAUTN, deriveKAUSF)
  ctx.authState.milenageResult = vectors

  return {
    rand: bytesToHex(RAND),
    mac: bytesToHex(vectors.MAC),
    res: bytesToHex(vectors.RES),
    ck: bytesToHex(vectors.CK),
    ik: bytesToHex(vectors.IK),
    ak: bytesToHex(vectors.AK),
  }
}

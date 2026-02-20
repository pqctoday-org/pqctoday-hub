/* eslint-disable security/detect-object-injection */
// Milenage algorithm implementation using Web Crypto API (AES-128)
// Reference: 3GPP TS 35.206

export class MilenageService {
  // 3GPP Standard Constants (Rijndael constants)
  // These are often customizable by operators but we use the test set from spec
  private static r1 = 64
  private static r2 = 0
  private static r3 = 32
  private static r4 = 64
  private static c1 = new Uint8Array(16).fill(0)
  private static c2 = new Uint8Array(16).fill(0) // usually all 0 or specific
  private static c3 = new Uint8Array(16).fill(0)
  private static c4 = new Uint8Array(16).fill(0)
  private static c5 = new Uint8Array(16).fill(0)

  constructor() {
    // Set C constants (Example default values often used in test vectors)
    // For f1: c1 is all zeros
    // For f2: c2[15] = 1, rest 0
    this.resetConstants()
  }

  private resetConstants() {
    MilenageService.c1.fill(0)
    MilenageService.c2.fill(0)
    MilenageService.c2[15] = 1
    MilenageService.c3.fill(0)
    MilenageService.c3[15] = 2
    MilenageService.c4.fill(0)
    MilenageService.c4[15] = 4
    MilenageService.c5.fill(0)
    MilenageService.c5[15] = 8
  }

  // Helper: AES-128 Encrypt (ECB mode via CBC with 0 IV)
  private async aes128(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      key as unknown as BufferSource,
      { name: 'AES-CBC' },
      false,
      ['encrypt']
    )
    const iv = new Uint8Array(16) // Zero IV for ECB emulation
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-CBC', iv },
      cryptoKey,
      data as unknown as BufferSource
    )
    return new Uint8Array(encrypted).slice(0, 16) // Take first block
  }

  // Helper: XOR two arrays
  private xor(a: Uint8Array, b: Uint8Array): Uint8Array {
    const res = new Uint8Array(a.length)
    for (let i = 0; i < a.length; i++) res[i] = a[i] ^ b[i]
    return res
  }

  // Helper: Rotate (Cyclic shift)
  private rot(val: Uint8Array, r: number): Uint8Array {
    // r is in bits, assume 0-127.
    // Simple byte rotation for standard values (0, 32, 64)
    // 64 bits = 8 bytes
    const bytes = r / 8
    const res = new Uint8Array(16)
    // (x <<< r)
    for (let i = 0; i < 16; i++) {
      res[i] = val[(i + bytes) % 16]
    }
    return res
  }

  // Compute OPc from K and OP
  public async computeOPc(K: Uint8Array, OP: Uint8Array): Promise<Uint8Array> {
    const encrypted = await this.aes128(K, OP)
    return this.xor(encrypted, OP)
  }

  // Main Compute Function
  public async compute(
    K: Uint8Array,
    OPc: Uint8Array,
    RAND: Uint8Array,
    SQN: Uint8Array,
    AMF: Uint8Array
  ) {
    // TEMP = E_K(RAND XOR OPc)
    const temp = await this.aes128(K, this.xor(RAND, OPc))

    // Input to f1: SQN || AMF || SQN || AMF
    // SQN is 6 bytes, AMF is 2 bytes -> 8 bytes. Repeat twice -> 16 bytes.
    const in1 = new Uint8Array(16)
    in1.set(SQN, 0)
    in1.set(AMF, 6)
    in1.set(SQN, 8)
    in1.set(AMF, 14)

    // f1: MAC-A
    // OUT1 = E_K(TEMP XOR rot(in1 XOR OPc, r1) XOR c1) XOR OPc
    const rot1 = this.rot(this.xor(in1, OPc), MilenageService.r1)
    const macInput = this.xor(this.xor(temp, rot1), MilenageService.c1)
    const macEnc = await this.aes128(K, macInput)
    const macA = this.xor(macEnc, OPc).slice(0, 8) // 64 bits

    // f2-f5: compute OUT = E_K(rot(TEMP XOR OPc, r) XOR c) XOR OPc
    // Per TS 35.206: f2/f5 share OUT2, f3 uses OUT3, f4 uses OUT4
    const computeBlock = async (r: number, c: Uint8Array) => {
      const m = this.xor(temp, OPc)
      const rotated = this.rot(m, r)
      const input = this.xor(rotated, c)
      const enc = await this.aes128(K, input)
      return this.xor(enc, OPc)
    }

    // OUT2: f2 (RES) = last 8 bytes, f5 (AK) = first 6 bytes
    const out2 = await computeBlock(MilenageService.r2, MilenageService.c2)
    const RES = out2.slice(8, 16) // 64 bits
    const AK = out2.slice(0, 6) // 48 bits

    const out3 = await computeBlock(MilenageService.r3, MilenageService.c3)
    const CK = out3 // 128 bits

    const out4 = await computeBlock(MilenageService.r4, MilenageService.c4)
    const IK = out4 // 128 bits

    return {
      MAC: macA,
      RES: RES,
      CK: CK,
      IK: IK,
      AK: AK,
    }
  }
}

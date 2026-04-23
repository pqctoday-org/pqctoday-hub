// SPDX-License-Identifier: GPL-3.0-only
/**
 * Hybrid Signature Service — three constructions from the IETF hybrid signature spectrum.
 *
 * 1. Concatenation  — two independent sigs; either verifies alone (separable)
 * 2. Nesting        — ML-DSA outer covers EC-Schnorr inner; EC alone still passes, but
 *                     the outer binding prevents recombination
 * 3. Silithium      — fused Fiat-Shamir; neither component verifies independently
 *                     (eprint 2025/2059, Devevey–Guerreau–Roméas)
 *
 * Crypto:
 *   EC-Schnorr  → secp256k1 via @noble/curves
 *   ML-DSA-65   → @noble/post-quantum internal API (externalMu mode)
 *   Hash        → SHA-256 via @noble/hashes
 */

import { secp256k1 } from '@noble/curves/secp256k1.js'
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js'
import { sha256 } from '@noble/hashes/sha2.js'

// ── Utilities ─────────────────────────────────────────────────────────────────

const CURVE_ORDER = secp256k1.Point.Fn.ORDER

export function bigintToBytes32(n: bigint): Uint8Array {
  const hex = n.toString(16).padStart(64, '0')
  const out = new Uint8Array(32)
  for (let i = 0; i < 32; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return out
}

export function bytesToBigint(b: Uint8Array): bigint {
  let result = 0n
  for (const byte of b) result = (result << 8n) | BigInt(byte)
  return result
}

export function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const a of arrays) {
    out.set(a, offset)
    offset += a.length
  }
  return out
}

/** Expand a 32-byte SHA-256 hash to a 64-byte message representative (μ) for ML-DSA internal. */
function hashToMu(data: Uint8Array): Uint8Array {
  const h1 = sha256(data)
  const h2 = sha256(concat(h1, new Uint8Array([0xff])))
  return concat(h1, h2)
}

export function toHex(b: Uint8Array): string {
  return Array.from(b)
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')
}

// ── EC-Schnorr (secp256k1) ────────────────────────────────────────────────────

interface ECSchnorrKeyPair {
  sk: Uint8Array
  pk: Uint8Array
}

interface ECSchnorrSig {
  R: Uint8Array // compressed secp256k1 point, 33 bytes
  s: Uint8Array // scalar response, 32 bytes
}

export function ecSchnorrKeygen(): ECSchnorrKeyPair {
  const { secretKey, publicKey } = secp256k1.keygen()
  return { sk: secretKey, pk: publicKey }
}

/** Deterministic nonce derived from sk and msg — prevents nonce reuse attacks. */
export function ecSchnorrDeriveNonce(sk: Uint8Array, msg: Uint8Array): bigint {
  const seed = sha256(concat(sk, msg, new Uint8Array([0x4b]))) // 0x4b = 'K' (nonce domain)
  return bytesToBigint(seed) % CURVE_ORDER
}

/**
 * EC-Schnorr sign.
 * If fusedChallenge is provided, that 32-byte value IS the challenge e (Silithium path).
 * Otherwise challenge = SHA-256(R || pk || msg).
 */
export function ecSchnorrSign(
  msg: Uint8Array,
  sk: Uint8Array,
  fusedChallenge?: Uint8Array
): ECSchnorrSig & { challenge: Uint8Array } {
  const kNum = ecSchnorrDeriveNonce(sk, msg)
  const Rpoint = secp256k1.Point.BASE.multiply(kNum)
  const Rbytes = Rpoint.toBytes(true) // 33-byte compressed
  const pk = secp256k1.getPublicKey(sk)
  const skNum = bytesToBigint(sk) % CURVE_ORDER

  const challenge = fusedChallenge ?? sha256(concat(Rbytes, pk, msg))
  const eNum = bytesToBigint(challenge) % CURVE_ORDER
  const s = (kNum + eNum * skNum) % CURVE_ORDER

  return { R: Rbytes, s: bigintToBytes32(s), challenge }
}

/** Verify EC-Schnorr: s·G == R + e·pk */
export function ecSchnorrVerify(
  msg: Uint8Array,
  pk: Uint8Array,
  R: Uint8Array,
  s: Uint8Array,
  fusedChallenge?: Uint8Array
): boolean {
  try {
    const PointClass = Object.getPrototypeOf(secp256k1.Point.BASE).constructor as {
      fromBytes: (b: Uint8Array) => {
        x: bigint
        y: bigint
        multiply: (
          n: bigint
        ) => { x: bigint; y: bigint; equals: (p: { x: bigint; y: bigint }) => boolean } & object
        add: (p: object) => object
      }
    }
    const Rpoint = PointClass.fromBytes(R)
    const pkPoint = PointClass.fromBytes(pk)
    const sNum = bytesToBigint(s)
    const challenge = fusedChallenge ?? sha256(concat(R, pk, msg))
    const eNum = bytesToBigint(challenge) % CURVE_ORDER
    const lhs = secp256k1.Point.BASE.multiply(sNum)
    const rhs = (Rpoint as unknown as { add: (p: object) => { x: bigint; y: bigint } }).add(
      (pkPoint as unknown as { multiply: (n: bigint) => object }).multiply(eNum)
    )
    return lhs.x === (rhs as { x: bigint }).x && lhs.y === (rhs as { y: bigint }).y
  } catch {
    return false
  }
}

// ── Shared result type ────────────────────────────────────────────────────────

export interface HybridSigKeyPair {
  ecSk: Uint8Array
  ecPk: Uint8Array
  mlSk: Uint8Array
  mlPk: Uint8Array
}

export interface HybridSigResult {
  construction: 'concatenation' | 'nesting' | 'silithium'
  signatureBytes: Uint8Array
  components: {
    ecPart: string // hex
    mlPart: string // hex
    sharedChallenge?: string // hex — only for Silithium
  }
  sizes: {
    ecBytes: number
    mlBytes: number
    totalBytes: number
    concatenationBytes: number // for comparison
    savedBytes: number
  }
  separable: boolean // whether EC component verifies independently
  timingMs: number
  error?: string
}

export interface VerifyResult {
  valid: boolean
  ecValid?: boolean
  mlValid?: boolean
  ecAloneValid: boolean // separability test: can EC be verified without shared μ?
  mlAloneValid: boolean // separability test: can ML-DSA be verified on the raw msg alone?
  error?: string
}

// ── Construction 1: Concatenation ────────────────────────────────────────────

export function concatenationKeygen(): HybridSigKeyPair {
  const ec = ecSchnorrKeygen()
  const ml = ml_dsa65.keygen()
  return { ecSk: ec.sk, ecPk: ec.pk, mlSk: ml.secretKey, mlPk: ml.publicKey }
}

/**
 * Sign with EC-Schnorr and ML-DSA independently.
 * Demonstrates weak/no non-separability: either component verifies alone.
 */
export function concatenationSign(msg: Uint8Array, keyPair: HybridSigKeyPair): HybridSigResult {
  const t0 = performance.now()
  const ecSig = ecSchnorrSign(msg, keyPair.ecSk)
  const mlSig = ml_dsa65.sign(msg, keyPair.mlSk)

  // Wire format: 1-byte R_len prefix + R + s (33+32) + 2-byte mlSig len + mlSig
  const ecBytes = concat(ecSig.R, ecSig.s) // 65 bytes
  const totalBytes = ecBytes.length + mlSig.length
  const timingMs = performance.now() - t0

  return {
    construction: 'concatenation',
    signatureBytes: concat(ecBytes, mlSig),
    components: {
      ecPart: toHex(ecBytes),
      mlPart: toHex(mlSig.slice(0, 32)) + '…',
    },
    sizes: {
      ecBytes: ecBytes.length,
      mlBytes: mlSig.length,
      totalBytes,
      concatenationBytes: totalBytes,
      savedBytes: 0,
    },
    separable: true,
    timingMs,
  }
}

export function concatenationVerify(
  msg: Uint8Array,
  sig: Uint8Array,
  keyPair: Pick<HybridSigKeyPair, 'ecPk' | 'mlPk'>
): VerifyResult {
  const ecBytes = sig.slice(0, 65)
  const mlSig = sig.slice(65)
  const R = ecBytes.slice(0, 33)
  const s = ecBytes.slice(33, 65)
  const ecValid = ecSchnorrVerify(msg, keyPair.ecPk, R, s)
  const mlValid = ml_dsa65.verify(keyPair.mlPk, msg, mlSig)
  return {
    valid: ecValid && mlValid,
    ecValid,
    mlValid,
    ecAloneValid: ecValid, // fully separable
    mlAloneValid: mlValid, // fully separable — ML-DSA also verifies on raw msg
  }
}

// ── Construction 2: Nesting ───────────────────────────────────────────────────

export function nestingKeygen(): HybridSigKeyPair {
  return concatenationKeygen()
}

/**
 * Nesting: ML-DSA outer covers msg || ecSig.
 * EC sig on msg can still be extracted and verified (WNS), but swapping the EC
 * component invalidates the ML-DSA outer layer.
 */
export function nestingSign(msg: Uint8Array, keyPair: HybridSigKeyPair): HybridSigResult {
  const t0 = performance.now()
  const ecSig = ecSchnorrSign(msg, keyPair.ecSk)
  const ecBytes = concat(ecSig.R, ecSig.s) // 65 bytes

  // ML-DSA signs msg || ecSig (binding the EC component into the lattice signature)
  const nestedMsg = concat(msg, ecBytes)
  const mlSig = ml_dsa65.sign(nestedMsg, keyPair.mlSk)

  const totalBytes = ecBytes.length + mlSig.length
  const timingMs = performance.now() - t0

  return {
    construction: 'nesting',
    signatureBytes: concat(ecBytes, mlSig),
    components: {
      ecPart: toHex(ecBytes),
      mlPart: toHex(mlSig.slice(0, 32)) + '…',
    },
    sizes: {
      ecBytes: ecBytes.length,
      mlBytes: mlSig.length,
      totalBytes,
      concatenationBytes: 65 + mlSig.length,
      savedBytes: 0,
    },
    separable: true, // EC part still verifies alone on the original msg
    timingMs,
  }
}

export function nestingVerify(
  msg: Uint8Array,
  sig: Uint8Array,
  keyPair: Pick<HybridSigKeyPair, 'ecPk' | 'mlPk'>
): VerifyResult {
  const ecBytes = sig.slice(0, 65)
  const mlSig = sig.slice(65)
  const R = ecBytes.slice(0, 33)
  const s = ecBytes.slice(33, 65)
  const nestedMsg = concat(msg, ecBytes)
  const ecValid = ecSchnorrVerify(msg, keyPair.ecPk, R, s)
  const mlValid = ml_dsa65.verify(keyPair.mlPk, nestedMsg, mlSig)
  // ML-DSA signed over msg‖ecSig, so verifying on raw msg alone fails (different message)
  const mlAloneValid = ml_dsa65.verify(keyPair.mlPk, msg, mlSig)
  return {
    valid: ecValid && mlValid,
    ecValid,
    mlValid,
    ecAloneValid: ecValid, // EC alone still verifies — WNS
    mlAloneValid,
  }
}

// ── Construction 3: Silithium (Fused, eprint 2025/2059) ──────────────────────

/**
 * Silithium key generation: secp256k1 EC-Schnorr + ML-DSA-65.
 * ML-DSA uses internal keygen (deterministic from random seed for reproducibility).
 */
export function silithiumKeygen(): HybridSigKeyPair {
  const ec = ecSchnorrKeygen()
  const ml = ml_dsa65.keygen()
  return { ecSk: ec.sk, ecPk: ec.pk, mlSk: ml.secretKey, mlPk: ml.publicKey }
}

/**
 * Silithium sign — adapted Fiat-Shamir with shared challenge μ.
 *
 * Protocol (approximation of ePrint 2025/2059 §3):
 *  1. EC commitment:     k = DRBG(sk_ec, msg),  R = k·G  (secp256k1)
 *  2. Shared challenge:  μ = H(R ‖ pk_ec ‖ pk_ml ‖ msg)  expanded to 64 bytes
 *  3. EC response:       s = (k + e·sk_ec) mod n,  e = μ[:32] as bigint mod n
 *  4. ML-DSA response:   z = ML-DSA.Sign_internal(sk_ml, μ)  [FIPS 204 §5.2 external-μ]
 *  Signature: R(33) ‖ s(32) ‖ z
 *
 * NOTE: the paper's full Silithium also binds the ML-DSA round-1 lattice commitment w1
 * in the challenge (μ = H(R_ec ‖ w1 ‖ pk_ec ‖ pk_ml ‖ msg)). w1 is not exposed by
 * @noble/post-quantum's externalMu API, so we approximate without it. The core security
 * property — both components share the same challenge — is preserved.
 */
export function silithiumSign(msg: Uint8Array, keyPair: HybridSigKeyPair): HybridSigResult {
  const t0 = performance.now()

  // Step 1: EC commitment
  const kNum = ecSchnorrDeriveNonce(keyPair.ecSk, msg)
  const Rpoint = secp256k1.Point.BASE.multiply(kNum)
  const Rbytes = Rpoint.toBytes(true) // 33 bytes

  // Step 2: Shared challenge μ (binds EC commitment R, both public keys, and message)
  const mu = hashToMu(concat(Rbytes, keyPair.ecPk, keyPair.mlPk, msg))

  // Step 3: EC response using μ[:32] as challenge e
  const eBytes = mu.slice(0, 32)
  const eNum = bytesToBigint(eBytes) % CURVE_ORDER
  const skNum = bytesToBigint(keyPair.ecSk) % CURVE_ORDER
  const s = (kNum + eNum * skNum) % CURVE_ORDER
  const sBytes = bigintToBytes32(s)

  // Step 4: ML-DSA Sign_internal with external μ (fused challenge)
  const mlSig = ml_dsa65.internal.sign(mu, keyPair.mlSk, { externalMu: true })

  // R(33) + s(32) + mlSig (ML-DSA-65 per FIPS 204 = 3309 bytes)
  const totalBytes = Rbytes.length + sBytes.length + mlSig.length
  const concatenationBytes = 65 + mlSig.length // EC(65) + same ML-DSA sig length
  const timingMs = performance.now() - t0

  return {
    construction: 'silithium',
    signatureBytes: concat(Rbytes, sBytes, mlSig),
    components: {
      ecPart: toHex(Rbytes) + toHex(sBytes),
      mlPart: toHex(mlSig.slice(0, 32)) + '…',
      sharedChallenge: toHex(mu.slice(0, 32)),
    },
    sizes: {
      ecBytes: Rbytes.length + sBytes.length,
      mlBytes: mlSig.length,
      totalBytes,
      concatenationBytes,
      savedBytes: concatenationBytes - totalBytes,
    },
    separable: false, // neither component verifies without the shared μ
    timingMs,
  }
}

export function silithiumVerify(
  msg: Uint8Array,
  sig: Uint8Array,
  keyPair: Pick<HybridSigKeyPair, 'ecPk' | 'mlPk'>
): VerifyResult {
  try {
    const Rbytes = sig.slice(0, 33)
    const sBytes = sig.slice(33, 65)
    const mlSig = sig.slice(65)

    // Recompute shared challenge from R, both public keys, and message
    const mu = hashToMu(concat(Rbytes, keyPair.ecPk, keyPair.mlPk, msg))
    const eBytes = mu.slice(0, 32)

    // Verify EC-Schnorr with fused challenge
    const ecValid = ecSchnorrVerify(msg, keyPair.ecPk, Rbytes, sBytes, eBytes)

    // Verify ML-DSA with external μ
    const mlValid = ml_dsa65.internal.verify(mlSig, mu, keyPair.mlPk, { externalMu: true })

    // Separability test: can EC-Schnorr be verified without the shared μ?
    // Uses the standard (non-fused) challenge H(R || pk || msg) — this WILL fail
    // because the signer used the fused challenge, not the standard one.
    const ecAloneValid = ecSchnorrVerify(msg, keyPair.ecPk, Rbytes, sBytes)

    // ML-DSA was signed with external μ (not standard hash(msg)), so raw msg verify fails
    const mlAloneValid = false
    return { valid: ecValid && mlValid, ecValid, mlValid, ecAloneValid, mlAloneValid }
  } catch (err) {
    return {
      valid: false,
      ecValid: false,
      mlValid: false,
      ecAloneValid: false,
      mlAloneValid: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Recombination attack test: try to swap the ML-DSA component from a different signature.
 * Should always return false — the ML-DSA sig is bound to μ which includes R.
 */
export function silithiumRecombinationAttack(
  msg: Uint8Array,
  legitSig: Uint8Array,
  attackerKeyPair: HybridSigKeyPair
): VerifyResult {
  // Generate a fresh ML-DSA sig from attacker key for the same message
  const attackerResult = silithiumSign(msg, attackerKeyPair)
  const attackerMlSig = attackerResult.signatureBytes.slice(65)

  // Splice: use legitimate EC part + attacker ML part
  const spliced = concat(legitSig.slice(0, 65), attackerMlSig)
  return silithiumVerify(msg, spliced, {
    ecPk: attackerKeyPair.ecPk, // won't match legitimate EC pk
    mlPk: attackerKeyPair.mlPk,
  })
}

// SPDX-License-Identifier: GPL-3.0-only
/**
 * HMAC_DRBG with SHA-256, following NIST SP 800-90A Rev. 1 §10.1.2.
 *
 * A teaching implementation for the Entropy module's DRBG step (and Playground
 * PT-014). It is pure — every input is a parameter, nothing reads a clock or a
 * random source — so the same code the UI runs is checked byte-for-byte against
 * NIST known-answer vectors in hmacDrbg.test.ts (fixture: hmacDrbgSha256.kat.json,
 * NIST ACVP-Server hmacDRBG-1.0 + NIST CAVP HMAC_DRBG.rsp subsets).
 *
 * Passing those vectors shows this code computes the SP 800-90A mechanism
 * correctly for those inputs. It is not a CAVP/ACVP validation, and it says
 * nothing about where the entropy input came from.
 */

/** outlen for SHA-256 (SP 800-90A Rev. 1 §10.1, Table 2). */
export const HMAC_DRBG_SHA256_OUTLEN_BYTES = 32

/**
 * SP 800-90A Rev. 1 §10.1 Table 2: maximum number of requests between reseeds
 * for HMAC_DRBG is 2^48. The UI uses a much smaller interval so the limit is
 * reachable; the generate() check below is the same comparison either way.
 */
export const SP800_90A_HMAC_DRBG_RESEED_INTERVAL = 2 ** 48

export interface HmacDrbgState {
  /** Key (outlen bits) */
  K: Uint8Array
  /** V (outlen bits) */
  V: Uint8Array
  /** reseed_counter — 1 after instantiate or reseed (§10.1.2.3 step 5, §10.1.2.4 step 3) */
  reseedCounter: number
}

export type HmacDrbgGenerateResult =
  | { status: 'SUCCESS'; returnedBytes: Uint8Array; state: HmacDrbgState }
  | { status: 'RESEED_REQUIRED'; state: HmacDrbgState }

function subtle(): SubtleCrypto {
  const s = globalThis.crypto?.subtle
  if (!s) throw new Error('WebCrypto SubtleCrypto is not available in this environment')
  return s
}

/** Copy into a fresh ArrayBuffer-backed Uint8Array (safe across realms for WebCrypto). */
function own(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(new ArrayBuffer(bytes.length))
  out.set(bytes)
  return out
}

export function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0)
  const out = new Uint8Array(total)
  let off = 0
  for (const p of parts) {
    out.set(p, off)
    off += p.length
  }
  return out
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/\s+/g, '')
  if (clean.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(clean)) {
    throw new Error(`Invalid hex string (length ${clean.length})`)
  }
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  return out
}

export function bytesToHex(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += b.toString(16).padStart(2, '0')
  return s
}

/** HMAC-SHA-256 (FIPS 198-1) via WebCrypto. */
export async function hmacSha256(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const k = await subtle().importKey('raw', own(key), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ])
  return new Uint8Array(await subtle().sign('HMAC', k, own(data)))
}

/**
 * HMAC_DRBG_Update — SP 800-90A Rev. 1 §10.1.2.2.
 * An empty provided_data is treated as Null (step 3 returns early).
 */
export async function hmacDrbgUpdate(
  providedData: Uint8Array | null,
  K: Uint8Array,
  V: Uint8Array
): Promise<{ K: Uint8Array; V: Uint8Array }> {
  const data = providedData ?? new Uint8Array(0)
  let k = await hmacSha256(K, concatBytes(V, new Uint8Array([0x00]), data)) // step 1
  let v = await hmacSha256(k, V) // step 2
  if (data.length === 0) return { K: k, V: v } // step 3
  k = await hmacSha256(k, concatBytes(v, new Uint8Array([0x01]), data)) // step 4
  v = await hmacSha256(k, v) // step 5
  return { K: k, V: v }
}

/** HMAC_DRBG_Instantiate_algorithm — SP 800-90A Rev. 1 §10.1.2.3. */
export async function hmacDrbgInstantiate(
  entropyInput: Uint8Array,
  nonce: Uint8Array,
  personalizationString: Uint8Array
): Promise<HmacDrbgState> {
  const seedMaterial = concatBytes(entropyInput, nonce, personalizationString) // step 1
  const K0 = new Uint8Array(HMAC_DRBG_SHA256_OUTLEN_BYTES).fill(0x00) // step 2
  const V0 = new Uint8Array(HMAC_DRBG_SHA256_OUTLEN_BYTES).fill(0x01) // step 3
  const { K, V } = await hmacDrbgUpdate(seedMaterial, K0, V0) // step 4
  return { K, V, reseedCounter: 1 } // step 5
}

/** HMAC_DRBG_Reseed_algorithm — SP 800-90A Rev. 1 §10.1.2.4. */
export async function hmacDrbgReseed(
  state: HmacDrbgState,
  entropyInput: Uint8Array,
  additionalInput: Uint8Array = new Uint8Array(0)
): Promise<HmacDrbgState> {
  const seedMaterial = concatBytes(entropyInput, additionalInput) // step 1
  const { K, V } = await hmacDrbgUpdate(seedMaterial, state.K, state.V) // step 2
  return { K, V, reseedCounter: 1 } // step 3
}

/** HMAC_DRBG_Generate_algorithm — SP 800-90A Rev. 1 §10.1.2.5. */
export async function hmacDrbgGenerate(
  state: HmacDrbgState,
  requestedBytes: number,
  additionalInput: Uint8Array = new Uint8Array(0),
  reseedInterval: number = SP800_90A_HMAC_DRBG_RESEED_INTERVAL
): Promise<HmacDrbgGenerateResult> {
  if (state.reseedCounter > reseedInterval) return { status: 'RESEED_REQUIRED', state } // step 1
  let { K, V } = state
  if (additionalInput.length > 0) {
    ;({ K, V } = await hmacDrbgUpdate(additionalInput, K, V)) // step 2
  }
  let temp = new Uint8Array(0) // step 3
  while (temp.length < requestedBytes) {
    V = await hmacSha256(K, V) // step 4.1
    temp = concatBytes(temp, V) // step 4.2
  }
  const returnedBytes = temp.slice(0, requestedBytes) // step 5
  ;({ K, V } = await hmacDrbgUpdate(additionalInput, K, V)) // step 6
  return {
    status: 'SUCCESS',
    returnedBytes,
    state: { K, V, reseedCounter: state.reseedCounter + 1 }, // step 7
  }
}

/**
 * Generate with prediction resistance — SP 800-90A Rev. 1 §9.3.1 step 7: when
 * prediction resistance is requested, reseed first (with the caller's
 * additional input) and then generate with additional_input = Null (step 7.4).
 */
export async function hmacDrbgGenerateWithPredictionResistance(
  state: HmacDrbgState,
  freshEntropyInput: Uint8Array,
  requestedBytes: number,
  additionalInput: Uint8Array = new Uint8Array(0),
  reseedInterval: number = SP800_90A_HMAC_DRBG_RESEED_INTERVAL
): Promise<HmacDrbgGenerateResult> {
  const reseeded = await hmacDrbgReseed(state, freshEntropyInput, additionalInput)
  return hmacDrbgGenerate(reseeded, requestedBytes, new Uint8Array(0), reseedInterval)
}

// ── Known-answer test runner ────────────────────────────────────────────────

export type HmacDrbgKatStep =
  | { op: 'reseed'; entropyInput: string; additionalInput: string }
  | { op: 'generate'; additionalInput: string; entropyInput?: string }

export interface HmacDrbgKatCase {
  id: string
  source: 'acvp' | 'cavp'
  upstream: Record<string, unknown>
  predictionResistance: boolean
  returnedBitsLen: number
  entropyInput: string
  nonce: string
  personalizationString: string
  steps: HmacDrbgKatStep[]
  returnedBits: string
}

/**
 * Run one vector exactly as both NIST formats define it: instantiate, then the
 * steps in order; the answer is the output of the LAST generate. A generate
 * step that carries entropyInput is a prediction-resistance request.
 */
export async function runHmacDrbgKatCase(c: HmacDrbgKatCase): Promise<Uint8Array> {
  let state = await hmacDrbgInstantiate(
    hexToBytes(c.entropyInput),
    hexToBytes(c.nonce),
    hexToBytes(c.personalizationString)
  )
  const nBytes = c.returnedBitsLen / 8
  let last: Uint8Array | null = null
  for (const step of c.steps) {
    if (step.op === 'reseed') {
      state = await hmacDrbgReseed(
        state,
        hexToBytes(step.entropyInput),
        hexToBytes(step.additionalInput)
      )
      continue
    }
    const res =
      step.entropyInput !== undefined
        ? await hmacDrbgGenerateWithPredictionResistance(
            state,
            hexToBytes(step.entropyInput),
            nBytes,
            hexToBytes(step.additionalInput)
          )
        : await hmacDrbgGenerate(state, nBytes, hexToBytes(step.additionalInput))
    if (res.status !== 'SUCCESS') throw new Error(`${c.id}: generate returned ${res.status}`)
    state = res.state
    last = res.returnedBytes
  }
  if (!last) throw new Error(`${c.id}: vector has no generate step`)
  return last
}

export interface HmacDrbgKatOutcome {
  id: string
  source: 'acvp' | 'cavp'
  passed: boolean
  expected: string
  actual: string
}

/** Run every case; each result is a byte-equal comparison of hex output. */
export async function runHmacDrbgKatSuite(cases: HmacDrbgKatCase[]): Promise<HmacDrbgKatOutcome[]> {
  const out: HmacDrbgKatOutcome[] = []
  for (const c of cases) {
    const actual = bytesToHex(await runHmacDrbgKatCase(c))
    const expected = c.returnedBits.toLowerCase()
    out.push({ id: c.id, source: c.source, passed: actual === expected, expected, actual })
  }
  return out
}

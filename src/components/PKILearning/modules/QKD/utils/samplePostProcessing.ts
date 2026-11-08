// SPDX-License-Identifier: AGPL-3.0-only
export type SampleBit = 0 | 1
export interface ParityMessage {
  start: number
  length: number
  alice: SampleBit
  bob: SampleBit
}

export function sampleBits(value: unknown): SampleBit[] {
  if (!Array.isArray(value)) throw new Error('Use 1–64 actual binary sample bits for each party.')
  const dense: unknown[] = Array.from(value)
  if (dense.length === 0 || dense.length > 64 || dense.some((bit) => bit !== 0 && bit !== 1)) {
    throw new Error('Use 1–64 actual binary sample bits for each party.')
  }
  return dense.map<SampleBit>((bit) => (bit === 1 ? 1 : 0))
}

export function parseSampleBits(text: string): SampleBit[] {
  const compact = text.replace(/\s/g, '')
  if (!/^[01]+$/.test(compact))
    throw new Error('Enter only binary bits (0 or 1); whitespace is ignored.')
  return sampleBits([...compact].map((bit) => Number(bit)))
}

export function retainedSamplePair(
  alice: unknown,
  bob: unknown,
  sampleSize: number,
  accepted: boolean
) {
  const a = sampleBits(alice),
    b = sampleBits(bob)
  if (a.length !== b.length) throw new Error('The sifted sample arrays must have equal lengths.')
  if (!Number.isInteger(sampleSize) || sampleSize < 0 || sampleSize >= a.length)
    throw new Error('The disclosed prefix must leave a nonempty retained sample.')
  if (!accepted)
    throw new Error(
      'The existing BB84 generator rejected this sample; no retained output is available. Generate another sample.'
    )
  return { alice: a.slice(sampleSize), bob: b.slice(sampleSize) }
}

const xor = (a: SampleBit, b: SampleBit): SampleBit => (a === b ? 0 : 1)
export function compareSamplePair(alice: unknown, bob: unknown) {
  const a = sampleBits(alice),
    b = sampleBits(bob)
  if (a.length !== b.length) throw new Error('Alice and Bob must have the same retained bit count.')
  const transcript: ParityMessage[] = []
  for (let start = 0; start < a.length; start += 4) {
    const length = Math.min(4, a.length - start)
    const parity = (bits: SampleBit[]) =>
      bits.slice(start, start + length).reduce<SampleBit>(xor, 0)
    transcript.push({ start, length, alice: parity(a), bob: parity(b) })
  }
  const mismatches = a.reduce<number>((count, bit, index) => count + Number(bit !== b.at(index)), 0)
  return {
    alice: a,
    bob: b,
    transcript,
    mismatches,
    matched: mismatches === 0,
    publicMessageBits: 2 * transcript.length,
  }
}

export function extractionBudget(retainedBits: number, assumedEntropy: number, reserve: number) {
  if (!Number.isInteger(retainedBits) || retainedBits < 1 || retainedBits > 64)
    throw new Error('Retained sample size must be 1–64 bits.')
  if (!Number.isInteger(assumedEntropy) || assumedEntropy < 0 || assumedEntropy > retainedBits)
    throw new Error('Assumed entropy must be a whole number from 0 through the retained bit count.')
  if (!Number.isSafeInteger(reserve) || reserve < 0)
    throw new Error('The illustrative reserve must be a nonnegative whole number.')
  const publicMessageBits = 2 * Math.ceil(retainedBits / 4)
  const remaining = Math.max(0, assumedEntropy - publicMessageBits - reserve)
  return {
    retainedBits,
    assumedEntropy,
    publicMessageBits,
    reserve,
    outputBits: Math.min(retainedBits, remaining),
  }
}

/** Toeplitz mechanics over GF(2); the public seed adds no secret entropy. */
export function toeplitzSample(
  input: unknown,
  outputLength: number,
  seed: readonly SampleBit[]
): SampleBit[] {
  const bits = sampleBits(input)
  if (!Number.isInteger(outputLength) || outputLength < 0 || outputLength > bits.length)
    throw new Error('Output length must be between zero and the retained bit count.')
  if (!Array.isArray(seed)) throw new Error('Use a binary public seed array.')
  const dense: unknown[] = Array.from(seed)
  if (outputLength === 0) {
    if (dense.length !== 0) throw new Error('A zero-length output needs no seed.')
    return []
  }
  if (
    dense.length !== bits.length + outputLength - 1 ||
    dense.some((bit) => bit !== 0 && bit !== 1)
  )
    throw new Error('Public seed length or binary values do not match the matrix.')
  const publicSeed = dense.map<SampleBit>((bit) => (bit === 1 ? 1 : 0))
  return Array.from({ length: outputLength }, (_, row) =>
    bits.reduce<SampleBit>((sum, bit, column) => {
      const coefficient = publicSeed.at(bits.length - 1 + row - column)
      if (coefficient === undefined) throw new Error('Public seed does not cover the matrix.')
      return xor(sum, bit === 1 && coefficient === 1 ? 1 : 0)
    }, 0)
  )
}

export function extractSamplePair(
  alice: unknown,
  bob: unknown,
  assumedEntropy: number,
  reserve: number,
  seed: readonly SampleBit[]
) {
  const pair = compareSamplePair(alice, bob)
  if (!pair.matched)
    throw new Error(
      'Retained samples differ. This batch is rejected; no extraction output is produced.'
    )
  const budget = extractionBudget(pair.alice.length, assumedEntropy, reserve)
  const a = toeplitzSample(pair.alice, budget.outputBits, seed)
  const b = toeplitzSample(pair.bob, budget.outputBits, seed)
  if (a.some((bit, index) => bit !== b.at(index)))
    throw new Error('The two local extraction results differ.')
  return { ...budget, transcript: pair.transcript, seed: [...seed], alice: a, bob: b }
}

export function packSampleBits(input: unknown): Uint8Array {
  const bits = sampleBits(input)
  return new Uint8Array(
    Array.from({ length: Math.ceil(bits.length / 8) }, (_, byteIndex) =>
      bits
        .slice(byteIndex * 8, byteIndex * 8 + 8)
        .reduce<number>((byte, bit, index) => byte | (bit << (7 - index)), 0)
    )
  )
}

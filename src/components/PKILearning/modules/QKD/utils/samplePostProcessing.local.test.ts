// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  compareSamplePair,
  retainedSamplePair,
  extractionBudget,
  toeplitzSample,
  extractSamplePair,
  packSampleBits,
  parseSampleBits,
  type SampleBit,
} from './samplePostProcessing'

const bits = (value: string) => [...value].map(Number) as SampleBit[]
describe('Paired sample postprocessing', () => {
  it('retains both tails after the same disclosed prefix and rejects a generator abort', () => {
    const pair = retainedSamplePair(bits('00000000'), bits('11000000'), 2, true)
    expect(pair).toEqual({ alice: bits('000000'), bob: bits('000000') })
    expect(() => retainedSamplePair(bits('00000000'), bits('00000000'), 2, false)).toThrow(
      /rejected/
    )
    for (const prefix of [-1, 8, 1.5, NaN])
      expect(() => retainedSamplePair(bits('00000000'), bits('00000000'), prefix, true)).toThrow()
  })
  it('compares Bob as well as Alice, including an unsampled mismatch', () => {
    const pair = retainedSamplePair(
      Array(16).fill(0),
      [0, 0, 0, 0, 1, ...Array(11).fill(0)],
      4,
      true
    )
    expect(compareSamplePair(pair.alice, pair.bob)).toMatchObject({
      matched: false,
      mismatches: 1,
      publicMessageBits: 6,
    })
  })
  it('rejects an even-error pair despite identical public parity messages', () => {
    const pair = compareSamplePair(bits('0000'), bits('1100'))
    expect(pair.transcript).toEqual([{ start: 0, length: 4, alice: 0, bob: 0 }])
    expect(pair).toMatchObject({ matched: false, mismatches: 2 })
    expect(() => extractSamplePair(bits('0000'), bits('1100'), 4, 0, bits('00000'))).toThrow(
      /rejected/
    )
  })
  it('counts both parity messages in a final partial block', () => {
    expect(compareSamplePair(bits('10101'), bits('10101')).transcript).toEqual([
      { start: 0, length: 4, alice: 0, bob: 0 },
      { start: 4, length: 1, alice: 1, bob: 1 },
    ])
    expect(extractionBudget(5, 5, 0)).toMatchObject({ publicMessageBits: 4, outputBits: 1 })
  })
  it('computes the declared worked budget and genuine zero-output cases', () => {
    expect(extractionBudget(24, 24, 4)).toEqual({
      retainedBits: 24,
      assumedEntropy: 24,
      publicMessageBits: 12,
      reserve: 4,
      outputBits: 8,
    })
    expect(extractionBudget(8, 8, 4).outputBits).toBe(0)
    expect(extractionBudget(24, 12, 4).outputBits).toBe(0)
    expect(extractionBudget(1, 1, 0).outputBits).toBe(0)
    expect(extractSamplePair(bits('00000000'), bits('00000000'), 8, 4, []).alice).toEqual([])
  })
  it('rejects invalid or missing arithmetic assumptions instead of inventing defaults', () => {
    for (const entropy of [-1, 25, 1.5, NaN])
      expect(() => extractionBudget(24, entropy, 4)).toThrow()
    for (const reserve of [-1, 0.5, Infinity])
      expect(() => extractionBudget(24, 24, reserve)).toThrow()
  })
  it('matches an independent complete truth table for rows [1,1,0,1] and [0,1,1,0]', () => {
    const expected = [
      '00',
      '10',
      '01',
      '11',
      '11',
      '01',
      '10',
      '00',
      '10',
      '00',
      '11',
      '01',
      '01',
      '11',
      '00',
      '10',
    ]
    expected.forEach((result, index) =>
      expect(
        toeplitzSample(bits(index.toString(2).padStart(4, '0')), 2, bits('10110')).join('')
      ).toBe(result)
    )
    expect(toeplitzSample(bits('1011'), 2, bits('10111')).join('')).toBe('00')
  })
  it('extracts the exact bounded length independently for both matched parties', () => {
    const input = bits('101100101010011011100001')
    const seed = bits('1011001001010110111010010110010')
    const result = extractSamplePair(input, input, 24, 4, seed)
    expect(result.alice).toHaveLength(8)
    expect(result.alice.join('')).toBe('11000011')
    expect(result.alice).toEqual(result.bob)
    expect(result.seed).toHaveLength(31)
    expect(result.assumedEntropy).toBe(24) // public seed length never enters the entropy budget
  })
  it('rejects wrong seed length or values, without treating collisions as impossible', () => {
    expect(() => toeplitzSample(bits('1011'), 2, bits('1011'))).toThrow(/seed/)
    expect(() => toeplitzSample(bits('1011'), 2, [1, 0, 2, 1, 0] as SampleBit[])).toThrow(/seed/)
    expect(() => toeplitzSample(bits('1011'), 2, new Array<SampleBit>(5))).toThrow(/seed/)
    expect(() => toeplitzSample(bits('1011'), 0, bits('1'))).toThrow()
    expect(toeplitzSample(bits('0000'), 2, bits('10110'))).toEqual(
      toeplitzSample(bits('0000'), 2, bits('10111'))
    )
  })
  it('preserves exact bit packing and refuses malformed pair data', () => {
    expect([...packSampleBits(bits('10000001'))]).toEqual([0x81])
    expect([...packSampleBits(bits('1'))]).toEqual([0x80])
    expect(parseSampleBits('10 01\n01')).toEqual(bits('100101'))
    for (const input of [[], [0, 2], [true], Array(65).fill(0), new Array(4)])
      expect(() => compareSamplePair(input, input)).toThrow()
    expect(() => compareSamplePair(bits('1'), bits('11'))).toThrow(/same/)
    expect(() => parseSampleBits('10x1')).toThrow()
  })
})

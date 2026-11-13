// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  compareToyCodewords,
  encodeToyRepetition,
  searchDisplayedGrid,
  type ToyBit,
} from './foundationalToySearch'

const message: ToyBit[] = [1, 0, 1, 1, 0, 0, 1, 0]
const encoded: ToyBit[] = [1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0]
function flipped(indices: number[]) {
  return encoded.map((bit, i) => (indices.includes(i) ? ((1 - bit) as ToyBit) : bit))
}
describe('Executed finite point search, not a lattice attack estimate', () => {
  it.each([2, 10, 100, 256])(
    'visits the same64 points in %i dimensions, checking every zero coordinate',
    (dimensions) => {
      expect(searchDisplayedGrid(dimensions, { x: 6.25, y: 6.25 })).toEqual({
        visitedCandidates: 64,
        coordinateChecks: 64 * dimensions,
        squaredDistance: 0,
        nearestIndices: [0],
      })
    }
  )
  it('preserves both equally nearest candidates and the exact squared distance', () => {
    expect(searchDisplayedGrid(10, { x: 12.5, y: 6.25 })).toEqual({
      visitedCandidates: 64,
      coordinateChecks: 640,
      squaredDistance: 39.0625,
      nearestIndices: [0, 1],
    })
  })
  it('changes its answer for a different target and limits search to the displayed boundary', () => {
    expect(searchDisplayedGrid(2, { x: 93.75, y: 93.75 }).nearestIndices).toEqual([63])
    expect(searchDisplayedGrid(2, { x: 106.25, y: 93.75 })).toMatchObject({
      nearestIndices: [63],
      squaredDistance: 156.25,
    })
    expect(searchDisplayedGrid(2, { x: 9.25, y: 10.25 }).squaredDistance).toBe(25)
  })
  it.each([0, 1, 2.5, 257, NaN, Infinity])('rejects unsupported dimension %s', (d) => {
    expect(() => searchDisplayedGrid(d, { x: 0, y: 0 })).toThrow('Invalid bounded grid input')
  })
  it.each([NaN, Infinity, -Infinity])('rejects nonfinite coordinates %s', (x) => {
    expect(() => searchDisplayedGrid(2, { x, y: 0 })).toThrow()
  })
})
describe('Actual public repetition decoder versus exhaustive message comparison', () => {
  it('encodes the declared8-bit message and executes all256 candidate comparisons', () => {
    expect(encodeToyRepetition(message)).toEqual(encoded)
    expect(compareToyCodewords(encoded)).toEqual({
      candidatesVisited: 256,
      bitComparisons: 6144,
      nearestDistance: 0,
      nearestMessage: message,
      majorityMessage: message,
      majorityBitReads: 24,
    })
  })
  it('recovers one error in each of eight repetition groups', () => {
    expect(compareToyCodewords(flipped([0, 3, 6, 9, 12, 15, 18, 21]))).toMatchObject({
      nearestMessage: message,
      majorityMessage: message,
      nearestDistance: 8,
      bitComparisons: 6144,
      majorityBitReads: 24,
    })
  })
  it('same number of errors can recover or fail depending on their actual positions', () => {
    const separate = compareToyCodewords(flipped([0, 3]))
    const clustered = compareToyCodewords(flipped([0, 1]))
    expect(separate).toMatchObject({
      nearestMessage: message,
      majorityMessage: message,
      nearestDistance: 2,
    })
    expect(clustered).toMatchObject({
      nearestMessage: [0, 0, 1, 1, 0, 0, 1, 0],
      majorityMessage: [0, 0, 1, 1, 0, 0, 1, 0],
      nearestDistance: 1,
    })
    expect(separate.candidatesVisited).toBe(256)
    expect(clustered.candidatesVisited).toBe(256)
    expect(clustered.bitComparisons).toBe(6144)
    expect(encoded).toEqual([
      1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0,
    ])
  })
  it('refuses incomplete, extra, nonbinary and sparse words rather than inventing a result', () => {
    for (const bad of [
      encoded.slice(1),
      [...encoded, 0],
      Array(24),
      [...encoded.slice(0, 23), 2],
    ]) {
      expect(() => compareToyCodewords(bad as ToyBit[])).toThrow()
    }
    for (const bad of [message.slice(1), [...message, 1], Array(8), [2, ...message.slice(1)]]) {
      expect(() => encodeToyRepetition(bad as ToyBit[])).toThrow()
    }
  })
})

// SPDX-License-Identifier: AGPL-3.0-only
export type ToyBit = 0 | 1
export interface GridSearchResult {
  visitedCandidates: number
  coordinateChecks: number
  squaredDistance: number
  nearestIndices: number[]
}
/** Exhaust the displayed 8×8 point set, embedded with zero extra coordinates.
 * This is a finite toy comparison, never a full D-dimensional lattice attack. */
export function searchDisplayedGrid(
  dimensions: number,
  target: { x: number; y: number }
): GridSearchResult {
  if (
    !Number.isInteger(dimensions) ||
    dimensions < 2 ||
    dimensions > 256 ||
    !Number.isFinite(target.x) ||
    !Number.isFinite(target.y)
  )
    throw new Error('Invalid bounded grid input')
  let visitedCandidates = 0,
    coordinateChecks = 0,
    squaredDistance = Infinity
  let nearestIndices: number[] = []
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      let distance = 0
      for (let coordinate = 0; coordinate < dimensions; coordinate++) {
        const candidate =
          coordinate === 0 ? (col + 0.5) * 12.5 : coordinate === 1 ? (row + 0.5) * 12.5 : 0
        const observed = coordinate === 0 ? target.x : coordinate === 1 ? target.y : 0
        const difference = candidate - observed
        distance += difference * difference
        coordinateChecks++
      }
      visitedCandidates++
      if (distance < squaredDistance) {
        squaredDistance = distance
        nearestIndices = [row * 8 + col]
      } else if (distance === squaredDistance) nearestIndices.push(row * 8 + col)
    }
  }
  return { visitedCandidates, coordinateChecks, squaredDistance, nearestIndices }
}
export function encodeToyRepetition(message: readonly ToyBit[]): ToyBit[] {
  if (message.length !== 8 || !Array.from(message).every((bit) => bit === 0 || bit === 1))
    throw new Error('The toy message must contain eight bits')
  return message.flatMap((bit) => [bit, bit, bit])
}
/** Compare all 256 eight-bit messages with the actual received 24-bit word.
 * Also execute its public repetition decoder; neither method supplies secrecy. */
export function compareToyCodewords(received: readonly ToyBit[]) {
  if (received.length !== 24 || !Array.from(received).every((bit) => bit === 0 || bit === 1))
    throw new Error('The received toy word must contain 24 bits')
  let candidatesVisited = 0,
    bitComparisons = 0,
    nearestDistance = Infinity
  let nearestMessage: ToyBit[] = []
  for (let candidate = 0; candidate < 256; candidate++) {
    const message = Array.from({ length: 8 }, (_, i) => ((candidate >> (7 - i)) & 1) as ToyBit)
    const encoded = encodeToyRepetition(message)
    let distance = 0
    for (const [i, expected] of encoded.entries()) {
      if (received.at(i) !== expected) distance++
      bitComparisons++
    }
    candidatesVisited++
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestMessage = message
    }
  }
  let majorityBitReads = 0
  const majorityMessage: ToyBit[] = []
  for (let group = 0; group < 8; group++) {
    let ones = 0
    for (let i = 0; i < 3; i++) {
      ones += received[group * 3 + i]
      majorityBitReads++
    }
    majorityMessage.push(ones >= 2 ? 1 : 0)
  }
  return {
    candidatesVisited,
    bitComparisons,
    nearestDistance,
    nearestMessage,
    majorityMessage,
    majorityBitReads,
  }
}

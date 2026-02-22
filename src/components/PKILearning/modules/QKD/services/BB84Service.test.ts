/* eslint-disable security/detect-object-injection */
import { describe, it, expect } from 'vitest'
import {
  createInitialState,
  prepareQubits,
  transmitQubits,
  measureQubits,
  reconcileBases,
  siftKey,
  runFullProtocol,
  getFinalKey,
  advancePhase,
  bitsToHex,
} from './BB84Service'

describe('BB84Service', () => {
  describe('createInitialState', () => {
    it('creates state with correct defaults', () => {
      const state = createInitialState(16, false)
      expect(state.phase).toBe('idle')
      expect(state.numQubits).toBe(16)
      expect(state.evePresent).toBe(false)
      expect(state.aliceQubits).toHaveLength(0)
      expect(state.qber).toBeNull()
    })
  })

  describe('prepareQubits', () => {
    it('generates correct number of qubits', () => {
      const state = createInitialState(16, false)
      const prepared = prepareQubits(state)
      expect(prepared.phase).toBe('prepare')
      expect(prepared.aliceQubits).toHaveLength(16)
    })

    it('generates qubits with valid values', () => {
      const state = createInitialState(32, false)
      const prepared = prepareQubits(state)
      prepared.aliceQubits.forEach((q) => {
        expect([0, 1]).toContain(q.bitValue)
        expect(['+', 'x']).toContain(q.basis)
        expect(['↕', '↔', '⤢', '⤡']).toContain(q.polarization)
      })
    })
  })

  describe('full protocol without Eve', () => {
    it('produces a sifted key approximately half the size', () => {
      // Run many times to check statistical properties
      const results = Array.from({ length: 20 }, () => runFullProtocol(64, false))
      const avgSiftRatio =
        results.reduce((sum, r) => sum + r.siftedKeyAlice.length / r.numQubits, 0) / results.length

      // Should be approximately 50% (±15% for small sample)
      expect(avgSiftRatio).toBeGreaterThan(0.3)
      expect(avgSiftRatio).toBeLessThan(0.7)
    })

    it('has QBER close to 0% without eavesdropper', () => {
      const results = Array.from({ length: 20 }, () => runFullProtocol(64, false))
      const avgQber = results.reduce((sum, r) => sum + (r.qber || 0), 0) / results.length

      // Without Eve, QBER should be very close to 0
      expect(avgQber).toBeLessThan(0.05)
    })

    it('marks key as secure without eavesdropper', () => {
      const results = Array.from({ length: 10 }, () => runFullProtocol(64, false))
      // Most runs should be secure (allow for rare statistical flukes)
      const secureCount = results.filter((r) => r.isSecure).length
      expect(secureCount).toBeGreaterThanOrEqual(9)
    })

    it('completes all phases in order', () => {
      let state = createInitialState(16, false)
      const phases = [
        'idle',
        'prepare',
        'transmit',
        'measure',
        'reconcile',
        'sift',
        'detect',
        'complete',
      ]

      for (let i = 0; i < phases.length - 1; i++) {
        expect(state.phase).toBe(phases[i])
        state = advancePhase(state)
      }
      expect(state.phase).toBe('complete')
    })
  })

  describe('full protocol with Eve', () => {
    it('produces elevated QBER with eavesdropper', () => {
      const results = Array.from({ length: 20 }, () => runFullProtocol(64, true))
      const avgQber = results.reduce((sum, r) => sum + (r.qber || 0), 0) / results.length

      // With Eve intercepting every qubit, QBER should be around 25%
      expect(avgQber).toBeGreaterThan(0.1)
      expect(avgQber).toBeLessThan(0.4)
    })

    it('detects eavesdropper most of the time', () => {
      const results = Array.from({ length: 20 }, () => runFullProtocol(64, true))
      const insecureCount = results.filter((r) => !r.isSecure).length

      // With 64 qubits and Eve, most runs should detect eavesdropping
      expect(insecureCount).toBeGreaterThanOrEqual(10)
    })

    it('records Eve interceptions', () => {
      const state = runFullProtocol(16, true)
      expect(state.eveInterceptions).toHaveLength(16)
      expect(state.eveInterceptions.every((e) => e === true)).toBe(true)
    })
  })

  describe('basis reconciliation', () => {
    it('correctly identifies matching bases', () => {
      let state = createInitialState(16, false)
      state = prepareQubits(state)
      state = transmitQubits(state)
      state = measureQubits(state)
      state = reconcileBases(state)

      expect(state.matchingBases).toHaveLength(16)
      state.matchingBases.forEach((match, i) => {
        expect(match).toBe(state.aliceQubits[i].basis === state.bobBases[i])
      })
    })
  })

  describe('sifting', () => {
    it('only keeps matching-basis positions', () => {
      let state = createInitialState(32, false)
      state = prepareQubits(state)
      state = transmitQubits(state)
      state = measureQubits(state)
      state = reconcileBases(state)
      state = siftKey(state)

      const expectedLength = state.matchingBases.filter(Boolean).length
      expect(state.siftedKeyAlice).toHaveLength(expectedLength)
      expect(state.siftedKeyBob).toHaveLength(expectedLength)
    })
  })

  describe('getFinalKey', () => {
    it('returns empty array if not secure', () => {
      const state = { ...runFullProtocol(8, true), isSecure: false }
      expect(getFinalKey(state)).toHaveLength(0)
    })

    it('returns key minus sample bits when secure', () => {
      const state = runFullProtocol(64, false)
      if (state.isSecure && state.sampleSize !== null) {
        const finalKey = getFinalKey(state)
        expect(finalKey.length).toBe(state.siftedKeyAlice.length - state.sampleSize)
      }
    })
  })

  describe('bitsToHex', () => {
    it('converts bits to hex correctly', () => {
      expect(bitsToHex([1, 0, 1, 0])).toBe('a')
      expect(bitsToHex([1, 1, 1, 1])).toBe('f')
      expect(bitsToHex([0, 0, 0, 0])).toBe('0')
      expect(bitsToHex([1, 0, 1, 0, 0, 0, 1, 1])).toBe('a3')
    })

    it('handles empty array', () => {
      expect(bitsToHex([])).toBe('(empty)')
    })
  })
})

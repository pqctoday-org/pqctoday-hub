// SPDX-License-Identifier: GPL-3.0-only
/**
 * Guards for safeComputeAllScores(): the trust-score pipeline must never
 * throw into the UI, but a failure must never be silent either — it logs
 * via console.error and flags the degraded state to callers.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import type { TrustScore } from './types'
import { safeComputeAllScores, trustScores, trustScoresDegraded } from './trustScoreData'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('safeComputeAllScores', () => {
  it('on failure: never throws, logs the error, and flags degraded — a silent empty map is impossible', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const boom = new Error('boom')

    const result = safeComputeAllScores(() => {
      throw boom
    })

    expect(result.degraded).toBe(true)
    expect(result.scores.size).toBe(0)
    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('[trustScore]'), boom)
  })

  it('on success: passes scores through with degraded=false and no error log', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const scores = new Map<string, TrustScore>([
      [
        'library:X',
        {
          resourceType: 'library',
          resourceId: 'X',
          compositeScore: 90,
          tier: 'Authoritative',
          dimensions: [],
          computedAt: new Date().toISOString(),
        },
      ],
    ])

    const result = safeComputeAllScores(() => scores)

    expect(result.degraded).toBe(false)
    expect(result.scores).toBe(scores)
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('module-load computation succeeded against real data (not degraded, non-empty)', () => {
    expect(trustScoresDegraded).toBe(false)
    expect(trustScores.size).toBeGreaterThan(0)
  })
})

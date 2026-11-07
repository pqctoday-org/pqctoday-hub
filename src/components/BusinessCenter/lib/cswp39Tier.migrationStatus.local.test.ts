// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { implementTier } from './cswp39Tier'
import type { BusinessMetrics } from '../hooks/useBusinessMetrics'
import type { ExecutiveDocument } from '@/services/storage/types'

function metrics(status: string, roadmap = false): BusinessMetrics {
  const artifact = {
    id: 'sample-plan',
    type: 'migration-roadmap',
    title: 'Sample roadmap',
    data: '',
    moduleId: 'sample',
    createdAt: 0,
  } satisfies ExecutiveDocument
  return {
    migrationStatus: status,
    artifactsByPillar: {
      risk: [],
      compliance: [],
      governance: roadmap ? [artifact] : [],
      vendor: [],
      inventory: [],
      architecture: [],
    },
    completedPhases: [],
    workflowActive: false,
    fipsBreakdown: { validated: 0, partial: 0, none: 0 },
  } as unknown as BusinessMetrics
}
describe('implementation tier requires an explicit started answer', () => {
  it.each(['not-started', 'planning', 'unknown', 'Not assessed', ''])(
    'does not promote %s to implementation activity',
    (status) => {
      const input = metrics(status),
        result = implementTier(input)
      expect(result.tier).toBe(1)
      expect(result.reasons.some((reason) => reason.startsWith('Migration status:'))).toBe(false)
      expect(input.migrationStatus).toBe(status)
    }
  )
  it('retains the explicit started status as an implementation signal', () => {
    expect(implementTier(metrics('started'))).toMatchObject({
      tier: 2,
      reasons: ['Migration status: started'],
    })
  })
  it('retains planning credit from an actual sample roadmap without pretending migration started', () => {
    const result = implementTier(metrics('planning', true))
    expect(result.tier).toBe(2)
    expect(result.reasons).toContain('Migration roadmap on file')
    expect(result.reasons).not.toContain('Migration status: planning')
  })
})

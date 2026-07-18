// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { buildScoreboard } from './scoreboard'
import type { TransformationStatus } from '../components/Simulation/autorun/transformationStatus'

const txStatus = (overrides: Partial<TransformationStatus> = {}): TransformationStatus => ({
  maturity: 2,
  hndlExposure: 0.5,
  tracks: [],
  objectives: [
    { id: 'governance', label: 'Governance', byYear: 2027, done: true, onTime: 'done' },
    {
      id: 'critical',
      label: 'Critical assets protected',
      byYear: 2030,
      done: false,
      onTime: 'in-progress',
    },
    {
      id: 'complete',
      label: 'Migration completed',
      byYear: 2035,
      done: false,
      onTime: 'in-progress',
    },
  ],
  ...overrides,
})

describe('buildScoreboard', () => {
  it('packages the milestone count from lifecyclePhases/levelOf/winLevel', () => {
    const sb = buildScoreboard({
      lifecyclePhases: ['p0', 'p1', 'p2'],
      levelOf: (p) => ({ p0: 3, p1: 1, p2: 2 })[p]!,
      winLevel: 2,
      fullyMature: false,
      txStatus: txStatus(),
    })
    expect(sb.milestone).toEqual({ cleared: 2, total: 3 }) // p0(3) and p2(2) clear the L2 floor; p1(1) doesn't
  })

  it('complete mirrors the fullyMature input exactly — never re-derived', () => {
    const base = {
      lifecyclePhases: ['p0'],
      levelOf: () => 4,
      winLevel: 2,
      txStatus: txStatus(),
    }
    expect(buildScoreboard({ ...base, fullyMature: true }).complete).toBe(true)
    expect(buildScoreboard({ ...base, fullyMature: false }).complete).toBe(false)
  })

  it('passes objectives and maturity through from txStatus unchanged', () => {
    const status = txStatus({ maturity: 3.7 })
    const sb = buildScoreboard({
      lifecyclePhases: [],
      levelOf: () => 0,
      winLevel: 2,
      fullyMature: false,
      txStatus: status,
    })
    expect(sb.objectives).toBe(status.objectives)
    expect(sb.maturity).toBe(3.7)
  })

  it('milestone.cleared is 0 for an empty phase list', () => {
    const sb = buildScoreboard({
      lifecyclePhases: [],
      levelOf: () => 4,
      winLevel: 2,
      fullyMature: false,
      txStatus: txStatus(),
    })
    expect(sb.milestone).toEqual({ cleared: 0, total: 0 })
  })
})

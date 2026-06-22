// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { buildInitialPhaseStatus } from './useMigrationWorkflowStore'
import { PHASE_ORDER } from '@/data/frameworkPhases'

describe('buildInitialPhaseStatus', () => {
  it('covers every phase in PHASE_ORDER (incl. terminal/spanning bands)', () => {
    const status = buildInitialPhaseStatus()
    for (const id of PHASE_ORDER) {
      // Guards the RM-07 bug: a new phase id (e.g. verify-close) MUST get an
      // initial status, else the persisted-state migrate backfill leaves the
      // rail reading an undefined status.
      expect(status[id], `${id} has no initial phase status`).toBeDefined()
    }
    expect(Object.keys(status).sort()).toEqual([...PHASE_ORDER].sort())
  })

  it("marks p0 'active' and the rest 'todo'", () => {
    const status = buildInitialPhaseStatus()
    expect(status.p0).toBe('active')
    expect(status['verify-close']).toBe('todo')
    expect(status.foundations).toBe('todo')
  })
})

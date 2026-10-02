// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { FHE_HSM_FLOWS, engineStatusOf } from './fheHsmFlows'
import { FHE_STEP_COSTS, FHE_STEP_KEYS, KEY_SIZES } from './fheHsmCosts'
import { FHE_STEP_IO } from './fheHsmStepIO'
import { FHE_KEY_MAP } from './fheKeyMap'

describe('FHE + HSM per-step cost data', () => {
  it.each(FHE_HSM_FLOWS.map((f) => [f.id, f.steps.length] as const))(
    '%s has one cost, key list and input/computation/output entry per step',
    (id, steps) => {
      expect(FHE_STEP_COSTS[id]).toHaveLength(steps)
      expect(FHE_STEP_KEYS[id]).toHaveLength(steps)
      expect(FHE_STEP_IO[id]).toHaveLength(steps)
    }
  )

  it('every referenced key exists and the short labels fit the diagram columns', () => {
    const ids = new Set(KEY_SIZES.map((k) => k.id))
    for (const lists of Object.values(FHE_STEP_KEYS))
      for (const list of lists) for (const k of list) expect(ids.has(k)).toBe(true)
    for (const costs of Object.values(FHE_STEP_COSTS))
      for (const c of costs) {
        expect(c.dataShort.length).toBeLessThanOrEqual(12)
        expect(c.computeShort.length).toBeLessThanOrEqual(12)
      }
  })

  it.each(FHE_HSM_FLOWS.map((f) => [f.id, f] as const))(
    '%s key-map placements point at real actors and steps',
    (id, flow) => {
      const actors = new Set([...flow.actors.map((a) => a.id), 'datacenter'])
      for (const pl of FHE_KEY_MAP[id]) {
        expect(actors.has(pl.at)).toBe(true)
        expect(pl.from).toBeLessThan(flow.steps.length)
        if (pl.until !== undefined) expect(pl.until).toBeGreaterThanOrEqual(pl.from)
      }
    }
  )

  it.each(FHE_HSM_FLOWS.map((f) => [f.id, f] as const))(
    '%s labels every HSM step with what the engine can do, never as outside the HSM',
    (_id, flow) => {
      expect(flow.validation.target.length).toBeGreaterThan(0)
      const hsm = new Set(flow.actors.filter((a) => a.kind === 'hsm').map((a) => a.id))
      for (const st of flow.steps) {
        const status = engineStatusOf(flow, st)
        if (hsm.has(st.from) || hsm.has(st.to)) expect(status).not.toBe('outside')
        else expect(status).toBe('outside')
      }
    }
  )

  it.each(FHE_HSM_FLOWS.map((f) => [f.id, f] as const))(
    '%s never wraps the seed: backups go through the vendor replication capability',
    (_id, flow) => {
      for (const st of flow.steps) {
        expect(st.api ?? '').not.toMatch(/C_WrapKey/)
        if (st.link === 'wrap') expect(st.api).toMatch(/vendor replication capability/)
      }
    }
  )
})

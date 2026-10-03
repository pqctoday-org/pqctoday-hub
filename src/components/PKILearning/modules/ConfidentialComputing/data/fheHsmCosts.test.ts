// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { FHE_HSM_FLOWS, FLOW_STEP_META, engineStatusOf } from './fheHsmFlows'
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
        expect(pl.from).toBeGreaterThanOrEqual(0)
        expect(pl.from).toBeLessThan(flow.steps.length)
        if (pl.until !== undefined) {
          expect(pl.until).toBeGreaterThanOrEqual(pl.from)
          expect(pl.until).toBeLessThan(flow.steps.length)
        }
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

  it.each(FHE_HSM_FLOWS.map((f) => [f.id, f] as const))(
    '%s gives every step a phase and a data state, and every actor a trust zone',
    (id, flow) => {
      expect(FLOW_STEP_META[id].phase).toHaveLength(flow.steps.length)
      expect(FLOW_STEP_META[id].data).toHaveLength(flow.steps.length)
      for (const a of flow.actors) expect(['owner', 'third', 'party']).toContain(a.zone)
      for (const st of flow.steps) {
        if (!st.shareWith) continue
        const target = flow.actors.find((a) => a.id === st.shareWith)
        expect(target?.zone).toBe('third')
      }
    }
  )

  it.each(FHE_HSM_FLOWS.map((f) => [f.id, f] as const))(
    '%s never lets the third party talk to an HSM directly',
    (_id, flow) => {
      const third = new Set(flow.actors.filter((a) => a.zone === 'third').map((a) => a.id))
      const hsm = new Set(flow.actors.filter((a) => a.kind === 'hsm').map((a) => a.id))
      // Lattigo's protocol is aggregator-driven by design (refresh / key switch requests).
      if (flow.id === 'lattigo-threshold') return
      for (const st of flow.steps) {
        if (third.has(st.from) && hsm.has(st.to)) throw new Error(`${flow.id}: ${st.label}`)
      }
    }
  )
})

// SPDX-License-Identifier: AGPL-3.0-only
//
// The Compare tab loads each chosen policy into the shared engine in turn, then
// puts the active policy back. A run the reader has left (switched tab, changed a
// side) must stop touching the engine, and the put-back must not undo a preset
// the reader chose while the run was in flight. Engine and fetch are mocked.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { KmipEngine, PolicyStatus } from '@/wasm/kmip/kmipEngine'

vi.mock('./ModuleStatusPanel', () => ({ ModuleStatusPanel: () => null }))
vi.mock('./Pkcs11BypassDemo', () => ({ Pkcs11BypassDemo: () => null }))
vi.mock('./Pkcs11CertificateDemo', () => ({ Pkcs11CertificateDemo: () => null }))
vi.mock('./PolicyRulesDisplay', () => ({
  PolicyRulesDisplay: () => null,
  PolicyRulesLegend: () => null,
}))
vi.mock('./PolicyTimeline', () => ({ PolicyTimeline: () => null }))
vi.mock('./PolicyScenario', () => ({ PolicyScenario: () => null }))
vi.mock('./visual/PolicyGraphView', () => ({ PolicyGraphView: () => null }))

import { PolicyView, type DetailTab } from './PolicyView'

const engine = {
  dryRun: vi.fn(() => ({ kind: 'Allow' })),
  loadPolicy: vi.fn(() => ({ ok: true })),
  activateModulePreset: vi.fn(() => ({ ok: true })),
}

type Pending = { url: string; resolve: () => void }
let phase: 'bulk' | 'compare' = 'bulk'
let pending: Pending[] = []

const fetchMock = vi.fn((url: string) => {
  const response = { ok: true, status: 200, text: () => Promise.resolve(`- type: x # ${url}`) }
  if (phase === 'bulk') return Promise.resolve(response)
  return new Promise((resolve) => {
    pending.push({ url, resolve: () => resolve(response) })
  })
})

const flush = () =>
  act(async () => {
    await Promise.resolve()
  })
/** Let every pending fetch whose URL contains `part` finish. */
const release = async (part: string) => {
  const now = pending.filter((p) => p.url.includes(part))
  pending = pending.filter((p) => !p.url.includes(part))
  await act(async () => {
    now.forEach((p) => p.resolve())
  })
}

const status = (name: string): PolicyStatus => ({ active: true, name, fingerprint: name })

const view = (tab: DetailTab, active: string) => (
  <PolicyView
    engine={engine as unknown as KmipEngine}
    policy={status(active)}
    policyYaml="- type: current"
    busy={false}
    expert={false}
    onLoadPolicy={() => {}}
    onApplyYaml={() => ({ ok: true })}
    view={tab}
    onViewChange={() => {}}
  />
)

/** Mount on the List tab, let the catalog load, then open Compare with fetches held back. */
const openCompare = async (active: string) => {
  const utils = render(view('list', active))
  await flush()
  phase = 'compare'
  utils.rerender(view('compare', active))
  await flush()
  return utils
}

describe('PolicyView compare run', () => {
  beforeEach(() => {
    phase = 'bulk'
    pending = []
    vi.stubGlobal('fetch', fetchMock)
    engine.dryRun.mockClear()
    engine.loadPolicy.mockClear()
    engine.activateModulePreset.mockClear()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('does not activate a side whose module files arrive after the reader left Compare', async () => {
    const { rerender } = await openCompare('classical')
    expect(pending.length).toBeGreaterThan(0)
    rerender(view('list', 'classical'))
    await flush()
    await release('classical-')
    await flush()
    expect(engine.activateModulePreset).not.toHaveBeenCalled()
    expect(engine.loadPolicy).not.toHaveBeenCalled()
  })

  it('does not activate or sweep the second side after the reader left Compare', async () => {
    const { rerender } = await openCompare('classical')
    await release('classical-')
    await flush()
    expect(engine.activateModulePreset).toHaveBeenCalledTimes(1)
    rerender(view('list', 'classical'))
    await flush()
    // later renders also ask for the resolved defaults, so count from here
    const sweepsSoFar = engine.dryRun.mock.calls.length
    await release('pqc-')
    await flush()
    expect(engine.activateModulePreset).toHaveBeenCalledTimes(1)
    expect(engine.dryRun.mock.calls.length).toBe(sweepsSoFar)
  })

  it('does not put the active policy back after the reader left Compare', async () => {
    const { rerender } = await openCompare('classical')
    await release('classical-')
    await release('pqc-')
    await flush()
    // both sides loaded; the put-back of the active (classical) module set is now waiting on its files
    expect(engine.activateModulePreset).toHaveBeenCalledTimes(2)
    rerender(view('list', 'classical'))
    await flush()
    await release('classical-')
    await flush()
    expect(engine.activateModulePreset).toHaveBeenCalledTimes(2)
  })

  it('does not put back the preset that was active when the reader has since chosen another', async () => {
    const { rerender } = await openCompare('classical')
    await release('classical-')
    // the reader picks another preset while the second side is still loading
    rerender(view('compare', 'cnsa-2.0'))
    await flush()
    await release('pqc-')
    await flush()
    await release('classical-')
    await flush()
    expect(engine.activateModulePreset).toHaveBeenCalledTimes(2)
  })

  it('puts the active policy back once both sides have been swept', async () => {
    await openCompare('classical')
    await release('classical-')
    await release('pqc-')
    await flush()
    await release('classical-')
    await flush()
    expect(engine.activateModulePreset).toHaveBeenCalledTimes(3)
  })
})

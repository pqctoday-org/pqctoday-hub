// SPDX-License-Identifier: AGPL-3.0-only
//
// The Compare tab loads each chosen policy into the shared engine in turn, then
// puts the active policy back. A run the reader has left (switched tab, changed a
// side) must stop loading policies into the engine, but the reader's own policy
// is still put back; the put-back is skipped only when a newer run has started
// or the reader chose another preset while the run was in flight. The active
// preset in these tests is neither compare side, so a leftover compare policy
// can never coincide with it by chance. Engine and fetch are mocked.
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
/** A URL part answered with HTTP 404 during the compare phase. */
let notServed: string | null = null

const fetchMock = vi.fn((url: string) => {
  const missing = phase === 'compare' && notServed !== null && url.includes(notServed)
  const response = {
    ok: !missing,
    status: missing ? 404 : 200,
    text: () => Promise.resolve(`- type: x # ${url}`),
  }
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

const view = (tab: DetailTab, active: string, yaml = '- type: current') => (
  <PolicyView
    engine={engine as unknown as KmipEngine}
    policy={status(active)}
    policyYaml={yaml}
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
    notServed = null
    vi.stubGlobal('fetch', fetchMock)
    engine.dryRun.mockClear()
    engine.loadPolicy.mockClear()
    engine.activateModulePreset.mockClear()
  })
  afterEach(() => vi.unstubAllGlobals())

  /** Names of the policies loaded through the module path, in order. */
  const loaded = () => engine.activateModulePreset.mock.calls.map((c) => (c as unknown[])[0])

  it('does not activate a side whose module files arrive after the reader left Compare', async () => {
    const { rerender } = await openCompare('cnsa-2.0')
    expect(pending.length).toBeGreaterThan(0)
    rerender(view('list', 'cnsa-2.0'))
    await flush()
    await release('classical-')
    await flush()
    // nothing was loaded, so there is nothing to put back
    expect(loaded()).toEqual([])
    expect(engine.loadPolicy).not.toHaveBeenCalled()
    expect(pending).toEqual([])
  })

  it('does not activate or sweep the second side after the reader left Compare', async () => {
    const { rerender } = await openCompare('cnsa-2.0')
    await release('classical-')
    await flush()
    expect(loaded()).toEqual(['classical'])
    rerender(view('list', 'cnsa-2.0'))
    await flush()
    // later renders also ask for the resolved defaults, so count from here
    const sweepsSoFar = engine.dryRun.mock.calls.length
    await release('pqc-')
    await flush()
    expect(loaded()).not.toContain('pqc')
    expect(engine.dryRun.mock.calls.length).toBe(sweepsSoFar)
  })

  it('puts the active policy back when the reader left Compare between the two sides', async () => {
    const { rerender } = await openCompare('cnsa-2.0')
    await release('classical-')
    rerender(view('list', 'cnsa-2.0'))
    await flush()
    await release('pqc-')
    await flush()
    // the active policy is fetched again and loaded; the second side never is
    await release('cnsa-2.0-')
    await flush()
    expect(loaded()).toEqual(['classical', 'cnsa-2.0'])
  })

  it('puts the active policy back when the Policy view unmounts mid-run', async () => {
    const { unmount } = await openCompare('cnsa-2.0')
    await release('classical-')
    unmount()
    await release('pqc-')
    await release('cnsa-2.0-')
    await flush()
    expect(loaded()).toEqual(['classical', 'cnsa-2.0'])
  })

  it('lets only the newest run put the active policy back', async () => {
    const { rerender } = await openCompare('cnsa-2.0')
    await release('classical-')
    // a changed policy text starts a second run while the first waits on its second side
    rerender(view('compare', 'cnsa-2.0', '- type: changed'))
    await flush()
    await release('pqc-')
    await flush()
    // the older run is superseded: it does not fetch or load the active policy
    expect(pending.some((p) => p.url.includes('cnsa-2.0-'))).toBe(false)
    expect(loaded()).toEqual(['classical'])
    await release('classical-')
    await release('pqc-')
    await flush()
    await release('cnsa-2.0-')
    await flush()
    expect(loaded()).toEqual(['classical', 'classical', 'pqc', 'cnsa-2.0'])
  })

  it('does not put back the preset that was active when the reader has since chosen another', async () => {
    const { rerender } = await openCompare('cnsa-2.0')
    await release('classical-')
    // the reader picks another preset while the second side is still loading
    rerender(view('compare', 'auto-migrate-on-use'))
    await flush()
    await release('pqc-')
    await flush()
    expect(pending.some((p) => p.url.includes('cnsa-2.0-'))).toBe(false)
    expect(loaded()).toEqual(['classical', 'pqc'])
  })

  it('puts the active policy back once both sides have been swept', async () => {
    await openCompare('cnsa-2.0')
    await release('classical-')
    await release('pqc-')
    await flush()
    await release('cnsa-2.0-')
    await flush()
    expect(loaded()).toEqual(['classical', 'pqc', 'cnsa-2.0'])
  })

  it('does not load a side whose module file is not served', async () => {
    notServed = 'classical-signing'
    await openCompare('cnsa-2.0')
    await release('classical-')
    await flush()
    expect(loaded()).toEqual([])
    expect(engine.loadPolicy).not.toHaveBeenCalled()
  })

  it('still puts the active policy back when the engine throws while loading a side', async () => {
    engine.activateModulePreset.mockImplementationOnce(() => {
      throw new Error('engine failure')
    })
    await openCompare('cnsa-2.0')
    await release('classical-')
    await flush()
    await release('cnsa-2.0-')
    await flush()
    // the first call threw; the second call is the put-back of the reader's own policy
    expect(loaded()).toEqual(['classical', 'cnsa-2.0'])
  })

  it('does not sweep or load the second side when the engine refuses the first, and puts the active policy back', async () => {
    engine.activateModulePreset.mockImplementationOnce(() => ({ ok: false }))
    await openCompare('cnsa-2.0')
    const sweptBefore = engine.dryRun.mock.calls.length
    await release('classical-')
    await flush()
    await release('cnsa-2.0-')
    await flush()
    expect(loaded()).toEqual(['classical', 'cnsa-2.0'])
    expect(engine.dryRun.mock.calls.length).toBe(sweptBefore)
  })
})

// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Learn routes of the Testing & Validation lesson: the certification route shows only the
 * IoT firmware TVLA scenario on the Exercises tab and only the side-channel testing product
 * on the Tools & Products tab. Every other route, and the view with no route chosen, keeps
 * all six scenarios and every product.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '@/embed/EmbedProvider'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { getMigrateItemsForModule } from '@/data/migrateData'
import { PQCTestingValidationModule } from './index'
import manifest from './manifest'
import { CERTIFICATION_PATH, NETWORK_PATH, TOOLS_ON_PATH, toolOnPath } from './data/learnPathTags'

const SCENARIO_TITLES = [
  'OT Network Passive Scan',
  'VPN Gateway Pre-Migration Scan',
  'Satellite Link Performance Impact',
  'Legacy Server Interop Failure Analysis',
  'IoT Firmware TVLA Assessment',
  'EU 2026 Inventory Milestone Strategy',
]

const renderModule = () =>
  render(
    <EmbedProvider>
      <MemoryRouter initialEntries={['/learn/pqc-testing-validation']}>
        <PQCTestingValidationModule />
      </MemoryRouter>
    </EmbedProvider>
  )

const openTab = (name: string) => {
  const tab = screen.getByRole('tab', { name })
  fireEvent.mouseDown(tab)
  fireEvent.click(tab)
}

const scenarioHeadings = () =>
  screen
    .queryAllByRole('heading', { level: 3 })
    .map((h) => h.textContent ?? '')
    .filter((t) => SCENARIO_TITLES.some((title) => t.endsWith(title)))

beforeEach(() => {
  useModuleStore.getState().resetProgress()
  usePersonaStore.getState().setPersona(null)
  window.history.replaceState(null, '', '/')
})

describe('Testing & Validation - certification route', () => {
  it('is the route a certification engineer starts on', () => {
    usePersonaStore.getState().setPersona('cert-engineer')
    renderModule()
    expect(useModuleStore.getState().modules[manifest.id]?.activeLearnPath).toBe(CERTIFICATION_PATH)
  })

  it('Exercises tab shows only the IoT firmware TVLA scenario, and the lead-in counts one', () => {
    usePersonaStore.getState().setPersona('cert-engineer')
    renderModule()
    openTab('Exercises')
    expect(scenarioHeadings()).toEqual(['1. IoT Firmware TVLA Assessment'])
    expect(
      screen.getByText(/One real-world PQC testing scenario — designed to reveal a key insight/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/Six real-world PQC testing scenarios/)).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Try It/ })).toHaveLength(1)
  })

  it('Tools tab lists only the side-channel testing product', () => {
    usePersonaStore.getState().setPersona('cert-engineer')
    renderModule()
    openTab('Tools & Products')
    expect(screen.getByText('Keysight Inspector')).toBeInTheDocument()
    for (const hidden of ['SSLyze', 'testssl.sh', 'Keysight CyPerf', 'pqcscan', 'Crucible']) {
      expect(screen.queryByText(hidden)).not.toBeInTheDocument()
    }
  })
})

describe('Testing & Validation - other routes are unchanged', () => {
  it.each([
    ['the network route', 'developer' as const],
    ['no route chosen', null],
  ])('%s keeps all six scenarios and every product', (_label, persona) => {
    usePersonaStore.getState().setPersona(persona)
    renderModule()
    if (persona) {
      expect(useModuleStore.getState().modules[manifest.id]?.activeLearnPath).toBe(NETWORK_PATH)
    } else {
      expect(useModuleStore.getState().modules[manifest.id]?.activeLearnPath).toBeUndefined()
    }
    openTab('Exercises')
    expect(scenarioHeadings()).toEqual(SCENARIO_TITLES.map((t, i) => `${i + 1}. ${t}`))
    expect(
      screen.getByText(/Six real-world PQC testing scenarios — each designed to reveal a key/)
    ).toBeInTheDocument()
    openTab('Tools & Products')
    for (const shown of getMigrateItemsForModule(manifest.id)) {
      // a product on two infrastructure layers is listed under both
      expect(screen.getAllByText(shown.softwareName).length).toBeGreaterThan(0)
    }
  })
})

describe('Testing & Validation - tools on the certification route', () => {
  const items = getMigrateItemsForModule(manifest.id)

  it('every product named for a route exists in the catalog for this lesson', () => {
    const ids = new Set(items.map((i) => i.productId))
    for (const [route, productIds] of TOOLS_ON_PATH) {
      expect(productIds.length, route).toBeGreaterThan(0)
      for (const id of productIds) expect(ids.has(id), `${route}: ${id}`).toBe(true)
    }
  })

  it('keeps exactly the named products on the certification route and all of them elsewhere', () => {
    const onCert = items.filter((i) => toolOnPath(i, CERTIFICATION_PATH)).map((i) => i.productId)
    expect(onCert).toEqual(['keysight-inspector'])
    expect(items.filter((i) => toolOnPath(i, NETWORK_PATH))).toHaveLength(items.length)
    expect(items.filter((i) => toolOnPath(i, undefined))).toHaveLength(items.length)
  })

  it('the route-tagged scenarios match the manifest routes', () => {
    expect(manifest.learnPaths?.map((p) => p.id)).toEqual([NETWORK_PATH, CERTIFICATION_PATH])
  })
})

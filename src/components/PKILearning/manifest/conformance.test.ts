// SPDX-License-Identifier: GPL-3.0-only
/**
 * A1 conformance — every co-located manifest must reproduce the legacy
 * moduleData.ts maps exactly — for all 60 catalog modules. The final assertion
 * (manifest id set === catalog id set) guards that none is missed or added.
 */
import { describe, it, expect } from 'vitest'
import { MANIFESTS } from './registry'
import { deriveCatalogEntry, deriveStepCount } from './derive'
import {
  MODULE_CATALOG,
  MODULE_STEP_COUNTS,
  LEARN_SECTIONS,
  WORKSHOP_STEPS,
  MODULE_TO_TRACK,
  MODULE_TRACKS,
} from '../moduleData'
import { MODULE_PLAYGROUND_TOOL, MODULE_TAXONOMY } from '../moduleEnrichment'
import { SIM_LEARN_MODULES } from '../simEmbedModules'

// Enrichment keys that are intentionally NOT learn modules (Playground-tool
// taxonomy aliases). Anything else in the enrichment maps must own a module.
const ENRICHMENT_EXEMPT = new Set(['hybrid-certs'])

describe('module manifest conformance (A1)', () => {
  it('discovers at least the seeded manifests', () => {
    expect(MANIFESTS.length).toBeGreaterThan(0)
  })

  it('every present manifest reproduces its legacy map entries', () => {
    for (const m of MANIFESTS) {
      expect(deriveCatalogEntry(m), `catalog: ${m.id}`).toEqual(MODULE_CATALOG[m.id])
      expect(deriveStepCount(m), `stepCount: ${m.id}`).toBe(MODULE_STEP_COUNTS[m.id])
      expect(m.learnSections, `learnSections: ${m.id}`).toEqual(LEARN_SECTIONS[m.id])
      expect(m.workshopSteps, `workshopSteps: ${m.id}`).toEqual(WORKSHOP_STEPS[m.id])
      expect(m.track, `track: ${m.id}`).toEqual(MODULE_TO_TRACK[m.id])
      expect(m.playgroundTool, `playgroundTool: ${m.id}`).toEqual(MODULE_PLAYGROUND_TOOL[m.id])
      expect(m.taxonomy, `taxonomy: ${m.id}`).toEqual(MODULE_TAXONOMY[m.id])
      expect(m.embeddable ?? false, `embeddable: ${m.id}`).toBe(m.id in SIM_LEARN_MODULES)
    }
  })

  // trackOrder is NOT captured by MODULE_TO_TRACK (name only) — intra-track order
  // lives in the MODULE_TRACKS arrays. Assert each present manifest sits at the
  // exact index its trackOrder claims, so a mis-ordered manifest can't conform.
  it('every present manifest sits at the right position in its track', () => {
    for (const m of MANIFESTS) {
      if (!m.track) continue
      const track = MODULE_TRACKS.find((t) => t.track === m.track)
      expect(track, `track exists: ${m.id}`).toBeDefined()
      const idx = track!.modules.findIndex((x) => x.id === m.id)
      expect(idx, `${m.id} position in "${m.track}"`).toBe(m.trackOrder)
    }
  })

  // Reverse coverage: every enrichment-map key must own a real catalog module
  // (or be explicitly exempt) — catches orphan keys like the non-module
  // 'hybrid-certs' taxonomy alias before the fan-out relies on them.
  it('every enrichment key maps to a catalog module or is exempt', () => {
    const keys = new Set([...Object.keys(MODULE_PLAYGROUND_TOOL), ...Object.keys(MODULE_TAXONOMY)])
    for (const id of keys) {
      if (ENRICHMENT_EXEMPT.has(id)) continue
      expect(MODULE_CATALOG[id], `enrichment key "${id}" owns a catalog module`).toBeDefined()
    }
  })

  // NOTE on tabs/custom: tab sets are hand-written per module index.tsx, not in a
  // central legacy map — so they can't be conformance-checked here. They are
  // verified at A2 as render-parity when each module adopts <ModuleShell>.

  // The manifest set must be exactly the catalog id set — no module missed, none
  // silently added (the 3 orphan folders and synthetic 'assess' stay excluded).
  it('manifest set equals the full catalog', () => {
    expect(MANIFESTS.map((m) => m.id).sort()).toEqual(Object.keys(MODULE_CATALOG).sort())
  })
})

// SPDX-License-Identifier: GPL-3.0-only
/**
 * Cut-over guard — every legacy moduleData/moduleEnrichment map is rebuilt from
 * the manifest collection, byte-for-byte, checked against a FROZEN golden
 * snapshot of the original hand-written maps. This survives the cut-over that
 * replaces those literals with these builders (the live maps then ARE the
 * builders, so comparing to the frozen golden is what keeps the guard honest).
 */
import { describe, it, expect } from 'vitest'
import { MANIFESTS } from './registry'
import {
  buildCatalog,
  buildStepCounts,
  buildLearnSections,
  buildWorkshopSteps,
  buildModuleTracks,
  buildPlaygroundTools,
  buildTaxonomy,
} from './derive'
import golden from './__golden__/legacyMaps.golden.json'

describe('cut-over: manifests rebuild every legacy map (vs frozen golden)', () => {
  it('MODULE_CATALOG', () => expect(buildCatalog(MANIFESTS)).toEqual(golden.MODULE_CATALOG))
  it('MODULE_STEP_COUNTS', () =>
    expect(buildStepCounts(MANIFESTS)).toEqual(golden.MODULE_STEP_COUNTS))
  it('LEARN_SECTIONS', () => expect(buildLearnSections(MANIFESTS)).toEqual(golden.LEARN_SECTIONS))
  it('WORKSHOP_STEPS', () => expect(buildWorkshopSteps(MANIFESTS)).toEqual(golden.WORKSHOP_STEPS))
  it('MODULE_TRACKS', () => expect(buildModuleTracks(MANIFESTS)).toEqual(golden.MODULE_TRACKS))
  it('MODULE_PLAYGROUND_TOOL', () =>
    expect(buildPlaygroundTools(MANIFESTS)).toEqual(golden.MODULE_PLAYGROUND_TOOL))
  it('MODULE_TAXONOMY', () => expect(buildTaxonomy(MANIFESTS)).toEqual(golden.MODULE_TAXONOMY))
})

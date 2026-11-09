// SPDX-License-Identifier: AGPL-3.0-only
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

const historicalCryptoMgmtDescription =
  'Build a modern cryptographic posture management program across certificates, libraries, software, and keys — iterative and ROI-positive even if quantum never arrives.'
const reviewedCryptoMgmtDescription =
  'Build a modern cryptographic posture management program across certificates, libraries, software, and keys — iterative, with a business case tested against explicit costs, benefits and uncertainty.'

describe('cut-over: manifests rebuild every legacy map (vs frozen golden)', () => {
  it('MODULE_CATALOG', () => {
    // Retain the historical snapshot; only the reviewed conditional business-case
    // description changes. All other catalogue fields remain guarded exactly.
    const original = golden.MODULE_CATALOG['crypto-mgmt-modernization']
    expect(original.description).toBe(historicalCryptoMgmtDescription)
    expect(buildCatalog(MANIFESTS)).toEqual({
      ...golden.MODULE_CATALOG,
      'crypto-mgmt-modernization': { ...original, description: reviewedCryptoMgmtDescription },
    })
  })
  it('MODULE_STEP_COUNTS', () =>
    expect(buildStepCounts(MANIFESTS)).toEqual(golden.MODULE_STEP_COUNTS))
  it('LEARN_SECTIONS', () => expect(buildLearnSections(MANIFESTS)).toEqual(golden.LEARN_SECTIONS))
  it('WORKSHOP_STEPS', () => {
    // Keep the historical cut-over snapshot intact. These two reviewed labels
    // now describe the operations actually demonstrated; IDs/order stay fixed.
    const enrollment = golden.WORKSHOP_STEPS['pki-enrollment-protocols']
    expect(enrollment.find((step) => step.id === 'cmp-kur')?.label).toBe(
      'CMP Key Update with ML-KEM'
    )
    expect(enrollment.find((step) => step.id === 'composite')?.label).toBe(
      'Composite Enrollment (draft)'
    )
    const expected = {
      ...golden.WORKSHOP_STEPS,
      'pki-enrollment-protocols': enrollment.map((step) => {
        if (step.id === 'cmp-kur') return { ...step, label: 'CMP enrollment and ML-KEM round trip' }
        if (step.id === 'composite') return { ...step, label: 'Parallel certificate issuance' }
        return step
      }),
    }
    expect(buildWorkshopSteps(MANIFESTS)).toEqual(expected)
  })
  it('MODULE_TRACKS', () => {
    const expected = golden.MODULE_TRACKS.map((track) => ({
      ...track,
      modules: track.modules.map((module) => {
        if (module.id !== 'crypto-mgmt-modernization') return module
        expect(module.description).toBe(historicalCryptoMgmtDescription)
        return { ...module, description: reviewedCryptoMgmtDescription }
      }),
    }))
    expect(buildModuleTracks(MANIFESTS)).toEqual(expected)
  })
  it('MODULE_PLAYGROUND_TOOL', () =>
    expect(buildPlaygroundTools(MANIFESTS)).toEqual(golden.MODULE_PLAYGROUND_TOOL))
  it('MODULE_TAXONOMY', () => expect(buildTaxonomy(MANIFESTS)).toEqual(golden.MODULE_TAXONOMY))
})

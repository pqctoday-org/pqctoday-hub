// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  VERIFICATION_LAYERS,
  COLLAPSE_SCENARIO_LABELS,
  MODEL_COLLAPSE_CURVES,
} from './dataAuthenticityData'

const layer = (id: string) => VERIFICATION_LAYERS.find((l) => l.id === id)!

describe('signature validity is not a synthetic-data detector or a quality guarantee', () => {
  it('says content credentials are neither a detector nor a quality score', () => {
    const c2pa = layer('c2pa-credentials')
    expect(c2pa.accuracy).toMatch(/Not a synthetic-data detector and not a quality score/)
    expect(c2pa.accuracy).not.toMatch(/100%/)
    expect(c2pa.accuracy).not.toMatch(/0% for unsigned/)
  })

  it('separates signature validity, signer trust, claimed origin and quality', () => {
    const text = layer('c2pa-credentials').accuracy
    expect(text).toMatch(/Signature validity is a yes\/no check/)
    expect(text).toMatch(/signer is trusted/)
    expect(text).toMatch(/what the signed claims say about origin/)
    expect(text).toMatch(/whether the content is good/)
  })

  it('gives a validly signed synthetic item as the counterexample', () => {
    const text = layer('c2pa-credentials').description
    expect(text).toMatch(/generative-AI video whose manifest declares it AI-generated/)
    expect(text).toMatch(/can carry a perfectly valid signature/)
    expect(text).toMatch(/does not mean the content is human-made/)
  })

  it('offers no layer an accuracy guarantee, and labels every percentage as illustrative', () => {
    for (const l of VERIFICATION_LAYERS) {
      expect(l.accuracy).not.toMatch(/\b100%/)
      if (/\d+\s*[–-]\s*\d+%|<\s*\d+%|under \d+%/.test(l.accuracy)) {
        expect(l.accuracy).toMatch(/^Illustrative \(fictional\)/)
      }
      expect(l.performanceOverhead).toMatch(/^Illustrative estimate/)
    }
  })

  it('does not describe tamper evidence as proof that the logged data is genuine or good', () => {
    const text = layer('provenance-chain').accuracy
    expect(text).toMatch(/cannot tell whether the first entry was honest/)
    expect(text).toMatch(/whether the data is good/)
  })
})

describe('model-collapse scores', () => {
  it('labels every scenario row as fictional scores', () => {
    const labels = new Map(Object.entries(COLLAPSE_SCENARIO_LABELS))
    for (const key of Object.keys(MODEL_COLLAPSE_CURVES)) {
      expect(labels.get(key)?.label).toMatch(/\(fictional scores\)/)
    }
  })

  it('does not name the third scenario as if cryptographic provenance by itself prevents collapse', () => {
    expect(COLLAPSE_SCENARIO_LABELS['provenance-verified'].label).toMatch(/Selection/)
    expect(COLLAPSE_SCENARIO_LABELS['provenance-verified'].label).not.toMatch(
      /^Cryptographic Provenance$/
    )
  })
})

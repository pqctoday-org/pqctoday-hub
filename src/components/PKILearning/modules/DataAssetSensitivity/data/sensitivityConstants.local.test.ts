// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  CLASSIFICATION_SCENARIOS,
  CONFLICT_SCENARIOS,
  DEFAULT_ASSETS,
  DEFAULT_SCORING_WEIGHTS,
  PQC_ALGORITHM_MAP,
  getPqcRecommendation,
  PROTOCOL_SUPPORT_NOTE,
  scoreAsset,
  type AssetType,
  type SensitivityTier,
} from './sensitivityConstants'

const TIERS: SensitivityTier[] = ['low', 'medium', 'high', 'critical']
const TYPES: AssetType[] = [
  'data-store',
  'key-material',
  'communication',
  'credential',
  'code-artifact',
]

describe('algorithm recommendation respects the suite that applies to the asset', () => {
  it('never recommends anything outside CNSA 2.0 for an asset flagged CNSA-2.0', () => {
    const outside: string[] = []
    for (const tier of TIERS) {
      for (const type of TYPES) {
        const rec = getPqcRecommendation(tier, type, ['CNSA-2.0'])
        if (rec.kem !== null && !rec.kem.startsWith('ML-KEM-1024'))
          outside.push(`${tier}/${type}: ${rec.kem}`)
        if (rec.signature !== null && !rec.signature.startsWith('ML-DSA-87'))
          outside.push(`${tier}/${type}: ${rec.signature}`)
      }
    }
    expect(outside).toEqual([])
  })

  it('gives the sample CNSA-scoped root CA ML-DSA-87, not a hash-based set outside CNSA', () => {
    const rootCa = DEFAULT_ASSETS.find((a) => a.assetType === 'key-material')!
    expect(rootCa.complianceFlags).toContain('CNSA-2.0')
    const scored = scoreAsset(rootCa, DEFAULT_SCORING_WEIGHTS)
    expect(scored.pqcRecommendation.signature).toBe('ML-DSA-87 (FIPS 204)')
    expect(scored.pqcRecommendation.signature).not.toMatch(/SLH-DSA/)
  })

  it('keeps the conservative hash-based option for assets with no CNSA scope', () => {
    const rec = getPqcRecommendation('critical', 'key-material', ['FIPS-140-3'])
    const base = PQC_ALGORITHM_MAP.critical['key-material']
    expect(rec.kem).toBe(base.kem)
    expect(rec.signature).toBe(base.signature)
    expect(rec.hybrid).toBe(base.hybrid)
    expect(rec.signature).toMatch(/SLH-DSA/)
    expect(rec.rationale).toMatch(/outside CNSA 2\.0/)
  })

  it('tells the learner to check protocol, library and HSM support for every suggestion', () => {
    for (const tier of TIERS) {
      for (const type of TYPES) {
        for (const flags of [[], ['CNSA-2.0']]) {
          const rec = getPqcRecommendation(tier, type, flags)
          expect(rec.rationale).toContain(PROTOCOL_SUPPORT_NOTE)
          expect(rec.rationale.split(PROTOCOL_SUPPORT_NOTE)).toHaveLength(2)
        }
      }
    }
    expect(PROTOCOL_SUPPORT_NOTE).toMatch(/protocol, library and HSM support/)
  })
})

describe('sample classification scenarios keep storage, confidentiality and credential facts apart', () => {
  const all = (id: string) => {
    const s = CLASSIFICATION_SCENARIOS.find((c) => c.id === id)!
    return `${s.description} ${s.context} ${s.explanation} ${s.hndlImplication} ${s.commonMistake}`
  }

  it('labels the seven-year payment horizon as a sample, not a PCI DSS period', () => {
    const text = all('cls-05')
    expect(text).toMatch(/sample/i)
    expect(text).toMatch(/does not set a retention period/)
    expect(text).not.toMatch(/7-year retention requirement/)
    expect(text).not.toMatch(/PCI DSS Level 1/)
  })

  it('does not treat local expiry, rotation or deletion as the end of exposure', () => {
    const claims =
      /immune to HNDL|worthless before CRQC|expire long before CRQC|no HNDL risk|replaced faster than any adversary|HNDL risk is negligible/i
    const offenders = CLASSIFICATION_SCENARIOS.filter((s) => claims.test(all(s.id))).map(
      (s) => s.id
    )
    expect(offenders).toEqual([])
  })

  it('does not infer that data was harvested from a date calculation', () => {
    const claims =
      /already in the HNDL window|already at HNDL risk|already in adversary archives|ceremony from the past \d+ years is exposed|window has already opened/i
    const offenders = CLASSIFICATION_SCENARIOS.filter((s) => claims.test(all(s.id))).map(
      (s) => s.id
    )
    expect(offenders).toEqual([])
  })

  it('frames the root CA as a future-forgery risk, not harvest-now-decrypt-later', () => {
    const s = CLASSIFICATION_SCENARIOS.find((c) => c.id === 'cls-03')!
    expect(s.explanation).toMatch(/forgery/)
    expect(s.hndlImplication).toMatch(/^Not a harvest-now-decrypt-later case/)
    expect(s.commonMistake).not.toMatch(/network-transmitted usage/)
  })

  it('states that certificate rotation says nothing about recorded session confidentiality', () => {
    const s = CLASSIFICATION_SCENARIOS.find((c) => c.id === 'cls-09')!
    expect(s.hndlImplication).toMatch(/recorded sessions/)
    expect(s.explanation).toMatch(/ECDHE is itself quantum-vulnerable/)
  })

  it('computes sample threshold years the right way round for retained records', () => {
    // Records captured in year c and kept for N years are still held at CRQC year C when c + N >= C,
    // so with C = 2034 and N = 7 only records captured from 2027 on are in scope; 2026 records are gone by 2033.
    const s = CLASSIFICATION_SCENARIOS.find((c) => c.id === 'cls-05')!
    expect(s.hndlImplication).toMatch(/2034 − 7 = 2027/)
    expect(s.hndlImplication).toMatch(/captured today \(2026\) would be deleted in 2033/)
  })
})

describe('regulatory applicability is stated before obligations are assigned', () => {
  it('does not present GDPR explicit consent as a requirement for every use', () => {
    const s = CONFLICT_SCENARIOS.find((c) => c.id === 'con-01')!
    expect(s.explanation).not.toMatch(/explicit consent for each use/)
    expect(s.explanation).toMatch(/Art\. 6 lawful basis/)
    expect(s.explanation).toMatch(/Art\. 9\(2\) condition/)
    expect(s.explanation).toMatch(/Consent is one possible basis/)
  })

  it('names the territorial trigger wherever a scenario applies GDPR', () => {
    const missing = CONFLICT_SCENARIOS.filter((s) =>
      s.conflictingRequirements.some((r) => r.framework.startsWith('GDPR'))
    )
      .filter((s) => !/Art\. 3\(2\)/.test(s.assetDescription))
      .map((s) => s.id)
    expect(missing).toEqual([])
    const sampleAssets = DEFAULT_ASSETS.filter((a) => a.complianceFlags.includes('GDPR'))
    expect(sampleAssets.length).toBeGreaterThan(0)
    for (const a of sampleAssets) expect(a.notes).toMatch(/Art\. 3\(2\)\(a\)/)
  })

  it('does not credit a law with a tier it does not define', () => {
    for (const s of CONFLICT_SCENARIOS) {
      for (const r of s.conflictingRequirements) {
        expect(r.frameworkSays).not.toMatch(
          /classifies .* as (low|medium|high) (risk|sensitivity)/i
        )
        expect(r.frameworkSays).not.toMatch(/\bmust be treated as High\b/)
      }
    }
  })
})

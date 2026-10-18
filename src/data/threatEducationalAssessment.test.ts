// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { threatsData, type ThreatData } from './threatsData'
import {
  candidateResponseMaturity,
  CANDIDATE_RESPONSE_MATURITY,
  sitePriorityRationale,
} from './threatEducationalAssessment'

describe('Threat educational assessments', () => {
  it('provides every published row an explicit, bounded priority rationale', () => {
    for (const threat of threatsData) {
      const rationale = sitePriorityRationale(threat)
      expect(rationale, threat.threatId).toContain(threat.criticality)
      expect(rationale, threat.threatId).toContain('PQC Today editorial triage label')
      expect(rationale, threat.threatId).toContain('does not measure likelihood')
    }
  })

  it('classifies every candidate response into the conservative maturity vocabulary', () => {
    for (const threat of threatsData) {
      expect(CANDIDATE_RESPONSE_MATURITY, threat.threatId).toContain(
        candidateResponseMaturity(threat)
      )
    }
  })

  it('does not equate standardized components with a standardized deployment pattern', () => {
    const fixture = {
      threatId: 'fixture',
      pqcReplacement: 'Use ML-KEM-768 with ML-DSA-65',
    } as ThreatData
    expect(candidateResponseMaturity(fixture)).toBe(
      'standardized components; deployment pattern unverified'
    )
  })
})

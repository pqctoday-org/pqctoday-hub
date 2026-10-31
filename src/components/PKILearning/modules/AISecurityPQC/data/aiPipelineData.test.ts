// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { AI_PIPELINE_PROFILES } from './aiPipelineData'

// Harvest now, decrypt later concerns encrypted data (NIST IR 8547); the algorithm used for
// authentication "may be transitioned at a different time". A signing, hashing or attestation
// stage is quantum-vulnerable or not, but is never an HNDL exposure.
describe('AI pipeline HNDL flags', () => {
  const stages = AI_PIPELINE_PROFILES.flatMap((p) => p.stages)

  it('flags no sign, hash or attest stage as HNDL-exposed', () => {
    const wrong = stages
      .filter((s) => ['sign', 'hash', 'attest'].includes(s.operation) && s.hndlExposure)
      .map((s) => s.id)
    expect(wrong).toEqual([])
  })

  it('counts 3 HNDL-exposed stages of 7 in the LLM pre-training pipeline (exercise 1)', () => {
    const llm = AI_PIPELINE_PROFILES.find((p) => p.id === 'llm-training')
    expect(llm?.stages).toHaveLength(7)
    expect(
      llm?.stages
        .filter((s) => s.hndlExposure)
        .map((s) => s.operation)
        .sort()
    ).toEqual(['encrypt', 'encrypt', 'key-wrap'])
  })
})

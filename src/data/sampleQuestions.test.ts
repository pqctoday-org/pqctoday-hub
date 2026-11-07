// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { SAMPLE_QUESTIONS } from './sampleQuestions'
import { PERSONAS } from './learningPersonas'
import { ALWAYS_VISIBLE_PATHS } from './personaConfig'
import { LEGACY_ORDER } from '../components/Assess/redesign/assessFlowModel'

const all = Object.values(SAMPLE_QUESTIONS).flat()
const find = (re: RegExp) => all.filter((q) => re.test(q))

describe('suggested Assistant questions', () => {
  it('are non-empty questions', () => {
    expect(all.length).toBeGreaterThan(100)
    for (const q of all) expect(q, q).toMatch(/\?$/)
  })

  it('take counts from the registries they count', () => {
    const starting = (prefix: string) => all.filter((q) => q.startsWith(prefix))
    expect(starting(`What ${Object.keys(PERSONAS).length} persona types`)).toHaveLength(1)
    expect(starting(`Which ${ALWAYS_VISIBLE_PATHS.length} navigation paths`)).toHaveLength(1)
    expect(starting(`What are the ${LEGACY_ORDER.length} steps of the comprehensive`)).toHaveLength(
      1
    )
    // Counts that used to be typed and went stale are gone.
    expect(find(/five persona types/i)).toEqual([])
    expect(find(/the 14 steps/i)).toEqual([])
    expect(find(/the 73 learning modules/i)).toEqual([])
    expect(find(/four FIPS standards published/i)).toEqual([])
    expect(find(/seven (journey steps|phases)/i)).toEqual([])
  })

  it('ask whether and where a requirement exists instead of assuming one', () => {
    expect(find(/How does eIDAS 2\.0 mandate PQC/)).toEqual([])
    expect(find(/EUDI Wallet and what PQC algorithms does it require/)).toEqual([])
    expect(find(/When must ANSSI-qualified/)).toEqual([])
    expect(find(/Why does ANSSI require hybrid/)).toEqual([])
    expect(find(/expected to mandate PQC/)).toEqual([])
    expect(find(/What industry regulation covers payment card PQC requirements/)).toEqual([])
    expect(find(/^Does eIDAS 2\.0 (set|require)/).length).toBe(2)
    expect(find(/is that a legal requirement\?$/).length).toBeGreaterThan(0)
  })

  it('treat harvest-now-decrypt-later (confidentiality) and signature forgery as different risks', () => {
    // A signature does not hide anything, so a signed object has a forgery question, not an HNDL one.
    expect(find(/HNDL risk for .*signed/i)).toEqual([])
    expect(find(/signature-forgery risk for .*signed/i).length).toBeGreaterThanOrEqual(2)
    expect(
      find(/signed today.*(harvest-now-decrypt-later \(confidentiality\)).*signature forgery/)
        .length
    ).toBe(1)
  })

  it('name the document behind a maturity or status question, and drop the unsupported premium claim', () => {
    expect(find(/IETF draft defines hybrid key exchange/)).toEqual([])
    expect(find(/RFC 10024 specify for hybrid key exchange/).length).toBe(1)
    expect(find(/insurance premium reduction/i)).toEqual([])
    expect(find(/exclusive phase deadline for all classical algorithms/i)).toEqual([])
    expect(find(/mature PQC library support in 2025/i)).toEqual([])
  })
})

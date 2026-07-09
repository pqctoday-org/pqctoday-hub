// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  EXAMPLE_REPORT_SHARE_PAYLOAD,
  EXAMPLE_REPORT_RESULT,
  EXAMPLE_REPORT_SHARE_TOKEN,
} from './exampleReport'
import { decodeShareToken } from '@/utils/reportShareToken'
import {
  AVAILABLE_INDUSTRIES,
  AVAILABLE_ALGORITHMS,
  AVAILABLE_COMPLIANCE,
} from '@/hooks/assessmentData'
import { REGION_COUNTRIES_MAP } from '@/data/personaConfig'

// ACCURACY-0708-2: the example report is now a real `computeAssessment`
// snapshot embedded in a v2 share token (see exampleReport.ts), not partial
// inputs recomputed at decode time. This guard still checks the source
// fixture uses canonical assess-wizard vocabulary — so the fictional example
// reads the way a real quick-track user's report would — and additionally
// checks the token round-trips to the exact snapshot, and that it renders as
// a quick-track (not comprehensive) assessment, since the fixture only sets
// quick-track fields.
const VALID_SENSITIVITIES = new Set(['low', 'medium', 'high', 'critical'])
const VALID_MIGRATIONS = new Set(['started', 'planning', 'not-started', 'unknown'])
const VALID_COUNTRIES = new Set(Object.values(REGION_COUNTRIES_MAP).flat())

describe('EXAMPLE_REPORT_SHARE_PAYLOAD — fixture uses canonical vocabulary', () => {
  it('industry is canonical', () => {
    expect(AVAILABLE_INDUSTRIES).toContain(EXAMPLE_REPORT_SHARE_PAYLOAD.industry)
  })

  it('country is canonical', () => {
    expect(VALID_COUNTRIES.has(EXAMPLE_REPORT_SHARE_PAYLOAD.country ?? '')).toBe(true)
  })

  it('every algorithm is canonical', () => {
    for (const a of EXAMPLE_REPORT_SHARE_PAYLOAD.currentCrypto) {
      expect(AVAILABLE_ALGORITHMS, `algorithm "${a}"`).toContain(a)
    }
  })

  it('every sensitivity level is valid', () => {
    for (const s of EXAMPLE_REPORT_SHARE_PAYLOAD.dataSensitivity) {
      expect(VALID_SENSITIVITIES.has(s), `sensitivity "${s}"`).toBe(true)
    }
  })

  it('every compliance framework is canonical', () => {
    for (const f of EXAMPLE_REPORT_SHARE_PAYLOAD.complianceRequirements) {
      expect(AVAILABLE_COMPLIANCE, `compliance "${f}"`).toContain(f)
    }
  })

  it('migration status is valid', () => {
    expect(VALID_MIGRATIONS.has(EXAMPLE_REPORT_SHARE_PAYLOAD.migrationStatus)).toBe(true)
  })
})

describe('EXAMPLE_REPORT_SHARE_TOKEN — v2 snapshot round-trips exactly', () => {
  it('is a quick-track result (fixture only sets quick-track fields)', () => {
    expect(EXAMPLE_REPORT_RESULT.assessmentProfile?.mode).toBe('quick')
  })

  it('decodes back to the exact same result the fixture computed', () => {
    const schema = decodeShareToken(EXAMPLE_REPORT_SHARE_TOKEN)
    expect(schema?.v).toBe(2)
    if (schema?.v !== 2) throw new Error('expected v2 schema')
    expect(schema.result).toEqual(EXAMPLE_REPORT_RESULT)
    expect(schema.persona).toBe('curious')
  })
})

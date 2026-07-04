// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { EXAMPLE_REPORT_SHARE_PAYLOAD } from './exampleReport'
import {
  AVAILABLE_INDUSTRIES,
  AVAILABLE_ALGORITHMS,
  AVAILABLE_COMPLIANCE,
} from '@/hooks/assessmentData'
import { REGION_COUNTRIES_MAP } from '@/data/personaConfig'

// The curious-persona "see an example report" link hydrates <ReportView> from
// this payload. ReportView filters every field against these exact sets; any
// token not present is silently dropped and the example renders near-empty.
// This guard fails loudly if the fixture drifts from the canonical vocabulary.
const VALID_SENSITIVITIES = new Set(['low', 'medium', 'high', 'critical'])
const VALID_MIGRATIONS = new Set(['started', 'planning', 'not-started', 'unknown'])
const VALID_COUNTRIES = new Set(Object.values(REGION_COUNTRIES_MAP).flat())

describe('EXAMPLE_REPORT_SHARE_PAYLOAD — tokens survive hydration validators', () => {
  it('industry is canonical', () => {
    expect(AVAILABLE_INDUSTRIES).toContain(EXAMPLE_REPORT_SHARE_PAYLOAD.industry)
  })

  it('country is canonical', () => {
    expect(VALID_COUNTRIES.has(EXAMPLE_REPORT_SHARE_PAYLOAD.country)).toBe(true)
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

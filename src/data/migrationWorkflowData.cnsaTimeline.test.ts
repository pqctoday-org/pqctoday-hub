// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'

vi.mock('./migrateData', () => ({ softwareData: [] }))

import { MIGRATION_STEPS, MIGRATION_REFERENCES } from './migrationWorkflowData'

const nsaTimelines = MIGRATION_STEPS.filter((s) => s.nsaTimeline).map((s) => s.nsaTimeline ?? '')

describe('migration steps: NSA CNSA 2.0 timeline', () => {
  it('shows the CNSSP 15 dates of 1 January 2027, 31 December 2030 and 31 December 2031', () => {
    const joined = nsaTimelines.join(' | ')
    expect(joined).toMatch(/1 January 2027/)
    expect(joined).toMatch(/31 December 2030/)
    expect(joined).toMatch(/31 December 2031/)
  })

  it('scopes every NSA timeline entry to national security systems', () => {
    expect(nsaTimelines.length).toBeGreaterThanOrEqual(4)
    for (const t of nsaTimelines) expect(t).toMatch(/national security systems only/i)
  })

  it('does not present the 2022 per-equipment schedule as the current one', () => {
    const joined = nsaTimelines.join(' | ')
    // the old wording preferred CNSA 2.0 by equipment type in 2025-2027 and made it exclusive in 2030/2033
    expect(joined).not.toMatch(/Prefer CNSA 2\.0 for (firmware|operating|niche|networking)/i)
    expect(joined).not.toMatch(/exclusive for (web\/cloud|networking)/i)
    // any mention of the 2033 date must be labelled as earlier planning context
    for (const t of nsaTimelines.filter((x) => /2033/.test(x))) {
      expect(t).toMatch(/earlier planning context/i)
    }
  })

  it('does not map the framework rows to equipment-type dates', () => {
    const mappings = MIGRATION_STEPS.flatMap((s) => s.frameworks)
      .filter((f) => f.source === 'NSA CNSA 2.0')
      .map((f) => f.mapping)
    expect(mappings.length).toBeGreaterThanOrEqual(4)
    for (const m of mappings) {
      expect(m).toMatch(/^NSS only/)
      expect(m).not.toMatch(/by equipment type|networking\/firmware|code signing acquisitions/i)
    }
  })

  it('cites the FAQ that carries the CNSSP 15 dates next to the 2022 advisory', () => {
    const names = MIGRATION_REFERENCES.map((r) => r.name)
    expect(names).toContain('CNSA 2.0 FAQ')
    const advisory = MIGRATION_REFERENCES.find((r) => r.name === 'CNSA 2.0')
    expect(advisory?.description).toMatch(/earlier planning context/i)
  })
})

// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { migrateSimulationState, renameUkJurisdiction } from './useSimulationStore'

describe('the United Kingdom jurisdiction code', () => {
  it('renames a saved UK run to GB, in the country and the jurisdictions played', () => {
    const out = renameUkJurisdiction({ country: 'UK', simJurisdictionsPlayed: ['US', 'UK', 'GB'] })
    expect(out.country).toBe('GB')
    expect(out.simJurisdictionsPlayed).toEqual(['US', 'GB'])
  })

  it('leaves other countries and missing fields alone', () => {
    expect(renameUkJurisdiction({ country: 'DE' }).country).toBe('DE')
    const empty: { country?: unknown } = {}
    expect(renameUkJurisdiction(empty).country).toBeUndefined()
  })

  it('migrates an old persisted UK country to GB', () => {
    expect(migrateSimulationState({ country: 'UK' }).country).toBe('GB')
  })
})

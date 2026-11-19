// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { KPI_DIMENSIONS, STAKEHOLDER_ROLES } from './migrationProgramData'

describe('Migration Program sample KPI targets', () => {
  it('labels every preset threshold as an example rather than a compliance criterion', () => {
    expect(KPI_DIMENSIONS).toHaveLength(6)
    expect(
      KPI_DIMENSIONS.every(({ targetThreshold }) => targetThreshold.startsWith('Example target:'))
    ).toBe(true)
  })

  it('labels the preset budget escalation threshold as an example', () => {
    const boardRole = STAKEHOLDER_ROLES.find(({ id }) => id === 'board')
    expect(boardRole?.escalationTrigger).toMatch(/^Example trigger:/)
  })
})

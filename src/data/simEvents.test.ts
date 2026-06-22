// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { SIM_EVENT_POOL, fillEvent } from './simEvents'

describe('simEvents', () => {
  it('has a non-empty pool for every severity', () => {
    for (const sev of ['danger', 'warning', 'success', 'info'] as const) {
      expect(SIM_EVENT_POOL[sev].length, `${sev}`).toBeGreaterThan(0)
    }
  })

  it('substitutes {sector} (lowercased) and {country} tokens', () => {
    expect(fillEvent('{sector} records exposed', 'Healthcare', 'DE')).toBe(
      'healthcare records exposed'
    )
    expect(fillEvent('{country} regulator audit', 'Healthcare', 'DE')).toBe('DE regulator audit')
  })
})

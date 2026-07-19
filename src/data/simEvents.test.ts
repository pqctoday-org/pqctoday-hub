// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { SIM_EVENT_POOL, fillEvent } from './simEvents'
import { libraryData } from './libraryData'
import { jurisdictionFor } from './jurisdiction'

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

  // Wave 1 item 2.5 (07192026) — the pool is now partly derived from real
  // library/jurisdiction data, not 100% hand-authored fiction.
  describe('derived content (2.5)', () => {
    it('substitutes {authority} with the real per-country regulator, DE -> BSI', () => {
      const rule = jurisdictionFor('DE')
      expect(rule?.authority).toBeTruthy()
      expect(fillEvent('{authority} audits {country}', 'Healthcare', 'DE')).toBe(
        `${rule!.authority} audits DE`
      )
    })

    it('falls back to a generic phrase for a country with no registered jurisdiction rule', () => {
      expect(fillEvent('{authority} audits {country}', 'Healthcare', 'ZZ-NOT-REAL')).toBe(
        'the regulator audits ZZ-NOT-REAL'
      )
    })

    it('the warning pool includes at least one real {authority}-templated event', () => {
      expect(SIM_EVENT_POOL.warning.some((t) => t.includes('{authority}'))).toBe(true)
    })

    it('every derived info-pool library event cites a title that is genuinely still in libraryData', () => {
      const titles = new Set(libraryData.map((i) => i.documentTitle))
      const derivedInfoEvents = SIM_EVENT_POOL.info.filter((t) => t.startsWith('NIST publishes "'))
      expect(derivedInfoEvents.length).toBeGreaterThan(0)
      for (const txt of derivedInfoEvents) {
        const m = txt.match(/^NIST publishes "(.+)" \(/)
        expect(m, txt).not.toBeNull()
        expect(titles.has(m![1]), `stale title in: ${txt}`).toBe(true)
      }
    })
  })
})

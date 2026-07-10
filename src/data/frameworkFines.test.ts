import { describe, it, expect } from 'vitest'
import {
  FRAMEWORK_MAX_FINE_USD_MILLIONS,
  KNOWN_INACTIVE_FINE_KEYS,
  getFrameworkMaxFine,
} from './frameworkFines'
import { complianceFrameworks } from './complianceData'

/**
 * Drift guard: the exposure-index KPI looks fines up by the compliance
 * framework's CSV `id`. A fine key that matches no *active* compliance id is
 * dead weight — it silently contributes $0 to the KPI. Every key must
 * therefore either match an active id or be documented in
 * KNOWN_INACTIVE_FINE_KEYS (frameworks with penalty data but no CSV row yet).
 */
describe('frameworkFines ↔ compliance CSV drift guard', () => {
  const activeIds = new Set(complianceFrameworks.map((f) => f.id))

  it('every fine key matches an active compliance id or is a documented exception', () => {
    const orphans = Object.keys(FRAMEWORK_MAX_FINE_USD_MILLIONS).filter(
      (key) => !activeIds.has(key) && !KNOWN_INACTIVE_FINE_KEYS.has(key)
    )
    expect(
      orphans,
      `Fine keys matching no active compliance id and not in KNOWN_INACTIVE_FINE_KEYS: ${orphans.join(', ')}. ` +
        'Rename the key to the active CSV id, or document it in KNOWN_INACTIVE_FINE_KEYS.'
    ).toEqual([])
  })

  it('documented exceptions are truly inactive (self-cleaning list)', () => {
    // If a CSV row is later added for one of these, the exception must be
    // removed so the fine starts counting toward the KPI.
    const stale = [...KNOWN_INACTIVE_FINE_KEYS].filter((key) => activeIds.has(key))
    expect(
      stale,
      `KNOWN_INACTIVE_FINE_KEYS now match active compliance ids — remove them from the exception list: ${stale.join(', ')}`
    ).toEqual([])
  })

  it('every documented exception actually has a fine entry', () => {
    const unused = [...KNOWN_INACTIVE_FINE_KEYS].filter(
      (key) => !(key in FRAMEWORK_MAX_FINE_USD_MILLIONS)
    )
    expect(unused).toEqual([])
  })

  it('CNSA-2 (the active CSV id) resolves to a non-zero exposure', () => {
    // Regression: the key used to be 'CNSA-2.0', which matches no compliance
    // id — the exec regulatory-exposure KPI counted $0 for CNSA 2.0.
    expect(getFrameworkMaxFine('CNSA-2')).toBeGreaterThan(0)
    expect(getFrameworkMaxFine('CNSA-2.0')).toBe(0)
  })

  it('renamed keys resolve via their active CSV ids', () => {
    for (const id of ['EIDAS', 'SOC-2', 'ISO-27001', 'DFS-NYCRR-500']) {
      expect(activeIds.has(id), `${id} expected active in compliance CSV`).toBe(true)
      expect(id in FRAMEWORK_MAX_FINE_USD_MILLIONS, `${id} expected in fines map`).toBe(true)
    }
  })

  it('unknown ids fall back to 0', () => {
    expect(getFrameworkMaxFine('NOT-A-FRAMEWORK')).toBe(0)
    expect(getFrameworkMaxFine('')).toBe(0)
  })
})

// SPDX-License-Identifier: GPL-3.0-only
// The error-path probe table (plan WS-G G-8 / G-2 / G-5) is data: these
// checks keep it honest without an engine — every kind cites a PKCS #11 v3.2
// section and says why no existing test covers it, the expansion follows the
// inventory (never hand-written), and the registry registers exactly the
// expansion.
import { describe, expect, it } from 'vitest'
import inventoryJson from '@/data/validation/mechanism-inventory.generated.json'
import { TEST_REGISTRY } from '@/data/validation/testRegistry'
import {
  ERROR_PATH_OPS,
  OP_SPECS,
  PROBE_KINDS,
  RECIPES,
  RV,
  expandErrorPathCases,
  probeCellsFor,
  unrecipedMechanisms,
  type InventoryMechLike,
} from './errorPathCatalog'

const inventories = Object.values(
  (
    inventoryJson as unknown as {
      engines: Record<string, { inventory: { mechanisms: InventoryMechLike[] } }>
    }
  ).engines
).map((e) => e.inventory.mechanisms)

describe('error-path probe catalog', () => {
  it('every expanded case cites a PKCS #11 v3.2 section, a CK_RV and a G-5 reason', () => {
    for (const c of expandErrorPathCases(inventories)) {
      const k = PROBE_KINDS.find((p) => p.id === c.kind)!
      expect(k.whyNotCovered.length).toBeGreaterThan(40)
      expect(k.citation(c.op), c.caseId).toMatch(/PKCS #11 v3\.2 §\d/)
      expect(k.citation(c.op), c.caseId).not.toMatch(/undefined/)
      expect(k.title(c.op), c.caseId).not.toMatch(/undefined/)
      expect(RV[k.expected(c.op)]).toBeTypeOf('number')
    }
  })

  it('has at least one invalid-state and one invalid-parameter kind for every operation family advertised', () => {
    const advertised = new Set(inventories.flat().flatMap((m) => m.requiredOperations))
    const cases = expandErrorPathCases(inventories)
    for (const op of ERROR_PATH_OPS) {
      if (!advertised.has(op)) continue
      const classes = new Set(
        cases
          .filter((c) => c.op === op)
          .map((c) => PROBE_KINDS.find((k) => k.id === c.kind)!.probeClass)
      )
      expect(classes.has('invalid-state'), `${op} invalid-state`).toBe(true)
      expect(classes.has('invalid-parameter'), `${op} invalid-parameter`).toBe(true)
    }
  })

  it('expands only advertised operations of mechanisms with a recipe, inside the reported key-size range', () => {
    const cases = expandErrorPathCases(inventories)
    for (const c of cases) {
      expect(RECIPES[c.mechanism], c.caseId).toBeDefined()
      const recs = inventories.flat().filter((m) => m.name === c.mechanism)
      expect(recs.some((m) => m.requiredOperations.includes(c.op))).toBe(true)
      for (const cell of c.cells)
        expect(
          recs.some((m) =>
            probeCellsFor(m, c.op).some(
              (p) => p.parameterSet === cell.parameterSet && p.variant === cell.variant
            )
          ),
          `${c.caseId} ${cell.parameterSet}/${cell.variant}`
        ).toBe(true)
    }
  })

  it('limits SLH-DSA to its two fast parameter sets (policy, stated in the catalog)', () => {
    const cells = expandErrorPathCases(inventories)
      .filter((c) => c.mechanism === 'CKM_SLH_DSA' && c.op === 'sign')
      .flatMap((c) => c.cells.map((x) => x.parameterSet))
    expect(new Set(cells)).toEqual(new Set(['SLH-DSA-SHA2-128f', 'SLH-DSA-SHAKE-128f']))
  })

  it('never asserts a key-handle or key-type code for C_DecapsulateKey, where §5.18.9 and §5.1.6 disagree', () => {
    const kinds = expandErrorPathCases(inventories)
      .filter((c) => c.op === 'decapsulate')
      .map((c) => c.kind)
    expect(kinds).not.toContain('key-handle-invalid')
    expect(kinds).not.toContain('key-type-inconsistent')
    expect(OP_SPECS.decapsulate.call).toBe('C_DecapsulateKey')
  })

  it('lists advertised mechanisms without a recipe instead of dropping them', () => {
    const missing = unrecipedMechanisms(inventories)
    expect(missing).toContain('CKM_HSS')
    for (const m of missing) expect(RECIPES[m]).toBeUndefined()
  })

  it('registers exactly the expansion (minus G-2 cases another test already drives)', () => {
    const registered = TEST_REGISTRY.filter((t) => t.runner === 'errorPathProbes').flatMap((t) =>
      t.cases.map((c) => c.caseId)
    )
    const all = expandErrorPathCases(inventories).map((c) => c.caseId)
    const nonExecutes = all.filter((id) => !id.includes('.executes/'))
    for (const id of nonExecutes) expect(registered).toContain(id)
    for (const id of registered) expect(all).toContain(id)
    expect(new Set(registered).size).toBe(registered.length)
  })
})

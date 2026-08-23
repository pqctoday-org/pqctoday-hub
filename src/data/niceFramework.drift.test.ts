// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  NICE_WORK_ROLES,
  NF_COMPETENCY_AREAS,
  CA_TO_NFCOM,
  NICE_COMPETENCY_AREAS,
  NICE_COMPONENTS_VERSION,
} from './niceFramework'
import { NICE_MODULE_MAP } from './niceModuleMapping'

/**
 * Drift-guard: every official NICE code used in our data layer must exist in the
 * vendored NICE Framework Components v2.2.0 export
 * (`pqc-references/NICE-Framework-Components-v2.2.0.json`). This fails CI the day
 * our data diverges from the standard — e.g. NIST ships a new components version
 * and we haven't re-vendored + re-mapped.
 *
 * Release 1 scope: work-role codes. Release 2 extends this to competency-area
 * (NF-COM-###) and TKS statement IDs once those layers adopt the official codes.
 */
const NICE_JSON_PATH = resolve(
  process.cwd(),
  'pqc-references',
  'NICE-Framework-Components-v2.2.0.json'
)

interface CprtElement {
  element_type: string
  element_identifier: string
}

function loadOfficial(): { elements: CprtElement[]; documents: { version: string }[] } {
  return JSON.parse(readFileSync(NICE_JSON_PATH, 'utf-8'))
}

function officialIdsOfType(elementType: string): Set<string> {
  const { elements } = loadOfficial()
  return new Set(
    elements.filter((e) => e.element_type === elementType).map((e) => e.element_identifier)
  )
}

describe('NICE Framework drift-guard (v2.2.0)', () => {
  it('the vendored components file is the expected version (2.2.0)', () => {
    expect(loadOfficial().documents[0]?.version).toBe('2.2.0')
    // The exported constant is what the UI labels figures with; it must track the file.
    expect(NICE_COMPONENTS_VERSION).toBe(loadOfficial().documents[0]?.version)
  })

  it('every work-role niceCode exists in the official v2.2.0 components', () => {
    const officialWorkRoles = officialIdsOfType('work_role')
    expect(officialWorkRoles.size).toBe(42)
    for (const role of Object.values(NICE_WORK_ROLES)) {
      expect(
        officialWorkRoles.has(role.niceCode),
        `Work role "${role.id}" code ${role.niceCode} is not a real NICE v2.2.0 work-role ID`
      ).toBe(true)
    }
  })

  it('every work-role carries a category and official name', () => {
    for (const role of Object.values(NICE_WORK_ROLES)) {
      expect(role.officialName.length).toBeGreaterThan(0)
      expect(['DD', 'IO', 'PD', 'IN', 'OG']).toContain(role.category)
    }
  })

  it('all 11 official competency-area codes exist in the official v2.2.0 components', () => {
    const officialCAs = officialIdsOfType('competency_area')
    expect(officialCAs.size).toBe(11)
    for (const ca of Object.values(NF_COMPETENCY_AREAS)) {
      expect(officialCAs.has(ca.id), `${ca.id} is not a real NICE v2.2.0 competency area`).toBe(
        true
      )
    }
  })

  it('every CA→NF-COM crosswalk target is a real official competency area (or null)', () => {
    const officialCAs = officialIdsOfType('competency_area')
    for (const target of Object.values(CA_TO_NFCOM)) {
      if (target !== null) {
        expect(officialCAs.has(target), `crosswalk target ${target} not in NICE v2.2.0`).toBe(true)
      }
    }
  })

  it('every TKS sample ID exists in the official v2.2.0 components', () => {
    const officialTks = new Set<string>([
      ...officialIdsOfType('task'),
      ...officialIdsOfType('knowledge'),
      ...officialIdsOfType('skill'),
    ])
    for (const ca of Object.values(NICE_COMPETENCY_AREAS)) {
      for (const tks of ca.tksSample) {
        expect(
          officialTks.has(tks.id),
          `TKS ${tks.id} (${ca.id}) is not a real NICE v2.2.0 statement ID`
        ).toBe(true)
      }
    }
  })

  it('every module nfExtra tag is a real official v2.2.0 competency-area code', () => {
    const officialCAs = officialIdsOfType('competency_area')
    for (const ref of NICE_MODULE_MAP) {
      for (const nf of ref.nfExtra ?? []) {
        expect(
          officialCAs.has(nf),
          `module "${ref.moduleId}" nfExtra ${nf} is not a real NICE v2.2.0 competency area`
        ).toBe(true)
      }
    }
  })
})

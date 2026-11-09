// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Every Library row the release-4.202 trust-hardware changes cite must exist in the Library CSV and
 * be declared by its module. The rows were admitted for that release: until they are merged into
 * the Library CSV of the branch under test, the first test fails by design (it names each missing
 * id), and the modules still render because citedStandards() skips an id it cannot find.
 */
import { describe, it, expect } from 'vitest'
import { hasStandard } from '@/data/standardsRegistry'
import { TRUST_HARDWARE_CITATIONS, type TrustHardwareModuleId } from './trustHardwareCitations'
import { content as hsm } from './HsmPqc/content'
import { content as cc } from './ConfidentialComputing/content'
import { content as sb } from './SecureBootPQC/content'
import { content as accel } from './PQCHardwareAcceleration/content'
import { content as kms } from './KmsPqc/content'

const CONTENTS: Record<TrustHardwareModuleId, { standards: { id: string }[] }> = {
  'hsm-pqc': hsm,
  'confidential-computing': cc,
  'secure-boot-pqc': sb,
  'pqc-hw-acceleration': accel,
  'kms-pqc': kms,
}

describe('trust-hardware citations', () => {
  it('every cited Library row exists in the Library CSV', () => {
    const missing = Object.values(TRUST_HARDWARE_CITATIONS)
      .flat()
      .filter((id) => !hasStandard(id))
    expect(missing).toEqual([])
  })

  it('each module declares its cited rows once', () => {
    for (const [moduleId, ids] of Object.entries(TRUST_HARDWARE_CITATIONS)) {
      const declared = CONTENTS[moduleId as TrustHardwareModuleId].standards.map((s) => s.id)
      expect(new Set(declared).size, `${moduleId}: duplicate standards`).toBe(declared.length)
      for (const id of ids) {
        if (hasStandard(id)) expect(declared, `${moduleId}: ${id}`).toContain(id)
      }
    }
  })
})

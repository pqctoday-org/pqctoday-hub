// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { complianceFrameworks } from './complianceData'
import { PERSONA_COMPLIANCE_FRAMEWORK_EMPHASIS } from './personaConfig'
import { SOURCE_ORGANIZATIONS, sourceOrganizationById } from './sourceOrganizations'
import { certRecordSourceFor } from '../components/Compliance/certRecordLinks'

describe('compliance per-record facts held in the catalogue', () => {
  it('keeps each persona emphasis list in its stored order, naming only active frameworks', () => {
    expect(PERSONA_COMPLIANCE_FRAMEWORK_EMPHASIS).toEqual({
      executive: ['CNSA-2', 'DORA', 'NIS2', 'GDPR', 'PCI-DSS'],
      grc: [],
      developer: ['CMMC', 'NIST', 'CNSA-2'],
      architect: ['NIST', 'BSI', 'ANSSI', 'ENISA', 'CNSA-2'],
      ops: ['CNSA-2', 'NIS2', 'PCI-DSS', 'DORA'],
      researcher: ['NIST', 'ENISA', 'BSI', 'ANSSI', '3GPP-PQC', 'BIS-158-PQC'],
      'cert-engineer': ['CNSA-2', 'NIST', 'PCI-DSS'],
      curious: ['NIST', 'ENISA', 'CNSA-2', 'GDPR', 'HIPAA'],
    })
    const active = new Set(complianceFrameworks.map((f) => f.id))
    for (const ids of Object.values(PERSONA_COMPLIANCE_FRAMEWORK_EMPHASIS)) {
      for (const id of ids ?? []) expect(active.has(id), id).toBe(true)
    }
  })

  it('names the certification-record source of the six certification rows', () => {
    const withSource = complianceFrameworks.filter((f) => f.certRecordSource).map((f) => f.id)
    expect(withSource.sort()).toEqual(
      ['ACVP', 'ANSSI-CERT', 'COMMON-CRITERIA', 'EUCC', 'EUCC-V2', 'FIPS-140-3'].sort()
    )
    expect(certRecordSourceFor('FIPS-140-3')).toBe('NIST')
    expect(certRecordSourceFor('COMMON-CRITERIA')).toBe('Common Criteria')
    expect(certRecordSourceFor('GDPR')).toBeUndefined()
  })

  it('loads the publisher registry from its data file, every parent present', () => {
    expect(SOURCE_ORGANIZATIONS).toHaveLength(143)
    for (const org of SOURCE_ORGANIZATIONS) {
      if (org.parentId) expect(sourceOrganizationById(org.parentId), org.id).not.toBeNull()
      expect(org.sourceUrl, org.id).toMatch(/^https?:\/\//)
    }
  })
})

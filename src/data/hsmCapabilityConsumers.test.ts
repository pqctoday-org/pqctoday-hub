// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { getHsmFactsForSoftware, hsmCapabilitySummary } from './hsmCapabilityXrefData'
import { HSM_VENDORS as operations } from '@/components/PKILearning/modules/HsmPqc/data/hsmVendorData'
import { HSM_VENDORS as management } from '@/components/PKILearning/modules/CryptoMgmtModernization/data/hsmVendors'

describe('HSM learning capability consumers', () => {
  it('does not alias another product from the same vendor', () => {
    expect(getHsmFactsForSoftware('Thales Luna HSM')).not.toHaveLength(0)
    expect(getHsmFactsForSoftware('Thales unknown device')).toEqual([])
    expect(getHsmFactsForSoftware(undefined)).toEqual([])
  })
  it('does not claim that an unrecorded product supports PQC', () => {
    expect(hsmCapabilitySummary('Unrecorded')).toMatch(/No capability evidence/)
  })
  it('derives the operations list and management summary from the same records', () => {
    const aws = operations.find((v) => v.catalogName === 'AWS CloudHSM')!
    const records = getHsmFactsForSoftware('AWS CloudHSM')
    expect(records.find((r) => r.algorithm === 'ML-DSA')?.available).toBe('yes')
    expect(aws.supportedPQCAlgorithms).toContain('ML-DSA')
    expect(aws.supportedPQCAlgorithms).not.toContain('ML-KEM')
    const m = management.find((v) => v.catalogName === 'AWS CloudHSM')!
    expect(m.pqcSupport).toContain('ML-KEM: unknown')
    expect(m.pqcSupport).toContain('listed on CMVP certificate:')
  })
})

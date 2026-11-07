// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { content } from './content'
import { CNSA_ACQUISITION_LABEL } from '@/components/PKILearning/modules/PQCRiskManagement/data/cnsaLabels'

describe('SOC implementation deadlines: CNSA 2.0 acquisition date', () => {
  it('uses the shared acquisition wording for 2027 and does not add an operating-system requirement', () => {
    const entry = content.deadlines?.find((d) => d.year === 2027 && /CNSA 2\.0/.test(d.label))
    expect(entry?.label).toBe(CNSA_ACQUISITION_LABEL)
    expect(content.deadlines?.some((d) => /OS must support/i.test(d.label))).toBe(false)
  })
})

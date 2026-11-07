// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { CNSA_NAMING_DRIFT } from './cnsaData'

describe('CNSA naming note', () => {
  it('calls the 2022 and 2026 names related but not interchangeable', () => {
    expect(CNSA_NAMING_DRIFT.note).toContain('related but not interchangeable')
    expect(CNSA_NAMING_DRIFT.note).toContain('only ML-KEM and ML-DSA are in CNSA 2.0')
    expect(CNSA_NAMING_DRIFT.note).not.toContain('name the same algorithms differently')
  })
})

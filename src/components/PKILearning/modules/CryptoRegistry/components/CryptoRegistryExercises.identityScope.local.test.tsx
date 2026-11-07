// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CryptoRegistryExercises } from './CryptoRegistryExercises'
import { normalizeAlgorithmName } from '@/data/cyclonedxCryptoRegistry'

describe('algorithm labels versus key identity', () => {
  it('teaches what each label establishes without treating it as key identification', () => {
    render(<CryptoRegistryExercises />)
    expect(
      screen.getByText(/Matching algorithm labels or families does not establish key identity/)
    ).toBeInTheDocument()
    expect(screen.getByText(/ES256 specifies P-256 with SHA-256/)).toBeInTheDocument()
    expect(
      screen.getByText(/CKM_ECDSA_SHA256 does not by itself select the key’s curve/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/public-key fingerprints computed over a comparable representation/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/Confirm it/)).not.toBeInTheDocument()
  })

  it('keeps same-family normalization and workshop routing without claiming the records share a key', () => {
    const mechanism = normalizeAlgorithmName('CKM_ECDSA_SHA256')
    const jose = normalizeAlgorithmName('ES256')
    expect(mechanism).not.toBeNull()
    expect(jose).not.toBeNull()
    expect(mechanism!.family.family).toBe(jose!.family.family)
    // Algorithm-family agreement is compatible with two distinct sample key records.
    const sampleRecords = [
      { algorithm: 'CKM_ECDSA_SHA256', keyRecord: 'sample-key-A' },
      { algorithm: 'ES256', keyRecord: 'sample-key-B' },
    ]
    expect(sampleRecords[0].keyRecord).not.toBe(sampleRecords[1].keyRecord)
    const navigate = vi.fn()
    render(<CryptoRegistryExercises onNavigateToWorkshop={navigate} />)
    fireEvent.click(screen.getByRole('button', { name: 'Use the Algorithm Normalizer' }))
    expect(navigate).toHaveBeenLastCalledWith(0)
    fireEvent.click(screen.getByRole('button', { name: 'Use the Curve Lookup' }))
    expect(navigate).toHaveBeenLastCalledWith(1)
    expect(
      screen.getByText(/it does not verify that two records contain the same key/)
    ).toBeInTheDocument()
  })
})

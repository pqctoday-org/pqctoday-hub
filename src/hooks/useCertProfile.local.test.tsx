// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useCertProfile } from './useCertProfile'
import type { X509Attribute } from '@/components/PKILearning/common/types'
const initial: X509Attribute[] = [
  {
    id: 'CN',
    label: 'Common Name',
    oid: 'CN',
    status: 'mandatory',
    value: 'my-sample.example',
    enabled: true,
    placeholder: '',
    description: '',
    elementType: 'SubjectRDN',
  },
]
describe('one shared CSR/certificate profile loader', () => {
  it('recovers from a failed profile using the actual dropdown clear sentinel', async () => {
    const { result } = renderHook(() => useCertProfile({ initialAttributes: initial }))
    await act(() => result.current.handleProfileSelect('missing.csv'))
    expect(result.current.loadingError).not.toBeNull()
    await act(() => result.current.handleProfileSelect('All'))
    expect(result.current.selectedProfile).toBe('')
    expect(result.current.loadingError).toBeNull()
    expect(result.current.loadingProfile).toBe(false)
    expect(result.current.attributes).toEqual(initial)
  })
  it('preserves all certificate examples and independent criticality', async () => {
    const { result } = renderHook(() => useCertProfile({ initialAttributes: initial }))
    await act(() => result.current.handleProfileSelect('Cert-GeneralIT_CABF_TLSBR_2025.csv'))
    expect(result.current.loadingError).toBeNull()
    const bc = result.current.attributes.find((a) => a.label === 'basicConstraints')
    expect(bc).toMatchObject({
      value: 'cA=FALSE',
      enabled: true,
      status: 'unknown',
      critical: false,
    })
    expect(result.current.attributes.find((a) => a.label === 'keyUsage')).toMatchObject({
      critical: true,
      status: 'unknown',
      enabled: true,
    })
  })
  it('uses the same semantics for CSR requests and clears profile-only rows on clearing', async () => {
    const { result } = renderHook(() =>
      useCertProfile({ initialAttributes: initial, profileKind: 'csr' })
    )
    await act(() => result.current.handleProfileSelect('CSR-GeneralIT_CABF_TLSBR_2025.csv'))
    expect(result.current.attributes.every((a) => a.status === 'unknown')).toBe(true)
    expect(result.current.loadingError).toBeNull()
    await act(() => result.current.handleProfileSelect(''))
    expect(result.current.attributes.every((a) => a.elementType === 'SubjectRDN')).toBe(true)
    expect(result.current.attributes[0].status).toBe('mandatory')
  })
  it('retains previous data but marks a missing profile incomplete', async () => {
    const { result } = renderHook(() => useCertProfile({ initialAttributes: initial }))
    await act(() => result.current.handleProfileSelect('missing.csv'))
    expect(result.current.loadingError).toBe('Profile path not found')
    expect(result.current.attributes).toEqual(initial)
    expect(result.current.loadingProfile).toBe(false)
  })
  it('does not let an abandoned async profile replace a later clear selection', async () => {
    const { result } = renderHook(() => useCertProfile({ initialAttributes: initial }))
    await act(async () => {
      const earlier = result.current.handleProfileSelect('Cert-GeneralIT_CABF_TLSBR_2025.csv')
      await result.current.handleProfileSelect('')
      await earlier
    })
    expect(result.current.selectedProfile).toBe('')
    expect(result.current.profileMetadata).toBeNull()
    expect(result.current.attributes).toEqual(initial)
    expect(result.current.loadingProfile).toBe(false)
  })
})

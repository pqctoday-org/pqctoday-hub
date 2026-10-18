// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The workshop on the phone shell (owner decision 2026-10-12): the module is on
 * MOBILE_WORKSHOP_READY, so the phone shell mounts the real workshop — six concept views in
 * step 1 and eight flow scenarios in step 2 — behind its Learn / Workshop switch, never the "not built
 * for mobile yet" banner.
 */
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { MOBILE_WORKSHOP_READY } from '@/data/mobileWorkshops'
import { HomomorphicEncryptionModule } from './index'
import manifest from './manifest'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useModuleStore } from '@/store/useModuleStore'

vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: () => true }))

const renderAt = (url: string) =>
  render(
    <EmbedProvider>
      <MemoryRouter initialEntries={[url]}>
        <HomomorphicEncryptionModule />
      </MemoryRouter>
    </EmbedProvider>
  )

describe('HomomorphicEncryption on the phone shell', () => {
  beforeEach(() => {
    usePersonaStore.getState().setPersona('cert-engineer')
    useModuleStore.getState().setActiveLearnPath(manifest.id, 'hsm-custody')
  })

  it('is on the phone workshop list and has the two workshop steps', () => {
    expect(MOBILE_WORKSHOP_READY.has('homomorphic-encryption')).toBe(true)
    expect(manifest.workshopSteps?.map((s) => s.id)).toEqual(['fhe-concepts', 'fhe-hsm-flows'])
  })

  it('shows a Learn / Workshop switch and mounts the workshop, not the banner', () => {
    renderAt('/learn/homomorphic-encryption')
    expect(screen.queryByText(/guided workshop isn.t built for mobile/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Workshop' }))
    expect(screen.queryByText(/isn.t built for mobile yet/)).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Noise budget and bootstrapping/ })
    ).toBeInTheDocument()
  })

  it('step 2: all eight flow scenarios are reachable and the new ones operate', () => {
    renderAt('/learn/homomorphic-encryption?tab=workshop&step=1')
    fireEvent.click(screen.getByRole('button', { name: /Step 2: Advanced HSM custody lab/ }))
    for (const name of [
      /CKKS single-HSM custody/,
      /TFHE single-HSM custody/,
      /Threshold: OpenFHE/,
      /Threshold: Lattigo/,
      /What can run in the HSM/,
      /Transciphering/,
      /CKKS key rotation/,
      /CKKS shared \(2-of-2\) decryption/,
    ])
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /CKKS key rotation/ }))
    const attempt = screen.getByTestId('rotation-attempt')
    fireEvent.click(within(attempt).getByRole('button', { name: 'User session' }))
    expect(within(attempt).getByRole('status')).toHaveTextContent('CKR_USER_TYPE_INVALID')
    fireEvent.click(screen.getByRole('button', { name: /CKKS shared \(2-of-2\) decryption/ }))
    const sw = screen.getByTestId('shared-switches')
    fireEvent.click(within(sw).getByRole('button', { name: /Not independent/ }))
    expect(screen.getByTestId('shared-requester')).toHaveTextContent(/add up to the secret/)
  })

  it('step 1: the six concept views are reachable', () => {
    renderAt('/learn/homomorphic-encryption?tab=workshop&step=0')
    fireEvent.click(screen.getByRole('button', { name: /Step 1: FHE concepts lab/ }))
    for (const name of [
      /Noise budget and bootstrapping/,
      /Encode, decode and rounding/,
      /From a program to an FHE circuit/,
      /Key streaming and chunk size/,
      /Key rotation without decrypting/,
      /Shared \(2-of-2\) decryption/,
    ])
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Key rotation without decrypting/ }))
    expect(screen.getByTestId('rotation-attempt')).toBeInTheDocument()
  })
})

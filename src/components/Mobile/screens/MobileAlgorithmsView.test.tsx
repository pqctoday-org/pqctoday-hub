// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobileAlgorithmsView } from './MobileAlgorithmsView'
import { usePersonaStore } from '@/store/usePersonaStore'
import { ALGORITHM_REGISTRY } from '@/data/algorithmProperties'
import { transitionConsequence } from '@/data/algorithmConsequence'
import { INTENTS, PERSONA_INTENTS, EU_EXECUTIVE_INTENTS } from '@/data/algorithmEntryIntents'

const mockNavigate = vi.hoisted(() => vi.fn())
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderView() {
  return render(
    <MemoryRouter>
      <MobileAlgorithmsView />
    </MemoryRouter>
  )
}

describe('MobileAlgorithmsView', () => {
  afterEach(() => {
    usePersonaStore.getState().setPersona(null)
    usePersonaStore.getState().setRegion('global')
    mockNavigate.mockClear()
  })

  it('shows the real registry count', () => {
    renderView()
    expect(
      screen.getByText(`${Object.keys(ALGORITHM_REGISTRY).length} tracked`)
    ).toBeInTheDocument()
  })

  it('renders every real INTENTS entry from algorithmEntryIntents.tsx', () => {
    renderView()
    for (const intent of INTENTS) {
      expect(screen.getByText(intent.label)).toBeInTheDocument()
    }
  })

  it('tapping an intent navigates with its real params as a query string', () => {
    renderView()
    fireEvent.click(screen.getByText('Run a live test'))
    expect(mockNavigate).toHaveBeenCalledWith('/algorithms?tab=validation&section=kat')
  })

  it('shows the persona-specific intent when a persona with one is set', () => {
    usePersonaStore.getState().setPersona('executive')
    renderView()
    expect(screen.getByText(PERSONA_INTENTS.executive!.label)).toBeInTheDocument()
  })

  it('shows both EU_EXECUTIVE_INTENTS entries for executive+eu instead of the single persona intent', () => {
    usePersonaStore.getState().setPersona('executive')
    usePersonaStore.getState().setRegion('eu')
    renderView()
    for (const intent of EU_EXECUTIVE_INTENTS) {
      expect(screen.getByText(intent.label)).toBeInTheDocument()
    }
    expect(screen.queryByText(PERSONA_INTENTS.executive!.label)).not.toBeInTheDocument()
  })

  it('the byte comparison uses real registry values, correctly labeled (public key vs signature)', () => {
    renderView()
    expect(
      screen.getByText(`${ALGORITHM_REGISTRY['RSA-2048'].publicKeyBytes.toLocaleString()} B`)
    ).toBeInTheDocument()
    expect(
      screen.getByText(`${ALGORITHM_REGISTRY['ML-KEM-768'].publicKeyBytes.toLocaleString()} B`)
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        `${ALGORITHM_REGISTRY['SLH-DSA-SHA2-128s'].signatureOrCiphertextBytes.toLocaleString()} B`
      )
    ).toBeInTheDocument()
  })

  it('never shows the README\'s uncorroborated "ECDSA 72 B" figure', () => {
    renderView()
    expect(screen.queryByText('72 B')).not.toBeInTheDocument()
    expect(screen.queryByText('ECDSA')).not.toBeInTheDocument()
  })

  it('the growth-factor sentence is the real computed transitionConsequence(), not a typed multiplier', () => {
    renderView()
    const real = transitionConsequence('Ed25519', 'ML-DSA-65')
    expect(real).not.toBeNull()
    expect(screen.getByText(real!.sentence)).toBeInTheDocument()
  })

  it('states what was cut rather than silently dropping it', () => {
    renderView()
    expect(
      screen.getByText(/Family, region \(NIST\/BSI\/ANSSI\), and security-level filters/i)
    ).toBeInTheDocument()
  })
})

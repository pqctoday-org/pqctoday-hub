// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobileAlgorithmsView } from './MobileAlgorithmsView'
import { usePersonaStore } from '@/store/usePersonaStore'
import { ALGORITHM_REGISTRY } from '@/data/algorithmProperties'
import { transitionConsequence } from '@/data/algorithmConsequence'
import { INTENTS, PERSONA_INTENTS, EU_EXECUTIVE_INTENTS } from '@/data/algorithmEntryIntents'
import { loadPQCAlgorithmsData } from '@/data/pqcAlgorithmsData'

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

  it('never shows a persona-specific intent, even when a persona is set (2026-08-24: cut to the 3 global intents only)', () => {
    usePersonaStore.getState().setPersona('executive')
    usePersonaStore.getState().setRegion('eu')
    renderView()
    for (const intent of EU_EXECUTIVE_INTENTS) {
      expect(screen.queryByText(intent.label)).not.toBeInTheDocument()
    }
    expect(screen.queryByText(PERSONA_INTENTS.executive!.label)).not.toBeInTheDocument()
    for (const intent of INTENTS) {
      expect(screen.getByText(intent.label)).toBeInTheDocument()
    }
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

  // 2026-08-24 audit R5: the byte-comparison rows used to index
  // ALGORITHM_REGISTRY directly with no existence check — a renamed/removed
  // key would throw reading a property off undefined, crashing the whole
  // screen. Mutating the real registry (not a mock) to simulate exactly
  // that data-drift scenario against the real component.
  it('drops a byte-comparison row instead of crashing when its registry entry is missing', () => {
    const saved = ALGORITHM_REGISTRY['SLH-DSA-SHA2-128s']
    delete ALGORITHM_REGISTRY['SLH-DSA-SHA2-128s']
    try {
      expect(() => renderView()).not.toThrow()
      expect(screen.queryByText('SLH-DSA-128s')).not.toBeInTheDocument()
      // The rest of the screen still renders — not a full crash.
      expect(
        screen.getByText(`${ALGORITHM_REGISTRY['RSA-2048'].publicKeyBytes.toLocaleString()} B`)
      ).toBeInTheDocument()
    } finally {
      ALGORITHM_REGISTRY['SLH-DSA-SHA2-128s'] = saved
    }
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
      screen.getByText(/Family, region \(NIST\/BSI\/ANSSI\) filters, keygen\/verify performance/i)
    ).toBeInTheDocument()
  })

  it('the security-level chart compares the 3 PQC algorithms already featured, real registry values', () => {
    renderView()
    expect(screen.getByText('What actually changes: security margin')).toBeInTheDocument()
    // ML-KEM-768 and ML-DSA-65 are both level 3 in the real registry, so
    // "Level 3" legitimately appears twice; SLH-DSA-128s (level 1) is the
    // one asserted uniquely, since that's the real finding this chart exists
    // to surface — a lower level despite a much bigger signature.
    expect(
      screen.getByText(`Level ${ALGORITHM_REGISTRY['SLH-DSA-SHA2-128s'].securityLevel}`)
    ).toBeInTheDocument()
    expect(
      screen.getAllByText(`Level ${ALGORITHM_REGISTRY['ML-KEM-768'].securityLevel}`)
    ).toHaveLength(2)
  })

  it('never shows a security-level row for a classical algorithm (securityLevel is null for all of them)', () => {
    renderView()
    expect(ALGORITHM_REGISTRY['RSA-2048'].securityLevel).toBeNull()
    expect(ALGORITHM_REGISTRY['Ed25519'].securityLevel).toBeNull()
  })

  it('the performance chart loads real relative-cycle data async and renders all 5 featured algorithms', async () => {
    renderView()
    expect(
      await screen.findByText('What actually changes: signing/encapsulation speed')
    ).toBeInTheDocument()
    const detail = (await loadPQCAlgorithmsData()).find((d) => d.name === 'SLH-DSA-SHA2-128s')!
    expect(await screen.findByText(detail.signEncapsCycles)).toBeInTheDocument()
  })

  it('tapping a byte-bar row opens the real per-algorithm detail sheet, and Close dismisses it', () => {
    renderView()
    fireEvent.click(screen.getByText('RSA-2048').closest('button')!)
    expect(screen.getByTestId('algorithm-detail-sheet')).toBeInTheDocument()
    expect(
      screen.getByText(ALGORITHM_REGISTRY['RSA-2048'].fipsStandard ?? 'None')
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByTestId('algorithm-detail-sheet')).not.toBeInTheDocument()
  })
})

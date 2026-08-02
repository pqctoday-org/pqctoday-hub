// SPDX-License-Identifier: GPL-3.0-only
//
// Persona-gating tests for HsmPlayground — curious/executive personas get an
// advisory ExecutiveRedirectBanner already; this covers the newer, real
// structural gate added alongside it: the ACVP tab and the engine-mode
// selector are hidden (not just advised against) for those two personas,
// while every other persona still sees both.
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { PersonaId } from '@/data/learningPersonas'

let mockPersona: PersonaId | null = 'developer'

vi.mock('@/store/usePersonaStore', () => ({
  usePersonaStore: (selector: (s: { selectedPersona: PersonaId | null }) => unknown) =>
    selector({ selectedPersona: mockPersona }),
}))

vi.mock('./contexts/SettingsContext', () => ({
  useSettingsContext: () => ({ error: null }),
}))

vi.mock('./hsm/HsmContext', () => ({
  useHsmContext: () => ({
    engineMode: 'rust',
    setEngineMode: vi.fn(),
    phase: 'idle',
    isReady: false,
    autoInit: vi.fn().mockResolvedValue(true),
    moduleRef: { current: null },
    hSessionRef: { current: 0 },
    addHsmKey: vi.fn(),
    hsmKeys: [],
    clearHsmKeys: vi.fn(),
    removeHsmKey: vi.fn(),
    addHsmLog: vi.fn(),
    hsmLog: [],
    clearHsmLog: vi.fn(),
  }),
  HsmProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('./hsm/learn/HsmLearnView', () => ({
  HsmLearnView: () => <div>Learn view stub</div>,
}))

vi.mock('../../wasm/softhsm', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    hsm_generateMLDSAKeyPair: vi.fn(),
    hsm_generateECKeyPair: vi.fn(),
    hsm_generateAESKey: vi.fn(),
  }
})

function renderHsmPlayground() {
  return import('./HsmPlayground').then(({ HsmPlayground }) =>
    render(
      <MemoryRouter>
        <HsmPlayground />
      </MemoryRouter>
    )
  )
}

describe('HsmPlayground persona gating', () => {
  it('shows the ACVP tab and engine selector for a non-gated persona', async () => {
    mockPersona = 'developer'
    await renderHsmPlayground()
    expect(screen.getByRole('tab', { name: /acvp/i })).toBeInTheDocument()
    expect(screen.getByText('Engine:')).toBeInTheDocument()
  })

  it('hides the ACVP tab and engine selector for curious', async () => {
    mockPersona = 'curious'
    await renderHsmPlayground()
    expect(screen.queryByRole('tab', { name: /acvp/i })).not.toBeInTheDocument()
    expect(screen.queryByText('Engine:')).not.toBeInTheDocument()
  })

  it('hides the ACVP tab and engine selector for executive, alongside the existing advisory banner', async () => {
    mockPersona = 'executive'
    await renderHsmPlayground()
    expect(screen.queryByRole('tab', { name: /acvp/i })).not.toBeInTheDocument()
    expect(screen.queryByText('Engine:')).not.toBeInTheDocument()
    expect(screen.getByText(/hands-on engineering workbench/i)).toBeInTheDocument()
  })
})

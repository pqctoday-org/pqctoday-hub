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

/**
 * 20s, not the 5s default (2026-08-09). `renderHsmPlayground` dynamically
 * imports HsmPlayground, which pulls the SoftHSM wasm module graph — cheap when
 * this file runs alone (it passes in well under a second), but under a full
 * `npm run test` across 559 files it competes for CPU and can pass 5s.
 *
 * The timeout did not fail alone. A timed-out test still had its import in
 * flight, so the render landed in `document.body` AFTER the global afterEach
 * cleanup, and the NEXT test then found two "hands-on engineering workbench"
 * banners — four Playground components render that same text — and failed on
 * an ambiguous query rather than on anything it was testing. One slow import
 * therefore took out all three tests, with only the last one looking like a
 * real assertion failure.
 *
 * Observed across three consecutive full-suite runs on the same tree before
 * this change: 1 failure, then 0, then 3. Isolated: 3/3 pass every time.
 */
describe('HsmPlayground persona gating', { timeout: 20_000 }, () => {
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

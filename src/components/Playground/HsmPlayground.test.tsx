// SPDX-License-Identifier: GPL-3.0-only
//
// Persona-gating tests for HsmPlayground — curious/executive personas get an
// advisory ExecutiveRedirectBanner already; this covers the newer, real
// structural gate added alongside it: the ACVP sub-tab and the engine-mode
// selector are hidden (not just advised against) for those two personas,
// while every other persona still sees both.
//
// 2026-08-31 merge (feat/navigate-label-selection @ 509f712e3): ACVP moved
// from its own top-level tab into a sub-tab under the top-level "Developer"
// tab (alongside Pipeline/Conformance) — see DeveloperTab.tsx. The Developer
// tab button itself is never gated (only its ACVP/Conformance sub-tabs are),
// so reaching the ACVP assertion now requires opening Developer first.
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { PersonaId } from '@/data/learningPersonas'
// Imported statically, NOT with a dynamic import inside each test.
// `vi.mock` calls are hoisted above imports by vitest, so a static import
// still receives every mock below — the dynamic form bought nothing and cost
// a lot: it charged the whole HsmPlayground module graph (WASM bindings and
// all) to the FIRST test's 5s budget. The file passed on its own in ~1.3s and
// timed out only in a loaded full-suite run, where exactly one of the three
// tests failed — whichever one happened to trigger the import.
import { HsmPlayground } from './HsmPlayground'

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
  return render(
    <MemoryRouter>
      <HsmPlayground />
    </MemoryRouter>
  )
}

/**
 * Why the static import above matters more than a bigger timeout (2026-08-09).
 *
 * Two sessions diagnosed this file independently and landed different fixes;
 * this is the merge of the two. The other fix raised the describe timeout to
 * 20s, which works but treats the symptom. The static import removes the cause
 * — 859ms -> 176ms — so that is what ships.
 *
 * The other diagnosis found the part worth keeping: the timeout never failed
 * alone. A timed-out test still had its dynamic import in flight, so its render
 * landed in `document.body` AFTER the global afterEach cleanup, and the NEXT
 * test then found two "hands-on engineering workbench" banners — four Playground
 * components render that text — and failed on an ambiguous query rather than on
 * anything it was testing. One slow import took out all three tests, and only
 * the last looked like a real assertion failure. Across three consecutive
 * full-suite runs on the same tree: 1 failure, then 0, then 3.
 *
 * So if this file ever goes flaky again, distrust the failure message: look for
 * a slow import first, not for whatever the failing assertion claims.
 */
describe('HsmPlayground persona gating', () => {
  it('shows the ACVP sub-tab (under Developer) and engine selector for a non-gated persona', () => {
    mockPersona = 'developer'
    renderHsmPlayground()
    expect(screen.getByText('Engine:')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: /developer/i }))
    expect(screen.getByRole('tab', { name: /^acvp$/i })).toBeInTheDocument()
  })

  it('hides the ACVP sub-tab and engine selector for curious, but still opens Developer > Pipeline', () => {
    mockPersona = 'curious'
    renderHsmPlayground()
    expect(screen.queryByText('Engine:')).not.toBeInTheDocument()
    const developerTab = screen.getByRole('tab', { name: /developer/i })
    fireEvent.click(developerTab)
    expect(screen.getByRole('tab', { name: /^pipeline$/i })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: /^acvp$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: /^conformance$/i })).not.toBeInTheDocument()
  })

  it('hides the ACVP sub-tab and engine selector for executive, alongside the existing advisory banner', () => {
    mockPersona = 'executive'
    renderHsmPlayground()
    expect(screen.queryByText('Engine:')).not.toBeInTheDocument()
    expect(screen.getByText(/hands-on engineering workbench/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: /developer/i }))
    expect(screen.queryByRole('tab', { name: /^acvp$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: /^conformance$/i })).not.toBeInTheDocument()
  })
})

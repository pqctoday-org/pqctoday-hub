// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { EmbedProvider } from '@/embed/EmbedProvider'
import { Button } from '@/components/ui/button'
import { ModuleShell } from './ModuleShell'
import type { ModuleManifest } from '../manifest/types'
import { useModuleStore } from '@/store/useModuleStore'

const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({
  useIsMobileShell: mockUseIsMobileShell,
}))

const mockNavigate = vi.hoisted(() => vi.fn())
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

afterEach(() => {
  mockUseIsMobileShell.mockReturnValue(false)
  mockNavigate.mockClear()
  useModuleStore.setState({ modules: {} })
})

// id: 'hsm-pqc' — a REAL module id. LEARN_SECTIONS/MODULE_TO_TRACK are read by
// MobileModuleShell straight off the global manifest registry (moduleData.ts),
// exactly as desktop's own LearnSectionChecklist.tsx does — never off this
// prop's own `learnSections`. Overriding it here with fake sections would be
// silently ignored (confirmed while writing this test: the real HsmPqc
// module's real 3 sections rendered regardless), so the checklist test below
// asserts against HsmPqc's real, current section data on purpose.
const base: ModuleManifest = {
  id: 'hsm-pqc',
  title: 'Test Module',
  description: 'Catalog description',
  duration: '10 min',
  lm_id: 'LM-999',
  difficulty: 'intermediate',
  frameworkPhase: 'p0',
  whyThisMatters: 'Because it matters a lot.',
}

function renderShell(ui: React.ReactNode) {
  return render(
    <EmbedProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </EmbedProvider>
  )
}

describe('ModuleShell — mobile UX layer wiring', () => {
  it('flag off: renders the desktop shell — its tab bar', () => {
    mockUseIsMobileShell.mockReturnValue(false)
    renderShell(<ModuleShell manifest={base} learn={<div>LEARN BODY</div>} />)
    expect(screen.getByRole('tab', { name: 'Learn' })).toBeInTheDocument()
  })

  it('flag on: renders MobileModuleShell instead — real header chips, no tab bar, same real Learn content', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderShell(<ModuleShell manifest={base} learn={<div>LEARN BODY</div>} />)
    expect(screen.getByRole('heading', { name: 'Test Module' })).toBeInTheDocument()
    expect(screen.getByText('LM-999')).toBeInTheDocument()
    expect(screen.getByText('intermediate')).toBeInTheDocument()
    expect(screen.getByText('Because it matters a lot.')).toBeInTheDocument()
    expect(screen.getByText('LEARN BODY')).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Learn' })).not.toBeInTheDocument()
  })

  it("flag on: real section checklist (HsmPqc's real 3 sections) toggles real read state", () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderShell(<ModuleShell manifest={base} learn={<div>L</div>} />)
    expect(screen.getByText('0/3 sections read')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'PKCS#11 PQC Mechanisms' }))
    expect(useModuleStore.getState().modules['hsm-pqc']?.learnSectionChecks?.pkcs11).toBe(true)
  })

  // Wave C2 (2026-08-29) — RelatedModulesPanel (module↔module relations,
  // WS22 Stage 3) used to be desktop-only. hsm-pqc has real computed
  // relations (same track/frameworkPhase peers), so this exercises the
  // actual mount, not just "doesn't crash".
  it('flag on: shows Related modules (WS22, previously desktop-only)', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderShell(<ModuleShell manifest={base} learn={<div>LEARN BODY</div>} />)
    expect(screen.getByRole('heading', { name: 'Related modules' })).toBeInTheDocument()
  })

  it('flag on: honors learnRaw over learn, matching desktop precedence', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderShell(
      <ModuleShell manifest={base} learn={<div>WRONG</div>} learnRaw={<div>RAW BODY</div>} />
    )
    expect(screen.getByText('RAW BODY')).toBeInTheDocument()
    expect(screen.queryByText('WRONG')).not.toBeInTheDocument()
  })

  // Wave B1 (2026-08-29) — the in-prose "Start Workshop" CTA (api.goToWorkshop,
  // wired by every module's index.tsx as onNavigateToWorkshop) used to be a
  // dead click on mobile: it called navigateToTab('workshop'), a tab
  // MobileModuleShell never mounts. It must now route to a real destination.
  describe('flag on: api.goToWorkshop (the in-prose CTA) never dead-clicks', () => {
    it('navigates straight to the playground twin when the module has one (B2 shortlist)', () => {
      mockUseIsMobileShell.mockReturnValue(true)
      renderShell(
        <ModuleShell
          manifest={{ ...base, id: 'slh-dsa' }}
          learn={(api) => <Button onClick={() => api.goToWorkshop()}>Start Workshop</Button>}
        />
      )
      fireEvent.click(screen.getByRole('button', { name: 'Start Workshop' }))
      expect(mockNavigate).toHaveBeenCalledWith('/playground/slh-dsa')
    })

    it('scrolls to the honest banner instead of a no-op when the module has no twin', () => {
      mockUseIsMobileShell.mockReturnValue(true)
      const scrollIntoView = vi.fn()
      Element.prototype.scrollIntoView = scrollIntoView
      renderShell(
        <ModuleShell
          // base.id === 'hsm-pqc': a real module, confirmed to have no
          // mobilePracticeTool (see moduleToolLinks.test.ts) — the "no twin"
          // case, not a synthetic id.
          manifest={{ ...base, workshopSteps: [{ id: 'a', label: 'A' }] }}
          learn={(api) => <Button onClick={() => api.goToWorkshop()}>Start Workshop</Button>}
        />
      )
      fireEvent.click(screen.getByRole('button', { name: 'Start Workshop' }))
      expect(mockNavigate).not.toHaveBeenCalled()
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
    })
  })
})

// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { EmbedProvider } from '@/embed/EmbedProvider'
import { ModuleShell } from './ModuleShell'
import type { ModuleManifest } from '../manifest/types'
import { useModuleStore } from '@/store/useModuleStore'

const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({
  useIsMobileShell: mockUseIsMobileShell,
}))

afterEach(() => {
  mockUseIsMobileShell.mockReturnValue(false)
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

  it('flag on: honors learnRaw over learn, matching desktop precedence', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderShell(
      <ModuleShell manifest={base} learn={<div>WRONG</div>} learnRaw={<div>RAW BODY</div>} />
    )
    expect(screen.getByText('RAW BODY')).toBeInTheDocument()
    expect(screen.queryByText('WRONG')).not.toBeInTheDocument()
  })
})

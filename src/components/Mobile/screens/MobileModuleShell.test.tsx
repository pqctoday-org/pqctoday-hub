// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobileModuleShell } from './MobileModuleShell'
import { useModuleStore } from '@/store/useModuleStore'
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

afterEach(() => {
  useModuleStore.setState({ modules: {} })
})

// A synthetic id with no entry in the real manifest registry — isolates this
// component's own conditional rendering from any real module's section/track
// data (which the "real data" path is covered by
// ModuleShell.mobileShell.test.tsx against an actual module, hsm-pqc).
const minimal: ModuleManifest = {
  id: 'not-a-real-module-fixture',
  title: 'Minimal Module',
  description: 'A minimal description',
  duration: '5 min',
  frameworkPhase: 'p0',
}

describe('MobileModuleShell', () => {
  it('renders the real title/description and the passed-through Learn content', () => {
    render(<MobileModuleShell manifest={minimal} learnContent={<div>REAL CONTENT</div>} />)
    expect(screen.getByRole('heading', { name: 'Minimal Module' })).toBeInTheDocument()
    expect(screen.getByText('A minimal description')).toBeInTheDocument()
    expect(screen.getByText('REAL CONTENT')).toBeInTheDocument()
  })

  it('omits the whyThisMatters callout, lm_id chip and section checklist when the manifest has none', () => {
    render(<MobileModuleShell manifest={minimal} learnContent={<div />} />)
    expect(screen.queryByText('Why this matters')).not.toBeInTheDocument()
    expect(screen.queryByText(/sections read/)).not.toBeInTheDocument()
  })

  it('title/description slot overrides win over the manifest defaults, matching desktop precedence', () => {
    render(
      <MobileModuleShell
        manifest={minimal}
        title="Override Title"
        description="Override description"
        learnContent={<div />}
      />
    )
    expect(screen.getByRole('heading', { name: 'Override Title' })).toBeInTheDocument()
    expect(screen.getByText('Override description')).toBeInTheDocument()
    expect(screen.queryByText('Minimal Module')).not.toBeInTheDocument()
  })

  it('notes the guided workshop is not built for mobile yet only when the module actually has workshop steps', () => {
    const { rerender } = render(<MobileModuleShell manifest={minimal} learnContent={<div />} />)
    expect(screen.queryByText(/guided workshop/)).not.toBeInTheDocument()

    rerender(
      <MobileModuleShell
        manifest={{ ...minimal, workshopSteps: [{ id: 'a', label: 'A' }] }}
        learnContent={<div />}
      />
    )
    expect(screen.getByText(/guided workshop/)).toBeInTheDocument()
  })

  // Wave B2 (2026-08-29) — the "Practice on your phone" card takes over the
  // spot the honest banner sits in, and only one of the two ever renders.
  it('renders a "Practice on your phone" card linking the twin tool when practiceTool is set, instead of the honest banner', () => {
    render(
      <MemoryRouter>
        <MobileModuleShell
          manifest={{ ...minimal, workshopSteps: [{ id: 'a', label: 'A' }] }}
          learnContent={<div />}
          practiceTool="slh-dsa"
        />
      </MemoryRouter>
    )
    const link = screen.getByRole('link', { name: /practice on your phone/i })
    expect(link).toHaveAttribute('href', '/playground/slh-dsa')
    expect(screen.queryByText(/guided workshop/)).not.toBeInTheDocument()
  })

  it('falls back to the honest banner when there is no practiceTool, even with workshop steps present', () => {
    render(
      <MemoryRouter>
        <MobileModuleShell
          manifest={{ ...minimal, workshopSteps: [{ id: 'a', label: 'A' }] }}
          learnContent={<div />}
        />
      </MemoryRouter>
    )
    expect(screen.getByText(/guided workshop/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /practice on your phone/i })).not.toBeInTheDocument()
  })
})

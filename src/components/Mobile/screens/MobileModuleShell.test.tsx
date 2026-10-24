// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobileModuleShell } from './MobileModuleShell'
import { useModuleStore } from '@/store/useModuleStore'
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { Button } from '@/components/ui/button'

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

  it('omits the whyThisMatters callout and section checklist when the manifest has none', () => {
    render(<MobileModuleShell manifest={minimal} learnContent={<div />} />)
    expect(screen.queryByText('Why this matters')).not.toBeInTheDocument()
    expect(screen.queryByText(/sections read/)).not.toBeInTheDocument()
  })

  it('does not print the internal module code above the title', () => {
    render(<MobileModuleShell manifest={{ ...minimal, lm_id: 'LM-999' }} learnContent={<div />} />)
    expect(screen.queryByText('LM-999')).not.toBeInTheDocument()
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

  // 2026-10-23 (owner decision D6) — a workshop a phone cannot run is labelled "on a
  // computer" at every entry point instead of being a button that does nothing.
  describe('desktop-only workshop (no ready workshop, no twin)', () => {
    const startHere = { step: 'a', text: 'Decode the claim.' }
    const manifest: ModuleManifest = {
      ...minimal,
      workshopSteps: [{ id: 'a', label: 'A' }],
      startHere,
    }

    it('replaces "Open this step" with the "on a computer" label', () => {
      render(
        <MemoryRouter>
          <MobileModuleShell manifest={manifest} learnContent={<div />} onStartHere={vi.fn()} />
        </MemoryRouter>
      )
      expect(screen.getByText('Decode the claim.')).toBeInTheDocument()
      expect(screen.getByText('Workshop: on a computer')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Open this step' })).not.toBeInTheDocument()
    })

    it('keeps "Open this step" when the module has a phone twin tool', () => {
      const onStartHere = vi.fn()
      render(
        <MemoryRouter>
          <MobileModuleShell
            manifest={manifest}
            learnContent={<div />}
            onStartHere={onStartHere}
            practiceTool="slh-dsa"
          />
        </MemoryRouter>
      )
      fireEvent.click(screen.getByRole('button', { name: 'Open this step' }))
      expect(onStartHere).toHaveBeenCalledTimes(1)
      expect(screen.queryByText('Workshop: on a computer')).not.toBeInTheDocument()
    })

    it("relabels the Learn content's own Start Workshop button and keeps the reading", () => {
      render(
        <MemoryRouter>
          <MobileModuleShell
            manifest={manifest}
            learnContent={
              <div>
                <p>READING STAYS</p>
                <Button>Start Workshop</Button>
              </div>
            }
          />
        </MemoryRouter>
      )
      expect(screen.getByText('READING STAYS')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Start Workshop' })).not.toBeInTheDocument()
      // the Start here line, the Learn content's own entry point and the standing banner
      expect(screen.getAllByText('Workshop: on a computer').length).toBeGreaterThanOrEqual(1)
    })

    it('leaves the Learn content Start Workshop button live when the module has a phone twin', () => {
      render(
        <MemoryRouter>
          <MobileModuleShell
            manifest={manifest}
            learnContent={<Button>Start Workshop</Button>}
            practiceTool="slh-dsa"
          />
        </MemoryRouter>
      )
      expect(screen.getByRole('button', { name: 'Start Workshop' })).toBeVisible()
    })
  })

  // Wave D (2026-09-18) — modules on MOBILE_WORKSHOP_READY mount their real
  // workshop inside the phone shell behind a Learn / Workshop switch.
  it('shows a Learn / Workshop switch and the workshop body when workshopContent is passed', () => {
    const onTabChange = vi.fn()
    const { rerender } = render(
      <MemoryRouter>
        <MobileModuleShell
          manifest={{ ...minimal, workshopSteps: [{ id: 'a', label: 'A' }] }}
          learnContent={<div>LEARN BODY</div>}
          workshopContent={<div>WORKSHOP BODY</div>}
          activeTab="learn"
          onTabChange={onTabChange}
        />
      </MemoryRouter>
    )
    expect(screen.getByRole('tab', { name: 'Learn' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('LEARN BODY')).toBeInTheDocument()
    expect(screen.queryByText('WORKSHOP BODY')).not.toBeInTheDocument()
    expect(screen.queryByText(/guided workshop/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Workshop' }))
    expect(onTabChange).toHaveBeenCalledWith('workshop')

    rerender(
      <MemoryRouter>
        <MobileModuleShell
          manifest={{ ...minimal, workshopSteps: [{ id: 'a', label: 'A' }] }}
          learnContent={<div>LEARN BODY</div>}
          workshopContent={<div>WORKSHOP BODY</div>}
          activeTab="workshop"
          onTabChange={onTabChange}
        />
      </MemoryRouter>
    )
    expect(screen.getByRole('tab', { name: 'Workshop' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('WORKSHOP BODY')).toBeInTheDocument()
    expect(screen.queryByText('LEARN BODY')).not.toBeInTheDocument()
  })
})

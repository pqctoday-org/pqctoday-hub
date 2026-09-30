// SPDX-License-Identifier: GPL-3.0-only
/**
 * One Escape closes only the TOPMOST overlay — proved on the three real
 * stacked pairs that used to close together on a single press:
 *   RevisionDrilldownPanel over ComplianceDetailDrawer,
 *   FrameworkConceptGraphModal over FrameworkDetailPopover,
 *   LeaderDetailPopover over LibraryDetailDrawer,
 *   and a global modal (the ⌘K CommandPalette) over ComplianceDetailDrawer.
 * Each nested overlay is opened through its parent's own UI.
 */
import { useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Button } from '@/components/ui/button'
import '@testing-library/jest-dom'
import { complianceFrameworks, conceptIdForFramework } from '@/data/complianceData'
import { hasGraphEdges } from '@/utils/conceptXwalkGraph'
import { libraryData } from '@/data/libraryData'
import { libraryEnrichments } from '@/data/libraryEnrichmentData'
import { relatedLeadersFor } from '@/components/Library/relatedLeaders'
import { ComplianceDetailDrawer } from '@/components/Compliance/redesign/ComplianceDetailDrawer'
import { FrameworkDetailPopover } from '@/components/Compliance/FrameworkDetailPopover'
import { LibraryDetailDrawer } from '@/components/Library/redesign/LibraryDetailDrawer'
import { CommandPalette } from '@/components/Search/CommandPalette'
import type { RevisionEntry } from '@/hooks/useRevisions'
import { overlayStackDepth } from './useOverlayEscape'
import { bodyScrollLockCount } from './useBodyScrollLock'

vi.mock('@/embed/platform', () => ({ isNativeApp: () => false }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))
vi.mock('@/components/ui/AskAssistantButton', () => ({ AskAssistantButton: () => null }))
vi.mock('@/components/Compliance/FrameworkConceptGraph', () => ({
  FrameworkConceptGraph: () => null,
}))
vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: () => false }))

const drawerFw = complianceFrameworks[0]!
const REVISION = {
  pr_number: 42,
  merge_sha: '0123456789abcdef',
  merge_timestamp: '2026-05-08T00:00:00Z',
  change_type: 'manual_data_correction',
  domain: 'compliance',
  scope_summary: 'Update refs',
  rows_affected: 1,
  module_id: null,
  tool_id: null,
  record_ids: [drawerFw.id],
  reviewer_id: 'alice',
  reviewer_display: 'Alice',
  approval_method: 'github',
  approved_via: null,
  proxy_github_handle: null,
  authored_by_llm: false,
  confidence_delta: null,
} as unknown as RevisionEntry

// Hoisted: the mock factory runs at import time, before REVISION exists.
const revs = vi.hoisted(() => ({ list: [] as RevisionEntry[] }))
vi.mock('@/hooks/useRevisions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useRevisions')>()
  return {
    ...actual,
    useRevisions: () => ({
      revisions: revs.list,
      isLoading: false,
      byDomain: (d: string) => actual.byDomain(revs.list, d),
      byRecord: (d: string, id: string) => actual.byRecord(revs.list, d, id),
    }),
  }
})

const esc = () => fireEvent.keyDown(document, { key: 'Escape' })
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

describe('Stacked overlays — one Escape closes only the top one', () => {
  beforeEach(() => {
    revs.list = [REVISION]
    expect(overlayStackDepth()).toBe(0)
  })

  it('RevisionDrilldownPanel over ComplianceDetailDrawer', () => {
    function Host() {
      const [open, setOpen] = useState(true)
      return (
        <ComplianceDetailDrawer
          framework={open ? drawerFw : null}
          pillar="comply"
          onClose={() => setOpen(false)}
        />
      )
    }
    render(
      <MemoryRouter>
        <Host />
      </MemoryRouter>
    )
    const drawer = screen.getByRole('dialog', { name: / detail$/ })
    fireEvent.click(within(drawer).getByRole('button', { name: /Reviewed/ }))
    expect(screen.getByRole('dialog', { name: /Revision history/ })).toBeInTheDocument()
    expect(bodyScrollLockCount()).toBe(2)

    esc()
    expect(screen.queryByRole('dialog', { name: /Revision history/ })).toBeNull()
    expect(screen.getByRole('dialog', { name: / detail$/ })).toBeInTheDocument()
    expect(document.body.style.overflow).toBe('hidden')

    esc()
    expect(screen.queryAllByRole('dialog')).toHaveLength(0)
    expect(document.body.style.overflow).toBe('')
  })

  it('FrameworkConceptGraphModal over FrameworkDetailPopover', () => {
    const fw = complianceFrameworks.find((f) => {
      const id = conceptIdForFramework(f)
      return id !== undefined && hasGraphEdges(id)
    })
    expect(fw).toBeDefined()
    function Host() {
      const [open, setOpen] = useState(true)
      return <FrameworkDetailPopover isOpen={open} framework={fw!} onClose={() => setOpen(false)} />
    }
    render(
      <MemoryRouter>
        <Host />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Open concept graph' }))
    const [popover, graph] = screen.getAllByRole('dialog')
    expect(within(graph!).queryByRole('button', { name: 'Open concept graph' })).toBeNull()

    esc()
    expect(graph).not.toBeInTheDocument()
    expect(popover).toBeInTheDocument()
    expect(screen.getAllByRole('dialog')).toEqual([popover])
    expect(document.body.style.overflow).toBe('hidden')

    esc()
    expect(screen.queryAllByRole('dialog')).toHaveLength(0)
    expect(document.body.style.overflow).toBe('')
  })

  it('LeaderDetailPopover over LibraryDetailDrawer', () => {
    const item = libraryData.find(
      (i) => libraryEnrichments[i.referenceId] && relatedLeadersFor(i).length > 0
    )
    expect(item).toBeDefined()
    const leader = relatedLeadersFor(item!)[0]!
    function Host() {
      const [open, setOpen] = useState(true)
      return (
        <LibraryDetailDrawer
          item={open ? item! : null}
          bookmarked={false}
          onToggleBookmark={() => undefined}
          onClose={() => setOpen(false)}
        />
      )
    }
    render(
      <MemoryRouter>
        <Host />
      </MemoryRouter>
    )
    const drawer = screen.getByRole('dialog', { name: item!.documentTitle })
    fireEvent.click(within(drawer).getByRole('button', { name: /Document Analysis/ }))
    fireEvent.click(within(drawer).getByRole('button', { name: new RegExp(escapeRe(leader.name)) }))
    const leaderName = new RegExp(escapeRe(leader.name))
    expect(screen.getByRole('dialog', { name: leaderName })).toBeInTheDocument()

    esc()
    expect(screen.queryByRole('dialog', { name: leaderName })).toBeNull()
    expect(screen.getByRole('dialog', { name: item!.documentTitle })).toBeInTheDocument()
    expect(document.body.style.overflow).toBe('hidden')

    esc()
    expect(screen.queryAllByRole('dialog')).toHaveLength(0)
    expect(document.body.style.overflow).toBe('')
  })

  it('CommandPalette (⌘K) over ComplianceDetailDrawer', async () => {
    function Host() {
      const [drawer, setDrawer] = useState(true)
      const [palette, setPalette] = useState(false)
      return (
        <>
          <ComplianceDetailDrawer
            framework={drawer ? drawerFw : null}
            pillar="comply"
            onClose={() => setDrawer(false)}
          />
          <Button type="button" onClick={() => setPalette(true)}>
            open palette
          </Button>
          <CommandPalette isOpen={palette} onClose={() => setPalette(false)} />
        </>
      )
    }
    render(
      <MemoryRouter>
        <Host />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'open palette', hidden: true }))
    const input = screen.getByRole('combobox', { name: 'Search' })
    input.focus()

    fireEvent.keyDown(input, { key: 'Escape' })
    // The palette animates out (AnimatePresence); the drawer must stay.
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Search PQC Today' })).toBeNull()
    )
    expect(screen.getByRole('dialog', { name: / detail$/ })).toBeInTheDocument()

    esc()
    expect(screen.queryAllByRole('dialog')).toHaveLength(0)
  })
})

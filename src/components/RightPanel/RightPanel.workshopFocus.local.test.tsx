// SPDX-License-Identifier: AGPL-3.0-only
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RightPanel } from './RightPanel'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { useWorkshopStore } from '@/store/useWorkshopStore'
import { Button } from '@/components/ui/button'
const viewport = vi.hoisted(() => ({ narrow: false }))
vi.mock('@/hooks/useIsBelowLgViewport', () => ({ useIsBelowLgViewport: () => viewport.narrow }))
vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: () => viewport.narrow }))
vi.mock('./ChatPanelContent', () => ({
  ChatPanelContent: () => <Button>Sample assistant control</Button>,
}))
vi.mock('./WorkshopPanel', () => ({
  WorkshopPanel: () => <Button>Sample workshop control</Button>,
}))
beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: viewport.narrow,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  )
  viewport.narrow = false
  useWorkshopStore.getState().reset()
  useWorkshopStore.setState({ mode: 'running' })
  useRightPanelStore.setState({ isOpen: true, activeTab: 'workshop', isExpanded: false })
})
afterEach(() => vi.unstubAllGlobals())
function mount() {
  return render(
    <>
      <Button>Sample resource action</Button>
      <RightPanel />
    </>
  )
}
async function assertResourceFocusAllowed() {
  const resource = screen.getByRole('button', { name: 'Sample resource action' })
  act(() => resource.focus())
  await waitFor(() => expect(resource).toHaveFocus())
}
async function assertTrapped(label: string) {
  const dialog = screen.getByRole('dialog', { name: label })
  act(() => screen.getByRole('button', { name: 'Sample resource action' }).focus())
  await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))
}
describe('Real focus-lock behavior for guided workshops versus modal panels', () => {
  it.each(['running', 'paused'] as const)(
    'permits resource focus during a desktop %s workshop',
    async (mode) => {
      useWorkshopStore.setState({ mode })
      mount()
      await screen.findByRole('button', { name: 'Sample workshop control' })
      expect(screen.getByRole('dialog', { name: 'Workshop' })).toHaveAttribute(
        'aria-modal',
        'false'
      )
      await assertResourceFocusAllowed()
      const user = userEvent.setup()
      await user.keyboard('{Enter}')
      expect(useWorkshopStore.getState().mode).toBe(mode)
    }
  )
  it.each(['idle', 'video'] as const)(
    'retains the trap for the %s workshop surface',
    async (mode) => {
      useWorkshopStore.setState({ mode })
      mount()
      await screen.findByRole('button', { name: 'Sample workshop control' })
      await assertTrapped('Workshop')
    }
  )
  it('retains phone workshop focus containment', async () => {
    viewport.narrow = true
    mount()
    await screen.findByRole('button', { name: 'Sample workshop control' })
    await assertTrapped('Workshop')
  })
  it('reactivates the Assistant trap when switching from the modeless workshop', async () => {
    mount()
    await screen.findByRole('button', { name: 'Sample workshop control' })
    await assertResourceFocusAllowed()
    await userEvent.click(screen.getByRole('tab', { name: 'Assistant' }))
    await screen.findByRole('button', { name: 'Sample assistant control' })
    await assertTrapped('PQC Assistant')
  })
})

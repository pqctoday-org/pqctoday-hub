// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom'
import { RightPanel } from './RightPanel'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { useAssistantWidthStore } from '@/store/useAssistantWidthStore'

const layout = vi.hoisted(() => ({ value: 'docked' as 'docked' | 'sheet' }))
vi.mock('./BookmarksPanel', () => ({ BookmarksPanel: () => <p>Saved items</p> }))
vi.mock('../Assistant/useAssistantLayout', async (orig) => ({
  ...(await orig<typeof import('../Assistant/useAssistantLayout')>()),
  useAssistantLayout: () => layout.value,
}))

const setViewport = (px: number) =>
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: px })

beforeEach(() => {
  layout.value = 'docked'
  setViewport(1440)
  localStorage.clear()
  useAssistantWidthStore.getState().reset()
  useRightPanelStore.setState({ isOpen: true, activeTab: 'chat' })
})
afterEach(() => setViewport(1024))

const mount = () =>
  render(
    <MemoryRouter>
      <RightPanel />
    </MemoryRouter>
  )

const region = () => screen.getByRole('region', { name: 'Assistant' })
const handle = () => screen.getByRole('separator', { name: 'Resize the Assistant' })

describe('the docked drawer width', () => {
  it('is 520 px on a wide window, with a labelled resize handle on its left edge', () => {
    mount()
    expect(region()).toHaveStyle({ width: '520px' })
    expect(handle()).toHaveAttribute('aria-orientation', 'vertical')
    expect(handle()).toHaveAttribute('aria-valuemin', '400')
    expect(handle()).toHaveAttribute('aria-valuemax', '640')
    expect(handle()).toHaveAttribute('aria-valuenow', '520')
    expect(handle()).toHaveAttribute('tabindex', '0')
  })

  it('moves by 20 px with the arrow keys on the handle (Left: wider), and resets on a double click', async () => {
    const user = userEvent.setup()
    mount()
    handle().focus()
    await user.keyboard('{ArrowLeft}')
    expect(region()).toHaveStyle({ width: '540px' })
    expect(handle()).toHaveAttribute('aria-valuenow', '540')
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(region()).toHaveStyle({ width: '500px' })
    await user.dblClick(handle())
    expect(region()).toHaveStyle({ width: '520px' })
    expect(useAssistantWidthStore.getState().width).toBeNull()
  })

  it('has Wider and Narrower buttons that step by 60 px and use aria-disabled at the limits', async () => {
    const user = userEvent.setup()
    mount()
    await user.click(screen.getByRole('button', { name: 'Wider' }))
    expect(region()).toHaveStyle({ width: '580px' })
    await user.click(screen.getByRole('button', { name: 'Wider' }))
    expect(region()).toHaveStyle({ width: '640px' })
    const wider = screen.getByRole('button', { name: 'Wider' })
    expect(wider).toHaveAttribute('aria-disabled', 'true')
    expect(wider).not.toBeDisabled()
    await user.click(wider)
    expect(region()).toHaveStyle({ width: '640px' })
    await user.click(screen.getByRole('button', { name: 'Narrower' }))
    await user.click(screen.getByRole('button', { name: 'Narrower' }))
    await user.click(screen.getByRole('button', { name: 'Narrower' }))
    expect(region()).toHaveStyle({ width: '460px' })
    await user.click(screen.getByRole('button', { name: 'Narrower' }))
    await user.click(screen.getByRole('button', { name: 'Narrower' }))
    expect(region()).toHaveStyle({ width: '400px' })
    expect(screen.getByRole('button', { name: 'Narrower' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
  })

  it('is shared by the other drawer views, which carry the handle but not the buttons', () => {
    useRightPanelStore.setState({ isOpen: true, activeTab: 'bookmarks' })
    useAssistantWidthStore.getState().setWidth(600)
    mount()
    expect(screen.getByRole('region', { name: 'Bookmarks' })).toHaveStyle({ width: '600px' })
    expect(screen.queryByRole('button', { name: 'Wider' })).toBeNull()
    expect(handle()).toBeInTheDocument()
  })

  it('has no handle and no width buttons on the full-screen sheet', () => {
    layout.value = 'sheet'
    mount()
    expect(screen.getByRole('dialog', { name: 'Assistant' })).toHaveClass('w-full')
    expect(screen.queryByRole('separator')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Wider' })).toBeNull()
  })
})

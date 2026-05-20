// SPDX-License-Identifier: GPL-3.0-only
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Tabs } from '@/components/ui/tabs'
import { ModuleTabBar } from './ModuleTabBar'

const SIX_TABS = [
  { value: 'learn', label: 'Learn' },
  { value: 'visual', label: 'Visual' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'exercises', label: 'Exercises' },
  { value: 'references', label: 'References' },
  { value: 'tools', label: 'Tools & Products' },
]

function renderBar(
  tabs = SIX_TABS,
  value = 'learn',
  onValueChange = vi.fn(),
  visibleOnMobile?: number
) {
  return render(
    <Tabs value={value} onValueChange={onValueChange}>
      <ModuleTabBar
        tabs={tabs}
        value={value}
        onValueChange={onValueChange}
        {...(visibleOnMobile !== undefined ? { visibleOnMobile } : {})}
      />
    </Tabs>
  )
}

describe('ModuleTabBar', () => {
  it('renders all tab labels', () => {
    renderBar()
    SIX_TABS.forEach((t) => {
      expect(screen.getByRole('button', { name: new RegExp(t.label, 'i') })).toBeInTheDocument()
    })
  })

  it('no overflow trigger when tabs <= visibleOnMobile', () => {
    const three = SIX_TABS.slice(0, 3)
    renderBar(three, 'learn', vi.fn(), 3)
    expect(screen.queryByRole('button', { name: /more tabs/i })).not.toBeInTheDocument()
  })

  it('renders overflow trigger when tabs > visibleOnMobile', () => {
    renderBar(SIX_TABS, 'learn', vi.fn(), 3)
    expect(screen.getByRole('button', { name: /more tabs/i })).toBeInTheDocument()
  })

  it('renders hasDot indicator on tab trigger', () => {
    const tabs = [
      { value: 'learn', label: 'Learn' },
      { value: 'workshop', label: 'Workshop', hasDot: true },
    ]
    renderBar(tabs, 'learn', vi.fn(), 3)
    // dot is aria-hidden span inside the Workshop button
    const workshopBtn = screen.getByRole('button', { name: /workshop/i })
    // eslint-disable-next-line testing-library/no-node-access
    const dot = workshopBtn.querySelector('span[aria-hidden="true"]')
    expect(dot).toBeInTheDocument()
  })

  it('overflow trigger shows dot when an overflow tab has hasDot', () => {
    const tabs = [
      { value: 'learn', label: 'Learn' },
      { value: 'visual', label: 'Visual' },
      { value: 'workshop', label: 'Workshop' },
      { value: 'exercises', label: 'Exercises', hasDot: true },
    ]
    renderBar(tabs, 'learn', vi.fn(), 3)
    const moreBtn = screen.getByRole('button', { name: /more tabs/i })
    const dot = moreBtn.querySelector('span[aria-hidden="true"]')
    expect(dot).toBeInTheDocument()
  })

  it('overflow trigger has no dot when no overflow tab has hasDot', () => {
    renderBar(SIX_TABS, 'learn', vi.fn(), 3)
    const moreBtn = screen.getByRole('button', { name: /more tabs/i })
    const dot = moreBtn.querySelector('span[aria-hidden="true"]')
    expect(dot).not.toBeInTheDocument()
  })

  it('clicking overflow trigger opens the popover', async () => {
    renderBar(SIX_TABS, 'learn', vi.fn(), 3)
    const moreBtn = screen.getByRole('button', { name: /more tabs/i })
    expect(moreBtn).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(moreBtn)
    expect(moreBtn).toHaveAttribute('aria-expanded', 'true')
    // Overflow items are now visible — two Exercises buttons exist (hidden inline + popover)
    const exercisesBtns = screen.getAllByRole('button', { name: /exercises/i })
    expect(exercisesBtns.length).toBeGreaterThanOrEqual(2)
  })

  it('clicking overflow trigger again closes the popover', async () => {
    renderBar(SIX_TABS, 'learn', vi.fn(), 3)
    const moreBtn = screen.getByRole('button', { name: /more tabs/i })
    await userEvent.click(moreBtn)
    await userEvent.click(moreBtn)
    expect(moreBtn).toHaveAttribute('aria-expanded', 'false')
  })

  it('clicking an overflow item calls onValueChange and closes popover', async () => {
    const handler = vi.fn()
    renderBar(SIX_TABS, 'learn', handler, 3)
    await userEvent.click(screen.getByRole('button', { name: /more tabs/i }))
    // Two Exercises buttons: hidden inline TabsTrigger + popover Button — click the popover one (last)
    const exercisesBtns = screen.getAllByRole('button', { name: /exercises/i })
    await userEvent.click(exercisesBtns[exercisesBtns.length - 1])
    expect(handler).toHaveBeenCalledWith('exercises')
    expect(screen.getByRole('button', { name: /more tabs/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
  })

  it('click outside the overflow popover closes it', async () => {
    renderBar(SIX_TABS, 'learn', vi.fn(), 3)
    await userEvent.click(screen.getByRole('button', { name: /more tabs/i }))
    fireEvent.mouseDown(document.body)
    expect(screen.getByRole('button', { name: /more tabs/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
  })

  it('inline tabs beyond visibleOnMobile carry hidden class', () => {
    renderBar(SIX_TABS, 'learn', vi.fn(), 3)
    // The 4th tab (Exercises) should have hidden sm:inline-flex — not plain inline-flex
    const exercisesBtn = screen.getAllByRole('button', { name: /exercises/i })[0]
    expect(exercisesBtn.className).toContain('hidden')
    expect(exercisesBtn.className).toContain('sm:inline-flex')
  })

  it('active overflow tab marks the ··· trigger with active styling', () => {
    renderBar(SIX_TABS, 'exercises', vi.fn(), 3)
    const moreBtn = screen.getByRole('button', { name: /more tabs/i })
    expect(moreBtn.className).toContain('bg-background')
  })
})

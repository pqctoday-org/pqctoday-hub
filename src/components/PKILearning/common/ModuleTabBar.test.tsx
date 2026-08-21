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
      expect(screen.getByRole('tab', { name: new RegExp(t.label, 'i') })).toBeInTheDocument()
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
    const workshopBtn = screen.getByRole('tab', { name: /workshop/i })
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
    const exercisesBtns = screen.getAllByRole('tab', { name: /exercises/i })
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
    const exercisesBtns = screen.getAllByRole('tab', { name: /exercises/i })
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
    const exercisesBtn = screen.getAllByRole('tab', { name: /exercises/i })[0]
    expect(exercisesBtn.className).toContain('hidden')
    expect(exercisesBtn.className).toContain('sm:inline-flex')
  })

  it('active overflow tab marks the ··· trigger with active styling', () => {
    renderBar(SIX_TABS, 'exercises', vi.fn(), 3)
    const moreBtn = screen.getByRole('button', { name: /more tabs/i })
    expect(moreBtn.className).toContain('bg-background')
  })
  // ---- WS7: WAI-ARIA tab pattern (container + mobile overflow popover) ----

  it('wraps the inline triggers in a labelled role="tablist"', () => {
    renderBar()
    const list = screen.getByRole('tablist', { name: 'Module sections' })
    // The ··· disclosure must NOT be owned by the tablist — tablist may only
    // own role="tab" children.
    // eslint-disable-next-line testing-library/no-node-access
    expect(list.querySelector('[aria-label="More tabs"]')).toBeNull()
  })

  it('marks exactly the active tab aria-selected and gives it the only tab stop', () => {
    renderBar(SIX_TABS, 'workshop', vi.fn(), 3)
    const tabs = screen.getAllByRole('tab')
    const selected = tabs.filter((t) => t.getAttribute('aria-selected') === 'true')
    expect(selected).toHaveLength(1)
    expect(selected[0]).toHaveAccessibleName(/workshop/i)
    expect(tabs.filter((t) => t.getAttribute('tabindex') === '0')).toHaveLength(1)
  })

  it('overflow popover items are real tabs inside their own vertical tablist', async () => {
    renderBar(SIX_TABS, 'learn', vi.fn(), 3)
    await userEvent.click(screen.getByRole('button', { name: /more tabs/i }))
    const popover = screen.getByRole('tablist', { name: 'More module sections' })
    expect(popover).toHaveAttribute('aria-orientation', 'vertical')
    // eslint-disable-next-line testing-library/no-node-access
    const items = popover.querySelectorAll('[role="tab"]')
    expect(items).toHaveLength(3) // exercises, references, tools
    items.forEach((el) => expect(el).toHaveAttribute('aria-selected'))
  })

  it('overflow popover reflects the active tab with aria-selected', async () => {
    renderBar(SIX_TABS, 'references', vi.fn(), 3)
    await userEvent.click(screen.getByRole('button', { name: /more tabs/i }))
    const popover = screen.getByRole('tablist', { name: 'More module sections' })
    // eslint-disable-next-line testing-library/no-node-access
    const active = popover.querySelector('[role="tab"][aria-selected="true"]')
    expect(active).toHaveTextContent('References')
  })

  it('ArrowRight/Home/End rove focus across the inline tablist', async () => {
    const handler = vi.fn()
    renderBar(SIX_TABS, 'learn', handler, 3)
    const tabs = screen.getAllByRole('tab')
    tabs[0].focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(tabs[1])
    expect(handler).toHaveBeenLastCalledWith('visual')
    await userEvent.keyboard('{End}')
    expect(document.activeElement).toBe(tabs[tabs.length - 1])
    await userEvent.keyboard('{Home}')
    expect(document.activeElement).toBe(tabs[0])
    await userEvent.keyboard('{ArrowLeft}')
    expect(document.activeElement).toBe(tabs[tabs.length - 1])
  })

  it('ArrowDown roves focus inside the vertical overflow popover, Escape closes it', async () => {
    renderBar(SIX_TABS, 'learn', vi.fn(), 3)
    const moreBtn = screen.getByRole('button', { name: /more tabs/i })
    await userEvent.click(moreBtn)
    const popover = screen.getByRole('tablist', { name: 'More module sections' })
    // eslint-disable-next-line testing-library/no-node-access
    const items = Array.from(popover.querySelectorAll<HTMLElement>('[role="tab"]'))
    // opening the menu lands focus on its tab stop
    expect(document.activeElement).toBe(items[0])
    await userEvent.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(items[1])
    await userEvent.keyboard('{Escape}')
    expect(moreBtn).toHaveAttribute('aria-expanded', 'false')
    expect(document.activeElement).toBe(moreBtn)
  })
})

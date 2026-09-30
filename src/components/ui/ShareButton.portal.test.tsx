import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ShareButton } from './ShareButton'

vi.mock('../../embed/platform', () => ({ isNativeApp: () => false }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))

describe('ShareButton portal mode (inside an overlay)', () => {
  beforeEach(() => {
    // jsdom has no navigator.share → the menu path is taken
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
  })

  it('renders the menu outside the overlay and copies the absolute item link', async () => {
    render(
      <div data-testid="drawer" style={{ overflow: 'hidden', transform: 'translateX(0)' }}>
        <ShareButton title="FIPS 203" url="/library?ref=FIPS%20203" portal />
      </div>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Share FIPS 203' }))
    const menu = screen.getByRole('menu')
    expect(screen.getByTestId('drawer').contains(menu)).toBe(false)
    expect(menu.closest('[data-no-focus-lock]')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Copy link/ }))
    await vi.waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `${window.location.origin}/library?ref=FIPS%20203`
      )
    )
  })

  it('Escape closes only the menu, not the overlay listening on document', () => {
    const overlayEscape = vi.fn()
    document.addEventListener('keydown', overlayEscape)
    render(<ShareButton title="X" url="/threats?id=FIN-001" portal />)
    fireEvent.click(screen.getByRole('button', { name: 'Share X' }))
    expect(screen.getByRole('menu')).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).toBeNull()
    expect(overlayEscape).not.toHaveBeenCalled()
    document.removeEventListener('keydown', overlayEscape)
  })

  it('a mousedown inside the menu does not reach document outside-click handlers', () => {
    const outside = vi.fn()
    document.addEventListener('mousedown', outside)
    render(<ShareButton title="X" url="/patents?patent=US1" portal />)
    fireEvent.click(screen.getByRole('button', { name: 'Share X' }))
    fireEvent.mouseDown(screen.getByRole('button', { name: /Copy link/ }))
    expect(outside).not.toHaveBeenCalled()
    document.removeEventListener('mousedown', outside)
  })
})

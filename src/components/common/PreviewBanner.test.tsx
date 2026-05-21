// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PreviewBanner } from './PreviewBanner'

vi.mock('@/utils/analytics', () => ({
  logPreviewBannerShown: vi.fn(),
  logPreviewBannerDismissed: vi.fn(),
}))

const renderBanner = (props: { pageContext?: string; dismissKey?: string } = {}, route = '/x') =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <PreviewBanner {...props} />
    </MemoryRouter>
  )

describe('PreviewBanner', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('renders the locked-preview copy by default', () => {
    renderBanner()
    expect(screen.getByText(/preview locked/i)).toBeInTheDocument()
  })

  it('renders pageContext copy when provided', () => {
    renderBanner({ pageContext: 'Architect, Developer' })
    expect(screen.getByText(/most useful for/i)).toBeInTheDocument()
    expect(screen.getByText('Architect, Developer')).toBeInTheDocument()
  })

  it('logs a Shown event on mount keyed by route', async () => {
    const { logPreviewBannerShown } = await import('@/utils/analytics')
    renderBanner({}, '/algorithms')
    expect(logPreviewBannerShown).toHaveBeenCalledWith('/algorithms')
  })

  it('dismiss button hides the banner, persists in sessionStorage, and logs Dismissed', async () => {
    const { logPreviewBannerDismissed } = await import('@/utils/analytics')
    renderBanner({}, '/migrate')
    fireEvent.click(screen.getByLabelText(/dismiss preview banner/i))
    expect(screen.queryByText(/preview locked/i)).not.toBeInTheDocument()
    expect(sessionStorage.getItem('preview-banner-dismissed:/migrate')).toBe('1')
    expect(logPreviewBannerDismissed).toHaveBeenCalledWith('/migrate')
  })

  it('skips rendering if sessionStorage already marks the key dismissed', () => {
    sessionStorage.setItem('preview-banner-dismissed:/threats', '1')
    const { container } = renderBanner({}, '/threats')
    expect(container.firstChild).toBeNull()
  })

  it('honors explicit dismissKey override', () => {
    sessionStorage.setItem('preview-banner-dismissed:custom-key', '1')
    const { container } = renderBanner({ dismissKey: 'custom-key' }, '/whatever')
    expect(container.firstChild).toBeNull()
  })
})

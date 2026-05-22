// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TopThreeActions, type TopThreeAction } from './TopThreeActions'

vi.mock('@/utils/analytics', () => ({
  logEvent: vi.fn(),
  personaLabel: (l?: string) => l,
}))

const sampleActions: TopThreeAction[] = [
  { id: 'assess', label: 'Run an assessment', description: '~3 min', href: '/assess' },
  { id: 'compliance', label: 'Check deadlines', href: '/compliance' },
  { id: 'report', label: 'View your report', href: '/report' },
  { id: 'extra', label: 'Should be dropped', href: '/x' },
]

const renderActions = (actions: TopThreeAction[], source = 'test') =>
  render(
    <MemoryRouter>
      <TopThreeActions actions={actions} source={source} />
    </MemoryRouter>
  )

describe('TopThreeActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing for an empty actions array', () => {
    const { container } = renderActions([])
    expect(container.firstChild).toBeNull()
  })

  it('caps at 3 actions even when more are passed', () => {
    renderActions(sampleActions)
    expect(screen.getByText('Run an assessment')).toBeInTheDocument()
    expect(screen.getByText('Check deadlines')).toBeInTheDocument()
    expect(screen.getByText('View your report')).toBeInTheDocument()
    expect(screen.queryByText('Should be dropped')).not.toBeInTheDocument()
  })

  it('uses default heading "Do this now"', () => {
    renderActions(sampleActions.slice(0, 1))
    expect(screen.getByText('Do this now')).toBeInTheDocument()
  })

  it('supports a custom heading', () => {
    render(
      <MemoryRouter>
        <TopThreeActions
          actions={sampleActions.slice(0, 1)}
          source="custom"
          heading="Top priorities"
        />
      </MemoryRouter>
    )
    expect(screen.getByText('Top priorities')).toBeInTheDocument()
  })

  it('fires Action Clicked with source + position + id on click', async () => {
    const { logEvent } = await import('@/utils/analytics')
    renderActions(sampleActions, 'business-center')
    fireEvent.click(screen.getByRole('link', { name: /1\. Run an assessment/i }))
    expect(logEvent).toHaveBeenCalledWith(
      'Top Three Actions',
      'Action Clicked',
      'business-center:1:assess'
    )
  })

  it('invokes onClick when no href is provided', async () => {
    const onClick = vi.fn()
    const { logEvent } = await import('@/utils/analytics')
    render(
      <MemoryRouter>
        <TopThreeActions actions={[{ id: 'foo', label: 'Foo', onClick }]} source="test" />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: /1\. Foo/i }))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(logEvent).toHaveBeenCalledWith('Top Three Actions', 'Action Clicked', 'test:1:foo')
  })
})

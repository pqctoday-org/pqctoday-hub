// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FlagButton } from './FlagButton'
import { useEndorsementStore } from '@/store/useEndorsementStore'

describe('FlagButton', () => {
  beforeEach(() => {
    useEndorsementStore.setState({ records: {} })
  })

  const baseProps = {
    flagUrl: 'https://github.com/pqctoday/pqctoday-hub/discussions/new?category=test',
    resourceLabel: 'FIPS-203',
    resourceType: 'Library',
  }

  it('renders icon variant by default', () => {
    render(<FlagButton {...baseProps} />)
    const btn = screen.getByRole('button', { name: /flag issue with fips-203/i })
    expect(btn).toBeInTheDocument()
  })

  it('renders text variant with label', () => {
    render(<FlagButton {...baseProps} variant="text" label="Report" />)
    const btn = screen.getByRole('button', { name: /flag issue with fips-203/i })
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveTextContent('Report')
  })

  it('opens URL in new window on click', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    render(<FlagButton {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: /flag issue with fips-203/i }))
    expect(openSpy).toHaveBeenCalledWith(baseProps.flagUrl, '_blank', 'noopener,noreferrer')
    openSpy.mockRestore()
  })

  it('stops event propagation on click', () => {
    const parentClick = vi.fn()
    render(
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
      <div onClick={parentClick}>
        <FlagButton {...baseProps} />
      </div>
    )
    fireEvent.click(screen.getByRole('button', { name: /flag issue with fips-203/i }))
    expect(parentClick).not.toHaveBeenCalled()
  })
})

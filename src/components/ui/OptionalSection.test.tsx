// SPDX-License-Identifier: GPL-3.0-only
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { OptionalSection } from './OptionalSection'

function Broken(): never {
  throw new Error('Failed to fetch dynamically imported module')
}

describe('OptionalSection', () => {
  afterEach(() => vi.restoreAllMocks())

  it('shows its content when nothing goes wrong', () => {
    render(
      <OptionalSection>
        <p>maintainers</p>
      </OptionalSection>
    )
    expect(screen.getByText('maintainers')).toBeInTheDocument()
  })

  it('leaves the section out, and only that section, when it throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(
      <div>
        <h2>Product</h2>
        <OptionalSection>
          <Broken />
        </OptionalSection>
      </div>
    )
    expect(screen.getByText('Product')).toBeInTheDocument()
    expect(screen.queryByText(/something went wrong/i)).toBeNull()
    expect(warn).toHaveBeenCalledOnce()
  })
})

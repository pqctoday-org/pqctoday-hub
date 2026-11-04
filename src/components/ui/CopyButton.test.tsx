// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CopyButton } from './CopyButton'

describe('CopyButton accessible name', () => {
  it('has the name "Copy" by default', () => {
    render(<CopyButton text="abc" />)
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
  })

  it('uses the given label as its name', () => {
    render(<CopyButton text="abc" label="Copy hash" />)
    expect(screen.getByRole('button', { name: 'Copy hash' })).toBeInTheDocument()
  })

  it('an icon-only button (empty label) is still named "Copy" and shows no visible label', () => {
    render(<CopyButton text="abc" label="" />)
    const b = screen.getByRole('button', { name: 'Copy' })
    expect(b).toHaveAttribute('title', 'Copy')
    expect(b.textContent).toBe('')
  })
})

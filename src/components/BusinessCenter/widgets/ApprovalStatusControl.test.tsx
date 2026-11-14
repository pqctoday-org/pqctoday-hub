// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ApprovalStatusControl } from './ApprovalStatusControl'

describe('ApprovalStatusControl practice states', () => {
  it('labels the three states as practice states', () => {
    const { container } = render(<ApprovalStatusControl status="draft" />)
    expect(screen.getByText('Practice state')).toBeInTheDocument()
    expect(container.firstElementChild).toHaveAttribute(
      'title',
      expect.stringContaining('Practice states for learning how a document moves through review')
    )
  })

  it('never prints a saved person name; it shows the generic phrase instead', () => {
    const { container } = render(<ApprovalStatusControl status="approved" reviewer="R. Reviewer" />)
    expect(screen.getByText('· example reviewer role')).toBeInTheDocument()
    expect(container.textContent).not.toContain('R. Reviewer')
    expect(container.innerHTML).not.toContain('R. Reviewer')
  })

  it('shows a stored role that is on the list', () => {
    render(<ApprovalStatusControl status="in-review" reviewer="CISO" />)
    expect(screen.getByText('· CISO')).toBeInTheDocument()
  })

  it('offers a choice of example roles, not a free-text name box', () => {
    render(<ApprovalStatusControl status="draft" onAdvance={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /In review/ }))
    expect(screen.queryByPlaceholderText(/Reviewer name/)).not.toBeInTheDocument()
    const select = screen.getByRole('combobox', { name: 'Example reviewer role' })
    const options = Array.from(select.querySelectorAll('option')).map((o) => o.textContent)
    expect(options).toEqual([
      'Example reviewer role (optional)',
      'CISO',
      'Security architect',
      'Compliance lead',
      'IT operations lead',
      'Product owner',
    ])
  })

  it('advances with the chosen example role and never with a typed name', () => {
    const onAdvance = vi.fn()
    render(<ApprovalStatusControl status="draft" onAdvance={onAdvance} />)
    fireEvent.click(screen.getByRole('button', { name: /In review/ }))
    fireEvent.change(screen.getByRole('combobox', { name: 'Example reviewer role' }), {
      target: { value: 'Compliance lead' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(onAdvance).toHaveBeenCalledWith('in-review', 'Compliance lead')
  })

  it('does not preselect a saved person name in the role choice', () => {
    const onAdvance = vi.fn()
    render(
      <ApprovalStatusControl status="in-review" reviewer="R. Reviewer" onAdvance={onAdvance} />
    )
    fireEvent.click(screen.getByRole('button', { name: /Approved/ }))
    const select = screen.getByRole('combobox', {
      name: 'Example reviewer role',
    }) as HTMLSelectElement
    expect(select.value).toBe('')
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(onAdvance).toHaveBeenCalledWith('approved', undefined)
  })
})

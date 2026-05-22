// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ResearcherTaxonomyFilter } from './ResearcherTaxonomyFilter'

describe('ResearcherTaxonomyFilter', () => {
  it('renders Algorithm and Standard top-level buttons collapsed by default', () => {
    render(
      <ResearcherTaxonomyFilter
        selection={{ algorithm: null, standard: null }}
        onChange={() => {}}
      />
    )
    expect(screen.getByRole('button', { name: /Algorithm/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Standard/ })).toBeInTheDocument()
    // No listbox open until a category is clicked
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('opens the algorithm listbox when the Algorithm button is clicked', () => {
    render(
      <ResearcherTaxonomyFilter
        selection={{ algorithm: null, standard: null }}
        onChange={() => {}}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Algorithm/ }))
    expect(screen.getByRole('listbox', { name: /Algorithms/i })).toBeInTheDocument()
    // ML-KEM chip is rendered as an option
    expect(screen.getByRole('option', { name: /ML-KEM/ })).toBeInTheDocument()
  })

  it('publishes a selection upward when an algorithm option is clicked', () => {
    const onChange = vi.fn()
    render(
      <ResearcherTaxonomyFilter
        selection={{ algorithm: null, standard: null }}
        onChange={onChange}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Algorithm/ }))
    fireEvent.click(screen.getByRole('option', { name: /ML-DSA/ }))
    expect(onChange).toHaveBeenCalledWith({ algorithm: 'ML-DSA', standard: null })
  })

  it('selecting a standard clears any algorithm selection (mutually exclusive)', () => {
    const onChange = vi.fn()
    render(
      <ResearcherTaxonomyFilter
        selection={{ algorithm: 'ML-KEM', standard: null }}
        onChange={onChange}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Standard/ }))
    fireEvent.click(screen.getByRole('option', { name: /FIPS 203/ }))
    expect(onChange).toHaveBeenCalledWith({ algorithm: null, standard: 'FIPS 203' })
  })

  it('Clear button resets both selections', () => {
    const onChange = vi.fn()
    render(
      <ResearcherTaxonomyFilter
        selection={{ algorithm: 'ML-KEM', standard: null }}
        onChange={onChange}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Clear/ }))
    expect(onChange).toHaveBeenCalledWith({ algorithm: null, standard: null })
  })
})

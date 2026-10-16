// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { InlineScopeStep, isScopeIncomplete, scopeValue } from './InlineScopeStep'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useAssessmentFormStore } from '@/store/useAssessmentFormStore'

vi.mock('@/utils/analytics', () => ({ logIndustrySelected: vi.fn() }))

const COUNTRIES = ['France', 'Germany', 'United States']

describe('InlineScopeStep', () => {
  beforeEach(() => {
    usePersonaStore.setState({ selectedIndustries: [], selectedIndustry: null })
    useAssessmentFormStore.setState({ industry: '', country: '' })
  })

  it('offers both pickers when neither is set — the fresh GRC / Executive first screen', () => {
    render(
      <InlineScopeStep
        country="All"
        countryItems={COUNTRIES}
        onCountryChange={vi.fn()}
        sector="All"
      />
    )
    expect(screen.getByRole('button', { name: /Your country/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Your sector/i })).toBeInTheDocument()
    expect(screen.getByText(/country and sector/i)).toBeInTheDocument()
  })

  it('offers only what is missing', () => {
    render(
      <InlineScopeStep
        country="France"
        countryItems={COUNTRIES}
        onCountryChange={vi.fn()}
        sector="All"
      />
    )
    expect(screen.queryByRole('button', { name: /Your country/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Your sector/i })).toBeInTheDocument()
  })

  it('renders nothing once both are set', () => {
    const { container } = render(
      <InlineScopeStep
        country="France"
        countryItems={COUNTRIES}
        onCountryChange={vi.fn()}
        sector="Healthcare"
      />
    )
    expect(container).toBeEmptyDOMElement()
    expect(isScopeIncomplete('France', 'Healthcare')).toBe(false)
    expect(isScopeIncomplete('All', 'Healthcare')).toBe(true)
  })

  it('reads an unanswered store value as missing, not as a scope', () => {
    // Found by the e2e run: the stores hold '' for "not answered", and '' !== 'All'
    // made a fresh reader look scoped, so the step hid itself.
    expect(scopeValue('')).toBe('All')
    expect(scopeValue(null)).toBe('All')
    expect(scopeValue('Global', 'Global')).toBe('All')
    expect(scopeValue('France', 'Global')).toBe('France')
  })

  it('sends a picked country to the page handler, and never offers "All" as a choice', async () => {
    const user = userEvent.setup()
    const onCountryChange = vi.fn()
    render(
      <InlineScopeStep
        country="All"
        countryItems={['All', ...COUNTRIES]}
        onCountryChange={onCountryChange}
        sector="Healthcare"
      />
    )
    await user.click(screen.getByRole('button', { name: /Your country/i }))
    expect(screen.queryByRole('option', { name: 'All' })).not.toBeInTheDocument()
    await user.click(await screen.findByRole('option', { name: 'Germany' }))
    expect(onCountryChange).toHaveBeenCalledWith('Germany')
  })

  it('writes a picked sector exactly where the top bar does', async () => {
    const user = userEvent.setup()
    render(
      <InlineScopeStep
        country="France"
        countryItems={COUNTRIES}
        onCountryChange={vi.fn()}
        sector="All"
      />
    )
    await user.click(screen.getByRole('button', { name: /Your sector/i }))
    await user.click(await screen.findByRole('option', { name: 'Healthcare' }))
    expect(usePersonaStore.getState().selectedIndustries).toEqual(['Healthcare'])
    expect(useAssessmentFormStore.getState().industry).toBe('Healthcare')
  })
})

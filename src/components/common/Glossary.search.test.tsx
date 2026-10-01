// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { Glossary } from './Glossary'

const renderGlossary = () =>
  render(
    <MemoryRouter>
      <Glossary isOpen onClose={() => {}} />
    </MemoryRouter>
  )

const search = (value: string) =>
  fireEvent.change(screen.getByLabelText('Search glossary terms'), { target: { value } })

describe('Glossary search — match all words', () => {
  it('finds the Purdue Model term when stopwords and word order differ', async () => {
    renderGlossary()
    expect(await screen.findByText(/terms?$/)).toBeInTheDocument()
    search('the model for Purdue')
    expect(await screen.findByText('Purdue Model')).toBeInTheDocument()
    expect(screen.queryByText('No terms match your search.')).not.toBeInTheDocument()
  })

  it('still matches the exact phrase and the single word', async () => {
    renderGlossary()
    expect(await screen.findByText(/terms?$/)).toBeInTheDocument()
    search('purdue model')
    expect(await screen.findByText('Purdue Model')).toBeInTheDocument()
    search('purdue')
    expect(await screen.findByText('Purdue Model')).toBeInTheDocument()
  })

  it('still shows the empty state when a word matches nothing', async () => {
    renderGlossary()
    expect(await screen.findByText(/terms?$/)).toBeInTheDocument()
    search('purdue zzzznotaword')
    expect(await screen.findByText('No terms match your search.')).toBeInTheDocument()
  })

  it('falls back to all-but-one matches, with a notice, for "purdue model for OT"', async () => {
    renderGlossary()
    await screen.findByText(/terms?$/)
    search('purdue model for OT')
    expect(await screen.findByText('Purdue Model')).toBeInTheDocument()
    const notice = screen.getByRole('status')
    expect(notice).toHaveTextContent(/No term contains every word/)
    expect(notice).toHaveTextContent('"ot"')
    expect(notice).toHaveAttribute('aria-live', 'polite')
  })

  it('shows no notice when some term contains every word', async () => {
    renderGlossary()
    await screen.findByText(/terms?$/)
    search('the model for Purdue')
    await screen.findByText('Purdue Model')
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    search('purdue model')
    await screen.findByText('Purdue Model')
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('does not fall back for a 2-word query with no match', async () => {
    renderGlossary()
    await screen.findByText(/terms?$/)
    search('purdue zzzznotaword')
    expect(await screen.findByText('No terms match your search.')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('leaves empty and stopword-only queries unfiltered', async () => {
    renderGlossary()
    await screen.findByText(/terms?$/)
    const all = screen.getByText(/^\d+ terms?$/).textContent
    search('for the')
    expect(screen.getByText(/^\d+ terms?$/).textContent).toBe(all)
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })
})

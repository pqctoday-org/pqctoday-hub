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
  // Note: the Purdue Model definition never contains the letters "ot", so the
  // literal query "purdue model for OT" still matches nothing here (every word is
  // required). Queries whose words are all in the entry now match.
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
})

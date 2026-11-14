// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ComplianceChecklistBuilderStandalone } from './ComplianceChecklistBuilderStandalone'

const ctx = vi.hoisted(() => ({
  value: { myFrameworks: [] as string[], industry: '', country: '', assessmentResult: null },
  saved: undefined as Record<string, Record<string, string | string[]>> | undefined,
  add: vi.fn(),
}))
vi.mock('@/hooks/useExecutiveModuleData', () => ({ useExecutiveModuleData: () => ctx.value }))
vi.mock('@/hooks/useSavedArtifactInputs', () => ({ useSavedArtifactInputs: () => ctx.saved }))
vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: () => ({ addExecutiveDocument: ctx.add }),
}))

const renderTool = () =>
  render(
    <MemoryRouter>
      <ComplianceChecklistBuilderStandalone />
    </MemoryRouter>
  )
const savedMarkdown = () => ctx.add.mock.lastCall![0].data as string

beforeEach(() => {
  ctx.value = { myFrameworks: [], industry: '', country: '', assessmentResult: null }
  ctx.saved = undefined
  ctx.add.mockReset()
})

describe('compliance checklist works on a cold start', () => {
  it('loads sample frameworks on the page, fills the scope and keeps typed notes', () => {
    renderTool()
    fireEvent.change(screen.getByLabelText('Scope & context'), {
      target: { value: 'Fictional payments programme' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Load sample frameworks' }))
    // Each sample framework gets its own checklist section, with no remount losing notes.
    for (const label of ['CNSA 2.0', 'NIST IR 8547']) {
      expect(screen.getByRole('heading', { name: label })).toBeInTheDocument()
    }
    expect(screen.getByLabelText('Scope & context')).toHaveValue('Fictional payments programme')
    // The blank Scope & context answers take the picked sample scope.
    expect(screen.getByRole('textbox', { name: 'Industry' })).toHaveValue('Government & Defense')
    expect(screen.getByRole('textbox', { name: 'Primary jurisdiction' })).toHaveValue(
      'United States'
    )
    expect(screen.getByRole('button', { name: 'Industry' })).toHaveTextContent(
      'Government & Defense'
    )
    // The catalogue matches for the sample scope are listed, PQC-required first.
    const list = screen.getByRole('list', { name: 'Matching frameworks' })
    expect(within(list).getAllByRole('button')[0]).toHaveTextContent('PQC required')
    // Removing one from the picker removes its checklist.
    fireEvent.click(within(list).getByRole('button', { name: /^CNSA 2\.0/ }))
    expect(screen.queryByRole('heading', { name: 'CNSA 2.0' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(savedMarkdown()).toContain('## NIST IR 8547')
    expect(savedMarkdown()).not.toContain('## CNSA 2.0')
  })

  it('restores frameworks that were added on the page from the saved draft', () => {
    ctx.saved = {
      context: { industry: '', country: '', 'context-notes': '' },
      'fw-CNSA-2': { deadline: '2031', owner: 'Sample PKI lead', controls: [], notes: '' },
    }
    renderTool()
    expect(screen.getByRole('heading', { name: 'CNSA 2.0' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Sample PKI lead')).toBeInTheDocument()
  })
})

describe('Clear all removes seeded frameworks from every output', () => {
  it('drops starred frameworks from the form, preview and saved document', () => {
    ctx.value = {
      myFrameworks: ['CNSA-2'],
      industry: 'Government & Defense',
      country: 'United States',
      assessmentResult: null,
    }
    renderTool()
    expect(screen.getByRole('heading', { name: 'CNSA 2.0' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(screen.queryByRole('heading', { name: 'CNSA 2.0' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(savedMarkdown()).not.toContain('CNSA 2.0')
    expect(ctx.add.mock.lastCall![0].inputs).not.toHaveProperty('fw-CNSA-2')
  })
})

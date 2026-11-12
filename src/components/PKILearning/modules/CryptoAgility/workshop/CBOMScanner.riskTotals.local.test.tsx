// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom'
import { CBOMScanner } from './CBOMScanner'

vi.mock('@/data/migrateData', () => ({ softwareData: [] }))
vi.mock('../data/cbomTemplates', async (original) => {
  const actual = await original<typeof import('../data/cbomTemplates')>()
  return {
    ...actual,
    SAMPLE_CBOM: ['vulnerable', 'vulnerable', 'weakened', 'safe'].map((status, index) => ({
      id: `sample-${index}`,
      component: `Sample component ${index}`,
      location: 'Fictional inventory',
      algorithm: `Sample algorithm ${index}`,
      keySize: 256,
      usage: 'Classification display fixture',
      quantumStatus: status,
      recommendation: 'Review the sample classification',
      infrastructureLayer: 'AppServers',
    })),
  }
})
function show() {
  render(
    <MemoryRouter>
      <CBOMScanner />
    </MemoryRouter>
  )
}
function card(label: string) {
  return screen.getByText(label, { exact: true }).parentElement!
}
describe('CBOM summary reconciles vulnerable and weakened sample assets', () => {
  it('reports three of four at risk and displays every category count', () => {
    show()
    expect(card('At Risk')).toHaveTextContent('75%')
    expect(card('Weakened')).toHaveTextContent('1')
    expect(card('Vulnerable')).toHaveTextContent('2')
    expect(card('Safe')).toHaveTextContent('1')
    expect(card('Total Assets')).toHaveTextContent('4')
    expect(card('At Risk')).toHaveTextContent('3 of 4: vulnerable or weakened')
  })
  it('keeps summary scope consistent while filtering the actual weakened row', () => {
    show()
    fireEvent.click(screen.getByRole('button', { name: 'Weakened (1)' }))
    expect(screen.getByText('Sample component 2')).toBeInTheDocument()
    expect(screen.queryByText('Sample component 0')).not.toBeInTheDocument()
    expect(screen.queryByText('Sample component 3')).not.toBeInTheDocument()
    expect(card('At Risk')).toHaveTextContent('75%')
    expect(screen.getByText('0 vulnerable, 1 weakened, 0 marked safe')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'All (4)' }))
    expect(screen.getByText('Sample component 0')).toBeInTheDocument()
    expect(within(card('At Risk')).getByText('75%')).toBeInTheDocument()
  })
})

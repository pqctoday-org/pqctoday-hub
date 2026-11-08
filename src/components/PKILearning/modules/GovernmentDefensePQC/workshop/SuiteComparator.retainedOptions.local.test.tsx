// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { SuiteAlgorithm } from '../data/cnsaData'
import { SuiteComparator } from './SuiteComparator'

const fixture = vi.hoisted(() => ({
  rows: [] as SuiteAlgorithm[],
  original: [] as SuiteAlgorithm[],
}))
vi.mock('../data/cnsaData', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../data/cnsaData')>()
  fixture.original = actual.SUITE_COMPARISON
  return { ...actual, SUITE_COMPARISON: fixture.rows }
})
beforeEach(() =>
  fixture.rows.splice(0, fixture.rows.length, ...fixture.original.map((r) => ({ ...r })))
)

describe('authored suite comparison distinguishes retained and expanded options', () => {
  it('counts the three public-key replacements separately from two retained purposes', () => {
    render(<SuiteComparator />)
    expect(screen.getByText('3')).toBeVisible()
    expect(screen.getByText('purposes with replaced options in this comparison')).toBeVisible()
    expect(screen.getByText('2')).toBeVisible()
    expect(
      screen.getByText('purposes retaining an existing option, including expanded choices')
    ).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Hashing' }))
    expect(screen.getByText('SHA-384 or SHA-512')).toBeVisible()
    expect(screen.getByText('existing option retained; additional option listed')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: /Symmetric/ }))
    expect(
      screen.getByText('listed option retained; deployment changes are not assessed')
    ).toBeVisible()
    expect(screen.queryByText('no migration needed')).not.toBeInTheDocument()
  })

  it('keeps explicit retained options, replacements and missing comparison text distinct', () => {
    fixture.rows.splice(
      0,
      fixture.rows.length,
      { purpose: 'Same', cnsa1: 'Example-A', cnsa2: 'Example-A', rationale: 'Authored fixture' },
      {
        purpose: 'Added option',
        cnsa1: 'Example-B',
        cnsa2: 'Example-C or Example-B',
        rationale: 'Authored fixture',
      },
      {
        purpose: 'Replaced',
        cnsa1: 'Example-D',
        cnsa2: 'Example-E',
        rationale: 'Authored fixture',
      },
      { purpose: 'Missing', cnsa1: '', cnsa2: 'Example-F', rationale: 'Authored fixture' }
    )
    render(<SuiteComparator />)
    expect(screen.getByText('1')).toBeVisible()
    expect(screen.getByText('2')).toBeVisible()
    expect(screen.getByText('1 purpose(s) not assessed: option text is missing.')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Added option' }))
    expect(screen.getByText('existing option retained; additional option listed')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Replaced' }))
    expect(screen.getByText('different algorithm option(s) listed')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Missing' }))
    expect(screen.getByText('comparison not assessed')).toBeVisible()
    expect(
      screen.queryByText('listed option retained; deployment changes are not assessed')
    ).not.toBeInTheDocument()
  })
})

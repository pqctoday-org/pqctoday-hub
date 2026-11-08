// SPDX-License-Identifier: AGPL-3.0-only
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { Capstone } from './Capstone'
import { checkCapstone, emptyCapstone } from '../data/sharedData'
const captured = vi.hoisted(() => ({ markdown: '' }))
vi.mock('@/components/PKILearning/common/executive/ExportableArtifact', () => ({
  ExportableArtifact: ({ exportData, children }: { exportData: string; children: ReactNode }) => {
    captured.markdown = exportData
    return <div>{children}</div>
  },
}))
const renderCapstone = () =>
  render(
    <MemoryRouter>
      <Capstone config={{ path: 'fips' }} />
    </MemoryRouter>
  )
describe('capstone qualifies its existing advisory heuristics', () => {
  it('does not call arbitrary three-sentence text semantically safe because the unchanged count check passes', () => {
    const claims = 'The sample is blue.\nThe sample is round.\nThe sample is convenient.'
    const state = emptyCapstone('fips')
    state.claims = claims
    expect(checkCapstone(state).find((check) => check.id === 'a10-claims')?.status).toBe('pass')
    renderCapstone()
    fireEvent.change(screen.getByLabelText('Safe claims, one per line'), {
      target: { value: claims },
    })
    expect(screen.getByTestId('capstone-verdict')).toHaveTextContent(
      'correctness is not established'
    )
    expect(
      screen.getAllByText(
        /They do not establish correctness of every matrix cell, safety of every claim/
      ).length
    ).toBeGreaterThan(0)
    for (const claim of claims.split('\n')) expect(captured.markdown).toContain(claim)
    expect(captured.markdown).toContain('These advisory checks cover completeness')
    expect(captured.markdown).toContain('\n\n# Capstone')
  })
  it('keeps recognized failure behavior while explaining that this is not a complete assessment', () => {
    renderCapstone()
    fireEvent.change(screen.getByLabelText('Safe claims, one per line'), {
      target: { value: 'EAL4+ equals FIPS Level 4.' },
    })
    expect(screen.getByTestId('capstone-verdict')).toHaveTextContent(
      'Does not pass limited reference/pattern checks:'
    )
    expect(screen.getByTestId('capstone-verdict')).toHaveTextContent('not a full assessment')
    expect(
      screen.queryByText(
        'All minimum pass conditions met and the timed artifacts are complete — ready for review.'
      )
    ).not.toBeInTheDocument()
  })
  it('preserves the three uniquely labelled release fields from the integrated accessibility repair', () => {
    renderCapstone()
    const fields = screen.getAllByRole('textbox', { name: /^Planned route and timing — / })
    expect(fields).toHaveLength(3)
    expect(new Set(fields.map((field) => field.id)).size).toBe(3)
  })
})

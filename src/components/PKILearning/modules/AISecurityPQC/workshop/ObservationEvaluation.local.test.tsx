// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { ObservationEvaluation } from './ObservationEvaluation'
import { DataAuthenticityVerifier } from './DataAuthenticityVerifier'

// The separate KAT panel is not part of this arithmetic/input-controller test.
// The real evaluation component, evaluator and observations are never mocked.
vi.mock('@/components/shared/KatValidationPanel', () => ({ KatValidationPanel: () => null }))
const results = () => screen.getByRole('status', { name: 'Observation evaluation results' })
const edit = (label: string, option: string) => {
  fireEvent.click(screen.getByRole('button', { name: label }))
  fireEvent.click(screen.getByRole('option', { name: option }))
}

describe('editable fictional observation evaluation', () => {
  it('renders eight reference/result pairs with independently derived balanced metrics', () => {
    render(<ObservationEvaluation />)
    expect(screen.getAllByRole('group')).toHaveLength(8)
    expect(within(results()).getByText('Accuracy: 75% (6/8)')).toBeInTheDocument()
    expect(within(results()).getByText('Precision: 75% (3/4)')).toBeInTheDocument()
    expect(within(results()).getByText('Recall: 75% (3/4)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sample 1 reference label' })).toHaveTextContent(
      'Synthetic'
    )
  })
  it('recalculates counts after a real result edit, then excludes an unanswered reference', () => {
    render(<ObservationEvaluation />)
    edit('Sample 4 tool result', 'Synthetic')
    expect(within(results()).getByText('Accuracy: 87.5% (7/8)')).toBeInTheDocument()
    expect(within(results()).getByText('Precision: 80% (4/5)')).toBeInTheDocument()
    expect(within(results()).getByText('Recall: 100% (4/4)')).toBeInTheDocument()
    edit('Sample 1 reference label', 'Unanswered')
    expect(within(results()).getByText('Assessed: 7 of 8; unassessed: 1')).toBeInTheDocument()
    expect(within(results()).getByText('Accuracy: 85.71% (6/7)')).toBeInTheDocument()
  })
  it('exposes the imbalanced miss and does not report undefined precision as perfect', () => {
    render(<ObservationEvaluation />)
    fireEvent.click(screen.getByRole('button', { name: 'Load imbalanced observations' }))
    expect(within(results()).getByText('Accuracy: 87.5% (7/8)')).toBeInTheDocument()
    expect(within(results()).getByText('Recall: 0% (0/1)')).toBeInTheDocument()
    expect(
      within(results()).getByText('Precision: Not assessed (0/0; denominator is zero)')
    ).toBeInTheDocument()
  })
  it('keeps separate question drafts and gives matcher and watermark results their own meanings', () => {
    render(<ObservationEvaluation />)
    edit('Sample 4 tool result', 'Synthetic')
    edit('Evaluation question', 'Is this a near duplicate?')
    expect(screen.getByRole('button', { name: 'Sample 4 tool result' })).toHaveTextContent(
      'Not a near duplicate'
    )
    expect(
      screen.getByText(/Similarity does not establish whether either item is synthetic/)
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sample 1 reference label' })).toHaveTextContent(
      'Near duplicate'
    )
    edit('Sample 1 reference label', 'Unanswered')
    edit('Evaluation question', 'Is the selected watermark present?')
    expect(screen.getByText(/watermark-presence question only/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sample 1 reference label' })).toHaveTextContent(
      'Selected watermark present'
    )
    edit('Evaluation question', 'Is this synthetic content?')
    expect(within(results()).getByText('Recall: 100% (4/4)')).toBeInTheDocument()
    edit('Evaluation question', 'Is this a near duplicate?')
    expect(screen.getByRole('button', { name: 'Sample 1 reference label' })).toHaveTextContent(
      'Unanswered'
    )
  })
  it('can clear all rows and load a complete useful example again', () => {
    render(<ObservationEvaluation />)
    fireEvent.click(screen.getByRole('button', { name: 'Clear observations' }))
    expect(within(results()).getByText('Assessed: 0 of 8; unassessed: 8')).toBeInTheDocument()
    expect(
      within(results()).getByText('Accuracy: Not assessed (0/0; denominator is zero)')
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Load balanced observations' }))
    expect(within(results()).getByText('Accuracy: 75% (6/8)')).toBeInTheDocument()
  })
  it('uses the real parent flow without awarding accuracy for selecting capabilities or signing', () => {
    render(<DataAuthenticityVerifier />)
    const initial = results().textContent
    fireEvent.click(screen.getByRole('button', { name: /Perceptual Hashing/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Algorithm:' }))
    fireEvent.click(screen.getByRole('option', { name: 'ML-DSA-65' }))
    expect(results().textContent).toBe(initial)
    expect(screen.queryByText('Data Authenticity Trust Score')).not.toBeInTheDocument()
  })
})

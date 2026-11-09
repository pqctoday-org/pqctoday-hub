// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BuildBuyAnalyzer } from './BuildBuyAnalyzer'

const load = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Load fictional worked comparison' }))
const fact = (candidate: string, requirement: string, value: string) => {
  fireEvent.click(screen.getByRole('button', { name: `${candidate} ${requirement} assumption` }))
  fireEvent.click(
    screen.getByRole('option', {
      name: value === 'yes' ? 'Yes' : value === 'no' ? 'No' : 'Unknown',
    })
  )
}
const cost = (candidate: string, field: string, value: string) =>
  fireEvent.change(screen.getByRole('spinbutton', { name: `${candidate} ${field} cost` }), {
    target: { value },
  })

describe('Actual worked comparison controls and current result', () => {
  it('starts without inferred facts, costs or a leader', () => {
    render(<BuildBuyAnalyzer />)
    expect(screen.queryByText(/Leading eligible sample candidate/)).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Commercial Required module validation assumption' })
    ).toHaveTextContent('Unknown')
    expect(screen.getByLabelText('Build Your Own Year 1 sample cost')).toHaveTextContent(
      'Unassessed'
    )
  })
  it('a higher failed score cannot beat an eligible candidate; edits recompute immediately', () => {
    render(<BuildBuyAnalyzer />)
    load()
    expect(screen.getByText('Leading eligible sample candidate: Open Source')).toBeInTheDocument()
    expect(
      screen.getByRole('status', { name: 'Build Your Own sample eligibility' })
    ).toHaveTextContent('Not met: Required module validation')
    expect(screen.getByRole('status', { name: 'Commercial sample eligibility' })).toHaveTextContent(
      'Required portability; Full source access'
    )
    fact('Build Your Own', 'Required module validation', 'yes')
    expect(
      screen.getByText('Leading eligible sample candidate: Build Your Own')
    ).toBeInTheDocument()
    fact('Build Your Own', 'Required module validation', 'unknown')
    expect(
      screen.queryByText('Leading eligible sample candidate: Build Your Own')
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('status', { name: 'Build Your Own sample eligibility' })
    ).toHaveTextContent('Unassessed')
    expect(screen.getByText('Leading eligible sample candidate: Open Source')).toBeInTheDocument()
    fact('Open Source', 'Required module validation', 'no')
    expect(screen.getByText(/No assessed eligible leader/)).toBeInTheDocument()
  })
  it('question changes clear the applicable gate and preserve joint leaders rather than choosing enum order', () => {
    render(<BuildBuyAnalyzer />)
    fireEvent.click(screen.getByRole('button', { name: 'No certification requirements' }))
    fireEvent.click(screen.getByRole('button', { name: 'Not a concern' }))
    fireEvent.click(screen.getByRole('button', { name: 'No — vendor certification is sufficient' }))
    expect(
      screen.getByText('Joint leading eligible sample candidates: Open Source, Commercial')
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Yes — must have full source access' }))
    expect(screen.queryByText(/Joint leading eligible sample candidates/)).not.toBeInTheDocument()
    expect(screen.getByText(/No assessed eligible leader/)).toBeInTheDocument()
  })
  it('shows actual cost arithmetic and sensitivity independently of preference ranking', () => {
    render(<BuildBuyAnalyzer />)
    load()
    expect(screen.getByLabelText('Build Your Own Year 1 sample cost')).toHaveTextContent(
      '$1,000,000.00'
    )
    expect(screen.getByLabelText('Build Your Own Year 3 sample cost')).toHaveTextContent(
      '$2,000,000.00'
    )
    expect(screen.getByLabelText('Build Your Own Year 5 sample cost')).toHaveTextContent(
      '$3,000,000.00'
    )
    cost('Build Your Own', 'annual', '510000')
    expect(screen.getByLabelText('Build Your Own Year 5 sample cost')).toHaveTextContent(
      '$3,050,000.00'
    )
    expect(screen.getByText('Leading eligible sample candidate: Open Source')).toBeInTheDocument()
    cost('Build Your Own', 'setup', '')
    expect(screen.getByLabelText('Build Your Own Year 1 sample cost')).toHaveTextContent(
      'Unassessed'
    )
    cost('Build Your Own', 'setup', '0')
    cost('Build Your Own', 'annual', '0')
    expect(screen.getByLabelText('Build Your Own Year 5 sample cost')).toHaveTextContent('$0.00')
    cost('Build Your Own', 'annual', '-1')
    expect(screen.getByLabelText('Build Your Own Year 5 sample cost')).toHaveTextContent(
      'Unassessed'
    )
  })
  it('exposes contributions, fictional inputs and the production capability boundary', () => {
    render(<BuildBuyAnalyzer />)
    load()
    fireEvent.click(screen.getByText('Inspect selected answer contributions'))
    expect(screen.getByText(/Each strategy starts at 5 points/)).toBeVisible()
    expect(screen.getAllByText(/Fictional candidate assumptions/)).toHaveLength(1)
    expect(screen.getByText(/For your own tools, check/)).toHaveTextContent(
      'actual validation boundary/configuration'
    )
    expect(screen.getByText(/These editable facts/)).toHaveTextContent(
      'not properties inferred from a sourcing category'
    )
    expect(screen.getByText(/Sample arithmetic/)).toHaveTextContent(
      'do not change the preference weights'
    )
  })
})

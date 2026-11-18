// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { ScenarioComparison, ScenarioComparisonProvider } from './ScenarioComparison'

it('retains the baseline across edit mode, shows changed rows, and clears on tool navigation', () => {
  const view = (tool: string, report?: string) => (
    <ScenarioComparisonProvider key={tool} toolId={tool}>
      {report !== undefined && <ScenarioComparison reportId="report" report={report} />}
    </ScenarioComparisonProvider>
  )
  const { rerender } = render(view('risk', 'Cost\n$40\nOwner'))
  fireEvent.click(screen.getByText('Compare scenario outputs'))
  fireEvent.click(screen.getByRole('button', { name: 'Keep this baseline' }))
  rerender(view('risk'))
  rerender(view('risk', 'Cost\n$20\nOwner'))
  fireEvent.click(screen.getByText('Compare scenario outputs'))
  expect(screen.getByText('$40')).toBeVisible()
  expect(screen.getByText('$20')).toBeVisible()
  expect(screen.queryByText('Owner')).toBeNull()
  rerender(view('risk', 'Cost\n$40\nOwner'))
  expect(screen.getByRole('status')).toHaveTextContent('matches your baseline')
  rerender(view('plan', 'Cost\n$10\nOwner'))
  fireEvent.click(screen.getByText('Compare scenario outputs'))
  expect(screen.getByRole('button', { name: 'Keep this baseline' })).toBeVisible()
})

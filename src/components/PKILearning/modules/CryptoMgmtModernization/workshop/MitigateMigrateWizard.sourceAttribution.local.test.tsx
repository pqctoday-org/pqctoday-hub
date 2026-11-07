// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MitigateMigrateWizard } from './MitigateMigrateWizard'
function finish(answer: 'Yes' | 'No') {
  render(<MitigateMigrateWizard cbomAssets={[]} />)
  fireEvent.click(screen.getByRole('button', { name: /Legacy PKI system/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Start Assessment' }))
  for (const button of screen.getAllByRole('button', { name: answer })) fireEvent.click(button)
  fireEvent.click(screen.getByRole('button', { name: 'Show planning suggestion' }))
}
describe('gateway planning source distinction', () => {
  it('keeps the gateway branch and labels its existing year as a Hub example', () => {
    finish('No')
    expect(screen.getByText('PLANNING SUGGESTION: EXPLORE MITIGATION')).toBeInTheDocument()
    expect(screen.getByText(/Existing illustrative Hub sunset year/)).toBeInTheDocument()
    expect(screen.getByText(/§4.6 does not prescribe a sunset date/)).toBeInTheDocument()
    expect(screen.getByText(/This is a paraphrase/)).toBeInTheDocument()
    expect(screen.queryByText(/§4.6 requires a sunset/)).not.toBeInTheDocument()
  })
  it('preserves the migration branch without inventing a gateway requirement', () => {
    finish('Yes')
    expect(screen.getByText('PLANNING SUGGESTION: EXPLORE MIGRATION')).toBeInTheDocument()
    expect(screen.queryByText(/Existing illustrative Hub sunset year/)).not.toBeInTheDocument()
    expect(
      screen.getByText(/These five questions are Hub guidance, not a NIST assessment/)
    ).toBeInTheDocument()
  })
})

// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ProgramCharter } from '@/components/BusinessCenter/tools/ProgramCharter'
import { MigrationVerification } from '@/components/BusinessCenter/tools/MigrationVerification'
import { useSimulationStore } from '@/store/useSimulationStore'
import { setAutoRunFill } from './autoRunFill'
import { executiveSummaryForPhase } from './execTourConfig'
import { SimExecWalkthroughComplete } from './SimExecWalkthroughComplete'

afterEach(() => {
  setAutoRunFill(false)
})

describe('overview boundaries', () => {
  it.each([
    ['financial', true, true],
    ['financial', false, false],
    ['healthcare', true, false],
  ] as const)(
    'keeps charter scope appropriate for %s with overview %s',
    (sector, overview, planned) => {
      useSimulationStore.setState({ sector })
      setAutoRunFill(true, overview)
      render(<ProgramCharter />)
      expect(
        (screen.getByLabelText('Year 1 budget') as HTMLInputElement).value.includes(
          'Discovery and planning only'
        )
      ).toBe(planned)
    }
  )
  it.each([
    ['financial', true, true],
    ['financial', false, false],
    ['healthcare', true, false],
  ] as const)(
    'keeps verification scope appropriate for %s with overview %s',
    (sector, overview, planned) => {
      useSimulationStore.setState({ sector })
      setAutoRunFill(true, overview)
      render(<MigrationVerification />)
      expect(
        !!screen.queryByDisplayValue(
          'Customer portal — planned connection checks; no test results recorded'
        )
      ).toBe(planned)
    }
  )
  it('keeps non-bank risk guidance about the services actually in scope', () => {
    expect(executiveSummaryForPhase('p3', 'healthcare')).toContain('services in scope')
    expect(executiveSummaryForPhase('p3', 'healthcare')).not.toContain(
      'Long-lived records, customer connections'
    )
  })
  it('does not promise generated documents in the phone brief', () => {
    render(
      <MemoryRouter>
        <SimExecWalkthroughComplete brief onClose={() => {}} />
      </MemoryRouter>
    )
    expect(screen.getByRole('heading', { name: 'Executive phone brief complete' })).toBeVisible()
    expect(screen.queryByText(/worked-example documents are available/)).toBeNull()
  })
})

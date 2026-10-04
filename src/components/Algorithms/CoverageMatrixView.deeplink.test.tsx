// SPDX-License-Identifier: GPL-3.0-only
/** `?engine=` / `?case=` / `?polarity=` on the coverage matrix (Validation tab). */
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CoverageMatrixView } from './CoverageMatrixView'
import { buildCoverageMatrix, compactMatrix } from '@/data/validation/coverageModel'
import { fixtureInputs } from '@/data/validation/coverageFixture'

const file = compactMatrix(buildCoverageMatrix(fixtureInputs()).matrix)
const loader = () => Promise.resolve(structuredClone(file))
const caption = () => screen.findByRole('table', { name: /mechanism × operation groups/ })

describe('CoverageMatrixView — deep links', () => {
  it('?engine=rust selects the Rust engine and re-reads on change', async () => {
    const { rerender } = render(<CoverageMatrixView loader={loader} engineParam="rust" />)
    expect(await caption()).toHaveAccessibleName(/— Rust,/)
    rerender(<CoverageMatrixView loader={loader} engineParam={null} />)
    expect(await caption()).toHaveAccessibleName(/— C\+\+,/)
  })

  it('an unknown ?engine falls back to the default engine', async () => {
    render(<CoverageMatrixView loader={loader} engineParam="java" />)
    expect(await caption()).toHaveAccessibleName(/— C\+\+,/)
  })

  it('picking an engine writes ?engine (the default clears it)', async () => {
    const user = userEvent.setup()
    const onUpdateParams = vi.fn()
    render(<CoverageMatrixView loader={loader} onUpdateParams={onUpdateParams} />)
    await caption()
    await user.click(screen.getByRole('button', { name: /Engine/ }))
    await user.click(await screen.findByRole('option', { name: 'Rust' }))
    expect(onUpdateParams).toHaveBeenLastCalledWith({ engine: 'rust' })
  })

  it('?case=<mechanism>|<operation> expands that row', async () => {
    render(<CoverageMatrixView loader={loader} caseParam="CKM_TEST_SIG|verify" />)
    await caption()
    expect(
      await screen.findByRole('button', { name: 'Hide cells for CKM_TEST_SIG verify' })
    ).toHaveAttribute('aria-expanded', 'true')
    expect(screen.queryByTestId('deeplink-notice-not-found')).not.toBeInTheDocument()
  })

  it('a bare mechanism expands every operation row of it', async () => {
    render(<CoverageMatrixView loader={loader} caseParam="ckm_test_sig" />)
    await caption()
    expect(
      await screen.findByRole('button', { name: 'Hide cells for CKM_TEST_SIG verify' })
    ).toBeInTheDocument()
  })

  it('expanding a row writes ?case; collapsing the linked row clears it', async () => {
    const user = userEvent.setup()
    const onUpdateParams = vi.fn()
    const { rerender } = render(
      <CoverageMatrixView loader={loader} onUpdateParams={onUpdateParams} />
    )
    await caption()
    await user.click(screen.getByRole('button', { name: 'Show cells for CKM_TEST_SIG verify' }))
    expect(onUpdateParams).toHaveBeenLastCalledWith({ case: 'CKM_TEST_SIG|verify' })
    rerender(
      <CoverageMatrixView
        loader={loader}
        onUpdateParams={onUpdateParams}
        caseParam="CKM_TEST_SIG|verify"
      />
    )
    await user.click(screen.getByRole('button', { name: 'Hide cells for CKM_TEST_SIG verify' }))
    expect(onUpdateParams).toHaveBeenLastCalledWith({ case: null })
  })

  it('an unknown ?case says so, and dismissing clears it', async () => {
    const user = userEvent.setup()
    const onUpdateParams = vi.fn()
    render(
      <CoverageMatrixView loader={loader} caseParam="CKM_NOPE" onUpdateParams={onUpdateParams} />
    )
    expect(await screen.findByTestId('deeplink-notice-not-found')).toHaveTextContent('CKM_NOPE')
    await user.click(screen.getByRole('button', { name: /dismiss notice/i }))
    expect(onUpdateParams).toHaveBeenLastCalledWith({ case: null })
  })

  it('?polarity=negative selects that polarity and re-reads on change', async () => {
    const { rerender } = render(<CoverageMatrixView loader={loader} polarityParam="negative" />)
    expect(await caption()).toHaveAccessibleName(/Negative polarity/)
    rerender(<CoverageMatrixView loader={loader} polarityParam="state-error" />)
    expect(await caption()).toHaveAccessibleName(/State \/ error polarity/)
    rerender(<CoverageMatrixView loader={loader} polarityParam={null} />)
    expect(await caption()).toHaveAccessibleName(/Positive polarity/)
  })

  it('an unknown ?polarity falls back to the default polarity', async () => {
    render(<CoverageMatrixView loader={loader} polarityParam="sideways" />)
    expect(await caption()).toHaveAccessibleName(/Positive polarity/)
  })

  it('picking a polarity writes ?polarity (the default clears it)', async () => {
    const user = userEvent.setup()
    const onUpdateParams = vi.fn()
    render(<CoverageMatrixView loader={loader} onUpdateParams={onUpdateParams} />)
    await caption()
    await user.click(screen.getByRole('button', { name: /Polarity/ }))
    await user.click(await screen.findByRole('option', { name: 'Boundary' }))
    expect(onUpdateParams).toHaveBeenLastCalledWith({ polarity: 'boundary' })
    expect(await caption()).toHaveAccessibleName(/Boundary polarity/)
    await user.click(screen.getByRole('button', { name: /Polarity/ }))
    await user.click(await screen.findByRole('option', { name: 'Positive' }))
    expect(onUpdateParams).toHaveBeenLastCalledWith({ polarity: null })
  })
})

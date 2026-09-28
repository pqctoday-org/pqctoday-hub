// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CoverageMatrixView } from './CoverageMatrixView'
import { buildCoverageMatrix, compactMatrix, type RunResult } from '@/data/validation/coverageModel'
import { FIXTURE_ARTIFACT, fixtureInputs } from '@/data/validation/coverageFixture'
import { VALIDATION_DISCLAIMER } from '@/data/validationDisclaimer'

const fail: RunResult = {
  engine: 'cpp',
  artifactKind: 'wasm',
  artifactSha256: FIXTURE_ARTIFACT.cpp,
  registryCase: 't.nist#v#/0',
  status: 'fail',
}
const file = compactMatrix(buildCoverageMatrix(fixtureInputs([fail])).matrix)
const loader = () => Promise.resolve(structuredClone(file))

describe('CoverageMatrixView', () => {
  it('renders the §2.2 disclaimer verbatim', async () => {
    render(<CoverageMatrixView loader={loader} />)
    expect(await screen.findByTestId('coverage-matrix-view')).toBeInTheDocument()
    expect(screen.getByTestId('validation-disclaimer')).toHaveTextContent(VALIDATION_DISCLAIMER)
  })

  it('shows numerators over the per-engine denominator and the definitions', async () => {
    render(<CoverageMatrixView loader={loader} />)
    const cpp = await screen.findByRole('region', { name: 'C++ totals' })
    expect(
      within(cpp).getByText(/8 advertised capability cells \(denominator\)/)
    ).toBeInTheDocument()
    const positive = within(cpp).getByRole('rowheader', { name: 'Positive' }).closest('tr')!
    expect(within(positive).getByText('1 / 8')).toBeInTheDocument() // covered
    expect(within(positive).getByText('2 / 8')).toBeInTheDocument() // sampled
    expect(within(positive).getByText('5 / 8')).toBeInTheDocument() // untested
    const defs = screen.getByRole('region', { name: 'Definitions' })
    expect(
      within(defs).getByText(/Denominator \(per engine\) = advertised capability cells/)
    ).toBeInTheDocument()
    expect(within(defs).getByText(/Numerators \(per engine, per polarity\)/)).toBeInTheDocument()
    expect(
      within(defs).getByText(/One happy-path case is always "sampled", never "covered"/)
    ).toBeInTheDocument()
  })

  it('shows statuses per mechanism × operation and a recorded failure', async () => {
    render(<CoverageMatrixView loader={loader} />)
    const table = await screen.findByRole('table', { name: /mechanism × operation groups/ })
    const verify = within(table)
      .getAllByRole('row')
      .find((r) => /CKM_TEST_SIG/.test(r.textContent ?? '') && /verify/.test(r.textContent ?? ''))!
    expect(within(verify).getByText('nist-reference')).toHaveAttribute(
      'data-status',
      'nist-reference'
    )
    expect(within(verify).getByText(/1 FAIL/)).toBeInTheDocument()
    const kdf = within(table)
      .getAllByRole('row')
      .find((r) => /CKM_TEST_KDF/.test(r.textContent ?? ''))!
    expect(within(kdf).getByText('untested')).toBeInTheDocument()
    const unreachable = within(table)
      .getAllByRole('row')
      .find((r) => /no PKCS#11 mechanism/.test(r.textContent ?? ''))!
    expect(within(unreachable).getByText('unsupported')).toBeInTheDocument()
  })

  it('expands a group into its parameter-set cells with the unsupported reason', async () => {
    const user = userEvent.setup()
    render(<CoverageMatrixView loader={loader} />)
    await screen.findByTestId('coverage-matrix-view')
    const btn = screen.getByRole('button', { name: 'Show cells for CKM_TEST_SIG verify' })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    await user.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('P-B')).toBeInTheDocument()
    expect(screen.getByText(/recorded FAIL \(1\)/)).toBeInTheDocument()
  })

  it('lists the open-gaps register with owner and status', async () => {
    render(<CoverageMatrixView loader={loader} />)
    const gaps = await screen.findByRole('region', { name: 'Open gaps register' })
    expect(within(gaps).getByText('Curated gap')).toBeInTheDocument()
    expect(within(gaps).getAllByText('owner: unassigned').length).toBeGreaterThan(0)
    expect(within(gaps).getByText(/Recorded FAIL on C\+\+/)).toBeInTheDocument()
  })

  it('shows an error with retry when the JSON cannot be loaded', async () => {
    render(<CoverageMatrixView loader={() => Promise.reject(new Error('offline'))} />)
    expect(await screen.findByText(/offline/)).toBeInTheDocument()
  })
})

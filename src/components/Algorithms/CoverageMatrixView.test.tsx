// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CoverageMatrixView } from './CoverageMatrixView'
import {
  buildCoverageMatrix,
  compactMatrix,
  expandMatrix,
  type RunResult,
} from '@/data/validation/coverageModel'
import { FIXTURE_ARTIFACT, fixtureInputs } from '@/data/validation/coverageFixture'
import { VALIDATION_DISCLAIMER } from '@/data/validationDisclaimer'
import { groupByMechanismOperation } from '@/data/validation/coverageExport'
import { usePersonaStore } from '@/store/usePersonaStore'
import { renderWithRouter } from '@/test/utils'

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
  beforeEach(() => usePersonaStore.setState({ selectedPersona: null }))

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

  it('says how the matrix compares to a lab and links the ACVP Lab Workflow module', async () => {
    renderWithRouter(<CoverageMatrixView loader={loader} />)
    const note = await screen.findByTestId('coverage-lab-comparison')
    expect(note).toHaveTextContent(/How this compares to a lab/)
    expect(note).toHaveTextContent(/not a CAVP result/)
    expect(within(note).getByRole('link', { name: /ACVP Lab Workflow/ })).toHaveAttribute(
      'href',
      '/learn/acvp-lab-workflow'
    )
  })

  it('still shows the lab comparison link outside a router', async () => {
    render(<CoverageMatrixView loader={loader} />)
    const note = await screen.findByTestId('coverage-lab-comparison')
    expect(within(note).getByRole('link', { name: /ACVP Lab Workflow/ })).toHaveAttribute(
      'href',
      '/learn/acvp-lab-workflow'
    )
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

  it('lists the open-gaps register without maintenance codes in the guided overview', async () => {
    render(<CoverageMatrixView loader={loader} />)
    const gaps = await screen.findByRole('region', { name: 'Open gaps register' })
    expect(within(gaps).getByText('Curated gap')).toBeInTheDocument()
    expect(within(gaps).getByText(/Recorded FAIL on C\+\+/)).toBeInTheDocument()
    expect(within(gaps).queryByText(/owner/i)).toBeNull()
    expect(within(gaps).queryByText(/unassigned/)).toBeNull()
    expect(within(gaps).queryByText(/^plan /)).toBeNull()
    expect(screen.queryByText(/\(G-3\)/)).toBeNull()
  })

  it('shows owner and tracking reference, phrased for readers, only in Evidence detail', async () => {
    const user = userEvent.setup()
    render(<CoverageMatrixView loader={loader} />)
    const gaps = await screen.findByRole('region', { name: 'Open gaps register' })
    await user.click(within(gaps).getByRole('button', { name: 'Evidence detail' }))
    expect(within(gaps).getAllByText('Owner: not yet assigned').length).toBeGreaterThan(0)
    expect(within(gaps).queryByText('owner: unassigned')).toBeNull()
  })

  it('gap heading and status chips count exactly what the list can show, with a note for folded entries', async () => {
    const user = userEvent.setup()
    const all = expandMatrix(structuredClone(file)).openGaps
    const listed = all.filter((g) => g.origin === 'curated' || !g.id.startsWith('untested:'))
    expect(listed.length).toBeLessThan(all.length)
    render(<CoverageMatrixView loader={loader} />)
    const gaps = await screen.findByRole('region', { name: 'Open gaps register' })
    expect(within(gaps).getByTestId('gap-total')).toHaveTextContent(`(${listed.length})`)
    expect(
      within(gaps).getByText(`Showing ${listed.length} of ${listed.length}`)
    ).toBeInTheDocument()
    const chips = within(gaps).getByLabelText('Gap status definitions')
    const chipTotal = within(chips)
      .getAllByRole('button')
      .reduce((sum, b) => sum + Number(b.textContent?.match(/(\d+)/)?.[1] ?? 0), 0)
    expect(chipTotal).toBe(listed.length)
    expect(within(gaps).getByTestId('gap-hidden-note')).toHaveTextContent(
      `${all.length} gaps in total. ${all.length - listed.length} generated entries`
    )
    await user.click(within(gaps).getByRole('button', { name: /generated per-mechanism entries/ }))
    expect(within(gaps).getByTestId('gap-total')).toHaveTextContent(`(${all.length})`)
    expect(within(gaps).queryByTestId('gap-hidden-note')).toBeNull()
  })

  it('the "untested" filter keeps groups that are only partly untested and says so', async () => {
    const user = userEvent.setup()
    const groups = groupByMechanismOperation(expandMatrix(structuredClone(file)))
    const strongestUntested = groups.filter(
      (g) => g.engines.cpp.polarity.positive.status === 'untested'
    ).length
    const anyUntested = groups.filter((g) =>
      g.rows.some(
        (r) => r.engines.cpp.advertised && r.engines.cpp.polarity.positive.status === 'untested'
      )
    ).length
    expect(anyUntested).toBeGreaterThan(strongestUntested)
    render(<CoverageMatrixView loader={loader} />)
    await screen.findByTestId('coverage-matrix-view')
    await user.click(screen.getByRole('button', { name: /Status/ }))
    await user.click(await screen.findByRole('option', { name: 'untested' }))
    expect(
      screen.getByRole('table', {
        name: new RegExp(`^${anyUntested} mechanism × operation groups`),
      })
    ).toBeInTheDocument()
    expect(screen.getByTestId('untested-filter-note')).toBeInTheDocument()
  })

  it('the reading-level toggle wraps instead of clipping on narrow screens', async () => {
    render(<CoverageMatrixView loader={loader} />)
    const group = await screen.findByRole('group', { name: 'Gap register reading level' })
    expect(group).toHaveClass('flex-wrap', 'max-w-full', 'min-w-0')
  })

  it('teaches the claim boundary before revealing the technical history', async () => {
    const user = userEvent.setup()
    render(<CoverageMatrixView loader={loader} />)
    const gaps = await screen.findByRole('region', { name: 'Open gaps register' })
    expect(within(gaps).getAllByText('What this means').length).toBeGreaterThan(0)
    expect(within(gaps).getAllByText('Why it matters').length).toBeGreaterThan(0)
    expect(within(gaps).queryByText('Technical evidence and investigation history')).toBeNull()

    await user.click(within(gaps).getAllByRole('button', { name: 'Show technical evidence' })[0])
    expect(
      within(gaps).getByText('Technical evidence and investigation history')
    ).toBeInTheDocument()
  })

  it('defaults certification engineers to the structured evidence view', async () => {
    usePersonaStore.setState({ selectedPersona: 'cert-engineer' })
    render(<CoverageMatrixView loader={loader} />)
    const gaps = await screen.findByRole('region', { name: 'Open gaps register' })
    expect(within(gaps).getByRole('button', { name: 'Evidence detail' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(within(gaps).getAllByText('Claim boundary').length).toBeGreaterThan(0)
    expect(within(gaps).getAllByText('Reviewed curated finding').length).toBeGreaterThan(0)
  })

  it('shows an error with retry when the JSON cannot be loaded', async () => {
    render(<CoverageMatrixView loader={() => Promise.reject(new Error('offline'))} />)
    expect(await screen.findByText(/offline/)).toBeInTheDocument()
  })
})

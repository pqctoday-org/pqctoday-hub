// SPDX-License-Identifier: GPL-3.0-only
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AlgorithmValidationView } from './AlgorithmValidationView'
import { buildCoverageMatrix, compactMatrix } from '@/data/validation/coverageModel'
import { fixtureInputs } from '@/data/validation/coverageFixture'

vi.mock('./KATView', () => ({ KATView: () => <div>kat</div> }))
vi.mock('./ImplementationAttacksView', () => ({
  ImplementationAttacksView: () => <div>attacks</div>,
}))

describe('AlgorithmValidationView — Coverage Matrix section (WS-C C-6)', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('?section=coverage opens the public coverage matrix, fetched from /data/validation', async () => {
    const file = compactMatrix(buildCoverageMatrix(fixtureInputs()).matrix)
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(file) })
    vi.stubGlobal('fetch', fetchMock)
    render(<AlgorithmValidationView sectionParam="coverage" />)
    expect(screen.getByRole('button', { name: /Coverage Matrix/ })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
    // The view is React.lazy + a fetch; under full-suite load the chunk can take
    // longer than findBy's 1 s default (failed at 1120 ms in gate:local).
    expect(
      await screen.findByTestId('coverage-matrix-view', undefined, { timeout: 10_000 })
    ).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/data\/validation\/coverage-matrix\.json$/)
    )
  })

  it('stays closed (and does not fetch) without the deep link', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    render(<AlgorithmValidationView />)
    expect(screen.getByRole('button', { name: /Coverage Matrix/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

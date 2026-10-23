// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'
import sample from '../data/slhdsaAcvpSigVerSample.json'
import { hsm_slhdsaVerifyBytes } from '@/wasm/softhsm'
import { SlhDsaAcvpSigVerPanel } from './SlhDsaAcvpSigVerPanel'

vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    isReady: true,
    initialize: vi.fn(),
    moduleRef: { current: { _C_DestroyObject: vi.fn() } },
    hSessionRef: { current: 1 },
  }),
}))
vi.mock('@/wasm/softhsm', async (original) => ({
  ...(await original<typeof import('@/wasm/softhsm')>()),
  hsm_importSLHDSAPublicKey: vi.fn(() => 7),
  hsm_slhdsaVerifyBytes: vi.fn(),
}))

const allCases = sample.testGroups.flatMap((g) => g.tests)
const verify = vi.mocked(hsm_slhdsaVerifyBytes)

describe('SlhDsaAcvpSigVerPanel', () => {
  beforeEach(() => verify.mockReset())

  it('says what it runs and what it is not, before anything is run', () => {
    render(<SlhDsaAcvpSigVerPanel />)
    expect(screen.getByText(/NIST ACVP reference sample/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Run NIST sigVer sample/ })).toBeEnabled()
    const footer = screen.getByTestId('slhdsa-acvp-sigver').textContent ?? ''
    // the counts in the footnote are the vendored sample's counts
    expect(allCases).toHaveLength(8)
    expect(sample.testGroups).toHaveLength(2)
    expect(footer).toContain('Eight cases from two of its 36 test groups')
    expect(footer).toContain('commit 975de31')
    expect(footer).toContain('not vectors issued by an ACVTS test session')
    expect(footer).toContain('establishes no validation')
  })

  it('compares each answer with NIST and shows the match count', async () => {
    const queue = allCases.map((t) => t.testPassed)
    verify.mockImplementation(() => queue.shift() as boolean)
    render(<SlhDsaAcvpSigVerPanel />)
    fireEvent.click(screen.getByRole('button', { name: /Run NIST sigVer sample/ }))
    expect(await screen.findByText(/8 of 8 match NIST's expected result/)).toBeInTheDocument()
    const table = screen.getByRole('region', { name: 'SLH-DSA sigVer cases and results' })
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(8)
    expect(within(table).getAllByText('Accept')).toHaveLength(
      allCases.filter((t) => t.testPassed).length
    )
    expect(within(table).getAllByText('Reject')).toHaveLength(
      allCases.filter((t) => !t.testPassed).length
    )
    expect(within(table).getByText('modified message')).toBeInTheDocument()
    expect(screen.queryByText(/did not$/)).not.toBeInTheDocument()
  })

  it('shows a disagreement with NIST, and an engine error, as not passing', async () => {
    const queue = allCases.map((t) => t.testPassed)
    queue[1] = !queue[1] // accepts (or rejects) the opposite of what NIST says
    let call = 0
    verify.mockImplementation(() => {
      if (call++ === 2) throw new Error('engine unavailable')
      return queue[call - 1]
    })
    render(<SlhDsaAcvpSigVerPanel />)
    fireEvent.click(screen.getByRole('button', { name: /Run NIST sigVer sample/ }))
    await waitFor(() =>
      expect(screen.getByText(/6 of 8 match NIST's expected result/)).toBeVisible()
    )
    expect(screen.getByText('2 did not')).toBeInTheDocument()
    expect(screen.getByText(/but NIST expects/)).toBeInTheDocument()
    expect(screen.getByText(/Engine error: engine unavailable/)).toBeInTheDocument()
    expect(screen.queryByText(/8 of 8 match/)).not.toBeInTheDocument()
  })
})

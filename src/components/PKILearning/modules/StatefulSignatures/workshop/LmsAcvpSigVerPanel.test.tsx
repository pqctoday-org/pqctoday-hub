// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'
import sample from '../data/lmsAcvpSigVerSample.json'
import { hsm_statefulVerifyBytes } from '@/wasm/softhsm'
import { CKR_SIGNATURE_INVALID } from '@/wasm/softhsm/constants'
import { LmsAcvpSigVerPanel } from './LmsAcvpSigVerPanel'

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
  hsm_importStatefulPublicKey: vi.fn(() => 7),
  hsm_statefulVerifyBytes: vi.fn(),
}))

const allCases = sample.testGroups.flatMap((g) => g.tests)
const verify = vi.mocked(hsm_statefulVerifyBytes)
const answerFor = (valid: boolean) => (valid ? 0 : CKR_SIGNATURE_INVALID)

describe('LmsAcvpSigVerPanel', () => {
  beforeEach(() => verify.mockReset())

  it('says what it runs and what it is not, before anything is run', () => {
    render(<LmsAcvpSigVerPanel />)
    expect(screen.getByText(/NIST ACVP reference sample/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Run NIST LMS sigVer sample/ })).toBeEnabled()
    const footer = screen.getByTestId('lms-acvp-sigver').textContent ?? ''
    // the counts in the footnote are the vendored sample's counts
    expect(allCases).toHaveLength(16)
    expect(sample.testGroups).toHaveLength(4)
    expect(footer).toContain('All 16 cases of both sample folders: four test groups')
    expect(footer).toContain('commit 975de31')
    expect(footer).toContain('CKM_HSS')
    expect(footer).toContain('not vectors issued by an ACVTS test session')
    expect(footer).toContain('establishes no validation')
    expect(footer).toContain('HSS and XMSS are not run here')
  })

  it('compares each answer with NIST and shows the match count', async () => {
    const queue = allCases.map((t) => answerFor(t.testPassed))
    verify.mockImplementation(() => queue.shift() as number)
    render(<LmsAcvpSigVerPanel />)
    fireEvent.click(screen.getByRole('button', { name: /Run NIST LMS sigVer sample/ }))
    expect(await screen.findByText(/16 of 16 match NIST's expected result/)).toBeInTheDocument()
    const table = screen.getByRole('region', { name: 'LMS sigVer cases and results' })
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(16)
    expect(within(table).getAllByText('Accept')).toHaveLength(
      allCases.filter((t) => t.testPassed).length
    )
    expect(within(table).getAllByText('Reject')).toHaveLength(
      allCases.filter((t) => !t.testPassed).length
    )
    expect(within(table).getAllByText('modify signature header').length).toBeGreaterThan(0)
    expect(within(table).getAllByText('CKR_SIGNATURE_INVALID').length).toBe(12)
    expect(screen.queryByText(/did not$/)).not.toBeInTheDocument()
  })

  it('shows a disagreement with NIST, and an engine error, as not passing', async () => {
    const queue = allCases.map((t) => answerFor(t.testPassed))
    queue[1] = queue[1] === 0 ? CKR_SIGNATURE_INVALID : 0 // the opposite of what NIST says
    let call = 0
    verify.mockImplementation(() => {
      if (call++ === 2) throw new Error('engine unavailable')
      return queue[call - 1]
    })
    render(<LmsAcvpSigVerPanel />)
    fireEvent.click(screen.getByRole('button', { name: /Run NIST LMS sigVer sample/ }))
    await waitFor(() =>
      expect(screen.getByText(/14 of 16 match NIST's expected result/)).toBeVisible()
    )
    expect(screen.getByText('2 did not')).toBeInTheDocument()
    expect(screen.getByText(/but NIST expects/)).toBeInTheDocument()
    expect(screen.getByText(/Engine error: engine unavailable/)).toBeInTheDocument()
    expect(screen.queryByText(/16 of 16 match/)).not.toBeInTheDocument()
  })
})

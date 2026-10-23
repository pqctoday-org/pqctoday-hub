// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'
import { MlKemAcvpEncapDecapPanel } from './MlKemAcvpEncapDecapPanel'
import type { EncapDecapResult } from './mlkemAcvpEncapDecap'

vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    isReady: true,
    initialize: vi.fn(),
    moduleRef: { current: {} },
    hSessionRef: { current: 1 },
  }),
}))

const runSample = vi.fn()
vi.mock('./mlkemAcvpEncapDecap', async (original) => ({
  ...(await original<typeof import('./mlkemAcvpEncapDecap')>()),
  runEncapDecapSample: (...a: unknown[]) => runSample(...a),
}))

const row = (over: Partial<EncapDecapResult>): EncapDecapResult => ({
  function: 'decapsulation',
  tgId: 5,
  tcId: 86,
  label: 'valid decapsulation',
  expects: 'shared secret k equal to NIST’s',
  inputs: 'dk 2,400 B, c 1,088 B',
  status: 'pass',
  observed: 'shared secret equals NIST’s',
  ...over,
})

/** The mocked runner reports each row through the callback, as the real one does. */
const reports = (rows: EncapDecapResult[]) =>
  runSample.mockImplementation(
    async (_m: unknown, _h: unknown, cb: (r: EncapDecapResult) => void) => {
      rows.forEach(cb)
      return rows
    }
  )

describe('MlKemAcvpEncapDecapPanel', () => {
  beforeEach(() => {
    runSample.mockReset()
  })

  it('says what it runs and what it is not, before anything is run', () => {
    render(<MlKemAcvpEncapDecapPanel />)
    expect(screen.getByText(/NIST ACVP reference sample/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Run NIST encapDecap sample/ })).toBeEnabled()
    const footer = screen.getByTestId('mlkem-acvp-encapdecap').textContent ?? ''
    expect(footer).toContain('commit 975de31')
    expect(footer).toContain('outside the PKCS#11 standard')
    expect(footer).toContain('not vectors issued by an ACVTS test session')
    expect(footer).toContain('establishes no validation')
  })

  it('shows each NIST case and the match count', async () => {
    reports([
      row({}),
      row({
        tcId: 88,
        label: 'modified ciphertext',
        expects: 'no error; the implicit-rejection value k from NIST',
      }),
    ])
    render(<MlKemAcvpEncapDecapPanel />)
    fireEvent.click(screen.getByRole('button', { name: /Run NIST encapDecap sample/ }))
    expect(await screen.findByText(/2 of 2 match NIST's expected result/)).toBeInTheDocument()
    const table = screen.getByRole('region', { name: 'ML-KEM encapDecap cases and results' })
    expect(within(table).getAllByRole('row')).toHaveLength(3)
    expect(within(table).getByText('modified ciphertext')).toBeInTheDocument()
    expect(screen.queryByText(/did not$/)).not.toBeInTheDocument()
  })

  it('shows a disagreement with NIST, and an engine error, as not passing', async () => {
    reports([
      row({}),
      row({
        tcId: 87,
        status: 'fail',
        observed: 'shared secret differs (first difference at byte 0)',
      }),
      row({ tcId: 88, status: 'error', observed: 'Engine error: engine unavailable' }),
    ])
    render(<MlKemAcvpEncapDecapPanel />)
    fireEvent.click(screen.getByRole('button', { name: /Run NIST encapDecap sample/ }))
    await waitFor(() =>
      expect(screen.getByText(/1 of 3 match NIST's expected result/)).toBeVisible()
    )
    expect(screen.getByText('2 did not')).toBeInTheDocument()
    expect(screen.getByText(/shared secret differs/)).toBeInTheDocument()
    expect(screen.getByText(/Engine error: engine unavailable/)).toBeInTheDocument()
    expect(screen.queryByText(/3 of 3 match/)).not.toBeInTheDocument()
  })
})

// SPDX-License-Identifier: GPL-3.0-only
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PqcCertificationTrendChart } from './PqcCertificationTrendChart'
import type { ComplianceRecord } from './types'

const records = [
  { id: 'A1', type: 'ACVP', date: '2026-03-02', pqcCoverage: 'ML-KEM' },
  { id: '5450', type: 'FIPS 140-3', date: '2026-04-02', pqcCoverage: 'ML-KEM, ML-DSA' },
] as ComplianceRecord[]

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => ({
      ok: true,
      json: async () =>
        url.includes('matches')
          ? { matches: [] }
          : {
              iut: [
                {
                  module: 'Luna K7',
                  vendor: 'Thales',
                  standard: 'FIPS 140-3',
                  iutDate: '2026-03-15',
                },
              ],
              mip: [],
              mipMeta: { notDisplayed: 10 },
            },
    }))
  )
})
afterEach(() => vi.unstubAllGlobals())

describe('PqcCertificationTrendChart — FIPS 140-3 track stages', () => {
  it('names the four stages, with CAVP as the prerequisite, never a certificate', async () => {
    render(<PqcCertificationTrendChart data={records} asOf={new Date(2026, 8, 26)} />)
    expect(screen.getByText('No PQC validation yet')).toBeInTheDocument()
    expect(screen.getByText('Prerequisite met (CAVP)')).toBeInTheDocument()
    expect(screen.getByText('In progress (NIST IUT / MIP)')).toBeInTheDocument()
    expect(screen.getByText('Certified')).toBeInTheDocument()
    expect(screen.getByTestId('fips-stage-note')).toHaveTextContent(
      /CAVP validation is the prerequisite for FIPS 140-3, not a certificate/
    )
  })

  it('switches to NIST listings, and says what "in progress" is dated by', async () => {
    render(<PqcCertificationTrendChart data={records} asOf={new Date(2026, 8, 26)} />)
    fireEvent.click(screen.getByRole('button', { name: 'NIST listings' }))
    expect(screen.getByRole('button', { name: 'NIST listings' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByText('PQC CAVP validation')).toBeInTheDocument()
    expect(screen.getByText('IUT / MIP listing')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByTestId('fips-stage-note')).toHaveTextContent(
        /withholds 10 in-process modules by vendor request/
      )
    )
    expect(screen.getByTestId('fips-stage-note')).toHaveTextContent(
      /Counts listings, not distinct modules/
    )
  })

  it('still renders when the NIST files are missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, json: async () => null }))
    )
    render(<PqcCertificationTrendChart data={records} asOf={new Date(2026, 8, 26)} />)
    fireEvent.click(screen.getByRole('button', { name: 'NIST listings' }))
    expect(screen.getByTestId('fips-stage-chart')).toBeInTheDocument()
  })
})

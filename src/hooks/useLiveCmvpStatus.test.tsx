// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, renderHook, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  lookupCertById,
  normalizeCertId,
  resetLiveCmvpCache,
  useLiveCmvpStatus,
} from './useLiveCmvpStatus'
import { LiveCmvpBadge } from '@/components/BusinessCenter/widgets/LiveCmvpBadge'
import type { ComplianceRecord } from '@/components/Compliance/types'

const rec = (overrides: Partial<ComplianceRecord>): ComplianceRecord => ({
  id: '4985',
  source: 'NIST',
  date: '2025-03-01',
  link: 'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4985',
  type: 'FIPS 140-3',
  status: 'Active',
  pqcCoverage: 'No PQC Mechanisms Detected',
  productName: 'OpenSSL FIPS Provider',
  productCategory: 'Software',
  vendor: 'The OpenSSL Corporation',
  ...overrides,
})

const index = (records: ComplianceRecord[]) => {
  const m = new Map<string, ComplianceRecord[]>()
  for (const r of records) {
    const k = r.id.toUpperCase()
    m.set(k, [...(m.get(k) ?? []), r])
  }
  return m
}

describe('normalizeCertId', () => {
  it("parses the caller's own ID, ignoring a leading '#' and trailing notes", () => {
    expect(normalizeCertId('#4985 (FIPS provider, PQC hybrid)')).toBe('4985')
    expect(normalizeCertId('A1234')).toBe('A1234')
    expect(normalizeCertId('')).toBeNull()
    expect(normalizeCertId(null)).toBeNull()
    expect(normalizeCertId('(historical)')).toBeNull()
  })
})

describe('lookupCertById — exact ID only, no name matching', () => {
  const idx = index([
    rec({}),
    rec({ id: 'A7533', type: 'ACVP', status: 'Validated', productName: 'Other lib' }),
    rec({ id: '3622', status: 'Historical', productName: 'Old module' }),
  ])

  it('matches on the exact certificate number', () => {
    const m = lookupCertById(idx, '#4985 (FIPS provider)', 'FIPS 140-3')
    expect(m?.certId).toBe('4985')
    expect(m?.isCurrent).toBe(true)
  })

  it('returns null when the caller has no ID (no vendor/product fallback)', () => {
    expect(lookupCertById(idx, null)).toBeNull()
    expect(lookupCertById(idx, 'OpenSSL FIPS Provider')).toBeNull()
  })

  it('never crosses record types when a type is given', () => {
    expect(lookupCertById(idx, 'A7533', 'FIPS 140-3')).toBeNull()
    expect(lookupCertById(idx, 'A7533', 'ACVP')?.typeLabel).toBe('NIST CAVP')
  })

  it('reports a non-current status instead of hiding it', () => {
    const m = lookupCertById(idx, '#3622 (historical)', 'FIPS 140-3')
    expect(m?.status).toBe('Historical')
    expect(m?.isCurrent).toBe(false)
  })
})

describe('LiveCmvpBadge', () => {
  it('says "NIST record" (never "live"), links to the official record, neutral styling', () => {
    const m = lookupCertById(index([rec({})]), '4985', 'FIPS 140-3')
    render(<LiveCmvpBadge match={m} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', rec({}).link)
    expect(link).toHaveTextContent(/NIST record/i)
    expect(link).not.toHaveTextContent(/live/i)
    expect(screen.getByText(/NIST record/i)).not.toHaveClass('text-status-success')
    expect(screen.getByText(/NIST record/i)).toHaveClass('text-muted-foreground')
  })

  it('renders nothing without a match', () => {
    const { container } = render(<LiveCmvpBadge match={null} />)
    expect(container.firstChild).toBeNull()
  })
})

describe('useLiveCmvpStatus', () => {
  const fetchMock = vi.fn()
  beforeEach(() => {
    resetLiveCmvpCache()
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [
        rec({}),
        rec({ id: '3886', type: 'FIPS 140-2' as ComplianceRecord['type'], status: 'Historical' }),
      ],
    })
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    resetLiveCmvpCache()
  })

  it('loads the snapshot and matches by ID; FIPS 140-2 rows are never matched', async () => {
    const { result } = renderHook(() => useLiveCmvpStatus())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.size).toBe(1)
    expect(result.current.matchById('4985', 'FIPS 140-3')?.matchedProductName).toBe(
      'OpenSSL FIPS Provider'
    )
    expect(result.current.matchById('3886')).toBeNull()
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ cache: 'no-cache' })
  })
})

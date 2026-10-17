// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'

const HSM_STUB = {
  isReady: true,
  moduleRef: { current: {} as unknown },
  hSessionRef: { current: 1 },
  slotRef: { current: 0 },
  initialize: vi.fn().mockResolvedValue(undefined),
  addStepLog: vi.fn(),
}
vi.mock('@/hooks/useHSM', () => ({ useHSM: () => HSM_STUB }))

const mockRunKAT = vi.fn()
vi.mock('@/utils/katRunner', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/katRunner')>()
  return { ...actual, runKAT: (...args: unknown[]) => mockRunKAT(...args) }
})

import { KatValidationPanel } from './KatValidationPanel'
import type { KatTestSpec } from '@/utils/katRunner'

const SPECS: KatTestSpec[] = [
  {
    id: 'a',
    useCase: 'HMAC check',
    standard: 'FIPS 198-1',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/198-1/final',
    kind: { type: 'hmac-verify', hashAlg: 'SHA-256' },
  },
  {
    id: 'b',
    useCase: 'KWP round-trip',
    standard: 'RFC 5649',
    referenceUrl: 'https://www.rfc-editor.org/rfc/rfc5649',
    kind: { type: 'aes-kwp-wrap' },
  },
]

const result = (id: string, status: string) => ({
  id,
  useCase: id,
  algorithm: 'X',
  standard: 'S',
  referenceUrl: 'https://example.org',
  status,
  details: status === 'skip' ? 'Not tested — this engine does not advertise CKM_X' : 'ok',
  evidence: 'functional-round-trip',
})

describe('KatValidationPanel', () => {
  beforeEach(() => {
    mockRunKAT.mockReset()
    HSM_STUB.addStepLog.mockReset()
  })

  it("counts a 'skip' as not tested — never as passed or failed — and passes the engine's mechanism list", async () => {
    mockRunKAT.mockResolvedValueOnce(result('a', 'pass')).mockResolvedValueOnce(result('b', 'skip'))
    render(<KatValidationPanel specs={SPECS} label="KATs" authorityNote="note" />)
    fireEvent.click(screen.getByRole('button', { name: /Run/ }))
    expect(await screen.findByTestId('kat-skip-count')).toHaveTextContent('1 not tested')
    expect(screen.getByText('1 passed')).toBeInTheDocument()
    expect(screen.queryByText(/failed/)).not.toBeInTheDocument()
    const statuses = screen.getAllByTestId('kat-status').map((e) => e.getAttribute('data-status'))
    expect(statuses).toEqual(['pass', 'skip'])
    expect(within(screen.getAllByTestId('kat-status')[1]).getByText('not tested')).toBeTruthy()
    // 4th argument carries the advertised-mechanism set (empty here: the stub module has no C_GetMechanismList)
    expect(mockRunKAT.mock.calls[0][3]).toEqual({ advertised: new Set() })
    expect(HSM_STUB.addStepLog.mock.calls.map(([label]) => label)).toEqual([
      'Test · HMAC check',
      'Test · KWP round-trip',
    ])
  })

  it('shows the manifest evidence record (class chip + source) for each result', async () => {
    mockRunKAT.mockResolvedValueOnce(result('a', 'pass')).mockResolvedValueOnce(result('b', 'pass'))
    render(<KatValidationPanel specs={SPECS} label="KATs" authorityNote="note" />)
    fireEvent.click(screen.getByRole('button', { name: /Run/ }))
    const badges = await screen.findAllByTestId('case-evidence-badge')
    expect(badges.map((b) => b.getAttribute('data-evidence'))).toEqual([
      'nist-acvp-reference-sample',
      'functional-round-trip',
    ])
    expect(
      screen.getAllByText(/HMAC-SHA2-256-2\.0\/internalProjection\.json @ 975de31e/).length
    ).toBe(1)
  })

  it('an all-skipped run is not styled as a success, and the outcome is announced politely', async () => {
    mockRunKAT.mockResolvedValueOnce(result('a', 'skip')).mockResolvedValueOnce(result('b', 'skip'))
    render(<KatValidationPanel specs={SPECS} label="KATs" authorityNote="note" />)
    const button = screen.getByRole('button', { name: /Run/ })
    button.focus()
    fireEvent.click(button)
    const pass = await screen.findByTestId('kat-pass-count')
    expect(pass).toHaveTextContent('0 passed')
    expect(pass).not.toHaveClass('text-status-success')
    const status = screen.getByTestId('kat-run-status')
    expect(status).toHaveAttribute('role', 'status')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(status).toHaveTextContent('KATs: 0 of 0 checks passed, 2 not tested.')
    expect(document.activeElement).toBe(button)
  })
})

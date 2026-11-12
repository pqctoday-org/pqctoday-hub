// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { KATResult, KatTestSpec } from '@/utils/katRunner'

const controlled = vi.hoisted(() => ({ run: vi.fn() }))
vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    isReady: true,
    engine: 'rust',
    moduleRef: { current: {} },
    hSessionRef: { current: 1 },
    slotRef: { current: 0 },
    initialize: vi.fn(),
    addStepLog: vi.fn(),
    keys: [],
    log: [],
  }),
}))
vi.mock('@/utils/katRunner', async (original) => ({
  ...(await original<typeof import('@/utils/katRunner')>()),
  runKAT: (...args: unknown[]) => controlled.run(...args),
}))
import { BinarySigning } from './BinarySigning'
import { CMSSigningDemo } from '../../EmailSigning/workshop/CMSSigningDemo'
import { FirmwareSigningLab } from '../../OTPQC/workshop/FirmwareSigningLab'

// Controlled runner outcomes test the actual consumer/status path, not crypto.
// Existing engine tests remain the separate evidence for primitive execution.
const outcome = (spec: KatTestSpec, status: KATResult['status']): KATResult => ({
  id: spec.id,
  useCase: spec.useCase,
  algorithm: spec.kind.type,
  standard: spec.standard,
  referenceUrl: spec.referenceUrl,
  status,
  details: status === 'pass' ? 'Controlled matching sample' : 'Controlled contrary sample',
  evidence: 'functional-round-trip',
})
const successful = () =>
  controlled.run.mockImplementation(async (_m, _s, spec: KatTestSpec) => outcome(spec, 'pass'))
const run = () => fireEvent.click(screen.getByRole('button', { name: /^Run / }))

beforeEach(() => {
  controlled.run.mockReset()
  successful()
})

describe('Signing check outcome attribution', () => {
  it('never pre-awards OT verification, shows real completed outcomes, and resets them on plan edits', async () => {
    render(
      <MemoryRouter>
        <FirmwareSigningLab onComplete={vi.fn()} initial={{ scheme: 'ml-dsa-87' }} />
      </MemoryRouter>
    )
    expect(screen.queryByTestId('kat-pass-count')).not.toBeInTheDocument()
    expect(screen.queryByText(/Verified by NIST|Verifier checked by/)).not.toBeInTheDocument()
    expect(controlled.run).not.toHaveBeenCalled()
    expect(screen.getByText(/Before a run, no verifier outcome/)).toBeVisible()
    run()
    expect(await screen.findByTestId('kat-pass-count')).toHaveTextContent('3 passed')
    expect(controlled.run.mock.calls.map((call) => call[2].kind)).toEqual([
      { type: 'mldsa-sigver', variant: 87 },
      { type: 'mldsa-sigver', variant: 65 },
      { type: 'lms-sigver', testCase: 1 },
    ])
    // Rates change the capacity model, never a completed primitive check's scope.
    fireEvent.change(screen.getAllByRole('slider')[0], { target: { value: '400' } })
    expect(screen.queryByTestId('kat-pass-count')).not.toBeInTheDocument()
    expect(screen.queryByTestId('kat-status')).not.toBeInTheDocument()
    controlled.run.mockImplementation(async (_m, _s, spec: KatTestSpec) => outcome(spec, 'fail'))
    run()
    expect(await screen.findByTestId('kat-pass-count')).toHaveTextContent('0 passed')
    expect(screen.getByText('3 failed')).toBeVisible()
    expect(screen.queryByText(/Verified by NIST|Verifier checked by/)).not.toBeInTheDocument()
  })

  it('keeps unsupported and exception outcomes distinct from an OT pass', async () => {
    controlled.run.mockImplementation(async (_m, _s, spec: KatTestSpec) => outcome(spec, 'skip'))
    render(
      <MemoryRouter>
        <FirmwareSigningLab onComplete={vi.fn()} />
      </MemoryRouter>
    )
    expect(screen.getByText('5,243 years')).toBeVisible()
    expect(screen.getByText('524,288')).toBeVisible()
    run()
    expect(await screen.findByTestId('kat-skip-count')).toHaveTextContent('3 not tested')
    expect(screen.getByTestId('kat-pass-count')).not.toHaveClass('text-status-success')
    controlled.run.mockRejectedValue(new Error('Controlled unavailable engine'))
    run()
    expect(await screen.findByText('Controlled unavailable engine')).toBeVisible()
    expect(screen.queryByTestId('kat-pass-count')).not.toBeInTheDocument()
    expect(screen.getByTestId('kat-run-status')).toHaveTextContent('the checks could not run')
    fireEvent.change(screen.getAllByRole('slider')[0], { target: { value: '400' } })
    // Independent LMS h20 arithmetic: 2^20 / 400 = 2621.44 years, displayed rounded.
    expect(screen.getByText('2,621 years')).toBeVisible()
    expect(screen.queryByText('Controlled unavailable engine')).not.toBeInTheDocument()
  })

  it('attributes each binary signature check to its parameter, not to package or Sigstore conformance', async () => {
    render(
      <MemoryRouter>
        <BinarySigning />
      </MemoryRouter>
    )
    run()
    expect(await screen.findByTestId('kat-pass-count')).toHaveTextContent('4 passed')
    const rows = screen.getAllByRole('row').filter((row) => within(row).queryByTestId('kat-status'))
    expect(within(rows[0]).getByText(/ML-DSA-65 reference signature verification/)).toBeVisible()
    expect(within(rows[0]).queryByText(/CNSA/)).not.toBeInTheDocument()
    expect(within(rows[1]).getByText(/ML-DSA-87.*CNSA 2.0 parameter set/)).toBeVisible()
    expect(within(rows[2]).getByText(/signing primitive, not Sigstore/)).toBeVisible()
    expect(within(rows[2]).queryByText(/CNSA/)).not.toBeInTheDocument()
    expect(screen.getAllByText(/do not verify package formats, Sigstore identity/)[0]).toBeVisible()
    expect(controlled.run.mock.calls.map((call) => call[2].kind)).toEqual([
      { type: 'mldsa-sigver', variant: 65 },
      { type: 'mldsa-sigver', variant: 87 },
      { type: 'mldsa-sigver', variant: 65 },
      { type: 'digest-multipart', hashAlg: 'SHA-256' },
    ])
  })

  it('distinguishes email reference verification, generated signing, and decapsulation from CMS processing', async () => {
    render(
      <MemoryRouter>
        <CMSSigningDemo />
      </MemoryRouter>
    )
    run()
    expect(await screen.findByTestId('kat-pass-count')).toHaveTextContent('3 passed')
    const rows = screen.getAllByRole('row').filter((row) => within(row).queryByTestId('kat-status'))
    expect(within(rows[0]).getByText(/ML-DSA-65 reference signature verification/)).toBeVisible()
    expect(
      within(rows[1]).getByText('ML-DSA-65 generated-key sign/verify round trip')
    ).toBeVisible()
    expect(within(rows[2]).getByText(/ML-KEM-768 reference decapsulation/)).toBeVisible()
    expect(rows.every((row) => !within(row).queryByText(/RFC 9629/))).toBe(true)
    expect(
      screen.getAllByText(
        /RFC 9882 defines ML-DSA in CMS; RFC 9629 defines CMS KEMRecipientInfo/
      )[0]
    ).toBeVisible()
    expect(
      screen.getAllByText(/do not parse CMS, encode signed attributes, process MIME/)[0]
    ).toBeVisible()
    expect(controlled.run.mock.calls.map((call) => call[2].kind)).toEqual([
      { type: 'mldsa-sigver', variant: 65 },
      { type: 'mldsa-functional', variant: 65 },
      { type: 'mlkem-decap', variant: 768 },
    ])
  })
})

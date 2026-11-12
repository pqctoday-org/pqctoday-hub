// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { KatTestSpec } from '@/utils/katRunner'
const controlled = vi.hoisted(() => ({
  run: vi.fn(),
  generate: vi.fn(),
  pair: vi.fn(),
  register: vi.fn(),
}))
const hsm = {
  isReady: true,
  moduleRef: { current: {} },
  hSessionRef: { current: 1 },
  slotRef: { current: 0 },
  keys: [],
  log: [],
  initialize: vi.fn(),
  clearLog: vi.fn(),
  clearKeys: vi.fn(),
  removeKey: vi.fn(),
  addStepLog: vi.fn(),
  registerKey: controlled.register,
}
vi.mock('@/hooks/useHSM', () => ({ useHSM: () => hsm }))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
vi.mock('./components/FiveGDiagram', () => ({ FiveGDiagram: () => null }))
vi.mock('@/wasm/softhsm', async (original) => ({
  ...(await original<object>()),
  hsm_generateECKeyPair: (...args: unknown[]) => controlled.pair(...args),
}))
vi.mock('./services/FiveGService', () => ({
  fiveGService: {
    state: {},
    cleanup: vi.fn().mockResolvedValue(undefined),
    generateNetworkKey: (...args: unknown[]) => controlled.generate(...args),
  },
}))
vi.mock('@/utils/katRunner', async (original) => ({
  ...(await original<object>()),
  advertisedMechanisms: () => new Set(),
  runKAT: (_M: unknown, _session: number, spec: KatTestSpec) => controlled.run(spec),
}))
import { SuciFlow } from './SuciFlow'
const section = () =>
  screen.getByRole('region', { name: 'Official Profile B fixed-vector comparison' })
const steps = ['3-ecdh', '4-kdf', '5-encrypt', '6-mac', '7-e2e']
function result(spec: KatTestSpec, status = 'pass') {
  return {
    ...spec,
    status,
    algorithm: 'SUCI Profile B',
    evidence: 'published-standard-kat',
    details:
      status === 'pass'
        ? 'Controlled published comparison matched'
        : 'K_enc matched; K_mac differed',
  }
}
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  controlled.run.mockReset().mockImplementation((spec) => Promise.resolve(result(spec)))
  controlled.generate.mockReset().mockResolvedValue({
    output: 'Controlled software trace',
    pubKeyFile: 'hn.pub',
    privKeyFile: 'hn.key',
  })
  controlled.pair.mockReset().mockReturnValue({ pubHandle: 7, privHandle: 8 })
  controlled.register.mockReset()
})
describe('SUCI separate functional wizard and fixed published comparison', () => {
  it('runs all five actual configured reference kinds and leaves unrelated algorithm cases separate', async () => {
    render(<SuciFlow onBack={vi.fn()} initialProfile="B" />)
    fireEvent.click(within(section()).getByRole('button', { name: 'Run standard KATs' }))
    await within(section()).findByText('5 passed')
    expect(controlled.run.mock.calls.map(([s]) => s.kind.step)).toEqual(steps)
    expect(within(section()).getByTestId('kat-run-status')).toHaveTextContent(
      '5 of 5 checks passed'
    )
    const other = screen.getByText('5G PQC Known Answer Tests')
    // The panel has no region of its own; its enclosing card is the accessible heading's container.
    // eslint-disable-next-line testing-library/no-node-access
    const panel = other.closest('.glass-panel') as HTMLElement
    fireEvent.click(within(panel).getByRole('button', { name: 'Run known-answer checks' }))
    await within(panel).findByText('4 passed')
    expect(controlled.run.mock.calls.slice(5).map(([s]) => [s.id, s.kind])).toEqual([
      ['5g-suci-encap', { type: 'mlkem-encap-roundtrip', variant: 768 }],
      ['5g-gnb-decap', { type: 'mlkem-decap', variant: 768 }],
      ['5g-nas-sigver', { type: 'mldsa-sigver', variant: 65 }],
      ['5g-suci-ecdh-b', { type: 'ecdh-derive', curve: 'P-256' }],
    ])
    expect(controlled.generate).not.toHaveBeenCalled()
  })
  it.each(['fail', 'error', 'skip'])(
    'does not report all five passed when KDF result is %s, then allows retry',
    async (status) => {
      controlled.run.mockImplementation((spec: KatTestSpec) =>
        Promise.resolve(
          result(
            spec,
            spec.kind.type === 'suci-profile-b' && spec.kind.step === '4-kdf' ? status : 'pass'
          )
        )
      )
      render(<SuciFlow onBack={vi.fn()} initialProfile="B" />)
      const run = within(section()).getByRole('button', { name: 'Run standard KATs' })
      fireEvent.click(run)
      await within(section()).findByText('4 passed')
      expect(within(section()).queryByText('5 passed')).not.toBeInTheDocument()
      expect(within(section()).getByTestId('kat-run-status')).toHaveTextContent(
        status === 'skip' ? '1 not tested' : status === 'error' ? '1 could not run' : '1 failed'
      )
      controlled.run.mockImplementation((spec: KatTestSpec) => Promise.resolve(result(spec)))
      fireEvent.click(run)
      await within(section()).findByText('5 passed')
    }
  )
  it('keeps fixed inputs separate from editable SUPI/profile and random key operations never gain a GSMA/KAT result', async () => {
    render(<SuciFlow onBack={vi.fn()} initialProfile="B" />)
    fireEvent.change(screen.getByPlaceholderText('310260123456789'), {
      target: { value: '310260987654321' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Execute Step' }))
    await screen.findByRole('button', { name: /SoftHSM3 output/ })
    expect(controlled.generate).toHaveBeenCalledWith('B', 'hybrid')
    expect(controlled.pair).toHaveBeenCalledWith(
      hsm.moduleRef.current,
      1,
      'P-256',
      false,
      '5G Home Network Key (Telecom)'
    )
    expect(controlled.register).toHaveBeenCalledTimes(2)
    expect(
      screen.queryByRole('button', { name: /SoftHSM3 \(KAT\)|GSMA Vector Validation/ })
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/matches GSMA Reference precisely/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('profile-a-btn'))
    fireEvent.click(within(section()).getByRole('button', { name: 'Run standard KATs' }))
    await within(section()).findByText('5 passed')
    expect(controlled.run.mock.calls.map(([s]) => s.kind.step)).toEqual(steps)
    expect(within(section()).getByText(/MCC\|MNC 274012, MSIN 001002086/)).toBeInTheDocument()
  })
})

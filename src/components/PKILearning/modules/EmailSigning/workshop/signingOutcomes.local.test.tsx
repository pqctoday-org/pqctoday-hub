// SPDX-License-Identifier: AGPL-3.0-only
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom'
import { DualSignDemo } from './DualSignDemo'
import { MLDSASignDemo } from './MLDSASignDemo'
const calls = vi.hoisted(() => ({
  genKey: vi.fn(),
  mkCert: vi.fn(),
  sign: vi.fn(),
  verify: vi.fn(),
  dualSign: vi.fn(),
  dualVerify: vi.fn(),
  dispose: vi.fn(),
}))
vi.mock('../services/CMSSigningService', () => ({
  isCompositeAlg: () => false,
  CMSSigningService: class {
    genKey = calls.genKey
    mkCert = calls.mkCert
    sign = calls.sign
    verify = calls.verify
    dualSign = calls.dualSign
    dualVerify = calls.dualVerify
    dispose = calls.dispose
  },
}))
vi.mock('@/components/common/FilterDropdown', () => ({
  FilterDropdown: ({
    items,
    selectedId,
    onSelect,
    disabled,
    ariaLabel,
  }: {
    items: string[]
    selectedId: string
    onSelect: (id: string) => void
    disabled?: boolean
    ariaLabel?: string
  }) => (
    // Component-level attribution double; native dropdowns are checked in the browser.
    // eslint-disable-next-line no-restricted-syntax
    <select
      aria-label={ariaLabel ?? 'Signing algorithm'}
      value={selectedId}
      disabled={disabled}
      onChange={(e) => onSelect(e.target.value)}
    >
      {items.map((item) => (
        <option key={item}>{item}</option>
      ))}
    </select>
  ),
}))
const bytes = new Uint8Array([1, 2, 3])
beforeEach(() => {
  vi.resetAllMocks()
  calls.genKey.mockResolvedValue({ keyPem: 'sample key', pubPem: 'sample public key' })
  calls.mkCert.mockResolvedValue({ certPem: 'sample certificate' })
  calls.sign.mockResolvedValue({ signedP7m: bytes })
  calls.dualSign.mockResolvedValue({ signedP7m: bytes })
  calls.verify.mockResolvedValue({ ok: true, payload: bytes, stderrTail: '' })
  calls.dualVerify.mockResolvedValue({ ok: true, signerCount: 2, payload: bytes, stderr: '' })
})
const examples = [
  {
    name: 'dual',
    Component: DualSignDemo,
    button: 'Dual-sign + Verify',
    group: 'Verify (all SignerInfos together)',
    method: 'dualVerify' as const,
  },
  {
    name: 'single',
    Component: MLDSASignDemo,
    button: 'Sign + Verify',
    group: 'Verify',
    method: 'verify' as const,
  },
]
describe('Email signing verification outcomes', () => {
  it('rejects a malformed successful dual result that does not establish the required pair', async () => {
    calls.dualVerify.mockResolvedValue({ ok: true, signerCount: 1, payload: bytes, stderr: '' })
    render(<DualSignDemo providerReady={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Dual-sign + Verify' }))
    await waitFor(() =>
      expect(
        screen.getByRole('group', { name: 'Verify (all SignerInfos together)' })
      ).not.toHaveClass('border-status-success/30')
    )
    expect(
      await screen.findByText(/Verification failed — expected signer pair/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/Expected signer pair verified/)).not.toBeInTheDocument()
  })
  it('describes one joint check with an explicit pair requirement, without per-signer trust claims', () => {
    render(<DualSignDemo providerReady={false} />)
    expect(screen.getByText(/then runs one joint signature check/)).toBeInTheDocument()
    expect(screen.queryByText(/Verifier runs twice/)).not.toBeInTheDocument()
    expect((screen.getByLabelText('Payload') as HTMLTextAreaElement).value).not.toMatch(
      /partial match|ML-DSA-65 \+ ECDSA/
    )
  })
  it.each(examples)(
    'does not mark a rejected $name verification green or log it as success',
    async ({ Component, button, group, method }) => {
      calls[method].mockResolvedValue({
        ok: false,
        signerCount: 2,
        stderr: 'sample signature rejected',
        stderrTail: 'sample signature rejected',
      })
      render(<Component providerReady={false} />)
      fireEvent.click(screen.getByRole('button', { name: button }))
      await waitFor(() =>
        expect(
          within(screen.getByRole('log', { name: 'Operation log' })).getByText(
            /sample signature rejected/
          )
        ).toHaveClass('text-status-error')
      )
      const card = screen.getByRole('group', { name: group })
      expect(card).not.toHaveClass('border-status-success/30')
      const log = screen.getByRole('log', { name: 'Operation log' })
      expect(within(log).getByText(/sample signature rejected/)).toHaveClass('text-status-error')
      expect(within(log).queryByText('Verify completed (see result)')).not.toBeInTheDocument()
    }
  )
  it.each(examples)(
    'marks a successful $name check green and permits a fresh run',
    async ({ Component, button, group, method }) => {
      render(<Component providerReady={false} />)
      fireEvent.click(screen.getByRole('button', { name: button }))
      await waitFor(() =>
        expect(screen.getByRole('group', { name: group })).toHaveClass('border-status-success/30')
      )
      fireEvent.click(screen.getByRole('button', { name: button }))
      await waitFor(() => expect(calls[method]).toHaveBeenCalledTimes(2))
      await waitFor(() =>
        expect(screen.getByRole('group', { name: group })).toHaveClass('border-status-success/30')
      )
    }
  )
  it('preserves the actual dual-run algorithm, mode and payload after selection edits', async () => {
    render(<DualSignDemo providerReady />)
    const payload = screen.getByLabelText('Payload') as HTMLTextAreaElement
    const original = payload.value
    fireEvent.click(screen.getByRole('button', { name: 'Dual-sign + Verify' }))
    await waitFor(() =>
      expect(screen.getByRole('group', { name: 'Verify (all SignerInfos together)' })).toHaveClass(
        'border-status-success/30'
      )
    )
    fireEvent.change(screen.getByRole('combobox', { name: 'PQ signing algorithm' }), {
      target: { value: 'ML-DSA-44' },
    })
    fireEvent.change(screen.getByRole('combobox', { name: 'Classical signing algorithm' }), {
      target: { value: 'RSA-PSS' },
    })
    fireEvent.click(screen.getByRole('checkbox', { name: /Use HSM keys/ }))
    fireEvent.change(payload, { target: { value: 'new sample message' } })
    expect(screen.getByRole('status')).toHaveTextContent('Selection changed—run again')
    expect(
      within(screen.getByRole('group', { name: 'PQ key pair (Alice)' })).getByText('ML-DSA-65')
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('group', { name: 'Classical key pair (Alice)' })).getByText('EC')
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('group', { name: 'PQ key pair (Alice)' })).getByText('HSM (pkcs11:)')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('group', { name: 'Verify (all SignerInfos together)' })
    ).toHaveTextContent('ML-DSA-65 + EC')
    expect(new TextDecoder().decode(calls.dualSign.mock.calls[0][0].payload)).toBe(original)
    expect(calls.dualVerify).toHaveBeenCalledTimes(1)
  })
  it('disables both real dropdown triggers while a dual run is pending', async () => {
    let finish!: (value: { keyPem: string }) => void
    calls.genKey.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        })
    )
    render(<DualSignDemo providerReady />)
    fireEvent.click(screen.getByRole('button', { name: 'Dual-sign + Verify' }))
    expect(screen.getByRole('combobox', { name: 'PQ signing algorithm' })).toBeDisabled()
    expect(screen.getByRole('combobox', { name: 'Classical signing algorithm' })).toBeDisabled()
    await act(async () => {
      finish({ keyPem: 'sample key' })
    })
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Dual-sign + Verify' })).toBeEnabled()
    )
  })
  it('does not publish an unmounted dual run or start its dependent operations', async () => {
    let finish!: (value: { keyPem: string }) => void
    calls.genKey.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        })
    )
    const view = render(<DualSignDemo providerReady={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Dual-sign + Verify' }))
    view.unmount()
    await act(async () => {
      finish({ keyPem: 'sample key' })
    })
    expect(calls.genKey).toHaveBeenCalledTimes(1)
    expect(calls.mkCert).not.toHaveBeenCalled()
    expect(calls.dualSign).not.toHaveBeenCalled()
    expect(calls.dispose).toHaveBeenCalledTimes(1)
  })
  it('shows an operational failure and retries without claiming verification', async () => {
    calls.genKey.mockRejectedValueOnce(new Error('sample engine unavailable'))
    render(<DualSignDemo providerReady={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Dual-sign + Verify' }))
    await screen.findByText('sample engine unavailable', { exact: true })
    expect(calls.dualVerify).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Dual-sign + Verify' }))
    await waitFor(() =>
      expect(screen.getByRole('group', { name: 'Verify (all SignerInfos together)' })).toHaveClass(
        'border-status-success/30'
      )
    )
  })
})

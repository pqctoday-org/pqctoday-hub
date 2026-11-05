// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CertParser } from './CertParser'
import fixtures from './crlOutcomes.local.fixtures.json'
import observed from './crlVerifyOutcomes.local.fixtures.json'
const state = vi.hoisted(() => ({
  certificates: [] as { id: string; name: string; pem: string; tags: string[] }[],
  files: [] as { name: string; content: string }[],
  execute: vi.fn(),
}))
vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: (select: (value: unknown) => unknown) =>
    select({ artifacts: { csrs: [], certificates: state.certificates } }),
}))
vi.mock('../../../OpenSSLStudio/store', () => ({
  useOpenSSLStore: (select: (value: unknown) => unknown) => select({ files: state.files }),
}))
vi.mock('@/services/crypto/OpenSSLService', () => ({
  openSSLService: { execute: (...args: unknown[]) => state.execute(...args) },
}))
vi.mock('@/components/common/FilterDropdown', () => ({
  FilterDropdown: ({
    label,
    items,
    selectedId,
    onSelect,
  }: {
    label: string
    items: { id: string; label: string }[]
    selectedId: string
    onSelect: (id: string) => void
  }) => (
    // Actual dropdowns are exercised in browser checks; isolate verification here.
    // eslint-disable-next-line no-restricted-syntax
    <select aria-label={label} value={selectedId} onChange={(e) => onSelect(e.target.value)}>
      <option value="All">Choose sample</option>
      {items.map((item) => (
        <option key={item.id} value={item.id}>
          {item.label}
        </option>
      ))}
    </select>
  ),
}))
const p = fixtures.pem
const select = (label: string, match: string) => {
  const input = screen.getByRole('combobox', { name: label }) as HTMLSelectElement
  const option = [...input.options].find((o) => o.text.includes(match))!
  fireEvent.change(input, { target: { value: option.value } })
}
const pick = (cert = 'good', ca = 'misleading-leaf-name.pem', crl = 'unrelated-name.crl') => {
  select('Select a Certificate or CSR to inspect', cert + '.pem')
  select('Sample issuer CA (explicit trust anchor)', ca)
  select('Sample CRL', crl)
}
const run = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Check Revocation Status (CRL)' }))
const result = (crl: string, cert: string) =>
  observed.rows.find((r) => r.name === crl && r.cert === cert)!.result
beforeEach(() => {
  vi.clearAllMocks()
  state.certificates = [
    { id: 'ca', name: 'misleading-leaf-name.pem', pem: p.ca, tags: ['root', 'ca'] },
    {
      id: 'wrong-ca',
      name: 'same-subject-other-key.pem',
      pem: p['same-name-other-key-ca'],
      tags: ['root', 'ca'],
    },
    { id: 'good', name: 'good.pem', pem: p.good, tags: [] },
    { id: 'revoked', name: 'revoked.pem', pem: p.revoked, tags: [] },
  ]
  state.files = [
    { name: 'unrelated-name.crl', content: p.current },
    { name: 'misleading-leaf-name-newest.crl', content: p.expired },
    { name: 'bad-signature.crl', content: p['bad-signature'] },
    { name: 'wrong-issuer.crl', content: p['wrong-issuer'] },
    { name: 'wrong-scope.crl', content: p['wrong-scope'] },
    { name: 'delta.crl', content: p.delta },
    { name: 'malformed.crl', content: p.malformed },
  ]
  state.execute.mockResolvedValue(result('current', 'good'))
})
describe('Actual certificate parser CRL path', () => {
  it('requires explicit issuer and CRL selections', () => {
    render(<CertParser onComplete={vi.fn()} />)
    select('Select a Certificate or CSR to inspect', 'good.pem')
    expect(
      screen.queryByRole('button', { name: 'Check Revocation Status (CRL)' })
    ).not.toBeInTheDocument()
    expect(state.execute).not.toHaveBeenCalled()
  })
  it('checks the selected bytes despite misleading filenames and array order', async () => {
    render(<CertParser onComplete={vi.fn()} />)
    pick()
    run()
    await screen.findByText(/Configured sample chain and CRL check passed/)
    const [command, files] = state.execute.mock.calls[0]
    expect(command).toMatch(/-no-CApath -no-CAstore -CAfile ca.pem/)
    expect(
      new TextDecoder().decode(files.find((f: { name: string }) => f.name === 'crl.crl').data)
    ).toBe(p.current)
    expect(screen.getByText(/Only the configured direct full-CRL sample/)).toBeInTheDocument()
  })
  it('recognizes actual rejected-promise revocation and preserves its diagnostic', async () => {
    const failure = result('current', 'revoked') as { thrown: string }
    state.execute.mockRejectedValue(new Error(failure.thrown))
    render(<CertParser onComplete={vi.fn()} />)
    pick('revoked')
    run()
    await screen.findByText(/Sample certificate revoked: OpenSSL reported leaf revocation/)
    expect(
      screen.getByText(
        (_content, element) => element?.tagName === 'PRE' && element.textContent === failure.thrown
      )
    ).toBeInTheDocument()
  })
  it.each(['expired', 'future', 'bad-signature'])(
    'never labels actual %s failure revoked',
    async (crl) => {
      const failure = result(crl, 'revoked') as { thrown: string }
      state.execute.mockRejectedValue(new Error(failure.thrown))
      render(<CertParser onComplete={vi.fn()} />)
      pick('revoked')
      run()
      await screen.findByText(/revocation status not established/)
      expect(screen.queryByText(/Sample certificate revoked:/)).not.toBeInTheDocument()
    }
  )
  it.each(['wrong-issuer', 'wrong-scope', 'delta', 'malformed'])(
    'rejects unsupported %s before engine execution',
    async (crl) => {
      render(<CertParser onComplete={vi.fn()} />)
      pick('good', 'misleading-leaf-name.pem', crl + '.crl')
      run()
      await screen.findByText(/revocation status not established/)
      expect(state.execute).not.toHaveBeenCalled()
    }
  )
  it('does not accept a different key with the same subject name', async () => {
    render(<CertParser onComplete={vi.fn()} />)
    pick('good', 'same-subject-other-key.pem')
    run()
    await screen.findByText(/key identifiers differ/)
    expect(state.execute).not.toHaveBeenCalled()
  })
  it('removes the old badge when input bytes or trust selections change', async () => {
    render(<CertParser onComplete={vi.fn()} />)
    pick()
    run()
    await screen.findByText(/Configured sample chain and CRL check passed/)
    select('Sample CRL', 'bad-signature.crl')
    expect(
      screen.queryByText(/Configured sample chain and CRL check passed/)
    ).not.toBeInTheDocument()
    select('Sample CRL', 'unrelated-name.crl')
    run()
    await screen.findByText(/Configured sample chain and CRL check passed/)
    fireEvent.change(screen.getByRole('textbox', { name: 'Certificate, CSR or CRL PEM' }), {
      target: { value: p.revoked },
    })
    expect(
      screen.queryByText(/Configured sample chain and CRL check passed/)
    ).not.toBeInTheDocument()
  })
  it('invalidates a pass if the selected CA bytes are replaced', async () => {
    const view = render(<CertParser onComplete={vi.fn()} />)
    pick()
    run()
    await screen.findByText(/Configured sample chain and CRL check passed/)
    state.certificates = state.certificates.map((c) =>
      c.id === 'ca' ? { ...c, pem: p['same-name-other-key-ca'] } : c
    )
    view.rerender(<CertParser onComplete={vi.fn()} />)
    expect(
      screen.queryByText(/Configured sample chain and CRL check passed/)
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Check Revocation Status (CRL)' })
    ).not.toBeInTheDocument()
  })
  it('keeps the chain-only result bounded and clears it on issuer change', async () => {
    render(<CertParser onComplete={vi.fn()} />)
    pick()
    fireEvent.click(screen.getByRole('button', { name: 'Verify Chain Against Root CA' }))
    await screen.findByText(/Configured sample chain check passed/)
    expect(state.execute.mock.calls[0][0]).not.toContain('-crl_check')
    expect(screen.getByText(/No CRL or OCSP revocation check was requested/)).toBeInTheDocument()
    select('Sample issuer CA (explicit trust anchor)', 'same-subject-other-key.pem')
    expect(screen.queryByText(/Configured sample chain check passed/)).not.toBeInTheDocument()
  })
  it('does not mark a blank fulfilled engine response passed', async () => {
    state.execute.mockResolvedValue({ stdout: '', stderr: '', error: '', files: [] })
    render(<CertParser onComplete={vi.fn()} />)
    pick()
    run()
    await screen.findByText(/could not run/)
    expect(
      screen.queryByText(/Configured sample chain and CRL check passed/)
    ).not.toBeInTheDocument()
  })
  it('does not reassign a delayed result to newly supplied bytes', async () => {
    let complete: (value: unknown) => void = () => {}
    state.execute.mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve
        })
    )
    render(<CertParser onComplete={vi.fn()} />)
    pick()
    run()
    await waitFor(() => expect(state.execute).toHaveBeenCalled())
    // External input updates can happen while an async check is in flight.
    fireEvent.change(screen.getByRole('textbox', { name: 'Certificate, CSR or CRL PEM' }), {
      target: { value: p.revoked },
    })
    complete(result('current', 'good'))
    await waitFor(() =>
      expect(
        screen.getByRole('textbox', { name: 'Certificate, CSR or CRL PEM' })
      ).not.toBeDisabled()
    )
    expect(
      screen.queryByText(/Configured sample chain and CRL check passed/)
    ).not.toBeInTheDocument()
  })
  it('shows operation errors and permits a successful retry', async () => {
    state.execute.mockRejectedValueOnce(new Error('Sample worker unavailable'))
    render(<CertParser onComplete={vi.fn()} />)
    pick()
    run()
    await screen.findByText(/could not run/)
    run()
    await screen.findByText(/Configured sample chain and CRL check passed/)
  })
})

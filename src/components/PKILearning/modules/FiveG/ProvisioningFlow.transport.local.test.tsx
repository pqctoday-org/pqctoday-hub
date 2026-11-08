// SPDX-License-Identifier: AGPL-3.0-only
import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProvisioningFlow } from './ProvisioningFlow'
import { fiveGService, type ProvisioningEnvelope } from './services/FiveGService'
vi.mock('./services/FiveGService', () => ({
  fiveGService: {
    generateSubKey: vi.fn(),
    computeOPc: vi.fn(),
    personalizeUSIM: vi.fn(),
    encryptTransport: vi.fn(),
    importAtUDM: vi.fn(),
  },
}))
vi.mock('@/components/ui/code-block', () => ({ CodeBlock: () => null }))
const k = '11'.repeat(16),
  opc = '22'.repeat(16)
const envelope: ProvisioningEnvelope = {
  format: 'pqctoday-provisioning-batch',
  version: 1,
  algorithm: 'AES-128-GCM',
  ivHex: '33'.repeat(12),
  ciphertextHex: '44'.repeat(64),
}
const transportKey = {
  type: 'secret',
  privateMarker: 'must-never-be-displayed',
} as unknown as CryptoKey
const imported = {
  record: { imsi: '310260123456789', k, opc },
  checks: { authentication: 'Passed', identity: 'Matched', opc: 'Consistent' },
}
const run = async (name = 'Run sample calculation') => {
  fireEvent.click(screen.getByRole('button', { name }))
  await screen.findByRole('button', { name: 'Next Step' })
}
const next = () => fireEvent.click(screen.getByRole('button', { name: 'Next Step' }))
async function reachTransport() {
  await run()
  next()
  await run()
  next()
  await run('Show process walkthrough')
  next()
}
async function reachImport() {
  await reachTransport()
  await run('Encrypt sample envelope')
  next()
}
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(fiveGService.generateSubKey).mockResolvedValue(k)
  vi.mocked(fiveGService.computeOPc).mockResolvedValue(opc)
  vi.mocked(fiveGService.personalizeUSIM).mockResolvedValue('Illustrated card writing only')
  vi.mocked(fiveGService.encryptTransport).mockResolvedValue({ envelope, transportKey })
  vi.mocked(fiveGService.importAtUDM).mockResolvedValue(imported)
})
describe('authenticated provisioning sample UI', () => {
  it('passes the actual serialized envelope and separate key, then shows the accepted in-memory record', async () => {
    render(<ProvisioningFlow onBack={vi.fn()} />)
    await reachImport()
    const input = screen.getByRole('textbox', { name: 'Serialized transport envelope' })
    expect(JSON.parse((input as HTMLTextAreaElement).value)).toEqual(envelope)
    fireEvent.click(screen.getByRole('button', { name: 'Authenticate and import sample' }))
    await screen.findByRole('region', { name: 'Accepted in-memory sample record' })
    expect(fiveGService.importAtUDM).toHaveBeenCalledWith(
      JSON.stringify(envelope, null, 2),
      transportKey,
      '310260123456789'
    )
    expect(
      screen.getByRole('region', { name: 'Accepted in-memory sample record' })
    ).toHaveTextContent(k)
    expect(
      screen.getByRole('region', { name: 'Accepted in-memory sample record' })
    ).toHaveTextContent('authentication: Passed')
    expect(screen.queryByText(/must-never-be-displayed/)).not.toBeInTheDocument()
  })
  it('clears accepted result and completion on edits, rejects a tampered envelope, and accepts a valid retry', async () => {
    render(<ProvisioningFlow onBack={vi.fn()} />)
    await reachImport()
    fireEvent.click(screen.getByRole('button', { name: 'Authenticate and import sample' }))
    await screen.findByRole('region', { name: 'Accepted in-memory sample record' })
    const input = screen.getByRole('textbox', { name: 'Serialized transport envelope' })
    fireEvent.change(input, { target: { value: 'tampered' } })
    expect(
      screen.queryByRole('region', { name: 'Accepted in-memory sample record' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Finish provisioning sample' })
    ).not.toBeInTheDocument()
    vi.mocked(fiveGService.importAtUDM).mockRejectedValueOnce(new Error('Authentication failed'))
    fireEvent.click(screen.getByRole('button', { name: 'Authenticate and import sample' }))
    await screen.findByText('Authentication failed', { exact: true })
    expect(
      screen.queryByRole('region', { name: 'Accepted in-memory sample record' })
    ).not.toBeInTheDocument()
    fireEvent.change(input, { target: { value: JSON.stringify(envelope) } })
    fireEvent.click(screen.getByRole('button', { name: 'Authenticate and import sample' }))
    await screen.findByRole('region', { name: 'Accepted in-memory sample record' })
  })
  it('suppresses an import that completes after envelope editing and permits a fresh attempt', async () => {
    let resolve!: (value: typeof imported) => void
    render(<ProvisioningFlow onBack={vi.fn()} />)
    await reachImport()
    vi.mocked(fiveGService.importAtUDM).mockReturnValueOnce(
      new Promise((r) => {
        resolve = r
      })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Authenticate and import sample' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Serialized transport envelope' }), {
      target: { value: JSON.stringify(envelope) + '\n' },
    })
    await act(async () => resolve(imported))
    expect(
      screen.queryByRole('region', { name: 'Accepted in-memory sample record' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Finish provisioning sample' })
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Authenticate and import sample' }))
    await screen.findByRole('region', { name: 'Accepted in-memory sample record' })
  })
  it('invalidates envelope and accepted record when K or OPc is regenerated', async () => {
    render(<ProvisioningFlow onBack={vi.fn()} />)
    await reachImport()
    fireEvent.click(screen.getByRole('button', { name: 'Authenticate and import sample' }))
    await screen.findByRole('region', { name: 'Accepted in-memory sample record' })
    for (let i = 0; i < 3; i++)
      fireEvent.click(screen.getByRole('button', { name: 'Go to previous step' }))
    await run()
    next()
    await run('Show process walkthrough')
    next()
    expect(
      (
        screen.getByRole('textbox', {
          name: 'Serialized transport envelope',
        }) as HTMLTextAreaElement
      ).value
    ).toBe('')
    expect(
      screen.queryByRole('region', { name: 'Accepted in-memory sample record' })
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Go to previous step' }))
    fireEvent.click(screen.getByRole('button', { name: 'Go to previous step' }))
    fireEvent.click(screen.getByRole('button', { name: 'Go to previous step' }))
    await run()
    next()
    expect(screen.queryByText(/Computed OPc/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Next Step' })).not.toBeInTheDocument()
  })
  it('does not invoke dependent operations after unmount and ignores duplicate execution while busy', async () => {
    let resolve!: (value: string) => void
    vi.mocked(fiveGService.generateSubKey).mockReturnValueOnce(
      new Promise((r) => {
        resolve = r
      })
    )
    const view = render(<ProvisioningFlow onBack={vi.fn()} />)
    const button = screen.getByRole('button', { name: 'Run sample calculation' })
    fireEvent.click(button)
    fireEvent.click(button)
    expect(fiveGService.generateSubKey).toHaveBeenCalledTimes(1)
    view.unmount()
    await act(async () => resolve(k))
    expect(fiveGService.computeOPc).not.toHaveBeenCalled()
    expect(fiveGService.encryptTransport).not.toHaveBeenCalled()
    expect(fiveGService.importAtUDM).not.toHaveBeenCalled()
  })
  it('does not publish delayed encryption after unmount', async () => {
    let resolve!: (value: { envelope: typeof envelope; transportKey: CryptoKey }) => void
    const view = render(<ProvisioningFlow onBack={vi.fn()} />)
    await reachTransport()
    vi.mocked(fiveGService.encryptTransport).mockReturnValueOnce(
      new Promise((r) => {
        resolve = r
      })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Encrypt sample envelope' }))
    view.unmount()
    await act(async () => resolve({ envelope, transportKey }))
    expect(fiveGService.importAtUDM).not.toHaveBeenCalled()
  })
  it('discards encryption after envelope editing and retries without retaining its obsolete key', async () => {
    let resolve!: (value: { envelope: typeof envelope; transportKey: CryptoKey }) => void
    render(<ProvisioningFlow onBack={vi.fn()} />)
    await reachTransport()
    vi.mocked(fiveGService.encryptTransport).mockReturnValueOnce(
      new Promise((r) => {
        resolve = r
      })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Encrypt sample envelope' }))
    const input = screen.getByRole('textbox', { name: 'Serialized transport envelope' })
    fireEvent.change(input, { target: { value: 'changed during encryption' } })
    await act(async () => resolve({ envelope, transportKey }))
    expect((input as HTMLTextAreaElement).value).toBe('changed during encryption')
    expect(screen.queryByRole('button', { name: 'Next Step' })).not.toBeInTheDocument()
    expect(
      screen.queryByText(/Browser WebCrypto AES-128-GCM encrypted this sample record/)
    ).not.toBeInTheDocument()
    await run('Encrypt sample envelope')
    next()
    fireEvent.click(screen.getByRole('button', { name: 'Authenticate and import sample' }))
    await screen.findByRole('region', { name: 'Accepted in-memory sample record' })
  })
  it('keeps a late unmounted import out of a fresh flow', async () => {
    let resolve!: (value: typeof imported) => void
    const view = render(<ProvisioningFlow onBack={vi.fn()} />)
    await reachImport()
    vi.mocked(fiveGService.importAtUDM).mockReturnValueOnce(
      new Promise((r) => {
        resolve = r
      })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Authenticate and import sample' }))
    view.unmount()
    render(<ProvisioningFlow onBack={vi.fn()} />)
    await act(async () => resolve(imported))
    expect(
      screen.queryByRole('region', { name: 'Accepted in-memory sample record' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Finish provisioning sample' })
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Run sample calculation' })).toBeEnabled()
  })
  it('retries an encryption-service failure without an old envelope or completed step', async () => {
    render(<ProvisioningFlow onBack={vi.fn()} />)
    await reachTransport()
    vi.mocked(fiveGService.encryptTransport).mockRejectedValueOnce(
      new Error('Browser crypto unavailable')
    )
    fireEvent.click(screen.getByRole('button', { name: 'Encrypt sample envelope' }))
    await screen.findByText('Browser crypto unavailable', { exact: true })
    expect(
      (
        screen.getByRole('textbox', {
          name: 'Serialized transport envelope',
        }) as HTMLTextAreaElement
      ).value
    ).toBe('')
    expect(screen.queryByRole('button', { name: 'Next Step' })).not.toBeInTheDocument()
    await run('Encrypt sample envelope')
    expect(
      JSON.parse(
        (
          screen.getByRole('textbox', {
            name: 'Serialized transport envelope',
          }) as HTMLTextAreaElement
        ).value
      )
    ).toEqual(envelope)
  })
})

// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { LiveHSMProvider } from './LiveHSMProvider'

vi.mock('./MLDSASignDemo', () => ({
  MLDSASignDemo: ({ providerReady }: { providerReady: boolean }) => (
    <div>Signing controls enabled: {String(providerReady)}</div>
  ),
}))
vi.mock('./MLKEMEncryptDemo', () => ({ MLKEMEncryptDemo: () => null }))
vi.mock('./DualSignDemo', () => ({ DualSignDemo: () => null }))

class SampleWorker {
  static current: SampleWorker
  listener?: (event: MessageEvent) => void
  postMessage = vi.fn()
  terminate = vi.fn()
  constructor() {
    SampleWorker.current = this
  }
  addEventListener(_type: string, listener: (event: MessageEvent) => void) {
    this.listener = listener
  }
  emit(data: unknown) {
    this.listener?.({ data } as MessageEvent)
  }
}

const writeText = vi.fn().mockResolvedValue(undefined)
const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
beforeEach(() => {
  writeText.mockClear()
  vi.stubGlobal('Worker', SampleWorker)
  vi.stubGlobal('isSecureContext', true)
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  })
})
afterEach(() => {
  vi.unstubAllGlobals()
  if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard)
  else Reflect.deleteProperty(navigator, 'clipboard')
})

// Clipboard/context controls only. Actual provider execution and independent
// CMS verification are separate native acceptance, not inferred from these mocks.
describe('named HSM command recipe', () => {
  it('copies the three complete commands without an ENGINE or token-keygen substitute', async () => {
    render(<LiveHSMProvider />)
    const recipe = screen.getByRole('region', { name: 'ML-DSA-65 HSM command recipe' })
    const cases = [
      [
        'Issue the sample certificate',
        "openssl req -new -x509 -key 'pkcs11:object=alice;type=private?pin-value=1234' -out alice.crt -subj '/CN=Alice/O=PQC Workshop/C=US' -days 365",
      ],
      [
        'Sign the entered payload',
        "openssl cms -sign -signer alice.crt -inkey 'pkcs11:object=alice;type=private?pin-value=1234' -in payload-alice.bin -binary -nodetach -outform DER -out signed-alice.p7m -md sha256",
      ],
      [
        'Verify and recover the payload',
        'openssl cms -verify -in signed-alice.p7m -inform DER -certfile alice.crt -CAfile alice.crt -binary -out out-alice.bin',
      ],
    ] as const
    for (const [title, expected] of cases) {
      expect(within(recipe).getByLabelText(title)).toHaveTextContent(expected)
      fireEvent.click(within(recipe).getByRole('button', { name: `Copy: ${title}` }))
      await waitFor(() => expect(writeText).toHaveBeenLastCalledWith(expected))
      expect(expected).not.toMatch(/-engine|-keyform|genpkey/)
    }
    expect(writeText).toHaveBeenCalledTimes(3)
  })

  it('separates readable recipe and initialization from executed signing outcomes', () => {
    render(<LiveHSMProvider />)
    expect(screen.getByRole('region', { name: 'ML-DSA-65 HSM command recipe' })).toBeVisible()
    expect(screen.queryByText(/Signing controls enabled/)).not.toBeInTheDocument()
    act(() => SampleWorker.current.emit({ type: 'READY' }))
    expect(SampleWorker.current.postMessage).toHaveBeenCalledWith({
      type: 'LOAD_AND_INIT',
      requestId: 'cms-init',
    })
    act(() => SampleWorker.current.emit({ type: 'INIT_DONE', status: 'ok', code: 0 }))
    expect(screen.getByText('Signing controls enabled: true')).toBeInTheDocument()
    expect(screen.getByText(/Registration alone does not establish/)).toBeInTheDocument()
    expect(screen.queryByText(/Signed payload|Verification successful/)).not.toBeInTheDocument()
    expect(
      screen.getByText(/Another worker or a native terminal needs its own setup and key/)
    ).toBeInTheDocument()
  })

  it('does not turn an unavailable provider or failed initialization into an HSM result', () => {
    render(<LiveHSMProvider />)
    act(() => SampleWorker.current.emit({ type: 'INIT_DONE', status: 'provider_missing', code: 0 }))
    expect(screen.getByText('Signing controls enabled: false')).toBeInTheDocument()
    act(() => SampleWorker.current.emit({ type: 'ERROR', error: 'sample initialization failed' }))
    expect(screen.getByText('sample initialization failed')).toBeInTheDocument()
    expect(screen.queryByText(/Signing controls enabled/)).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'ML-DSA-65 HSM command recipe' })).toBeVisible()
  })
})

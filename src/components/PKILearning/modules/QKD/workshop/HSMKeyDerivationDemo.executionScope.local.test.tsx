// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { HSMKeyDerivationDemo } from './HSMKeyDerivationDemo'
const fixture = vi.hoisted(() => ({
  hsm: {
    isReady: true,
    phase: 'session_open',
    engine: 'rust',
    moduleRef: { current: {} as unknown },
    hSessionRef: { current: 11 },
    registerKey: vi.fn(),
    keys: [],
    log: [],
    clearLog: vi.fn(),
    removeKey: vi.fn(),
  },
  imported: vi.fn(),
  derived: vi.fn(),
  random: vi.fn(),
}))
const LABEL = 'session-key-v1\x00'
vi.mock('@/hooks/useHSM', () => ({ useHSM: () => fixture.hsm }))
vi.mock('@/wasm/softhsm', () => ({
  // Real PKCS#11 value (src/wasm/softhsm/constants.ts): the demo passes it as the KBKDF PRF.
  CKM_SHA256_HMAC: 0x251,
  hsm_destroyObject: vi.fn(),
  hsm_importGenericSecret: fixture.imported,
  hsm_kbkdf: fixture.derived,
}))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/KatValidationPanel', () => ({ KatValidationPanel: () => null }))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
vi.mock('@/components/shared/HsmKeyInspector', () => ({ HsmKeyInspector: () => null }))
const originalCrypto = Object.getOwnPropertyDescriptor(window, 'crypto')
beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  fixture.hsm.isReady = true
  fixture.hsm.phase = 'session_open'
  fixture.hsm.engine = 'rust'
  fixture.hsm.moduleRef.current = {}
  fixture.hsm.hSessionRef.current = 11
  fixture.hsm.registerKey.mockImplementation(() => undefined)
  fixture.imported.mockReturnValue(7)
  // A deterministic stand-in KDF: the output depends on the first context byte
  // (fixed input = 15-byte label || 16-byte context || 32-bit L), so the demo's
  // repeated-context check matches and its changed-context check differs.
  fixture.derived.mockImplementation(
    (_m: unknown, _s: number, _h: number, _mech: number, fixed: Uint8Array) =>
      new Uint8Array(32).fill(fixed[LABEL.length] === 0x55 ? 0xab : 0xcd)
  )
  fixture.random.mockImplementation((bytes: Uint8Array) => bytes.fill(0x55))
  Object.defineProperty(window, 'crypto', {
    configurable: true,
    value: { getRandomValues: fixture.random },
  })
})
afterEach(() => {
  vi.useRealTimers()
  if (originalCrypto) Object.defineProperty(window, 'crypto', originalCrypto)
})
async function click(name: string | RegExp, ms: number) {
  fireEvent.click(screen.getByRole('button', { name }))
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}
async function fetchSample() {
  await click(/Fetch QKD Key|Retrieve|Fetch Key|Simulate Key Retrieval/, 600)
}

describe('QKD sample HSM step outcomes and origins', () => {
  it('failed live import is not an illustration or a completed prerequisite; retry is explicit', async () => {
    fixture.imported.mockImplementationOnce(() => {
      throw new Error('sample create failed')
    })
    render(<HSMKeyDerivationDemo />)
    await fetchSample()
    expect(screen.getByText('CKA_SENSITIVE = FALSE')).toBeInTheDocument()
    expect(screen.getByText('CKA_EXTRACTABLE = TRUE')).toBeInTheDocument()
    await click('Import into HSM', 300)
    expect(screen.getByRole('alert')).toHaveTextContent('sample create failed')
    expect(
      screen.queryByRole('button', { name: 'Attempt Sample HSM Derivation' })
    ).not.toBeInTheDocument()
    expect(fixture.derived).not.toHaveBeenCalled()
    expect(fixture.imported).toHaveBeenCalledTimes(1)
    await click('Import into HSM', 300)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Attempt Sample HSM Derivation' })
    ).toBeInTheDocument()
    expect(fixture.imported).toHaveBeenCalledTimes(2)
  })

  it('registration failure also keeps the import prerequisite incomplete', async () => {
    fixture.hsm.registerKey.mockImplementationOnce(() => {
      throw new Error('sample registry failed')
    })
    render(<HSMKeyDerivationDemo />)
    await fetchSample()
    await click('Import into HSM', 300)
    expect(screen.getByRole('alert')).toHaveTextContent('sample registry failed')
    expect(fixture.derived).not.toHaveBeenCalled()
    expect(
      screen.queryByRole('button', { name: 'Attempt Sample HSM Derivation' })
    ).not.toBeInTheDocument()
  })

  it('derivation error and wrong output length cannot produce a key; successful retry retains the unchanged call contract', async () => {
    render(<HSMKeyDerivationDemo />)
    await fetchSample()
    await click('Import into HSM', 300)
    fixture.derived.mockImplementationOnce(() => {
      throw new Error('sample PRF rejected')
    })
    await click('Attempt Sample HSM Derivation', 400)
    expect(screen.getByRole('alert')).toHaveTextContent('sample PRF rejected')
    expect(
      screen.queryByRole('heading', { name: /Step 4: Session Key Output/ })
    ).not.toBeInTheDocument()
    fixture.derived.mockReturnValueOnce(new Uint8Array(0))
    await click('Attempt Sample HSM Derivation', 400)
    expect(screen.getByRole('alert')).toHaveTextContent('requested 32 bytes')
    await click('Attempt Sample HSM Derivation', 400)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('displayed in JavaScript')
    // Original and repeated context show the same key; the changed context a different one.
    expect(screen.getAllByText('ab'.repeat(32))).toHaveLength(2)
    expect(screen.getByText('cd'.repeat(32))).toBeInTheDocument()
    // The successful attempt is the last three calls: original, repeated, changed context.
    const [original, repeated, changed] = fixture.derived.mock.calls.slice(-3)
    for (const call of [original, repeated, changed]) {
      expect(call[2]).toBe(7)
      expect(call[3]).toBe(0x00000251)
      expect(call[5]).toBe(32)
    }
    const fixedInput = (context: number[]) =>
      new Uint8Array([...new TextEncoder().encode(LABEL), ...context, 0, 0, 1, 0])
    const context = new Array(16).fill(0x55)
    expect(original[4]).toEqual(fixedInput(context))
    expect(repeated[4]).toEqual(fixedInput(context))
    expect(changed[4]).toEqual(fixedInput([0x54, ...context.slice(1)]))
    expect(fixture.imported).toHaveBeenCalledTimes(1)
  })

  it('mode change invalidates a pending import and explicit illustration cannot claim derivation', async () => {
    const view = render(<HSMKeyDerivationDemo />)
    await fetchSample()
    fireEvent.click(screen.getByRole('button', { name: 'Import into HSM' }))
    expect(screen.getByRole('button', { name: 'Importing…' })).toBeDisabled()
    fixture.hsm.isReady = false
    fixture.hsm.moduleRef.current = null
    view.rerender(<HSMKeyDerivationDemo />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(fixture.imported).not.toHaveBeenCalled()
    await click('Import into HSM', 300)
    await click('Show Illustrative Random Output', 400)
    expect(screen.getByText('Illustrative random output — no KDF executed.')).toBeInTheDocument()
    // An illustration runs no KDF, so it shows no repeated/changed-context comparison.
    expect(screen.queryByRole('region', { name: 'Repeated context' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Changed context' })).not.toBeInTheDocument()
    expect(fixture.derived).not.toHaveBeenCalled()
    fixture.hsm.isReady = true
    fixture.hsm.moduleRef.current = {}
    view.rerender(<HSMKeyDerivationDemo />)
    expect(
      screen.queryByRole('heading', { name: /Step 4: Session Key Output/ })
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('failed HSM initialization cannot silently become an illustration', async () => {
    fixture.hsm.isReady = false
    fixture.hsm.phase = 'error'
    fixture.hsm.moduleRef.current = null
    render(<HSMKeyDerivationDemo />)
    await fetchSample()
    await click('Import into HSM', 300)
    expect(screen.getByRole('alert')).toHaveTextContent('unavailable or still initializing')
    expect(
      screen.queryByRole('button', { name: 'Show Illustrative Random Output' })
    ).not.toBeInTheDocument()
    expect(fixture.imported).not.toHaveBeenCalled()
    expect(fixture.derived).not.toHaveBeenCalled()
  })

  it('keeps busy until a derivation settles and discards its result after a mode change', async () => {
    const view = render(<HSMKeyDerivationDemo />)
    await fetchSample()
    await click('Import into HSM', 300)
    fireEvent.click(screen.getByRole('button', { name: 'Attempt Sample HSM Derivation' }))
    fixture.hsm.isReady = false
    fixture.hsm.phase = 'idle'
    fixture.hsm.moduleRef.current = null
    view.rerender(<HSMKeyDerivationDemo />)
    expect(screen.getByRole('button', { name: 'Importing…' })).toBeDisabled()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400)
    })
    expect(screen.getByRole('button', { name: 'Import into HSM' })).toBeEnabled()
    expect(
      screen.queryByRole('heading', { name: /Step 4: Session Key Output/ })
    ).not.toBeInTheDocument()
    expect(screen.queryByText('ab'.repeat(32))).not.toBeInTheDocument()
  })

  it.each(['module', 'session', 'module-and-session'] as const)(
    'rejects an imported handle after %s changes without a readiness or engine change',
    async (change) => {
      const view = render(<HSMKeyDerivationDemo />)
      await fetchSample()
      await click('Import into HSM', 300)
      if (change.includes('module')) fixture.hsm.moduleRef.current = { replacement: true }
      if (change.includes('session')) fixture.hsm.hSessionRef.current = 22
      view.rerender(<HSMKeyDerivationDemo />)
      expect(fixture.hsm.isReady).toBe(true)
      expect(fixture.hsm.engine).toBe('rust')
      await click('Attempt Sample HSM Derivation', 0)
      expect(screen.getByRole('alert')).toHaveTextContent('different HSM module or session')
      expect(fixture.derived).not.toHaveBeenCalled()
      expect(fixture.imported).toHaveBeenCalledTimes(1)
      expect(screen.getByRole('button', { name: 'Import into HSM' })).toBeEnabled()
      await click('Import into HSM', 300)
      await click('Attempt Sample HSM Derivation', 400)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(fixture.imported).toHaveBeenCalledTimes(2)
      expect(fixture.derived.mock.calls[0][0]).toBe(fixture.hsm.moduleRef.current)
      expect(fixture.derived.mock.calls[0][1]).toBe(fixture.hsm.hSessionRef.current)
    }
  )

  it('unmount during delayed fetch prevents obsolete sample generation', async () => {
    const view = render(<HSMKeyDerivationDemo />)
    fireEvent.click(
      screen.getByRole('button', {
        name: /Fetch QKD Key|Retrieve|Fetch Key|Simulate Key Retrieval/,
      })
    )
    view.unmount()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600)
    })
    expect(fixture.random).not.toHaveBeenCalled()
    expect(fixture.imported).not.toHaveBeenCalled()
  })
})

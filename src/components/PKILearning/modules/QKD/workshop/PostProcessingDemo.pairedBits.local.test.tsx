// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { act, fireEvent, render, screen, within, waitFor } from '@testing-library/react'
import { PostProcessingDemo } from './PostProcessingDemo'

// Control only generator inputs and async WebCrypto outcomes. The actual
// comparison, public transcript, budget, Toeplitz extraction and packing run.
const sample = vi.hoisted(() => ({
  alice: Array(16).fill(0) as number[],
  bob: Array(16).fill(0) as number[],
  prefix: 4 as number | null,
  accepted: true,
  generate: vi.fn(),
  digest: vi.fn(),
  importKey: vi.fn(),
  deriveBits: vi.fn(),
  random: vi.fn(),
}))
vi.mock('../services/BB84Service', async (original) => ({
  ...(await original<typeof import('../services/BB84Service')>()),
  runFullProtocol: (...args: unknown[]) => {
    sample.generate(...args)
    return {
      siftedKeyAlice: [...sample.alice],
      siftedKeyBob: [...sample.bob],
      sampleSize: sample.prefix,
      qber: 0,
    }
  },
  getFinalKey: () => (sample.accepted ? sample.alice.slice(sample.prefix ?? 0) : []),
}))
const WORKED = '101100101010011011100001'
const SEED = '1011001001010110111010010110010'
const descriptor = Object.getOwnPropertyDescriptor(window, 'crypto')
beforeEach(() => {
  vi.clearAllMocks()
  sample.alice = Array(16).fill(0)
  sample.bob = Array(16).fill(0)
  sample.prefix = 4
  sample.accepted = true
  sample.digest.mockReset().mockResolvedValue(new Uint8Array(32).buffer)
  sample.importKey.mockReset().mockResolvedValue({ sampleKey: true })
  sample.deriveBits.mockReset().mockResolvedValue(new Uint8Array(32).fill(0x33).buffer)
  sample.random.mockReset().mockImplementation((bytes: Uint8Array) => {
    if (bytes.length === SEED.length) bytes.set([...SEED].map(Number))
    else bytes.fill(0x55)
    return bytes
  })
  Object.defineProperty(window, 'crypto', {
    configurable: true,
    value: {
      getRandomValues: sample.random,
      subtle: { digest: sample.digest, importKey: sample.importKey, deriveBits: sample.deriveBits },
    },
  })
})
afterEach(() => {
  if (descriptor) Object.defineProperty(window, 'crypto', descriptor)
})
function click(name: string) {
  fireEvent.click(screen.getByRole('button', { name }))
}
function worked() {
  click('Load worked paired sample')
  click('Continue to paired comparison')
  click('Compare both retained samples')
}
function extracted() {
  worked()
  click('Compute bounded sample output')
}
async function digestReady() {
  extracted()
  click('Calculate Sample Digest')
  await screen.findByRole('button', { name: 'Derive Sample HKDF Output' })
}
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
const extraction = () => screen.getByRole('region', { name: 'Bounded extraction result' })
const comparison = () =>
  screen.getByRole('region', { name: 'Paired comparison and public transcript' })

describe('Paired postprocessing sample controller', () => {
  it('runs the actual worked comparison and extracts the independent eight-bit fixture for both parties', () => {
    render(<PostProcessingDemo />)
    extracted()
    expect(comparison()).toHaveTextContent('0 differing bit(s)')
    expect(comparison()).toHaveTextContent('Public transcript budget: 12 message bits')
    expect(extraction()).toHaveTextContent('N=24; H=24; P=12; R=4')
    expect(extraction()).toHaveTextContent('L=min(N,max(0,H−P−R))=8 bits')
    expect(extraction()).toHaveTextContent(`Public seed (31 bits): ${SEED}`)
    expect(extraction()).toHaveTextContent('Alice extracted bits: 11000011')
    expect(extraction()).toHaveTextContent('Bob extracted bits: 11000011')
    expect(sample.random.mock.calls[0][0]).toHaveLength(31)
    expect(sample.digest).not.toHaveBeenCalled()
  })
  it.each([1, 2])('rejects %i retained mismatch(es), even when public parities agree', (count) => {
    sample.bob = [0, 0, 0, 0, 1, count === 2 ? 1 : 0, ...Array(10).fill(0)]
    render(<PostProcessingDemo />)
    click('Generate Sifted Key')
    click('Continue to paired comparison')
    click('Compare both retained samples')
    expect(sample.generate).toHaveBeenCalledWith(64, false, 1.0, 0.05)
    expect(screen.getByRole('alert')).toHaveTextContent(`${count} retained bit(s) differ`)
    expect(comparison()).toHaveTextContent(`${count} differing bit(s)`)
    if (count === 2)
      expect(
        within(comparison()).getByText('Bits 1–4: Alice parity 0; Bob parity 0.')
      ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Compute bounded sample output' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Calculate Sample Digest' })
    ).not.toBeInTheDocument()
    expect(sample.digest).not.toHaveBeenCalled()
  })
  it('keeps a generator rejection incomplete and supports a separate worked-pair retry', () => {
    sample.accepted = false
    render(<PostProcessingDemo />)
    click('Generate Sifted Key')
    expect(screen.getByRole('alert')).toHaveTextContent('generator rejected this sample')
    expect(screen.queryByRole('textbox', { name: 'Alice retained bits' })).not.toBeInTheDocument()
    worked()
    click('Compute bounded sample output')
    expect(extraction()).toHaveTextContent('=8 bits')
  })
  it('rejects a missing prefix count and malformed paired input rather than selecting a prefix', () => {
    sample.prefix = null
    render(<PostProcessingDemo />)
    click('Generate Sifted Key')
    expect(screen.getByRole('alert')).toHaveTextContent('did not return a disclosed-prefix count')
    click('Load worked paired sample')
    fireEvent.change(screen.getByRole('textbox', { name: 'Bob retained bits' }), {
      target: { value: '10x1' },
    })
    click('Compare both retained samples')
    expect(screen.getByRole('alert')).toHaveTextContent('Enter only binary bits')
    expect(
      screen.queryByRole('region', { name: 'Bounded extraction result' })
    ).not.toBeInTheDocument()
  })
  it('produces a genuine zero-length result with no seed and keeps SHA explicitly separate', () => {
    sample.alice = [1, 0, 0, 0, 0, 0, 0, 1]
    sample.bob = [...sample.alice]
    sample.prefix = 0
    render(<PostProcessingDemo />)
    click('Generate Sifted Key')
    click('Continue to paired comparison')
    click('Compare both retained samples')
    click('Compute bounded sample output')
    expect(extraction()).toHaveTextContent('N=8; H=8; P=4; R=4')
    expect(extraction()).toHaveTextContent('=0 bits')
    expect(extraction()).toHaveTextContent('Public seed (0 bits): Not needed for zero output')
    expect(extraction()).toHaveTextContent('Alice extracted bits: No output')
    expect(extraction()).toHaveTextContent('Bob extracted bits: No output')
    expect(sample.random).not.toHaveBeenCalled()
    expect(sample.digest).not.toHaveBeenCalled()
    expect(screen.getByText(/Separate SHA-256 format example/)).toBeInTheDocument()
  })
  it('rejects missing or invalid budgets and retries with the explicit valid assumptions', () => {
    render(<PostProcessingDemo />)
    worked()
    const h = screen.getByRole('spinbutton', { name: 'Assumed retained entropy H (bits)' })
    const r = screen.getByRole('spinbutton', { name: 'Illustrative reserve R (bits)' })
    fireEvent.change(h, { target: { value: '' } })
    click('Compute bounded sample output')
    expect(screen.getByRole('alert')).toHaveTextContent('Assumed entropy')
    expect(
      screen.queryByRole('region', { name: 'Bounded extraction result' })
    ).not.toBeInTheDocument()
    fireEvent.change(h, { target: { value: '24' } })
    fireEvent.change(r, { target: { value: '-1' } })
    click('Compute bounded sample output')
    expect(screen.getByRole('alert')).toHaveTextContent('reserve')
    fireEvent.change(r, { target: { value: '4' } })
    click('Compute bounded sample output')
    expect(extraction()).toHaveTextContent('=8 bits')
  })
  it('reports a random-source failure without a fabricated output and supports retry', () => {
    sample.random.mockImplementationOnce(() => {
      throw new Error('sample random source unavailable')
    })
    render(<PostProcessingDemo />)
    worked()
    click('Compute bounded sample output')
    expect(screen.getByRole('alert')).toHaveTextContent('sample random source unavailable')
    expect(
      screen.queryByRole('region', { name: 'Bounded extraction result' })
    ).not.toBeInTheDocument()
    click('Compute bounded sample output')
    expect(extraction()).toHaveTextContent('Alice extracted bits: 11000011')
  })
  it.each(['error', 'short output'])(
    'keeps digest %s incomplete and permits a valid retry',
    async (mode) => {
      if (mode === 'error') sample.digest.mockRejectedValueOnce(new Error('digest unavailable'))
      else sample.digest.mockResolvedValueOnce(new Uint8Array(1).buffer)
      render(<PostProcessingDemo />)
      extracted()
      click('Calculate Sample Digest')
      await screen.findByRole('alert')
      expect(
        screen.queryByRole('button', { name: 'Derive Sample HKDF Output' })
      ).not.toBeInTheDocument()
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Calculate Sample Digest' })).not.toBeDisabled()
      )
      click('Calculate Sample Digest')
      await screen.findByRole('button', { name: 'Derive Sample HKDF Output' })
    }
  )
  it('retries import and derive failures without showing a successful HKDF result', async () => {
    sample.importKey.mockRejectedValueOnce(new Error('import unavailable'))
    sample.deriveBits.mockRejectedValueOnce(new Error('derive unavailable'))
    render(<PostProcessingDemo />)
    await digestReady()
    click('Derive Sample HKDF Output')
    expect(await screen.findByRole('alert')).toHaveTextContent('import unavailable')
    expect(sample.deriveBits).not.toHaveBeenCalled()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Derive Sample HKDF Output' })).not.toBeDisabled()
    )
    click('Derive Sample HKDF Output')
    expect(await screen.findByRole('alert')).toHaveTextContent('derive unavailable')
    expect(screen.queryByRole('region', { name: 'Sample HKDF result' })).not.toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Derive Sample HKDF Output' })).not.toBeDisabled()
    )
    click('Derive Sample HKDF Output')
    await screen.findByRole('region', { name: 'Sample HKDF result' })
  })
  it('holds busy through input replacement until a pending digest settles and suppresses the old result', async () => {
    const pending = deferred<ArrayBuffer>()
    sample.digest.mockReturnValueOnce(pending.promise)
    render(<PostProcessingDemo />)
    extracted()
    click('Calculate Sample Digest')
    expect(screen.getByRole('button', { name: 'Hashing…' })).toBeDisabled()
    fireEvent.change(screen.getByRole('textbox', { name: 'Bob retained bits' }), {
      target: { value: WORKED.slice(0, -1) + '0' },
    })
    click('Load worked paired sample')
    click('Continue to paired comparison')
    click('Compare both retained samples')
    expect(screen.getByRole('button', { name: 'Compute bounded sample output' })).toBeDisabled()
    click('Compute bounded sample output')
    expect(sample.digest).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('status')).toHaveTextContent('operation is settling')
    await act(async () => {
      pending.resolve(new Uint8Array(32).buffer)
      await pending.promise
    })
    expect(
      screen.queryByRole('button', { name: 'Derive Sample HKDF Output' })
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Compute bounded sample output' })).not.toBeDisabled()
    click('Compute bounded sample output')
    click('Calculate Sample Digest')
    await screen.findByRole('button', { name: 'Derive Sample HKDF Output' })
  })
  it('cancels publication during import and does not start dependent deriveBits for the canceled context', async () => {
    const pending = deferred<object>()
    sample.importKey.mockReturnValueOnce(pending.promise)
    render(<PostProcessingDemo />)
    await digestReady()
    click('Derive Sample HKDF Output')
    click('Edit extraction assumptions')
    expect(screen.getByRole('button', { name: 'Compute bounded sample output' })).toBeDisabled()
    await act(async () => {
      pending.resolve({ oldKey: true })
      await pending.promise
    })
    expect(sample.deriveBits).not.toHaveBeenCalled()
    expect(screen.queryByRole('region', { name: 'Sample HKDF result' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Compute bounded sample output' })).not.toBeDisabled()
  })
  it('does not start deriveBits after unmount while an import is pending', async () => {
    const pending = deferred<object>()
    sample.importKey.mockReturnValueOnce(pending.promise)
    const view = render(<PostProcessingDemo />)
    await digestReady()
    click('Derive Sample HKDF Output')
    expect(sample.importKey).toHaveBeenCalledTimes(1)
    view.unmount()
    await act(async () => {
      pending.resolve({ oldKey: true })
      await pending.promise
    })
    expect(sample.deriveBits).not.toHaveBeenCalled()
  })
  it.each(['resolve', 'reject'])(
    'suppresses a late derive %s without replacing the current validation error',
    async (outcome) => {
      const pending = deferred<ArrayBuffer>()
      sample.deriveBits.mockReturnValueOnce(pending.promise)
      render(<PostProcessingDemo />)
      await digestReady()
      click('Derive Sample HKDF Output')
      await waitFor(() => expect(sample.deriveBits).toHaveBeenCalledTimes(1))
      fireEvent.change(screen.getByRole('textbox', { name: 'Alice retained bits' }), {
        target: { value: '10x1' },
      })
      click('Compare both retained samples')
      expect(screen.getByRole('alert')).toHaveTextContent('Enter only binary bits')
      await act(async () => {
        if (outcome === 'resolve') pending.resolve(new Uint8Array(32).buffer)
        else pending.reject(new Error('obsolete derive failure'))
        await pending.promise.catch(() => {})
      })
      expect(screen.getByRole('alert')).toHaveTextContent('Enter only binary bits')
      expect(screen.queryByRole('region', { name: 'Sample HKDF result' })).not.toBeInTheDocument()
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    }
  )
})

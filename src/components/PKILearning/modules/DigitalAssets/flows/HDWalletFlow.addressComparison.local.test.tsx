// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Button } from '@/components/ui/button'
import { HDKey } from '@scure/bip32'
import { hmac } from '@noble/hashes/hmac.js'
import { sha512 } from '@noble/hashes/sha2.js'
import { HDWalletFlow } from './HDWalletFlow'

const sample = vi.hoisted(() => ({
  ready: false,
  fault: '' as string,
  extraction: 0,
  handles: new Map<number, { key: HDKey | Uint8Array; chain?: Uint8Array }>(),
  nextHandle: 1,
  seed: new Uint8Array() as Uint8Array,
}))
vi.mock('@/services/crypto/OpenSSLService', () => ({
  openSSLService: { execute: vi.fn(async () => ({ stdout: '00'.repeat(32) })) },
}))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
vi.mock('@/components/shared/HsmKeyInspector', () => ({ HsmKeyInspector: () => null }))
vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    isReady: sample.ready,
    moduleRef: { current: {} },
    hSessionRef: { current: 1 },
    addStepLog: vi.fn(),
    registerKey: vi.fn(),
    keys: [],
    logs: [],
  }),
}))
vi.mock('@/wasm/softhsm', () => ({
  hsm_importGenericSecret: (_module: unknown, _session: number, seed: Uint8Array) => {
    sample.seed = seed
    return 0
  },
  hsm_extractKeyValue: (_module: unknown, _session: number, handle: number) => {
    const chain = ['bitcoin', 'ethereum', 'solana'][sample.extraction++]
    if (sample.fault === 'error') throw new Error('Sample extraction error')
    if (sample.fault === chain) return new Uint8Array(32).fill(1)
    const record = sample.handles.get(handle)!
    return record.key instanceof HDKey ? record.key.privateKey! : record.key
  },
  hsm_generateRandom: vi.fn(),
  hsm_pbkdf2: vi.fn(),
}))
vi.mock('@/wasm/softhsm/classical', () => ({
  hsm_bip32MasterDerive: (_module: unknown, _session: number, _seed: number, curve: string) => {
    const handle = sample.nextHandle++
    if (curve === 'secp256k1') {
      sample.handles.set(handle, { key: HDKey.fromMasterSeed(sample.seed) })
    } else {
      const digest = hmac(sha512, new TextEncoder().encode('ed25519 seed'), sample.seed)
      sample.handles.set(handle, { key: digest.slice(0, 32), chain: digest.slice(32) })
    }
    return handle
  },
  hsm_bip32ChildDerive: (
    _module: unknown,
    _session: number,
    parent: number,
    index: number,
    hardened: boolean
  ) => {
    const record = sample.handles.get(parent)!
    const childIndex = index + (hardened ? 0x80000000 : 0)
    const handle = sample.nextHandle++
    if (record.key instanceof HDKey) {
      sample.handles.set(handle, { key: record.key.deriveChild(childIndex) })
    } else {
      const data = new Uint8Array(37)
      data.set(record.key, 1)
      new DataView(data.buffer).setUint32(33, childIndex, false)
      const digest = hmac(sha512, record.chain!, data)
      sample.handles.set(handle, { key: digest.slice(0, 32), chain: digest.slice(32) })
    }
    return handle
  },
}))
vi.mock('../components/StepWizard', () => ({
  StepWizard: (props: {
    onExecute: () => void
    onNext: () => void
    isStepComplete: boolean
    error: string | null
    output: unknown
    steps: { diagram?: React.ReactNode }[]
    currentStepIndex: number
  }) => (
    <>
      <Button onClick={props.onExecute}>Execute sample step</Button>
      <Button onClick={props.onNext}>Next sample step</Button>
      <p>{props.isStepComplete ? 'Step complete' : 'Step incomplete'}</p>
      {props.error && <p role="alert">{props.error}</p>}
      <pre>{JSON.stringify(props.output)}</pre>
      {props.steps[props.currentStepIndex].diagram}
    </>
  ),
}))

async function prepareDerivation() {
  const view = render(<HDWalletFlow onBack={vi.fn()} />)
  for (let step = 0; step < 3; step++) {
    fireEvent.click(screen.getByRole('button', { name: 'Execute sample step' }))
    await screen.findByText('Step complete')
    fireEvent.click(screen.getByRole('button', { name: 'Next sample step' }))
  }
  sample.ready = true
  view.rerender(<HDWalletFlow onBack={vi.fn()} />)
  return view
}

beforeEach(() => {
  sample.ready = false
  sample.fault = ''
  sample.extraction = 0
  sample.handles.clear()
  sample.nextHandle = 1
})

describe('Wallet sample address comparison', () => {
  it('completes only after all three actual sample addresses agree', async () => {
    await prepareDerivation()
    fireEvent.click(screen.getByRole('button', { name: 'Execute sample step' }))
    await screen.findByText('Step complete')
    expect(screen.getByText(/Functional comparison passed/)).toBeInTheDocument()
    expect(screen.getByText(/SoftHSM3 \(functional comparison\)/)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'BIP44 Derivation Tree' })).toBeInTheDocument()
  })

  it.each(['bitcoin', 'ethereum', 'solana', 'error'])(
    'withholds completion and tree for %s, then allows a valid retry',
    async (fault) => {
      await prepareDerivation()
      sample.fault = fault
      fireEvent.click(screen.getByRole('button', { name: 'Execute sample step' }))
      await screen.findByRole('alert')
      expect(screen.getByText('Step incomplete')).toBeInTheDocument()
      expect(
        screen.queryByRole('heading', { name: 'BIP44 Derivation Tree' })
      ).not.toBeInTheDocument()
      expect(screen.queryByText(/Functional comparison passed/)).not.toBeInTheDocument()
      sample.fault = ''
      sample.extraction = 0
      fireEvent.click(screen.getByRole('button', { name: 'Execute sample step' }))
      await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
      await screen.findByText('Step complete')
      expect(screen.getByText(/Functional comparison passed/)).toBeInTheDocument()
      sample.fault = fault
      sample.extraction = 0
      fireEvent.click(screen.getByRole('button', { name: 'Execute sample step' }))
      await screen.findByRole('alert')
      expect(screen.getByText('Step incomplete')).toBeInTheDocument()
      expect(
        screen.queryByRole('heading', { name: 'BIP44 Derivation Tree' })
      ).not.toBeInTheDocument()
    }
  )
})

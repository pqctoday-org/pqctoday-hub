// SPDX-License-Identifier: AGPL-3.0-only
// Exercises the unmodified full C2 lesson and actual completion runner/UI.
// Provider responses are controlled outcome fixtures; no crypto correctness claim.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { Pkcs11LogEntry } from '@/wasm/softhsm'
import { HsmLearnView } from './HsmLearnView'

const fixture = vi.hoisted(() => {
  const calls: Pkcs11LogEntry[] = []
  const note = (fn: string, rv: number) => {
    const names = new Map([
      [0, 'CKR_OK'],
      [0xc0, 'CKR_SIGNATURE_INVALID'],
      [0x30, 'CKR_DEVICE_ERROR'],
      [0x21, 'CKR_DATA_LEN_RANGE'],
    ])
    calls.unshift({
      id: calls.length + 1,
      timestamp: '',
      fn,
      args: '',
      rvHex: '0x' + rv.toString(16).padStart(8, '0'),
      rvName: names.get(rv) ?? 'CKR_UNKNOWN',
      ms: 0,
      ok: rv === 0,
    })
  }
  return {
    calls,
    note,
    externalVerifyRv: 0,
    externalSigning: false,
    externalVerifications: 0,
    shortInputCalls: 0,
  }
})
vi.mock('../HsmContext', () => ({
  useHsmContext: () => ({
    moduleRef: { current: {} },
    hSessionRef: { current: 1 },
    slotRef: { current: 0 },
    hsmLog: fixture.calls,
    hsmLogRef: { current: fixture.calls },
    addHsmStepLog: vi.fn(),
  }),
}))
vi.mock('@/components/Playground/components/MiniPkcsLog', () => ({
  MiniPkcsLog: () => null,
}))
vi.mock('@/components/Playground/keystore/HsmKeyTable', () => ({
  HsmKeyTable: () => null,
}))
vi.mock('@/components/Playground/keystore/discoverHsmObjects', () => ({
  discoverHsmObjects: vi.fn(),
}))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({
  Pkcs11LogPanel: () => null,
}))
vi.mock('@/wasm/softhsm', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/wasm/softhsm')>()),
  hsm_digest: vi.fn(() => new Uint8Array(64).fill(0x55)),
}))
vi.mock('@/wasm/softhsm/v33', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/wasm/softhsm/v33')>()),
  hsm_detectV33Support: vi.fn(() => ({
    compSig: true,
    compSigExternalHash: true,
    compKem: true,
    externalMu: true,
  })),
  hsm_generateCompositeKeyPair: vi.fn(() => ({ privHandle: 7, pubHandle: 8 })),
  // Opaque correctly sized public fixture for the existing C2 selected set.
  hsm_readAttrRv: vi.fn(() => ({ rv: 0, value: new Uint8Array(1952 + 65) })),
  hsm_compositeSignRv: vi.fn(
    (
      _module: unknown,
      _session: number,
      _key: number,
      data: Uint8Array,
      options?: { externalHash?: boolean }
    ) => {
      fixture.externalSigning = options?.externalHash === true
      if (fixture.externalSigning && data.length === 63) {
        fixture.shortInputCalls++
        fixture.note('C_Sign', 0x21)
        return { rv: 0x21, step: 'C_Sign' }
      }
      fixture.note('C_Sign', 0)
      return {
        rv: 0,
        step: 'C_Sign',
        signature: new Uint8Array(3309 + 64).fill(0x66),
      }
    }
  ),
  hsm_compositeVerifyRv: vi.fn(
    (
      _module: unknown,
      _session: number,
      _key: number,
      _message: Uint8Array,
      signature: Uint8Array
    ) => {
      // Preserve the actual lesson's separate stripped-half expected refusal.
      const rv =
        signature.length === 3309 ? 0xc0 : fixture.externalSigning ? fixture.externalVerifyRv : 0
      if (fixture.externalSigning) fixture.externalVerifications++
      fixture.note('C_Verify', rv)
      return { rv, step: 'C_Verify' }
    }
  ),
}))

const show = () =>
  render(
    <MemoryRouter>
      <HsmLearnView
        track="v33"
        focus={{ lessonId: 'v33-composite-mldsa', nonce: 1 }}
        onTryInWorkbench={() => {}}
      />
    </MemoryRouter>
  )
function externalStep() {
  const row = screen.getByText('C_Sign (CKM_COMP_SIG_EXTERNAL_HASH)', { exact: true }).closest('li')
  if (!row) throw new Error('Missing actual external-hash step row')
  return within(row)
}
function shortInputStep() {
  const row = screen
    .getByText('C_Sign (CKM_COMP_SIG_EXTERNAL_HASH, 63-byte input)', {
      exact: true,
    })
    .closest('li')
  if (!row) throw new Error('Missing actual following short-input step row')
  return within(row)
}
beforeEach(() => {
  fixture.calls.length = 0
  fixture.externalVerifyRv = 0
  fixture.externalSigning = false
  fixture.externalVerifications = 0
  fixture.shortInputCalls = 0
  localStorage.clear()
  vi.clearAllMocks()
})

describe('actual external-hash positive lesson completion', () => {
  it.each([
    { rv: 0xc0, name: 'CKR_SIGNATURE_INVALID' },
    { rv: 0x30, name: 'CKR_DEVICE_ERROR' },
  ])(
    '$name leaves the positive step incomplete, stops dependent execution, and allows a valid retry',
    async ({ rv, name }) => {
      fixture.externalVerifyRv = rv
      show()
      fireEvent.click(screen.getByRole('button', { name: 'Run all' }))
      await waitFor(() =>
        expect(externalStep().getByRole('button', { name: 'Retry' })).toBeEnabled()
      )
      expect(externalStep().getByText(`C_Verify → ${name}`, { exact: true })).toBeInTheDocument()
      expect(externalStep().queryByText('Refused, as expected')).not.toBeInTheDocument()
      expect(shortInputStep().getByRole('button', { name: 'Run' })).toBeDisabled()
      expect(fixture.externalVerifications).toBe(1)
      expect(fixture.shortInputCalls).toBe(0)
      expect(screen.queryByText('Notes', { exact: true })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Run all' })).toBeEnabled()

      fixture.externalVerifyRv = 0
      fireEvent.click(screen.getByRole('button', { name: 'Run all' }))
      await screen.findByText('Notes', { exact: true })
      expect(screen.getByRole('button', { name: 'Run all' })).toBeDisabled()
      expect(fixture.externalVerifications).toBe(2)
      expect(fixture.shortInputCalls).toBe(1)
      expect(externalStep().queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
      expect(
        externalStep().getByText(/Verifying that signature over the full message.*CKR_OK/)
      ).toBeInTheDocument()
      expect(screen.getByText('Notes', { exact: true })).toBeInTheDocument()
    }
  )

  it('completes the actual full lesson only after valid external-hash verification', async () => {
    show()
    fireEvent.click(screen.getByRole('button', { name: 'Run all' }))
    await screen.findByText('Notes', { exact: true })
    expect(screen.getByRole('button', { name: 'Run all' })).toBeDisabled()
    expect(fixture.externalVerifications).toBe(1)
    expect(fixture.shortInputCalls).toBe(1)
    expect(
      externalStep().getByText(/Verifying that signature over the full message.*CKR_OK/)
    ).toBeInTheDocument()
    expect(externalStep().queryByText('Refused, as expected')).not.toBeInTheDocument()
    expect(screen.getByText('Notes', { exact: true })).toBeInTheDocument()
  })
})

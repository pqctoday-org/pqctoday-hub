// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The HPKE workshop's v3.3 draft sequence and the loaded engine:
 *  - choosing a KEM the draft's composite KEM does not cover drops the workshop
 *    out of the v3.3 sequence, and that is a sequence switch like any other: step
 *    progress, generated keys and the call log are cleared;
 *  - "Not in this engine yet" is an answer about one engine; it stops showing
 *    once the other engine is loaded.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import '@testing-library/jest-dom'

const hsmStub = vi.hoisted(() => ({
  isReady: true,
  engine: 'rust' as 'cpp' | 'rust',
  moduleRef: { current: {} as object | null },
  slotRef: { current: 0 },
  hSessionRef: { current: 1 },
  keys: [] as unknown[],
  log: [] as unknown[],
  registerKey: vi.fn(),
  removeKey: vi.fn(),
  addStepLog: vi.fn(),
  clearKeys: vi.fn(),
  clearLog: vi.fn(),
}))
const support = vi.hoisted(() => ({ compKem: true }))

vi.mock('@/hooks/useHSM', () => ({ useHSM: () => hsmStub }))
vi.mock('@/wasm/softhsm/v33', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/wasm/softhsm/v33')>()),
  hsm_detectV33Support: vi.fn(() => ({ compKem: support.compKem })),
}))

import { HpkeWorkshop } from './HpkeWorkshop'

const flat = (s: string) => s.replace(/\s+/g, ' ')
const pageText = () => flat(document.body.textContent ?? '')

const chooseKem = (label: string) => {
  fireEvent.click(screen.getByRole('button', { name: 'HPKE KEM' }))
  fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: label }))
}

describe('HPKE workshop: v3.3 draft sequence and engine changes', () => {
  beforeEach(() => {
    hsmStub.engine = 'rust'
    hsmStub.isReady = true
    support.compKem = true
    hsmStub.clearKeys.mockClear()
    hsmStub.clearLog.mockClear()
  })

  it('a KEM change that leaves the v3.3 sequence resets keys and log like any sequence switch', () => {
    render(<HpkeWorkshop />)
    fireEvent.click(screen.getByRole('button', { name: /PKCS#11 v3\.3 draft — CKM_COMP_KEM/ }))
    expect(pageText()).toContain('CKK_COMP_KEM keypair')
    hsmStub.clearKeys.mockClear()
    hsmStub.clearLog.mockClear()

    chooseKem('ML-KEM-768 (PQ only)')

    expect(pageText()).not.toContain('CKK_COMP_KEM keypair')
    expect(pageText()).toContain('Its encapsulation key IS pkR')
    expect(hsmStub.clearKeys).toHaveBeenCalledTimes(1)
    expect(hsmStub.clearLog).toHaveBeenCalledTimes(1)
  })

  it('a KEM change that stays inside the v3.3 sequence keeps it', () => {
    render(<HpkeWorkshop />)
    fireEvent.click(screen.getByRole('button', { name: /PKCS#11 v3\.3 draft — CKM_COMP_KEM/ }))
    chooseKem('MLKEM768-P256 (PQ-hybrid)')
    expect(pageText()).toContain('CKK_COMP_KEM keypair')
  })

  it('a KEM change inside the composed sequence also starts the run again', () => {
    render(<HpkeWorkshop />)
    hsmStub.clearKeys.mockClear()
    hsmStub.clearLog.mockClear()
    chooseKem('ML-KEM-768 (PQ only)')
    expect(hsmStub.clearKeys).toHaveBeenCalledTimes(1)
    expect(hsmStub.clearLog).toHaveBeenCalledTimes(1)
    expect(pageText()).toContain('Its encapsulation key IS pkR')
  })

  it('choosing the KEM that is already selected changes nothing', () => {
    render(<HpkeWorkshop />)
    hsmStub.clearKeys.mockClear()
    hsmStub.clearLog.mockClear()
    chooseKem('MLKEM768-X25519 (PQ-hybrid)')
    expect(hsmStub.clearKeys).not.toHaveBeenCalled()
    expect(hsmStub.clearLog).not.toHaveBeenCalled()
  })

  it('"Not in this engine yet" is dropped when the other engine is loaded', () => {
    support.compKem = false
    const { rerender } = render(<HpkeWorkshop />)
    fireEvent.click(screen.getByRole('button', { name: /PKCS#11 v3\.3 draft — CKM_COMP_KEM/ }))
    expect(pageText()).toContain('Not in this engine yet')

    hsmStub.engine = 'cpp'
    rerender(<HpkeWorkshop />)
    expect(pageText()).not.toContain('Not in this engine yet')

    hsmStub.engine = 'rust'
    rerender(<HpkeWorkshop />)
    expect(pageText()).toContain('Not in this engine yet')
  })
})

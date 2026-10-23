// SPDX-License-Identifier: AGPL-3.0-only
/**
 * "Simulate State Loss" no longer edits a counter on the page. It asks the HSM to
 * take the live key back to an earlier signature and reports the reply, and the
 * counter on the page is always read from the engine, so the counter, the
 * "left" figures in the signature log and the banner cannot disagree.
 *
 * The engine here is a fake that behaves as the real ones do (the real-engine
 * proof is stateRollbackProbe.local.test.ts): it counts down one leaf per
 * signature and refuses the three rollback calls. A second fake lets the counter
 * write through, to prove the page then follows the engine instead of claiming a refusal.
 */
import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'
import type { UseHSMResult } from '@/hooks/useHSM'
import { StateManagementVisualizer } from './StateManagementVisualizer'

let remaining = 32
let engineAllowsCounterWrite = false

vi.mock('@/wasm/softhsm/stateful', () => ({
  hsm_generateStatefulKeyPair: vi.fn(() => ({ privHandle: 11, pubHandle: 12 })),
  hsm_statefulSignBytes: vi.fn(() => {
    remaining -= 1
    return new Uint8Array(60)
  }),
  hsm_getKeysRemaining: vi.fn(() => remaining),
}))
vi.mock('@/wasm/softhsm', async (original) => ({
  ...(await original<typeof import('@/wasm/softhsm')>()),
  hsm_extractKeyValue: vi.fn(() => new Uint8Array(60)),
}))

const fakeModule = () =>
  ({
    HEAPU8: new Uint8Array(4096),
    _malloc: vi.fn(() => 64),
    _free: vi.fn(),
    setValue: vi.fn(),
    getValue: vi.fn(() => 0),
    _C_SetAttributeValue: vi.fn(() => {
      if (!engineAllowsCounterWrite) return 0x10 // CKR_ATTRIBUTE_READ_ONLY
      remaining = 29
      return 0
    }),
    _C_GetAttributeValue: vi.fn(() => 0x11), // CKR_ATTRIBUTE_SENSITIVE
    _C_CopyObject: vi.fn(() => 0x1b), // CKR_ACTION_PROHIBITED
    _C_DestroyObject: vi.fn(() => 0),
  }) as unknown as UseHSMResult['moduleRef']['current']

const fakeHsm = (): UseHSMResult =>
  ({
    isReady: true,
    moduleRef: { current: fakeModule() },
    hSessionRef: { current: 1 },
    registerKey: vi.fn(),
  }) as unknown as UseHSMResult

/** Click Sign Message once and wait for the page to show `used` signatures. */
const signOnce = async (used: number) => {
  fireEvent.click(screen.getByRole('button', { name: /Sign Message/ }))
  expect(await screen.findByText(`Used: ${used}`)).toBeInTheDocument()
}
const signUpTo = async (used: number) => {
  for (let i = 1; i <= used; i++) await signOnce(i)
}

describe('StateManagementVisualizer: Simulate State Loss', () => {
  beforeEach(() => {
    remaining = 32
    engineAllowsCounterWrite = false
  })

  it('shows the HSM refusing the rollback and keeps the counter and the log in step', async () => {
    render(<StateManagementVisualizer hsm={fakeHsm()} />)
    await signUpTo(5)
    expect(screen.getByText('5 / 32')).toBeInTheDocument()
    expect(screen.getByText('Remaining: 27')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Simulate State Loss/ }))
    const result = await screen.findByTestId('rollback-result')
    expect(within(result).getByText(/ROLLBACK REFUSED/)).toBeInTheDocument()
    expect(within(result).getByText('CKR_ATTRIBUTE_READ_ONLY')).toBeInTheDocument()
    expect(within(result).getByText('CKR_ATTRIBUTE_SENSITIVE')).toBeInTheDocument()
    expect(within(result).getByText('CKR_ACTION_PROHIBITED')).toBeInTheDocument()
    expect(result.textContent).toContain('no leaf was reused')
    expect(result.textContent).toContain('from 5 to 3')
    expect(result.textContent).toContain('leaves 3 to 4 available again')
    // the counter did not move, and the old banner's claims are gone
    expect(screen.getByText('5 / 32')).toBeInTheDocument()
    expect(screen.getByText('Used: 5')).toBeInTheDocument()
    expect(screen.queryByText(/rolled back to index/)).not.toBeInTheDocument()
    expect(screen.queryByText(/KEY COMPROMISE/)).not.toBeInTheDocument()

    // signing goes on at the next leaf, and the log says so
    await signOnce(6)
    expect(screen.getByText('6 / 32')).toBeInTheDocument()
    expect(screen.getByText('#0005')).toBeInTheDocument()
    expect(screen.getByText('26 left')).toBeInTheDocument()
    // every leaf appears in the log exactly once: #0003 was signed before the attempt, not again after it
    const leaves = screen.getAllByText(/^#\s*\d{4}$/).map((e) => e.textContent?.replace(/\s/g, ''))
    expect(leaves.sort()).toEqual(['#0000', '#0001', '#0002', '#0003', '#0004', '#0005'])
  })

  it('follows the engine instead of claiming a refusal when the engine lets the counter be written', async () => {
    engineAllowsCounterWrite = true
    render(<StateManagementVisualizer hsm={fakeHsm()} />)
    await signUpTo(5)
    fireEvent.click(screen.getByRole('button', { name: /Simulate State Loss/ }))
    const result = await screen.findByTestId('rollback-result')
    expect(
      within(result).getByText(/THE ENGINE LET PART OF THE ROLLBACK THROUGH/)
    ).toBeInTheDocument()
    expect(within(result).queryByText(/ROLLBACK REFUSED/)).not.toBeInTheDocument()
    expect(result.textContent).not.toContain('no leaf was reused')
    // 29 left on the engine means 3 used: the page reads that, it does not invent a number
    expect(screen.getByText('3 / 32')).toBeInTheDocument()
    expect(screen.getByText('Remaining: 29')).toBeInTheDocument()
  })

  it('has no old banner text and clears the result on Reset', async () => {
    render(<StateManagementVisualizer hsm={fakeHsm()} />)
    await signUpTo(2)
    fireEvent.click(screen.getByRole('button', { name: /Simulate State Loss/ }))
    await screen.findByTestId('rollback-result')
    fireEvent.click(screen.getByRole('button', { name: /Reset/ }))
    expect(screen.queryByTestId('rollback-result')).not.toBeInTheDocument()
  })
})

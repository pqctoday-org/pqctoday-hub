// SPDX-License-Identifier: AGPL-3.0-only
//
// Engine-free tests for Build › "v3.3 draft" (V33TestBench). The engine is
// replaced by a stub whose mechanism list has external µ but no composites —
// today's shipped engine — so these pin the safety net: composite sets read
// "not in this engine yet", never a failure, and every known-answer row shows
// the vector source and commit. The real-engine run of the same checks is
// v33DraftFeatures.local.test.ts.
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { V33TestBench, setSupportHint } from './V33TestBench'
import { classifyV33Support, COMPOSITE_KEM_SETS, COMPOSITE_SIG_SETS } from '@/wasm/softhsm/v33'

vi.mock('../../hsm/HsmContext', () => ({
  useHsmContext: () => ({
    moduleRef: { current: {} },
    hSessionRef: { current: 1 },
    slotRef: { current: 0 },
    autoInit: vi.fn().mockResolvedValue(true),
    lastInitErrorRef: { current: null },
    hsmLog: [],
  }),
}))

vi.mock('../../components/MiniPkcsLog', () => ({ MiniPkcsLog: () => null }))

const TODAY = classifyV33Support(
  [0x403b, 0x403c],
  (t) => ({ ulMinKeySize: 0, ulMaxKeySize: 0, flags: t === 0x403b ? 0x400 : 0x2800 }),
  '3.2'
)

vi.mock('@/wasm/softhsm/v33', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/wasm/softhsm/v33')>()
  return { ...actual, hsm_detectV33Support: () => TODAY }
})

vi.mock('@/wasm/pkcs11ConformanceRunner/v33DraftFeatures', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/wasm/pkcs11ConformanceRunner/v33DraftFeatures')>()
  return {
    ...actual,
    // The real functions, minus the engine: support says "no composites",
    // so they return not-in-engine rows without touching the module.
    loadV33Vectors: async () => ({ kem: { tests: [] }, sig: { m: '', ctx: '', tests: [] } }),
    runExternalMuChecks: () => [],
    runKeysRemainingChecks: () => [
      {
        id: 'v33.keys-remaining.xmss',
        section: 'keys-remaining',
        title: 'CKA_KEYS_REMAINING on XMSS-SHA2_10_256',
        status: 'not-in-engine',
        observed: 'C_GetAttributeValue(CKA_KEYS_REMAINING) → CKR_ATTRIBUTE_TYPE_INVALID',
        expected: 'readable as 0x61c',
      },
    ],
  }
})

describe('V33TestBench', () => {
  it('states the draft status and lists all 30 parameter sets', () => {
    render(<V33TestBench />)
    expect(screen.getByText(/unpublished OASIS working draft/i)).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(COMPOSITE_KEM_SETS.length)
    fireEvent.click(screen.getByRole('tab', { name: /ML-DSA \(18\)/ }))
    expect(screen.getAllByRole('radio')).toHaveLength(COMPOSITE_SIG_SETS.length)
    expect(screen.getByText('CKP_COMP_SIG_MLDSA87_ECDSA_P521_SHA512')).toBeInTheDocument()
  })

  it('Detect: composites read "not in this engine yet", external µ is advertised', async () => {
    render(<V33TestBench />)
    fireEvent.click(screen.getByRole('button', { name: 'Detect' }))
    expect(await screen.findByText(/· reports Cryptoki 3\.2$/)).toBeInTheDocument()
    expect(screen.getByText(/CKM_COMP_KEM — not in this engine yet/)).toBeInTheDocument()
    expect(screen.getByText('CKM_ML_DSA_EXTERNAL_MU')).toBeInTheDocument()
    const table = screen.getByRole('table', { name: /Composite parameter sets/ })
    expect(within(table).getAllByText('not in this engine yet')).toHaveLength(12)
  })

  it('running a set on an engine without composites never shows a failure', async () => {
    render(<V33TestBench />)
    fireEvent.click(screen.getByRole('button', { name: /Run selected set/ }))
    await waitFor(() =>
      expect(screen.getAllByText('Not in this engine yet').length).toBeGreaterThan(0)
    )
    expect(screen.queryByText('Fail')).not.toBeInTheDocument()
  })

  it('known-answer rows show the vector source and commit, and are not failures', async () => {
    render(<V33TestBench />)
    fireEvent.click(screen.getByRole('button', { name: /Run known-answer checks/ }))
    expect(
      await screen.findByRole('table', { name: /Known-answer check results/ })
    ).toBeInTheDocument()
    const table = screen.getByRole('table', { name: /Known-answer check results/ })
    expect(within(table).getAllByText(/lamps-wg\/draft-composite-kem @ d77e754/)).toHaveLength(12)
    expect(within(table).getAllByText(/lamps-wg\/draft-composite-sigs @ f0627ab/)).toHaveLength(18)
    expect(within(table).queryByText('Fail')).not.toBeInTheDocument()
  })

  it('links to the matching lesson and to the conformance group', () => {
    const onOpenLesson = vi.fn()
    const onOpenConformance = vi.fn()
    render(<V33TestBench onOpenLesson={onOpenLesson} onOpenConformance={onOpenConformance} />)
    fireEvent.click(screen.getByRole('button', { name: /Lesson C3: Composite ML-KEM/ }))
    expect(onOpenLesson).toHaveBeenCalledWith('v33-composite-mlkem')
    fireEvent.click(screen.getByRole('button', { name: /Lesson C4: External µ/ }))
    expect(onOpenLesson).toHaveBeenCalledWith('v33-external-mu')
    fireEvent.click(screen.getByRole('button', { name: /Build › Conformance/ }))
    expect(onOpenConformance).toHaveBeenCalled()
  })
})

describe('setSupportHint', () => {
  const set = COMPOSITE_KEM_SETS[3]
  it('before detection, without the mechanism, and inside / outside the advertised range', () => {
    expect(setSupportHint(null, 'kem', set)).toBe('not checked yet')
    expect(setSupportHint(TODAY, 'kem', set)).toBe('not in this engine yet')
    const withKem = (min: number, max: number) =>
      classifyV33Support(
        [0x4040, 0x4041],
        () => ({ ulMinKeySize: min, ulMaxKeySize: max, flags: 0 }),
        '3.2'
      )
    expect(setSupportHint(withKem(1000, 2000), 'kem', set)).toMatch(/^advertised/)
    expect(setSupportHint(withKem(1, 2), 'kem', set)).toMatch(/^outside/)
  })
})

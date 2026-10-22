// SPDX-License-Identifier: AGPL-3.0-only
//
// The Learn tab's third track, "PKCS#11 v3.3 (working draft)" (owner
// decision D5), engine-free: the track is reachable, it states the draft
// status, a deep link can open a given lesson, and a step that needs a v3.3
// mechanism the engine does not advertise shows "Not in this engine yet" —
// neutrally, not as a failure — and lets the lesson continue.
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { HsmLearnView } from './HsmLearnView'
import { classifyV33Support } from '@/wasm/softhsm/v33'

vi.mock('../HsmContext', () => ({
  useHsmContext: () => ({
    moduleRef: { current: {} },
    hSessionRef: { current: 1 },
    slotRef: { current: 0 },
    autoInit: vi.fn().mockResolvedValue(true),
    lastInitErrorRef: { current: null },
    hsmLog: [],
    hsmLogRef: { current: [] },
    addHsmStepLog: vi.fn(),
  }),
}))
vi.mock('@/components/Playground/components/MiniPkcsLog', () => ({ MiniPkcsLog: () => null }))
vi.mock('@/components/Playground/keystore/HsmKeyTable', () => ({ HsmKeyTable: () => null }))
vi.mock('@/components/Playground/keystore/discoverHsmObjects', () => ({
  discoverHsmObjects: () => {},
}))
vi.mock('@/wasm/softhsm/v33', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/wasm/softhsm/v33')>()
  return {
    ...actual,
    // Today's engine: external µ only, no composites.
    hsm_detectV33Support: () => actual.classifyV33Support([0x403b, 0x403c], () => null, '3.2'),
  }
})

const renderView = (props: Partial<Parameters<typeof HsmLearnView>[0]> = {}) =>
  render(
    <MemoryRouter>
      <HsmLearnView onTryInWorkbench={() => {}} {...props} />
    </MemoryRouter>
  )

describe('HsmLearnView — PKCS#11 v3.3 (working draft) track', () => {
  it('is the third track and states the draft status', () => {
    renderView()
    const tab = screen.getByRole('tab', { name: 'PKCS#11 v3.3 (working draft)' })
    fireEvent.click(tab)
    expect(screen.getByTestId('v33-draft-note')).toHaveTextContent(
      /unpublished OASIS working draft.*approved.*still reports Cryptoki 3\.2\.0/
    )
    expect(screen.getByRole('heading', { name: 'What v3.3 is' })).toBeInTheDocument()
  })

  it('a deep link opens the requested lesson', () => {
    renderView({ track: 'v33', focus: { lessonId: 'v33-composite-mlkem', nonce: 1 } })
    expect(screen.getByRole('heading', { name: 'Composite ML-KEM' })).toBeInTheDocument()
  })

  it('a step needing a missing mechanism says "Not in this engine yet", not a failure, and the next step can run', async () => {
    renderView({ track: 'v33', focus: { lessonId: 'v33-composite-mldsa', nonce: 1 } })
    const runButtons = screen.getAllByRole('button', { name: /Run$/ })
    fireEvent.click(runButtons[0])
    expect(await screen.findByText('Not in this engine yet')).toBeInTheDocument()
    expect(
      screen.getByText(/CKM_COMP_SIG_KEY_PAIR_GEN: not in this engine yet/)
    ).toBeInTheDocument()
    // Step 2 is enabled: a not-in-engine step counts as done.
    expect(screen.getAllByRole('button', { name: /Run$/ })[0]).not.toBeDisabled()
  })

  it('the other tracks are unchanged', () => {
    renderView()
    expect(screen.getByRole('tab', { name: 'PKCS#11 Foundations' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'v3.2 & the PQC transformation' })).toBeInTheDocument()
    expect(classifyV33Support([], () => null, null).compKem).toBe(false)
  })
})

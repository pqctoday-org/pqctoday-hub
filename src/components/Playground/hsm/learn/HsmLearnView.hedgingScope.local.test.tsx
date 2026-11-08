// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { HsmLearnView } from './HsmLearnView'

const fixture = vi.hoisted(() => ({
  preferredDifferent: false,
  deterministicDifferent: false,
  failPreferred: false,
  preferredCalls: 0,
  deterministicCalls: 0,
  generated: vi.fn(),
  verify: vi.fn(),
  verifyBytes: vi.fn(),
  log: [],
}))
vi.mock('../HsmContext', () => ({
  useHsmContext: () => ({
    moduleRef: { current: {} },
    hSessionRef: { current: 1 },
    slotRef: { current: 0 },
    hsmLog: fixture.log,
    hsmLogRef: { current: fixture.log },
    addHsmStepLog: vi.fn(),
  }),
}))
vi.mock('@/utils/analytics', () => ({ logEvent: vi.fn() }))
vi.mock('@/components/Playground/components/MiniPkcsLog', () => ({ MiniPkcsLog: () => null }))
vi.mock('@/components/Playground/keystore/HsmKeyTable', () => ({ HsmKeyTable: () => null }))
vi.mock('@/components/Playground/keystore/discoverHsmObjects', () => ({
  discoverHsmObjects: vi.fn(),
}))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
vi.mock('@/wasm/softhsm', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/wasm/softhsm')>()),
  hsm_generateMLDSAKeyPair: (...args: unknown[]) => {
    fixture.generated(...args)
    return { privHandle: 7, pubHandle: 8 }
  },
  hsm_sign: (
    _module: unknown,
    _session: number,
    key: number,
    message: string,
    options: { hedging: string }
  ) => {
    expect(key).toBe(7)
    expect(message).toBe('hello post-quantum world')
    if (options.hedging === 'preferred') {
      fixture.preferredCalls++
      if (fixture.failPreferred) throw new Error('Controlled signing operation failure')
      return new Uint8Array([
        fixture.preferredDifferent && fixture.preferredCalls % 2 === 0 ? 2 : 1,
      ])
    }
    expect(options.hedging).toBe('deterministic')
    fixture.deterministicCalls++
    return new Uint8Array([
      fixture.deterministicDifferent && fixture.deterministicCalls % 2 === 0 ? 4 : 3,
    ])
  },
  hsm_verify: (...args: unknown[]) => fixture.verify(...args),
  hsm_verifyBytes: (...args: unknown[]) => fixture.verifyBytes(...args),
}))
const show = () => {
  render(
    <MemoryRouter>
      <HsmLearnView
        track="v32"
        focus={{ lessonId: 'hedged-signing', nonce: 1 }}
        onTryInWorkbench={() => {}}
      />
    </MemoryRouter>
  )
  fireEvent.click(screen.getByRole('button', { name: /Hedged signatures/ }))
}
const correctOption =
  'The comparison shows whether the bytes repeat; signature validity still requires a separate verification check'
function expectNoVerificationOperation() {
  expect(fixture.verify).not.toHaveBeenCalled()
  expect(fixture.verifyBytes).not.toHaveBeenCalled()
}
async function finishComparison() {
  fireEvent.click(screen.getByRole('button', { name: 'Run all' }))
  await screen.findByText('Notes')
}
beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  fixture.preferredDifferent = false
  fixture.deterministicDifferent = false
  fixture.failPreferred = false
  fixture.preferredCalls = 0
  fixture.deterministicCalls = 0
  fixture.log.length = 0
})

describe('actual hedging lesson comparison, notes and knowledge check', () => {
  it.each([false, true])(
    'keeps comparison-only claims when Preferred different=%s',
    async (different) => {
      fixture.preferredDifferent = different
      show()
      await finishComparison()
      expect(fixture.generated).toHaveBeenCalledTimes(1)
      expect(fixture.preferredCalls).toBe(2)
      expect(fixture.deterministicCalls).toBe(2)
      expect(
        screen.getByText(
          different
            ? /Preferred signing returned different bytes/
            : /Preferred signing returned identical bytes/
        )
      ).toHaveTextContent(
        'This comparison does not establish signature validity or randomness quality.'
      )
      expect(
        screen.getByText(
          'Two deterministic signatures of the SAME message: byte-identical, as expected.'
        )
      ).toBeInTheDocument()
      expect(
        screen.getByText(
          'This sequence compares repeated signature bytes; it does not verify the signatures. A separate verification with the corresponding public key, message and context is needed to establish validity.'
        )
      ).toBeInTheDocument()
      expectNoVerificationOperation()
      const quiz = within(screen.getByTestId('learn-quiz'))
      expect(
        quiz.getByText(/compared repeated signature bytes without verifying the signatures/)
      ).toBeInTheDocument()
      fireEvent.click(quiz.getByRole('button', { name: correctOption }))
      expect(quiz.getByText('1/1 correct')).toBeInTheDocument()
      expect(quiz.getByText('Passed')).toBeInTheDocument()
      expect(
        quiz.getByText(/Equal or different bytes alone do not establish signature validity/)
      ).toHaveTextContent(
        'Verify each signature against its public key, message and context before claiming it is valid.'
      )
      expectNoVerificationOperation()
    }
  )

  it('rejects the validity misconception in the actual quiz rather than treating byte identity as validity', async () => {
    show()
    await finishComparison()
    const quiz = within(screen.getByTestId('learn-quiz'))
    fireEvent.click(
      quiz.getByRole('button', {
        name: 'Only deterministic signatures are cryptographically valid',
      })
    )
    expect(quiz.getByText('0/1 correct')).toBeInTheDocument()
    expect(quiz.queryByText('Passed')).not.toBeInTheDocument()
    expect(
      quiz.getByText(/Equal or different bytes alone do not establish signature validity/)
    ).toBeInTheDocument()
    expectNoVerificationOperation()
  })

  it('stops on a controlled signing-operation error and only exposes notes/quiz after successful retry', async () => {
    fixture.failPreferred = true
    show()
    fireEvent.click(screen.getByRole('button', { name: 'Run all' }))
    await screen.findByText('Controlled signing operation failure')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Run all' })).toBeEnabled())
    expect(fixture.preferredCalls).toBe(1)
    expect(fixture.deterministicCalls).toBe(0)
    expect(screen.queryByText('Notes')).not.toBeInTheDocument()
    expect(screen.queryByTestId('learn-quiz')).not.toBeInTheDocument()
    expectNoVerificationOperation()
    fixture.failPreferred = false
    await finishComparison()
    expect(fixture.generated).toHaveBeenCalledTimes(1)
    expect(fixture.deterministicCalls).toBe(2)
    expect(screen.getByTestId('learn-quiz')).toBeInTheDocument()
    expectNoVerificationOperation()
  })

  it('withholds completion when deterministic repeated bytes differ, then permits matching-byte retry', async () => {
    fixture.deterministicDifferent = true
    show()
    fireEvent.click(screen.getByRole('button', { name: 'Run all' }))
    await screen.findByText('Two deterministic signatures differed — that would be a real problem.')
    expect(screen.queryByText('Notes')).not.toBeInTheDocument()
    expect(screen.queryByTestId('learn-quiz')).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Run all' })).toBeEnabled())
    fixture.deterministicDifferent = false
    await finishComparison()
    expect(screen.getByTestId('learn-quiz')).toBeInTheDocument()
    expectNoVerificationOperation()
  })
})

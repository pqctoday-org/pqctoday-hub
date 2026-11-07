// SPDX-License-Identifier: AGPL-3.0-only
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TpmLearnView } from './TpmLearnView'
import { TPM_LESSONS } from './tpmLessons'

const control = vi.hoisted(() => ({ exec: vi.fn(), listener: vi.fn(), dependent: vi.fn() }))
vi.mock('@/wasm/tpmBridge', () => ({
  executeTpmCommand: control.exec,
  executeTpmCommandLarge: control.exec,
  flushAllTransient: vi.fn(),
  nvReadAll: vi.fn(),
  getPqcBridgeStatus: vi.fn(),
  setTpmWireListener: control.listener,
  withTpmLock: async <T,>(fn: () => Promise<T>) => fn(),
}))
vi.mock('../useTpmBusy', () => ({ useTpmBusy: () => false }))
vi.mock('../ExecutionLog', () => ({ HexPanel: () => null }))
vi.mock('../../learnkit/GlossaryRail', () => ({ GlossaryRail: () => null }))
vi.mock('../../learnkit/QuizCard', () => ({
  QuizCard: () => <div data-testid="quiz">Quiz available</div>,
}))
vi.mock('./tpmLessons', async (original) => {
  const actual = await original<typeof import('./tpmLessons')>()
  const base = actual.TPM_LESSONS[0]
  return {
    ...actual,
    TPM_LESSONS: [
      {
        ...base,
        steps: [
          { ...base.steps.find((s) => s.expect === 'refusal')! },
          {
            op: 'dependent',
            label: 'Dependent sample operation',
            run: async () => {
              control.dependent()
              return { detail: 'Dependent operation completed' }
            },
          },
        ],
      },
    ],
  }
})

const response = (rc: number, tag = 0x8001, size = 10) => {
  const bytes = new Uint8Array(10),
    view = new DataView(bytes.buffer)
  view.setUint16(0, tag)
  view.setUint32(2, size)
  view.setUint32(6, rc)
  return bytes
}
const originalRun = TPM_LESSONS[0].steps[0].run
const show = () =>
  render(
    <MemoryRouter>
      <TpmLearnView isWasmReady onTryInWorkbench={() => {}} />
    </MemoryRouter>
  )
const runAll = () => fireEvent.click(screen.getByRole('button', { name: 'Run all' }))

describe('TPM lesson runner expected refusals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    control.exec.mockReset().mockResolvedValue(response(0x100))
    TPM_LESSONS[0].steps[0].run = originalRun
    TPM_LESSONS[0].steps[0].expectedRefusal = { commandCode: 0x144, responseCodes: [0x100] }
  })

  it('accepts the intended command/code and advances the dependent step', async () => {
    show()
    runAll()
    await screen.findByTestId('quiz')
    expect(screen.getByText('Refused, as expected')).toBeInTheDocument()
    expect(control.dependent).toHaveBeenCalledTimes(1)
    expect(control.listener).toHaveBeenLastCalledWith(null)
  })

  it.each([
    ['unexpected success', response(0)],
    ['unrelated TPM failure', response(0x101)],
    ['truncated response', new Uint8Array(9)],
    ['empty response', new Uint8Array()],
    ['incorrect size', response(0x100, 0x8001, 11)],
    ['invalid tag', response(0x100, 0x7777)],
    ['sessions tag on error', response(0x100, 0x8002)],
  ])('keeps %s failed and dependent actions incomplete', async (_name, bytes) => {
    control.exec.mockResolvedValue(bytes)
    show()
    runAll()
    await screen.findByRole('button', { name: 'Retry' })
    expect(screen.queryByText('Refused, as expected')).not.toBeInTheDocument()
    expect(screen.queryByTestId('quiz')).not.toBeInTheDocument()
    expect(control.dependent).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Run' })).toBeDisabled()
    expect(control.listener).toHaveBeenLastCalledWith(null)
  })

  it.each(['Transport unavailable', 'TPM_RC_INITIALIZE (0x100) from a JavaScript exception'])(
    'does not reinterpret an exception as a refusal: %s',
    async (message) => {
      control.exec.mockRejectedValue(new Error(message))
      show()
      runAll()
      await screen.findByRole('button', { name: 'Retry' })
      expect(screen.queryByText('Refused, as expected')).not.toBeInTheDocument()
      expect(control.dependent).not.toHaveBeenCalled()
      expect(control.listener).toHaveBeenLastCalledWith(null)
    }
  )

  it('rejects the correct code from a different command expectation', async () => {
    TPM_LESSONS[0].steps[0].expectedRefusal = { commandCode: 0x159, responseCodes: [0x100] }
    show()
    runAll()
    await screen.findByText(/does not match this step's declared command/)
    expect(control.dependent).not.toHaveBeenCalled()
    expect(screen.queryByTestId('quiz')).not.toBeInTheDocument()
  })

  it('rejects a returned success even if the step omits the refusal helper', async () => {
    TPM_LESSONS[0].steps[0].run = async () => ({ detail: 'Returned normally' })
    show()
    runAll()
    await screen.findByText(/Unexpected success/)
    expect(control.dependent).not.toHaveBeenCalled()
  })

  it('lets a failed step retry, then unlocks the next operation', async () => {
    control.exec.mockResolvedValue(response(0x101))
    show()
    runAll()
    const retry = await screen.findByRole('button', { name: 'Retry' })
    control.exec.mockResolvedValue(response(0x100))
    fireEvent.click(retry)
    await screen.findByText('Refused, as expected')
    fireEvent.click(screen.getByRole('button', { name: 'Run' }))
    await screen.findByTestId('quiz')
    expect(control.dependent).toHaveBeenCalledTimes(1)
  })

  it('ignores same-task duplicate Run-all requests', async () => {
    let finish!: (bytes: Uint8Array) => void
    control.exec.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        })
    )
    show()
    const button = screen.getByRole('button', { name: 'Run all' })
    act(() => {
      button.click()
      button.click()
    })
    expect(control.exec).toHaveBeenCalledTimes(1)
    await act(async () => {
      finish(response(0x100))
    })
    await screen.findByTestId('quiz')
    expect(control.dependent).toHaveBeenCalledTimes(1)
  })

  it('cleans the listener and skips dependent work after unmount', async () => {
    let finish!: (bytes: Uint8Array) => void
    control.exec.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        })
    )
    const view = show()
    runAll()
    view.unmount()
    await act(async () => {
      finish(response(0x100))
    })
    await waitFor(() => expect(control.listener).toHaveBeenLastCalledWith(null))
    expect(control.dependent).not.toHaveBeenCalled()
  })
})

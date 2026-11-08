// SPDX-License-Identifier: AGPL-3.0-only
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { AuthFlow } from './AuthFlow'
import type {
  AuthenticationSnapshot,
  AuthenticationStage,
  AuthenticationStageResult,
} from './services/FiveGService'

const factory = vi.hoisted(() => vi.fn())
vi.mock('@/components/ui/code-block', () => ({ CodeBlock: () => null }))
vi.mock('./services/FiveGService', () => ({
  fiveGService: { createAuthenticationSample: factory },
}))
const STAGES: AuthenticationStage[] = [
  'retrieve_creds',
  'gen_rand',
  'compute_milenage',
  'compute_autn',
  'derive_kausf',
  'verify_ue',
  'verify_seaf',
  'verify_ausf',
]
const FIRST = '010101010101',
  NEXT = '010101010102',
  AUTN = '11'.repeat(16),
  RES = 'aa'.repeat(16)
function initial(): AuthenticationSnapshot {
  return {
    stageComplete: {
      retrieve_creds: false,
      gen_rand: false,
      compute_milenage: false,
      compute_autn: false,
      derive_kausf: false,
      verify_ue: false,
      verify_seaf: false,
      verify_ausf: false,
    },
    networkSqnHex: FIRST,
    nextNetworkSqnHex: FIRST,
    ueNextSqnHex: FIRST,
    networkKHex: '33'.repeat(16),
    subscriberKHex: '33'.repeat(16),
    networkOPcHex: '',
    subscriberOPcHex: '',
    randHex: '',
    autnHex: '',
    receivedAutnHex: '',
    kausfHex: '',
    xresStarHex: '',
    hxresStarHex: '',
    ueResStarHex: '',
    receivedResStarHex: '',
    hresStarHex: '',
    accepted: false,
    consumed: false,
    canReplay: false,
  }
}
function fixture() {
  let state = initial(),
    replayed = false
  const getSnapshot = () => structuredClone(state)
  const clear = (from: number) => {
    state.stageComplete = {
      ...state.stageComplete,
      ...Object.fromEntries(STAGES.slice(from).map((stage) => [stage, false])),
    }
    state.accepted = false
    if (from <= 5) {
      state.ueResStarHex = ''
      state.receivedResStarHex = ''
    }
    if (from <= 6) state.hresStarHex = ''
  }
  const error = (kind: string, message: string) => Object.assign(new Error(message), { kind })
  const execute = vi.fn<(stage: AuthenticationStage) => Promise<AuthenticationStageResult>>(
    async (stage) => {
      clear(STAGES.indexOf(stage))
      if (stage === 'retrieve_creds') {
        state.networkOPcHex = '44'.repeat(16)
        state.subscriberOPcHex = '44'.repeat(16)
      }
      if (stage === 'gen_rand') {
        state.randHex = '22'.repeat(16)
        state.nextNetworkSqnHex = NEXT
      }
      if (stage === 'compute_autn') {
        state.autnHex = AUTN
        state.receivedAutnHex = AUTN
      }
      if (stage === 'derive_kausf') {
        state.kausfHex = '66'.repeat(32)
        state.xresStarHex = RES
        state.hxresStarHex = '77'.repeat(16)
      }
      if (stage === 'verify_ue') {
        if (state.receivedAutnHex !== AUTN) throw error('mac', 'AUTN MAC check failed')
        if (replayed) throw error('sequence', 'Genuine MAC passed but next sequence check failed')
        state.ueResStarHex = RES
        state.receivedResStarHex = RES
        state.ueNextSqnHex = NEXT
      }
      if (stage === 'verify_seaf') {
        if (state.receivedResStarHex !== RES)
          throw error('response', 'Serving response comparison failed')
        state.hresStarHex = state.hxresStarHex
      }
      if (stage === 'verify_ausf') {
        state.accepted = true
        state.consumed = true
        state.canReplay = true
      }
      state.stageComplete = { ...state.stageComplete, [stage]: true }
      return { output: `Executed fixture ${stage}`, snapshot: getSnapshot() }
    }
  )
  return {
    getSnapshot,
    execute,
    setChallengeSqn: (value: string) => {
      clear(1)
      state.networkSqnHex = value
      return getSnapshot()
    },
    setReceivedAutn: (value: string) => {
      clear(5)
      state.receivedAutnHex = value
      return getSnapshot()
    },
    setReceivedResponse: (value: string) => {
      clear(6)
      state.receivedResStarHex = value
      return getSnapshot()
    },
    newChallenge: () => {
      clear(1)
      state.networkSqnHex = state.nextNetworkSqnHex
      return getSnapshot()
    },
    replayLastChallenge: () => {
      clear(5)
      replayed = true
      state.receivedAutnHex = AUTN
      return getSnapshot()
    },
    reset: () => {
      state = initial()
      replayed = false
      return getSnapshot()
    },
    dispose: vi.fn(),
  }
}
let context: ReturnType<typeof fixture>
beforeEach(() => {
  context = fixture()
  factory.mockReset()
  factory.mockReturnValue(context)
})
async function run() {
  fireEvent.click(screen.getByRole('button', { name: 'Run sample activity' }))
  await waitFor(() =>
    expect(screen.queryByRole('button', { name: 'Executing...' })).not.toBeInTheDocument()
  )
}
async function advanceTo(index: number) {
  for (let i = 0; i < index; i++) {
    await run()
    fireEvent.click(screen.getByRole('button', { name: 'Next Step' }))
  }
}
const accepted = () => screen.queryByText(/^Local sample authentication accepted/)
const ue = () => screen.getByRole('region', { name: 'Subscriber sample inputs' })

it('requires all actual stage receipts before accepted output and displays the separately owned sample values', async () => {
  render(<AuthFlow onBack={vi.fn()} />)
  expect(screen.getByRole('region', { name: 'Home-network sample inputs' })).toHaveTextContent(
    'fixed sample credential copy'
  )
  expect(ue()).toHaveTextContent('independent fixed credential copy')
  await advanceTo(7)
  expect(accepted()).not.toBeInTheDocument()
  await run()
  expect(accepted()).toBeVisible()
  expect(within(ue()).getByText(NEXT)).toBeInTheDocument()
  expect(context.execute.mock.calls.map(([stage]) => stage)).toEqual(STAGES)
})

it('shows MAC and response failures without completion, restores genuine values, and rejects replay without undoing the UE counter', async () => {
  render(<AuthFlow onBack={vi.fn()} />)
  await advanceTo(5)
  fireEvent.change(screen.getByLabelText('Received UE AUTN (editable hex)'), {
    target: { value: 'ff' + AUTN.slice(2) },
  })
  await run()
  expect(screen.getByText('mac: AUTN MAC check failed')).toBeVisible()
  expect(within(ue()).getByText(FIRST)).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Next Step' })).not.toBeInTheDocument()
  expect(screen.getByLabelText('Received network RES* (editable hex)')).toHaveValue('')
  fireEvent.click(screen.getByRole('button', { name: 'Restore authentic AUTN' }))
  await run()
  fireEvent.click(screen.getByRole('button', { name: 'Next Step' }))
  fireEvent.change(screen.getByLabelText('Received network RES* (editable hex)'), {
    target: { value: 'bb'.repeat(16) },
  })
  await run()
  expect(screen.getByText('response: Serving response comparison failed')).toBeVisible()
  expect(accepted()).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Restore genuine UE response' }))
  await run()
  fireEvent.click(screen.getByRole('button', { name: 'Next Step' }))
  await run()
  expect(accepted()).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Replay last accepted challenge' }))
  expect(accepted()).not.toBeInTheDocument()
  await run()
  expect(
    screen.getByText('sequence: Genuine MAC passed but next sequence check failed')
  ).toBeVisible()
  expect(within(ue()).getByText(NEXT)).toBeInTheDocument()
  expect(screen.getByLabelText('Received network RES* (editable hex)')).toHaveValue('')
  fireEvent.click(screen.getByRole('button', { name: 'Reset fictional session' }))
  expect(within(ue()).getByText(FIRST)).toBeInTheDocument()
})

it('keeps an engine failure incomplete and permits a genuine retry', async () => {
  context.execute.mockRejectedValueOnce(
    Object.assign(new Error('Provider unavailable'), { kind: 'operation' })
  )
  render(<AuthFlow onBack={vi.fn()} />)
  await run()
  expect(screen.getByText('operation: Provider unavailable')).toBeVisible()
  expect(screen.getByRole('button', { name: 'Skip to next step' })).toBeDisabled()
  expect(accepted()).not.toBeInTheDocument()
  await run()
  expect(screen.getByRole('button', { name: 'Next Step' })).toBeEnabled()
})

it('does not treat a resolved output string as a passing stage when its typed receipt is false', async () => {
  context.execute.mockResolvedValueOnce({ output: 'SUCCESS string alone', snapshot: initial() })
  render(<AuthFlow onBack={vi.fn()} />)
  await run()
  expect(screen.getByText('The current sample activity did not complete')).toBeVisible()
  expect(screen.getByRole('button', { name: 'Skip to next step' })).toBeDisabled()
  expect(accepted()).not.toBeInTheDocument()
})

it('holds the immediate busy lock through an input change and suppresses the late receipt', async () => {
  let resolve!: (value: AuthenticationStageResult) => void
  context.execute.mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r
      })
  )
  render(<AuthFlow onBack={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: 'Run sample activity' }))
  fireEvent.change(screen.getByLabelText('Challenge network SQN (hex)'), {
    target: { value: NEXT },
  })
  expect(screen.getByRole('button', { name: 'Executing...' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Executing...' }))
  expect(context.execute).toHaveBeenCalledTimes(1)
  const old = initial()
  old.stageComplete.retrieve_creds = true
  await act(async () => {
    resolve({ output: 'LATE RECEIPT', snapshot: old })
  })
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Run sample activity' })).toBeEnabled()
  )
  expect(screen.getByRole('button', { name: 'Skip to next step' })).toBeDisabled()
  expect(screen.queryByText('LATE RECEIPT')).not.toBeInTheDocument()
  expect(screen.getByLabelText('Challenge network SQN (hex)')).toHaveValue(NEXT)
})

it('disposes its instance and ignores a late result after unmount without dependent execution', async () => {
  let resolve!: (value: AuthenticationStageResult) => void
  context.execute.mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r
      })
  )
  const view = render(<AuthFlow onBack={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: 'Run sample activity' }))
  view.unmount()
  expect(context.dispose).toHaveBeenCalledOnce()
  const old = initial()
  old.stageComplete.retrieve_creds = true
  await act(async () => {
    resolve({ output: 'LATE UNMOUNTED RESULT', snapshot: old })
  })
  expect(context.execute).toHaveBeenCalledTimes(1)
  expect(screen.queryByText('LATE UNMOUNTED RESULT')).not.toBeInTheDocument()
})

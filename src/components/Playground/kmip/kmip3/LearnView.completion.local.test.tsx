// SPDX-License-Identifier: AGPL-3.0-only
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { KmipEngine, OpResult } from '@/wasm/kmip/kmipEngine'
import { LESSONS, type Lesson, type LessonStep } from './learnLessons'
import { LessonPanel } from './LearnView'

vi.mock('../WireTreeView', () => ({ WireTreeView: () => null }))
vi.mock('@/components/Playground/learnkit/QuizCard', () => ({ QuizCard: () => null }))
const result = (status = 'Success'): OpResult =>
  ({
    ok: status === 'Success',
    status,
    operation: 'Query',
    resultReason: null,
    message: status === 'Success' ? null : 'sample refusal/error',
    summary: {},
    responseWireHex: '',
    responseWireLen: 0,
    responseTree: { tag: '', type: 'Structure' },
    audit: [],
  }) as OpResult
const step = (): LessonStep => ({
  op: 'Query',
  label: 'Sample operation',
  buildSpec: () => ({ op: 'Query' }),
})
function setup(
  options: {
    steps?: LessonStep[]
    classical?: LessonStep[]
    skip?: boolean
    engine?: ReturnType<typeof vi.fn>
  } = {}
) {
  const runOp = options.engine ?? vi.fn(() => result())
  const engine = { runOp } as unknown as KmipEngine
  const lesson: Lesson = {
    ...LESSONS[0],
    classical: { ...LESSONS[0].classical, steps: options.classical ?? [] },
    modernize: {
      ...LESSONS[0].modernize,
      cta: 'Run sample sequence',
      steps: options.steps ?? [step(), step(), step()],
      skipReplay: options.skip,
    },
  }
  const onDone = vi.fn(),
    onIncomplete = vi.fn()
  const props = {
    lesson,
    engine,
    onDone,
    onIncomplete,
    onChanged: vi.fn(),
    onTryInReference: vi.fn(),
  }
  const view = render(<LessonPanel {...props} />)
  return { ...view, runOp, onDone, onIncomplete, props }
}
describe('KMIP panel completion and retry', () => {
  it('completes only after all steps and blocks same-task duplicate starts', async () => {
    const s = setup()
    const button = screen.getByRole('button', { name: 'Run sample sequence' })
    act(() => {
      button.click()
      button.click()
    })
    expect(s.onDone).not.toHaveBeenCalled()
    await screen.findByRole('button', { name: 'Sample sequence completed' })
    expect(s.runOp).toHaveBeenCalledTimes(3)
    expect(s.onDone).toHaveBeenCalledTimes(1)
  })
  it.each([0, 1, 2])(
    'stops at failure %i, keeps incomplete and retries from step one',
    async (failed) => {
      let index = 0,
        fail = true
      const run = vi.fn(() => (fail && index++ === failed ? result('OperationFailed') : result()))
      const s = setup({ engine: run })
      fireEvent.click(screen.getByRole('button', { name: 'Run sample sequence' }))
      await screen.findByRole('button', { name: 'Retry sequence' })
      expect(run).toHaveBeenCalledTimes(failed + 1)
      expect(s.onDone).not.toHaveBeenCalled()
      expect(screen.getByRole('alert')).toHaveTextContent('Activity incomplete')
      fail = false
      run.mockClear()
      fireEvent.click(screen.getByRole('button', { name: 'Retry sequence' }))
      await screen.findByRole('button', { name: 'Sample sequence completed' })
      expect(run).toHaveBeenCalledTimes(3)
      expect(s.onDone).toHaveBeenCalledTimes(1)
    }
  )
  it.each(['setup', 'builder', 'engine'])(
    'shows %s exceptions and permits retry',
    async (location) => {
      const broken = step()
      if (location === 'setup')
        broken.preRun = () => {
          throw new Error('setup failed')
        }
      if (location === 'builder')
        broken.buildSpec = () => {
          throw new Error('builder failed')
        }
      const engine = vi.fn(() => {
        if (location === 'engine') throw new Error('engine failed')
        return result()
      })
      const s = setup({ steps: [broken, step()], engine })
      fireEvent.click(screen.getByRole('button', { name: 'Run sample sequence' }))
      await screen.findByRole('button', { name: 'Retry sequence' })
      expect(screen.getByRole('alert')).toHaveTextContent(`${location} failed`)
      expect(s.onDone).not.toHaveBeenCalled()
    }
  )
  it('never treats a skipped step as an expected refusal', async () => {
    const s = setup({
      steps: [{ ...step(), expect: 'refusal' }],
      engine: vi.fn(() => result('Skip')),
    })
    fireEvent.click(screen.getByRole('button', { name: 'Run sample sequence' }))
    await screen.findByRole('button', { name: 'Retry sequence' })
    expect(s.onDone).not.toHaveBeenCalled()
  })
  it.each(['refusal', 'pending'] as const)(
    'accepts declared %s only with remaining steps completed',
    async (expected) => {
      const engine = vi
        .fn()
        .mockReturnValueOnce(
          result(expected === 'pending' ? 'OperationPending' : 'OperationFailed')
        )
        .mockReturnValueOnce(result())
      const s = setup({ steps: [{ ...step(), expect: expected }, step()], engine })
      fireEvent.click(screen.getByRole('button', { name: 'Run sample sequence' }))
      await screen.findByRole('button', { name: 'Sample sequence completed' })
      expect(s.onDone).toHaveBeenCalledTimes(1)
      expect(engine).toHaveBeenCalledTimes(2)
    }
  )
  it('keeps unexpected empty sequences incomplete', async () => {
    const s = setup({ steps: [] })
    fireEvent.click(screen.getByRole('button', { name: 'Run sample sequence' }))
    await screen.findByRole('button', { name: 'Retry sequence' })
    expect(s.onDone).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('No runnable steps')
  })
  it('gates comparison participation on classical completion without extra operations', async () => {
    const s = setup({ steps: [], classical: [step()], skip: true })
    expect(screen.getByRole('button', { name: 'View comparison' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Run these steps' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'View comparison' })).toBeEnabled()
    )
    fireEvent.click(screen.getByRole('button', { name: 'View comparison' }))
    expect(
      screen.getByRole('button', { name: 'Comparison viewed — no additional operations run' })
    ).toBeDisabled()
    expect(s.runOp).toHaveBeenCalledTimes(1)
    expect(s.onDone).toHaveBeenCalledTimes(1)
  })
  it.each([
    ['Valid', '0x00000001', 'Success', true],
    ['Valid', '0x00000002', 'Success', false],
    ['Valid', '0x00000003', 'Success', false],
    ['Valid', undefined, 'Success', false],
    ['Valid', '0x00000001', 'OperationFailed', false],
    ['Invalid', '0x00000002', 'Success', true],
    ['Invalid', '0x00000001', 'Success', false],
    ['Invalid', '0x00000003', 'Success', false],
    ['Invalid', undefined, 'Success', false],
    ['Invalid', '0x00000002', 'Error', false],
  ])(
    'requires certificate %s with returned %s / request %s',
    async (expected, validity, status, passed) => {
      const response = { ...result(status as string), operation: 'Validate', summary: { validity } }
      const s = setup({
        steps: [{ ...step(), op: 'Validate', expectValidity: expected as 'Valid' | 'Invalid' }],
        engine: vi.fn(() => response),
      })
      fireEvent.click(screen.getByRole('button', { name: 'Run sample sequence' }))
      await screen.findByRole('button', {
        name: passed ? 'Sample sequence completed' : 'Retry sequence',
      })
      expect(s.onDone).toHaveBeenCalledTimes(passed ? 1 : 0)
      expect(screen.getByText(/Expected sample validity:/)).toHaveTextContent(expected as string)
      if (!passed)
        expect(screen.getByRole('alert')).toHaveTextContent('Expected certificate validity')
    }
  )
  it('abandons an in-flight attempt when the engine changes', async () => {
    const s = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Run sample sequence' }))
    const replacement = vi.fn(() => result())
    s.rerender(
      <LessonPanel {...s.props} engine={{ runOp: replacement } as unknown as KmipEngine} />
    )
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(s.onDone).not.toHaveBeenCalled()
    expect(s.runOp).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Run sample sequence' }))
    await screen.findByRole('button', { name: 'Sample sequence completed' })
    expect(replacement).toHaveBeenCalledTimes(3)
  })
  it('withdraws prior credit at the start of a revisited attempt', async () => {
    const s = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Run sample sequence' }))
    await screen.findByRole('button', { name: 'Sample sequence completed' })
    s.unmount()
    s.runOp.mockReturnValue(result('OperationFailed'))
    render(<LessonPanel {...s.props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Run sample sequence' }))
    expect(s.onIncomplete).toHaveBeenCalledTimes(2)
    await screen.findByRole('button', { name: 'Retry sequence' })
    expect(s.onDone).toHaveBeenCalledTimes(1)
  })
  it('does not publish completion from an abandoned panel', async () => {
    const s = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Run sample sequence' }))
    s.unmount()
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(s.onDone).not.toHaveBeenCalled()
    expect(s.runOp).not.toHaveBeenCalled()
  })
})

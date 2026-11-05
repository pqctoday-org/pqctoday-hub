// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { PkcsDevWorkbench } from './PkcsDevWorkbench'
const state = vi.hoisted(() => ({
  run: vi.fn(),
  boot: vi.fn(),
  moduleRef: { current: {} },
  rawModuleRef: { current: {} },
  discover: vi.fn(),
  session: vi.fn(),
}))
vi.mock('@monaco-editor/react', () => ({
  default: ({
    value,
    onChange,
    options,
  }: {
    value: string
    onChange: (value: string) => void
    options: { readOnly: boolean }
  }) => (
    <textarea
      aria-label="Python sample code"
      value={value}
      readOnly={options.readOnly}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}))
vi.mock('../monacoSelfHost', () => ({ installMonacoSelfHost: () => Promise.resolve() }))
vi.mock('../../hsm/HsmContext', () => ({
  useHsmContext: () => ({
    moduleRef: state.moduleRef,
    rawModuleRef: state.rawModuleRef,
    isReady: true,
    autoInit: vi.fn(),
    engineMode: 'rust',
  }),
}))
vi.mock('./devSlot', () => ({
  ensureDevSlot: () => 1,
  ensureDevSlotSession: (...args: unknown[]) => state.session(...args),
  DEV_SLOT_LABEL: 'DevSequences',
}))
vi.mock('../../keystore/discoverHsmObjects', () => ({
  discoverHsmObjectsOnSession: (...args: unknown[]) => state.discover(...args),
}))
vi.mock('@/services/python/pyRuntime', () => ({
  bootPyRuntime: () => state.boot(),
  runPython: (...args: unknown[]) => state.run(...args),
  getInterruptMode: () => 'best-effort',
}))
vi.mock('@/services/python/pyodide/p11Bridge', () => ({ createP11Bridge: () => ({}) }))
const output = (code: string) =>
  [...code.matchAll(/print\('###STEP (\S+) ok###'\)/g)]
    .map((m) => `###STEP ${m[1]} detail### {"kind":"output","fields":[]}\n###STEP ${m[1]} ok###`)
    .join('\n')
const success = (code: string) => ({
  ok: true,
  stdout: output(code),
  stderr: '',
  error: null,
  elapsedMs: 5,
})
const run = () => fireEvent.click(screen.getByRole('button', { name: 'Run' }))
const record = () => within(screen.getByRole('region', { name: 'Recorded sample attempt' }))
beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  state.boot.mockResolvedValue({ registerJsModule: vi.fn() })
  state.run.mockImplementation(async (code: string) => success(code))
  state.session.mockReturnValue(44)
})
describe('PKCS developer sample run records', () => {
  it('requires step results and preserves existing session discovery', async () => {
    render(<PkcsDevWorkbench />)
    run()
    await record().findByText('Required sample steps completed.')
    expect(record().getByText(/did not verify the signature/)).toBeInTheDocument()
    expect(state.session).toHaveBeenCalledWith(state.rawModuleRef.current, 1)
    expect(state.discover).toHaveBeenCalledWith(state.rawModuleRef.current, 44, expect.anything())
  })
  it.each(['runtime', 'missing', 'bridge'])(
    'does not infer success from %s failure',
    async (kind) => {
      if (kind === 'runtime')
        state.run.mockResolvedValue({
          ok: false,
          stdout: '',
          stderr: '',
          error: 'failed',
          elapsedMs: 5,
        })
      if (kind === 'missing') state.run.mockResolvedValue(success(''))
      if (kind === 'bridge') state.boot.mockRejectedValue(new Error('bridge failed'))
      render(<PkcsDevWorkbench />)
      run()
      await record().findByText(
        kind === 'missing' ? 'Sample attempt incomplete.' : 'Sample attempt failed.'
      )
      expect(record().queryByText('What this sample demonstrated:')).not.toBeInTheDocument()
    }
  )
  it('retains the original title and explanation after title and template edits', async () => {
    render(<PkcsDevWorkbench />)
    run()
    await record().findByText('Required sample steps completed.')
    fireEvent.change(screen.getByRole('textbox', { name: 'Pipeline name' }), {
      target: { value: 'ML-KEM round trip' },
    })
    expect(record().getByText(/Inputs changed—run again/)).toBeInTheDocument()
    expect(record().getByText(/Attempt: Encrypt \+ sign/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Hybrid signature' }))
    expect(record().getByText(/did not verify the signature/)).toBeInTheDocument()
  })
  it('does not borrow a template explanation from an edited title', async () => {
    render(<PkcsDevWorkbench />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Pipeline name' }), {
      target: { value: 'Hybrid signature' },
    })
    run()
    await record().findByText('Required sample steps completed.')
    expect(record().getByText(/did not verify the signature/)).toBeInTheDocument()
    expect(record().queryByText(/separate classical/)).not.toBeInTheDocument()
  })
  it('retains original submitted code when controls change during a run', async () => {
    let resolve!: (value: ReturnType<typeof success>) => void
    state.run.mockImplementation(() => new Promise((r) => (resolve = r)))
    render(<PkcsDevWorkbench />)
    run()
    await waitFor(() => expect(state.run).toHaveBeenCalledTimes(1))
    const code = state.run.mock.calls[0][0]
    fireEvent.click(screen.getByRole('button', { name: 'ML-KEM round trip' }))
    await act(async () => resolve(success(code)))
    await record().findByText('Required sample steps completed.')
    expect(record().getByText(/Inputs changed—run again/)).toBeInTheDocument()
    expect(record().getByText(/Attempt: Encrypt \+ sign/)).toBeInTheDocument()
  })
  it('guards shortcut re-entry while a run is pending', async () => {
    let resolve!: (value: ReturnType<typeof success>) => void
    state.run.mockImplementation(() => new Promise((r) => (resolve = r)))
    render(<PkcsDevWorkbench />)
    fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true })
    fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true })
    await waitFor(() => expect(state.run).toHaveBeenCalledTimes(1))
    await act(async () => resolve(success(state.run.mock.calls[0][0])))
    await record().findByText('Required sample steps completed.')
  })
  it('accepts retry after a failed attempt', async () => {
    state.run.mockResolvedValueOnce({
      ok: false,
      stdout: '',
      stderr: '',
      error: 'failed',
      elapsedMs: 5,
    })
    render(<PkcsDevWorkbench />)
    run()
    await record().findByText('Sample attempt failed.')
    run()
    await record().findByText('Required sample steps completed.')
  })
  it('keeps an empty edited script custom and gives no template outcome', async () => {
    render(<PkcsDevWorkbench />)
    fireEvent.click(screen.getByRole('tab', { name: 'Code' }))
    await screen.findByRole('textbox', { name: 'Python sample code' })
    fireEvent.click(screen.getByRole('button', { name: 'Edit as custom script' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Python sample code' }), {
      target: { value: '' },
    })
    run()
    await record().findByText(/Custom script finished without/)
    expect(state.run).toHaveBeenCalledWith('')
    expect(record().queryByText('What this sample demonstrated:')).not.toBeInTheDocument()
  })
  it('does not infer template identity from a saved title', async () => {
    render(<PkcsDevWorkbench />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Pipeline name' }), {
      target: { value: 'saved sample' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    fireEvent.click(screen.getByRole('button', { name: 'ML-KEM round trip' }))
    fireEvent.click(screen.getByRole('button', { name: 'saved sample' }))
    run()
    await record().findByText('Required sample steps completed.')
    expect(record().queryByText('What this sample demonstrated:')).not.toBeInTheDocument()
  })
  it('does not infer template identity from an imported title', async () => {
    const { exportPipelineJson } = await import('./pipelineRun')
    const { TEMPLATES } = await import('./pipelineTemplates')
    const json = exportPipelineJson('pqctoday-hub-pkcs11-pipeline-v1', 'ML-KEM round trip', {
      steps: TEMPLATES['ML-KEM round trip'],
      input: 'imported sample',
    })
    const { container } = render(<PkcsDevWorkbench />)
    const file = new File([json], 'sample.json', { type: 'application/json' })
    Object.defineProperty(file, 'text', { value: async () => json })
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } })
    await screen.findByText('Imported "ML-KEM round trip"')
    run()
    await record().findByText('Required sample steps completed.')
    expect(record().queryByText('What this sample demonstrated:')).not.toBeInTheDocument()
  })
  it('does not register old-engine objects after an engine replacement', async () => {
    let resolve!: (value: ReturnType<typeof success>) => void
    state.run.mockImplementation(() => new Promise((r) => (resolve = r)))
    const oldModule = state.moduleRef.current,
      oldRaw = state.rawModuleRef.current
    const { rerender } = render(<PkcsDevWorkbench />)
    run()
    await waitFor(() => expect(state.run).toHaveBeenCalledTimes(1))
    state.moduleRef.current = {}
    state.rawModuleRef.current = {}
    rerender(<PkcsDevWorkbench />)
    await act(async () => resolve(success(state.run.mock.calls[0][0])))
    await record().findByText('Required sample steps completed.')
    expect(record().getByText(/Inputs changed—run again/)).toBeInTheDocument()
    expect(state.discover).not.toHaveBeenCalled()
    state.moduleRef.current = oldModule
    state.rawModuleRef.current = oldRaw
  })
})

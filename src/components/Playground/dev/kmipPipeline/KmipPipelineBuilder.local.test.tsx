// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { KmipPipelineBuilder } from './KmipPipelineBuilder'
import { KMIP_TEMPLATES } from './kmipPipelineTemplates'
import type { KmipEngine } from '@/wasm/kmip/kmipEngine'
const state = vi.hoisted(() => ({ run: vi.fn(), boot: vi.fn() }))
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
vi.mock('@/services/python/pyRuntime', () => ({
  bootPyRuntime: () => state.boot(),
  runPython: (...args: unknown[]) => state.run(...args),
  getInterruptMode: () => 'best-effort',
}))
vi.mock('@/services/python/pyodide/kmipBridge', () => ({ createKmipBridge: () => ({}) }))
vi.mock('@/wasm/kmip/ttlv/codepointTable', () => ({ getCodepointTable: () => Promise.resolve({}) }))
vi.mock('../../kmip/useKmipCorpus', () => ({
  useKmipCorpus: () => ({ table: null, running: null, runAll: vi.fn() }),
}))
vi.mock('./KmipCorpusPalette', () => ({
  KmipCorpusPaletteList: () => null,
  KmipCorpusDetail: () => null,
  KmipCorpusSummaryCard: () => null,
  KmipCorpusDisclosure: () => null,
}))
const engine = { auditSnapshot: () => [], listObjects: () => [] } as unknown as KmipEngine
const output = (name = 'ML-KEM round trip') =>
  KMIP_TEMPLATES[name]
    .map((s) => `###STEP ${s.id} detail### {"kind":"output","fields":[]}\n###STEP ${s.id} ok###`)
    .join('\n')
const ok = (name = 'ML-KEM round trip') => ({
  ok: true,
  stdout: output(name),
  stderr: '',
  error: null,
  elapsedMs: 5,
})
const run = () => fireEvent.click(screen.getByRole('button', { name: 'Run' }))
const choose = (name = 'ML-KEM round trip') => fireEvent.click(screen.getByRole('button', { name }))
const record = () => within(screen.getByRole('region', { name: 'Recorded sample attempt' }))
beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  state.boot.mockResolvedValue({ registerJsModule: vi.fn() })
  state.run.mockResolvedValue(ok())
})
describe('KMIP builder recorded sample attempts', () => {
  it('shows only the matching template explanation after required steps complete', async () => {
    render(<KmipPipelineBuilder engine={engine} />)
    choose()
    run()
    await record().findByText('Required generated sample steps completed.')
    expect(record().getByText(/agreement was not checked/)).toBeInTheDocument()
  })
  it.each(['runtime', 'step', 'missing', 'bridge'])(
    'does not show a demonstration outcome for %s failure',
    async (kind) => {
      if (kind === 'runtime')
        state.run.mockResolvedValue({ ...ok(), ok: false, error: 'Python failed' })
      if (kind === 'step')
        state.run.mockResolvedValue({
          ...ok(),
          stdout: output().replace('###STEP decap ok###', '###STEP decap error### failure'),
        })
      if (kind === 'missing') state.run.mockResolvedValue({ ...ok(), stdout: '' })
      if (kind === 'bridge') state.boot.mockRejectedValue(new Error('bridge failed'))
      render(<KmipPipelineBuilder engine={engine} />)
      choose()
      run()
      await record().findByText(
        kind === 'missing' ? 'Sample attempt incomplete.' : 'Sample attempt failed.'
      )
      expect(record().queryByText('What this sample demonstrated:')).not.toBeInTheDocument()
    }
  )
  it('retains the original attempt after rename and template changes', async () => {
    render(<KmipPipelineBuilder engine={engine} />)
    choose()
    run()
    await record().findByText('Required generated sample steps completed.')
    fireEvent.change(screen.getByRole('textbox', { name: 'Pipeline name' }), {
      target: { value: 'Governed lifecycle' },
    })
    expect(record().getByRole('status')).toHaveTextContent('Inputs changed')
    expect(record().getByText(/Attempt: ML-KEM round trip/)).toBeInTheDocument()
    expect(record().getByText(/agreement was not checked/)).toBeInTheDocument()
    choose('Policy dry-run compare')
    expect(record().getByRole('status')).toHaveTextContent('Inputs changed')
    expect(record().queryByText(/Compare each dry-run decision/)).not.toBeInTheDocument()
  })
  it('records pre-edit inputs when a run completes after edits', async () => {
    let finish: (value: unknown) => void = () => {}
    state.run.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        })
    )
    render(<KmipPipelineBuilder engine={engine} />)
    choose()
    run()
    await waitFor(() => expect(state.run).toHaveBeenCalled())
    fireEvent.change(screen.getByRole('textbox', { name: 'Pipeline name' }), {
      target: { value: 'Edited during run' },
    })
    finish(ok())
    await record().findByText('Required generated sample steps completed.')
    expect(record().getByRole('status')).toHaveTextContent('Inputs changed')
    expect(record().getByText(/Attempt: ML-KEM round trip/)).toBeInTheDocument()
  })
  it('guards keyboard retries while an attempt is running', async () => {
    state.run.mockImplementation(() => new Promise(() => {}))
    render(<KmipPipelineBuilder engine={engine} />)
    choose()
    run()
    await waitFor(() => expect(state.run).toHaveBeenCalledTimes(1))
    fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true })
    expect(state.run).toHaveBeenCalledTimes(1)
  })
  it('permits a clean retry after a failed attempt', async () => {
    state.run.mockResolvedValueOnce({ ...ok(), ok: false, error: 'Python failed' })
    render(<KmipPipelineBuilder engine={engine} />)
    choose()
    run()
    await record().findByText('Sample attempt failed.')
    run()
    await record().findByText('Required generated sample steps completed.')
    expect(record().queryByText('Python failed')).not.toBeInTheDocument()
  })
  it('does not borrow an explanation for detached code named like a template', async () => {
    render(<KmipPipelineBuilder engine={engine} />)
    choose()
    fireEvent.click(screen.getByRole('tab', { name: 'Code' }))
    fireEvent.click(screen.getByRole('button', { name: 'Edit as custom script' }))
    await screen.findByRole('textbox', { name: 'Python sample code' })
    fireEvent.change(screen.getByRole('textbox', { name: 'Python sample code' }), {
      target: { value: 'print("custom")' },
    })
    state.run.mockResolvedValue({
      ok: true,
      stdout: 'custom',
      stderr: '',
      error: null,
      elapsedMs: 5,
    })
    run()
    await record().findByText(/Custom script finished without a reported runtime error/)
    expect(record().queryByText('What this sample demonstrated:')).not.toBeInTheDocument()
  })
  it('keeps empty custom code editable and gives no generated-step assurance', async () => {
    render(<KmipPipelineBuilder engine={engine} />)
    choose()
    fireEvent.click(screen.getByRole('tab', { name: 'Code' }))
    fireEvent.click(screen.getByRole('button', { name: 'Edit as custom script' }))
    const editor = await screen.findByRole('textbox', { name: 'Python sample code' })
    fireEvent.change(editor, { target: { value: '' } })
    expect(editor).not.toHaveAttribute('readonly')
    state.run.mockResolvedValue({ ok: true, stdout: '', stderr: '', error: null, elapsedMs: 5 })
    run()
    await record().findByText(/Custom script finished without a reported runtime error/)
    expect(state.run).toHaveBeenCalledWith('')
    expect(record().queryByText('What this sample demonstrated:')).not.toBeInTheDocument()
  })
  it('marks an old attempt out of date when the engine instance changes', async () => {
    const view = render(<KmipPipelineBuilder engine={engine} />)
    choose()
    run()
    await record().findByText('Required generated sample steps completed.')
    view.rerender(<KmipPipelineBuilder engine={{ ...engine } as KmipEngine} />)
    expect(record().getByRole('status')).toHaveTextContent('Inputs changed')
  })
  it('restores the saved hex mode before running the same characters', async () => {
    render(<KmipPipelineBuilder engine={engine} />)
    fireEvent.click(screen.getByRole('button', { name: 'hex' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Message to sign' }), {
      target: { value: '00ff80' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'Pipeline name' }), {
      target: { value: 'saved binary input' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    const saved = JSON.parse(localStorage.getItem('pqctoday-hub-kmip-pipelines-v1')!)[
      'saved binary input'
    ]
    expect(saved.messageMode).toBe('hex')
    expect(saved.input).toBe('00ff80')
    expect(saved.customCode).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'text' }))
    fireEvent.click(screen.getByRole('button', { name: 'saved binary input' }))
    expect(screen.getByRole('textbox', { name: 'Message to sign' })).toHaveValue('00ff80')
    expect(screen.getByRole('button', { name: 'hex' })).toHaveAttribute('aria-pressed', 'true')
    run()
    await waitFor(() => expect(state.run).toHaveBeenCalledTimes(1))
    expect(state.run.mock.calls[0][0]).toContain("leaf('Data', 'ByteString', '00ff80')")
  })
  it.each(['print("saved custom")', ''])(
    'restores saved custom code exactly, including an empty script',
    async (code) => {
      render(<KmipPipelineBuilder engine={engine} />)
      fireEvent.change(screen.getByRole('textbox', { name: 'Pipeline name' }), {
        target: { value: 'saved custom input' },
      })
      fireEvent.click(screen.getByRole('tab', { name: 'Code' }))
      fireEvent.click(screen.getByRole('button', { name: 'Edit as custom script' }))
      fireEvent.change(await screen.findByRole('textbox', { name: 'Python sample code' }), {
        target: { value: code },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))
      fireEvent.click(screen.getByRole('button', { name: 'Discard edits, resync' }))
      fireEvent.click(screen.getByRole('tab', { name: /^Builder/ }))
      fireEvent.click(screen.getByRole('button', { name: 'saved custom input' }))
      expect(await screen.findByRole('textbox', { name: 'Python sample code' })).toHaveValue(code)
      run()
      await waitFor(() => expect(state.run).toHaveBeenCalledWith(code))
    }
  )
  it('imports the recorded mode rather than retaining the current hex selection', async () => {
    const { exportKmipPipeline, snapshotKmipPipeline } = await import('./kmipPipelinePersistence')
    render(<KmipPipelineBuilder engine={engine} />)
    fireEvent.click(screen.getByRole('button', { name: 'hex' }))
    const text = exportKmipPipeline(
      'text input',
      snapshotKmipPipeline(KMIP_TEMPLATES['Governed lifecycle'], '00ff80', 'text', null)
    )
    const file = new File([text], 'input.json', { type: 'application/json' })
    Object.defineProperty(file, 'text', { value: async () => text })
    fireEvent.change(screen.getByLabelText('Import KMIP pipeline JSON'), {
      target: { files: [file] },
    })
    await screen.findByText('Imported "text input"')
    expect(screen.getByRole('button', { name: 'text' })).toHaveAttribute('aria-pressed', 'true')
    run()
    await waitFor(() => expect(state.run).toHaveBeenCalledTimes(1))
    expect(state.run.mock.calls[0][0]).toMatch(/leaf\('Data', 'ByteString', .*\.hex\(\)\)/)
  })
  it('requires an explicit interpretation of legacy input without discarding its characters', async () => {
    render(<KmipPipelineBuilder engine={engine} />)
    const text = JSON.stringify({
      schema: 'pqctoday-hub-kmip-pipeline-v1',
      name: 'legacy sample',
      pipeline: { steps: KMIP_TEMPLATES['Governed lifecycle'], input: '00ff80' },
    })
    const file = new File([text], 'legacy.json', { type: 'application/json' })
    Object.defineProperty(file, 'text', { value: async () => text })
    fireEvent.change(screen.getByLabelText('Import KMIP pipeline JSON'), {
      target: { files: [file] },
    })
    await screen.findByText('Imported "legacy sample"')
    expect(screen.getByRole('status')).toHaveTextContent(
      'did not record message mode or custom edits'
    )
    for (const name of ['Run', 'Save', 'Export JSON'])
      expect(screen.getByRole('button', { name })).toBeDisabled()
    for (const button of screen.getAllByRole('button', { name: 'Export .py' }))
      expect(button).toBeDisabled()
    fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true })
    expect(state.run).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'hex' }))
    expect(screen.getByRole('textbox', { name: 'Message to sign' })).toHaveValue('00ff80')
    expect(screen.getByRole('button', { name: 'Run' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(
      JSON.parse(localStorage.getItem('pqctoday-hub-kmip-pipelines-v1')!)['legacy sample']
        .messageMode
    ).toBe('hex')
  })
  it('Ctrl+Enter attached at mount honours the legacy-input guard of the current render', async () => {
    // The shortcut listener attached at mount must not act on that render's
    // closure: right after a legacy import it has to see the import's
    // "choose Text or Hex" guard. Calling the mount-time handler directly makes
    // this deterministic instead of depending on when React flushes effects.
    const add = vi.spyOn(window, 'addEventListener')
    render(<KmipPipelineBuilder engine={engine} />)
    const registered = add.mock.calls.filter(([type]) => String(type) === 'keydown')
    expect(registered).toHaveLength(1)
    const mountHandler = registered[0][1] as (e: KeyboardEvent) => void
    const text = JSON.stringify({
      schema: 'pqctoday-hub-kmip-pipeline-v1',
      name: 'legacy sample',
      pipeline: { steps: KMIP_TEMPLATES['Governed lifecycle'], input: '00ff80' },
    })
    const file = new File([text], 'legacy.json', { type: 'application/json' })
    Object.defineProperty(file, 'text', { value: async () => text })
    fireEvent.change(screen.getByLabelText('Import KMIP pipeline JSON'), {
      target: { files: [file] },
    })
    await screen.findByText('Imported "legacy sample"')
    act(() => mountHandler(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true })))
    await Promise.resolve()
    expect(state.run).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Run' })).toBeDisabled()
    // Registered once: re-renders must not attach further keydown listeners.
    expect(add.mock.calls.filter(([type]) => String(type) === 'keydown')).toHaveLength(1)
    add.mockRestore()
  })
})

// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
})

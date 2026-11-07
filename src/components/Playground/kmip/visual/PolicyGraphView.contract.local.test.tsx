// SPDX-License-Identifier: AGPL-3.0-only
import { flushSync } from 'react-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PolicyGraphView } from './PolicyGraphView'
import type { KmipEngine, DryRunSpec } from '@/wasm/kmip/kmipEngine'

const yaml = `schema_version: "1"
metadata:
  name: fictional-policy
  scopes: [sign]
rules:
  - type: algorithm_default
    default_algorithm: ML-DSA-65
`
function fixture() {
  const dryRun = vi.fn<(request: DryRunSpec) => { kind: string; algorithm?: string }>(() => ({
    kind: 'Allow',
    algorithm: 'ML-DSA-65',
  }))
  const engine = {
    dryRun,
    policyStatus: vi.fn(() => ({ active: true, name: 'sample', fingerprint: 'sample-fp' })),
    policyModulesStatus: vi.fn(() => ({
      modules: [
        { name: 'sample', fingerprint: 'sample-fp', enabled: true, scopes: ['sign'], rules: 1 },
      ],
      uncoveredOps: 'deny',
    })),
    lintPolicyDraft: vi.fn(() => ({ ok: true, findings: [] })),
  }
  const apply = vi.fn<(yaml: string) => { ok: boolean }>(() => ({ ok: true }))
  return { engine: engine as unknown as KmipEngine, dryRun, apply }
}
function mount(readOnly = false, f = fixture()) {
  const view = render(
    <PolicyGraphView
      engine={f.engine}
      initialYaml={yaml}
      presetFile={null}
      guided={false}
      onLoadPreset={vi.fn()}
      onApplyYaml={f.apply}
      readOnly={readOnly}
    />
  )
  return { ...f, ...view }
}
const run = async () => {
  fireEvent.click(
    screen.getByRole('button', { name: /Run (through the pipeline|with loaded engine modules)/ })
  )
  await act(async () => {
    await Promise.resolve()
  })
}

const source = () => {
  fireEvent.click(screen.getByRole('button', { name: /policy source/ }))
  return screen.getByRole('textbox', { name: 'Policy YAML source' })
}
beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener() {},
    removeEventListener() {},
  }))
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('policy graph current-source and loaded-module result contracts', () => {
  it('keeps multi-module editing disabled but preserves loaded-engine Run without graph attribution', async () => {
    const f = mount(true)
    expect(screen.getByRole('button', { name: 'disable rule' })).toBeDisabled()
    const addButtons = screen
      .getAllByRole('button')
      .filter((b) => b.textContent?.includes('Algorithm substitution'))
    for (const button of addButtons) expect(button).toBeDisabled()
    const input = source()
    expect(input).toHaveAttribute('readonly')
    expect(input).toHaveValue(yaml)
    fireEvent.change(input, { target: { value: 'changed' } })
    expect(input).toHaveValue(yaml)
    fireEvent.click(screen.getByRole('button', { name: 'Run with loaded engine modules' }))
    expect(f.apply).not.toHaveBeenCalled()
    expect(f.dryRun).toHaveBeenCalledOnce()
    expect(screen.getByText(/recorded engine-context result/)).toBeVisible()
    expect(screen.getByText(/Displayed source\/graph correspondence: Unconfirmed/)).toBeVisible()
    expect(screen.queryByText(/To allow this/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Illustrative graph path/)).not.toBeInTheDocument()
    expect(screen.getByText(/"fingerprint": "sample-fp"/)).toBeInTheDocument()
  })

  it('does not replace an unedited source containing unmodelled fields', async () => {
    const f = fixture()
    const fullSource = yaml + '\nunsupported_extension: preserve-this\n'
    render(
      <PolicyGraphView
        engine={f.engine}
        initialYaml={fullSource}
        presetFile={null}
        guided={false}
        onLoadPreset={vi.fn()}
        onApplyYaml={f.apply}
      />
    )
    await run()
    expect(f.apply).not.toHaveBeenCalled()
    expect(f.dryRun).toHaveBeenCalledOnce()
    expect(screen.getByText(/recorded engine-context result/)).toBeVisible()
    expect(screen.queryByText(/Illustrative graph path/)).not.toBeInTheDocument()
    expect(source()).toHaveValue(fullSource)
  })

  it('applies current editable source before dryRun and preserves actual request mapping', async () => {
    const f = mount()
    fireEvent.click(screen.getByRole('button', { name: 'disable rule' }))
    await run()
    expect(f.apply).toHaveBeenCalledWith(expect.stringContaining('fictional-policy'))
    expect(f.apply.mock.invocationCallOrder[0]).toBeLessThan(f.dryRun.mock.invocationCallOrder[0])
    expect(f.dryRun).toHaveBeenCalledWith({
      op: 'Sign',
      algorithm: 'ECDSA-P256',
      currentAlgorithm: 'ECDSA-P256',
      length: undefined,
      state: 'Active',
      name: undefined,
      date: '2026-06-01',
      attrs: { 'x-pqctoday-purpose': 'research' },
      usageMask: ['Sign', 'Verify'],
      activationDate: undefined,
      mechanism: undefined,
    })
    expect(screen.getByText(/Illustrative graph path/)).toBeVisible()
  })

  it.each(['false', 'missing', 'throw'])(
    'does not run or fabricate success when apply returns %s',
    async (kind) => {
      const f = fixture()
      if (kind === 'throw')
        f.apply.mockImplementation(() => {
          throw new Error('sample apply failure')
        })
      else f.apply.mockReturnValue((kind === 'false' ? { ok: false } : undefined) as never)
      mount(false, f)
      fireEvent.click(screen.getByRole('button', { name: 'disable rule' }))
      await run()
      expect(f.dryRun).not.toHaveBeenCalled()
      expect(screen.getByRole('alert')).toHaveTextContent('Incomplete')
      expect(
        screen.queryByText(/^(engine verdict|recorded engine-context result)$/)
      ).not.toBeInTheDocument()
      f.apply.mockReturnValue({ ok: true })
      await run()
      expect(f.dryRun).toHaveBeenCalledOnce()
    }
  )

  it('does not substitute illustrative Allow after a real engine failure', async () => {
    const f = fixture()
    f.dryRun.mockImplementation(() => {
      throw new Error('sample engine failed')
    })
    mount(false, f)
    await run()
    expect(screen.getByRole('alert')).toHaveTextContent('sample engine failed')
    expect(
      screen.queryByText(/^(engine verdict|recorded engine-context result)$/)
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/Illustrative graph path/)).not.toBeInTheDocument()
  })

  it('retains a real Deny as a result while refusing flat per-module remedy/trace mapping', async () => {
    const f = fixture()
    f.dryRun.mockReturnValue({
      kind: 'Deny',
      reason: 'sample refusal',
      trace: [{ index: 1, effect: 'deny' }],
    } as never)
    mount(true, f)
    fireEvent.click(screen.getByRole('button', { name: 'Run with loaded engine modules' }))
    expect(screen.getByText('sample refusal')).toBeVisible()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByText(/To allow this/)).not.toBeInTheDocument()
  })

  it('withholds attribution if loaded modules change during dryRun', async () => {
    const f = fixture()
    const modules = vi.mocked(f.engine.policyModulesStatus)
    modules
      .mockReturnValueOnce({ modules: [], uncoveredOps: 'deny' })
      .mockReturnValueOnce({ modules: [], uncoveredOps: 'allow' })
    mount(true, f)
    fireEvent.click(screen.getByRole('button', { name: 'Run with loaded engine modules' }))
    expect(screen.getByRole('alert')).toHaveTextContent('context changed')
    expect(screen.queryByText(/recorded engine-context result/)).not.toBeInTheDocument()
  })

  it('invalidates result immediately on raw draft and blocks Run until Apply/Discard', async () => {
    const f = mount()
    await run()
    fireEvent.change(source(), { target: { value: yaml + '\n# new draft' } })
    expect(
      screen.queryByText(/^(engine verdict|recorded engine-context result)$/)
    ).not.toBeInTheDocument()
    await run()
    expect(screen.getByRole('alert')).toHaveTextContent('apply or discard')
    expect(f.dryRun).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }))
    await run()
    expect(f.dryRun).toHaveBeenCalledTimes(2)
  })

  it('does not reapply a modified draft just because parent callback identity changes', async () => {
    vi.useFakeTimers()
    const f = mount()
    fireEvent.click(screen.getByRole('button', { name: 'disable rule' }))
    await act(async () => vi.advanceTimersByTime(401))
    expect(f.apply).toHaveBeenCalledOnce()
    f.rerender(
      <PolicyGraphView
        engine={f.engine}
        initialYaml={yaml}
        presetFile={null}
        guided={false}
        onLoadPreset={vi.fn()}
        onApplyYaml={(text) => f.apply(text)}
      />
    )
    await act(async () => vi.advanceTimersByTime(401))
    expect(f.apply).toHaveBeenCalledOnce()
    f.unmount()
    await act(async () => vi.advanceTimersByTime(1000))
    expect(f.apply).toHaveBeenCalledOnce()
  })
  it('clears a recorded result immediately when request fields change', async () => {
    const f = mount()
    await run()
    expect(screen.getByText('recorded engine-context result')).toBeVisible()
    fireEvent.change(
      screen.getByPlaceholderText('e.g. payments-db-cipher (leave empty for unnamed)'),
      { target: { value: 'fictional-key' } }
    )
    expect(screen.queryByText('recorded engine-context result')).not.toBeInTheDocument()
    await run()
    expect(f.dryRun.mock.calls[1][0]).toMatchObject({ name: 'fictional-key' })
  })

  it('does not resurrect an old animation after policy edit or unmount', async () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.push(callback)
      return frames.length
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    const f = mount()
    fireEvent.click(screen.getByRole('button', { name: 'disable rule' }))
    await run()
    expect(frames.length).toBeGreaterThan(0)
    const late = frames[frames.length - 1]
    fireEvent.change(
      screen.getByPlaceholderText('e.g. payments-db-cipher (leave empty for unnamed)'),
      { target: { value: 'changed' } }
    )
    act(() => late(performance.now() + 10000))
    expect(screen.queryByText('engine verdict')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Run through the pipeline' })).toBeEnabled()
    f.unmount()
    const count = frames.length
    act(() => late(performance.now() + 20000))
    expect(frames).toHaveLength(count)
    expect(f.dryRun).toHaveBeenCalledOnce()
  })
  it('never applies old edited YAML through a replacement engine callback', async () => {
    vi.useFakeTimers()
    const f = mount()
    fireEvent.click(screen.getByRole('button', { name: 'disable rule' }))
    const replacement = fixture()
    f.rerender(
      <PolicyGraphView
        engine={replacement.engine}
        initialYaml={yaml + '\n# replacement source'}
        presetFile="replacement.yaml"
        guided={false}
        onLoadPreset={vi.fn()}
        onApplyYaml={replacement.apply}
      />
    )
    await act(async () => vi.advanceTimersByTime(401))
    expect(f.apply).not.toHaveBeenCalled()
    expect(replacement.apply).not.toHaveBeenCalled()
    expect(f.engine.lintPolicyDraft).not.toHaveBeenCalled()
    expect(replacement.engine.lintPolicyDraft).toHaveBeenCalledOnce()
  })

  it('keeps legitimate pending policy apply when only the request changes', async () => {
    vi.useFakeTimers()
    const f = mount()
    fireEvent.click(screen.getByRole('button', { name: 'disable rule' }))
    fireEvent.change(
      screen.getByPlaceholderText('e.g. payments-db-cipher (leave empty for unnamed)'),
      { target: { value: 'request-only-edit' } }
    )
    await act(async () => vi.advanceTimersByTime(401))
    expect(f.apply).toHaveBeenCalledOnce()
    expect(f.dryRun).not.toHaveBeenCalled()
  })

  it.each(['false', 'missing', 'throw'])(
    'shows incomplete rather than clean findings for lint %s',
    async (mode) => {
      vi.useFakeTimers()
      const f = fixture()
      if (mode === 'throw')
        vi.mocked(f.engine.lintPolicyDraft).mockImplementation(() => {
          throw new Error('sample lint failure')
        })
      else
        vi.mocked(f.engine.lintPolicyDraft).mockReturnValue(
          (mode === 'false' ? { ok: false } : undefined) as never
        )
      mount(false, f)
      await act(async () => vi.advanceTimersByTime(401))
      fireEvent.click(screen.getByRole('button', { name: 'Check' }))
      expect(screen.getByText(/Incomplete: policy lint/)).toBeVisible()
    }
  )

  it('labels concatenated-source single-policy lint not assessed', async () => {
    const f = mount(true)
    fireEvent.click(screen.getByRole('button', { name: 'Check' }))
    expect(screen.getByText(/Not assessed: single-policy lint/)).toBeVisible()
    expect(f.engine.lintPolicyDraft).not.toHaveBeenCalled()
  })
  it('Reset restores the complete original single-policy source, including unknown fields', async () => {
    const f = fixture()
    const original = yaml + '\nunsupported_extension: preserve-this\n'
    render(
      <PolicyGraphView
        engine={f.engine}
        initialYaml={original}
        presetFile={null}
        guided={false}
        onLoadPreset={vi.fn()}
        onApplyYaml={f.apply}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'disable rule' }))
    fireEvent.click(screen.getByRole('button', { name: 'reset' }))
    await act(async () => {
      await Promise.resolve()
    })
    expect(f.apply).toHaveBeenLastCalledWith(original)
    expect(source()).toHaveValue(original)
  })

  it('invalidates the old result and RAF when engine/source/preset is replaced', async () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.push(callback)
      return frames.length
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    const f = mount()
    fireEvent.click(screen.getByRole('button', { name: 'disable rule' }))
    await run()
    const late = frames[frames.length - 1]
    const replacement = fixture()
    f.rerender(
      <PolicyGraphView
        engine={replacement.engine}
        initialYaml={yaml + '\n# replacement'}
        presetFile="replacement.yaml"
        guided={false}
        onLoadPreset={vi.fn()}
        onApplyYaml={replacement.apply}
      />
    )
    expect(screen.queryByText('engine verdict')).not.toBeInTheDocument()
    const count = frames.length
    act(() => late(performance.now() + 100))
    expect(frames).toHaveLength(count)
    expect(replacement.dryRun).not.toHaveBeenCalled()
  })

  it.each(['replace', 'unmount'])(
    'does not run or save after apply synchronously %ss its owner',
    async (mode) => {
      vi.useFakeTimers()
      localStorage.clear()
      const f = mount()
      const replacement = fixture()
      f.apply.mockImplementation(() => {
        if (mode === 'unmount') f.unmount()
        else
          flushSync(() =>
            f.rerender(
              <PolicyGraphView
                engine={replacement.engine}
                initialYaml={yaml + '\n# replacement'}
                presetFile="replacement.yaml"
                guided={false}
                onLoadPreset={vi.fn()}
                onApplyYaml={replacement.apply}
              />
            )
          )
        return { ok: true }
      })
      fireEvent.click(screen.getByRole('button', { name: 'disable rule' }))
      await run()
      expect(f.dryRun).not.toHaveBeenCalled()
      expect(screen.queryByText('engine verdict')).not.toBeInTheDocument()
      await act(async () => vi.advanceTimersByTime(401))
      expect(localStorage.length).toBe(0)
    }
  )

  it('does not save a pending draft after the apply callback replaces the engine', async () => {
    vi.useFakeTimers()
    localStorage.clear()
    const f = mount()
    const replacement = fixture()
    f.apply.mockImplementation(() => {
      f.rerender(
        <PolicyGraphView
          engine={replacement.engine}
          initialYaml={yaml + '\n# replacement'}
          presetFile="replacement.yaml"
          guided={false}
          onLoadPreset={vi.fn()}
          onApplyYaml={replacement.apply}
        />
      )
      localStorage.setItem('cacp-session-v1', 'replacement-owner-draft')
      return { ok: true }
    })
    fireEvent.click(screen.getByRole('button', { name: 'disable rule' }))
    await act(async () => vi.advanceTimersByTime(401))
    expect(localStorage.getItem('cacp-session-v1')).toBe('replacement-owner-draft')
    expect(f.dryRun).not.toHaveBeenCalled()
  })

  it('clears a pre-commit run once a batched replacement actually commits', async () => {
    const f = mount()
    const replacement = fixture()
    f.apply.mockImplementation(() => {
      f.rerender(
        <PolicyGraphView
          engine={replacement.engine}
          initialYaml={yaml + '\n# replacement'}
          presetFile="replacement.yaml"
          guided={false}
          onLoadPreset={vi.fn()}
          onApplyYaml={replacement.apply}
        />
      )
      return { ok: true }
    })
    fireEvent.click(screen.getByRole('button', { name: 'disable rule' }))
    await run()
    // A synchronous call before the requested replacement commits is allowed.
    expect(screen.queryByText('engine verdict')).not.toBeInTheDocument()
    expect(replacement.dryRun).not.toHaveBeenCalled()
  })

  it('allows successful exact-text self-publication on the same engine/preset', async () => {
    const f = mount()
    f.apply.mockImplementation((text) => {
      f.rerender(
        <PolicyGraphView
          engine={f.engine}
          initialYaml={text}
          presetFile={null}
          guided={false}
          onLoadPreset={vi.fn()}
          onApplyYaml={f.apply}
        />
      )
      return { ok: true }
    })
    fireEvent.click(screen.getByRole('button', { name: 'disable rule' }))
    await run()
    expect(f.dryRun).toHaveBeenCalledOnce()
    expect(screen.getByText('engine verdict')).toBeVisible()
  })
  it('retains Incomplete for exact attempted-source publication and requires successful retry before dryRun', async () => {
    const f = mount()
    let rejected = true
    f.apply.mockImplementation((text) => {
      f.rerender(
        <PolicyGraphView
          engine={f.engine}
          initialYaml={text}
          presetFile={null}
          guided={false}
          onLoadPreset={vi.fn()}
          onApplyYaml={f.apply}
        />
      )
      return rejected ? { ok: false, error: 'invalid effective sample' } : { ok: true }
    })
    fireEvent.click(screen.getByRole('button', { name: 'disable rule' }))
    await run()
    expect(screen.getByRole('alert')).toHaveTextContent('Incomplete: invalid effective sample')
    expect(f.dryRun).not.toHaveBeenCalled()
    expect(screen.queryByText('engine verdict')).not.toBeInTheDocument()
    expect(screen.queryByText(/Edited graph explicitly applied/)).not.toBeInTheDocument()
    rejected = false
    await run()
    expect(f.apply).toHaveBeenCalledTimes(2)
    expect(f.dryRun).toHaveBeenCalledOnce()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('engine verdict')).toBeVisible()
  })
  it('does not reuse obsolete A publication identity after a genuine B context was recorded', async () => {
    const f = mount()
    fireEvent.click(screen.getByRole('button', { name: 'disable rule' }))
    fireEvent.click(screen.getByRole('button', { name: 'reset' }))
    expect(f.apply).toHaveBeenLastCalledWith(yaml)
    const foreign = yaml + '\n# genuine B source'
    f.rerender(
      <PolicyGraphView
        engine={f.engine}
        initialYaml={foreign}
        presetFile={null}
        guided={false}
        onLoadPreset={vi.fn()}
        onApplyYaml={f.apply}
      />
    )
    await run()
    expect(screen.getByText('recorded engine-context result')).toBeVisible()
    expect(screen.getByText(/genuine B source/)).toBeInTheDocument()
    f.rerender(
      <PolicyGraphView
        engine={f.engine}
        initialYaml={yaml}
        presetFile={null}
        guided={false}
        onLoadPreset={vi.fn()}
        onApplyYaml={f.apply}
      />
    )
    expect(screen.queryByText('recorded engine-context result')).not.toBeInTheDocument()
  })
})

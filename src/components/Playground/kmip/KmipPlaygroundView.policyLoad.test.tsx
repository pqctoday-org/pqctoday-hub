// SPDX-License-Identifier: AGPL-3.0-only
//
// Loading a policy from the Policy tab: the YAML shown to the reader must be the
// policy the engine actually accepted, a missing file must not be read as YAML,
// and a slow earlier load must not replace a policy chosen later. The engine and
// fetch are mocked; the Policy tab is a stub that exposes the props the view
// hands it. The last tests cover the restore of the previous session on mount.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { POLICY_PRESETS, type PolicyPreset } from '@/wasm/kmip/kmipMeta'
import { loadCacpSession, saveCacpDraft, saveCacpPresetSession } from './cacpSessionStorage'

type PolicyViewProps = {
  policyYaml: string | null
  onLoadPolicy: (p: PolicyPreset) => Promise<void>
  onApplyYaml: (yaml: string) => { ok: boolean } | undefined
}
const captured: { props: PolicyViewProps | null } = { props: null }

vi.mock('./PolicyView', () => ({
  PolicyView: (props: PolicyViewProps) => {
    captured.props = props
    return <pre data-testid="shown-yaml">{props.policyYaml ?? ''}</pre>
  },
}))

const engine = {
  policyStatus: vi.fn(() => ({ active: true, name: 'x', fingerprint: 'fp' })),
  policyModulesStatus: vi.fn(() => ({ uncoveredOps: 'deny', modules: [] })),
  listObjects: vi.fn(() => []),
  auditSnapshot: vi.fn(() => []),
  clearAudit: vi.fn(),
  loadPolicy: vi.fn<(yaml: string) => { ok: boolean; error?: string }>(() => ({ ok: true })),
  activateModulePreset: vi.fn<(name: string, yamls: string[]) => { ok: boolean; error?: string }>(
    () => ({ ok: true })
  ),
}
vi.mock('@/wasm/kmip/kmipEngine', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/wasm/kmip/kmipEngine')>()),
  getKmipEngine: () => Promise.resolve(engine),
}))

import { KmipPlaygroundView } from './KmipPlaygroundView'

const preset = (file: string, files?: string[]): PolicyPreset => ({
  file,
  files,
  name: file.replace('.yaml', ''),
  label: file,
  blurb: '',
  tone: 'permissive',
  category: 'Baseline',
  illustrates: '',
})

const okResponse = (body: string) => ({ ok: true, status: 200, text: () => Promise.resolve(body) })
const notFound = () => ({
  ok: false,
  status: 404,
  text: () => Promise.resolve('<!doctype html><title>Not found</title>'),
})

const mountPolicyTab = async () => {
  render(
    <MemoryRouter initialEntries={['/playground/cacp?tab=policy']}>
      <KmipPlaygroundView />
    </MemoryRouter>
  )
  await waitFor(() => expect(captured.props).not.toBeNull())
  await waitFor(() => expect(engine.listObjects).toHaveBeenCalled())
}
const shown = () => screen.getByTestId('shown-yaml').textContent

describe('KmipPlaygroundView policy loading', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    captured.props = null
    localStorage.clear()
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    engine.loadPolicy.mockReset().mockReturnValue({ ok: true })
    engine.activateModulePreset.mockReset().mockReturnValue({ ok: true })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('does not load a 404 response as YAML', async () => {
    fetchMock.mockResolvedValue(notFound())
    await mountPolicyTab()
    await act(() => captured.props!.onLoadPolicy(preset('missing.yaml')))
    expect(engine.loadPolicy).not.toHaveBeenCalled()
    expect(shown()).toBe('')
  })

  it('does not load a 404 module file into a modular preset', async () => {
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(url.endsWith('b.yaml') ? notFound() : okResponse('rules: []'))
    )
    await mountPolicyTab()
    await act(() => captured.props!.onLoadPolicy(preset('m.yaml', ['a.yaml', 'b.yaml'])))
    expect(engine.activateModulePreset).not.toHaveBeenCalled()
    expect(shown()).toBe('')
  })

  it('shows the YAML only after the engine accepts it', async () => {
    fetchMock.mockResolvedValue(okResponse('schema_version: 3'))
    engine.loadPolicy.mockReturnValue({ ok: false, error: 'bad rule' })
    await mountPolicyTab()
    await act(() => captured.props!.onLoadPolicy(preset('p.yaml')))
    expect(engine.loadPolicy).toHaveBeenCalledWith('schema_version: 3')
    expect(shown()).toBe('')

    engine.loadPolicy.mockReturnValue({ ok: true })
    await act(() => captured.props!.onLoadPolicy(preset('p.yaml')))
    expect(shown()).toBe('schema_version: 3')
  })

  it('shows the module YAML only after the engine accepts the module set', async () => {
    fetchMock.mockImplementation((url: string) => Promise.resolve(okResponse(`# ${url}`)))
    engine.activateModulePreset.mockReturnValue({ ok: false, error: 'conflict' })
    await mountPolicyTab()
    await act(() => captured.props!.onLoadPolicy(preset('m.yaml', ['a.yaml', 'b.yaml'])))
    expect(engine.activateModulePreset).toHaveBeenCalledTimes(1)
    expect(shown()).toBe('')
  })

  it('ignores a slow earlier load that settles after a later one', async () => {
    let releaseFirst!: (r: unknown) => void
    fetchMock.mockImplementation((url: string) =>
      url.endsWith('first.yaml')
        ? new Promise((res) => {
            releaseFirst = res
          })
        : Promise.resolve(okResponse('second policy'))
    )
    await mountPolicyTab()
    let first!: Promise<void>
    act(() => {
      first = captured.props!.onLoadPolicy(preset('first.yaml'))
    })
    await act(() => captured.props!.onLoadPolicy(preset('second.yaml')))
    expect(shown()).toBe('second policy')

    await act(async () => {
      releaseFirst(okResponse('first policy'))
      await first
    })
    expect(engine.loadPolicy).toHaveBeenCalledTimes(1)
    expect(engine.loadPolicy).toHaveBeenCalledWith('second policy')
    expect(shown()).toBe('second policy')
  })

  it('applies an edited YAML to the views only when the engine accepts it', async () => {
    await mountPolicyTab()
    engine.loadPolicy.mockReturnValue({ ok: false, error: 'bad rule' })
    act(() => {
      captured.props!.onApplyYaml('refused: true')
    })
    expect(shown()).toBe('')

    engine.loadPolicy.mockReturnValue({ ok: true })
    act(() => {
      captured.props!.onApplyYaml('accepted: true')
    })
    expect(shown()).toBe('accepted: true')
  })

  describe('restoring the previous session on mount', () => {
    const savedFile = POLICY_PRESETS.find((p) => !p.files)!.file
    const saveSession = () => {
      saveCacpPresetSession({
        presetFile: savedFile,
        moduleFiles: null,
        uncoveredOps: 'deny',
        fingerprints: ['saved-fp'],
      })
      saveCacpDraft(savedFile, 'draft: true')
    }
    const staleNotice = () => screen.queryByText(/Policy updated since your last visit/)

    it('shows the updated-policy notice and re-applies the draft when the restored load is the current one', async () => {
      saveSession()
      fetchMock.mockResolvedValue(okResponse('restored policy'))
      await mountPolicyTab()
      await waitFor(() => expect(staleNotice()).toBeInTheDocument())
      expect(engine.loadPolicy).toHaveBeenCalledWith('restored policy')
      expect(engine.loadPolicy).toHaveBeenCalledWith('draft: true')
    })

    it('shows no notice and does not re-apply the draft when the reader chose another policy first', async () => {
      saveSession()
      let releaseRestore!: (r: unknown) => void
      fetchMock.mockImplementation((url: string) =>
        url.endsWith(savedFile)
          ? new Promise((res) => {
              releaseRestore = res
            })
          : Promise.resolve(okResponse('second policy'))
      )
      await mountPolicyTab()
      await waitFor(() => expect(releaseRestore).toBeTypeOf('function'))
      await act(() => captured.props!.onLoadPolicy(preset('second.yaml')))
      expect(shown()).toBe('second policy')

      // the slower restore now settles; it has been replaced and must change nothing
      await act(async () => {
        releaseRestore(okResponse('restored policy'))
        await new Promise((resolve) => setTimeout(resolve, 0))
      })
      expect(staleNotice()).not.toBeInTheDocument()
      expect(engine.loadPolicy).toHaveBeenCalledTimes(1)
      expect(engine.loadPolicy).toHaveBeenCalledWith('second policy')
      expect(shown()).toBe('second policy')
    })

    it('keeps the saved draft, without a notice, when the saved policy file cannot be read', async () => {
      saveSession()
      fetchMock.mockResolvedValue(notFound())
      await mountPolicyTab()
      // the draft is local: it is applied and stays stored although the preset never loaded
      await waitFor(() => expect(engine.loadPolicy).toHaveBeenCalledWith('draft: true'))
      expect(staleNotice()).not.toBeInTheDocument()
      expect(engine.loadPolicy).toHaveBeenCalledTimes(1)
      expect(loadCacpSession().draftYaml).toBe('draft: true')
      expect(loadCacpSession().draftPresetFile).toBe(savedFile)
    })

    it('keeps the saved draft, without a notice, when the engine refuses the saved preset', async () => {
      saveSession()
      fetchMock.mockResolvedValue(okResponse('restored policy'))
      engine.loadPolicy.mockReturnValueOnce({ ok: false, error: 'bad rule' })
      await mountPolicyTab()
      await waitFor(() => expect(engine.loadPolicy).toHaveBeenCalledWith('draft: true'))
      expect(engine.loadPolicy).toHaveBeenNthCalledWith(1, 'restored policy')
      expect(staleNotice()).not.toBeInTheDocument()
      expect(loadCacpSession().draftYaml).toBe('draft: true')
    })
  })
})

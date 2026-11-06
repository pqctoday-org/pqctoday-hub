// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { LibraryCBOMBuilder } from './LibraryCBOMBuilder'
import { downloadCbomJson } from '@/services/cbom/cycloneDx'
const save = vi.fn(),
  publish = vi.fn()
vi.mock('@/hooks/useAlgorithmTransitionsForAssessment', () => ({
  useAlgorithmTransitionsForAssessment: () => [],
}))
vi.mock('@/hooks/useExecutiveModuleData', () => ({
  useExecutiveModuleData: () => ({ myProducts: [] }),
}))
vi.mock('@/hooks/useSavedArtifactInputs', () => ({ useSavedArtifactInputs: () => undefined }))
vi.mock('@/hooks/useLiveCmvpStatus', () => ({
  useLiveCmvpStatus: () => ({ matchById: () => null }),
}))
vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: (selector: (s: unknown) => unknown) => selector({ addExecutiveDocument: save }),
}))
vi.mock('@/services/cbom/cycloneDx', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/cbom/cycloneDx')>()),
  downloadCbomJson: vi.fn(),
}))
const edit = (text: string) =>
  fireEvent.change(screen.getByRole('textbox', { name: 'Paste components-shaped JSON' }), {
    target: { value: text },
  })
function start() {
  const view = render(<LibraryCBOMBuilder onCbomExport={publish} />)
  fireEvent.click(screen.getByRole('button', { name: 'SBOM → CBOM' }))
  return view
}
beforeEach(() => {
  vi.useRealTimers()
  save.mockClear()
  publish.mockClear()
  vi.mocked(downloadCbomJson).mockClear()
})
describe('components-shaped teaching input scope', () => {
  it.each([
    ['{', 'Malformed JSON'],
    ['null', 'Unsupported input shape'],
    ['[]', 'Unsupported input shape'],
    ['{"spdxVersion":"SPDX-2.3","packages":[]}', 'Unsupported input format'],
    ['{"@graph":[]}', 'Unsupported input format'],
    ['{}', 'Unsupported input format'],
    ['{"components":{}}', 'Malformed components'],
    ['{"components":null}', 'Malformed components'],
    ['{"components":[null]}', 'Malformed component 1'],
    ['{"components":[[]]}', 'Malformed component 1'],
    ['{"components":[{"name":""}]}', 'Malformed component 1'],
    ['{"components":[{"name":42}]}', 'Malformed component 1'],
    ['{"components":[{"name":"sample","version":1}]}', 'Malformed component 1'],
  ])('blocks unsupported or malformed input %s', (text, message) => {
    start()
    publish.mockClear()
    save.mockClear()
    edit(text)
    expect(screen.getByRole('alert')).toHaveTextContent(message)
    expect(screen.getByRole('textbox', { name: 'Paste components-shaped JSON' })).toHaveValue(text)
    expect(screen.getByRole('button', { name: 'Download CycloneDX 1.7' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: /^Save/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '.md' })).not.toBeInTheDocument()
    expect(publish).not.toHaveBeenCalled()
    expect(save).not.toHaveBeenCalled()
  })
  it('distinguishes supported empty, unmatched and recovered valid inputs without byte coercion', () => {
    start()
    publish.mockClear()
    edit('{"components":[]}')
    expect(screen.getByRole('status')).toHaveTextContent('Supported empty components sample')
    expect(publish).toHaveBeenLastCalledWith([])
    expect(screen.getByRole('button', { name: 'Download CycloneDX 1.7' })).toBeEnabled()
    edit('{"components":[{"name":"Unknown Ω","version":"01.00"}]}')
    expect(screen.getByRole('status')).toHaveTextContent(
      '1 mapped sample rows; 1 without a catalogue match'
    )
    expect(publish.mock.lastCall![0][0]).toMatchObject({ name: 'Unknown Ω', version: '01.00' })
    publish.mockClear()
    edit('{')
    expect(publish).not.toHaveBeenCalled()
    edit('{"components":[{"name":"openssl","version":"1.1.1w"}]}')
    expect(screen.getByRole('status')).toHaveTextContent(
      '1 mapped sample rows; 0 without a catalogue match'
    )
    expect(publish.mock.lastCall![0][0]).toMatchObject({ name: 'openssl', version: '1.1.1w' })
  })
  it('retains saved valid data and blocks pending autosave/unmount publication after invalidation', () => {
    vi.useFakeTimers()
    const view = start()
    edit('{"components":[{"name":"Prior saved sample","version":"1"}]}')
    fireEvent.click(screen.getByRole('button', { name: /^Save/ }))
    const prior = save.mock.lastCall![0].data
    save.mockClear()
    edit('{"components":[{"name":"Pending valid sample","version":"2"}]}')
    edit('{')
    act(() => vi.advanceTimersByTime(1000))
    view.unmount()
    act(() => vi.runOnlyPendingTimers())
    expect(save).not.toHaveBeenCalled()
    expect(prior).toContain('Prior saved sample')
    vi.useRealTimers()
  })
  it('keeps an independent catalogue export available without publishing an invalid SBOM', () => {
    start()
    edit('{')
    publish.mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'Library posture' }))
    fireEvent.click(screen.getByRole('button', { name: 'Download CycloneDX 1.7' }))
    const doc = JSON.parse(vi.mocked(downloadCbomJson).mock.lastCall![0])
    expect(
      doc.components.filter((c: { type: string }) => c.type === 'library').length
    ).toBeGreaterThan(0)
    expect(publish).not.toHaveBeenCalled()
  })
})

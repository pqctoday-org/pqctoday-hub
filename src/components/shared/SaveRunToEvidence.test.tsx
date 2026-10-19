// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { useModuleStore } from '@/store/useModuleStore'
import { buildRunManifest, type RunManifest } from '@/services/runManifest'
import { RunRecordActions } from './RunRecordActions'

const MANIFEST: RunManifest = buildRunManifest(
  {
    tool: { id: 'drbg-demo', title: 'SP 800-90A DRBG', version: '1.0.4' },
    executionMode: 'in-browser-implementation',
    inputs: {},
    cases: [{ id: 'case-1', actual: 'ff'.repeat(1024), expected: 'sha256:aa', pass: true }],
    limitations: ['Not an entropy-source test.'],
    startedAt: '2026-10-16T08:00:00.000Z',
    finishedAt: '2026-10-16T08:00:01.000Z',
  },
  { appVersion: '4.163.0', commit: 'abc', wasmHash: '', buildTimestamp: '' },
  'test'
)

const runDocs = () =>
  (useModuleStore.getState().artifacts.executiveDocuments ?? []).filter(
    (d) => d.type === 'run-manifest'
  )

describe('RunRecordActions: Save to my evidence', () => {
  beforeEach(() => {
    const s = useModuleStore.getState()
    useModuleStore.setState({ artifacts: { ...s.artifacts, executiveDocuments: [] } })
  })

  it('is not offered when the tool does not pass a manifest builder', () => {
    render(<RunRecordActions onDownload={vi.fn()} testId="t" />)
    expect(screen.getByTestId('t-download')).toBeInTheDocument()
    expect(screen.queryByTestId('t-save')).not.toBeInTheDocument()
  })

  it('saves the run as a run-manifest artifact holding digests, then links to the bundle', async () => {
    const getManifest = () => MANIFEST
    render(
      <MemoryRouter>
        <RunRecordActions onDownload={vi.fn()} getManifest={getManifest} testId="t" />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByTestId('t-save'))
    await waitFor(() =>
      expect(screen.getByTestId('t-save')).toHaveTextContent('Saved to my evidence')
    )
    expect(screen.getByTestId('t-save')).toBeDisabled()
    expect(screen.getByTestId('t-bundle-link')).toHaveAttribute('href', '/library?qv=bookmarked')

    const [doc] = runDocs()
    expect(doc.moduleId).toBe('run-manifest:drbg-demo:2026-10-16T08:00:01.000Z')
    const out = doc.output as RunManifest
    expect(out.schema).toBe('pqctoday.run-manifest/2')
    expect(out.cases[0].actual).toMatch(/^sha256:[0-9a-f]{64} \(2048 chars\)$/)
    expect(doc.data).toContain('A vector match is not a CAVP/ACVP validation.')
  })

  it('offers saving again for a new run', async () => {
    const { rerender } = render(
      <RunRecordActions
        onDownload={vi.fn()}
        getManifest={() => MANIFEST}
        runKey="run-1"
        testId="t"
      />
    )
    fireEvent.click(screen.getByTestId('t-save'))
    await waitFor(() =>
      expect(screen.getByTestId('t-save')).toHaveTextContent('Saved to my evidence')
    )
    rerender(
      <RunRecordActions
        onDownload={vi.fn()}
        getManifest={() => MANIFEST}
        runKey="run-2"
        testId="t"
      />
    )
    expect(screen.getByTestId('t-save')).toHaveTextContent('Save to my evidence')
    expect(screen.getByTestId('t-save')).not.toBeDisabled()
  })
})

// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { useModuleStore } from '@/store/useModuleStore'
import { buildRunManifest } from '@/services/runManifest'
import { readReproduction } from '@/services/research/reproductionRecord'
import type { ExecutiveDocument } from '@/services/storage/types'
import { CompareRuns } from './CompareRuns'

const SITE = { appVersion: '4.163.0', commit: 'abc', wasmHash: 'w', buildTimestamp: '' }

const runDoc = (n: number, toolId: string, pass: boolean): ExecutiveDocument => {
  const m = buildRunManifest(
    {
      tool: { id: toolId, title: toolId, version: '1' },
      executionMode: 'in-browser-implementation',
      inputs: {},
      cases: [{ id: 'c1', actual: pass ? 'ok' : 'bad', pass }],
      limitations: ['x'],
      startedAt: `2026-10-1${n}T00:00:00.000Z`,
      finishedAt: `2026-10-1${n}T00:00:01.000Z`,
    },
    SITE,
    'test'
  )
  return {
    id: `r${n}`,
    moduleId: `run-manifest:${toolId}:${n}`,
    type: 'run-manifest',
    title: `${toolId} run ${n}`,
    data: '',
    createdAt: n,
    updatedAt: n,
    output: m,
  }
}

const setDocs = (docs: ExecutiveDocument[]) => {
  const s = useModuleStore.getState()
  useModuleStore.setState({ artifacts: { ...s.artifacts, executiveDocuments: docs } })
}

const wrap = () =>
  render(
    <MemoryRouter>
      <CompareRuns />
    </MemoryRouter>
  )

describe('CompareRuns', () => {
  beforeEach(() => setDocs([]))

  it('asks for two saved runs first', () => {
    setDocs([runDoc(1, 'drbg-demo', true)])
    wrap()
    expect(screen.getByTestId('compare-runs-empty')).toHaveTextContent('you have 1')
  })

  it('compares two runs of the same tool and saves a reproduction record', async () => {
    setDocs([
      runDoc(1, 'drbg-demo', true),
      runDoc(2, 'entropy-test', true),
      runDoc(3, 'drbg-demo', false),
    ])
    wrap()
    fireEvent.click(screen.getByRole('button', { name: /Run A/i }))
    fireEvent.click(await screen.findByRole('option', { name: 'drbg-demo run 1' }))
    fireEvent.click(screen.getByRole('button', { name: /Run B/i }))
    // Only the other DRBG run is offered.
    expect(screen.queryByRole('option', { name: 'entropy-test run 2' })).not.toBeInTheDocument()
    fireEvent.click(await screen.findByRole('option', { name: 'drbg-demo run 3' }))
    expect(screen.getByTestId('compare-runs-result')).toHaveTextContent(
      '1 case difference(s), 0 negative-control difference(s)'
    )
    fireEvent.change(screen.getByLabelText('What would falsify it'), {
      target: { value: 'c1 failing again on a clean build' },
    })
    fireEvent.click(screen.getByTestId('compare-runs-save'))
    fireEvent.click(screen.getByTestId('compare-runs-save'))
    const recs = (useModuleStore.getState().artifacts.executiveDocuments ?? []).filter(
      (d) => d.type === 'reproduction-record'
    )
    expect(recs).toHaveLength(1)
    const r = readReproduction(recs[0])
    expect(r?.falsification).toBe('c1 failing again on a clean build')
    expect(r?.comparison.cases).toEqual([{ id: 'c1', kind: 'result', a: 'PASS', b: 'FAIL' }])
  })
})

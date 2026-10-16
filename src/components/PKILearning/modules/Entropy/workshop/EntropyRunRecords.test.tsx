// SPDX-License-Identifier: AGPL-3.0-only
//
// The "Download run record (JSON)" action on the DRBG, Entropy Testing and
// Source Combining steps: the button exists once there is a result, the
// provenance line is on screen, and the downloaded file is a run manifest.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import type { KATResult } from '@/utils/katRunner'
import { Button } from '@/components/ui/button'

const downloads: { blob: Blob; name: string }[] = []
vi.mock('@/services/exportBundle', async (orig) => ({
  ...(await orig<typeof import('@/services/exportBundle')>()),
  downloadBlob: (blob: Blob, name: string) => downloads.push({ blob, name }),
}))

vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    phase: 'idle',
    error: null,
    moduleRef: { current: null },
    hSessionRef: { current: 0 },
    initialize: () => undefined,
  }),
}))

// The self-check panel needs the WASM HSM; stand in with one that reports a finished run.
vi.mock('@/components/shared/KatValidationPanel', () => ({
  KatValidationPanel: ({
    onComplete,
  }: {
    onComplete?: (r: KATResult[], run: { startedAt: string; finishedAt: string }) => void
  }) => (
    <Button
      onClick={() =>
        onComplete?.(
          [
            {
              id: 'entropy-sha256-empty',
              useCase: 'SHA-256 (empty input)',
              algorithm: 'SHA-256',
              standard: 'FIPS 180-4',
              referenceUrl: 'https://csrc.nist.gov/pubs/fips/180-4/upd1/final',
              status: 'pass',
              details: '1 vector validated',
              evidence: 'nist-sample' as KATResult['evidence'],
            },
          ],
          { startedAt: '2026-10-16T10:00:00.000Z', finishedAt: '2026-10-16T10:00:01.000Z' }
        )
      }
    >
      fake self-check run
    </Button>
  ),
}))

import { DrbgArchitectureDemo } from './DrbgArchitectureDemo'
import { EntropyTestingDemo } from './EntropyTestingDemo'
import { SourceCombiningDemo } from './SourceCombiningDemo'

async function lastDownloadJson() {
  const { blob, name } = downloads[downloads.length - 1]
  return { name, json: JSON.parse(await blob.text()) }
}

beforeEach(() => {
  downloads.length = 0
})

describe('DRBG run record', () => {
  it('shows provenance, then downloads a manifest with 16 cases and 11 negative controls', async () => {
    render(
      <MemoryRouter>
        <DrbgArchitectureDemo />
      </MemoryRouter>
    )
    expect(screen.getByTestId('drbg-provenance')).toHaveTextContent(/Site version .* · commit /)
    fireEvent.click(screen.getByRole('button', { name: /Run known-answer check/ }))
    const btn = await screen.findByTestId('drbg-run-record-download', {}, { timeout: 10000 })
    expect(screen.getByTestId('drbg-run-record-provenance')).toBeInTheDocument()
    fireEvent.click(btn)
    await waitFor(() => expect(downloads).toHaveLength(1))
    const { name, json } = await lastDownloadJson()
    expect(name).toMatch(/^drbg-known-answer-run-\d{4}-\d{2}-\d{2}\.json$/)
    expect(json.schema).toBe('pqctoday.run-manifest/1')
    expect(json.notice).toMatch(/^PQC Today is an educational/)
    expect(json.summary).toEqual({ passed: 16, failed: 0 })
    expect(json.negativeControls).toHaveLength(11)
    expect(json.vectors.count).toBe(16)
  })
})

describe('Entropy Testing run record', () => {
  it('offers the download only after the self-checks ran', async () => {
    render(
      <MemoryRouter>
        <EntropyTestingDemo />
      </MemoryRouter>
    )
    expect(screen.getByTestId('entropy-run-record-provenance')).toBeInTheDocument()
    expect(screen.queryByTestId('entropy-run-record-download')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'fake self-check run' }))
    fireEvent.click(await screen.findByTestId('entropy-run-record-download'))
    const { json } = await lastDownloadJson()
    expect(json.tool.id).toBe('entropy-test')
    expect(json.cases).toEqual([
      expect.objectContaining({ id: 'entropy-sha256-empty', pass: true }),
    ])
    expect(json.limitations[0]).toBe(
      'Primitive self-checks only; not an SP 800-90B entropy estimate.'
    )
  })
})

describe('Source Combining run record', () => {
  it('downloads scenario, sources, checks and the verdict', async () => {
    render(
      <MemoryRouter>
        <SourceCombiningDemo />
      </MemoryRouter>
    )
    expect(screen.queryByTestId('source-combining-run-record-download')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Stuck source, detected' }))
    await screen.findByTestId('construction-verdict')
    fireEvent.click(screen.getByTestId('source-combining-run-record-download'))
    const { name, json } = await lastDownloadJson()
    expect(name).toMatch(/^source-combining-run-/)
    expect(json.executionMode).toBe('simulation')
    expect(json.inputs.scenario).toBe('Counterexample loaded: Stuck source, detected')
    expect(json.inputs.sources[0]).toMatchObject({ name: 'Source A', condition: 'stuck' })
    expect(json.inputs.verdict.label).toBe('Not enough evidence')
    expect(json.cases.length).toBeGreaterThan(0)
    expect(json.limitations.join(' ')).toContain('Not a validation')
  })
})

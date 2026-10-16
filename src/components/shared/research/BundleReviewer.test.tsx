// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { buildZipBundle } from '@/services/exportBundle'
import { buildEvidenceBundle, evidenceBundleFiles } from '@/services/evidenceBundle'
import { buildRunManifest } from '@/services/runManifest'
import { runManifestSaveRequest } from '@/services/runEvidence'
import type { ExecutiveDocument } from '@/services/storage/types'

vi.mock('@/data/libraryData', () => ({ REFERENCE_ID_ALIASES: {}, libraryData: [] }))

import { BundleReviewer } from './BundleReviewer'

describe('BundleReviewer', () => {
  it('opens a bundle zip read-only and lists its runs', async () => {
    const m = buildRunManifest(
      {
        tool: { id: 'drbg-demo', title: 'SP 800-90A DRBG', version: '1' },
        executionMode: 'in-browser-implementation',
        inputs: {},
        cases: [{ id: 'c1', actual: 'aa', pass: true }],
        limitations: ['x'],
        startedAt: '2026-10-16T08:00:00.000Z',
        finishedAt: '2026-10-16T08:00:01.000Z',
      },
      { appVersion: '4.163.0', commit: 'abc', wasmHash: '', buildTimestamp: '' },
      'test'
    )
    const doc = {
      ...(await runManifestSaveRequest(m)),
      id: 'r1',
      createdAt: 1,
    } as ExecutiveDocument
    const bundle = buildEvidenceBundle({ records: [], documents: [doc], title: 'Shared bundle' })
    const zip = await buildZipBundle(evidenceBundleFiles(bundle))
    const file = new File([await zip.arrayBuffer()], 'bundle.zip', { type: 'application/zip' })

    render(
      <MemoryRouter>
        <BundleReviewer />
      </MemoryRouter>
    )
    fireEvent.change(screen.getByTestId('bundle-reviewer-file'), { target: { files: [file] } })
    const result = await screen.findByTestId('bundle-reviewer-result')
    expect(result).toHaveTextContent('Shared bundle — read-only; nothing from this file is saved.')
    expect(result).toHaveTextContent('1 run record · 0 collections')
    expect(result).toHaveTextContent(
      'SP 800-90A DRBG · 2026-10-16T08:00:01.000Z · 1 passed / 0 failed'
    )
    expect(result).toHaveTextContent('A vector match is not a CAVP/ACVP validation.')
  })
})

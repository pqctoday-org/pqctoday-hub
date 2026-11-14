// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { logBusinessToolExport } from '@/utils/analytics'
import { ArchitecturePackPanel } from './ArchitecturePackPanel'

vi.mock('@/utils/analytics', async (orig) => ({
  ...(await orig<typeof import('@/utils/analytics')>()),
  logBusinessToolExport: vi.fn(),
}))
// The pack re-resolves Library references through the full Library on first use.
// Loading it cold can take longer than waitFor's 1 s, so on its own this test failed,
// and passed only after another test had loaded the Library. An empty resolver keeps
// this test about the export event.
vi.mock('@/services/libraryEvidence', async (orig) => {
  const actual = await orig<typeof import('@/services/libraryEvidence')>()
  return { ...actual, loadEvidenceResolver: async () => actual.buildEvidenceResolver([]) }
})
vi.mock('@/services/exportBundle', async (orig) => ({
  ...(await orig<typeof import('@/services/exportBundle')>()),
  downloadBlob: vi.fn(),
}))

describe('ArchitecturePackPanel export', () => {
  beforeEach(() => vi.mocked(logBusinessToolExport).mockClear())

  it('logs one export event when the Markdown pack is downloaded', async () => {
    render(
      <MemoryRouter>
        <ArchitecturePackPanel />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByTestId('architecture-pack-md'))
    await waitFor(() => expect(logBusinessToolExport).toHaveBeenCalledTimes(1))
    expect(logBusinessToolExport).toHaveBeenCalledWith('architecture-pack', 'md')
  })
})

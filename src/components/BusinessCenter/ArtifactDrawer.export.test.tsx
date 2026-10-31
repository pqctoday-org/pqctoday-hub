// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import type { ExecutiveDocument } from '@/services/storage/types'
import { logBusinessToolExport } from '@/utils/analytics'
import { ArtifactDrawer } from './ArtifactDrawer'

vi.mock('@/utils/analytics', async (orig) => ({
  ...(await orig<typeof import('@/utils/analytics')>()),
  logBusinessToolExport: vi.fn(),
}))
vi.mock('@/services/export/pdfExport', () => ({ markdownToPdf: vi.fn(async () => {}) }))

const doc: ExecutiveDocument = {
  id: 'roi-1',
  moduleId: 'roi-calculator',
  type: 'roi-model',
  title: 'ROI model',
  data: '# ROI model\n\nA short body.',
  createdAt: 1_700_000_000_000,
}

const renderDrawer = () =>
  render(
    <MemoryRouter>
      <ArtifactDrawer document={doc} mode="view" onClose={() => {}} onModeChange={() => {}} />
    </MemoryRouter>
  )

describe('ArtifactDrawer exports', () => {
  beforeEach(() => {
    vi.mocked(logBusinessToolExport).mockClear()
    // jsdom has no object URLs; the download itself is not under test.
    URL.createObjectURL = vi.fn(() => 'blob:test')
    URL.revokeObjectURL = vi.fn()
    HTMLAnchorElement.prototype.click = vi.fn()
  })

  it('logs one export, named for the tool that made the artifact, for a Markdown download', () => {
    renderDrawer()
    fireEvent.click(screen.getByRole('button', { name: /markdown/i }))
    expect(logBusinessToolExport).toHaveBeenCalledTimes(1)
    expect(logBusinessToolExport).toHaveBeenCalledWith('roi-calculator', 'md')
  })

  it('logs one export for a PDF download, once the PDF has been produced', async () => {
    renderDrawer()
    fireEvent.click(screen.getByRole('button', { name: /pdf/i }))
    await waitFor(() => expect(logBusinessToolExport).toHaveBeenCalledTimes(1))
    expect(logBusinessToolExport).toHaveBeenCalledWith('roi-calculator', 'pdf')
  })
})

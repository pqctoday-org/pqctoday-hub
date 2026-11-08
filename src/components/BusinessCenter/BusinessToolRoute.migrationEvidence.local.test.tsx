// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BusinessToolRoute } from './BusinessToolRoute'
import { useModuleStore } from '@/store/useModuleStore'
import { useSimulationStore } from '@/store/useSimulationStore'

vi.mock('@/utils/analytics', () => ({
  logBusinessToolOpen: vi.fn(),
  logArtifactGenerated: vi.fn(),
}))

const fields = [
  'Observed negotiation',
  'Negative test',
  'Cert-chain under PQC',
  'Downgrade documented',
  'Evidence in dossier',
]
async function show() {
  render(
    <MemoryRouter initialEntries={['/business/tools/migration-verification']}>
      <Routes>
        <Route path="/business/tools/:toolId" element={<BusinessToolRoute />} />
      </Routes>
    </MemoryRouter>
  )
  await screen.findAllByRole('textbox', { name: 'System' })
}
function fill() {
  for (const [index, name] of ['Fictional service A', 'Fictional service B'].entries()) {
    fireEvent.change(screen.getAllByRole('textbox', { name: 'System' })[index], {
      target: { value: name },
    })
    for (const label of fields.slice(0, index === 0 ? 5 : 3)) {
      fireEvent.change(screen.getAllByRole('textbox', { name: label })[index], {
        target: { value: `Fictional reference: ${name}/${label}` },
      })
    }
  }
}
async function download() {
  let captured: Blob | undefined
  let filename = ''
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL = vi.fn((blob: Blob) => {
        captured = blob
        return 'blob:sample-migration'
      })
      static revokeObjectURL = vi.fn()
    }
  )
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement
  ) {
    filename = this.download
  })
  fireEvent.click(screen.getByRole('button', { name: '.md' }))
  await waitFor(() => expect(captured).toBeDefined())
  expect(filename).toBe('migration-verification.md')
  const text = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(captured!)
  })
  return text
}
beforeEach(() => {
  useModuleStore.getState().resetProgress()
  useSimulationStore.getState().setSector('healthcare')
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('migration reference route and actual educational export', () => {
  it('renders the repaired route introduction, good answer and five-versus-three worked example', async () => {
    await show()
    const intro = screen.getByText('What this is for:').closest('p')!
    const good = screen.getByText('What a good answer looks like:').closest('p')!
    const worked = screen.getByText('Worked example:').closest('p')!
    expect(intro).toHaveTextContent(
      'filling this educational checklist does not verify a migration'
    )
    expect(good).toHaveTextContent('distinguish recorded references from performed tests')
    expect(worked).toHaveTextContent(
      'five sample reference fields in one fictional record and three in another'
    )
    expect(worked).toHaveTextContent('Evidence recorded — review required')
    expect(worked).toHaveTextContent('not successful technical verification')
    expect(worked.textContent).not.toMatch(/\bVerified\b|\bUnverified\b|Prove migration/)
  })

  it('keeps complete and incomplete reference counts distinct in the real worksheet and Markdown bytes', async () => {
    await show()
    fill()
    expect(screen.getByText('Evidence recorded — review required')).toBeInTheDocument()
    expect(screen.getByText('Incomplete evidence 3/5')).toBeInTheDocument()
    expect(screen.getByText(/Export the sample reference entries/)).toHaveTextContent(
      'does not establish that a migration or retirement was performed'
    )
    const markdown = await download()
    expect(markdown).toContain(
      '| Fictional service A | ✓ | ✓ | ✓ | ✓ | ✓ | **Evidence recorded — review required** |'
    )
    expect(markdown).toContain(
      '| Fictional service B | ✓ | ✓ | ✓ | — | — | Incomplete evidence (3/5) |'
    )
    expect(markdown).toContain('1/2 records have all five evidence fields populated')
    expect(markdown).toContain('entering them does not evaluate evidence or verify a deployment')
    expect(markdown).not.toMatch(/\*\*Verified\*\*|Unverified|Prove migration/)
    const documents = useModuleStore.getState().artifacts.executiveDocuments
    expect(documents).toBeDefined()
    const saved = documents!.find((doc) => doc.type === 'migration-verification')
    expect(saved).toBeDefined()
    expect(saved!.data).toContain('entering them does not evaluate evidence or verify a deployment')
  })

  it('removes the complete-reference status when one field is cleared without claiming deployment changed', async () => {
    await show()
    fill()
    fireEvent.change(screen.getAllByRole('textbox', { name: 'Evidence in dossier' })[0], {
      target: { value: '' },
    })
    expect(screen.getByText('Incomplete evidence 4/5')).toBeInTheDocument()
    expect(screen.queryByText('Evidence recorded — review required')).not.toBeInTheDocument()
    const markdown = await download()
    expect(markdown).toContain(
      '| Fictional service A | ✓ | ✓ | ✓ | ✓ | — | Incomplete evidence (4/5) |'
    )
    expect(markdown).toContain('0/2 records have all five evidence fields populated')
    expect(markdown).toContain('entering them does not evaluate evidence or verify a deployment')
  })
})

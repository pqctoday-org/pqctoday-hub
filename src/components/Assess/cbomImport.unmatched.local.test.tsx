// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { parseCbom } from './cbomImport'
import { CbomImportPanel } from './CbomImportPanel'

const unknowns = Array.from(
  { length: 17 },
  (_, i) => `Sample-Unmatched-${String(i + 1).padStart(2, '0')}`
)
const fixture = JSON.stringify({
  bomFormat: 'CycloneDX',
  specVersion: '1.7',
  components: [
    ...unknowns.map((name) => ({ type: 'cryptographic-asset', name })),
    { type: 'cryptographic-asset', name: unknowns[16] },
    { type: 'cryptographic-asset', name: 'ML-KEM-768' },
    { type: 'library', name: 'Not an imported crypto asset' },
  ],
})

describe('CBOM unmatched inventory fidelity', () => {
  it('retains all unique unmatched names beyond twelve and preserves counts and recognized scope', () => {
    const result = parseCbom(fixture, ['ML-KEM-768', 'RSA-2048'])
    expect(result.unrecognised).toEqual(unknowns)
    expect(result.unrecognised).toHaveLength(17)
    expect(result.recognised).toEqual(['ML-KEM-768'])
    expect(result.assetsSeen).toBe(19)
    expect(result.format).toBe('CycloneDX 1.7')
    expect(JSON.parse(JSON.stringify(result)).unrecognised).toEqual(unknowns)
  })

  it('shows every unmatched name in the import summary and applies recognized options only', async () => {
    const onApply = vi.fn()
    render(
      <CbomImportPanel
        options={['ML-KEM-768', 'RSA-2048']}
        selected={['RSA-2048']}
        onApply={onApply}
      />
    )
    const file = new File([fixture], 'sample-unmatched-inventory.json', {
      type: 'application/json',
    })
    // jsdom lacks File.text; supply that browser API without bypassing the
    // component's actual file-input/read/parse/report path.
    Object.defineProperty(file, 'text', { value: async () => fixture })
    fireEvent.change(screen.getByLabelText('Import a CycloneDX CBOM'), {
      target: { files: [file] },
    })
    const summary = await screen.findByText(/Not matched, so not imported:/)
    for (const name of unknowns) expect(summary).toHaveTextContent(name)
    expect(summary).toHaveTextContent(unknowns[16])
    fireEvent.click(screen.getByRole('button', { name: 'Apply 1 to my answer' }))
    expect(onApply).toHaveBeenCalledWith(['ML-KEM-768'])
  })
})

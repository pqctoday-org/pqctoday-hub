// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { KeyHierarchyDesigner, hierarchyMaterial } from './KeyHierarchyDesigner'
describe('sample hierarchy material accounting', () => {
  it.each([
    ['traditional', 'classical', 'classical', 4864, 22356, 43220],
    ['default hybrid', 'hybrid', 'hybrid', 16650, 35352, 68002],
    ['PQC', 'pqc', 'pqc', 14976, 30336, 61312],
    ['mixed', 'classical', 'pqc', 12864, 28696, 57560],
  ] as const)('%s counts AES secrets once', (_name, root, zone, pub, priv, total) => {
    const a = hierarchyMaterial({ 'root-kek': root, 'zone-kek': zone, dek: 'pqc' })!
    expect(a.publicBytes).toBe(pub)
    expect(a.privateBytes).toBe(priv)
    expect(a.secretBytes).toBe(16000)
    expect(a.totalMaterialBytes).toBe(total)
    expect(a.logicalRecords).toBe(512)
  })
  it('distinguishes zero counts from absent profiles and counts', () => {
    expect(hierarchyMaterial({}, { 'root-kek': 0, 'zone-kek': 0, dek: 0 })).toEqual(
      expect.objectContaining({ totalMaterialBytes: 0, publicMultiplier: null, logicalRecords: 0 })
    )
    expect(hierarchyMaterial({ 'root-kek': 'hybrid', dek: 'pqc' })).toBeNull()
    expect(hierarchyMaterial({}, {})).toBeNull()
  })
  it('labels categories and unknown transfer scope after mode changes', () => {
    render(<KeyHierarchyDesigner />)
    expect(screen.getByText(/Symmetric-secret material:/)).toHaveTextContent('16,000 B')
    expect(
      screen.getByText(/Physical object \/ certificate count: Not assessed/)
    ).toBeInTheDocument()
    expect(screen.getByText(/Protected transfer \/ rewrap bytes: Not assessed/)).toBeInTheDocument()
    for (const b of screen.getAllByRole('button', { name: 'Classical' })) fireEvent.click(b)
    expect(screen.getByText(/Symmetric-secret material:/)).toHaveTextContent('16,000 B')
    expect(screen.queryByText('Total Public Keys')).not.toBeInTheDocument()
    expect(screen.queryByText('Rotation Bandwidth Estimate')).not.toBeInTheDocument()
  })
})

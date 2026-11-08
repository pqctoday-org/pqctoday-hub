// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SAMPLE_INVENTORY } from '@/data/cryptoEstate'
import { FormatChooser } from './FormatChooser'

describe('partial CBOM format example identity', () => {
  it('omits unsupplied identifiers for every selectable sample without changing other fields', () => {
    render(<FormatChooser />)
    const samples = SAMPLE_INVENTORY.filter((asset) => asset.spki).slice(0, 4)
    expect(samples.some((asset) => asset.currentAlgorithm.includes('RSA-2048'))).toBe(true)
    expect(samples.some((asset) => asset.currentAlgorithm.includes('RSA-4096'))).toBe(true)
    expect(screen.getByText(/These partial format examples/)).toHaveTextContent(
      'Exact cryptographic identifiers have not been parsed here'
    )
    expect(screen.getByText(/These partial format examples/)).toHaveTextContent(
      'discovery and export tools'
    )
    for (const asset of samples) {
      const selection = screen.getByRole('button', { name: asset.name.split(' ')[0] })
      fireEvent.click(selection)
      expect(selection.className).toContain('border-primary')
      const cdx = screen.getByText((text) => text.startsWith('{') && text.includes('"bom-ref"'))
      const spdx = screen.getByText((text) => text.startsWith('{') && text.includes('"SPDXID"'))
      expect(JSON.parse(cdx.textContent!)).toEqual({
        'bom-ref': asset.id,
        name: asset.name,
        type: 'cryptographic-asset',
        cryptoProperties: {
          assetType: asset.class === 'certificates' ? 'certificate' : 'related-crypto-material',
          algorithmProperties: {
            primitive: /ECDSA|RSA|ML-DSA/.test(asset.currentAlgorithm) ? 'signature' : 'kem',
            parameterSetIdentifier: asset.registryKey ?? asset.currentAlgorithm.split(' / ')[0],
            nistQuantumSecurityLevel: asset.quantumVulnerable ? 0 : 3,
          },
          ...(asset.class === 'certificates'
            ? { certificateProperties: { subjectName: asset.name } }
            : {}),
        },
        properties: [
          { name: 'spkiFingerprint', value: asset.spki },
          { name: 'keyManagement', value: asset.management },
          { name: 'owner', value: asset.owner },
        ],
      })
      expect(JSON.parse(spdx.textContent!)).toEqual({
        SPDXID: `SPDXRef-${asset.id}`,
        name: asset.name,
        comment: `crypto (unstructured): ${asset.currentAlgorithm}`,
        primaryPackagePurpose: 'OTHER',
      })
    }
    expect(screen.getAllByRole('button')).toHaveLength(samples.length)
  })
})

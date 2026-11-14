// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProvenanceSampleLab } from './ProvenanceSampleLab'
import { createHash, createPublicKey, verify } from 'node:crypto'
import {
  PROVENANCE_SAMPLE_FILES,
  PROVENANCE_PUBLIC_KEY_SHA256,
  provenanceFilesForCase,
} from '../data/provenanceSample'

function downloaded(name: string) {
  const href = screen.getByRole('link', { name: `Download ${name}` }).getAttribute('href')!
  return decodeURIComponent(href.slice(href.indexOf(',') + 1))
}

describe('Signed provenance worked sample', () => {
  it('downloads the exact six files exercised by the native verifier', () => {
    render(<ProvenanceSampleLab />)
    const pinned = {
      'artifact.txt': 'edcb6b97a3482bc233b810427c2d0408394bdfc6fb5677aefd4248c321c4dc7b',
      'statement.json': '9621f09753f6369fa25f572460f492d2c136935198aaaab9f99bfd6c0056a6ba',
      'sample.pub': '1f677545f078de476414aad2cdad75ce69bf85f4ecb498903867dfc9c9d475f5',
      'sample.bundle.json': '8b7ed38103b41844d4f8bf0207f144abf2b9d746320573781131630e6fc535e0',
      'sample-policy.rego': 'fc9cc2159bd6a6ff79e4cde3521912d4ece78de623b88c44b89c9d50b30260a3',
      'verify-sample.py': '7e87724ce0f933cbfaedc09a934bc52824015150f0e982f39653cdb299130948',
    }
    for (const [name, digest] of Object.entries(pinned)) {
      expect(createHash('sha256').update(downloaded(name)).digest('hex')).toBe(digest)
    }
  })
  it('has a valid pinned P-256 signature and rejects a changed statement with an independent verifier', () => {
    const files = PROVENANCE_SAMPLE_FILES
    const bundle = JSON.parse(files['sample.bundle.json'])
    const signature = Buffer.from(bundle.messageSignature.signature, 'base64')
    const key = createPublicKey(files['sample.pub'])
    expect(key.asymmetricKeyDetails?.namedCurve).toBe('prime256v1')
    expect(createHash('sha256').update(files['sample.pub']).digest('hex')).toBe(
      PROVENANCE_PUBLIC_KEY_SHA256
    )
    expect(verify('sha256', Buffer.from(files['statement.json']), key, signature)).toBe(true)
    expect(
      verify(
        'sha256',
        Buffer.from(provenanceFilesForCase('changed-statement')['statement.json']),
        key,
        signature
      )
    ).toBe(false)
    const statement = JSON.parse(files['statement.json'])
    expect(statement.subject[0].digest.sha256).toBe(
      createHash('sha256').update(files['artifact.txt']).digest('hex')
    )
    expect(statement.subject[0].digest.sha256).not.toBe(
      createHash('sha256')
        .update(provenanceFilesForCase('changed-artifact')['artifact.txt'])
        .digest('hex')
    )
  })
  it('downloads the selected bytes while keeping the signed bundle and trusted verifier unchanged', () => {
    render(<ProvenanceSampleLab />)
    expect(downloaded('artifact.txt')).toBe(PROVENANCE_SAMPLE_FILES['artifact.txt'])
    fireEvent.click(screen.getByRole('button', { name: 'Provenance test case:' }))
    fireEvent.click(screen.getByRole('option', { name: 'Artifact changed after signing' }))
    expect(downloaded('artifact.txt')).not.toBe(PROVENANCE_SAMPLE_FILES['artifact.txt'])
    expect(downloaded('verify-sample.py')).toBe(PROVENANCE_SAMPLE_FILES['verify-sample.py'])
    expect(downloaded('sample.bundle.json')).toBe(PROVENANCE_SAMPLE_FILES['sample.bundle.json'])
    expect(screen.getByText(/rejected by artifact-digest policy/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Provenance test case:' }))
    fireEvent.click(screen.getByRole('option', { name: 'Trusted signed sample' }))
    expect(downloaded('artifact.txt')).toBe(PROVENANCE_SAMPLE_FILES['artifact.txt'])
  })
})

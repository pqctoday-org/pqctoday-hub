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

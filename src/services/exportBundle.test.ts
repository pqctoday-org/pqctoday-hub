// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import JSZip from 'jszip'
import { buildZipBundle, bundleFilename, downloadBlob } from './exportBundle'

describe('exportBundle', () => {
  it('zips files with their folder structure and content intact', async () => {
    const blob = await buildZipBundle([
      { path: 'pack/README.md', content: '# Hello' },
      { path: 'pack/data/rows.csv', content: 'a,b\n1,2\n' },
    ])
    const zip = await JSZip.loadAsync(await blob.arrayBuffer())
    expect(await zip.file('pack/README.md')!.async('string')).toBe('# Hello')
    expect(await zip.file('pack/data/rows.csv')!.async('string')).toBe('a,b\n1,2\n')
    // No NOTICE.md was given, so the education notice is added in the top folder.
    expect(await zip.file('pack/NOTICE.md')!.async('string')).toContain('Status notice')
  })

  it("keeps the bundle's own NOTICE.md instead of adding a second one", async () => {
    const blob = await buildZipBundle([
      { path: 'pack/NOTICE.md', content: 'own notice' },
      { path: 'pack/a.md', content: 'a' },
    ])
    const zip = await JSZip.loadAsync(await blob.arrayBuffer())
    expect(await zip.file('pack/NOTICE.md')!.async('string')).toBe('own notice')
  })

  it('names JSON and BibTeX files too', () => {
    expect(bundleFilename('drbg run record', 'json', '2026-10-16')).toBe(
      'drbg-run-record-2026-10-16.json'
    )
    expect(bundleFilename('PQC Library citations', 'bib', '2026-10-16')).toBe(
      'pqc-library-citations-2026-10-16.bib'
    )
  })

  it('names files {slug}-{date}.{ext}', () => {
    expect(bundleFilename('Engineering Migration Plan', 'md', '2026-10-16')).toBe(
      'engineering-migration-plan-2026-10-16.md'
    )
    expect(bundleFilename('  Architecture pack!  ', 'pdf', '2026-10-16')).toBe(
      'architecture-pack-2026-10-16.pdf'
    )
    expect(bundleFilename('***', 'zip', '2026-10-16')).toBe('export-2026-10-16.zip')
    expect(bundleFilename('TLS demo run', 'json', '2026-10-16')).toBe(
      'tls-demo-run-2026-10-16.json'
    )
  })

  it('downloads through a temporary object URL and releases it', () => {
    const create = vi.fn(() => 'blob:x')
    const revoke = vi.fn()
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    downloadBlob(new Blob(['x']), 'f.txt')
    expect(create).toHaveBeenCalledOnce()
    expect(click).toHaveBeenCalledOnce()
    expect(revoke).toHaveBeenCalledWith('blob:x')
    click.mockRestore()
  })
})

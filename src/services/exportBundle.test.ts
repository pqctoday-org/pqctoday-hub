// SPDX-License-Identifier: GPL-3.0-only
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

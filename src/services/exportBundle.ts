// SPDX-License-Identifier: GPL-3.0-only
/**
 * Shared helpers for client-side downloads: zip a set of generated files,
 * hand a Blob to the browser as a download, and name it consistently.
 *
 * Every export on the site (board pack, architecture pack, engineering
 * migration plan) builds its own file contents and uses these three helpers
 * for the mechanics, so the download behaviour is the same everywhere.
 * CSV content is built with `generateCsv` from `@/utils/csvExport`.
 */
import JSZip from 'jszip'
import { EDUCATION_NOTICE } from '@/data/educationNotice'

export interface BundleFile {
  /** Path inside the archive, e.g. `board-pack/README.md`. Folders are created as needed. */
  path: string
  content: string | Blob
}

/** The status notice added to a bundle that does not carry its own NOTICE.md. */
export const BUNDLE_NOTICE_MD = `# Status notice\n\n${EDUCATION_NOTICE}\n`

/**
 * Zip the given files into one Blob. Paths keep their folder structure.
 * Every bundle leaves the site with the education notice: if no file is named
 * NOTICE.md, one is added next to the first file (inside its top folder).
 */
export async function buildZipBundle(files: BundleFile[]): Promise<Blob> {
  const zip = new JSZip()
  for (const { path, content } of files) {
    zip.file(path, content)
  }
  const hasNotice = files.some((f) => /(^|\/)NOTICE\.md$/.test(f.path))
  if (!hasNotice && files.length > 0) {
    const first = files[0].path
    const folder = first.includes('/') ? first.slice(0, first.indexOf('/') + 1) : ''
    zip.file(`${folder}NOTICE.md`, BUNDLE_NOTICE_MD)
  }
  return zip.generateAsync({ type: 'blob' })
}

/**
 * Hand a Blob to the browser as a file download. Call it from a user action;
 * it does nothing useful outside a browser.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export type BundleExtension = 'zip' | 'md' | 'csv' | 'pdf' | 'json'

/**
 * `{prefix}-YYYY-MM-DD.{ext}`, with the prefix reduced to lowercase letters,
 * digits and single hyphens. `date` defaults to today (UTC).
 */
export function bundleFilename(
  prefix: string,
  ext: BundleExtension,
  date: string = new Date().toISOString().slice(0, 10)
): string {
  const slug =
    prefix
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'export'
  return `${slug}-${date}.${ext}`
}

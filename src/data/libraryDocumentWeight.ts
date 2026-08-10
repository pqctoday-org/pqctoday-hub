// SPDX-License-Identifier: GPL-3.0-only
/**
 * "How long is this, and what does it settle?" — B+ remediation 3.3 (2026-08-10).
 *
 * The Library listed documents with no sense of scale: "today a reader must
 * open a sixty-page PDF to discover whether it was relevant". This module
 * supplies the scale half, from the download manifests the build already ships
 * (`public/<source>/manifest.json`, each entry carrying `sizeBytes` and
 * `contentType`).
 *
 * A deliberate non-decision worth recording: the handoff asked for a PAGE
 * COUNT. We do not have one. Page counts are not in the manifest, and deriving
 * them from PDF byte size is a guess that varies by an order of magnitude with
 * embedded fonts and figures — a fabricated "≈ 62 pages" is exactly the kind of
 * unciteable number the rest of this program is removing. So this reports what
 * is actually recorded (format and size) and turns it into an honest reading
 * weight, which serves the reader's real question — "is this a two-minute skim
 * or an afternoon?" — without inventing a figure.
 *
 * The "what this settles" half needs no new authoring: `short_description` is
 * already populated for ~90% of active library rows and already reads as
 * exactly that sentence. It simply was not rendered in the row.
 */

interface ManifestEntry {
  refId: string
  filename?: string
  sizeBytes?: number
  contentType?: string
  status?: string
}

export type ReadingWeight = 'skim' | 'short' | 'long' | 'reference'

export interface DocumentWeight {
  /** e.g. 'PDF' | 'Web page'. */
  format: string
  /** Human size, e.g. '2.5 MB'. Empty when the manifest has no size. */
  sizeLabel: string
  weight: ReadingWeight
  /** The one-line label for the row, e.g. 'PDF · 2.5 MB · a long read'. */
  label: string
}

const WEIGHT_WORDS: Record<ReadingWeight, string> = {
  skim: 'a quick skim',
  short: 'a short read',
  long: 'a long read',
  reference: 'a reference document — dip in, don’t read it through',
}

// Thresholds are on the SOURCE BYTES of the fetched document, which is the only
// size we actually hold. They are calibrated against the corpus rather than
// picked from nowhere: the median library HTML capture is tens of KB, while the
// standards PDFs (FIPS 140-3 IG at 2.5 MB, the NIST SPs) sit in the megabytes.
const PDF_LONG_BYTES = 1_500_000
const PDF_SHORT_BYTES = 400_000
const HTML_LONG_BYTES = 150_000
const HTML_SHORT_BYTES = 40_000

function humanSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`
  if (bytes >= 1_000) return `${Math.round(bytes / 1_000)} KB`
  return `${bytes} B`
}

const manifestModules = import.meta.glob<{ entries?: ManifestEntry[] }>(
  [
    '/public/library/manifest.json',
    '/public/timeline/manifest.json',
    '/public/threats/manifest.json',
  ],
  { eager: true, import: 'default' }
)

/** refId → manifest entry, across every source that ships a manifest. */
const ENTRY_BY_REF: Map<string, ManifestEntry> = (() => {
  const map = new Map<string, ManifestEntry>()
  for (const manifest of Object.values(manifestModules)) {
    for (const entry of manifest?.entries ?? []) {
      // A failed download has a size of 0 or none; skip it so a broken fetch
      // never renders as "a quick skim".
      if (entry.status && entry.status !== 'downloaded') continue
      if (!entry.sizeBytes) continue
      map.set(entry.refId, entry)
    }
  }
  return map
})()

/**
 * The reading-weight line for a library/timeline/threats reference, or `null`
 * when we hold no downloaded copy — in which case the row says nothing about
 * length, rather than guessing.
 */
export function documentWeight(refId: string): DocumentWeight | null {
  const entry = ENTRY_BY_REF.get(refId)
  if (!entry?.sizeBytes) return null

  const isPdf =
    entry.contentType?.includes('pdf') || entry.filename?.toLowerCase().endsWith('.pdf') || false
  const format = isPdf ? 'PDF' : 'Web page'
  const bytes = entry.sizeBytes

  let weight: ReadingWeight
  if (isPdf) {
    weight = bytes >= PDF_LONG_BYTES ? 'reference' : bytes >= PDF_SHORT_BYTES ? 'long' : 'short'
  } else {
    weight = bytes >= HTML_LONG_BYTES ? 'long' : bytes >= HTML_SHORT_BYTES ? 'short' : 'skim'
  }

  const sizeLabel = humanSize(bytes)
  return {
    format,
    sizeLabel,
    weight,
    label: `${format} · ${sizeLabel} · ${WEIGHT_WORDS[weight]}`,
  }
}

/** How many references we can report a weight for — used by the row component's
 *  test to catch a manifest path change that would silently blank every row. */
export function documentWeightCoverage(): number {
  return ENTRY_BY_REF.size
}

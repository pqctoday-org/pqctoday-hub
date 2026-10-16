// SPDX-License-Identifier: GPL-3.0-only
/**
 * Read-only re-import of an evidence bundle zip, for a reviewer: the run
 * records (`runs/*.json`), the collections with their saved and current
 * state at bundle time (`collections.json`), and the research question,
 * claim matrices and reproduction records (`research.json`). Nothing is
 * written to the artifact store. Everything runs in the browser.
 */
import JSZip from 'jszip'
import { RUN_MANIFEST_SCHEMA, type RunManifest } from '@/services/runManifest'
import {
  COLLECTIONS_JSON_SCHEMA,
  RESEARCH_JSON_SCHEMA,
  type BundleCollection,
  type CollectionsFile,
  type ResearchFile,
} from './bundleSections'

export { asLibraryCollection } from './bundleSections'

/** Larger files are skipped: a bundle holds digests, not vectors. */
const MAX_FILE_BYTES = 5 * 1024 * 1024

export interface ImportedBundle {
  /** The bundle's own title (first heading of bundle.md), when present. */
  title: string | null
  runs: { path: string; manifest: RunManifest }[]
  collections: BundleCollection[]
  /** When collections.json was written, and whether it checked the Library then. */
  collectionsGenerated: string | null
  checkedAgainstLibrary: boolean
  research: Pick<ResearchFile, 'questions' | 'claimMatrices' | 'reproductions'> | null
  /** Files that could not be read, in plain words. */
  problems: string[]
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)

/** A run record file, or null when it is not one. */
export function parseRunFile(text: string): RunManifest | null {
  const v: unknown = JSON.parse(text)
  if (
    !isObject(v) ||
    v.schema !== RUN_MANIFEST_SCHEMA ||
    !isObject(v.tool) ||
    !Array.isArray(v.cases)
  ) {
    return null
  }
  // Drop the leading education notice; the rest is the manifest.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { notice: _notice, ...manifest } = v
  return manifest as unknown as RunManifest
}

export function parseCollectionsFile(text: string): CollectionsFile | null {
  const v: unknown = JSON.parse(text)
  if (!isObject(v) || v.schema !== COLLECTIONS_JSON_SCHEMA || !Array.isArray(v.collections)) {
    return null
  }
  return v as unknown as CollectionsFile
}

export function parseResearchFile(text: string): ResearchFile | null {
  const v: unknown = JSON.parse(text)
  if (!isObject(v) || v.schema !== RESEARCH_JSON_SCHEMA) return null
  return {
    ...(v as unknown as ResearchFile),
    questions: Array.isArray(v.questions) ? (v.questions as ResearchFile['questions']) : [],
    claimMatrices: Array.isArray(v.claimMatrices)
      ? (v.claimMatrices as ResearchFile['claimMatrices'])
      : [],
    reproductions: Array.isArray(v.reproductions)
      ? (v.reproductions as ResearchFile['reproductions'])
      : [],
  }
}

export async function readEvidenceBundleZip(
  data: Blob | ArrayBuffer | Uint8Array
): Promise<ImportedBundle> {
  const zip = await JSZip.loadAsync(data)
  const out: ImportedBundle = {
    title: null,
    runs: [],
    collections: [],
    collectionsGenerated: null,
    checkedAgainstLibrary: false,
    research: null,
    problems: [],
  }
  const files = Object.values(zip.files).filter((f) => !f.dir)
  const read = async (f: JSZip.JSZipObject): Promise<string | null> => {
    const bytes = await f.async('uint8array')
    if (bytes.byteLength > MAX_FILE_BYTES) {
      out.problems.push(`${f.name} is larger than 5 MB and was skipped.`)
      return null
    }
    return new TextDecoder().decode(bytes)
  }
  const tryParse = async <T>(
    f: JSZip.JSZipObject,
    parse: (t: string) => T | null,
    what: string
  ) => {
    const text = await read(f)
    if (text === null) return null
    try {
      const v = parse(text)
      if (v === null) out.problems.push(`${f.name} is not ${what}.`)
      return v
    } catch {
      out.problems.push(`${f.name} is not valid JSON.`)
      return null
    }
  }

  for (const f of files.sort((a, b) => a.name.localeCompare(b.name))) {
    const name = f.name
    if (/(^|\/)runs\/[^/]+\.json$/.test(name)) {
      const m = await tryParse(f, parseRunFile, 'a PQC Today run record')
      if (m) out.runs.push({ path: name.replace(/^.*?(runs\/)/, '$1'), manifest: m })
    } else if (/(^|\/)collections\.json$/.test(name)) {
      const c = await tryParse(
        f,
        parseCollectionsFile,
        'a collections file from an evidence bundle'
      )
      if (c) {
        out.collections = c.collections
        out.collectionsGenerated = c.generated ?? null
        out.checkedAgainstLibrary = !!c.checkedAgainstLibrary
      }
    } else if (/(^|\/)research\.json$/.test(name)) {
      const r = await tryParse(f, parseResearchFile, 'a research file from an evidence bundle')
      if (r) {
        out.research = {
          questions: r.questions,
          claimMatrices: r.claimMatrices,
          reproductions: r.reproductions,
        }
      }
    } else if (/(^|\/)bundle\.md$/.test(name)) {
      const text = await read(f)
      // The bundle's title is its first `# ` heading (the notice above it is bold text).
      const m = text ? /^# (.+)$/m.exec(text) : null
      out.title = m ? m[1].trim() : null
    }
  }
  if (out.runs.length === 0 && out.collections.length === 0 && !out.research) {
    out.problems.push('No run records, collections or research notes were found in this zip.')
  }
  return out
}

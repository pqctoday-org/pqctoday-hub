// SPDX-License-Identifier: GPL-3.0-only
/**
 * The researcher's evidence bundle (Layer 1): one zip that ties together the
 * Library records a researcher bookmarked, their citations, every run record
 * they saved to "my evidence", a methods-and-limitations section and a list of
 * what is still missing, each gap linked to the tool that fills it.
 *
 * The bundle is the researcher recipe on the shared role-pack builder
 * (`rolePack.ts`): saved run records are the recipe's artifact section, and
 * the Library records, references and methods are extra sections. Files are
 * zipped with `exportBundle.ts`. Everything is built in the browser.
 *
 * It is the user's own working record, not a PQC Today assessment or a
 * validation; the cover and every run section say so.
 *
 * Design note: pqctoday-plan, researcher-evidence-workspace-design-note §3.
 */
import type { ExecutiveDocument } from '@/services/storage/types'
import type { LibraryItem } from '@/data/libraryData'
import { EVIDENCE_BUNDLE_LINK, FIRST_RUN_TOOL, RUN_TOOLS } from '@/data/runTools'
import { toBibtex, toCslJson, citationKeys, type CitableItem } from '@/utils/citationExport'
import { generateCsv } from '@/utils/csvExport'
import type { BundleFile } from './exportBundle'
import { recordRevision, recordsForBookmarks } from './research/libraryCollection'
import { siteBuildInfo, type RunManifest } from './runManifest'
import { cell, readRunManifest, VECTOR_MATCH_SENTENCE } from './runEvidence'
import { runManifestToJson, siteProvenanceLine } from './runRecordExport'
import {
  buildRolePack,
  type RolePack,
  type RolePackExtraMissing,
  type RolePackExtraSection,
  type RolePackRecipe,
} from './rolePack'

export const EVIDENCE_BUNDLE_TITLE = 'Evidence bundle'

/** Where the bundle can be downloaded: the Library's bookmarks view (every
 * role) and the researcher's Command Center. */
export const EVIDENCE_BUNDLE_LIBRARY_PATH = EVIDENCE_BUNDLE_LINK
export const EVIDENCE_BUNDLE_PANEL_PATH = '/business#evidence-bundle'

export const EVIDENCE_BUNDLE_STATEMENT =
  'This is your own working record, not a PQC Today assessment or a validation.'

export const EVIDENCE_BUNDLE_DISCLAIMER =
  `${EVIDENCE_BUNDLE_STATEMENT} It was built in your browser from the Library records you ` +
  'bookmarked and the run records you saved on PQC Today; nothing was uploaded, and nobody else ' +
  'has reviewed it.'

const RUN_TOOL_NAMES = RUN_TOOLS.map((t) => t.title).join(', ')

export const EVIDENCE_BUNDLE_RECIPE: RolePackRecipe = {
  title: EVIDENCE_BUNDLE_TITLE,
  disclaimer: EVIDENCE_BUNDLE_DISCLAIMER,
  sections: [
    {
      type: 'run-manifest',
      purpose: `Reproductions you ran and saved to your evidence (from: ${RUN_TOOL_NAMES}), each with how it ran, its results and what it does not show.`,
      multiple: true,
      toolPath: FIRST_RUN_TOOL.path,
    },
  ],
}

// ── Library records ────────────────────────────────────────────────────────

/** The Library fields the bundle uses. */
export type EvidenceRecord = CitableItem &
  Pick<LibraryItem, 'lastUpdateDate'> &
  Partial<Pick<LibraryItem, 'supersededByRefs'>>

/** A record's revision (draft number or last update date); shared with collections. */
export { recordRevision, recordsForBookmarks }

const supersededBy = (r: EvidenceRecord) => (r.supersededByRefs ?? []).join('; ')

const lastVerified = (r: EvidenceRecord) => r.lastVerified?.trim() || 'not re-verified'

export function recordsTableMarkdown(records: EvidenceRecord[]): string {
  return [
    '| Id | Title | Revision | Lifecycle | Superseded by | Last verified | URL |',
    '|---|---|---|---|---|---|---|',
    ...records.map(
      (r) =>
        `| ${cell(r.referenceId)} | ${cell(r.documentTitle)} | ${cell(recordRevision(r))} | ${cell(r.lifecycleLabel)} | ${cell(supersededBy(r)) || '—'} | ${cell(lastVerified(r))} | ${cell(r.downloadUrl) || '—'} |`
    ),
  ].join('\n')
}

/** records.csv: the same columns as the table, plus the document status. */
export function recordsCsv(records: EvidenceRecord[]): string {
  return generateCsv(records, [
    { header: 'Reference ID', accessor: (r) => r.referenceId },
    { header: 'Title', accessor: (r) => r.documentTitle },
    { header: 'Revision', accessor: (r) => recordRevision(r) },
    { header: 'Lifecycle', accessor: (r) => r.lifecycleLabel },
    { header: 'Status', accessor: (r) => r.documentStatus },
    { header: 'Superseded by', accessor: (r) => supersededBy(r) },
    { header: 'Last verified', accessor: (r) => r.lastVerified ?? '' },
    { header: 'URL', accessor: (r) => r.downloadUrl },
  ])
}

// ── The bundle ─────────────────────────────────────────────────────────────

export interface EvidenceBundleInput {
  /** Bookmarked Library records, in bookmark order. */
  records: EvidenceRecord[]
  /** Bookmarked ids that are no longer in the Library. */
  missingBookmarkIds?: string[]
  /** The artifact store; only saved run records are used. */
  documents: ExecutiveDocument[]
  title?: string
  author?: string
  origin?: string
  site?: RunManifest['site']
  now?: Date
}

export interface EvidenceBundleRun {
  doc: ExecutiveDocument
  manifest: RunManifest
  /** Path inside the zip, e.g. `runs/drbg-demo-1.json`. */
  path: string
}

export interface EvidenceBundle {
  markdown: string
  pack: RolePack
  records: EvidenceRecord[]
  runs: EvidenceBundleRun[]
  /** Every gap listed under "What is missing". */
  missing: RolePackExtraMissing[]
}

const updatedAt = (d: ExecutiveDocument) => d.updatedAt ?? d.createdAt

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'run'

/** Saved run records, oldest first (the pack's order), each with its zip path. */
export function savedRuns(documents: ExecutiveDocument[]): EvidenceBundleRun[] {
  const counts = new Map<string, number>()
  return documents
    .filter((d) => d.type === 'run-manifest')
    .sort((a, b) => updatedAt(a) - updatedAt(b))
    .flatMap((doc) => {
      const manifest = readRunManifest(doc)
      if (!manifest) return []
      const tool = slug(manifest.tool.id)
      const n = (counts.get(tool) ?? 0) + 1
      counts.set(tool, n)
      return [{ doc, manifest, path: `runs/${tool}-${n}.json` }]
    })
}

const METHODS = [
  'Built in your browser from the Library records you bookmarked and the run records you saved to your evidence. Nothing was uploaded.',
  'Library records show their state on the bundle date (revision, lifecycle, superseded-by, last verified), not the state when you bookmarked them. Check the URL for the current document before citing it.',
  '"Last verified" is the date the Library last checked the record against its source document; "not re-verified" means it has not been re-checked since it was added.',
  'Run records hold digests and per-case results, not the test vectors. The pinned vector file is linked from each record so the run can be repeated.',
  `${VECTOR_MATCH_SENTENCE} A run shows that the code on this site produced these results for these inputs on the build named in the record, and nothing more.`,
  'PQC Today does not mint persistent identifiers. To cite this bundle, deposit it under your own name (for example on Zenodo).',
]

export function buildEvidenceBundle(input: EvidenceBundleInput): EvidenceBundle {
  const now = input.now ?? new Date()
  const site = input.site ?? siteBuildInfo()
  const records = input.records
  const runs = savedRuns(input.documents)
  const keys = citationKeys(records.map((r) => r.referenceId))

  const extraSections: RolePackExtraSection[] = [
    {
      key: 'records',
      title: 'Bookmarked Library records',
      purpose:
        'The documents you bookmarked, with their current revision, lifecycle, successor and last-verified date.',
      position: 'before',
      body: records.length
        ? `${records.length} record${records.length === 1 ? '' : 's'}, in the order you bookmarked them. Also in records.csv.\n\n${recordsTableMarkdown(records)}`
        : '',
      toolPath: '/library',
      linkText: 'Bookmark records in the Library at',
    },
    {
      key: 'references',
      title: 'References',
      purpose: 'Citations for the bookmarked records, as BibTeX and CSL-JSON.',
      position: 'before',
      body: records.length
        ? `references.bib and references.csl.json hold ${records.length} entr${records.length === 1 ? 'y' : 'ies'}, one per bookmarked record. Citation keys: ${keys.map((k) => `\`${k}\``).join(', ')}.`
        : '',
      toolPath: '/library',
      linkText: 'Bookmark records in the Library at',
    },
    {
      key: 'methods',
      title: 'Methods and limitations',
      purpose: 'How this bundle was made and what it does not show.',
      position: 'after',
      body: METHODS.map((m) => `- ${m}`).join('\n'),
    },
  ]

  const extraMissing: RolePackExtraMissing[] = []
  const superseded = records.filter((r) => (r.supersededByRefs ?? []).length > 0)
  if (superseded.length) {
    extraMissing.push({
      label: `${superseded.length} bookmarked record${superseded.length === 1 ? ' is' : 's are'} superseded`,
      detail: `${superseded.map((r) => r.referenceId).join(', ')}: check whether the newer document changes what you cite.`,
      toolPath: '/revisions',
      linkText: 'See the revision history at',
    })
  }
  const missingIds = input.missingBookmarkIds ?? []
  if (missingIds.length) {
    extraMissing.push({
      label: `${missingIds.length} bookmark${missingIds.length === 1 ? ' is' : 's are'} no longer in the Library`,
      detail: `${missingIds.join(', ')}: these records were removed or renamed and are not in this bundle.`,
      toolPath: '/library',
      linkText: 'Find them again in',
    })
  }
  if (runs.length && !runs.some((r) => (r.manifest.negativeControls ?? []).length > 0)) {
    extraMissing.push({
      label: 'No negative control saved',
      detail:
        'None of your saved runs includes a negative control (a changed input that must fail).',
      toolPath: FIRST_RUN_TOOL.path,
      linkText: `Run one with the ${FIRST_RUN_TOOL.title} known-answer check at`,
    })
  }

  const pack = buildRolePack(EVIDENCE_BUNDLE_RECIPE, {
    documents: runs.map((r) => r.doc),
    title: input.title,
    author: input.author,
    scope: 'Your bookmarked Library records and the run records you saved',
    origin: input.origin,
    now,
    coverLines: [`- ${siteProvenanceLine(site)}`, '', `**${EVIDENCE_BUNDLE_STATEMENT}**`],
    extraSections,
    extraMissing,
    // Each run section is the saved record's own text, with its file named.
    renderDocument: (doc) => {
      const run = runs.find((r) => r.doc.id === doc.id)
      return run ? `${doc.data.trim()}\n\nFull record: \`${run.path}\`` : undefined
    },
  })

  return {
    markdown: pack.markdown,
    pack,
    records,
    runs,
    missing: [
      ...pack.missing.map((m) => ({
        label: m.label,
        detail: EVIDENCE_BUNDLE_RECIPE.sections.find((s) => s.type === m.type)?.purpose ?? '',
        toolPath: m.toolPath,
      })),
      ...pack.extraMissing,
    ],
  }
}

const README = `# Evidence bundle

- bundle.md: the bundle, in order: cover, bookmarked Library records, references, saved run records, methods and limitations, and what is missing.
- bundle.pdf: the same document as a PDF.
- references.bib and references.csl.json: citations for the bookmarked records.
- records.csv: the bookmarked records as a table.
- runs/: each saved run record as JSON (digests and per-case results, not the vectors).

${EVIDENCE_BUNDLE_DISCLAIMER}
`

/** The files inside the evidence bundle zip, under `evidence-bundle/`. The
 * PDF is rendered by the caller (it needs the PDF library). */
export function evidenceBundleFiles(
  bundle: EvidenceBundle,
  opts: { pdf?: Blob; today?: string } = {}
): BundleFile[] {
  const today = opts.today ?? new Date().toISOString().slice(0, 10)
  const dir = 'evidence-bundle'
  return [
    { path: `${dir}/README.md`, content: README },
    { path: `${dir}/bundle.md`, content: bundle.markdown },
    ...(opts.pdf ? [{ path: `${dir}/bundle.pdf`, content: opts.pdf }] : []),
    { path: `${dir}/references.bib`, content: toBibtex(bundle.records, today) },
    {
      path: `${dir}/references.csl.json`,
      content: `${JSON.stringify(toCslJson(bundle.records), null, 2)}\n`,
    },
    { path: `${dir}/records.csv`, content: `${recordsCsv(bundle.records)}\n` },
    ...bundle.runs.map((r) => ({
      path: `${dir}/${r.path}`,
      content: runManifestToJson(r.manifest),
    })),
  ]
}

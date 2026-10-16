// SPDX-License-Identifier: AGPL-3.0-only
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
import { RESEARCH_WORKSPACE_PATH } from '@/data/researchWorkspace'
import type { LibraryIndex } from './research/collectionChanges'
import {
  bundleCollections,
  collectionSectionMarkdown,
  collectionsJson,
  questionsSectionMarkdown,
  researchJson,
  savedClaimMatrices,
  savedQuestions,
  savedReproductions,
  type BundleCollection,
  type SavedOf,
} from './research/bundleSections'
import type { ResearchQuestion } from './research/researchQuestion'
import type { ClaimMatrix } from './research/claimMatrix'
import type { ReproductionRecord } from './research/reproductionRecord'
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
  `${EVIDENCE_BUNDLE_STATEMENT} It was built in your browser from the Library records, research ` +
  'notes and run records you saved on PQC Today; nothing was uploaded, and nobody else has ' +
  'reviewed it.'

const RUN_TOOL_NAMES = RUN_TOOLS.map((t) => t.title).join(', ')

export const EVIDENCE_BUNDLE_RECIPE: RolePackRecipe = {
  title: EVIDENCE_BUNDLE_TITLE,
  disclaimer: EVIDENCE_BUNDLE_DISCLAIMER,
  sections: [
    {
      type: 'library-collection',
      purpose:
        'Your named collections of Library records, each record with your annotation, its current state and, where it differs, the state you saved it in.',
      multiple: true,
      toolPath: RESEARCH_WORKSPACE_PATH,
    },
    {
      type: 'claim-matrix',
      purpose:
        'Your atomic claims, each with the status you gave it, the Library records for and against it, your confidence rationale and open questions.',
      multiple: true,
      toolPath: RESEARCH_WORKSPACE_PATH,
    },
    {
      type: 'run-manifest',
      purpose: `Reproductions you ran and saved to your evidence (from: ${RUN_TOOL_NAMES}), each with how it ran, its results and what it does not show.`,
      multiple: true,
      toolPath: FIRST_RUN_TOOL.path,
    },
    {
      type: 'reproduction-record',
      purpose:
        'Two saved runs of the same tool compared: what differed, a second implementation where you have one, your conclusion and what would falsify it.',
      multiple: true,
      toolPath: RESEARCH_WORKSPACE_PATH,
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
  /** The current Library, to show each collection record's current state and
   * what changed since it was saved. Without it, saved state only. */
  libraryIndex?: LibraryIndex
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
  questions: SavedOf<ResearchQuestion>[]
  collections: BundleCollection[]
  claimMatrices: SavedOf<ClaimMatrix>[]
  reproductions: SavedOf<ReproductionRecord>[]
  /** Whether collection records were checked against the current Library. */
  libraryChecked: boolean
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
  'Bookmarked Library records show their state on the bundle date (revision, lifecycle, superseded-by, last verified). Collection records show that state and, where it differs, the state you saved them in. Check the URL for the current document before citing it.',
  'Claim statuses (fact, estimate, scenario, recommendation) are set by the author, not by PQC Today. The site checks only that each fact cites at least one Library record.',
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

  const docs = input.documents
  const questions = savedQuestions(docs)
  const collections = bundleCollections(docs, input.libraryIndex)
  const claimMatrices = savedClaimMatrices(docs)
  const reproductions = savedReproductions(docs)
  const libraryChecked = !!input.libraryIndex

  const extraSections: RolePackExtraSection[] = [
    {
      key: 'question',
      title: 'Research question',
      purpose:
        'What you are checking, the kind of question, which sources count and which do not, and how much evidence is enough.',
      position: 'before',
      body: questionsSectionMarkdown(questions),
      toolPath: RESEARCH_WORKSPACE_PATH,
      linkText: 'Write it in your research workspace at',
    },
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

  const changedRecords = collections.flatMap((c) => c.entries.filter((e) => e.changes.length))
  if (changedRecords.length) {
    extraMissing.push({
      label: `${changedRecords.length} collection record${changedRecords.length === 1 ? ' has' : 's have'} changed since you saved ${changedRecords.length === 1 ? 'it' : 'them'}`,
      detail: `${[...new Set(changedRecords.map((e) => e.referenceId))].join(', ')}: check whether the change affects what you cite, then mark it as seen.`,
      toolPath: RESEARCH_WORKSPACE_PATH,
      linkText: 'Review the changes at',
    })
  }
  const unsupported = claimMatrices.flatMap((m) =>
    m.value.claims.filter((c) => c.status === 'fact' && c.supporting.length === 0)
  )
  if (unsupported.length) {
    extraMissing.push({
      label: `${unsupported.length} fact${unsupported.length === 1 ? '' : 's'} without a supporting record`,
      detail: `${unsupported.map((c) => c.id).join(', ')}: a fact needs at least one supporting Library record id.`,
      toolPath: RESEARCH_WORKSPACE_PATH,
      linkText: 'Add one in your claim matrix at',
    })
  }
  const noFalsification = reproductions.filter((r) => !r.value.falsification.trim())
  if (noFalsification.length) {
    extraMissing.push({
      label: 'Falsification condition not stated',
      detail: `${noFalsification.length} reproduction record${noFalsification.length === 1 ? ' does' : 's do'} not say what result would show the conclusion wrong.`,
      toolPath: RESEARCH_WORKSPACE_PATH,
      linkText: 'State it at',
    })
  }
  if (reproductions.length && !reproductions.some((r) => r.value.secondImplementation.trim())) {
    extraMissing.push({
      label: 'No second implementation compared',
      detail:
        'None of your reproduction records gives a second implementation’s result for the same vectors.',
      toolPath: RESEARCH_WORKSPACE_PATH,
      linkText: 'Add one to a reproduction record at',
    })
  }

  const collectionByModule = new Map(collections.map((c) => [c.moduleId, c]))
  const pack = buildRolePack(EVIDENCE_BUNDLE_RECIPE, {
    documents: [
      ...runs.map((r) => r.doc),
      ...collections.flatMap((c) =>
        docs.filter((d) => d.moduleId === c.moduleId && d.type === 'library-collection')
      ),
      ...claimMatrices.map((m) => m.doc),
      ...reproductions.map((r) => r.doc),
    ],
    title: input.title,
    author: input.author,
    scope:
      'Your research question, bookmarked and collected Library records, claims and the run records you saved',
    origin: input.origin,
    now,
    coverLines: [`- ${siteProvenanceLine(site)}`, '', `**${EVIDENCE_BUNDLE_STATEMENT}**`],
    extraSections,
    extraMissing,
    // Each run section is the saved record's own text, with its file named.
    // A collection section shows each record's current state next to the
    // state saved with it (also in collections.json).
    renderDocument: (doc) => {
      if (doc.type === 'library-collection') {
        const c = collectionByModule.get(doc.moduleId)
        return c
          ? `${collectionSectionMarkdown(c, libraryChecked)}\n\nAlso in \`collections.json\`.`
          : undefined
      }
      const run = runs.find((r) => r.doc.id === doc.id)
      return run ? `${doc.data.trim()}\n\nFull record: \`${run.path}\`` : undefined
    },
  })

  return {
    markdown: pack.markdown,
    pack,
    records,
    runs,
    questions,
    collections,
    claimMatrices,
    reproductions,
    libraryChecked,
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

- bundle.md: the bundle, in order: cover, research question, bookmarked Library records, references, collections (each record's current state and the state you saved), claim matrix, saved run records, reproduction records, methods and limitations, and what is missing.
- bundle.pdf: the same document as a PDF.
- references.bib and references.csl.json: citations for the bookmarked records.
- records.csv: the bookmarked records as a table.
- runs/: each saved run record as JSON (digests and per-case results, not the vectors).
- collections.json: your collections, each record with its saved and current state and what changed.
- research.json: your research questions, claim matrices and reproduction records.

A reviewer can open this zip read-only in the research workspace on PQC Today ("Open a bundle").

${EVIDENCE_BUNDLE_DISCLAIMER}
`

/** The files inside the evidence bundle zip, under `evidence-bundle/`. The
 * PDF is rendered by the caller (it needs the PDF library). */
export function evidenceBundleFiles(
  bundle: EvidenceBundle,
  opts: { pdf?: Blob; today?: string; now?: Date } = {}
): BundleFile[] {
  const generated = opts.now ?? new Date()
  const today = opts.today ?? generated.toISOString().slice(0, 10)
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
    {
      path: `${dir}/collections.json`,
      content: collectionsJson(bundle.collections, generated, bundle.libraryChecked),
    },
    {
      path: `${dir}/research.json`,
      content: researchJson(bundle, generated),
    },
  ]
}

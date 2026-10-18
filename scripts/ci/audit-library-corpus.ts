// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Offline Library corpus audit.
 *
 * This does not pretend to fact-check 1,000+ publications. It inventories the
 * fields and high-risk claims that require source review, while failing the
 * structural contracts that can be proven from the catalog itself.
 */
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import Papa from 'papaparse'

type Row = Record<string, string>

const ROOT = process.cwd()
const DATA_DIR = path.join(ROOT, 'src', 'data')
const FILE_RE = /^library_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/

function fileKey(name: string): number {
  const match = FILE_RE.exec(name)
  if (!match) return -1
  const [, month, day, year, revision = '0'] = match
  return Number(`${year}${month}${day}`) * 10_000 + Number(revision)
}

const filename = readdirSync(DATA_DIR)
  .filter((name) => FILE_RE.test(name))
  .sort((a, b) => fileKey(b) - fileKey(a))[0]

if (!filename) throw new Error('No library_*.csv file found')

const parsed = Papa.parse<Row>(readFileSync(path.join(DATA_DIR, filename), 'utf8'), {
  header: true,
  skipEmptyLines: true,
})
if (parsed.errors.length > 0) {
  throw new Error(`CSV parse failed: ${parsed.errors.map((error) => error.message).join('; ')}`)
}

const rows = parsed.data
const active = rows.filter((row) => !row.status || row.status === 'active')
const inactive = rows.filter((row) => row.status && row.status !== 'active')
const blank = (row: Row, field: string) => !(row[field] ?? '').trim()
const countBlank = (field: string) => active.filter((row) => blank(row, field)).length
const pct = (count: number) =>
  `${count}/${active.length} (${((count / active.length) * 100).toFixed(1)}%)`

const missingFields = [
  'initial_publication_date',
  'last_update_date',
  'last_verified',
  'short_description',
  'authors_or_organization',
  'lifecycle_state',
  'manual_category',
  'purpose',
  'research_topics',
  'trusted_source_id',
].map((field) => ({ field, count: countBlank(field) }))

const localPublicUrls = active.filter((row) =>
  /^(?:file:|\/|\.\.?\/)|(?:public\/library|local-(?:evidence|source)-cache|\/Users\/)/i.test(
    (row.download_url ?? '').trim()
  )
)
const malformedUrls = active.filter((row) => {
  const url = (row.download_url ?? '').trim()
  return url && !/^https?:\/\//i.test(url)
})
const nonHttps = active.filter((row) => /^http:\/\//i.test((row.download_url ?? '').trim()))
const duplicateActiveIds = [...new Set(active.map((row) => row.reference_id))].filter(
  (id) => active.filter((row) => row.reference_id === id).length > 1
)
const paid = active.filter((row) => row.access_type?.trim().toLowerCase() === 'paid')
const paidWithoutSummary = paid.filter((row) => blank(row, 'free_summary_url'))
const paidDirectPdf = paid.filter((row) => /\.pdf(?:$|[?#])/i.test(row.download_url ?? ''))
const explicitPurpose = active.filter((row) => !blank(row, 'purpose'))
const reviewClaims = active.filter((row) =>
  /\b(mandat(?:e|ed|ory)|require(?:d|ment)?|must|prohibit(?:s|ed)?|deadline|compliant|certif(?:y|ied|ication))\b/i.test(
    row.short_description ?? ''
  )
)
const documentedPrimaryReview = (row: Row) =>
  !blank(row, 'last_verified') &&
  (Number(row.confidence_score || 0) >= 85 ||
    (Number(row.confidence_score || 0) >= 80 &&
      /fetched and read directly|verified verbatim|content-verified|official .* reviewed|cross-checked by codex and approved|corrected via approved proposal/i.test(
        row.data_quality_notes ?? ''
      )))
const reviewClaimsNeedingScopeCheck = reviewClaims.filter((row) => !documentedPrimaryReview(row))

const pickFiles = [
  'libraryCuriousPicks.ts',
  'libraryExecutivePicks.ts',
  'libraryOpsPicks.ts',
  'libraryCertEngineerPicks.ts',
]
const starterIds = new Set(
  pickFiles.flatMap((pickFile) =>
    [
      ...readFileSync(path.join(DATA_DIR, pickFile), 'utf8').matchAll(/referenceId:\s*'([^']+)'/g),
    ].map((match) => match[1])
  )
)
const starterRows = [...starterIds].map((id) => active.find((row) => row.reference_id === id))
const missingStarterRows = [...starterIds].filter(
  (id) => !active.some((row) => row.reference_id === id)
)
const incompleteStarterRows = starterRows.filter(
  (row): row is Row =>
    Boolean(row) &&
    ['download_url', 'last_verified', 'short_description', 'authors_or_organization'].some(
      (field) => blank(row, field)
    )
)

const knownUnsubstantiatedRows = active.filter((row) =>
  /using generic .* (?:url|publisher)|pending direct .*url|left unresolved/i.test(
    `${row.misc_info ?? ''} ${row.data_quality_notes ?? ''}`
  )
)

const cnsa = active.find((row) => row.reference_id === 'NSA CNSA 2.0 FAQ')
const cnsaText = `${cnsa?.document_status ?? ''} ${cnsa?.short_description ?? ''}`
const cnsaCurrent =
  /Version 2\.2/i.test(cnsaText) &&
  /2027/.test(cnsaText) &&
  /2030/.test(cnsaText) &&
  /2031/.test(cnsaText) &&
  !/2033/.test(cnsaText)

const blockers: string[] = []
if (duplicateActiveIds.length) blockers.push(`${duplicateActiveIds.length} duplicate active ids`)
if (localPublicUrls.length) blockers.push(`${localPublicUrls.length} local/private public URLs`)
if (malformedUrls.length) blockers.push(`${malformedUrls.length} malformed source URLs`)
if (!cnsaCurrent) blockers.push('CNSA 2.0 FAQ Version 2.2 contract is stale')
if (missingStarterRows.length)
  blockers.push(`${missingStarterRows.length} curated starter ids do not resolve`)
if (incompleteStarterRows.length)
  blockers.push(`${incompleteStarterRows.length} curated starter records lack review metadata`)
if (knownUnsubstantiatedRows.length)
  blockers.push(`${knownUnsubstantiatedRows.length} active records admit an unsubstantiated source`)

console.log(`Library corpus audit — ${filename}`)
console.log(`Rows: ${rows.length} total · ${active.length} active · ${inactive.length} inactive`)
console.log('\nMetadata gaps')
for (const item of missingFields) console.log(`- ${item.field}: ${pct(item.count)}`)
console.log(`- explicit purpose: ${pct(explicitPurpose.length)}`)
console.log('\nAccess and source review')
console.log(`- paid: ${paid.length}`)
console.log(
  `- paid sources whose publisher page is the only free official description: ${paidWithoutSummary.length}`
)
console.log(`- paid direct-PDF URLs requiring review: ${paidDirectPdf.length}`)
console.log(`- non-HTTPS official URLs requiring review: ${nonHttps.length}`)
console.log(
  `- descriptions with mandate/requirement/certification language: ${reviewClaims.length}`
)
console.log(
  `- scope-sensitive descriptions below the review threshold: ${reviewClaimsNeedingScopeCheck.length}`
)
console.log(`- local/private public URLs: ${localPublicUrls.length}`)
console.log(`- malformed URLs: ${malformedUrls.length}`)
console.log(`- duplicate active ids: ${duplicateActiveIds.length}`)
console.log(`- CNSA Version 2.2 milestone contract: ${cnsaCurrent ? 'PASS' : 'FAIL'}`)
console.log(`- curated starter records: ${starterIds.size}`)
console.log(`- unresolved curated starter ids: ${missingStarterRows.length}`)
console.log(`- incomplete curated starter records: ${incompleteStarterRows.length}`)
console.log(
  `- active records admitting an unsubstantiated source: ${knownUnsubstantiatedRows.length}`
)

const sample = (label: string, list: Row[], max = 20) => {
  if (!list.length) return
  console.log(`\n${label} (first ${Math.min(max, list.length)})`)
  for (const row of list.slice(0, max)) {
    console.log(`- ${row.reference_id}: ${row.download_url || '(no URL)'}`)
  }
}
sample('Paid sources with publisher-page description only', paidWithoutSummary)
sample('Paid direct-PDF URLs', paidDirectPdf)
sample('Non-HTTPS URLs', nonHttps)
sample('Descriptions containing scope-sensitive language (reviewed and unreviewed)', reviewClaims)
sample(
  'Scope-sensitive descriptions still below the review threshold',
  reviewClaimsNeedingScopeCheck
)
sample('Curated starter records missing review metadata', incompleteStarterRows)
sample('Active records admitting an unsubstantiated source', knownUnsubstantiatedRows)

if (blockers.length > 0) {
  console.error(`\nBLOCKERS: ${blockers.join('; ')}`)
  process.exitCode = 1
}

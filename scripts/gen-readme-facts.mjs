// SPDX-License-Identifier: AGPL-3.0-only
/** Keep the small, volatile snapshot in README.md aligned with committed data. */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Papa from 'papaparse'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA = join(ROOT, 'src', 'data')
const README = join(ROOT, 'README.md')
const BEGIN = '<!-- BEGIN GENERATED README FACTS -->'
const END = '<!-- END GENERATED README FACTS -->'
const EXCLUDED_STATUSES = new Set(['deprecated', 'obsolete', 'draft'])

function selectLatestCsv(files, prefix) {
  const pattern = new RegExp(`^${prefix}(\\d{2})(\\d{2})(\\d{4})(?:_r(\\d+))?\\.csv$`)
  const matches = files
    .map((file) => ({ file, match: file.match(pattern) }))
    .filter(({ match }) => match)
    .map(({ file, match }) => ({
      file,
      key: `${match[3]}${match[1]}${match[2]}${(match[4] ?? '0').padStart(4, '0')}`,
      date: `${match[3]}-${match[1]}-${match[2]}`,
    }))
    .sort((a, b) => b.key.localeCompare(a.key))
  if (!matches[0]) throw new Error(`No current ${prefix}*.csv found`)
  return matches[0]
}

function latestCsv(prefix) {
  return selectLatestCsv(readdirSync(DATA), prefix)
}

function csvRows(file) {
  return Papa.parse(readFileSync(join(DATA, file), 'utf8'), {
    header: true,
    skipEmptyLines: true,
  }).data
}

function publishedCount(rows) {
  return rows.filter(
    (row) =>
      !EXCLUDED_STATUSES.has(
        String(row.status ?? row.Status ?? '')
          .trim()
          .toLowerCase()
      )
  ).length
}

function activeCount(file) {
  return publishedCount(csvRows(file))
}

function jsonArrayLength(file) {
  const parsed = JSON.parse(readFileSync(file, 'utf8'))
  if (!Array.isArray(parsed)) throw new Error(`${file} is not a JSON array`)
  return parsed.length
}

function derive() {
  const packageJson = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
  const current = {
    library: latestCsv('library_'),
    compliance: latestCsv('compliance_'),
    products: latestCsv('pqc_product_catalog_'),
    threats: latestCsv('quantum_threats_hsm_industries_'),
    leaders: latestCsv('leaders_'),
    quiz: latestCsv('pqcquiz_'),
    algorithms: latestCsv('pqc_complete_algorithm_reference_'),
    timeline: latestCsv('timeline_'),
  }
  const landing = readFileSync(join(DATA, 'landingCounts.generated.ts'), 'utf8')
  const readEstimate = (name) => Number(landing.match(new RegExp(`${name} = (\\d+)`))?.[1])
  const modules = readdirSync(join(ROOT, 'src', 'components', 'PKILearning', 'modules'), {
    withFileTypes: true,
  }).filter((entry) => {
    if (!entry.isDirectory()) return false
    try {
      readFileSync(
        join(ROOT, 'src', 'components', 'PKILearning', 'modules', entry.name, 'manifest.ts')
      )
      return true
    } catch {
      return false
    }
  }).length
  const glossary = ['algorithms', 'protocols', 'standards', 'concepts', 'organizations'].reduce(
    (sum, name) => sum + jsonArrayLength(join(DATA, 'glossary', `${name}.json`)),
    0
  )
  const rag = JSON.parse(readFileSync(join(ROOT, 'public', 'data', 'rag-corpus.json'), 'utf8'))
  const chunks = rag.chunks ?? []
  const linked = chunks.filter((chunk) => String(chunk.deepLink ?? '').trim()).length
  const sourceDates = Object.values(current).map(({ date }) => date)

  return {
    version: packageJson.version,
    snapshotDate: sourceDates.sort().at(-1),
    instructionalModules: modules - 1,
    quizQuestions: csvRows(current.quiz.file).length,
    algorithms: readEstimate('ALGORITHM_COUNT_ESTIMATE'),
    timeline: readEstimate('TIMELINE_EVENT_COUNT_ESTIMATE'),
    library: activeCount(current.library.file),
    products: activeCount(current.products.file),
    compliance: activeCount(current.compliance.file),
    threats: activeCount(current.threats.file),
    leaders: activeCount(current.leaders.file),
    glossary,
    ragChunks: chunks.length,
    ragSources: new Set(chunks.map((chunk) => chunk.source)).size,
    ragDeepLinks: chunks.length ? ((linked / chunks.length) * 100).toFixed(2) : '0.00',
  }
}

function format(number) {
  return new Intl.NumberFormat('en-US').format(number)
}

function render(facts) {
  return `${BEGIN}

### Current committed snapshot

Release **${facts.version}** · source-data snapshot through **${facts.snapshotDate}**. These figures are derived from the committed registries and current CSV lineages; they are not live counts.

- **Learn:** ${format(facts.instructionalModules)} instructional modules and ${format(facts.quizQuestions)} quiz questions.
- **Core references:** ${format(facts.algorithms)} algorithm records, ${format(facts.timeline)} timeline events and ${format(facts.library)} active Library records.
- **Educational catalogues:** ${format(facts.products)} active products, ${format(facts.compliance)} active compliance references, ${format(facts.threats)} active threat records and ${format(facts.leaders)} active community profiles.
- **Main glossary:** ${format(facts.glossary)} terms.
- **Assistant corpus:** ${format(facts.ragChunks)} chunks across ${format(facts.ragSources)} source collections; ${facts.ragDeepLinks}% carry a Hub deep link.

Edit the source registries, not this table, then run \`npm run gen:readme-facts\`.
${END}`
}

function replaceBlock(readme, block) {
  const start = readme.indexOf(BEGIN)
  const end = readme.indexOf(END)
  if (start === -1 || end === -1 || end < start) {
    throw new Error('README generated-facts markers are missing or out of order')
  }
  return `${readme.slice(0, start)}${block}${readme.slice(end + END.length)}`
}

function selfTest() {
  const selected = selectLatestCsv(
    ['sample_10172026.csv', 'sample_10172026_r2.csv', 'sample_10162026_r99.csv'],
    'sample_'
  )
  if (selected.file !== 'sample_10172026_r2.csv') throw new Error('latest-lineage self-test failed')
  const count = publishedCount([
    { status: 'active' },
    { status: '' },
    { status: 'draft' },
    { status: 'deprecated' },
    { Status: 'obsolete' },
  ])
  if (count !== 2) throw new Error('published-status self-test failed')
  const sample = { version: '0.0.0', snapshotDate: '2000-01-01' }
  if (render(sample) !== render(sample)) throw new Error('stable-render self-test failed')
}

selfTest()
if (process.argv.includes('--self-test')) {
  console.log('✓ README facts lineage, publication-status and stable-render self-tests pass')
  process.exit(0)
}

const expected = replaceBlock(readFileSync(README, 'utf8'), render(derive()))
if (process.argv.includes('--check')) {
  if (readFileSync(README, 'utf8') !== expected) {
    console.error('✗ README facts are stale — run `npm run gen:readme-facts`')
    process.exit(1)
  }
  console.log('✓ README facts match committed data')
} else {
  writeFileSync(README, expected)
  console.log('wrote README.md generated facts')
}

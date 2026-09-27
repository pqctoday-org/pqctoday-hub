// SPDX-License-Identifier: GPL-3.0-only
/**
 * coverageExport — human-readable renderings of the coverage matrix (plan
 * WS-C C-6): a Markdown file and a standalone, script-free HTML page, both
 * generated from the same CoverageMatrix object the JSON export and the public
 * page use. Also the (mechanism × operation) summary the page groups by.
 */
import { VALIDATION_DISCLAIMER } from '../validationDisclaimer'
import {
  ENGINES,
  ENGINE_LABEL,
  MATRIX_STATUSES,
  POLARITIES,
  DIMENSIONS,
  DIMENSION_LABEL,
  strongest,
  type CoverageLevel,
  type CoverageMatrix,
  type EngineId,
  type MatrixRow,
  type MatrixStatus,
  type Polarity,
} from './coverageModel'

export interface GroupPolarity {
  status: MatrixStatus
  covered: number
  sampled: number
  untested: number
}

export interface GroupEngine {
  advertisedCells: number
  unsupportedCells: number
  polarity: Record<Polarity, GroupPolarity>
}

/** Every row of one (mechanism, operation) pair, rolled up per engine. */
export interface CoverageGroup {
  key: string
  mechanism: string | null
  typeHex: string | null
  algorithm: string
  revision: string | null
  section: string | null
  family: string
  operation: string
  rows: MatrixRow[]
  engines: Record<EngineId, GroupEngine>
}

export function groupByMechanismOperation(matrix: CoverageMatrix): CoverageGroup[] {
  const groups = new Map<string, CoverageGroup>()
  for (const r of matrix.rows) {
    const key = `${r.mechanism ?? r.key.split('|')[0]}|${r.operation}`
    let g = groups.get(key)
    if (!g) {
      g = {
        key,
        mechanism: r.mechanism,
        typeHex: r.typeHex,
        algorithm: r.algorithm,
        revision: r.revision,
        section: r.section,
        family: r.family,
        operation: r.operation,
        rows: [],
        engines: {} as Record<EngineId, GroupEngine>,
      }
      groups.set(key, g)
    }
    g.rows.push(r)
  }
  for (const g of groups.values()) {
    for (const e of ENGINES) {
      const ge: GroupEngine = {
        advertisedCells: 0,
        unsupportedCells: 0,
        polarity: {} as Record<Polarity, GroupPolarity>,
      }
      for (const p of POLARITIES) {
        const statuses: MatrixStatus[] = []
        const counts = { covered: 0, sampled: 0, untested: 0 }
        for (const r of g.rows) {
          const c = r.engines[e] // eslint-disable-line security/detect-object-injection
          if (!c.advertised) continue
          const pc = c.polarity[p] // eslint-disable-line security/detect-object-injection
          if (pc.status !== 'untested') statuses.push(pc.status)
          if (pc.level !== 'unsupported') counts[pc.level] += 1
        }
        // eslint-disable-next-line security/detect-object-injection
        ge.polarity[p] = {
          status: statuses.length
            ? strongest(statuses)
            : g.rows.some((r) => r.engines[e].advertised)
              ? 'untested'
              : 'unsupported',
          ...counts,
        }
      }
      for (const r of g.rows) {
        // eslint-disable-next-line security/detect-object-injection
        if (r.engines[e].advertised) ge.advertisedCells += 1
        else ge.unsupportedCells += 1
      }
      g.engines[e] = ge // eslint-disable-line security/detect-object-injection
    }
  }
  return [...groups.values()]
}

export const levelSummary = (gp: GroupPolarity): string =>
  gp.status === 'unsupported'
    ? 'unsupported'
    : `${gp.status} (${gp.covered} covered / ${gp.sampled} sampled / ${gp.untested} untested)`

const pct = (n: number, d: number) => (d === 0 ? '—' : `${((100 * n) / d).toFixed(1)}%`)

const LEVELS: Exclude<CoverageLevel, 'unsupported'>[] = ['covered', 'sampled', 'untested']

/** Plain-language headline numbers, shared by every rendering. */
export function headline(matrix: CoverageMatrix): string[] {
  return ENGINES.map((e) => {
    const t = matrix.totals.byEngine[e] // eslint-disable-line security/detect-object-injection
    const pos = t.byPolarity.positive
    const neg = t.byPolarity.negative
    return `${ENGINE_LABEL[e]}: ${t.advertisedCells} advertised capability cells (${matrix.engines[e].mechanismCount} mechanisms). Positive: ${pos.covered} covered, ${pos.sampled} sampled, ${pos.untested} untested. Negative: ${neg.covered} covered, ${neg.sampled} sampled, ${neg.untested} untested. ${t.unsupportedCells} further cells unsupported. WebAssembly runs: ${t.byArtifact.wasm.passedCells} cells with a recorded pass, ${t.byArtifact.wasm.failedCells} with a recorded fail, ${t.byArtifact.wasm.skippedCells ?? 0} with a recorded skip (not run, never a pass).` // eslint-disable-line security/detect-object-injection
  })
}

// ── Markdown ─────────────────────────────────────────────────────────────────

const mdEscape = (s: string) => s.replace(/\|/g, '\\|')

export function renderCoverageMarkdown(matrix: CoverageMatrix): string {
  const L: string[] = []
  L.push('# PQC Today capability coverage matrix')
  L.push('')
  L.push(`> ${VALIDATION_DISCLAIMER}`)
  L.push('')
  L.push(
    'Generated by `scripts/generate-coverage-matrix.ts` from the runtime mechanism inventory, the reviewed capability map and the registered test inventory. Machine-readable copy: `coverage-matrix.json`. A status says a registered test exists for the cell; it is not a pass.'
  )
  L.push('')
  L.push('## Headline')
  L.push('')
  for (const h of headline(matrix)) L.push(`- ${h}`)
  L.push('')
  L.push('## Rules and definitions')
  L.push('')
  for (const [k, v] of Object.entries(matrix.rules)) L.push(`- **${k}** — ${v}`)
  L.push(`- **numerator** — ${matrix.definitions.numerator}`)
  L.push('')
  L.push('## Totals per engine and polarity')
  L.push('')
  L.push('| Engine | Polarity | Covered | Sampled | Untested | Denominator | Covered % |')
  L.push('| --- | --- | ---: | ---: | ---: | ---: | ---: |')
  for (const e of ENGINES) {
    const t = matrix.totals.byEngine[e] // eslint-disable-line security/detect-object-injection
    for (const p of POLARITIES) {
      const b = t.byPolarity[p] // eslint-disable-line security/detect-object-injection
      L.push(
        `| ${ENGINE_LABEL[e]} | ${p} | ${b.covered} | ${b.sampled} | ${b.untested} | ${t.advertisedCells} | ${pct(b.covered, t.advertisedCells)} |` // eslint-disable-line security/detect-object-injection
      )
    }
    L.push(
      `| ${ENGINE_LABEL[e]} | **overall** | ${t.overall.covered} | ${t.overall.sampled} | ${t.overall.untested} | ${t.advertisedCells} | ${pct(t.overall.covered, t.advertisedCells)} |` // eslint-disable-line security/detect-object-injection
    )
    for (const d of DIMENSIONS) {
      const b = t.byDimension[d] // eslint-disable-line security/detect-object-injection
      L.push(
        `| ${ENGINE_LABEL[e]} | ${DIMENSION_LABEL[d]} (G-3) | ${b.covered} | ${b.sampled} | ${b.untested} | ${t.advertisedCells} | ${pct(b.covered, t.advertisedCells)} |` // eslint-disable-line security/detect-object-injection
      )
    }
  }
  L.push('')
  L.push('## Cells by strongest registered evidence (positive polarity)')
  L.push('')
  L.push(`| Status | ${ENGINES.map((e) => ENGINE_LABEL[e]).join(' | ')} |`) // eslint-disable-line security/detect-object-injection
  L.push(`| --- | ${ENGINES.map(() => '---:').join(' | ')} |`)
  for (const s of MATRIX_STATUSES) {
    const cells = ENGINES.map(
      (e) =>
        s === 'unsupported'
          ? matrix.totals.byEngine[e].unsupportedCells // eslint-disable-line security/detect-object-injection
          : matrix.totals.byEngine[e].byPolarity.positive.byStatus[s] // eslint-disable-line security/detect-object-injection
    )
    L.push(`| ${s} — ${matrix.statusLabels[s]} | ${cells.join(' | ')} |`) // eslint-disable-line security/detect-object-injection
  }
  L.push('')
  L.push('## Artifact kinds and parity')
  L.push('')
  for (const k of Object.keys(matrix.artifactKinds) as (keyof CoverageMatrix['artifactKinds'])[]) {
    const a = matrix.artifactKinds[k] // eslint-disable-line security/detect-object-injection
    L.push(`- **${k}** — ${a.status}. ${a.note}`)
  }
  const par = matrix.totals.parity.positive
  L.push(
    `- **parity (positive)** — ${par.parity} rows with recorded parity, ${par.divergent} divergent, ${par['not-established']} not established, ${par['single-engine']} advertised by one engine only.`
  )
  L.push('')
  L.push('## Engines')
  L.push('')
  for (const e of ENGINES) {
    const id = matrix.engines[e] // eslint-disable-line security/detect-object-injection
    L.push(
      `- **${id.label}** — ${id.mechanismCount} mechanisms, inventory sha256 \`${id.inventorySha256}\`, hsm commit \`${id.sourceCommit ?? 'unrecorded'}\`; artifacts: ${id.artifacts.map((a) => `\`${a.path}\` ${a.sha256.slice(0, 16)}…`).join(', ')}`
    )
  }
  L.push('')
  L.push('## Open gaps register')
  L.push('')
  L.push('| Gap | Status | Owner | Plan item | Scope | Cells | Detail |')
  L.push('| --- | --- | --- | --- | --- | ---: | --- |')
  for (const g of matrix.openGaps) {
    L.push(
      `| ${mdEscape(g.title)} | ${g.status} | ${g.owner} | ${g.planItem ?? '—'} | ${mdEscape(g.scope)} | ${g.cells ?? '—'} | ${mdEscape(g.detail)} |`
    )
  }
  L.push('')
  L.push('## Matrix by mechanism and operation')
  L.push('')
  L.push(
    'Each entry: strongest registered evidence over the cells of that mechanism × operation (parameter sets × sign variants), then how many of those cells are covered / sampled / untested. The JSON export lists every cell.'
  )
  for (const e of ENGINES) {
    L.push('')
    L.push(`### ${ENGINE_LABEL[e]}`) // eslint-disable-line security/detect-object-injection
    L.push('')
    L.push(
      '| Mechanism | Operation | Algorithm | Cells | Positive | Negative | Boundary | State/error |'
    )
    L.push('| --- | --- | --- | ---: | --- | --- | --- | --- |')
    for (const g of groupByMechanismOperation(matrix)) {
      const ge = g.engines[e] // eslint-disable-line security/detect-object-injection
      const name = g.mechanism ?? `(no mechanism) ${g.algorithm}`
      L.push(
        `| ${mdEscape(name)} | ${g.operation} | ${mdEscape(g.algorithm)} | ${ge.advertisedCells}${ge.unsupportedCells ? ` (+${ge.unsupportedCells} unsupported)` : ''} | ${POLARITIES.map((p) => levelSummary(ge.polarity[p])).join(' | ')} |` // eslint-disable-line security/detect-object-injection
      )
    }
  }
  L.push('')
  return L.join('\n')
}

// ── HTML (static, no scripts) ────────────────────────────────────────────────

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function renderCoverageHtml(matrix: CoverageMatrix): string {
  const h: string[] = []
  h.push('<!doctype html>')
  h.push('<html lang="en">')
  h.push('<head>')
  h.push('<meta charset="utf-8">')
  h.push('<meta name="viewport" content="width=device-width, initial-scale=1">')
  h.push('<title>PQC Today capability coverage matrix</title>')
  h.push(
    '<style>body{font-family:system-ui,sans-serif;margin:16px;line-height:1.45}table{border-collapse:collapse;margin:8px 0 24px;font-size:13px}th,td{border:1px solid #999;padding:4px 6px;text-align:left;vertical-align:top}th{position:sticky;top:0;background:#eee}blockquote{border-left:4px solid #999;margin:8px 0;padding:4px 12px}.wrap{overflow-x:auto}code{font-size:12px}</style>'
  )
  h.push('</head>')
  h.push('<body>')
  h.push('<h1>PQC Today capability coverage matrix</h1>')
  h.push(`<blockquote><p>${esc(VALIDATION_DISCLAIMER)}</p></blockquote>`)
  h.push(
    '<p>Generated from the runtime mechanism inventory, the reviewed capability map and the registered test inventory. A status says a registered test exists for the cell; it is not a pass. Machine-readable copy: <a href="coverage-matrix.json">coverage-matrix.json</a>.</p>'
  )
  h.push('<h2>Headline</h2><ul>')
  for (const line of headline(matrix)) h.push(`<li>${esc(line)}</li>`)
  h.push('</ul>')
  h.push('<h2>Rules and definitions</h2><dl>')
  for (const [k, v] of Object.entries(matrix.rules)) h.push(`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`)
  h.push(`<dt>numerator</dt><dd>${esc(matrix.definitions.numerator)}</dd></dl>`)
  h.push('<h2>Totals per engine and polarity</h2><div class="wrap"><table>')
  h.push(
    '<thead><tr><th>Engine</th><th>Polarity</th><th>Covered</th><th>Sampled</th><th>Untested</th><th>Denominator</th></tr></thead><tbody>'
  )
  for (const e of ENGINES) {
    const t = matrix.totals.byEngine[e] // eslint-disable-line security/detect-object-injection
    for (const p of [...POLARITIES, 'overall', ...DIMENSIONS] as const) {
      const b =
        p === 'overall'
          ? t.overall
          : p === 'algorithm' || p === 'api'
            ? t.byDimension[p] // eslint-disable-line security/detect-object-injection
            : t.byPolarity[p] // eslint-disable-line security/detect-object-injection
      const label = p === 'algorithm' || p === 'api' ? `${DIMENSION_LABEL[p]} (G-3)` : p // eslint-disable-line security/detect-object-injection
      h.push(
        `<tr><td>${ENGINE_LABEL[e]}</td><td>${esc(label)}</td>${LEVELS.map((l) => `<td>${b[l]}</td>`).join('')}<td>${t.advertisedCells}</td></tr>` // eslint-disable-line security/detect-object-injection
      )
    }
  }
  h.push('</tbody></table></div>')
  h.push('<h2>Artifact kinds and parity</h2><ul>')
  for (const k of Object.keys(matrix.artifactKinds) as (keyof CoverageMatrix['artifactKinds'])[]) {
    const a = matrix.artifactKinds[k] // eslint-disable-line security/detect-object-injection
    h.push(`<li><strong>${k}</strong> — ${esc(a.status)}. ${esc(a.note)}</li>`)
  }
  h.push('</ul>')
  h.push('<h2>Open gaps register</h2><div class="wrap"><table>')
  h.push(
    '<thead><tr><th>Gap</th><th>Status</th><th>Owner</th><th>Plan item</th><th>Scope</th><th>Cells</th><th>Detail</th></tr></thead><tbody>'
  )
  for (const g of matrix.openGaps) {
    h.push(
      `<tr><td>${esc(g.title)}</td><td>${esc(g.status)}</td><td>${esc(g.owner)}</td><td>${esc(g.planItem ?? '—')}</td><td>${esc(g.scope)}</td><td>${g.cells ?? '—'}</td><td>${esc(g.detail)}</td></tr>`
    )
  }
  h.push('</tbody></table></div>')
  h.push('<h2>Matrix by mechanism and operation</h2>')
  h.push(
    '<p>Each entry: strongest registered evidence over the cells of that mechanism × operation, then covered / sampled / untested cell counts.</p>'
  )
  for (const e of ENGINES) {
    h.push(`<h3>${ENGINE_LABEL[e]}</h3><div class="wrap"><table>`) // eslint-disable-line security/detect-object-injection
    h.push(
      '<thead><tr><th>Mechanism</th><th>Operation</th><th>Algorithm</th><th>Cells</th><th>Positive</th><th>Negative</th><th>Boundary</th><th>State/error</th></tr></thead><tbody>'
    )
    for (const g of groupByMechanismOperation(matrix)) {
      const ge = g.engines[e] // eslint-disable-line security/detect-object-injection
      h.push(
        `<tr><td><code>${esc(g.mechanism ?? '(no mechanism)')}</code></td><td>${esc(g.operation)}</td><td>${esc(g.algorithm)}</td><td>${ge.advertisedCells}${ge.unsupportedCells ? ` (+${ge.unsupportedCells} unsupported)` : ''}</td>${POLARITIES.map((p) => `<td>${esc(levelSummary(ge.polarity[p]))}</td>`).join('')}</tr>` // eslint-disable-line security/detect-object-injection
      )
    }
    h.push('</tbody></table></div>')
  }
  h.push('</body>')
  h.push('</html>')
  return h.join('\n')
}

// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Run records saved to "my evidence": a run manifest (`runManifest.ts`) kept
 * in the artifact store as a `run-manifest` document. `output` holds the
 * manifest with long values reduced to SHA-256 digests (never the vectors);
 * `data` holds its Markdown summary, which is also the run's section in the
 * evidence bundle (`evidenceBundle.ts`).
 *
 * Kept apart from the bundle so the tools that save a run do not load the
 * pack builder.
 */
import type { ExecutiveDocument } from '@/services/storage/types'
import { RUN_MANIFEST_MODULE_PREFIX } from '@/data/runTools'
import { MODE_TEXT, RUN_MANIFEST_SCHEMA, type RunCase, type RunManifest } from './runManifest'

export const VECTOR_MATCH_SENTENCE = 'A vector match is not a CAVP/ACVP validation.'

/** A Markdown table cell: pipes escaped, one line. */
export const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ').trim()

/** Strings and arrays longer than this are stored as a SHA-256 digest. */
const MAX_STORED_STRING = 256
const MAX_STORED_ARRAY = 256

async function sha256Text(text: string): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))
  return Array.from(d, (b) => b.toString(16).padStart(2, '0')).join('')
}

async function compactValue(v: unknown): Promise<unknown> {
  if (typeof v === 'string') {
    return v.length > MAX_STORED_STRING ? `sha256:${await sha256Text(v)} (${v.length} chars)` : v
  }
  if (Array.isArray(v)) {
    if (v.length > MAX_STORED_ARRAY) {
      return `sha256:${await sha256Text(JSON.stringify(v))} (array of ${v.length})`
    }
    return Promise.all(v.map(compactValue))
  }
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      // eslint-disable-next-line security/detect-object-injection
      out[k] = await compactValue(x)
    }
    return out
  }
  return v
}

/**
 * The manifest as it is stored in "my evidence": the same record, with any
 * long value (a full output, a vector, a sample array) replaced by its
 * SHA-256 digest, so the store holds digests and per-case results, never the
 * vectors themselves. The pinned vector file stays linked from `vectors.url`.
 */
export async function storedRunManifest(m: RunManifest): Promise<RunManifest> {
  const compactCase = async (c: RunCase): Promise<RunCase> => ({
    ...c,
    actual: (await compactValue(c.actual)) as string,
    ...(c.expected !== undefined ? { expected: (await compactValue(c.expected)) as string } : {}),
  })
  return {
    ...m,
    inputs: (await compactValue(m.inputs)) as Record<string, unknown>,
    cases: await Promise.all(m.cases.map(compactCase)),
  }
}

/** The run manifest held by a saved run record, or null when it is not one. */
export function readRunManifest(doc: Pick<ExecutiveDocument, 'output'>): RunManifest | null {
  const m = doc.output as Partial<RunManifest> | undefined
  if (!m || m.schema !== RUN_MANIFEST_SCHEMA || !m.tool || !Array.isArray(m.cases)) return null
  return m as RunManifest
}

/** The run's limitations, plus the vector-match sentence when not already stated. */
export function runLimitations(m: RunManifest): string[] {
  const stated = m.limitations.some((l) => /not a CAVP\/ACVP validation/i.test(l))
  return stated ? m.limitations : [...m.limitations, VECTOR_MATCH_SENTENCE]
}

const MAX_CASE_ROWS = 50

/**
 * The Markdown summary of one saved run: the saved record's own text (its
 * `data`), and the run's section in the bundle. Headings are left to the
 * caller; this uses bold labels so it reads the same at any depth.
 */
export function runManifestSummaryMarkdown(m: RunManifest): string {
  const site = [
    `version ${m.site.appVersion || 'unknown'}`,
    `commit ${m.site.commit ? m.site.commit.slice(0, 12) : 'unknown'}`,
    `WASM hash ${m.site.wasmHash ? m.site.wasmHash.slice(0, 16) : 'not recorded'}`,
  ].join(' · ')
  const total = m.cases.length
  const neg = m.negativeControls ?? []
  const lines = [
    `- Tool: ${m.tool.title} (${m.tool.id}) version ${m.tool.version}`,
    `- Ran: ${m.runtime.startedAt} to ${m.runtime.finishedAt}`,
    `- How it ran: ${MODE_TEXT[m.executionMode] ?? m.executionMode}`,
    `- Site build: ${site}`,
    `- Result: ${m.summary.passed} passed, ${m.summary.failed} failed (${total} case${total === 1 ? '' : 's'})`,
    `- Negative controls: ${neg.length ? `${neg.filter((n) => n.pass).length} of ${neg.length} passed` : 'none recorded'}`,
    m.vectors
      ? `- Vectors: ${m.vectors.source}; ${m.vectors.count} cases; file SHA-256 \`${m.vectors.sha256}\`; ${m.vectors.url}`
      : '- Vectors: none pinned for this run',
    '',
    '**Results**',
    '',
    '| Case | Result | Expected | Actual |',
    '|---|---|---|---|',
    ...m.cases
      .slice(0, MAX_CASE_ROWS)
      .map(
        (c) =>
          `| ${cell(c.id)} | ${c.pass ? 'PASS' : 'FAIL'} | ${cell(c.expected ?? '—')} | ${cell(c.actual)} |`
      ),
    ...(total > MAX_CASE_ROWS
      ? ['', `_${total - MAX_CASE_ROWS} more cases are in the JSON record._`]
      : []),
    '',
  ]
  if (neg.length) {
    lines.push(
      '**Negative controls**',
      '',
      '| Control | Change made | Result |',
      '|---|---|---|',
      ...neg.map((n) => `| ${cell(n.id)} | ${cell(n.mutation)} | ${n.pass ? 'PASS' : 'FAIL'} |`),
      ''
    )
  }
  lines.push('**What this run does not show**', '', ...runLimitations(m).map((l) => `- ${l}`))
  return lines.join('\n')
}

/** What "Save to my evidence" stores: a `run-manifest` artifact whose
 * `output` is the (compacted) manifest and whose `data` is its summary. Each
 * run is its own document; saving the same run again updates it. */
export async function runManifestSaveRequest(m: RunManifest): Promise<{
  type: 'run-manifest'
  moduleId: string
  title: string
  data: string
  inputs: unknown
  output: RunManifest
}> {
  const stored = await storedRunManifest(m)
  return {
    type: 'run-manifest',
    moduleId: `${RUN_MANIFEST_MODULE_PREFIX}${m.tool.id}:${m.runtime.finishedAt}`,
    title: `${m.tool.title} run, ${m.summary.passed} passed / ${m.summary.failed} failed (${m.runtime.finishedAt.slice(0, 10)})`,
    data: runManifestSummaryMarkdown(stored),
    inputs: { toolId: m.tool.id, finishedAt: m.runtime.finishedAt },
    output: stored,
  }
}

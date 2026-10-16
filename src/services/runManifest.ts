// SPDX-License-Identifier: GPL-3.0-only
/**
 * A small, shareable record of one run of a Playground tool: what ran, with
 * which inputs, on which build of the site, what happened, and what the run
 * does NOT show. Shared by every tool that offers "Save what this run showed"
 * (first: the TLS simulator, curious journey review, 16 Oct 2026); the
 * Researcher plan's conformance exports reuse the same shape.
 *
 * Everything is built in the browser from the run's own results. Nothing is
 * uploaded or stored. Full test vectors are never embedded, only digests.
 */
import { withEducationNoticeMarkdown } from '@/data/educationNotice'

export const RUN_MANIFEST_SCHEMA = 'pqctoday.run-manifest/1'

export type ExecutionMode =
  'in-browser-implementation' | 'simulation' | 'spec-visualiser' | 'docker'

export interface RunCase {
  id: string
  expected?: string
  actual: string
  pass: boolean
}

export interface RunManifest {
  schema: typeof RUN_MANIFEST_SCHEMA
  tool: { id: string; title: string; version: string }
  site: { appVersion: string; commit: string; wasmHash: string; buildTimestamp: string }
  runtime: { userAgent: string; startedAt: string; finishedAt: string }
  executionMode: ExecutionMode
  inputs: Record<string, unknown>
  vectors?: { source: string; url: string; sha256: string; count: number }
  cases: RunCase[]
  negativeControls?: { id: string; mutation: string; pass: boolean }[]
  summary: { passed: number; failed: number }
  /** Plain statements of what this run does not show. Never empty. */
  limitations: string[]
}

export interface RunManifestInput {
  tool: RunManifest['tool']
  executionMode: ExecutionMode
  inputs: Record<string, unknown>
  cases: RunCase[]
  limitations: string[]
  startedAt: string
  finishedAt: string
  vectors?: RunManifest['vectors']
  negativeControls?: RunManifest['negativeControls']
}

/** The build the page was served from. Each constant is '' when the build did not define it. */
export function siteBuildInfo(): RunManifest['site'] {
  return {
    appVersion: typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '',
    commit: typeof __BUILD_COMMIT__ === 'string' ? __BUILD_COMMIT__ : '',
    wasmHash: typeof __WASM_HASH__ === 'string' ? __WASM_HASH__ : '',
    buildTimestamp: typeof __BUILD_TIMESTAMP__ === 'string' ? __BUILD_TIMESTAMP__ : '',
  }
}

export function buildRunManifest(
  input: RunManifestInput,
  site: RunManifest['site'] = siteBuildInfo(),
  userAgent: string = typeof navigator !== 'undefined' ? navigator.userAgent : ''
): RunManifest {
  if (input.limitations.length === 0) {
    throw new Error('A run manifest must state at least one limitation')
  }
  const passed = input.cases.filter((c) => c.pass).length
  return {
    schema: RUN_MANIFEST_SCHEMA,
    tool: input.tool,
    site,
    runtime: { userAgent, startedAt: input.startedAt, finishedAt: input.finishedAt },
    executionMode: input.executionMode,
    inputs: input.inputs,
    ...(input.vectors ? { vectors: input.vectors } : {}),
    cases: input.cases,
    ...(input.negativeControls ? { negativeControls: input.negativeControls } : {}),
    summary: { passed, failed: input.cases.length - passed },
    limitations: input.limitations,
  }
}

/** How a run was produced, in one sentence per execution mode. */
export const MODE_TEXT: Record<ExecutionMode, string> = {
  'in-browser-implementation': 'Real cryptographic code ran in your browser.',
  simulation: 'A simulation: no real cryptographic exchange took place.',
  'spec-visualiser': 'A visual walk-through of a specification, not an implementation.',
  docker: 'Ran in a local container, not in the browser.',
}

/** A readable Markdown record, led by the site's education notice, with the full manifest as a JSON block at the end. */
export function runManifestToMarkdown(m: RunManifest): string {
  const lines = [
    `# ${m.tool.title}: what this run showed`,
    '',
    `- Date: ${m.runtime.finishedAt}`,
    `- Tool: ${m.tool.title} (${m.tool.id}) version ${m.tool.version}`,
    `- Site build: ${m.site.appVersion || 'unknown'}${m.site.commit ? ` (commit ${m.site.commit.slice(0, 12)})` : ''}`,
    `- How it ran: ${MODE_TEXT[m.executionMode]}`,
    `- Result: ${m.summary.passed} passed, ${m.summary.failed} failed`,
    '',
    '## Results',
    '',
    ...m.cases.map(
      (c) =>
        `- ${c.pass ? 'PASS' : 'FAIL'} ${c.id}: ${c.actual}${c.expected ? ` (expected ${c.expected})` : ''}`
    ),
    '',
    '## What this run does not show',
    '',
    ...m.limitations.map((l) => `- ${l}`),
    '',
    '## Machine-readable record',
    '',
    '```json',
    JSON.stringify(m, null, 2),
    '```',
    '',
  ]
  return withEducationNoticeMarkdown(lines.join('\n'))
}

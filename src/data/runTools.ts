// SPDX-License-Identifier: GPL-3.0-only
/**
 * The tools that save a run record (run manifest) to "my evidence", and where
 * each one lives. Kept free of imports so start-up code (the history seeder)
 * can use it without loading the tools themselves.
 */

export interface RunTool {
  /** `tool.id` in the run manifest. */
  id: string
  title: string
  path: string
}

export const RUN_TOOLS: readonly RunTool[] = [
  { id: 'drbg-demo', title: 'SP 800-90A DRBG', path: '/playground/drbg-demo' },
  { id: 'entropy-test', title: 'Entropy Testing', path: '/playground/entropy-test' },
  { id: 'source-combining', title: 'Source Combining', path: '/playground/source-combining' },
  {
    id: 'entropy-evidence-lab',
    title: 'Entropy Evidence Lab (SP 800-90B)',
    path: '/learn/entropy-randomness?tab=workshop',
  },
  { id: 'tls-simulator', title: 'TLS 1.3 simulator', path: '/playground/tls-simulator' },
]

/** The tool a researcher should run first for a reproduction. */
export const FIRST_RUN_TOOL = RUN_TOOLS[0]

/** Where "Download the evidence bundle" leads after a run is saved: the
 * Library's bookmarks view, which offers the bundle to every role. */
export const EVIDENCE_BUNDLE_LINK = '/library?qv=bookmarked'

/** moduleId prefix of saved run records: `run-manifest:<tool id>:<finishedAt>`. */
export const RUN_MANIFEST_MODULE_PREFIX = 'run-manifest:'

/** Where a run record's tool lives; the Playground page for unknown ids. */
export function runToolPath(toolId: string): string {
  return RUN_TOOLS.find((t) => t.id === toolId)?.path ?? `/playground/${toolId}`
}

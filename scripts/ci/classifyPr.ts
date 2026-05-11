// SPDX-License-Identifier: GPL-3.0-only
/**
 * classifyPr — pure classifier (FR-D-06) used by the GitHub Actions
 * step that auto-labels and comments on PRs.
 *
 * Inputs:
 *   - list of changed-file paths (from `gh pr diff --name-only`)
 *   - existing PR labels (read by the workflow before invoking)
 *
 * Outputs:
 *   - inferred labels (subset of the closed CHANGE_LABELS set)
 *   - a confidence verdict (unambiguous = auto-apply; ambiguous = comment-only)
 *   - a Markdown summary suitable for posting as a PR sticky comment
 *
 * No I/O, no GitHub API calls — testable in isolation. The workflow is the
 * thin wrapper that fetches inputs and posts outputs.
 */

export const CHANGE_LABELS = [
  'data:library',
  'data:compliance',
  'data:migrate',
  'data:threats',
  'data:timeline',
  'data:leaders',
  'data:vendors',
  'data:algorithms',
  'enrichment',
  'xref',
  'module:content',
  'tool:registry',
  'tool:wasm-backend',
  'vocab:change',
  'schema:change',
] as const

export type ChangeLabel = (typeof CHANGE_LABELS)[number]

interface PathRule {
  /** Regex tested against the changed-file path. */
  pattern: RegExp
  label: ChangeLabel
  /** Human-readable reason shown in the PR comment. */
  reason: string
}

/**
 * Path → label rules. Order matters only for the comment's "rule that fired"
 * field — a single file can match multiple rules and contribute multiple
 * labels (e.g. an `enrichment` MD file under `src/data/library_enrichments/`).
 */
const RULES: PathRule[] = [
  // Library data CSVs
  {
    pattern: /^src\/data\/library_\d{8}.*\.csv$/,
    label: 'data:library',
    reason: 'library_*.csv data file',
  },
  // Compliance data CSVs
  {
    pattern: /^src\/data\/compliance_\d{8}.*\.csv$/,
    label: 'data:compliance',
    reason: 'compliance_*.csv data file',
  },
  // Timeline data CSVs
  {
    pattern: /^src\/data\/timeline_\d{8}.*\.csv$/,
    label: 'data:timeline',
    reason: 'timeline_*.csv data file',
  },
  // Threats data CSVs
  {
    pattern: /^src\/data\/quantum_threats_hsm_industries_\d{8}.*\.csv$/,
    label: 'data:threats',
    reason: 'quantum_threats_*.csv data file',
  },
  // Migrate / product catalog
  {
    pattern: /^src\/data\/pqc_product_catalog_\d{8}.*\.csv$/,
    label: 'data:migrate',
    reason: 'product catalog CSV',
  },
  // Leaders
  {
    pattern: /^src\/data\/leaders_\d{8}.*\.csv$/,
    label: 'data:leaders',
    reason: 'leaders_*.csv data file',
  },
  // Vendors
  {
    pattern: /^src\/data\/vendors_\d{8}.*\.csv$/,
    label: 'data:vendors',
    reason: 'vendors_*.csv data file',
  },
  // Algorithms
  {
    pattern: /^src\/data\/pqc_complete_algorithm_reference_\d{8}.*\.csv$/,
    label: 'data:algorithms',
    reason: 'algorithm reference CSV',
  },
  // Concept xwalk = xref change
  {
    pattern: /^src\/data\/concept_xwalks?_\d{8}.*\.csv$/,
    label: 'xref',
    reason: 'concept-xwalk CSV',
  },
  // Enrichment markdown
  {
    pattern: /^pqctoday-priv\/cowork\/.*-enrichments?\/.*\.md$/,
    label: 'enrichment',
    reason: 'enrichment markdown under cowork',
  },
  {
    pattern: /^src\/data\/.*enrichments?.*\.(md|csv)$/,
    label: 'enrichment',
    reason: 'enrichment file under src/data',
  },
  // Module content
  {
    pattern: /^src\/components\/PKILearning\/modules\/[^/]+\/content\.ts$/,
    label: 'module:content',
    reason: 'PKILearning module content.ts',
  },
  // Tool registry
  {
    pattern: /^src\/data\/workshopRegistry\.tsx?$/,
    label: 'tool:registry',
    reason: 'workshop tool registry',
  },
  // WASM backend
  {
    pattern: /^public\/dist\/.*\.wasm$/,
    label: 'tool:wasm-backend',
    reason: 'WASM binary under public/dist',
  },
  {
    pattern: /^src\/wasm\/.*\.(ts|tsx|js)$/,
    label: 'tool:wasm-backend',
    reason: 'WASM binding source',
  },
  // Vocabulary overlay
  {
    pattern: /^src\/data\/pqc-vocab-overlay\.json$/,
    label: 'vocab:change',
    reason: 'PQC vocabulary overlay',
  },
  // Schema change — type-definition files in src/types or src/data interfaces
  // (heuristic; precise detection would require AST-diff)
  { pattern: /^src\/types\/.*\.ts$/, label: 'schema:change', reason: 'TypeScript type definition' },
]

export interface ClassificationResult {
  /** Labels that should be auto-applied (every label has at least one supporting rule + file). */
  inferredLabels: ChangeLabel[]
  /** Per-label list of (file, rule reason) tuples for the comment body. */
  evidence: Record<ChangeLabel, Array<{ file: string; reason: string }>>
  /** True if the inference is unambiguous (exactly one label, all files explained). */
  unambiguous: boolean
  /** Files that didn't match any rule. */
  unclassifiedFiles: string[]
  /** Markdown body suitable for posting as a sticky PR comment. */
  comment: string
}

export function classifyPr(
  changedFiles: ReadonlyArray<string>,
  existingLabels: ReadonlyArray<string> = []
): ClassificationResult {
  const evidence: Record<string, Array<{ file: string; reason: string }>> = {}
  const unclassifiedFiles: string[] = []

  for (const file of changedFiles) {
    let matched = false
    for (const rule of RULES) {
      if (rule.pattern.test(file)) {
        if (!evidence[rule.label]) evidence[rule.label] = []
        evidence[rule.label].push({ file, reason: rule.reason })
        matched = true
      }
    }
    if (!matched) unclassifiedFiles.push(file)
  }

  const inferredLabels = Object.keys(evidence) as ChangeLabel[]
  const existingSet = new Set(existingLabels)
  const newLabels = inferredLabels.filter((l) => !existingSet.has(l))

  // Unambiguous = single inferred label and zero unclassified files.
  // (A PR touching only a library CSV is unambiguous; touching a CSV
  // and a workflow file is ambiguous since the workflow change isn't
  // captured by a label.)
  const unambiguous = inferredLabels.length === 1 && unclassifiedFiles.length === 0

  const comment = buildComment(inferredLabels, evidence, newLabels, unclassifiedFiles, unambiguous)

  // Cast OK: keys came from the CHANGE_LABELS-typed `rule.label`.
  return {
    inferredLabels,
    evidence: evidence as Record<ChangeLabel, Array<{ file: string; reason: string }>>,
    unambiguous,
    unclassifiedFiles,
    comment,
  }
}

function buildComment(
  inferred: ChangeLabel[],
  evidence: Record<string, Array<{ file: string; reason: string }>>,
  newLabels: ChangeLabel[],
  unclassified: string[],
  unambiguous: boolean
): string {
  const lines: string[] = []
  lines.push('## Trust-engine change classifier (FR-D-06)')
  lines.push('')
  if (inferred.length === 0) {
    lines.push(
      "This PR doesn't touch any tracked trust-engine surface — no change-type label inferred."
    )
    if (unclassified.length > 0) {
      lines.push('')
      lines.push('**Unclassified files** (informational, not blocking):')
      lines.push('')
      for (const f of unclassified.slice(0, 10)) lines.push(`- \`${f}\``)
      if (unclassified.length > 10) lines.push(`- … and ${unclassified.length - 10} more`)
    }
    return lines.join('\n')
  }

  lines.push(
    unambiguous
      ? `**Inferred label** (auto-applied): \`${inferred[0]}\``
      : `**Inferred labels** (review before applying): ${inferred.map((l) => `\`${l}\``).join(', ')}`
  )
  lines.push('')

  for (const label of inferred) {
    lines.push(`### \`${label}\``)
    for (const e of evidence[label].slice(0, 8)) {
      lines.push(`- \`${e.file}\` — ${e.reason}`)
    }
    if (evidence[label].length > 8) {
      lines.push(`- … and ${evidence[label].length - 8} more`)
    }
    lines.push('')
  }

  if (newLabels.length > 0 && !unambiguous) {
    lines.push(
      '**Action**: a maintainer should review and apply the labels above. Auto-application is reserved for unambiguous (single-label, all-files-classified) cases.'
    )
    lines.push('')
  }

  if (unclassified.length > 0) {
    lines.push('**Unclassified files** (no rule matched — outside the trust-engine perimeter):')
    lines.push('')
    for (const f of unclassified.slice(0, 10)) lines.push(`- \`${f}\``)
    if (unclassified.length > 10) lines.push(`- … and ${unclassified.length - 10} more`)
    lines.push('')
  }

  lines.push('---')
  lines.push(
    'Posted by `.github/workflows/classify-pr.yml`. See [PRD §FR-D-06](pqctoday-priv/requirements/trust-engine-prd.md) for the rule set.'
  )
  return lines.join('\n')
}

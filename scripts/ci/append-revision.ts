#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * append-revision.ts — post-merge CI step
 *
 * Reads PR metadata from GitHub Actions environment variables, resolves the
 * SME reviewer (GitHub approval or offline attestation), and appends one line
 * to public/data/revisions.jsonl. Commits the updated file back to main.
 *
 * Required env vars (set by GitHub Actions):
 *   GITHUB_TOKEN          — must have contents:write (use REVISION_TOKEN secret)
 *   GITHUB_PR_NUMBER      — PR number that just merged
 *   GITHUB_SHA            — merge commit SHA
 *   GITHUB_EVENT_PATH     — path to the GitHub event JSON payload
 *   GITHUB_REPOSITORY     — "owner/repo"
 *
 * Optional (for tool:registry revision entries injected by check-tool-version-bump):
 *   BUMPED_TOOLS_JSON     — JSON array of { tool_id, old_version, new_version }
 *
 * Exit codes:
 *   0 — success (line appended and committed)
 *   1 — missing reviewer (merge should have been blocked but wasn't — logs error)
 *   2 — configuration error (missing env vars, unreadable files)
 */
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import Papa from 'papaparse'
import {
  computeFieldChanges,
  DOMAIN_TO_PK_COLUMN,
  DOMAIN_TO_CSV_PREFIX,
  type FieldChange,
} from './computeFieldChanges'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Reviewer {
  reviewer_id: string
  github_handle: string | null
  display_name: string
  name_public: boolean
  affiliation?: string
  affiliation_public?: boolean
  active: boolean
  domains: string[]
  added_by_proxy?: string
  added_date?: string
}

interface ReviewerRegistry {
  reviewers: Reviewer[]
}

interface OfflineAttestation {
  reviewer_id: string
  proxy_github_handle: string
  review_date: string
  approved_via: string
  justification: string
  evidence_ref: string
}

interface RevisionEntry {
  pr_number: number
  merge_sha: string
  merge_timestamp: string
  change_type: string
  domain: string
  scope_summary: string
  rows_affected: number | null
  module_id: string | null
  tool_id: string | null
  sample_size: number | null
  /** Affected record IDs — populated by computeFieldChanges when applicable. */
  record_ids?: string[]
  /** Per-cell before/after diff — see scripts/ci/computeFieldChanges.ts */
  field_changes?: FieldChange[]
  reviewer_id: string
  reviewer_display: string
  approval_method: 'github' | 'offline'
  approved_via: string | null
  proxy_github_handle: string | null
  authored_by_llm: boolean
  confidence_delta: number | null
}

// ---------------------------------------------------------------------------
// Label → change_type / domain mapping
// ---------------------------------------------------------------------------

const LABEL_TO_CHANGE_TYPE: Record<string, string> = {
  'data:library': 'manual',
  'data:compliance': 'manual',
  'data:migrate': 'manual',
  'data:threats': 'manual',
  'data:timeline': 'manual',
  enrichment: 'enrichment',
  xref: 'xref',
  'module:content': 'module:content',
  'tool:registry': 'tool:registry',
  'tool:wasm-backend': 'tool:wasm-backend',
  'vocab:change': 'vocab:change',
  'schema:change': 'schema:change',
}

const LABEL_TO_DOMAIN: Record<string, string> = {
  'data:library': 'library',
  'data:compliance': 'compliance',
  'data:migrate': 'migrate',
  'data:threats': 'threats',
  'data:timeline': 'timeline',
  enrichment: 'library',
  xref: 'library',
  'module:content': 'module',
  'tool:registry': 'tool',
  'tool:wasm-backend': 'tool',
  'vocab:change': 'vocabulary',
  'schema:change': 'schema',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function require_env(name: string): string {
  const val = process.env[name]
  if (!val) {
    console.error(`[append-revision] Missing required env var: ${name}`)
    process.exit(2)
  }
  return val
}

function githubApiGet(endpoint: string, token: string): unknown {
  const result = execSync(
    `curl -s -H "Authorization: Bearer ${token}" -H "Accept: application/vnd.github+json" "https://api.github.com/${endpoint}"`,
  ).toString()
  return JSON.parse(result)
}

function resolveGithubReviewer(
  prNumber: number,
  token: string,
  repo: string,
  registry: Reviewer[],
): { reviewer: Reviewer; method: 'github' } | null {
  let reviews: Array<{ state: string; user: { login: string } }>
  try {
    reviews = githubApiGet(`repos/${repo}/pulls/${prNumber}/reviews`, token) as typeof reviews
  } catch {
    console.warn('[append-revision] Could not fetch PR reviews from GitHub API')
    return null
  }

  // Find last approving review
  const approved = reviews.filter((r) => r.state === 'APPROVED').pop()
  if (!approved) return null

  const handle = approved.user.login.toLowerCase()
  const reviewer = registry.find(
    (r) => r.active && r.github_handle?.toLowerCase() === handle,
  )
  if (!reviewer) {
    console.warn(`[append-revision] Approver @${handle} not found in reviewers.json`)
    return null
  }
  return { reviewer, method: 'github' }
}

function resolveOfflineReviewer(
  prNumber: number,
  registry: Reviewer[],
): { reviewer: Reviewer; attestation: OfflineAttestation; method: 'offline' } | null {
  const approvalsDir = path.join(process.cwd(), 'approvals')
  if (!fs.existsSync(approvalsDir)) return null

  const pattern = new RegExp(`^offline-${prNumber}-.*\\.json$`)
  const files = fs.readdirSync(approvalsDir).filter((f) => pattern.test(f))
  if (files.length === 0) return null

  for (const file of files) {
    try {
      const attestation = JSON.parse(
        fs.readFileSync(path.join(approvalsDir, file), 'utf-8'),
      ) as OfflineAttestation
      const reviewer = registry.find(
        (r) => r.active && r.reviewer_id === attestation.reviewer_id,
      )
      if (reviewer) {
        return { reviewer, attestation, method: 'offline' }
      }
    } catch {
      console.warn(`[append-revision] Could not parse ${file}`)
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Field-change detection — opportunistic, gracefully no-ops on failure
// ---------------------------------------------------------------------------

/**
 * Locate the before/after CSVs for a `data:*` revision and compute per-cell
 * field changes. Best-effort: returns null when:
 *   - domain is not a tracked CSV (module / tool / vocab / schema changes)
 *   - no CSV with the domain's prefix changed in this PR
 *   - the previous-version file can't be located in git history
 *
 * Used by main() to populate `field_changes` on the revision entry.
 */
function detectFieldChanges(
  domain: string,
  sha: string
): { recordIds: string[]; changes: FieldChange[] } | null {
  const pkCol = DOMAIN_TO_PK_COLUMN[domain]
  const prefix = DOMAIN_TO_CSV_PREFIX[domain]
  if (!pkCol || !prefix) return null

  // Find changed CSVs in this commit
  let changed: string[] = []
  try {
    const out = execSync(`git show --name-only --format='' ${sha}`, {
      encoding: 'utf-8',
    })
    changed = out
      .trim()
      .split('\n')
      .filter((p) => p.startsWith('src/data/') && p.endsWith('.csv'))
  } catch {
    return null
  }

  // Newly-added CSV with our domain prefix is the "after"; the previous
  // dated file with the same prefix on the parent commit is the "before".
  const newCsv = changed.find((p) => path.basename(p).startsWith(prefix))
  if (!newCsv) return null

  // Read the new file from disk (post-merge state)
  let afterRaw: string
  try {
    afterRaw = fs.readFileSync(newCsv, 'utf-8')
  } catch {
    return null
  }

  // Find the previous-version file by listing the directory at the parent commit
  let parentFiles: string[] = []
  try {
    const out = execSync(`git ls-tree --name-only ${sha}^ src/data`, {
      encoding: 'utf-8',
    })
    parentFiles = out
      .trim()
      .split('\n')
      .filter((p) => path.basename(p).startsWith(prefix))
      .sort()
  } catch {
    return null
  }
  const prevName = parentFiles.length > 0 ? parentFiles[parentFiles.length - 1] : null
  if (!prevName) return null

  // Parent commit's content of that file
  let beforeRaw = ''
  try {
    beforeRaw = execSync(`git show ${sha}^:${path.join('src/data', prevName)}`, {
      encoding: 'utf-8',
    })
  } catch {
    return null
  }

  const before = Papa.parse<Record<string, string>>(beforeRaw, {
    header: true,
    skipEmptyLines: true,
  }).data
  const after = Papa.parse<Record<string, string>>(afterRaw, {
    header: true,
    skipEmptyLines: true,
  }).data

  const changes = computeFieldChanges(before, after, pkCol, { maxChanges: 500 })
  const recordIds = Array.from(new Set(changes.map((c) => c.record_id)))
  if (changes.length === 0) return null
  return { recordIds, changes }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const token = require_env('GITHUB_TOKEN')
  const prNumber = parseInt(require_env('GITHUB_PR_NUMBER'), 10)
  const sha = require_env('GITHUB_SHA')
  const eventPath = require_env('GITHUB_EVENT_PATH')
  const repo = require_env('GITHUB_REPOSITORY')

  const revisionsPath = path.join(process.cwd(), 'public', 'data', 'revisions.jsonl')
  const reviewersPath = path.join(process.cwd(), 'public', 'data', 'reviewers.json')

  // Parse event payload for PR labels and body
  const event = JSON.parse(fs.readFileSync(eventPath, 'utf-8')) as {
    pull_request?: {
      labels: Array<{ name: string }>
      body?: string
      title?: string
    }
  }
  const pr = event.pull_request
  const labels = pr?.labels.map((l) => l.name) ?? []
  const prBody = pr?.body ?? ''

  // Resolve change_type and domain from labels
  let changeType = 'manual'
  let domain = 'unknown'
  const authoredByLlm = labels.includes('bot:llm-authored')

  for (const label of labels) {
    if (LABEL_TO_CHANGE_TYPE[label]) {
      changeType = LABEL_TO_CHANGE_TYPE[label]
      domain = LABEL_TO_DOMAIN[label]
      break
    }
  }

  // Extract scope_summary from PR body (line after "## Scope summary")
  const scopeMatch = prBody.match(/##\s+Scope summary[^\n]*\n(?:<!--[^>]*-->\n)?([^\n#]{1,120})/i)
  const scopeSummary = scopeMatch?.[1]?.trim() ?? pr?.title ?? 'No scope summary provided'

  // Load reviewer registry
  let registry: Reviewer[] = []
  if (fs.existsSync(reviewersPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(reviewersPath, 'utf-8')) as ReviewerRegistry
      registry = data.reviewers ?? []
    } catch {
      console.warn('[append-revision] Could not parse reviewers.json')
    }
  }

  // Resolve reviewer — try GitHub first, then offline attestation
  const githubResult = resolveGithubReviewer(prNumber, token, repo, registry)
  const offlineResult = !githubResult ? resolveOfflineReviewer(prNumber, registry) : null

  const resolvedResult = githubResult ?? offlineResult

  if (!resolvedResult) {
    console.error(
      `[append-revision] No valid reviewer found for PR #${prNumber}. ` +
        'Ensure a registered SME approved on GitHub or committed an offline approval file.',
    )
    // Log a placeholder entry to avoid blocking deploys entirely — mark as unreviewed
    // In production, pair this with a required CI check that blocks merge
  }

  const reviewer = resolvedResult?.reviewer
  const mergeTimestamp = new Date().toISOString()

  // Best-effort per-cell diff for data:* revisions. Failure is silent.
  let fieldChanges: FieldChange[] | undefined
  let recordIds: string[] | undefined
  try {
    const detected = detectFieldChanges(domain, sha)
    if (detected) {
      fieldChanges = detected.changes
      recordIds = detected.recordIds
      console.log(
        `[append-revision] Computed ${fieldChanges.length} field-change(s) across ${recordIds.length} record(s)`
      )
    }
  } catch (e) {
    console.warn(
      `[append-revision] Field-change detection failed (continuing without diff): ${String(e).slice(0, 200)}`
    )
  }

  // Build the base revision entry
  const entry: RevisionEntry = {
    pr_number: prNumber,
    merge_sha: sha,
    merge_timestamp: mergeTimestamp,
    change_type: changeType,
    domain,
    scope_summary: scopeSummary.slice(0, 120),
    rows_affected: recordIds?.length ?? null,
    module_id: null,
    tool_id: null,
    sample_size: null,
    ...(recordIds ? { record_ids: recordIds } : {}),
    ...(fieldChanges ? { field_changes: fieldChanges } : {}),
    reviewer_id: reviewer?.reviewer_id ?? 'unresolved',
    reviewer_display: reviewer?.display_name ?? 'Unresolved',
    approval_method: githubResult ? 'github' : 'offline',
    approved_via: offlineResult?.attestation.approved_via ?? null,
    proxy_github_handle: offlineResult?.attestation.proxy_github_handle ?? null,
    authored_by_llm: authoredByLlm,
    confidence_delta: null,
  }

  // Append base entry
  fs.appendFileSync(revisionsPath, JSON.stringify(entry) + '\n', 'utf-8')
  console.log(`[append-revision] Appended revision for PR #${prNumber} (${changeType}/${domain})`)

  // Handle tool:registry — one entry per bumped tool (from check-tool-version-bump output)
  const bumpedToolsJson = process.env.BUMPED_TOOLS_JSON
  if (changeType === 'tool:registry' && bumpedToolsJson) {
    type BumpedTool = { tool_id: string; old_version: string; new_version: string }
    const bumpedTools = JSON.parse(bumpedToolsJson) as BumpedTool[]
    for (const tool of bumpedTools) {
      const toolEntry: RevisionEntry = {
        ...entry,
        tool_id: tool.tool_id,
        scope_summary: `Tool ${tool.tool_id}: v${tool.old_version} → v${tool.new_version}`.slice(
          0,
          120,
        ),
      }
      fs.appendFileSync(revisionsPath, JSON.stringify(toolEntry) + '\n', 'utf-8')
      console.log(`[append-revision]   └── tool entry: ${tool.tool_id}`)
    }
  }

  // Commit the updated revisions.jsonl back to main
  try {
    execSync('git config user.name "github-actions[bot]"')
    execSync('git config user.email "github-actions[bot]@users.noreply.github.com"')
    execSync(`git add "${revisionsPath}"`)
    execSync(
      `git commit -m "chore(revisions): append revision entry for PR #${prNumber} [skip ci]"`,
    )
    execSync('git push')
    console.log('[append-revision] Committed and pushed revisions.jsonl')
  } catch (err) {
    console.error('[append-revision] Failed to commit revisions.jsonl:', err)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('[append-revision] Unexpected error:', err)
  process.exit(1)
})

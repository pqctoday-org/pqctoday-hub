#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * validate-offline-attestation.ts — PR-time CI gate
 *
 * Implements the offline-attestation classifier described in the trust-
 * engine explainability doc §5.3. When an SME without a GitHub account
 * approves a PR through email / phone / signed document, a GitHub-enabled
 * maintainer commits `approvals/offline-{pr_number}-{reviewer_id}.json`
 * to the PR branch. This script runs on the PR and verifies:
 *
 *   1. The JSON file matches the required schema (all fields present,
 *      `justification` ≥ 20 chars, `approved_via` in the closed set,
 *      `review_date` is ISO 8601 and within reasonable bounds).
 *   2. The `reviewer_id` resolves to an **active** entry in
 *      public/data/reviewers.json.
 *   3. The `proxy_github_handle` is a member of at least one CODEOWNERS
 *      team that owns at least one file changed in this PR.
 *
 * Exits non-zero on any validation failure. Exits 0 when:
 *   - No `approvals/offline-{pr}-*.json` files are present (the common
 *     case — most PRs are approved on GitHub directly), OR
 *   - All offline attestations validate cleanly.
 *
 * Required env vars (set by GitHub Actions):
 *   GITHUB_TOKEN          — must have `read:org` (for team membership)
 *                            and `pull-requests:read` (for changed files)
 *   GITHUB_PR_NUMBER      — PR number under review
 *   GITHUB_REPOSITORY     — "owner/repo"
 *
 * Optional:
 *   OFFLINE_ATTESTATION_SKIP_TEAM_CHECK=1 — emit warning instead of failing
 *                                            when team-membership API is
 *                                            inaccessible (used for local
 *                                            dry-runs without an org-scoped
 *                                            PAT). Default: strict.
 *
 * Exit codes:
 *   0 — pass (no attestations OR all valid)
 *   1 — at least one attestation is invalid; merge should be blocked
 *   2 — configuration error (missing env vars, unreadable registry)
 */
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OfflineAttestation {
  reviewer_id: string
  proxy_github_handle: string
  review_date: string
  approved_via: string
  justification: string
  evidence_ref?: string
}

export interface Reviewer {
  reviewer_id: string
  github_handle: string | null
  display_name: string
  active: boolean
  domains: string[]
}

export interface ReviewerRegistry {
  reviewers: Reviewer[]
}

export type ValidationResult = { ok: true } | { ok: false; errors: string[] }

const APPROVED_VIA_VALUES = new Set(['email', 'call', 'meeting', 'signed-doc'])
const JUSTIFICATION_MIN_LENGTH = 20
const REVIEW_DATE_MAX_AGE_DAYS = 90

// ---------------------------------------------------------------------------
// Schema validation — pure function, unit-tested
// ---------------------------------------------------------------------------

/**
 * Validates the structural and content-level properties of an offline
 * attestation. Does NOT call out to GitHub — that's a separate step in
 * the orchestrator (so this function is deterministic and testable).
 *
 * The `prCreatedAt` parameter is the PR's `created_at` timestamp; the
 * `review_date` on the attestation must be within
 * REVIEW_DATE_MAX_AGE_DAYS before the PR creation (allowing the SME's
 * approval to predate the PR slightly when the maintainer batches up
 * approvals) and must not be in the future.
 */
export function validateAttestation(
  attestation: unknown,
  reviewers: Reviewer[],
  prCreatedAt: Date,
  now: Date = new Date()
): ValidationResult {
  const errors: string[] = []

  if (!attestation || typeof attestation !== 'object') {
    return { ok: false, errors: ['attestation must be a JSON object'] }
  }
  const a = attestation as Record<string, unknown>

  // Required string fields
  for (const field of [
    'reviewer_id',
    'proxy_github_handle',
    'review_date',
    'approved_via',
    'justification',
  ]) {
    const v = a[field]
    if (typeof v !== 'string' || !v.trim()) {
      errors.push(`missing or empty required field: ${field}`)
    }
  }

  // Stop early on missing-field errors — the checks below assume strings.
  if (errors.length > 0) return { ok: false, errors }

  const reviewerId = (a.reviewer_id as string).trim()
  const proxyHandle = (a.proxy_github_handle as string).trim().replace(/^@/, '')
  const reviewDate = (a.review_date as string).trim()
  const approvedVia = (a.approved_via as string).trim()
  const justification = (a.justification as string).trim()

  if (!APPROVED_VIA_VALUES.has(approvedVia)) {
    errors.push(
      `approved_via must be one of: ${Array.from(APPROVED_VIA_VALUES).join(', ')} (got "${approvedVia}")`
    )
  }

  if (justification.length < JUSTIFICATION_MIN_LENGTH) {
    errors.push(
      `justification must be at least ${JUSTIFICATION_MIN_LENGTH} chars (got ${justification.length})`
    )
  }

  // ISO 8601 date — accept YYYY-MM-DD or full ISO timestamps
  const parsedDate = new Date(reviewDate)
  if (Number.isNaN(parsedDate.getTime())) {
    errors.push(`review_date is not a valid ISO 8601 date (got "${reviewDate}")`)
  } else {
    if (parsedDate.getTime() > now.getTime()) {
      errors.push(`review_date is in the future (got "${reviewDate}")`)
    }
    const ageDays = (prCreatedAt.getTime() - parsedDate.getTime()) / (1000 * 60 * 60 * 24)
    if (ageDays > REVIEW_DATE_MAX_AGE_DAYS) {
      errors.push(
        `review_date is more than ${REVIEW_DATE_MAX_AGE_DAYS} days before PR creation ` +
          `(got "${reviewDate}", PR created ${prCreatedAt.toISOString()})`
      )
    }
  }

  // Reviewer must exist and be active
  const reviewer = reviewers.find((r) => r.reviewer_id === reviewerId)
  if (!reviewer) {
    errors.push(`reviewer_id "${reviewerId}" not found in reviewers.json`)
  } else if (!reviewer.active) {
    errors.push(`reviewer "${reviewerId}" is not marked active in reviewers.json`)
  }

  // Proxy handle sanity (real team-membership check is a separate step)
  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/.test(proxyHandle)) {
    errors.push(`proxy_github_handle "${proxyHandle}" is not a valid GitHub username`)
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors }
}

// ---------------------------------------------------------------------------
// CODEOWNERS parsing — pure function, unit-tested
// ---------------------------------------------------------------------------

interface CodeownersRule {
  /** Glob-like pattern, e.g. "src/data/library_*.csv". */
  pattern: string
  /** Owners — usernames (@user) and teams (@org/team). */
  owners: string[]
}

/**
 * Parses a CODEOWNERS file into rules. Skips comment lines and blanks.
 * Each rule line is `<pattern>  <owner1> <owner2> …`.
 */
export function parseCodeowners(text: string): CodeownersRule[] {
  const rules: CodeownersRule[] = []
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.split('#')[0].trim()
    if (!line) continue
    const parts = line.split(/\s+/)
    if (parts.length < 2) continue
    rules.push({ pattern: parts[0], owners: parts.slice(1) })
  }
  return rules
}

/**
 * Resolves the set of team slugs (e.g. `pqctoday-org/library-smes`) that
 * own any file in `changedFiles` per CODEOWNERS rules. Only `@org/team`
 * owners are returned — individual @user owners are excluded, since
 * offline attestations are validated against teams.
 *
 * Each file gets the *last matching* rule's owners (standard CODEOWNERS
 * semantics: later rules override earlier ones).
 */
export function teamsOwningChangedFiles(
  rules: CodeownersRule[],
  changedFiles: string[]
): Set<string> {
  const teams = new Set<string>()
  for (const file of changedFiles) {
    let lastMatch: CodeownersRule | null = null
    for (const rule of rules) {
      if (codeownersGlobMatch(rule.pattern, file)) lastMatch = rule
    }
    if (!lastMatch) continue
    for (const owner of lastMatch.owners) {
      if (owner.includes('/')) teams.add(owner.replace(/^@/, ''))
    }
  }
  return teams
}

/**
 * CODEOWNERS-style glob match. Supports `**`, `*`, prefix `/`, trailing
 * `/`. Translated to a RegExp at call time. Sufficient for the patterns
 * actually used in this repo's CODEOWNERS (see `.github/CODEOWNERS`).
 */
export function codeownersGlobMatch(pattern: string, filePath: string): boolean {
  // `*` matches anything in the catch-all rule. Handle it explicitly so
  // the rest of the translation can stay simple.
  if (pattern === '*') return true

  let p = pattern
  // Leading "/" anchors to repo root. CODEOWNERS treats unanchored
  // patterns as matching anywhere; we replicate that for both forms.
  if (p.startsWith('/')) p = p.slice(1)
  const trailingSlash = p.endsWith('/')
  if (trailingSlash) p = p.slice(0, -1)

  // Translate glob to regex.
  let re =
    '^' +
    p
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*/g, '__DOUBLESTAR__')
      .replace(/\*/g, '[^/]*')
      .replace(/__DOUBLESTAR__/g, '.*')
  if (trailingSlash) re += '(?:/.*)?'
  re += '$'

  if (new RegExp(re).test(filePath)) return true
  // Unanchored patterns match basenames too.
  if (!pattern.startsWith('/') && !pattern.includes('/')) {
    return new RegExp(re).test(path.basename(filePath))
  }
  return false
}

// ---------------------------------------------------------------------------
// GitHub API thin client — injected as deps so tests don't hit the network
// ---------------------------------------------------------------------------

/* eslint-disable no-unused-vars -- parameter names here document the interface contract */
export interface GithubClient {
  listChangedFiles(prNumber: number): Promise<string[]>
  getPullRequest(prNumber: number): Promise<{ created_at: string }>
  isTeamMember(orgTeam: string, handle: string): Promise<boolean | 'unknown'>
}
/* eslint-enable no-unused-vars */

function makeRealGithubClient(token: string, repo: string): GithubClient {
  const headers = `-H "Authorization: Bearer ${token}" -H "Accept: application/vnd.github+json"`
  return {
    async listChangedFiles(prNumber) {
      const out = execSync(
        `curl -s ${headers} "https://api.github.com/repos/${repo}/pulls/${prNumber}/files?per_page=100"`
      ).toString()
      const data = JSON.parse(out) as Array<{ filename: string }>
      if (!Array.isArray(data)) return []
      return data.map((f) => f.filename)
    },
    async getPullRequest(prNumber) {
      const out = execSync(
        `curl -s ${headers} "https://api.github.com/repos/${repo}/pulls/${prNumber}"`
      ).toString()
      return JSON.parse(out) as { created_at: string }
    },
    async isTeamMember(orgTeam, handle) {
      // orgTeam looks like "pqctoday-org/library-smes"
      const [org, team] = orgTeam.split('/')
      if (!org || !team) return 'unknown'
      try {
        // Use -w to capture the HTTP status separately from the (empty) body.
        const status = execSync(
          `curl -s -o /dev/null -w "%{http_code}" ${headers} ` +
            `"https://api.github.com/orgs/${org}/teams/${team}/memberships/${handle}"`
        )
          .toString()
          .trim()
        if (status === '200') return true
        if (status === '404') return false
        // 401 / 403 = insufficient token scope; surface as "unknown" so the
        // caller can decide whether to warn or fail.
        return 'unknown'
      } catch {
        return 'unknown'
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

interface RunOptions {
  approvalsDir: string
  reviewersPath: string
  codeownersPath: string
  prNumber: number
  github: GithubClient
  skipTeamCheck?: boolean
  // eslint-disable-next-line no-unused-vars -- function-type parameter, documents the callback contract
  log?: (msg: string) => void
}

/**
 * Returns the list of attestation files found in `approvalsDir` for the
 * given PR. Exposed for testing.
 */
export function findAttestationFiles(approvalsDir: string, prNumber: number): string[] {
  if (!fs.existsSync(approvalsDir)) return []
  // eslint-disable-next-line security/detect-non-literal-regexp -- prNumber is a parsed integer; pattern shape is fixed
  const pattern = new RegExp(`^offline-${prNumber}-.*\\.json$`)
  return fs.readdirSync(approvalsDir).filter((f) => pattern.test(f))
}

export async function run(opts: RunOptions): Promise<number> {
  const log = opts.log ?? ((m: string) => console.log(m))

  const files = findAttestationFiles(opts.approvalsDir, opts.prNumber)
  if (files.length === 0) {
    log(`[validate-offline] No offline attestations for PR #${opts.prNumber} — nothing to check`)
    return 0
  }

  if (!fs.existsSync(opts.reviewersPath)) {
    console.error(`[validate-offline] reviewers.json not found at ${opts.reviewersPath}`)
    return 2
  }
  const registry = JSON.parse(fs.readFileSync(opts.reviewersPath, 'utf-8')) as ReviewerRegistry
  const reviewers = registry.reviewers ?? []

  if (!fs.existsSync(opts.codeownersPath)) {
    console.error(`[validate-offline] CODEOWNERS not found at ${opts.codeownersPath}`)
    return 2
  }
  const codeownersText = fs.readFileSync(opts.codeownersPath, 'utf-8')
  const rules = parseCodeowners(codeownersText)

  const changedFiles = await opts.github.listChangedFiles(opts.prNumber)
  const allowedTeams = teamsOwningChangedFiles(rules, changedFiles)
  log(
    `[validate-offline] PR #${opts.prNumber}: ${files.length} attestation(s), ${changedFiles.length} ` +
      `changed file(s), ${allowedTeams.size} owning team(s): ${[...allowedTeams].join(', ') || '(none)'}`
  )

  const pr = await opts.github.getPullRequest(opts.prNumber)
  const prCreatedAt = new Date(pr.created_at)

  let allOk = true
  for (const file of files) {
    log(`[validate-offline] Validating ${file}`)
    const filePath = path.join(opts.approvalsDir, file)
    let attestation: unknown
    try {
      attestation = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    } catch (e) {
      console.error(`  ✗ ${file}: not valid JSON (${String(e).slice(0, 120)})`)
      allOk = false
      continue
    }

    const schema = validateAttestation(attestation, reviewers, prCreatedAt)
    if (!schema.ok) {
      for (const err of schema.errors) console.error(`  ✗ ${file}: ${err}`)
      allOk = false
      continue
    }

    const proxyHandle = ((attestation as OfflineAttestation).proxy_github_handle || '')
      .trim()
      .replace(/^@/, '')

    if (allowedTeams.size === 0) {
      console.error(
        `  ✗ ${file}: no CODEOWNERS team owns any file changed in this PR — ` +
          `offline attestation has nothing to gate against`
      )
      allOk = false
      continue
    }

    // Verify proxy is a member of at least one owning team
    let foundInTeam: string | null = null
    let anyUnknown = false
    for (const team of allowedTeams) {
      const result = await opts.github.isTeamMember(team, proxyHandle)
      if (result === true) {
        foundInTeam = team
        break
      }
      if (result === 'unknown') anyUnknown = true
    }

    if (foundInTeam) {
      log(`  ✓ ${file}: proxy @${proxyHandle} is a member of ${foundInTeam}`)
      continue
    }

    if (anyUnknown) {
      const msg =
        `${file}: could not verify @${proxyHandle} team membership (GitHub API returned ` +
        `insufficient-scope / 403). Token needs read:org scope. Owning teams: ` +
        `${[...allowedTeams].join(', ')}.`
      if (opts.skipTeamCheck) {
        console.warn(`  ⚠ ${msg} — accepting because OFFLINE_ATTESTATION_SKIP_TEAM_CHECK=1`)
        continue
      }
      console.error(`  ✗ ${msg}`)
      allOk = false
      continue
    }

    console.error(
      `  ✗ ${file}: proxy @${proxyHandle} is not a member of any CODEOWNERS team that ` +
        `owns this PR's changed files (${[...allowedTeams].join(', ')})`
    )
    allOk = false
  }

  return allOk ? 0 : 1
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const requireEnv = (name: string): string => {
    const val = process.env[name]
    if (!val) {
      console.error(`[validate-offline] Missing required env var: ${name}`)
      process.exit(2)
    }
    return val
  }

  const token = requireEnv('GITHUB_TOKEN')
  const prNumber = parseInt(requireEnv('GITHUB_PR_NUMBER'), 10)
  const repo = requireEnv('GITHUB_REPOSITORY')

  const code = await run({
    approvalsDir: path.join(process.cwd(), 'approvals'),
    reviewersPath: path.join(process.cwd(), 'public', 'data', 'reviewers.json'),
    codeownersPath: path.join(process.cwd(), '.github', 'CODEOWNERS'),
    prNumber,
    github: makeRealGithubClient(token, repo),
    skipTeamCheck: process.env.OFFLINE_ATTESTATION_SKIP_TEAM_CHECK === '1',
  })
  process.exit(code)
}

// Detect ESM "called as script" (vitest imports without running main).
// scripts/ci/append-revision.ts uses the same pattern via `main().catch(...)`
// at the bottom of the file, but ours is tested, so guard behind a check.
if (
  typeof process !== 'undefined' &&
  process.argv[1] &&
  process.argv[1].endsWith('validate-offline-attestation.ts')
) {
  main().catch((err) => {
    console.error('[validate-offline] Unexpected error:', err)
    process.exit(2)
  })
}

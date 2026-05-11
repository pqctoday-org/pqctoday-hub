#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * classify-pr-cli.ts — thin CLI wrapper around `classifyPr()` for use from
 * the GitHub Actions workflow `.github/workflows/classify-pr.yml`.
 *
 * Inputs (env):
 *   CHANGED_FILES_JSON  — JSON array of changed paths (workflow fetches via gh pr diff)
 *   PR_LABELS_JSON      — JSON array of existing PR label names
 *
 * Outputs (stdout, GitHub Actions parsable):
 *   inferred_labels=<comma-list>
 *   unambiguous=<true|false>
 *   comment_path=<path-to-md-file>
 *
 * Exit codes:
 *   0 — classification produced (regardless of label count)
 *   2 — env/parse error
 */
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { classifyPr } from './classifyPr'

function parseEnvJson<T>(name: string, fallback: T): T {
  const raw = process.env[name]
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    console.error(`[classify-pr] Env var ${name} is not valid JSON`)
    process.exit(2)
  }
}

function setOutput(key: string, value: string): void {
  const out = process.env.GITHUB_OUTPUT
  if (!out) {
    console.log(`${key}=${value}`)
    return
  }
  // GitHub Actions multi-line-safe output
  if (value.includes('\n')) {
    fs.appendFileSync(out, `${key}<<EOF\n${value}\nEOF\n`, 'utf-8')
  } else {
    fs.appendFileSync(out, `${key}=${value}\n`, 'utf-8')
  }
}

function main(): number {
  const changedFiles = parseEnvJson<string[]>('CHANGED_FILES_JSON', [])
  const prLabels = parseEnvJson<string[]>('PR_LABELS_JSON', [])
  const r = classifyPr(changedFiles, prLabels)

  // Persist comment body to a tmp file for the workflow to upload.
  const commentPath = path.join(os.tmpdir(), 'pr-classifier-comment.md')
  fs.writeFileSync(commentPath, r.comment, 'utf-8')

  setOutput('inferred_labels', r.inferredLabels.join(','))
  setOutput('unambiguous', String(r.unambiguous))
  setOutput('comment_path', commentPath)
  setOutput('comment', r.comment)

  // Echo a summary to logs
  console.log(`[classify-pr] inferred=${r.inferredLabels.join(',') || '(none)'}`)
  console.log(`[classify-pr] unambiguous=${r.unambiguous}`)
  console.log(`[classify-pr] unclassified-files=${r.unclassifiedFiles.length}`)
  return 0
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main())
}

#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * post-csv-diff.ts — PR event CI step
 *
 * Detects touched CSV files in a PR, produces a formatted diff per change type,
 * and posts (or updates) a single bot comment on the PR.
 *
 * Required env vars:
 *   GITHUB_TOKEN       — needs pull-requests:write permission
 *   GITHUB_PR_NUMBER   — PR number
 *   GITHUB_REPOSITORY  — "owner/repo"
 *   PR_LABELS          — comma-separated list of PR labels (set by prior CI step)
 *
 * Exit code: always 0 (non-blocking — diff comment failure must not block PR)
 */
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import daff from 'daff'

const MAX_DIFF_ROWS = 100
const BOT_COMMENT_MARKER = '<!-- trust-engine-csv-diff -->'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ChangeTypeLabel =
  | 'data:library'
  | 'data:compliance'
  | 'data:migrate'
  | 'data:threats'
  | 'data:timeline'
  | 'enrichment'
  | 'xref'
  | 'schema:change'
  | string

interface DiffRow {
  action: string // '@', '+', '-', '!'
  cells: string[]
}

// ---------------------------------------------------------------------------
// GitHub API helpers
// ---------------------------------------------------------------------------

function githubPost(endpoint: string, token: string, body: unknown): unknown {
  const payload = JSON.stringify(body)
  const result = execSync(
    `curl -s -X POST -H "Authorization: Bearer ${token}" ` +
      `-H "Accept: application/vnd.github+json" ` +
      `-H "Content-Type: application/json" ` +
      `-d '${payload.replace(/'/g, "'\\''")}' ` +
      `"https://api.github.com/${endpoint}"`,
  ).toString()
  return JSON.parse(result)
}

function githubPatch(endpoint: string, token: string, body: unknown): unknown {
  const payload = JSON.stringify(body)
  const result = execSync(
    `curl -s -X PATCH -H "Authorization: Bearer ${token}" ` +
      `-H "Accept: application/vnd.github+json" ` +
      `-H "Content-Type: application/json" ` +
      `-d '${payload.replace(/'/g, "'\\''")}' ` +
      `"https://api.github.com/${endpoint}"`,
  ).toString()
  return JSON.parse(result)
}

function githubApiGet(endpoint: string, token: string): unknown {
  const result = execSync(
    `curl -s -H "Authorization: Bearer ${token}" ` +
      `-H "Accept: application/vnd.github+json" ` +
      `"https://api.github.com/${endpoint}"`,
  ).toString()
  return JSON.parse(result)
}

// ---------------------------------------------------------------------------
// daff CSV diff
// ---------------------------------------------------------------------------

function parseCsvText(text: string): string[][] {
  // Simple CSV parser for diffing — daff accepts 2D arrays
  const rows: string[][] = []
  for (const line of text.split('\n')) {
    if (line.trim() === '') continue
    // Basic split — handles quoted fields with commas
    const cells: string[] = []
    let inQuotes = false
    let current = ''
    for (const ch of line) {
      if (ch === '"') {
        inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        cells.push(current)
        current = ''
      } else {
        current += ch
      }
    }
    cells.push(current)
    rows.push(cells)
  }
  return rows
}

function daffDiff(baseCsv: string, headCsv: string): DiffRow[] {
  const baseRows = parseCsvText(baseCsv)
  const headRows = parseCsvText(headCsv)

  const baseTable = new daff.TableView(baseRows)
  const headTable = new daff.TableView(headRows)

  const alignment = daff.compareTables(baseTable, headTable).align()
  const flags = new daff.CompareFlags()
  flags.show_unchanged = false
  flags.show_unchanged_columns = false

  const diffTable = new daff.TableView([])
  daff.renderTable(alignment, baseTable, headTable, diffTable, flags)

  const result: DiffRow[] = []
  const data = diffTable.getData() as string[][]
  for (const row of data) {
    if (row.length === 0) continue
    result.push({ action: row[0] ?? '', cells: row.slice(1) })
  }
  return result
}

// ---------------------------------------------------------------------------
// Comment formatters
// ---------------------------------------------------------------------------

function formatManualDiff(csvFile: string, rows: DiffRow[], headers: string[]): string {
  if (rows.length === 0) return `**${csvFile}**: no cell-level changes detected.\n`

  const truncated = rows.length > MAX_DIFF_ROWS
  const displayRows = rows.slice(0, MAX_DIFF_ROWS)

  const colHeader = `| Action | ${headers.join(' | ')} |`
  const colSep = `| --- | ${headers.map(() => '---').join(' | ')} |`
  const body = displayRows
    .map((r) => {
      const icon = r.action === '+' ? '✅' : r.action === '-' ? '❌' : '✏️'
      const cells = r.cells.map((c) => c.replace(/\|/g, '\\|')).join(' | ')
      return `| ${icon} ${r.action} | ${cells} |`
    })
    .join('\n')

  const suffix = truncated
    ? `\n\n> ⚠️ Showing ${MAX_DIFF_ROWS} of ${rows.length} rows. Full diff: [PR Files tab]`
    : ''

  return `**${csvFile}**\n\n${colHeader}\n${colSep}\n${body}${suffix}\n`
}

function formatEnrichmentSummary(
  csvFile: string,
  rows: DiffRow[],
  labels: string[],
): string {
  const added = rows.filter((r) => r.action === '+').length
  const modified = rows.filter((r) => r.action === '!').length
  const model = labels.includes('bot:llm-authored') ? 'qwen3.6:27b' : 'unknown'
  return (
    `**${csvFile}** (enrichment batch)\n` +
    `- ${added} rows added · ${modified} rows modified\n` +
    `- Model: \`${model}\`\n`
  )
}

function formatSchemaDiff(csvFile: string, baseHeaders: string[], headHeaders: string[]): string {
  const added = headHeaders.filter((h) => !baseHeaders.includes(h))
  const removed = baseHeaders.filter((h) => !headHeaders.includes(h))
  const lines: string[] = [`**${csvFile}** (schema change)`]
  if (added.length) lines.push(`- ✅ Added columns: ${added.map((c) => `\`${c}\``).join(', ')}`)
  if (removed.length)
    lines.push(`- ❌ Removed columns: ${removed.map((c) => `\`${c}\``).join(', ')}`)
  if (!added.length && !removed.length) lines.push('- No column additions or removals detected.')
  return lines.join('\n') + '\n'
}

function formatXrefDiff(csvFile: string, rows: DiffRow[], headers: string[]): string {
  const xrefCols = ['from_concept', 'to_concept', 'relationship_type', 'evidence']
  const colIdxs = xrefCols.map((c) => headers.indexOf(c)).filter((i) => i !== -1)

  if (colIdxs.length === 0) return formatManualDiff(csvFile, rows, headers)

  const colHeader = `| Action | ${xrefCols.join(' | ')} |`
  const colSep = `| --- | ${xrefCols.map(() => '---').join(' | ')} |`
  const body = rows
    .slice(0, MAX_DIFF_ROWS)
    .map((r) => {
      const icon = r.action === '+' ? '✅' : r.action === '-' ? '❌' : '✏️'
      const cells = colIdxs.map((i) => (r.cells[i] ?? '').replace(/\|/g, '\\|')).join(' | ')
      return `| ${icon} ${r.action} | ${cells} |`
    })
    .join('\n')

  return `**${csvFile}** (xref edges)\n\n${colHeader}\n${colSep}\n${body}\n`
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const token = process.env.GITHUB_TOKEN
  const prNumber = process.env.GITHUB_PR_NUMBER
  const repo = process.env.GITHUB_REPOSITORY
  const labelsRaw = process.env.PR_LABELS ?? ''

  if (!token || !prNumber || !repo) {
    console.warn('[post-csv-diff] Missing required env vars — skipping CSV diff comment')
    return
  }

  const labels = labelsRaw
    .split(',')
    .map((l) => l.trim())
    .filter(Boolean)

  // Determine primary change type label
  const primaryLabel: ChangeTypeLabel =
    labels.find((l) =>
      [
        'data:library',
        'data:compliance',
        'data:migrate',
        'data:threats',
        'data:timeline',
        'enrichment',
        'xref',
        'schema:change',
      ].includes(l),
    ) ?? 'data:library'

  // Find touched CSV files
  let changedFiles: string[] = []
  try {
    const output = execSync('git diff --name-only origin/main...HEAD').toString()
    changedFiles = output
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f.endsWith('.csv') && fs.existsSync(f))
  } catch {
    console.warn('[post-csv-diff] Could not determine changed CSV files')
    return
  }

  if (changedFiles.length === 0) {
    console.log('[post-csv-diff] No CSV files changed — skipping comment')
    return
  }

  // Build diff comment body
  const sections: string[] = [
    BOT_COMMENT_MARKER,
    '## CSV Diff Report',
    `> Generated by Trust Engine · PR #${prNumber}\n`,
  ]

  for (const csvFile of changedFiles) {
    try {
      // Get base version from main branch
      let baseContent = ''
      try {
        baseContent = execSync(`git show origin/main:"${csvFile}"`).toString()
      } catch {
        // New file — no base
      }
      const headContent = fs.readFileSync(csvFile, 'utf-8')

      const baseRows = parseCsvText(baseContent)
      const headRows = parseCsvText(headContent)
      const baseHeaders = baseRows[0] ?? []
      const headHeaders = headRows[0] ?? []

      if (primaryLabel === 'schema:change') {
        sections.push(formatSchemaDiff(path.basename(csvFile), baseHeaders, headHeaders))
      } else {
        const diffRows = baseContent ? daffDiff(baseContent, headContent) : []
        if (primaryLabel === 'enrichment') {
          sections.push(formatEnrichmentSummary(path.basename(csvFile), diffRows, labels))
        } else if (primaryLabel === 'xref') {
          sections.push(formatXrefDiff(path.basename(csvFile), diffRows, baseHeaders))
        } else {
          sections.push(formatManualDiff(path.basename(csvFile), diffRows, baseHeaders))
        }
      }
    } catch (err) {
      sections.push(`**${path.basename(csvFile)}**: could not generate diff (${String(err)})\n`)
    }
  }

  const commentBody = sections.join('\n')

  // Find existing bot comment to update in place
  const existingComments = githubApiGet(
    `repos/${repo}/issues/${prNumber}/comments?per_page=100`,
    token,
  ) as Array<{ id: number; body: string }>

  const existingComment = existingComments.find?.((c) => c.body?.includes(BOT_COMMENT_MARKER))

  try {
    if (existingComment) {
      githubPatch(`repos/${repo}/issues/comments/${existingComment.id}`, token, {
        body: commentBody,
      })
      console.log(`[post-csv-diff] Updated existing comment ${existingComment.id}`)
    } else {
      githubPost(`repos/${repo}/issues/${prNumber}/comments`, token, { body: commentBody })
      console.log(`[post-csv-diff] Posted new CSV diff comment on PR #${prNumber}`)
    }
  } catch (err) {
    console.warn('[post-csv-diff] Failed to post comment:', err)
  }
}

main().catch((err) => {
  console.warn('[post-csv-diff] Non-fatal error:', err)
  // Always exit 0 — diff comment failure must not block the PR
  process.exit(0)
})

#!/usr/bin/env tsx
/**
 * scripts/audit-changelog-persona-tags.ts
 *
 * Makes the `[persona:id]` changelog convention real, going forward.
 *
 * WHY THIS EXISTS. The /changelog page offers a "For me" filter. Only about 25
 * of ~1,150 entries carry an explicit `[persona:…]` tag, so the overwhelming
 * majority of what that filter returns is a keyword regex GUESS. The 2026-08-10
 * remediation made the control honest — it now states how many results are
 * tagged and how many are guessed — but honesty about a bad ratio does not
 * improve the ratio.
 *
 * The convention itself already exists and is already documented in
 * CHANGELOG.md's own header. What was missing was anything that noticed when a
 * new entry ignored it. This is that.
 *
 * WHAT IT DELIBERATELY DOES NOT DO. It does not demand retro-tagging. Nobody
 * can now reconstruct, honestly, which roles a 2025 entry was written for, and
 * a gate that forced someone to guess would manufacture exactly the false
 * precision the "For me" fix removed. So it checks ONLY the most recent release
 * block — the one being written — and every older entry is left alone.
 *
 * That scoping is the whole design: the ratio improves one release at a time,
 * by the only people who can know the answer, at the moment they still know it.
 *
 * Modes:
 *   (default) human-readable report, exit 1 on any untagged entry
 *   --json    machine-readable summary
 *
 * Run via:  npm run audit:changelog-personas
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const VALID_PERSONAS = new Set([
  'executive',
  'developer',
  'architect',
  'researcher',
  'ops',
  'curious',
])

interface Offender {
  line: number
  text: string
  reason: string
}

const source = readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8')
const lines = source.split('\n')

// The most recent release block: from the first `## [x.y.z]` heading to the
// next one. That is the release currently being written.
const headingIdxs: number[] = []
lines.forEach((l, i) => {
  if (/^## \[\d+\.\d+\.\d+\]/.test(l)) headingIdxs.push(i)
})

const offenders: Offender[] = []
let checked = 0
let releaseLabel = '(none found)'

if (headingIdxs.length > 0) {
  const start = headingIdxs[0]
  const end = headingIdxs[1] ?? lines.length
  releaseLabel = lines[start].trim()

  for (let i = start; i < end; i++) {
    const line = lines[i]
    // An entry is a top-level bullet. Continuation lines and nested bullets are
    // part of the entry above them, not entries of their own.
    if (!/^- /.test(line)) continue
    checked += 1

    const tags = [...line.matchAll(/\[persona:([^\]]+)\]/g)].map((m) => m[1].trim())
    if (tags.length === 0) {
      offenders.push({
        line: i + 1,
        text: line.slice(0, 100),
        reason:
          'no [persona:id] tag — the "For me" filter has to fall back to a keyword guess for this entry',
      })
      continue
    }
    for (const tag of tags) {
      if (!VALID_PERSONAS.has(tag)) {
        offenders.push({
          line: i + 1,
          text: line.slice(0, 100),
          reason: `unknown persona "${tag}" — valid ids: ${[...VALID_PERSONAS].join(', ')}`,
        })
      }
    }
  }
}

const json = process.argv.includes('--json')

if (json) {
  process.stdout.write(
    `${JSON.stringify({ ok: offenders.length === 0, release: releaseLabel, checked, offenders }, null, 2)}\n`
  )
} else {
  process.stdout.write('\nchangelog persona tags\n')
  process.stdout.write(`  · latest release: ${releaseLabel}\n`)
  process.stdout.write(
    `  · ${checked} entr${checked === 1 ? 'y' : 'ies'} checked (this release only)\n`
  )
  if (offenders.length === 0) {
    process.stdout.write(
      '\n  PASS — every entry in the current release names the roles it is for.\n\n'
    )
  } else {
    process.stdout.write(`\n  FAIL — ${offenders.length} entr(y/ies) need a [persona:id] tag:\n\n`)
    for (const o of offenders) {
      process.stdout.write(`  CHANGELOG.md:${o.line}\n    ${o.text}…\n    → ${o.reason}\n\n`)
    }
    process.stdout.write(
      '  Valid ids: executive, developer, architect, researcher, ops, curious.\n' +
        '  Tag every role the change actually affects — several tags on one entry is normal.\n\n'
    )
  }
}

process.exit(offenders.length === 0 ? 0 : 1)

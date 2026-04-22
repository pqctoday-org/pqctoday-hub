// SPDX-License-Identifier: GPL-3.0-only
//
// Fails CI if any list entry under `## [Unreleased]` lacks a `[persona:X]`
// tag. The What's New modal filters by persona — entries without a tag are
// shown universally, which means persona-specific highlighting silently
// breaks. Forcing every entry to declare its audience keeps the modal
// honest.
//
// Allowed persona values: executive, developer, architect, researcher, all,
// curious. Use `[persona:all]` for entries that genuinely apply to every
// audience (UI polish, infrastructure changes).
//
// Run:    tsx scripts/lint-changelog-personas.ts
// Or:     npm run lint:changelog

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const CHANGELOG = resolve(ROOT, 'CHANGELOG.md')

const ALLOWED_PERSONAS = new Set([
  'executive',
  'developer',
  'architect',
  'researcher',
  'all',
  'curious',
])

function main(): void {
  const content = readFileSync(CHANGELOG, 'utf8')

  // Slice out the Unreleased block — from `## [Unreleased]` to the next `##`
  const headerRegex = /^## \[Unreleased\]\s*$/m
  const headerMatch = headerRegex.exec(content)
  if (!headerMatch) {
    console.log('lint-changelog-personas: no `## [Unreleased]` block — nothing to check.')
    return
  }
  const start = headerMatch.index + headerMatch[0].length
  const remainder = content.slice(start)
  const nextHeader = remainder.match(/\n## \[/)
  const block = nextHeader ? remainder.slice(0, nextHeader.index ?? 0) : remainder

  const lines = block.split('\n')
  const errors: string[] = []
  // Track current entry across continuation lines so persona tags placed on
  // any line of a multi-line entry still count.
  let currentEntryStart = -1
  let currentEntryText = ''
  let currentEntryHeader = ''

  function flush(lineNo: number): void {
    if (currentEntryStart === -1) return
    const personaMatches = currentEntryText.match(/\[persona:([^\]]+)\]/g) ?? []
    if (personaMatches.length === 0) {
      errors.push(
        `  L${currentEntryStart}: missing [persona:X] tag — "${currentEntryHeader.slice(0, 80)}"`
      )
    } else {
      for (const m of personaMatches) {
        const value = m.slice('[persona:'.length, -1).trim()
        if (!ALLOWED_PERSONAS.has(value)) {
          errors.push(
            `  L${currentEntryStart}: unknown persona "${value}" (allowed: ${[
              ...ALLOWED_PERSONAS,
            ].join(', ')})`
          )
        }
      }
    }
    void lineNo
  }

  // Approximate file line numbers for diagnostics
  const blockOffsetLine = content.slice(0, start).split('\n').length

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] // eslint-disable-line security/detect-object-injection
    if (line.startsWith('- ')) {
      flush(i)
      currentEntryStart = blockOffsetLine + i
      currentEntryHeader = line.slice(2)
      currentEntryText = line
    } else if (currentEntryStart !== -1) {
      currentEntryText += `\n${line}`
    }
  }
  flush(lines.length)

  if (errors.length > 0) {
    console.error('lint-changelog-personas: Unreleased entries missing/invalid persona tags:')
    for (const e of errors) console.error(e)
    console.error(
      `\nAdd one or more [persona:X] tags inline (allowed: ${[...ALLOWED_PERSONAS].join(', ')}). ` +
        `Use [persona:all] for entries that apply to every audience.`
    )
    process.exit(1)
  }

  console.log(`lint-changelog-personas: OK — every Unreleased entry carries a persona tag.`)
}

main()

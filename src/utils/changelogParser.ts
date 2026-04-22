// SPDX-License-Identifier: GPL-3.0-only

// Import CHANGELOG.md as raw text
import changelogContent from '../../CHANGELOG.md?raw'

// ── Types ────────────────────────────────────────────────────────────────────

export type SectionType = 'added' | 'changed' | 'fixed' | 'data' | 'security' | 'other'

export interface EntryMeta {
  personas: string[]
  views: string[]
}

export interface ChangelogEntry {
  title: string
  body: string
  meta: EntryMeta
}

export interface ChangelogSection {
  type: SectionType
  entries: ChangelogEntry[]
}

export interface ChangelogVersion {
  version: string
  date: string
  summary: string
  sections: ChangelogSection[]
}

// ── Parser ────────────────────────────────────────────────────────────────────

function parseEntry(raw: string): ChangelogEntry {
  const personas: string[] = []
  const views: string[] = []

  // Extract and strip inline impact tags before parsing title/body
  const cleaned = raw
    .replace(/\[persona:([^\]]+)\]/g, (_, p) => {
      personas.push((p as string).trim())
      return ''
    })
    .replace(/\[view:([^\]]+)\]/g, (_, v) => {
      views.push((v as string).trim())
      return ''
    })
    .trim()

  const boldMatch = cleaned.match(/^\*\*([^*]+)\*\*/)
  if (boldMatch) {
    const title = boldMatch[1]
    const body = cleaned.slice(boldMatch[0].length).replace(/^:\s*/, '').trim()
    return { title, body, meta: { personas, views } }
  }
  return { title: cleaned, body: '', meta: { personas, views } }
}

export function parseChangelog(content: string): ChangelogVersion[] {
  const versions: ChangelogVersion[] = []
  // Split at each '## [' version header
  const versionBlocks = content.split(/\n(?=## \[)/)

  for (const block of versionBlocks) {
    // Match `## [version]` with an optional ` - DATE` tail; capture the full
    // remainder of the header line as the date so multi-word dates like
    // "April 20, 2026" survive intact.
    const headerMatch = block.match(/^## \[([^\]]+)\](?:\s*-\s*(.+?))?\s*$/m)
    if (!headerMatch) continue

    const version = headerMatch[1]
    const date = (headerMatch[2] ?? '').trim()
    const sections: ChangelogSection[] = []

    // Extract optional summary paragraph — text between ## header and first ### section
    const afterHeader = block.slice(headerMatch[0].length)
    const firstSectionIdx = afterHeader.search(/\n### /)
    const rawSummary = firstSectionIdx >= 0 ? afterHeader.slice(0, firstSectionIdx) : afterHeader
    const summary = rawSummary
      .replace(/<!--.*?-->/gs, '') // strip HTML comments
      .trim()

    // Split at each '### ' section header
    const sectionBlocks = block.split(/\n(?=### )/)

    for (const sectionBlock of sectionBlocks) {
      const sectionHeaderMatch = sectionBlock.match(/^### (.+)/)
      if (!sectionHeaderMatch) continue

      const sectionName = sectionHeaderMatch[1].toLowerCase()
      const type: SectionType = sectionName.startsWith('add')
        ? 'added'
        : sectionName.startsWith('change')
          ? 'changed'
          : sectionName.startsWith('fix')
            ? 'fixed'
            : sectionName.startsWith('data')
              ? 'data'
              : sectionName.startsWith('sec')
                ? 'security'
                : 'other'

      // Collect list items; continuation lines are indented with 2+ spaces
      const lines = sectionBlock.split('\n').slice(1)
      const entries: ChangelogEntry[] = []
      let currentLines: string[] | null = null

      for (const line of lines) {
        if (line.startsWith('- ')) {
          if (currentLines !== null) {
            entries.push(parseEntry(currentLines.join('\n').trim()))
          }
          currentLines = [line.slice(2)]
        } else if (currentLines !== null) {
          // Strip leading 2-space indent from continuation lines
          currentLines.push(line.replace(/^ {2}/, ''))
        }
      }
      if (currentLines !== null) {
        entries.push(parseEntry(currentLines.join('\n').trim()))
      }

      if (entries.length > 0) {
        sections.push({ type, entries })
      }
    }

    if (sections.length > 0) {
      versions.push({ version, date, summary, sections })
    }
  }

  return versions
}

// Parse once at module level — content is a static import
export const ALL_CHANGELOG_VERSIONS = parseChangelog(changelogContent)

// Pre-computed flags for section existence
export const HAS_DATA_SECTIONS = ALL_CHANGELOG_VERSIONS.some((v) =>
  v.sections.some((s) => s.type === 'data')
)
export const HAS_SECURITY_SECTIONS = ALL_CHANGELOG_VERSIONS.some((v) =>
  v.sections.some((s) => s.type === 'security')
)

/**
 * Compare two changelog version identifiers. The literal `Unreleased` is
 * treated as newer than any numeric semver. Returns positive if `a > b`,
 * negative if `a < b`, 0 if equal. Non-numeric segments are coerced to 0.
 */
export function compareChangelogVersion(a: string, b: string): number {
  if (a === b) return 0
  if (a === 'Unreleased') return 1
  if (b === 'Unreleased') return -1
  const pa = a.split('.').map((s) => {
    const n = Number(s)
    return Number.isFinite(n) ? n : 0
  })
  const pb = b.split('.').map((s) => {
    const n = Number(s)
    return Number.isFinite(n) ? n : 0
  })
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

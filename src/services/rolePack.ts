// SPDX-License-Identifier: GPL-3.0-only
/**
 * Role packs: one document that bundles the artifacts a role has saved, in a
 * fixed order, and lists the ones still missing with the tool that produces
 * each. Each role supplies a recipe (title, sections, disclaimer); the
 * mechanics are shared so every pack reads the same way. Built entirely in the
 * browser from the artifact store; downloads go through `exportBundle.ts`.
 *
 * Recipes: `architecturePack.ts` (security architect). Other roles add their
 * own recipe file and call `buildRolePack`.
 */
import type { ExecutiveDocument, ExecutiveDocumentType } from '@/services/storage/types'
import { TYPE_LABELS } from '@/data/artifactLabels'
import { ARTIFACT_TYPE_TO_TOOL_ID } from '@/components/BusinessCenter/businessToolsRegistry'
import { withEducationNoticeMarkdown } from '@/data/educationNotice'

export interface RolePackSection {
  type: ExecutiveDocumentType
  /** What this section answers for the reader. */
  purpose: string
  /** Include every saved document of this type (e.g. one per decision record),
   * oldest first, instead of only the latest. */
  multiple?: boolean
  /** Where to produce it when it is missing. Defaults to the Command Center
   * tool mapped to the type in `ARTIFACT_TYPE_TO_TOOL_ID`. */
  toolPath?: string
}

export interface RolePackRecipe {
  title: string
  sections: RolePackSection[]
  /** Closing paragraph: whose document this is and what it is not. */
  disclaimer: string
}

export interface RolePackInput {
  documents: ExecutiveDocument[]
  /** Free-text author name typed by the user; omitted when blank. */
  author?: string
  /** Free-text scope line typed by the user; omitted when blank. */
  scope?: string
  /** Site origin used to turn tool paths into links, e.g. `https://pqctoday.com`. */
  origin?: string
  appVersion?: string | null
  /** Generation time; injectable for tests. */
  now?: Date
  /** Re-render a document's Markdown at pack time (e.g. to show the current
   * state of cited sources). Return undefined to use the saved `data`. */
  renderDocument?: (doc: ExecutiveDocument) => string | undefined
}

export interface RolePackMissing {
  type: ExecutiveDocumentType
  label: string
  toolPath: string | null
}

export interface RolePack {
  markdown: string
  present: ExecutiveDocumentType[]
  missing: RolePackMissing[]
}

const updatedAt = (d: ExecutiveDocument) => d.updatedAt ?? d.createdAt

export function toolPathFor(section: RolePackSection): string | null {
  if (section.toolPath) return section.toolPath
  const id = ARTIFACT_TYPE_TO_TOOL_ID[section.type]
  return id ? `/business/tools/${id}` : null
}

/** Push every Markdown heading in an artifact down two levels, so its own
 * `#` and `##` sit under the pack's `## n. Section` heading. */
export function demoteHeadings(markdown: string): string {
  return markdown.replace(/^(#{1,6})(\s)/gm, (_m, hashes: string, sp: string) => {
    return `${'#'.repeat(Math.min(6, hashes.length + 2))}${sp}`
  })
}

const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10)

const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ')

const status = (d: ExecutiveDocument) => d.approvalStatus ?? 'draft'

const metaLine = (d: ExecutiveDocument) =>
  `Saved as "${cell(d.title)}" · status ${status(d)}` +
  (d.reviewer?.trim() ? ` · reviewer ${cell(d.reviewer.trim())}` : '') +
  ` · last updated ${isoDate(updatedAt(d))}` +
  (d.revisions?.length ? ` · ${d.revisions.length} revision(s)` : '')

/** The documents a section includes: the latest one, or all of them oldest
 * first when the section is `multiple`. */
function docsFor(section: RolePackSection, docs: ExecutiveDocument[]): ExecutiveDocument[] {
  const ofType = docs.filter((d) => d.type === section.type)
  if (ofType.length === 0) return []
  if (section.multiple) return [...ofType].sort((a, b) => updatedAt(a) - updatedAt(b))
  return [ofType.reduce((a, b) => (updatedAt(b) > updatedAt(a) ? b : a))]
}

export function buildRolePack(recipe: RolePackRecipe, input: RolePackInput): RolePack {
  const now = input.now ?? new Date()
  const link = (path: string | null) =>
    path ? (input.origin ? `${input.origin}${path}` : path) : null

  const included = recipe.sections.map((s) => ({ section: s, docs: docsFor(s, input.documents) }))
  const present = included.filter((x) => x.docs.length > 0).map((x) => x.section.type)
  const missing: RolePackMissing[] = included
    .filter((x) => x.docs.length === 0)
    .map(({ section }) => ({
      type: section.type,
      label: TYPE_LABELS[section.type],
      toolPath: toolPathFor(section),
    }))

  const body = (d: ExecutiveDocument) => (input.renderDocument?.(d) ?? d.data).trim()

  const author = input.author?.trim()
  const scope = input.scope?.trim()

  const lines: string[] = [
    `# ${recipe.title}`,
    '',
    ...(author ? [`- Author: ${author}`] : []),
    `- Generated: ${now.toISOString().slice(0, 10)}`,
    `- Scope: ${scope || 'not stated'}`,
    ...(input.appVersion ? [`- Built with PQC Today ${input.appVersion}`] : []),
    `- Sections: ${present.length} of ${recipe.sections.length} present`,
    '',
    '## Contents',
    '',
    '| # | Section | Status | Reviewer | Last updated |',
    '|---|---|---|---|---|',
  ]

  included.forEach(({ section, docs }, i) => {
    const label = TYPE_LABELS[section.type]
    if (docs.length === 0) {
      lines.push(`| ${i + 1} | ${label} | missing | — | — |`)
      return
    }
    if (section.multiple) {
      const latest = docs[docs.length - 1]
      const approved = docs.filter((d) => status(d) === 'approved').length
      lines.push(
        `| ${i + 1} | ${label} (${docs.length}) | ${approved} of ${docs.length} approved | — | ${isoDate(updatedAt(latest))} |`
      )
      return
    }
    const d = docs[0]
    lines.push(
      `| ${i + 1} | ${label} | ${status(d)} | ${cell(d.reviewer?.trim() || '—')} | ${isoDate(updatedAt(d))} |`
    )
  })
  lines.push('')

  included.forEach(({ section, docs }, i) => {
    if (docs.length === 0) return
    lines.push(`## ${i + 1}. ${TYPE_LABELS[section.type]}`, '', `_${section.purpose}_`, '')
    if (section.multiple) {
      docs.forEach((d, k) => {
        lines.push(`### ${i + 1}.${k + 1} ${d.title}`, '', metaLine(d), '')
        // Under a ### heading, push the artifact's own headings further down
        // (demoteHeadings caps at ######).
        lines.push(demoteHeadings(demoteHeadings(body(d))), '')
      })
      return
    }
    lines.push(metaLine(docs[0]), '', demoteHeadings(body(docs[0])), '')
  })

  if (missing.length > 0) {
    lines.push('## What is missing', '')
    for (const m of missing) {
      const purpose = recipe.sections.find((s) => s.type === m.type)?.purpose ?? ''
      const href = link(m.toolPath)
      lines.push(`- **${m.label}**: ${purpose}${href ? ` Produce it with ${href}` : ''}`)
    }
    lines.push('')
  }

  lines.push('---', '', recipe.disclaimer, '')
  // Every pack states the platform's status notice first (Markdown and PDF alike).
  return { markdown: withEducationNoticeMarkdown(lines.join('\n')), present, missing }
}

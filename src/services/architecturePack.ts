// SPDX-License-Identifier: GPL-3.0-only
/**
 * The architecture pack: one document that bundles the artefacts an architect
 * has saved, in a fixed order, and lists the ones still missing with the tool
 * that produces each. Built entirely in the browser from the artefact store;
 * the mechanics of the download live in `exportBundle.ts`.
 *
 * Design note: pqctoday-plan, security-architect-architecture-pack-design-note
 * (Layer 1). Later layers add decision-record, scope, test-plan and KMIP
 * quick-run artefact types to `ARCHITECTURE_PACK_SECTIONS`.
 */
import type { ExecutiveDocument, ExecutiveDocumentType } from '@/services/storage/types'
import { TYPE_LABELS } from '@/data/artifactLabels'
import { ARTIFACT_TYPE_TO_TOOL_ID } from '@/components/BusinessCenter/businessToolsRegistry'

export interface ArchitecturePackSection {
  type: ExecutiveDocumentType
  /** What this section answers for a design review. */
  purpose: string
}

/** Fixed order: inventory first, then design, then change and responsibility. */
export const ARCHITECTURE_PACK_SECTIONS: ArchitecturePackSection[] = [
  { type: 'crypto-cbom', purpose: 'What cryptography is in use, and where (inventory).' },
  {
    type: 'crypto-architecture',
    purpose: 'How the cryptographic layers fit together today and in the target state.',
  },
  {
    type: 'management-tools-audit',
    purpose: 'Which tools discover, manage and monitor the cryptography.',
  },
  {
    type: 'hybrid-transition',
    purpose: 'Which transition mode (classical, hybrid, pure PQC) applies to which system.',
  },
  {
    type: 'mti-negotiator',
    purpose: 'Which algorithm each pair of systems can actually negotiate.',
  },
  {
    type: 'crypto-api-refactor',
    purpose: 'What has to change in application code and crypto APIs.',
  },
  {
    type: 'cloud-responsibility-matrix',
    purpose: 'Who holds and operates which keys across cloud and on-premises services.',
  },
]

export interface ArchitecturePackInput {
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
}

export interface ArchitecturePackMissing {
  type: ExecutiveDocumentType
  label: string
  /** Path of the tool that produces it, e.g. `/business/tools/mti-negotiator`. */
  toolPath: string | null
}

export interface ArchitecturePack {
  markdown: string
  present: ExecutiveDocumentType[]
  missing: ArchitecturePackMissing[]
}

export const ARCHITECTURE_PACK_TITLE = 'Architecture pack'

export const ARCHITECTURE_PACK_DISCLAIMER =
  'This is your own working document, built in your browser from what you saved on PQC Today. ' +
  'It is not a PQC Today assessment, and nobody else has reviewed it unless a reviewer is named above.'

const updatedAt = (d: ExecutiveDocument) => d.updatedAt ?? d.createdAt

/** The most recently updated document of each type. */
function latestByType(docs: ExecutiveDocument[]): Map<ExecutiveDocumentType, ExecutiveDocument> {
  const out = new Map<ExecutiveDocumentType, ExecutiveDocument>()
  for (const d of docs) {
    const cur = out.get(d.type)
    if (!cur || updatedAt(d) > updatedAt(cur)) out.set(d.type, d)
  }
  return out
}

export function toolPathFor(type: ExecutiveDocumentType): string | null {
  const id = ARTIFACT_TYPE_TO_TOOL_ID[type]
  return id ? `/business/tools/${id}` : null
}

/** Push every Markdown heading in an artefact down two levels, so its own
 * `#` and `##` sit under the pack's `## n. Section` heading. */
export function demoteHeadings(markdown: string): string {
  return markdown.replace(/^(#{1,6})(\s)/gm, (_m, hashes: string, sp: string) => {
    return `${'#'.repeat(Math.min(6, hashes.length + 2))}${sp}`
  })
}

const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10)

const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ')

export function buildArchitecturePack(input: ArchitecturePackInput): ArchitecturePack {
  const now = input.now ?? new Date()
  const latest = latestByType(input.documents)
  const link = (path: string | null) =>
    path ? (input.origin ? `${input.origin}${path}` : path) : null

  const present: ExecutiveDocumentType[] = []
  const missing: ArchitecturePackMissing[] = []
  for (const s of ARCHITECTURE_PACK_SECTIONS) {
    if (latest.has(s.type)) present.push(s.type)
    else missing.push({ type: s.type, label: TYPE_LABELS[s.type], toolPath: toolPathFor(s.type) })
  }

  const author = input.author?.trim()
  const scope = input.scope?.trim()

  const lines: string[] = [
    `# ${ARCHITECTURE_PACK_TITLE}`,
    '',
    ...(author ? [`- Author: ${author}`] : []),
    `- Generated: ${now.toISOString().slice(0, 10)}`,
    `- Scope: ${scope || 'not stated'}`,
    ...(input.appVersion ? [`- Built with PQC Today ${input.appVersion}`] : []),
    `- Sections: ${present.length} of ${ARCHITECTURE_PACK_SECTIONS.length} present`,
    '',
    '## Contents',
    '',
    '| # | Section | Status | Reviewer | Last updated |',
    '|---|---|---|---|---|',
  ]

  ARCHITECTURE_PACK_SECTIONS.forEach((s, i) => {
    const d = latest.get(s.type)
    lines.push(
      d
        ? `| ${i + 1} | ${TYPE_LABELS[s.type]} | ${d.approvalStatus ?? 'draft'} | ${cell(d.reviewer?.trim() || '—')} | ${isoDate(updatedAt(d))} |`
        : `| ${i + 1} | ${TYPE_LABELS[s.type]} | missing | — | — |`
    )
  })
  lines.push('')

  ARCHITECTURE_PACK_SECTIONS.forEach((s, i) => {
    const d = latest.get(s.type)
    if (!d) return
    lines.push(
      `## ${i + 1}. ${TYPE_LABELS[s.type]}`,
      '',
      `_${s.purpose}_`,
      '',
      `Saved as "${cell(d.title)}" · status ${d.approvalStatus ?? 'draft'}` +
        (d.reviewer?.trim() ? ` · reviewer ${cell(d.reviewer.trim())}` : '') +
        ` · last updated ${isoDate(updatedAt(d))}` +
        (d.revisions?.length ? ` · ${d.revisions.length} revision(s)` : ''),
      '',
      demoteHeadings(d.data.trim()),
      ''
    )
  })

  if (missing.length > 0) {
    lines.push('## What is missing', '')
    for (const m of missing) {
      const purpose = ARCHITECTURE_PACK_SECTIONS.find((s) => s.type === m.type)?.purpose ?? ''
      const href = link(m.toolPath)
      lines.push(`- **${m.label}**: ${purpose}${href ? ` Produce it with ${href}` : ''}`)
    }
    lines.push('')
  }

  lines.push('---', '', ARCHITECTURE_PACK_DISCLAIMER, '')
  return { markdown: lines.join('\n'), present, missing }
}

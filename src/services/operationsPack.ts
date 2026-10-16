// SPDX-License-Identifier: GPL-3.0-only
/**
 * The IT operations pack recipe: the artifacts a change board or an on-call
 * team needs for a PQC change, in a fixed order — scope, windows, capacity,
 * configuration, plan, rehearsal, thresholds, then proof. The shared mechanics
 * are in `rolePack.ts`; downloads go through `exportBundle.ts`.
 *
 * Besides Markdown and PDF, the operations pack downloads as a zip that adds
 * one CSV per table in the pack, so checklists and results can go straight
 * into a ticket or spreadsheet.
 *
 * Design note: pqctoday-plan, it-operations-operations-package-design-note.
 */
import { generateCsv } from '@/utils/csvExport'
import type { BundleFile } from './exportBundle'
import { buildRolePack, type RolePack, type RolePackInput, type RolePackRecipe } from './rolePack'

export const OPERATIONS_PACK_TITLE = 'Operations pack'

/** Where the pack's own artifacts (scope, test plan) are edited. */
export const OPERATIONS_PACK_PANEL_PATH = '/business#operations-pack'

/** moduleId for artifacts produced in the operations pack panel. */
export const OPERATIONS_PACK_MODULE_ID = 'operations-pack'

export const OPERATIONS_PACK_DISCLAIMER =
  'This is your own working document, built in your browser from what you saved on PQC Today. ' +
  'It is not a PQC Today assessment. Estimates and simulator results are not measurements of your ' +
  'systems, and nobody else has reviewed it unless a reviewer is named above.'

export const OPERATIONS_PACK_RECIPE: RolePackRecipe = {
  title: OPERATIONS_PACK_TITLE,
  disclaimer: OPERATIONS_PACK_DISCLAIMER,
  sections: [
    {
      type: 'ops-scope',
      purpose: 'Which environments, systems, windows and recovery objectives the change covers.',
      toolPath: OPERATIONS_PACK_PANEL_PATH,
    },
    {
      type: 'refresh-cycle-alignment',
      purpose: 'Which funded refresh or renewal window carries each part of the change.',
    },
    {
      type: 'infra-modernization-plan',
      purpose: 'When HSM, KMS and certificate-store upgrades happen.',
    },
    {
      type: 'hsm-capacity-plan',
      purpose: 'How many HSMs the target workload needs, and which rates that rests on.',
      toolPath: '/playground/hsm-capacity',
    },
    {
      type: 'cert-capacity-plan',
      purpose: 'How certificate storage, handshake bytes and signing load grow.',
      toolPath: '/playground/cert-capacity',
    },
    {
      type: 'protocol-config',
      purpose: 'The configuration fragments to deploy, with the version each needs.',
      multiple: true,
      toolPath: '/learn/vpn-ssh-pqc',
    },
    { type: 'migration-roadmap', purpose: 'The phases and their order.' },
    {
      type: 'deployment-playbook',
      purpose: 'Feature flags, canary, progressive rollout, validation and rollback steps.',
    },
    {
      type: 'vpn-sim-run',
      purpose: 'A rehearsed IKEv2 exchange with the chosen key exchange and authentication.',
      toolPath: '/playground/vpn-sim',
    },
    {
      type: 'ops-test-plan',
      purpose: 'The checks that must pass before and after cutover, with owners and results.',
      toolPath: OPERATIONS_PACK_PANEL_PATH,
    },
    { type: 'kpi-tracker', purpose: 'Targets and thresholds to watch during the rollout.' },
    {
      type: 'migration-verification',
      purpose: 'Evidence that each system migrated, what was retired, and the closure sign-off.',
    },
  ],
}

export const OPERATIONS_PACK_SECTIONS = OPERATIONS_PACK_RECIPE.sections

export const buildOperationsPack = (input: RolePackInput): RolePack =>
  buildRolePack(OPERATIONS_PACK_RECIPE, input)

// ── Tables to CSV ──────────────────────────────────────────────────────────

export interface MarkdownTable {
  /** Nearest heading above the table, without the hashes. */
  heading: string
  header: string[]
  rows: string[][]
}

const isTableLine = (l: string) => /^\s*\|.*\|\s*$/.test(l)
const isSeparator = (l: string) => /^\s*\|(\s*:?-{3,}:?\s*\|)+\s*$/.test(l)

/** Split one Markdown table row into cells, honouring `\|` escapes. */
export function splitRow(line: string): string[] {
  const inner = line.trim().replace(/^\|/, '').replace(/\|$/, '')
  const cells: string[] = []
  let cur = ''
  for (let i = 0; i < inner.length; i++) {
    const ch = inner.charAt(i)
    if (ch === '\\' && inner.charAt(i + 1) === '|') {
      cur += '|'
      i++
    } else if (ch === '|') {
      cells.push(cur.trim())
      cur = ''
    } else {
      cur += ch
    }
  }
  cells.push(cur.trim())
  return cells
}

/** Every pipe table in a Markdown document (outside code fences), with the
 * heading it sits under. */
export function extractMarkdownTables(markdown: string): MarkdownTable[] {
  const lines = markdown.split('\n')
  const tables: MarkdownTable[] = []
  let heading = ''
  let inFence = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^\s*```/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const h = /^#{1,6}\s+(.*)$/.exec(line)
    if (h) {
      heading = h[1].trim()
      continue
    }
    if (isTableLine(line) && i + 1 < lines.length && isSeparator(lines[i + 1])) {
      const header = splitRow(line)
      const rows: string[][] = []
      let j = i + 2
      while (j < lines.length && isTableLine(lines[j])) {
        rows.push(splitRow(lines[j]))
        j++
      }
      tables.push({ heading, header, rows })
      i = j - 1
    }
  }
  return tables
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'table'

/** One CSV per table, named after its heading; repeated names get a suffix. */
export function tablesToCsvFiles(tables: MarkdownTable[], folder = 'tables'): BundleFile[] {
  const used = new Map<string, number>()
  return tables.map((t, idx) => {
    const base = slug(t.heading || `table-${idx + 1}`)
    const n = (used.get(base) ?? 0) + 1
    used.set(base, n)
    const name = n === 1 ? base : `${base}-${n}`
    const columns = t.header.map((h, c) => ({
      header: h || `Column ${c + 1}`,
      accessor: (r: string[]) => r[c] ?? '',
    }))
    return { path: `${folder}/${name}.csv`, content: generateCsv(t.rows, columns) }
  })
}

const README = `# Operations pack

- operations-pack.md: the whole pack, in order, with the list of missing sections.
- tables/: every table in the pack as a CSV, named after the section it comes from.

${OPERATIONS_PACK_DISCLAIMER}
`

/** The files inside the operations pack zip. */
export function operationsPackFiles(markdown: string): BundleFile[] {
  return [
    { path: 'operations-pack/README.md', content: README },
    { path: 'operations-pack/operations-pack.md', content: markdown },
    ...tablesToCsvFiles(extractMarkdownTables(markdown), 'operations-pack/tables'),
  ]
}

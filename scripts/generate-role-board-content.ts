#!/usr/bin/env tsx
/**
 * scripts/generate-role-board-content.ts
 *
 * Reads the latest `src/data/role_board_content_*.csv`, expands every
 * `{token}` placeholder via `scripts/lib/roleBoardTokens.ts` against the REAL,
 * live `personaConfig.ts` exports, assembles each (role, variant) into a
 * `PersonaJourneyBoard`-shaped object, and writes a generated TS file.
 *
 * WHY VITE SSR, NOT A PLAIN IMPORT. `personaConfig.ts` needs
 * `LIBRARY_ACTIVE_SOURCE_COUNT` / `REGULATORY_DATA_VERIFIED_DATE`
 * (`personaBoardLiveMetrics.ts`), which read `libraryData.ts` /
 * `authoritativeSourcesData.ts` — both call `import.meta.glob(...)` at module
 * scope, a Vite build-time macro that throws under plain Node/tsx execution
 * ("(intermediate value).glob is not a function"). Restructuring
 * `personaConfig.ts` to avoid this would mean extracting ~400 lines
 * (PERSONA_MILESTONES, PERSONA_REPORT_CONFIG, BC_ZONE_EMPHASIS_BY_PERSONA) out
 * of a file imported across the whole app — real risk for no benefit, since
 * Vite already exposes a documented programmatic loader
 * (`ViteDevServer.ssrLoadModule`, the same mechanism `vite-node`/Vitest use)
 * that resolves `import.meta.glob` correctly. This script boots a
 * middleware-mode Vite server, `ssrLoadModule`s the REAL personaConfig.ts —
 * with every fix already committed to it, no separate copy — and calls its
 * exported functions directly. Confirmed working 2026-08-02: loads
 * `PERSONA_JOURNEY_BOARD.ops.headline` and returns the exact live string.
 *
 * Run via: npm run generate:role-board-content
 * Writes:  src/data/generated/roleBoardContent.generated.ts
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createServer } from 'vite'
import Papa from 'papaparse'
import { expandTokens, hasUnexpandedToken, type PersonaConfigModule } from './lib/roleBoardTokens'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT_FILE = join(ROOT, 'src/data/generated/roleBoardContent.generated.ts')

interface ContentRow {
  role_id: string
  variant_id: string
  slot: string
  slot_index: string
  content: string
  status: string
}

const ROLES = ['executive', 'developer', 'architect', 'ops', 'researcher', 'curious'] as const
const REQUIRED_GRID_CARDS = 3

// Slots every board must carry — everything except the two optional ones
// (heroBadge, capstoneChip — absent for researcher by design) and footnote/
// trackNote, which the type itself marks optional.
const REQUIRED_SCALAR_SLOTS = [
  'hero_eyebrow',
  'headline',
  'sub',
  'cta_primary_label',
  'cta_primary_href',
  'cta_secondary_label',
  'cta_secondary_href',
  'side_card_title',
  'side_card_tone',
  'side_card_provenance',
  'side_card_punchline',
  'grid_title',
  'grid_sub',
  'track_title',
] as const

function latestContentCsv(): string {
  const dataDir = join(ROOT, 'src/data')
  const files = readdirSync(dataDir)
    .filter((f) => /^role_board_content_\d{8}\.csv$/.test(f))
    .sort()
  if (files.length === 0) {
    throw new Error('No src/data/role_board_content_*.csv found.')
  }
  return join(dataDir, files[files.length - 1])
}

function parseRows(csvText: string): ContentRow[] {
  const parsed = Papa.parse<ContentRow>(csvText, { header: true, skipEmptyLines: true })
  return (parsed.data ?? []).filter((r) => r && r.role_id && (r.status ?? 'active') === 'active')
}

/** JS string literal, safe for embedding in the generated file (handles quotes, backslashes, newlines). */
function jsString(s: string): string {
  return JSON.stringify(s)
}

async function main() {
  const csvPath = latestContentCsv()
  const rows = parseRows(readFileSync(csvPath, 'utf8'))
  console.log(`Read ${rows.length} active rows from ${csvPath}`)

  const server = await createServer({
    root: ROOT,
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'error',
  })
  let mod: PersonaConfigModule
  try {
    const personaConfigMod = await server.ssrLoadModule('/src/data/personaConfig.ts')
    // `PERSONAS` is imported (not re-exported) by personaConfig.ts, so it is
    // absent from `ssrLoadModule`'s return value — only a module's own
    // `export`s appear there, not the things it merely imports for internal
    // use. Loaded directly and merged in rather than adding a re-export to
    // personaConfig.ts for the generator's sole benefit.
    const learningPersonasMod = await server.ssrLoadModule('/src/data/learningPersonas.ts')
    // Same gap, same reason: LIBRARY_ACTIVE_SOURCE_COUNT / REGULATORY_DATA_
    // VERIFIED_DATE are imported (not re-exported) by personaConfig.ts from
    // personaBoardLiveMetrics.ts. Caught by the full byte-identical comparison
    // against the live board (2026-08-02) — silently resolved to "undefined"
    // and the wrong regulatory-date fallback branch until this was added.
    const liveMetricsMod = await server.ssrLoadModule('/src/data/personaBoardLiveMetrics.ts')
    mod = { ...personaConfigMod, PERSONAS: learningPersonasMod.PERSONAS, ...liveMetricsMod }
  } finally {
    await server.close()
  }
  console.log(
    'Loaded personaConfig.ts via Vite SSR — sanity check:',
    mod.PERSONA_JOURNEY_BOARD.ops.headline
  )

  // Expand every row's content up front — one pass, fail fast on the first
  // broken token rather than partially assembling boards on bad data.
  const expanded = rows.map((r) => {
    let content: string
    try {
      content = expandTokens(r.content, mod)
    } catch (e) {
      throw new Error(
        `${csvPath} :: ${r.role_id}/${r.variant_id}/${r.slot}[${r.slot_index}]: ${e instanceof Error ? e.message : String(e)}`
      )
    }
    if (hasUnexpandedToken(content)) {
      throw new Error(
        `${csvPath} :: ${r.role_id}/${r.variant_id}/${r.slot}[${r.slot_index}]: still contains a { } pattern after expansion: ${content}`
      )
    }
    return { ...r, content }
  })

  // Group by (role, variant) -> slot -> ordered list of {index, content}.
  type SlotMap = Map<string, { index: string; content: string }[]>
  const boards = new Map<string, SlotMap>() // key: `${role}::${variant}`
  for (const r of expanded) {
    const key = `${r.role_id}::${r.variant_id}`
    if (!boards.has(key)) boards.set(key, new Map())
    const slotMap = boards.get(key)!
    if (!slotMap.has(r.slot)) slotMap.set(r.slot, [])
    slotMap.get(r.slot)!.push({ index: r.slot_index, content: r.content })
  }

  const scalar = (slots: SlotMap, name: string): string | undefined => slots.get(name)?.[0]?.content
  const requireScalar = (slots: SlotMap, name: string, ctx: string): string => {
    const v = scalar(slots, name)
    if (v === undefined) throw new Error(`${ctx}: missing required slot "${name}"`)
    return v
  }
  const repeating = (slots: SlotMap, name: string): string[] =>
    (slots.get(name) ?? [])
      .slice()
      .sort((a, b) => Number(a.index) - Number(b.index))
      .map((e) => e.content)

  const boardEntries: string[] = []
  for (const role of ROLES) {
    const key = `${role}::default`
    const slots = boards.get(key)
    if (!slots) throw new Error(`No rows for ${key} — every role needs a "default" variant.`)
    const ctx = key

    for (const req of REQUIRED_SCALAR_SLOTS) requireScalar(slots, req, ctx)

    const gridTitles = repeating(slots, 'grid_card_title')
    const gridBodies = repeating(slots, 'grid_card_body')
    if (gridTitles.length !== REQUIRED_GRID_CARDS || gridBodies.length !== REQUIRED_GRID_CARDS) {
      throw new Error(
        `${ctx}: expected exactly ${REQUIRED_GRID_CARDS} grid_card_title/grid_card_body pairs, got ${gridTitles.length}/${gridBodies.length}`
      )
    }
    const rowLabels = repeating(slots, 'side_card_row_label')
    const rowValues = repeating(slots, 'side_card_row_value')
    if (rowLabels.length !== rowValues.length) {
      throw new Error(
        `${ctx}: side_card_row_label/side_card_row_value count mismatch (${rowLabels.length} vs ${rowValues.length})`
      )
    }

    const heroBadgeText = scalar(slots, 'hero_badge_text')
    const heroBadgeTone = scalar(slots, 'hero_badge_tone')
    const sideCardFootnote = scalar(slots, 'side_card_footnote')
    const trackNote = scalar(slots, 'track_note')
    const capstoneLabel = scalar(slots, 'capstone_chip_label')

    const obj = `  ${role}: {
    heroEyebrow: ${jsString(requireScalar(slots, 'hero_eyebrow', ctx))},
    ${heroBadgeText !== undefined ? `heroBadge: { text: ${jsString(heroBadgeText)}, tone: ${jsString(heroBadgeTone ?? 'sourced')} as 'sourced' | 'illustrative' },` : ''}
    headline: ${jsString(requireScalar(slots, 'headline', ctx))},
    sub: ${jsString(requireScalar(slots, 'sub', ctx))},
    ctaPrimary: ${jsString(requireScalar(slots, 'cta_primary_label', ctx))},
    ctaPrimaryHref: ${jsString(requireScalar(slots, 'cta_primary_href', ctx))},
    ctaSecondary: ${jsString(requireScalar(slots, 'cta_secondary_label', ctx))},
    ctaSecondaryHref: ${jsString(requireScalar(slots, 'cta_secondary_href', ctx))},
    proofChips: [${repeating(slots, 'proof_chip').map(jsString).join(', ')}],
    sideCard: {
      title: ${jsString(requireScalar(slots, 'side_card_title', ctx))},
      tone: ${jsString(requireScalar(slots, 'side_card_tone', ctx))} as 'bad' | 'warn' | 'info' | 'accent',
      provenance: ${jsString(requireScalar(slots, 'side_card_provenance', ctx))} as 'sourced' | 'illustrative',
      rows: [${rowLabels.map((label, i) => `{ label: ${jsString(label)}, value: ${jsString(rowValues[i])} }`).join(', ')}],
      punchline: ${jsString(requireScalar(slots, 'side_card_punchline', ctx))},
      ${sideCardFootnote !== undefined ? `footnote: ${jsString(sideCardFootnote)},` : ''}
    },
    gridTitle: ${jsString(requireScalar(slots, 'grid_title', ctx))},
    gridSub: ${jsString(requireScalar(slots, 'grid_sub', ctx))},
    gridCards: [${gridTitles.map((title, i) => `{ title: ${jsString(title)}, body: ${jsString(gridBodies[i])} }`).join(', ')}] as [
      { title: string; body: string },
      { title: string; body: string },
      { title: string; body: string },
    ],
    trackTitle: ${jsString(requireScalar(slots, 'track_title', ctx))},
    ${trackNote !== undefined ? `trackNote: ${jsString(trackNote)},` : ''}
    trackChips: [${repeating(slots, 'track_chip').map(jsString).join(', ')}],
    ${capstoneLabel !== undefined ? `capstoneChip: { label: ${jsString(capstoneLabel)} },` : ''}
  },`
    boardEntries.push(obj)
  }

  const generated = `// SPDX-License-Identifier: GPL-3.0-only
/**
 * GENERATED — do not edit by hand.
 * Source: ${csvPath.replace(ROOT + '/', '')}
 * Regenerate: npm run generate:role-board-content
 */
import type { PersonaJourneyBoard } from '../personaConfig'
import type { PersonaId } from '../learningPersonas'

export const PERSONA_JOURNEY_BOARD: Record<PersonaId, PersonaJourneyBoard> = {
${boardEntries.join('\n')}
}
`

  mkdirSync(dirname(OUT_FILE), { recursive: true })
  writeFileSync(OUT_FILE, generated)
  console.log(`Wrote ${OUT_FILE}`)
}

main().catch((e) => {
  console.error('✗', e instanceof Error ? e.message : e)
  process.exit(1)
})

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

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createServer } from 'vite'
import Papa from 'papaparse'
import { expandTokens, hasUnexpandedToken, type PersonaConfigModule } from './lib/roleBoardTokens'
import { latestDatedCsv, ROLE_BOARD_CONTENT_RE } from './lib/latestDatedCsv'
import { format, resolveConfig } from 'prettier'

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
  deprecated_at?: string
  deprecated_reason?: string
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
  const found = latestDatedCsv(join(ROOT, 'src/data'), ROLE_BOARD_CONTENT_RE)
  if (!found) throw new Error('No src/data/role_board_content_*.csv found.')
  return found
}

/** The only `status` values the pipeline understands. */
const KNOWN_STATUSES = new Set(['active', 'deprecated'])

/**
 * Active rows only, with the lifecycle columns actually enforced rather than
 * ignored. Previously this filtered on `status === 'active'` and never looked
 * at `deprecated_at` / `deprecated_reason` at all, so the CSV advertised a
 * deprecation workflow the pipeline did not honour — and a typo'd status
 * (`activ`) silently dropped a row from the board instead of failing.
 */
function parseRows(csvText: string, csvPath: string): ContentRow[] {
  const parsed = Papa.parse<ContentRow>(csvText, { header: true, skipEmptyLines: true })
  const rows = (parsed.data ?? []).filter((r) => r && r.role_id)

  for (const r of rows) {
    const status = r.status || 'active'
    const where = `${csvPath} :: ${r.role_id}/${r.variant_id}/${r.slot}[${r.slot_index}]`
    if (!KNOWN_STATUSES.has(status)) {
      throw new Error(`${where}: unknown status "${r.status}" (expected active or deprecated)`)
    }
    if (status === 'deprecated' && !(r.deprecated_at ?? '').trim()) {
      throw new Error(`${where}: status=deprecated requires a deprecated_at date`)
    }
    if (status === 'active' && (r.deprecated_at ?? '').trim()) {
      throw new Error(`${where}: deprecated_at is set but status is still active`)
    }
  }

  return rows.filter((r) => (r.status || 'active') === 'active')
}

/** JS string literal, safe for embedding in the generated file (handles quotes, backslashes, newlines). */
function jsString(s: string): string {
  return JSON.stringify(s)
}

async function main() {
  const csvPath = latestContentCsv()
  const rows = parseRows(readFileSync(csvPath, 'utf8'), csvPath)
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

  /**
   * Repeating slot as an index->content map, for slots that must be PAIRED
   * with another slot by `slot_index` rather than by array position.
   *
   * `repeating()` sorts and flattens to an array, which is right for
   * independent lists (proof chips, track chips) but wrong for pairs: labels
   * at indices 0,1,2 zipped against values at 0,1,3 have equal LENGTH, so the
   * count check passes, and value[2] then silently pairs with label[2] —
   * a mispaired side-card row that looks entirely correct in the generated
   * output.
   */
  const byIndex = (slots: SlotMap, name: string): Map<string, string> => {
    const out = new Map<string, string>()
    for (const e of slots.get(name) ?? []) {
      if (out.has(e.index)) {
        throw new Error(`duplicate ${name}[${e.index}]`)
      }
      out.set(e.index, e.content)
    }
    return out
  }

  // Only the `default` variant is rendered today. A non-default variant used
  // to be parsed, token-expanded, and then silently DROPPED here — the CSV
  // advertised a capability the pipeline did not have, so a maintainer could
  // author a whole alternate board and see no error and no effect. Fail loudly
  // until multi-variant rendering lands.
  const unsupportedVariants = [...boards.keys()].filter((k) => !k.endsWith('::default')).sort()
  if (unsupportedVariants.length > 0) {
    throw new Error(
      `${csvPath}: found ${unsupportedVariants.length} non-default variant(s) ` +
        `(${unsupportedVariants.join(', ')}), which this generator cannot render yet. ` +
        `Rendering more than one variant per role requires the multi-variant board ` +
        `output; refusing to silently drop them.`
    )
  }

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
    // Paired by slot_index, not by position — see `byIndex`.
    const labelByIndex = byIndex(slots, 'side_card_row_label')
    const valueByIndex = byIndex(slots, 'side_card_row_value')
    const rowIndices = [...labelByIndex.keys()].sort((a, b) => Number(a) - Number(b))
    for (const idx of rowIndices) {
      if (!valueByIndex.has(idx)) {
        throw new Error(`${ctx}: side_card_row_label[${idx}] has no matching side_card_row_value`)
      }
    }
    for (const idx of valueByIndex.keys()) {
      if (!labelByIndex.has(idx)) {
        throw new Error(`${ctx}: side_card_row_value[${idx}] has no matching side_card_row_label`)
      }
    }
    const rowLabels = rowIndices.map((i) => labelByIndex.get(i)!)
    const rowValues = rowIndices.map((i) => valueByIndex.get(i)!)

    const heroBadgeText = scalar(slots, 'hero_badge_text')
    const heroBadgeTone = scalar(slots, 'hero_badge_tone')
    const sideCardFootnote = scalar(slots, 'side_card_footnote')
    const sideCardEmptyState = scalar(slots, 'side_card_empty_state')
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
      ${sideCardEmptyState !== undefined ? `emptyState: ${jsString(sideCardEmptyState)},` : ''}
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

  // Format through Prettier before writing. Generation must be DETERMINISTIC:
  // the committed file was previously hand-formatted after generation, so the
  // generator's raw `JSON.stringify` output (double quotes, everything on one
  // line) could never match what was in git — which would make any
  // CSV-vs-generated drift check permanently red and therefore useless. Running
  // the repo's own Prettier config here means "regenerate" produces byte-identical
  // output to "regenerate, then format", and the drift gate can compare directly.
  const prettierConfig = await resolveConfig(OUT_FILE)
  const formatted = await format(generated, {
    ...prettierConfig,
    filepath: OUT_FILE,
    parser: 'typescript',
  })

  // --check: drift gate. Only `predev` and `build` regenerate, so a commit that
  // edits the CSV without regenerating leaves the committed module stale — the
  // production bundle would be correct (build regenerates) while tests, type
  // checks and any local run silently use the OLD copy. This compares what the
  // CSV produces against what is on disk and fails if they differ, so the CSV
  // stays the single source of truth it claims to be.
  if (process.argv.includes('--check')) {
    const onDisk = existsSync(OUT_FILE) ? readFileSync(OUT_FILE, 'utf8') : null
    if (onDisk === formatted) {
      console.log(
        `✓ ${OUT_FILE.replace(ROOT + '/', '')} is in sync with ${csvPath.replace(ROOT + '/', '')}`
      )
      return
    }
    console.error(
      `✗ ${OUT_FILE.replace(ROOT + '/', '')} is STALE relative to ` +
        `${csvPath.replace(ROOT + '/', '')}.\n` +
        `  ${onDisk === null ? 'The generated file does not exist.' : 'The CSV has changed since it was last generated.'}\n` +
        `  Run: npm run generate:role-board-content`
    )
    process.exit(1)
  }

  mkdirSync(dirname(OUT_FILE), { recursive: true })
  writeFileSync(OUT_FILE, formatted)
  console.log(`Wrote ${OUT_FILE}`)
}

main().catch((e) => {
  console.error('✗', e instanceof Error ? e.message : e)
  process.exit(1)
})

// SPDX-License-Identifier: GPL-3.0-only
/**
 * The role-board token registry — the closed vocabulary of `{token:args}`
 * placeholders a `role_board_content_*.csv` row's `content` field may contain.
 *
 * Every resolver below is a thin call into a function or constant ALREADY
 * EXPORTED from `personaConfig.ts` (2026-08-02) — never a reimplementation.
 * That is the point: the generator drives the exact same code the live app
 * used to compute this copy inline, so migrating a role's content to CSV
 * cannot silently diverge from what `combinedArtifacts()`/`formatEssentials
 * VsFull()`/etc. actually compute. `PersonaConfigModule` below is deliberately
 * loose (just the slice this file calls) rather than importing the real
 * `PersonaJourneyBoard` types — the generator loads `personaConfig.ts`
 * through Vite's SSR module loader (see `scripts/generate-role-board-
 * content.ts`), not a normal TS import, so it only has a plain JS object at
 * the call site, not compile-time type safety against the source file.
 *
 * Token syntax: `{tokenName:arg1:arg2}` — colon-separated (not comma: CSV
 * prose routinely contains commas, colons far less often). A list-valued arg
 * position (e.g. multiple zones) joins its items with `+`:
 * `{artifacts:ops:mitigation+risk-management+migration+governance}`.
 *
 * Every token name is enumerable and closed — this is not a general
 * expression language. It was built by grepping every `${...}` interpolation
 * across all six boards' original inline TypeScript (2026-08-02 migration) and
 * giving each DISTINCT expression shape exactly one named token. Adding a new
 * live value to a board means adding a new resolver here, not writing an
 * arbitrary expression in the CSV.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see file header: this is an SSR-loaded module's runtime shape, not a typed import
export type PersonaConfigModule = Record<string, any>

export class TokenError extends Error {}

function requireArgs(name: string, args: string[], count: number): void {
  if (args.length !== count) {
    throw new TokenError(
      `{${name}} expects ${count} arg(s), got ${args.length}: [${args.join(':')}]`
    )
  }
}

function splitList(arg: string): string[] {
  return arg.split('+').filter(Boolean)
}

type Resolver = (mod: PersonaConfigModule, args: string[]) => string

const RESOLVERS: Record<string, Resolver> = {
  artifacts: (mod, args) => {
    requireArgs('artifacts', args, 2)
    const [persona, zones] = args
    return mod.joinWithAnd(mod.combinedArtifacts(persona, splitList(zones)))
  },
  artifacts_count: (mod, args) => {
    requireArgs('artifacts_count', args, 2)
    const [persona, zones] = args
    return mod.toWordIfSmall(mod.combinedArtifacts(persona, splitList(zones)).length)
  },
  Artifacts_count: (mod, args) => {
    requireArgs('Artifacts_count', args, 2)
    const [persona, zones] = args
    return mod.capitalizedSmallNumberWord(mod.combinedArtifacts(persona, splitList(zones)).length)
  },
  // Plain ", "-joined artifact list — distinct from `artifacts`, which uses
  // joinWithAnd. One call site (executive's board-pack grid card) uses plain
  // `.join(', ')` in the source; every other artifact listing uses joinWithAnd.
  // Caught by the byte-identical comparison against the live board
  // (2026-08-02) — an earlier CSV draft used `{artifacts:...}` here and
  // silently added an "and" the original text never had.
  artifacts_commas: (mod, args) => {
    requireArgs('artifacts_commas', args, 2)
    const [persona, zones] = args
    return mod.combinedArtifacts(persona, splitList(zones)).join(', ')
  },
  report_sections: (mod, args) => {
    requireArgs('report_sections', args, 2)
    const [persona, state] = args
    return mod.joinWithAnd(mod.reportSectionsByState(persona, state).map(mod.reportSectionLabel))
  },
  report_section: (mod, args) => {
    requireArgs('report_section', args, 1)
    return mod.reportSectionLabel(args[0])
  },
  report_sections_named: (mod, args) => {
    requireArgs('report_sections_named', args, 1)
    return mod.joinWithAnd(splitList(args[0]).map(mod.reportSectionLabel))
  },
  report_section_total: (mod, args) => {
    requireArgs('report_section_total', args, 0)
    return String(mod.REPORT_SECTION_TOTAL_COUNT)
  },
  developer_report_override_count: (mod, args) => {
    requireArgs('developer_report_override_count', args, 0)
    return String(mod.DEVELOPER_REPORT_OVERRIDE_COUNT)
  },
  essentials_minutes: (mod, args) => {
    requireArgs('essentials_minutes', args, 1)
    return String(mod.PERSONAS[args[0]].essentialsMinutes)
  },
  estimated_minutes: (mod, args) => {
    requireArgs('estimated_minutes', args, 1)
    return String(mod.PERSONAS[args[0]].estimatedMinutes)
  },
  essentials_vs_full: (mod, args) => {
    requireArgs('essentials_vs_full', args, 1)
    return mod.formatEssentialsVsFull(args[0])
  },
  essentials_count: (mod, args) => {
    requireArgs('essentials_count', args, 1)
    return mod.toWordIfSmall(mod.PERSONAS[args[0]].essentials.length)
  },
  Essentials_count: (mod, args) => {
    requireArgs('Essentials_count', args, 1)
    return mod.capitalizedSmallNumberWord(mod.PERSONAS[args[0]].essentials.length)
  },
  recommended_path_no_quiz_count: (mod, args) => {
    requireArgs('recommended_path_no_quiz_count', args, 1)
    const path = mod.PERSONAS[args[0]].recommendedPath as string[]
    return mod.toWordIfSmall(path.filter((id) => id !== 'quiz').length)
  },
  milestones_list: (mod, args) => {
    requireArgs('milestones_list', args, 1)
    const milestones = mod.PERSONA_MILESTONES[args[0]] as { label: string }[]
    return milestones.map((m) => m.label).join(', ')
  },
  milestones_checkpoints: (mod, args) => {
    requireArgs('milestones_checkpoints', args, 1)
    return mod.joinWithAnd(mod.firstMilestoneLabelPerCheckpoint(args[0]))
  },
  library_categories: (mod, args) => {
    requireArgs('library_categories', args, 1)
    return mod.joinWithAnd(mod.PERSONA_LIBRARY_CATEGORIES[args[0]])
  },
  library_categories_count: (mod, args) => {
    requireArgs('library_categories_count', args, 1)
    return mod.toWordIfSmall((mod.PERSONA_LIBRARY_CATEGORIES[args[0]] as string[]).length)
  },
  migrate_layers: (mod, args) => {
    requireArgs('migrate_layers', args, 1)
    return mod.joinWithAnd(mod.PERSONA_MIGRATE_LAYERS[args[0]])
  },
  migrate_layers_count: (mod, args) => {
    requireArgs('migrate_layers_count', args, 1)
    return mod.toWordIfSmall((mod.PERSONA_MIGRATE_LAYERS[args[0]] as string[]).length)
  },
  library_active_count: (mod, args) => {
    requireArgs('library_active_count', args, 0)
    return String(mod.LIBRARY_ACTIVE_SOURCE_COUNT)
  },
  // The one conditional value in the whole vocabulary: falls back to a fixed
  // phrase when no compliance-tagged authoritative source carries a verified
  // date. Mirrors the ternary the inline board copy used before migration —
  // see `REGULATORY_DATA_VERIFIED_DATE`'s own doc comment for why the date
  // itself, not just this phrase, is derived rather than hardcoded.
  regulatory_verified_phrase: (mod, args) => {
    requireArgs('regulatory_verified_phrase', args, 0)
    return mod.REGULATORY_DATA_VERIFIED_DATE
      ? `Regulatory data verified ${mod.REGULATORY_DATA_VERIFIED_DATE}`
      : 'Regulatory data verified against source'
  },
  hsm_use_cases_count: (mod, args) => {
    requireArgs('hsm_use_cases_count', args, 0)
    return mod.toWordIfSmall(mod.HSM_CAPACITY_USE_CASE_COUNT)
  },
  Hsm_use_cases_count: (mod, args) => {
    requireArgs('Hsm_use_cases_count', args, 0)
    return mod.capitalizedSmallNumberWord(mod.HSM_CAPACITY_USE_CASE_COUNT)
  },
  migration_estate_key_count: (mod, args) => {
    requireArgs('migration_estate_key_count', args, 0)
    return mod.toWordIfSmall(mod.MIGRATION_ESTATE_KEY_COUNT)
  },
  recommended_actions_max: (mod, args) => {
    requireArgs('recommended_actions_max', args, 1)
    const cfg = mod.PERSONA_REPORT_CONFIG[args[0]]
    return String(cfg?.recommendedActions?.maxItems ?? '')
  },
  // Single-use, pre-resolved full sentence for the developer report card body —
  // both the zero-overrides branch and the is/are pluralization exist for
  // exactly one call site, so a generic grammar feature isn't warranted.
  // Mirrors the pre-migration ternary exactly (both branches, not just the
  // pluralization half a first draft of this resolver mistakenly modeled).
  developer_report_card_body: (mod, args) => {
    requireArgs('developer_report_card_body', args, 0)
    const n = mod.DEVELOPER_REPORT_OVERRIDE_COUNT as number
    const total = mod.REPORT_SECTION_TOTAL_COUNT as number
    const opens = `${mod.reportSectionLabel('algorithmMigration')} and ${mod.reportSectionLabel('cbom')}`
    return n === 0
      ? `All ${total} report sections, at their defaults — opening with ${opens}.`
      : `${n} report section${n === 1 ? ' is' : 's are'} tailored to your role, opening with ${opens}.`
  },
  /** `{ml_dsa_signature:44}` — any parameter set, from the algorithm registry. */
  ml_dsa_signature: (mod, args) => {
    requireArgs('ml_dsa_signature', args, 1)
    return mod.mlDsaSignatureBytes(args[0])
  },
  ml_dsa_65_signature_only: (mod, args) => {
    requireArgs('ml_dsa_65_signature_only', args, 0)
    return mod.ML_DSA_65_SIGNATURE_ONLY
  },
  ml_dsa_65_signature_row: (mod, args) => {
    requireArgs('ml_dsa_65_signature_row', args, 0)
    return mod.ML_DSA_65_SIGNATURE_ROW
  },
  ml_dsa_65_public_key_row: (mod, args) => {
    requireArgs('ml_dsa_65_public_key_row', args, 0)
    return mod.ML_DSA_65_PUBLIC_KEY_ROW
  },
  ops_sidecard_throughput_row: (mod, args) => {
    requireArgs('ops_sidecard_throughput_row', args, 0)
    return mod.OPS_SIDECARD_THROUGHPUT_ROW
  },
  ops_sidecard_ocsp_row: (mod, args) => {
    requireArgs('ops_sidecard_ocsp_row', args, 0)
    return mod.OPS_SIDECARD_OCSP_ROW
  },
  exec_secrecy_row: (mod, args) => {
    requireArgs('exec_secrecy_row', args, 0)
    return mod.EXEC_SECRECY_ROW
  },
  exec_migration_row: (mod, args) => {
    requireArgs('exec_migration_row', args, 0)
    return mod.EXEC_MIGRATION_ROW
  },
  assess_quick_question_count: (mod, args) => {
    requireArgs('assess_quick_question_count', args, 0)
    return mod.toWordIfSmall(mod.ASSESS_QUICK_QUESTION_COUNT)
  },
  Assess_quick_question_count: (mod, args) => {
    requireArgs('Assess_quick_question_count', args, 0)
    return mod.capitalizedSmallNumberWord(mod.ASSESS_QUICK_QUESTION_COUNT)
  },
  // Digit form, for tight CTA-label contexts ("Start — 6 questions") — same
  // precedent as report_section_total's raw String(n) above.
  assess_quick_question_count_digit: (mod, args) => {
    requireArgs('assess_quick_question_count_digit', args, 0)
    return String(mod.ASSESS_QUICK_QUESTION_COUNT)
  },
  assess_quick_minutes: (mod, args) => {
    requireArgs('assess_quick_minutes', args, 0)
    return String(mod.ASSESS_QUICK_MINUTES)
  },
  Assess_quick_minutes_word: (mod, args) => {
    requireArgs('Assess_quick_minutes_word', args, 0)
    return mod.capitalizedSmallNumberWord(mod.ASSESS_QUICK_MINUTES)
  },
  industry_sector_count: (mod, args) => {
    requireArgs('industry_sector_count', args, 0)
    return String(mod.INDUSTRY_LANDSCAPE_SECTOR_COUNT)
  },
  exec_crqc_estimate_row: (mod, args) => {
    requireArgs('exec_crqc_estimate_row', args, 0)
    return mod.EXEC_CRQC_ESTIMATE_ROW
  },
  // Role-neutral alias for EXEC_CRQC_ESTIMATE_ROW — same export, no 'exec_' prefix, for
  // boards outside the executive role (e.g. curious) that need the same consensus-window
  // string. Added 2026-08-23 after a literal '~2032' drifted from the site's real 2033
  // (2030-2036) consensus on curious/break.
  crqc_estimate_row: (mod, args) => {
    requireArgs('crqc_estimate_row', args, 0)
    return mod.EXEC_CRQC_ESTIMATE_ROW
  },
  exec_mosca_punchline: (mod, args) => {
    requireArgs('exec_mosca_punchline', args, 0)
    return mod.EXEC_MOSCA_PUNCHLINE
  },
  exec_mosca_footnote: (mod, args) => {
    requireArgs('exec_mosca_footnote', args, 0)
    return mod.EXEC_MOSCA_FOOTNOTE
  },
}

export const KNOWN_TOKEN_NAMES: readonly string[] = Object.keys(RESOLVERS)

// Token names may contain digits (e.g. `ml_dsa_65_signature_only`) — an
// earlier version of this pattern excluded them, which silently left that
// exact token unexpanded (caught by the ops proof-of-concept comparison
// against the live board, 2026-08-02: sideCard.rows[0].value came back as the
// literal string "{ml_dsa_65_signature_only}").
//
// The args group is a single `[^{}]*`, not a repeated `(?::[^{}]*)*` — an
// earlier version used the repeated form, which eslint-plugin-security
// flagged as a polynomial-backtracking ReDoS shape (the inner class can also
// match `:`, so the engine has multiple ways to partition input across
// iterations). Not realistically exploitable here (input is small,
// developer-authored CSV content, never end-user text), but the single-group
// form needs no repetition, expresses the same content ("everything up to the
// closing brace"), and is simpler regardless of the warning — args are still
// split on `:` in `expandTokens` below.
const TOKEN_RE = /\{([a-zA-Z_][a-zA-Z0-9_]*)([^{}]*)\}/g

/**
 * Expands every `{token:args}` placeholder in `content`. Throws on an unknown
 * token name or a resolver error — a silently-unexpanded or wrong-arity token
 * must fail the build, not ship as literal `{...}` text or a thrown-away typo.
 */
export function expandTokens(content: string, mod: PersonaConfigModule): string {
  return content.replace(TOKEN_RE, (whole, name: string, argsRaw: string) => {
    const resolver = RESOLVERS[name]
    if (!resolver) {
      throw new TokenError(`Unknown token "{${name}}" in: ${content}`)
    }
    const args = argsRaw.length > 0 ? argsRaw.slice(1).split(':') : []
    try {
      return resolver(mod, args)
    } catch (e) {
      if (e instanceof TokenError) throw e
      throw new TokenError(
        `Token "{${name}${argsRaw}}" failed to resolve: ${e instanceof Error ? e.message : String(e)}`
      )
    }
  })
}

/**
 * True if `text` still contains a `{...}` pattern shaped like a token after
 * expansion — the "no raw tokens escape" check the plan's audit gate needs.
 * Deliberately loose (any `{word...}` shape, not just known names) so a typo
 * that LOOKS like a token but isn't recognized fails loudly via `expandTokens`
 * itself, while this function catches anything that slipped past — e.g. a
 * brace that was never meant to be a token but reads like one.
 */
export function hasUnexpandedToken(text: string): boolean {
  TOKEN_RE.lastIndex = 0
  return TOKEN_RE.test(text)
}

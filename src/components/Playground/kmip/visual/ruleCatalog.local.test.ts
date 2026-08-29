// SPDX-License-Identifier: GPL-3.0-only
//
// Catalog drift-guard + factory sanity for the visual editor's rule catalog.
// Live-reads `pqctoday-hsm/kmip/src/policy/rule.rs`'s
// `known_fields_for_rule_type` — the single source of truth for both the
// rule-type list AND each type's known field set — instead of a
// hand-maintained pin (fixed 2026-08-28, gaps-remediation plan WS-1b: the
// old pin was a comment-dated snapshot that could drift from the real enum
// with nothing to notice). Same sibling-checkout relative path
// `policyCatalogSync.local.test.ts` already uses, one directory deeper
// (this file lives in `visual/`, that one doesn't) — but unlike that test's
// silent `if (!existsSync) return`, an absent checkout here FAILS LOUDLY:
// a rule-vocabulary drift guard that can silently never run for months is
// close to not existing at all.
//
// Venue: `*.local.test.ts` — local gate only (directive 2026-07-01).
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import {
  RULE_CATALOG,
  RULE_TYPE_IDS,
  FAMILY_META,
  FAMILY_ORDER,
  bucketOf,
  summarizeRule,
  centralListOf,
  SCOPES,
} from './ruleCatalog'
import { toEditable, serialize, normalized, newRuleId, type EditableRule } from './policyEditModel'

const RULE_RS_PATH = join(__dirname, '../../../../../../pqctoday-hsm/kmip/src/policy/rule.rs')

/** `{ tag: fields[] }` for every `Rule` variant, read straight out of
 * `known_fields_for_rule_type`'s match arms — both `"tag" => &[...]` and the
 * block form `"tag" => { &[...] }` it uses for longer lists. */
function readRustRuleVocabulary(): Record<string, string[]> {
  if (!existsSync(RULE_RS_PATH)) {
    throw new Error(
      `catalog ↔ grammar drift guard requires the sibling pqctoday-hsm checkout — expected ` +
        `it at ${RULE_RS_PATH}. This guard fails loudly rather than skipping: a rule-vocabulary ` +
        `drift check that can silently never run is not a check at all.`
    )
  }
  const src = readFileSync(RULE_RS_PATH, 'utf8')
  const fnMatch = /pub fn known_fields_for_rule_type[\s\S]*?\n\}/.exec(src)
  if (!fnMatch) {
    throw new Error(
      `could not find known_fields_for_rule_type in ${RULE_RS_PATH} — has it been renamed?`
    )
  }
  const vocabulary: Record<string, string[]> = {}
  const armRe = /"([a-z_]+)"\s*=>\s*\{?\s*&\[([^\]]*)\]/g
  let m: RegExpExecArray | null
  while ((m = armRe.exec(fnMatch[0])) !== null) {
    const [, tag, fieldsBody] = m
    vocabulary[tag] = [...fieldsBody.matchAll(/"([a-z_]+)"/g)].map((x) => x[1])
  }
  return vocabulary
}

describe('catalog ↔ grammar drift guard', () => {
  const rustVocabulary = readRustRuleVocabulary()
  const RULE_RS_TYPES = Object.keys(rustVocabulary)

  it('found a non-trivial rule vocabulary in rule.rs (sanity-check the parser itself)', () => {
    expect(RULE_RS_TYPES.length).toBeGreaterThanOrEqual(18)
  })

  it('covers exactly the rule types rule.rs defines', () => {
    expect([...RULE_TYPE_IDS].sort()).toEqual([...RULE_RS_TYPES].sort())
  })

  it('every catalog field is one rule.rs actually declares for that type', () => {
    for (const [type, spec] of Object.entries(RULE_CATALOG)) {
      const known = rustVocabulary[type]
      if (!known) continue // caught by the type-list assertion above
      for (const f of spec.fields) {
        expect(known, `${type}.${f.key} — not in rule.rs's known field set`).toContain(f.key)
      }
    }
  })

  it('single-op rules use `op`, not `ops` (grammar trap)', () => {
    expect(RULE_CATALOG.temporal_cutoff.fields.some((f) => f.key === 'op')).toBe(true)
    expect(RULE_CATALOG.temporal_cutoff.fields.some((f) => f.key === 'ops')).toBe(false)
    expect(RULE_CATALOG.lifecycle_state_gate.fields.some((f) => f.key === 'op')).toBe(true)
    expect(
      RULE_CATALOG.hybrid_dual_sign_requirement.fields.some((f) => f.key === 'ops_affected')
    ).toBe(true)
  })

  it('every family has meta and every spec belongs to an ordered family', () => {
    for (const spec of Object.values(RULE_CATALOG)) {
      expect(FAMILY_META[spec.family]).toBeDefined()
      expect(FAMILY_ORDER).toContain(spec.family)
    }
  })
})

/** `Scope`'s variants, straight out of its `Scope::ALL` array — PascalCase
 * Rust identifiers, converted to the kebab-case wire form
 * (`#[serde(rename_all = "kebab-case")]`) so it compares directly against
 * `SCOPES`'s `id`s (WS-6, 2026-08-28 gaps-remediation plan). */
function readRustScopeVocabulary(): string[] {
  if (!existsSync(RULE_RS_PATH)) {
    throw new Error(
      `scope drift guard requires the sibling pqctoday-hsm checkout — expected it at ${RULE_RS_PATH}.`
    )
  }
  const src = readFileSync(RULE_RS_PATH, 'utf8')
  const allMatch = /pub const ALL: \[Scope; \d+\] = \[([\s\S]*?)\];/.exec(src)
  if (!allMatch) {
    throw new Error(`could not find Scope::ALL in ${RULE_RS_PATH} — has it been renamed?`)
  }
  return [...allMatch[1].matchAll(/Scope::(\w+)/g)].map(([, variant]) =>
    variant.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
  )
}

describe('scope catalog ↔ grammar drift guard', () => {
  it('SCOPES covers exactly the Scope::ALL variants, in the same order', () => {
    const rustScopes = readRustScopeVocabulary()
    expect(rustScopes.length).toBeGreaterThanOrEqual(7)
    expect(SCOPES.map((s) => s.id)).toEqual(rustScopes)
  })
})

describe('factory defaults', () => {
  for (const spec of Object.values(RULE_CATALOG)) {
    it(`${spec.type}: make() populates the right buckets and round-trips`, () => {
      const made = spec.make()
      const rule: EditableRule = { id: newRuleId(), type: spec.type, enabled: true, ...made }

      // Every non-optional field must have a value in its declared bucket.
      for (const f of spec.fields) {
        if (f.optional) continue
        const bucket = bucketOf(f.kind)
        const v =
          bucket === 'lists'
            ? rule.lists[f.key]
            : bucket === 'maps'
              ? rule.maps[f.key]
              : rule.scalars[f.key]
        expect(v, `${spec.type}.${f.key} missing from ${bucket}`).toBeTruthy()
      }
      // No stray keys outside the field spec.
      const known = new Set(spec.fields.map((f) => f.key))
      for (const k of [
        ...Object.keys(rule.scalars),
        ...Object.keys(rule.lists),
        ...Object.keys(rule.maps),
      ])
        expect(known.has(k), `${spec.type} factory sets unknown field ${k}`).toBe(true)

      // A one-rule policy built from the factory survives the round trip.
      const policy = {
        schemaVersion: '1',
        metadata: {
          name: `factory-${spec.type}`,
          description: '',
          authority: '',
          effective: 'always',
          expires: '',
          scopes: [],
          complianceMapping: [],
        },
        rules: [rule],
      }
      expect(normalized(toEditable(serialize(policy)))).toEqual(normalized(policy))

      // The summary line renders something (or intentionally nothing).
      expect(typeof summarizeRule(rule)).toBe('string')
      // central list accessor agrees with the spec
      const central = spec.fields.find((f) => f.central)
      expect(centralListOf(rule) === null ? undefined : centralListOf(rule)?.key).toBe(central?.key)
    })
  }
})

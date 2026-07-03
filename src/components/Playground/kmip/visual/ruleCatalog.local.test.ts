// SPDX-License-Identifier: GPL-3.0-only
//
// Catalog drift-guard + factory sanity for the visual editor's rule catalog.
// The pinned type list mirrors `pqctoday-hsm/kmip/src/policy/rule.rs` (enum
// Rule, serde snake_case). If the Rust grammar grows/renames a variant, this
// pin is the reminder to update the catalog, the serializer edge cases, and
// the inspector field kinds together.
//
// Venue: `*.local.test.ts` — local gate only (directive 2026-07-01).
import { describe, it, expect } from 'vitest'
import {
  RULE_CATALOG,
  RULE_TYPE_IDS,
  FAMILY_META,
  FAMILY_ORDER,
  bucketOf,
  summarizeRule,
  centralListOf,
} from './ruleCatalog'
import { toEditable, serialize, normalized, newRuleId, type EditableRule } from './policyEditModel'

// Pinned from rule.rs (verified 2026-07-01, fix/cacp-gap-remediation).
const RULE_RS_TYPES = [
  'algorithm_default',
  'algorithm_substitution',
  'algorithm_allowlist',
  'algorithm_denylist',
  'min_key_length',
  'max_key_age_days',
  'require_usage_mask',
  'require_custom_attribute',
  'temporal_cutoff',
  'lifecycle_state_gate',
  'hybrid_dual_sign_requirement',
  'compliance_profile_gate',
  'hash_algorithm_allowlist',
  'mechanism_parameter_constraint',
  'mac_mechanism_policy',
  'mechanism_parameter_default',
  'mechanism_allowlist',
  'mechanism_denylist',
]

describe('catalog ↔ grammar drift guard', () => {
  it('covers exactly the 18 rule types rule.rs defines', () => {
    expect([...RULE_TYPE_IDS].sort()).toEqual([...RULE_RS_TYPES].sort())
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

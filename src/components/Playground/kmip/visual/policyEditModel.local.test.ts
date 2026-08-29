// SPDX-License-Identifier: GPL-3.0-only
//
// Round-trip + serializer tests for the visual editor's editable policy model.
// This is the correctness bar for the whole feature (implementation plan §7):
//
//   Layer 1 (pure TS):   toEditable(serialize(toEditable(y))) ≡ toEditable(y)
//                        for every shipped fixture, plus parsePolicyModel
//                        cross-checks so the display parser reads the generated
//                        YAML identically.
//   Layer 2 (real WASM): the Rust policy loader accepts every serialized
//                        fixture with the same rule count + warnings as the
//                        original — the generated YAML is engine-valid.
//
// Venue: `*.local.test.ts` — excluded from CI vitest globs, run by the local
// gate (project directive 2026-07-01: new suites are local-only).
/* eslint-disable security/detect-non-literal-fs-filename -- reads fixed repo dirs */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect, beforeAll } from 'vitest'
import { parsePolicyModel } from '../policyModel'
import {
  toEditable,
  serialize,
  validate,
  normalized,
  newRuleId,
  type EditablePolicy,
  type EditableRule,
} from './policyEditModel'

const POLICY_DIR = join(process.cwd(), 'public/kmip-policies')
const fixtures = readdirSync(POLICY_DIR).filter((f) => f.endsWith('.yaml'))

const read = (f: string): string => readFileSync(join(POLICY_DIR, f), 'utf8')

describe('fixture corpus', () => {
  it('finds the shipped policy fixtures', () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(13)
  })
})

describe('layer 1 — structural round-trip over every shipped fixture', () => {
  for (const f of fixtures) {
    it(`${f} survives parse → serialize → parse`, () => {
      const original = toEditable(read(f))
      const regenerated = toEditable(serialize(original))
      expect(normalized(regenerated)).toEqual(normalized(original))
    })

    it(`${f} reads identically through the display parser after regeneration`, () => {
      const yaml = read(f)
      const regen = serialize(toEditable(yaml))
      const a = parsePolicyModel(yaml)
      const b = parsePolicyModel(regen)
      expect(b.rules.length).toBe(a.rules.length)
      expect(b.rules.map((r) => r.type)).toEqual(a.rules.map((r) => r.type))
      expect(b.rules.map((r) => r.ops)).toEqual(a.rules.map((r) => r.ops))
      expect(b.rules.map((r) => r.algorithms)).toEqual(a.rules.map((r) => r.algorithms))
      expect(b.rules.map((r) => r.reason)).toEqual(a.rules.map((r) => r.reason))
      expect(b.name).toBe(a.name)
      expect(b.authority).toBe(a.authority)
      expect(b.effective).toBe(a.effective)
      expect(b.compliance).toEqual(a.compliance)
    })
  }
})

// ── Serializer edge cases ───────────────────────────────────────────────────

const bareRule = (over: Partial<EditableRule>): EditableRule => ({
  id: newRuleId(),
  type: 'algorithm_denylist',
  enabled: true,
  scalars: {},
  lists: {},
  maps: {},
  ...over,
})

const shell = (rules: EditableRule[]): EditablePolicy => ({
  schemaVersion: '1',
  metadata: {
    name: 'test-policy',
    description: 'line one\nline two',
    authority: 'pqctoday-hsm/training',
    effective: 'always',
    expires: '',
    scopes: [],
    complianceMapping: [{ framework: 'NIST IR 8547', status: 'aligned' }],
  },
  rules,
})

describe('serializer grammar details', () => {
  it('quotes TimeBound scalars (dates and always) and leaves ints/bools bare', () => {
    const y = serialize(
      shell([
        bareRule({
          type: 'min_key_length',
          scalars: { algorithm: 'RSA', min_bits: '3072', reason: 'too short' },
        }),
        bareRule({
          type: 'temporal_cutoff',
          scalars: { op: 'Sign', algorithm_class: 'classical', after: '2030-01-01', reason: 'r' },
        }),
        bareRule({
          type: 'mechanism_parameter_default',
          scalars: { deterministic: 'true', tag_length: '16', reason: 'r' },
          lists: { ops: ['Encrypt'] },
        }),
      ])
    )
    expect(y).toContain('min_bits: 3072')
    expect(y).toContain('after: "2030-01-01"')
    expect(y).toContain('effective: "always"')
    expect(y).toContain('deterministic: true')
    expect(y).toContain('tag_length: 16')
  })

  it('round-trips metadata.expires (schema v2+) and omits it when unset', () => {
    const withExpiry = shell([])
    withExpiry.metadata.expires = '2030-01-01'
    const y = serialize(withExpiry)
    expect(y).toContain('expires: "2030-01-01"')
    expect(toEditable(y).metadata.expires).toBe('2030-01-01')

    const noExpiry = serialize(shell([]))
    expect(noExpiry).not.toContain('expires:')
    expect(toEditable(noExpiry).metadata.expires).toBe('')
  })

  it('round-trips metadata.scopes (schema v3) and omits it when unset', () => {
    const withScopes = shell([])
    withScopes.metadata.scopes = ['signing', 'global']
    const y = serialize(withScopes)
    expect(y).toContain('scopes: [signing, global]')
    expect(toEditable(y).metadata.scopes).toEqual(['signing', 'global'])

    const noScopes = serialize(shell([]))
    expect(noScopes).not.toContain('scopes:')
    expect(toEditable(noScopes).metadata.scopes).toEqual([])
  })

  it('emits AttrPredicate maps as inline flow maps', () => {
    const y = serialize(
      shell([
        bareRule({
          lists: { ops: ['Sign'], algorithms: ['3DES'] },
          scalars: { reason: 'banned' },
          maps: {
            exception_custom_attribute: { name: 'pqctoday-purpose', value: 'legacy-verify' },
          },
        }),
      ])
    )
    expect(y).toContain(
      'exception_custom_attribute: { name: pqctoday-purpose, value: legacy-verify }'
    )
  })

  it('serializes a disabled rule as a comment block the parser does not resurrect', () => {
    const y = serialize(
      shell([
        bareRule({
          enabled: false,
          lists: { ops: ['Sign'], algorithms: ['MD5'] },
          scalars: { reason: 'r' },
        }),
        bareRule({ lists: { ops: ['Sign'], algorithms: ['SHA-1'] }, scalars: { reason: 'r' } }),
      ])
    )
    expect(y).toContain('# (disabled in editor)')
    expect(y).toContain('# - type: algorithm_denylist')
    const back = toEditable(y)
    expect(back.rules.length).toBe(1)
    expect(back.rules[0].lists.algorithms).toEqual(['SHA-1'])
  })

  it('keeps unknown (future-grammar) fields through the round trip', () => {
    const yaml = [
      'schema_version: 1',
      '',
      'metadata:',
      '  name: forward-compat',
      '',
      'rules:',
      '  - type: algorithm_denylist',
      '    ops: [Sign]',
      '    algorithms: [MD5]',
      '    some_future_scalar: xyz',
      '    some_future_list: [a, b]',
      '    reason: "kept"',
      '',
    ].join('\n')
    const rt = toEditable(serialize(toEditable(yaml)))
    expect(rt.rules[0].scalars.some_future_scalar).toBe('xyz')
    expect(rt.rules[0].lists.some_future_list).toEqual(['a', 'b'])
  })

  it('parses block-style lists (dash items) into the same model as inline lists', () => {
    const block = [
      'schema_version: 1',
      '',
      'metadata:',
      '  name: block-list',
      '',
      'rules:',
      '  - type: algorithm_denylist',
      '    ops:',
      '      - Sign',
      '      - Encrypt',
      '    algorithms: [MD5]',
      '    reason: r',
      '',
    ].join('\n')
    const p = toEditable(block)
    expect(p.rules[0].lists.ops).toEqual(['Sign', 'Encrypt'])
    // and the regenerated (inline) form parses back identically
    expect(normalized(toEditable(serialize(p)))).toEqual(normalized(p))
  })

  it('preserves multi-line descriptions verbatim', () => {
    const p = shell([])
    const rt = toEditable(serialize(p))
    expect(rt.metadata.description).toBe('line one\nline two')
  })
})

// ── Static validation ───────────────────────────────────────────────────────

describe('validate()', () => {
  it('flags an algorithm both denied and allowlisted for overlapping ops', () => {
    const issues = validate(
      shell([
        bareRule({
          type: 'algorithm_allowlist',
          lists: { ops: ['Create'], algorithms: ['AES-256', '3DES'] },
          scalars: { reason: 'r' },
        }),
        bareRule({
          type: 'algorithm_denylist',
          lists: { ops: ['Create'], algorithms: ['3DES'] },
          scalars: { reason: 'r' },
        }),
      ])
    )
    expect(issues.some((i) => i.level === 'error' && i.message.includes('"3DES"'))).toBe(true)
  })

  it('does NOT flag deny/allow overlap when the op scopes are disjoint', () => {
    const issues = validate(
      shell([
        bareRule({
          type: 'algorithm_allowlist',
          lists: { ops: ['Encrypt'], algorithms: ['AES-256'] },
          scalars: { reason: 'r' },
        }),
        bareRule({
          type: 'algorithm_denylist',
          lists: { ops: ['Sign'], algorithms: ['AES-256'] },
          scalars: { reason: 'r' },
        }),
      ])
    )
    expect(issues.filter((i) => i.level === 'error')).toEqual([])
  })

  it('flags a dead default (denied by a later rule)', () => {
    const issues = validate(
      shell([
        bareRule({
          type: 'algorithm_default',
          scalars: { default_algorithm: 'ML-DSA-65', reason: 'r' },
          lists: { ops: ['CreateKeyPair:Sign'] },
        }),
        bareRule({
          type: 'algorithm_denylist',
          lists: { ops: ['CreateKeyPair'], algorithms: ['ML-DSA-65'] },
          scalars: { reason: 'r' },
        }),
      ])
    )
    expect(issues.some((i) => i.level === 'error' && i.message.includes('Default'))).toBe(true)
  })

  it('flags a rule scoped exclusively to Create that names an asymmetric algorithm', () => {
    const issues = validate(
      shell([
        bareRule({
          type: 'algorithm_denylist',
          lists: { ops: ['Create'], algorithms: ['ML-DSA-87'] },
          scalars: { reason: 'r' },
        }),
      ])
    )
    expect(
      issues.some((i) => i.level === 'error' && i.message.includes('Create never matches this'))
    ).toBe(true)
  })

  it('does NOT flag Create+asymmetric when the same rule also covers CreateKeyPair', () => {
    const issues = validate(
      shell([
        bareRule({
          type: 'algorithm_denylist',
          lists: { ops: ['Create', 'CreateKeyPair'], algorithms: ['ML-DSA-87'] },
          scalars: { reason: 'r' },
        }),
      ])
    )
    expect(issues.filter((i) => i.level === 'error')).toEqual([])
  })

  it('flags a temporal window that never opens (effective_from after effective_until)', () => {
    const issues = validate(
      shell([
        bareRule({
          type: 'hybrid_dual_sign_requirement',
          lists: { ops_affected: ['Sign'] },
          scalars: {
            primary: 'ML-DSA-65',
            secondary: 'Ed25519',
            effective_from: '2029-12-31',
            effective_until: '2026-01-01',
            reason: 'r',
          },
        }),
      ])
    )
    expect(issues.some((i) => i.level === 'error' && i.message.includes('never opens'))).toBe(true)
  })

  it('flags an unconditional gating rule that shadows a later same-type rule', () => {
    const issues = validate(
      shell([
        bareRule({
          type: 'hybrid_dual_sign_requirement',
          lists: { ops_affected: ['Sign'] },
          scalars: { primary: 'ML-DSA-65', secondary: 'Ed25519', reason: 'r' },
        }),
        bareRule({
          type: 'hybrid_dual_sign_requirement',
          lists: { ops_affected: ['Sign'] },
          scalars: { primary: 'ML-DSA-87', secondary: 'ECDSA-P384', reason: 'r' },
          maps: { triggered_by_custom_attribute: { name: 'pqctoday-assurance', value: 'high' } },
        }),
      ])
    )
    expect(issues.some((i) => i.level === 'error' && i.message.includes('is unreachable'))).toBe(
      true
    )
  })

  it('flags an empty central list and a disabled substitution', () => {
    const issues = validate(
      shell([
        bareRule({
          type: 'algorithm_denylist',
          lists: { ops: ['Sign'], algorithms: [] },
          scalars: { reason: 'r' },
        }),
        bareRule({
          type: 'algorithm_substitution',
          enabled: false,
          scalars: { from: 'ECDSA-P256', to: 'ML-DSA-65', reason: 'r' },
          lists: { ops: ['Sign'] },
        }),
      ])
    )
    expect(issues.some((i) => i.message.includes('matches nothing'))).toBe(true)
    expect(issues.some((i) => i.message.includes('will not migrate'))).toBe(true)
  })

  // 2026-07-04 gap-audit remediation: hybrid-migration-window.yaml's rule 2
  // (the high-assurance composite alternative) used to be unreachable — an
  // earlier UNCONDITIONAL rule 1 shadowed it (both matched every Sign; rule 1
  // always won, first-match-wins). Fixed by giving BOTH composite rules their
  // own `triggered_by_custom_attribute` (x-pqctoday-dual-sign=required vs
  // x-pqctoday-assurance=high) — each is now independently reachable, so no
  // fixture should carry this finding any more.
  const KNOWN_INTENTIONAL_ERRORS: Record<string, string[]> = {}

  it('is clean on every shipped fixture except known-intentional warnings', () => {
    for (const f of fixtures) {
      const issues = validate(toEditable(read(f)))
      // `f` is a fixture filename from `readdirSync` of a fixed repo dir, never user input.
      // eslint-disable-next-line security/detect-object-injection
      const known = KNOWN_INTENTIONAL_ERRORS[f] ?? []
      const errors = issues
        .filter((i) => i.level === 'error')
        .filter((i) => !known.some((substr) => i.message.includes(substr)))
      expect(errors, `${f}: ${errors.map((e) => e.message).join(' | ')}`).toEqual([])
    }
  })

  it('hybrid-migration-window.yaml no longer has an unreachable composite rule (2026-07-04 fix)', () => {
    const issues = validate(toEditable(read('hybrid-migration-window.yaml')))
    expect(issues.some((i) => i.level === 'error' && i.message.includes('is unreachable'))).toBe(
      false
    )
  })
})

// ── Layer 2 — the real Rust loader accepts everything we generate ───────────

interface WasmExports {
  __wbindgen_start: () => void
}
interface BgModule {
  __wbg_set_wasm: (exports: unknown) => void
  KmipPlayground: new () => {
    load_policy: (yaml: string) => string
    policy_status: () => string
    free: () => void
  }
}

describe('layer 2 — WASM policy loader round-trip', () => {
  let bg: BgModule

  beforeAll(async () => {
    bg = (await import('@/wasm/kmip/pqctoday_kmip_wasm_bg.js')) as unknown as BgModule
    const bytes = readFileSync(join(process.cwd(), 'src/wasm/kmip/pqctoday_kmip_wasm_bg.wasm'))
    const { instance } = await WebAssembly.instantiate(bytes, {
      './pqctoday_kmip_wasm_bg.js': bg as unknown as WebAssembly.ModuleImports,
    })
    bg.__wbg_set_wasm(instance.exports)
    ;(instance.exports as unknown as WasmExports).__wbindgen_start()
  }, 30_000)

  it('loads every shipped fixture AND its regenerated form with equal results', () => {
    const pg = new bg.KmipPlayground()
    for (const f of fixtures) {
      const yaml = read(f)
      const regen = serialize(toEditable(yaml))

      const a = JSON.parse(pg.load_policy(yaml)) as {
        ok: boolean
        warnings?: string[]
        error?: string
      }
      const statusA = JSON.parse(pg.policy_status()) as { rules?: number }
      const b = JSON.parse(pg.load_policy(regen)) as {
        ok: boolean
        warnings?: string[]
        error?: string
      }
      const statusB = JSON.parse(pg.policy_status()) as { rules?: number }

      expect(a.ok, `${f} original failed: ${a.error}`).toBe(true)
      expect(b.ok, `${f} regenerated failed: ${b.error}`).toBe(true)
      expect(statusB.rules, `${f} rule-count drift`).toBe(statusA.rules)
      expect(b.warnings ?? [], `${f} warning drift`).toEqual(a.warnings ?? [])
    }
  })
})

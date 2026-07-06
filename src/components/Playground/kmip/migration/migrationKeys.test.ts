// SPDX-License-Identifier: GPL-3.0-only
//
// Migration estate config sanity — the card labels ARE the API surface the
// policies pattern-match on, so drift between MIGRATION_KEYS and
// migration-classical.yaml silently breaks the label-only demo. This suite
// pins: every default label matches exactly the policy rule that's supposed
// to catch it, and the expected classical algorithm is the rule's answer.
/* eslint-disable security/detect-non-literal-fs-filename -- reads a fixed repo file. */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { MIGRATION_KEYS, MIGRATION_POLICIES } from './migrationKeys'
import { POLICY_PRESETS } from '@/wasm/kmip/kmipMeta'

const yaml = readFileSync(
  join(__dirname, '../../../../../public/kmip-policies/migration-classical.yaml'),
  'utf8'
)

/** Tiny mirror of the engine's rule glob (`*` any run, `?` one char). */
const globMatch = (pattern: string, name: string): boolean => {
  const re = new RegExp(
    '^' +
      pattern
        .split('')
        .map((c) => (c === '*' ? '.*' : c === '?' ? '.' : c.replace(/[.+^${}()|[\]\\]/g, '\\$&')))
        .join('') +
      '$',
    'i'
  )
  return re.test(name)
}

/** Pull (name_pattern, default_algorithm) pairs out of the policy YAML —
 * string-level on purpose: this guards the FILE the browser fetches. */
const patternedDefaults = (): Array<{ pattern: string; algorithm: string }> => {
  const out: Array<{ pattern: string; algorithm: string }> = []
  const ruleBlocks = yaml.split(/\n {2}- type:/).slice(1)
  for (const block of ruleBlocks) {
    if (!block.startsWith(' algorithm_default')) continue
    const pattern = block.match(/name_pattern:\s*"([^"]+)"/)?.[1]
    const algorithm = block.match(/default_algorithm:\s*(\S+)/)?.[1]
    if (pattern && algorithm) out.push({ pattern, algorithm })
  }
  return out
}

describe('migration estate ↔ migration-classical.yaml', () => {
  it('every patterned key label matches its policy rule and algorithm', () => {
    const rules = patternedDefaults()
    expect(rules.length).toBeGreaterThanOrEqual(6)
    for (const key of MIGRATION_KEYS) {
      const hit = rules.find((r) => globMatch(r.pattern, key.defaultLabel))
      if (key.id === 'vault') {
        // vault-archive-cipher deliberately rides the GENERIC AES-256 default.
        expect(hit, 'vault must not collide with a patterned rule').toBeUndefined()
        continue
      }
      expect(hit, `${key.defaultLabel} matches no name_pattern rule`).toBeDefined()
      expect(hit?.algorithm, `${key.defaultLabel} → wrong algorithm`).toBe(key.classicalAlgorithm)
    }
  })

  it('labels are unique and non-empty', () => {
    const labels = MIGRATION_KEYS.map((k) => k.defaultLabel)
    expect(new Set(labels).size).toBe(labels.length)
    for (const l of labels) expect(l).toMatch(/^[a-z0-9-]+$/)
  })

  it('every AVAILABLE migration policy is a registered preset with a shipped file', () => {
    for (const p of MIGRATION_POLICIES.filter((p) => p.available)) {
      expect(
        POLICY_PRESETS.some((preset) => preset.file === p.file),
        `${p.file} missing from POLICY_PRESETS`
      ).toBe(true)
      expect(() =>
        readFileSync(join(__dirname, '../../../../../public/kmip-policies', p.file), 'utf8')
      ).not.toThrow()
    }
  })
})

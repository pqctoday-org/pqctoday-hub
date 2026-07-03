// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-non-literal-fs-filename -- test reads fixed
   policy fixtures from the repo's own public/ dir, not user input. */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { parsePolicyModel, temporalRules } from './policyModel'
import { POLICY_PRESETS } from '@/wasm/kmip/kmipMeta'

const POLICY_DIR = join(__dirname, '../../../../public/kmip-policies')
const read = (file: string) => readFileSync(join(POLICY_DIR, file), 'utf8')

// Rule counts as reported by the real engine's policy loader (the source of truth).
const EXPECTED_RULES: Record<string, number> = {
  'aead-only.yaml': 2,
  // Y5: encrypt-side KEM substitutions removed (deferred to Phase 5) → 9→7.
  // 2026-07-02: symmetric AES-256 Create default added → 8.
  'auto-migrate-on-use.yaml': 8,
  'bsi-tr-02102.yaml': 7,
  'classical.yaml': 5,
  // Y9: HSS + XMSS^MT removed (multi-tree not in CNSA 2.0) → 12→11.
  'cnsa-2.0.yaml': 11,
  'deterministic-signing.yaml': 1,
  'fips-hashing.yaml': 1,
  'fips-only.yaml': 11,
  'hybrid-migration-window.yaml': 8,
  'pkcs11-mechanism-lockdown.yaml': 4,
  // 2026-07-02: 2027–2029 hybrid composite window added → 11.
  'pqc-migration-2030.yaml': 11,
  // Y5: encrypt-side RSA→ML-KEM substitution removed → 7→6.
  'pqc.yaml': 6,
  'training-permissive.yaml': 0,
}

describe('parsePolicyModel', () => {
  it('every preset file is in the expected-counts table', () => {
    for (const p of POLICY_PRESETS) expect(EXPECTED_RULES).toHaveProperty(p.file)
  })

  for (const [file, count] of Object.entries(EXPECTED_RULES)) {
    it(`${file} parses ${count} rules (matches the engine loader)`, () => {
      const m = parsePolicyModel(read(file))
      expect(m.rules).toHaveLength(count)
      // No rule should fall through to the untyped 'other' bucket.
      expect(m.rules.filter((r) => r.tone === 'other')).toHaveLength(0)
    })
  }

  it('classical resolves algorithm defaults', () => {
    const m = parsePolicyModel(read('classical.yaml'))
    const defaults = m.rules.filter((r) => r.type === 'algorithm_default')
    expect(defaults.length).toBeGreaterThan(0)
    expect(defaults.some((r) => r.chips.some((c) => /ECDSA|RSA|ECDH/.test(c.value)))).toBe(true)
  })

  it('pqc captures substitution (rekey) from→to', () => {
    const m = parsePolicyModel(read('pqc.yaml'))
    const sub = m.rules.find((r) => r.type === 'algorithm_substitution')
    expect(sub).toBeTruthy()
    expect(sub!.chips.some((c) => /→/.test(c.value))).toBe(true)
  })

  it('cnsa-2.0 carries compliance mapping rows', () => {
    const m = parsePolicyModel(read('cnsa-2.0.yaml'))
    expect(m.compliance.length).toBeGreaterThanOrEqual(3)
    expect(m.compliance.some((c) => /CNSA/.test(c.framework))).toBe(true)
  })

  it('hybrid-migration-window has temporal rules with bounds', () => {
    const m = parsePolicyModel(read('hybrid-migration-window.yaml'))
    const temporal = temporalRules(m)
    expect(temporal.length).toBeGreaterThan(0)
    expect(temporal.some((r) => r.effectiveFrom || r.effectiveUntil || r.after)).toBe(true)
  })

  it('pkcs11-mechanism-lockdown surfaces mechanism lists', () => {
    const m = parsePolicyModel(read('pkcs11-mechanism-lockdown.yaml'))
    const allow = m.rules.find((r) => r.type === 'mechanism_allowlist')
    expect(allow).toBeTruthy()
    expect(allow!.algorithms.some((a) => a.startsWith('CKM_'))).toBe(true)
  })

  it('bsi-tr-02102 allows FrodoKEM / Classic McEliece (the regional contrast)', () => {
    const m = parsePolicyModel(read('bsi-tr-02102.yaml'))
    const allow = m.rules.find((r) => r.type === 'algorithm_allowlist')
    expect(allow).toBeTruthy()
    expect(allow!.algorithms.some((a) => /Frodo|McEliece/.test(a))).toBe(true)
  })
})

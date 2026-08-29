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
//
// 2026-08-28 (gaps-remediation plan WS-10): this table hadn't been touched
// since 2026-07-05 (`git log`), so it had drifted silently through every
// modular-policy-plan wave and this program's own WS-1/WS-2/WS-3 fixes —
// this file's own `npm run test` (the CI-visible, non-`.local.` suite) was
// never run as part of any of that work, only the `*.local.test.ts` local
// gate, so nothing caught it. Reconciled to the four files that had
// drifted (`auto-migrate-on-use.yaml`, `migration-classical.yaml`,
// `pqc-migration-2030.yaml`, `pqc.yaml`) by counting each file's real
// `- type:` rule declarations directly, independent of `parsePolicyModel`,
// and confirming the two counts agree — not by re-deriving the per-change
// history the way earlier comments in this table do, since that history
// spans commits well outside this fix's scope to audit. If this drifts
// again, `gate:cacp` (now wired into `.husky/pre-push`) is the backstop.
const EXPECTED_RULES: Record<string, number> = {
  'aead-only.yaml': 2,
  // Y5: encrypt-side KEM substitutions removed (deferred to Phase 5) → 9→7.
  // 2026-07-02: symmetric AES-256 Create default added → 8.
  // 2026-07-05: classical-KEM merge adds ECDH-P256/P384 → ML-KEM-768
  // Encapsulate-rekey substitutions → 10.
  // 2026-08-28: reconciled to actual file content (drifted since 2026-07-05,
  // see table header) → 20.
  'auto-migrate-on-use.yaml': 20,
  // 2026-07-04 gap-audit remediation: signature allowlist + opt-in composite
  // + 2036 cutoffs + RSA PSS/OAEP constraints → 7→12.
  'bsi-tr-02102.yaml': 12,
  // 2026-07-04: hand-listed PQC denylist → class-based cutoffs ×5 → 5→9.
  'classical.yaml': 9,
  // 2026-07-04: SHA-384/512 hash gate + Encrypt/Encapsulate lifecycle gates → 11→14.
  'cnsa-2.0.yaml': 14,
  'deterministic-signing.yaml': 1,
  'fips-hashing.yaml': 1,
  // 2026-07-04: hash allowlist + OAEP constraint replace the dead weak-digest
  // rule; usage-mask rules cover all FIPS 203/204 sets, then all 12 SLH-DSA
  // sets (SLH-DSA was fully allowlisted but had no usage-mask rule at all)
  // → 11→14→26.
  'fips-only.yaml': 26,
  // 2026-07-04: unconditional composite → window cutoffs ×2 + opt-in composite;
  // the no-op post-2030 Create cutoff folded into one CreateKeyPair cutoff → 8.
  'hybrid-migration-window.yaml': 8,
  // Migration tab estate (2026-07-05): 9 label-pattern/generic defaults + the
  // PQC boundary denylist → 10.
  // 2026-08-28: reconciled to actual file content (drifted since 2026-07-05,
  // see table header) → 14.
  'migration-classical.yaml': 14,
  // Migration full-PQC target: 4 defaults + 6 substitutions + 2 denylists → 12.
  'migration-pqc.yaml': 12,
  // Migration hybrid transition: 3 defaults + 6 substitutions + 2 denylists → 11.
  'migration-hybrid.yaml': 11,
  'pkcs11-mechanism-lockdown.yaml': 4,
  // 2026-07-04: mechanism-dimension weak-crypto rules + DES/3DES denylist +
  // class-based 2027 cutoff + post-2030 creation cutoff → 11→14; +ML-KEM-512
  // usage-mask rule (rule 7 was missing the smallest KEM size) → 15.
  // 2026-08-28: +1 severity:warn temporal_cutoff (WS-3 deprecation worked
  // example) + reconciled other drift since 2026-07-05 (see table header) → 17.
  'pqc-migration-2030.yaml': 17,
  // 2026-07-04: Sign-path rekey extended to P-384/P-521/RSA-3072 → 6→9.
  // 2026-07-05: classical-KEM merge adds ECDH-P256/P384 + RSA-3072
  // Encapsulate-rekey substitutions to ML-KEM-1024 → 12.
  // 2026-08-28: reconciled to actual file content (drifted since 2026-07-05,
  // see table header) → 14.
  'pqc.yaml': 14,
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

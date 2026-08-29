// SPDX-License-Identifier: GPL-3.0-only
//
// Parity tests for the illustrative simulator (policySim.ts) against the
// Rust engine's semantics (pqctoday-hsm/kmip/src/policy/rule.rs::check_pass2),
// exercised over the SHIPPED policy YAMLs. This is the drift guard for the
// 07-02 three-layer audit finding: the graph used to silently ALLOW requests
// the engine denies (hybrid/hash/mechanism/MAC rules fell through as
// "advisory").
//
// Two kinds of expectations:
//   ENGINE PARITY — the sim verdict must equal what rule.rs would decide.
//   KNOWN YAML GAP — documents a policy-authoring hole (Phase 3 of the
//   2026-07-02 remediation plan); flip these when the YAML is fixed.
//
// Venue: `*.local.test.ts` — excluded from CI vitest globs, run by the local
// gate (project directive 2026-07-01: new suites are local-only).
/* eslint-disable security/detect-non-literal-fs-filename -- reads fixed repo dirs */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect, beforeAll } from 'vitest'
import { toEditable } from './policyEditModel'
import { evaluatePolicy, type SimRequest, type SimResult } from './policySim'

const POLICY_DIR = join(__dirname, '../../../../../public/kmip-policies')
const load = (file: string) => toEditable(readFileSync(join(POLICY_DIR, file), 'utf8'))

const REQ_DEFAULTS: SimRequest = {
  op: 'Sign',
  algorithm: '',
  keyName: '',
  keyState: 'Active',
  bits: '',
  date: '2026-07-01',
  attrs: [],
  usageFlags: ['Sign', 'Verify'],
  hash: '',
  blockMode: '',
  padding: '',
  mechanism: '',
  deterministic: '',
  keyActivatedOn: '',
}
const req = (over: Partial<SimRequest>): SimRequest => ({ ...REQ_DEFAULTS, ...over })

const run = (file: string, over: Partial<SimRequest>): SimResult =>
  evaluatePolicy(load(file), req(over))

describe('hybrid-migration-window — composite signing window', () => {
  it('ENGINE PARITY: pure-classical Sign INSIDE the window is denied (hybrid rule gates Sign)', () => {
    const r = run('hybrid-migration-window.yaml', {
      op: 'Sign',
      algorithm: 'ECDSA-P256',
      date: '2027-06-01',
    })
    expect(r.verdict.kind).toBe('deny')
    expect(r.verdict.reason).toMatch(/composite/i)
  })

  it('ENGINE PARITY: the LAMPS composite passes inside the window', () => {
    const r = run('hybrid-migration-window.yaml', {
      op: 'Sign',
      algorithm: 'ML-DSA-65-Ed25519',
      date: '2027-06-01',
    })
    expect(r.verdict.kind).toBe('allow')
  })

  it('ENGINE PARITY: symmetric Create inside the window is NOT bricked by the dual-sign rule', () => {
    const r = run('hybrid-migration-window.yaml', {
      op: 'Create',
      algorithm: 'AES-256',
      date: '2027-06-01',
    })
    expect(r.verdict.kind).toBe('allow')
  })

  it('ENGINE PARITY: classical CreateKeyPair past the 2030 cutoff is denied (temporal_cutoff)', () => {
    // 2026-07-04 fix: the old rule gated the bare `Create` op — the
    // SYMMETRIC creation op (AES/HMAC) — which can never carry a classical
    // ASYMMETRIC algorithm like ECDSA-P256/ECDH-P256 (those always arrive via
    // `CreateKeyPair`), so the rule was a permanent no-op. The corrected rule
    // gates `CreateKeyPair`. Exercised here on the `:KeyAgreement` purpose,
    // since `:Sign` is already denied from the window's START (2026) by an
    // earlier rule — this isolates the NEW post-2030 cutoff specifically.
    const r = run('hybrid-migration-window.yaml', {
      op: 'CreateKeyPair:KeyAgreement',
      algorithm: 'ECDH-P256',
      date: '2031-12-30',
    })
    expect(r.verdict.kind).toBe('deny')
  })

  it('classical signing-key creation in-window is denied with no exception', () => {
    // 2026-07-04 rewrite: classical signing is cut off from the window's
    // START (2026-01-01) by a class-based temporal_cutoff on
    // `CreateKeyPair:Sign` (replacing the old unconditional composite mandate
    // that also denied pure PQC — see the hybrid-migration-window.yaml
    // description). No attribute exempts it.
    const r = run('hybrid-migration-window.yaml', {
      op: 'CreateKeyPair:Sign',
      algorithm: 'ECDSA-P256',
      date: '2027-06-01',
      attrs: ['x-pqctoday-purpose=legacy-verify'],
    })
    expect(r.verdict.kind).toBe('deny')
    expect(r.verdict.reason).toMatch(/composite/i)
  })

  it('classical Sign AFTER the window is denied (Phase 3: post-window classical-Sign cutoff added)', () => {
    const r = run('hybrid-migration-window.yaml', {
      op: 'Sign',
      algorithm: 'ECDSA-P256',
      date: '2031-12-30',
    })
    expect(r.verdict.kind).toBe('deny')
  })
})

describe('fips-hashing — hash allowlist is enforced, absence is explicit', () => {
  it('ENGINE PARITY: SHA-1 Sign is denied', () => {
    const r = run('fips-hashing.yaml', { op: 'Sign', algorithm: 'RSA-3072', hash: 'SHA-1' })
    expect(r.verdict.kind).toBe('deny')
  })

  it('ENGINE PARITY: SHA-256 Sign is allowed', () => {
    const r = run('fips-hashing.yaml', { op: 'Sign', algorithm: 'RSA-3072', hash: 'SHA-256' })
    expect(r.verdict.kind).toBe('allow')
  })

  it('HONESTY: no hash on the request → explicit skip note, never a silent pass', () => {
    const r = run('fips-hashing.yaml', { op: 'Sign', algorithm: 'RSA-3072', hash: '' })
    expect(r.verdict.kind).toBe('allow') // engine: nothing to gate
    const step = r.trace.find((t) => t.note.includes('no hash'))
    expect(step).toBeDefined()
    expect(step?.effect).toBe('skip')
  })
})

describe('aead-only — mechanism parameter constraints', () => {
  it('ENGINE PARITY: AES Encrypt in ECB mode is denied', () => {
    const r = run('aead-only.yaml', { op: 'Encrypt', algorithm: 'AES-256', blockMode: 'ECB' })
    expect(r.verdict.kind).toBe('deny')
  })

  it('ENGINE PARITY: AES Encrypt in GCM mode is allowed', () => {
    const r = run('aead-only.yaml', { op: 'Encrypt', algorithm: 'AES-256', blockMode: 'GCM' })
    expect(r.verdict.kind).toBe('allow')
  })

  it('ENGINE PARITY: RSA Encrypt with PKCS1 v1.5 padding is denied, OAEP allowed', () => {
    const bad = run('aead-only.yaml', {
      op: 'Encrypt',
      algorithm: 'RSA-3072',
      padding: 'PKCS1 v1.5',
    })
    expect(bad.verdict.kind).toBe('deny')
    const good = run('aead-only.yaml', { op: 'Encrypt', algorithm: 'RSA-3072', padding: 'OAEP' })
    expect(good.verdict.kind).toBe('allow')
  })
})

describe('pkcs11-mechanism-lockdown — CKM gating + MAC policy', () => {
  it('ENGINE PARITY: denylisted CKM_AES_ECB is denied', () => {
    const r = run('pkcs11-mechanism-lockdown.yaml', {
      op: 'Encrypt',
      algorithm: 'AES-256',
      mechanism: 'CKM_AES_ECB',
    })
    expect(r.verdict.kind).toBe('deny')
  })

  it('ENGINE PARITY: allowlisted CKM_AES_GCM passes', () => {
    const r = run('pkcs11-mechanism-lockdown.yaml', {
      op: 'Encrypt',
      algorithm: 'AES-256',
      mechanism: 'CKM_AES_GCM',
    })
    expect(r.verdict.kind).toBe('allow')
  })

  it('ENGINE PARITY: non-allowlisted mechanism is denied by the allowlist', () => {
    const r = run('pkcs11-mechanism-lockdown.yaml', {
      op: 'Encrypt',
      algorithm: 'AES-256',
      mechanism: 'CKM_AES_CFB', // not in the allowlist, not in the denylist
    })
    expect(r.verdict.kind).toBe('deny')
  })

  it('ENGINE PARITY: HMAC-SHA-1 MAC is denied by mac_mechanism_policy', () => {
    const r = run('pkcs11-mechanism-lockdown.yaml', {
      op: 'MAC',
      algorithm: 'HMAC-SHA-1',
    })
    expect(r.verdict.kind).toBe('deny')
  })

  it('ENGINE PARITY: HMAC-SHA-256 MAC is allowed', () => {
    const r = run('pkcs11-mechanism-lockdown.yaml', {
      op: 'MAC',
      algorithm: 'HMAC-SHA-256',
    })
    expect(r.verdict.kind).toBe('allow')
  })
})

describe('cnsa-2.0 — level gating + documentational profile gate', () => {
  it('ENGINE PARITY: sub-Category-5 ML-KEM-768 Create is denied', () => {
    const r = run('cnsa-2.0.yaml', {
      op: 'Create',
      algorithm: 'ML-KEM-768',
      attrs: ['x-pqctoday-cnsa-classification=Secret'],
    })
    expect(r.verdict.kind).toBe('deny')
  })

  it('HONESTY: compliance_profile_gate is shown as documentational, not a gate', () => {
    const r = run('cnsa-2.0.yaml', {
      op: 'Create',
      algorithm: 'ML-DSA-87',
      attrs: ['x-pqctoday-cnsa-classification=Secret'],
    })
    const step = r.trace.find((t) => t.note.includes('documentational'))
    expect(step).toBeDefined()
    expect(step?.effect).not.toBe('deny')
  })

  it('RSA Sign is denied at use time (Phase 3: allowlist widened to Sign/Encrypt/Encapsulate)', () => {
    const r = run('cnsa-2.0.yaml', {
      op: 'Sign',
      algorithm: 'RSA-3072',
      attrs: ['x-pqctoday-cnsa-classification=Secret'],
    })
    expect(r.verdict.kind).toBe('deny')
  })

  it('ML-DSA-87 Sign (a suite algorithm) still passes at use time', () => {
    const r = run('cnsa-2.0.yaml', {
      op: 'Sign',
      algorithm: 'ML-DSA-87',
      attrs: ['x-pqctoday-cnsa-classification=Secret'],
    })
    expect(r.verdict.kind).toBe('allow')
  })

  it('SignatureVerify with a legacy RSA key stays open (recovery of legacy artefacts)', () => {
    const r = run('cnsa-2.0.yaml', {
      op: 'SignatureVerify',
      algorithm: 'RSA-3072',
    })
    expect(r.verdict.kind).toBe('allow')
  })
})

describe('pqc-migration-2030 — class-aware temporal cutoffs', () => {
  it('ENGINE PARITY: symmetric AES-256 Encrypt after 2030 is NOT swept by the classical cutoff', () => {
    const r = run('pqc-migration-2030.yaml', {
      op: 'Encrypt',
      algorithm: 'AES-256',
      date: '2031-06-01',
      usageFlags: ['Encrypt', 'Decrypt'],
    })
    expect(r.verdict.kind).toBe('allow')
  })

  it('ENGINE PARITY: classical ECDSA Sign after 2030 is denied', () => {
    const r = run('pqc-migration-2030.yaml', {
      op: 'Sign',
      algorithm: 'ECDSA-P256',
      date: '2031-06-01',
    })
    expect(r.verdict.kind).toBe('deny')
  })
})

describe('deterministic-signing — parameter forcing is visible, never a gate', () => {
  it('shows a resolve step ("forces deterministic=true") and allows', () => {
    const r = run('deterministic-signing.yaml', { op: 'Sign', algorithm: 'ML-DSA-65' })
    expect(r.verdict.kind).toBe('allow')
    const step = r.trace.find((t) => t.effect === 'resolve')
    expect(step?.note).toMatch(/deterministic=true/)
  })
})

describe('cross-cutting simulator fidelity fixes', () => {
  it('op matching follows rule.rs Y2: CreateKeyPair gate matches CreateKeyPair:Sign, Create does not', () => {
    // auto-migrate-on-use defaults CreateKeyPair:Sign → ML-DSA-65
    const r = run('auto-migrate-on-use.yaml', { op: 'CreateKeyPair:Sign', algorithm: '' })
    expect(r.verdict.kind).toBe('allow')
    expect(r.verdict.algorithm).toBe('ML-DSA-65')
  })

  it('algorithm family matching follows rule.rs Y3: denylisting a family catches every member', () => {
    // classical.yaml denylists PQC families for Create ops
    const r = run('classical.yaml', { op: 'Create', algorithm: 'ML-KEM-1024' })
    expect(r.verdict.kind).toBe('deny')
  })

  it('the advisory fall-through is gone: no rule reports the old "checked" pass, skips carry reasons', () => {
    for (const file of [
      'aead-only.yaml',
      'deterministic-signing.yaml',
      'fips-hashing.yaml',
      'pkcs11-mechanism-lockdown.yaml',
      'cnsa-2.0.yaml',
      'hybrid-migration-window.yaml',
    ]) {
      const r = run(file, { op: 'Sign', algorithm: 'ECDSA-P256', date: '2027-01-15' })
      for (const step of r.trace) {
        // The pre-fix simulator marked unimplemented rules matched+'checked'
        // and let them pass. A non-matched empty-note 'pass' is a legitimate
        // scope non-match; a MATCHED pass must always explain itself, and a
        // skip must always carry a reason.
        expect(step.note, `${file}: old advisory marker`).not.toBe('checked')
        if (step.matched && step.effect === 'pass') {
          expect(step.note, `${file}: matched pass without explanation`).not.toBe('')
        }
        if (step.effect === 'skip') {
          expect(step.note, `${file}: skip without reason`).not.toBe('')
        }
      }
    }
  })
})

// ── Layer 2 — REAL WASM engine cross-check (WP4b) ───────────────────────────
// Boots the actual staged wasm binary and asserts the illustrative simulator
// reaches the SAME verdict the engine's dry_run does, for every case above
// that the engine can decide. This replaces the native Rust facade tests
// (KmipPlayground calls wasm-bindgen imports, so it cannot run off-wasm).

interface WasmExports {
  __wbindgen_start: () => void
}
interface BgModule {
  __wbg_set_wasm: (exports: unknown) => void
  KmipPlayground: new () => {
    load_policy: (yaml: string) => string
    dry_run: (specJson: string) => string
    free: () => void
  }
}

type EnginePg = InstanceType<BgModule['KmipPlayground']>

const toDrySpec = (r: SimRequest): Record<string, unknown> => {
  const newObject = /^(Create|CreateKeyPair|Register|Import)/.test(r.op)
  const attrs: Record<string, string> = {}
  for (const a of r.attrs) {
    const [name, ...rest] = a.split('=')
    // eslint-disable-next-line security/detect-object-injection -- test-local attr names
    if (name) attrs[name] = rest.join('=')
  }
  const mechanism: Record<string, unknown> = {}
  if (r.hash) mechanism.hash = r.hash
  if (r.blockMode) mechanism.blockMode = r.blockMode
  if (r.padding) mechanism.padding = r.padding
  if (r.deterministic !== '') mechanism.deterministic = r.deterministic === 'true'
  if (r.mechanism) mechanism.mech = r.mechanism
  return {
    op: r.op,
    algorithm: r.algorithm || undefined,
    currentAlgorithm: newObject ? undefined : r.algorithm || undefined,
    length: r.bits === '' ? undefined : Number(r.bits),
    state: r.keyState || undefined,
    name: r.keyName || undefined,
    date: r.date || undefined,
    attrs: Object.keys(attrs).length ? attrs : undefined,
    usageMask: r.usageFlags.length ? r.usageFlags : undefined,
    activationDate: r.keyActivatedOn || undefined,
    mechanism: Object.keys(mechanism).length ? mechanism : undefined,
  }
}

describe('layer 2 — sim verdict ≡ real engine dry_run verdict', () => {
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

  const engineVerdict = (pg: EnginePg, r: SimRequest): string => {
    const out = JSON.parse(pg.dry_run(JSON.stringify(toDrySpec(r)))) as { kind: string }
    return out.kind.toLowerCase()
  }

  // (policy file, request, expected verdict) — expected is what BOTH layers
  // must produce. Rekey cases compare kind only.
  const MATRIX: [string, Partial<SimRequest>, 'allow' | 'deny' | 'rekey'][] = [
    // date reaches temporal + windowed rules. 2026-07-04: these three used
    // to run against the bare `Create` op (symmetric — AES/HMAC only), which
    // can never actually carry a classical asymmetric algorithm like
    // ECDSA-P256 (real requests use `CreateKeyPair` for that); it "worked"
    // only because the OLD unconditional composite mandate listed `Create`
    // in its ops_affected as a belt-and-braces catch-all. The corrected
    // policy scopes signing rules to signing ops, so this progression now
    // runs against `CreateKeyPair:Sign` — the real op a classical signing
    // key creation request uses.
    //
    // 2025-06-01 corrected to `deny` 2026-08-28 (gaps-remediation plan
    // WS-5a): predates this policy's own `metadata.effective: "2026-01-01"`.
    // A2 made the engine (and now this simulator) treat a not-yet-effective
    // policy as inert — fail-closed, same as no policy loaded at all — not
    // "classical still permitted because the migration hasn't started yet".
    // Same fix as `policyScenarios.ts`'s `hybrid-deny-legacy-pre`.
    [
      'hybrid-migration-window.yaml',
      { op: 'CreateKeyPair:Sign', algorithm: 'ECDSA-P256', date: '2025-06-01' },
      'deny',
    ],
    [
      'hybrid-migration-window.yaml',
      { op: 'CreateKeyPair:Sign', algorithm: 'ECDSA-P256', date: '2027-06-01' },
      'deny',
    ],
    [
      'hybrid-migration-window.yaml',
      { op: 'CreateKeyPair:Sign', algorithm: 'ECDSA-P256', date: '2031-12-30' },
      'deny',
    ],
    [
      'hybrid-migration-window.yaml',
      { op: 'Sign', algorithm: 'ECDSA-P256', date: '2027-06-01' },
      'deny',
    ],
    // Phase 3: post-window classical Sign is now denied (new Sign cutoff)
    [
      'hybrid-migration-window.yaml',
      { op: 'Sign', algorithm: 'ECDSA-P256', date: '2031-12-30' },
      'deny',
    ],
    // usage mask fails closed / passes when declared (composite key
    // CREATION — 2026-07-04: require_usage_mask is now creation-scoped by
    // engine default (Create/CreateKeyPair/Register/Import), so it no
    // longer gates a `Sign` USE request at all; test it on the creation op
    // it actually governs).
    [
      'hybrid-migration-window.yaml',
      {
        op: 'CreateKeyPair:Sign',
        algorithm: 'ML-DSA-65-ED25519',
        date: '2027-06-01',
        usageFlags: [],
      },
      'deny',
    ],
    [
      'hybrid-migration-window.yaml',
      {
        op: 'CreateKeyPair:Sign',
        algorithm: 'ML-DSA-65-ED25519',
        date: '2027-06-01',
        usageFlags: ['Sign', 'Verify'],
      },
      'allow',
    ],
    // Phase 3: the mandated composite Create now PASSES in-window (the
    // ML-DSA family denylist that used to catch its own composite is gone)
    [
      'hybrid-migration-window.yaml',
      {
        op: 'Create',
        algorithm: 'ML-DSA-65-ED25519',
        date: '2027-06-01',
        usageFlags: ['Sign', 'Verify'],
      },
      'allow',
    ],
    // hash allowlist
    ['fips-hashing.yaml', { op: 'Sign', algorithm: 'RSA-3072', hash: 'SHA-1' }, 'deny'],
    ['fips-hashing.yaml', { op: 'Sign', algorithm: 'RSA-3072', hash: 'SHA-256' }, 'allow'],
    ['fips-hashing.yaml', { op: 'Sign', algorithm: 'RSA-3072' }, 'allow'],
    // mechanism parameter constraints
    ['aead-only.yaml', { op: 'Encrypt', algorithm: 'AES-256', blockMode: 'ECB' }, 'deny'],
    ['aead-only.yaml', { op: 'Encrypt', algorithm: 'AES-256', blockMode: 'GCM' }, 'allow'],
    ['aead-only.yaml', { op: 'Encrypt', algorithm: 'RSA-3072', padding: 'PKCS1 v1.5' }, 'deny'],
    // CKM allow/denylists
    [
      'pkcs11-mechanism-lockdown.yaml',
      { op: 'Encrypt', algorithm: 'AES-256', mechanism: 'CKM_AES_ECB' },
      'deny',
    ],
    [
      'pkcs11-mechanism-lockdown.yaml',
      { op: 'Encrypt', algorithm: 'AES-256', mechanism: 'CKM_AES_GCM' },
      'allow',
    ],
    // MAC policy gates on the request algorithm
    ['pkcs11-mechanism-lockdown.yaml', { op: 'MAC', algorithm: 'HMAC-SHA-256' }, 'allow'],
    ['pkcs11-mechanism-lockdown.yaml', { op: 'MAC', algorithm: 'HMAC-SHA-1' }, 'deny'],
    // custom-attr exception on a denylist (pure PQC Create + research tag —
    // rule 1 in-window precedes, so test OUTSIDE the window via denylist dates:
    // use pqc-migration-2030's require_custom_attribute instead)
    [
      'pqc-migration-2030.yaml',
      { op: 'Sign', algorithm: 'ECDSA-P256', date: '2031-06-01' },
      'deny',
    ],
    [
      'pqc-migration-2030.yaml',
      {
        op: 'Encrypt',
        algorithm: 'AES-256',
        date: '2031-06-01',
        usageFlags: ['Encrypt', 'Decrypt'],
      },
      'allow',
    ],
    // rekey parity (agility substitution on use)
    [
      'auto-migrate-on-use.yaml',
      { op: 'Sign', algorithm: 'ECDSA-P256', date: '2026-07-01' },
      'rekey',
    ],
    // Phase 3: cnsa-2.0 now gates USE, not just creation
    [
      'cnsa-2.0.yaml',
      { op: 'Sign', algorithm: 'RSA-3072', attrs: ['x-pqctoday-cnsa-classification=Secret'] },
      'deny',
    ],
    [
      'cnsa-2.0.yaml',
      { op: 'Sign', algorithm: 'ML-DSA-87', attrs: ['x-pqctoday-cnsa-classification=Secret'] },
      'allow',
    ],
    // Phase 3: fips-only likewise gates use — a non-FIPS Encapsulate is denied
    ['fips-only.yaml', { op: 'Encapsulate', algorithm: 'FrodoKEM-976' }, 'deny'],
    // Phase 3: pqc-migration-2030 now enforces the 2027–2029 composite window
    // for NEW signing key pairs (was promised in prose, unbacked by any rule)
    [
      'pqc-migration-2030.yaml',
      { op: 'CreateKeyPair:Sign', algorithm: 'ECDSA-P384', date: '2028-06-01' },
      'deny',
    ],
    [
      'pqc-migration-2030.yaml',
      {
        op: 'CreateKeyPair:Sign',
        algorithm: 'ML-DSA-65-ED25519',
        date: '2028-06-01',
        // production PQC signing keys must also carry x-pqctoday-purpose (rule 6)
        attrs: ['x-pqctoday-purpose=production'],
      },
      'allow',
    ],
    // Phase 3: auto-migrate-on-use now defaults a new symmetric key to AES-256
    ['auto-migrate-on-use.yaml', { op: 'Create', algorithm: '', date: '2026-07-01' }, 'allow'],
    // name_pattern (label-only agility) — the Migration estate's contract:
    // the request carries only a business key NAME; patterned defaults beat
    // generic ones (most-specific-wins), and a patterned rule never fires
    // for an unnamed request. Both layers must agree on all of these.
    [
      'migration-classical.yaml',
      { op: 'Create', algorithm: '', keyName: 'payments-db-cipher' },
      'allow',
    ],
    [
      'migration-classical.yaml',
      { op: 'CreateKeyPair:Sign', algorithm: '', keyName: 'firmware-release-signing' },
      'allow',
    ],
    ['migration-classical.yaml', { op: 'CreateKeyPair:Sign', algorithm: '' }, 'allow'],
    ['migration-classical.yaml', { op: 'CreateKeyPair:Sign', algorithm: 'ML-DSA-65' }, 'deny'],
    [
      'migration-pqc.yaml',
      { op: 'CreateKeyPair:KeyAgreement', algorithm: '', keyName: 'interbank-vpn-kex' },
      'allow',
    ],
    [
      'migration-pqc.yaml',
      { op: 'Sign', algorithm: 'Ed25519', keyName: 'code-commit-signing' },
      'rekey',
    ],
    ['migration-hybrid.yaml', { op: 'Encapsulate', algorithm: 'X25519' }, 'rekey'],
    ['migration-hybrid.yaml', { op: 'Create', algorithm: 'AES-128' }, 'deny'],
  ]

  // WS-5b (2026-08-28 gaps-remediation plan) — synthetic fixtures for the two
  // required regression cases. Inline rather than added to the shipped
  // library: each exists purely to pin one resolve-then-gate ordering
  // behavior, not to model a real customer policy.
  const EXTRA_CASES: [string, string, Partial<SimRequest>, 'allow' | 'deny' | 'rekey'][] = [
    [
      'gate-before-substitution in file order',
      `schema_version: 1
metadata:
  name: ws5b-gate-before-substitution
  description: >
    WS-5b regression fixture — the denylist appears BEFORE the substitution
    in file order, but must still gate on the POST-substitution algorithm:
    resolution (Pass 1) always completes before gating (Pass 2) regardless
    of declared rule order.
  authority: test
  effective: "2020-01-01"
rules:
  - type: algorithm_denylist
    ops: [Sign]
    algorithms: [ML-DSA-65]
    reason: "ML-DSA-65 banned for Sign in this fixture"
  - type: algorithm_substitution
    ops: [Sign]
    from: RSA-2048
    to: ML-DSA-65
    reason: "auto-upgrade legacy RSA-2048 signing key to ML-DSA-65"
`,
      { op: 'Sign', algorithm: 'RSA-2048' },
      'deny',
    ],
    [
      'create-op substitution has no object to rekey',
      `schema_version: 1
metadata:
  name: ws5b-create-op-substitution
  description: >
    WS-5b regression fixture — a substitution matching a create-family op
    (no existing object) must allow with an algorithm override, not rekey.
  authority: test
  effective: "2020-01-01"
rules:
  - type: algorithm_substitution
    ops: ["CreateKeyPair:Sign"]
    from: RSA-2048
    to: ML-DSA-65
    reason: "silently upgrade any RSA-2048 signing CreateKeyPair request"
`,
      { op: 'CreateKeyPair:Sign', algorithm: 'RSA-2048' },
      'allow',
    ],
  ]

  it('every matrix case: sim verdict === engine verdict === expected', () => {
    // ONE playground for the whole matrix — the PKCS#11 engine behind the
    // playground is a per-module singleton, so a second constructor call
    // fails with CKR_SESSION_EXISTS (0xB6). load_policy() swaps the active
    // policy in place, exactly like the UI does.
    const pg = new bg.KmipPlayground()
    for (const [file, over, expected] of MATRIX) {
      const yaml = readFileSync(join(POLICY_DIR, file), 'utf8')
      const loaded = JSON.parse(pg.load_policy(yaml)) as { ok: boolean; error?: string }
      expect(loaded.ok, `${file} must load: ${loaded.error}`).toBe(true)

      const r = req(over)
      const simKind = evaluatePolicy(load(file), r).verdict.kind
      const engKind = engineVerdict(pg, r)
      const label = `${file} ${r.op} ${r.algorithm} @${r.date}`

      expect(simKind, `${label}: sim`).toBe(expected)
      expect(engKind, `${label}: engine`).toBe(expected)
    }

    for (const [label, yaml, over, expected] of EXTRA_CASES) {
      const loaded = JSON.parse(pg.load_policy(yaml)) as { ok: boolean; error?: string }
      expect(loaded.ok, `${label} must load: ${loaded.error}`).toBe(true)

      const r = req(over)
      const simKind = evaluatePolicy(toEditable(yaml), r).verdict.kind
      const engKind = engineVerdict(pg, r)

      expect(simKind, `${label}: sim`).toBe(expected)
      expect(engKind, `${label}: engine`).toBe(expected)
    }

    pg.free()
  })
})

describe('name_pattern — label-only resolution (engine.rs Pass-0 semantics)', () => {
  it('the label decides the algorithm: each estate name resolves per its pattern rule', () => {
    const cases: [string, Partial<SimRequest>, string][] = [
      [
        'migration-classical.yaml',
        { op: 'Create', algorithm: '', keyName: 'payments-db-cipher' },
        'AES-128',
      ],
      ['migration-classical.yaml', { op: 'Create', algorithm: '' }, 'AES-256'],
      [
        'migration-classical.yaml',
        { op: 'CreateKeyPair:Sign', algorithm: '', keyName: 'firmware-release-signing' },
        'RSA-2048',
      ],
      [
        'migration-classical.yaml',
        { op: 'CreateKeyPair:Sign', algorithm: '', keyName: 'api-gateway-signing' },
        'ECDSA-P256',
      ],
      [
        'migration-classical.yaml',
        { op: 'CreateKeyPair:Sign', algorithm: '', keyName: 'code-commit-signing' },
        'Ed25519',
      ],
      // The label carries the SECURITY LEVEL, not just the family:
      [
        'migration-pqc.yaml',
        { op: 'CreateKeyPair:KeyAgreement', algorithm: '', keyName: 'interbank-vpn-kex' },
        'ML-KEM-1024',
      ],
      ['migration-pqc.yaml', { op: 'CreateKeyPair:KeyAgreement', algorithm: '' }, 'ML-KEM-768'],
    ]
    for (const [file, over, algo] of cases) {
      const r = run(file, over)
      expect(r.verdict.kind, `${file} ${JSON.stringify(over)}`).toBe('allow')
      expect(r.verdict.algorithm, `${file} ${JSON.stringify(over)}`).toBe(algo)
    }
  })

  it('most-specific-wins is order-INDEPENDENT: a generic default listed FIRST still loses to a matching pattern', () => {
    // Synthetic policy: generic rule deliberately listed before the patterned
    // one — the engine evaluates patterned defaults in their own phase first
    // (engine.rs Pass 0), so YAML order must not matter.
    const yaml = [
      'schema_version: 1',
      'metadata:',
      '  name: order-test',
      '  description: t',
      '  authority: t',
      '  effective: "always"',
      'rules:',
      '  - type: algorithm_default',
      '    ops: [Create]',
      '    default_algorithm: AES-256',
      '    reason: "generic first"',
      '  - type: algorithm_default',
      '    ops: [Create]',
      '    name_pattern: "payments-*"',
      '    default_algorithm: AES-128',
      '    reason: "patterned second"',
      '',
    ].join('\n')
    const policy = toEditable(yaml)
    const named = evaluatePolicy(
      policy,
      req({ op: 'Create', algorithm: '', keyName: 'payments-db-cipher' })
    )
    expect(named.verdict.algorithm).toBe('AES-128')
    const unnamed = evaluatePolicy(policy, req({ op: 'Create', algorithm: '' }))
    expect(unnamed.verdict.algorithm).toBe('AES-256')
  })

  it('a patterned rule never fires for an unnamed request, and the glob is case-insensitive with ? wildcards', () => {
    const yaml = [
      'schema_version: 1',
      'metadata:',
      '  name: glob-test',
      '  description: t',
      '  authority: t',
      '  effective: "always"',
      'rules:',
      '  - type: algorithm_default',
      '    ops: [Create]',
      '    name_pattern: "Payments-??-*"',
      '    default_algorithm: AES-128',
      '    reason: "glob"',
      '',
    ].join('\n')
    const policy = toEditable(yaml)
    expect(
      evaluatePolicy(policy, req({ op: 'Create', algorithm: '', keyName: 'payments-eu-cipher' }))
        .verdict.algorithm
    ).toBe('AES-128')
    // ? = exactly one char — a 3-char region must not match ??
    expect(
      evaluatePolicy(policy, req({ op: 'Create', algorithm: '', keyName: 'payments-eur-cipher' }))
        .verdict.algorithm
    ).toBeFalsy()
    expect(
      evaluatePolicy(policy, req({ op: 'Create', algorithm: '' })).verdict.algorithm
    ).toBeFalsy()
  })
})

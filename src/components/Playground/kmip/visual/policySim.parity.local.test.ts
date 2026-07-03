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
import { describe, it, expect } from 'vitest'
import { toEditable } from './policyEditModel'
import { evaluatePolicy, type SimRequest, type SimResult } from './policySim'

const POLICY_DIR = join(__dirname, '../../../../../public/kmip-policies')
const load = (file: string) => toEditable(readFileSync(join(POLICY_DIR, file), 'utf8'))

const REQ_DEFAULTS: SimRequest = {
  op: 'Sign',
  algorithm: '',
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

  it('ENGINE PARITY: classical Create past the 2030 cutoff is denied (temporal_cutoff)', () => {
    const r = run('hybrid-migration-window.yaml', {
      op: 'Create',
      algorithm: 'ECDSA-P256',
      date: '2031-12-30',
    })
    expect(r.verdict.kind).toBe('deny')
  })

  it('ENGINE PARITY + KNOWN YAML GAP (Phase 3): the legacy-verify exception is unreachable in-window', () => {
    // Rule #1 (hybrid_dual_sign_requirement, ops [Create, Sign], no exception
    // mechanism) fires BEFORE the denylist that carries the
    // x-pqctoday-purpose=legacy-verify exception — so the exception the policy
    // advertises can never fire for an asymmetric Create inside the window.
    // The engine denies this too (parity); the YAML ordering/exception design
    // is the bug. Phase 3: move the exception onto rule #1 or reorder.
    const r = run('hybrid-migration-window.yaml', {
      op: 'Create',
      algorithm: 'ECDSA-P256',
      date: '2027-06-01',
      attrs: ['x-pqctoday-purpose=legacy-verify'],
    })
    expect(r.verdict.kind).toBe('deny')
    expect(r.verdict.reason).toMatch(/composite/i)
  })

  it('KNOWN YAML GAP (Phase 3): classical Sign AFTER the window is still allowed — no rule covers it', () => {
    const r = run('hybrid-migration-window.yaml', {
      op: 'Sign',
      algorithm: 'ECDSA-P256',
      date: '2031-12-30',
    })
    // The prose says classical signing ends with the window; the rules do not.
    // When Phase 3 adds the post-window classical-Sign cutoff, flip to 'deny'.
    expect(r.verdict.kind).toBe('allow')
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

  it('KNOWN YAML GAP (Phase 3): RSA Sign is not caught — allow/denylists are Create-scoped', () => {
    const r = run('cnsa-2.0.yaml', {
      op: 'Sign',
      algorithm: 'RSA-3072',
      attrs: ['x-pqctoday-cnsa-classification=Secret'],
    })
    // CNSA 2.0 prose bans non-suite algorithms outright; the rules only gate
    // Create. Flip to 'deny' when Phase 3 widens the op scope.
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

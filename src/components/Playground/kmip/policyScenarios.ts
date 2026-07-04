// SPDX-License-Identifier: GPL-3.0-only
//
// policyScenarios.ts — the validated positive/negative test-scenario matrix for
// the CACP policy engine. ONE source of truth, consumed twice:
//
//   1. The Agility Workbench scenario picker — when a policy is active, the user
//      can pick only the scenarios TIED to that policy (`policyFile`), see each
//      one's description, run it, and compare the engine's verdict to `expect`.
//
//   2. The automated validation runner
//      (e2e/cacp-policy-scenarios.local.spec.ts) — boots the real wasm engine,
//      loads each scenario's policy, runs `dryRun` (authoritative engine) AND
//      `evaluatePolicy` (visual sim), and asserts both equal `expect`. This is
//      the "rerun + fine-tune" gate: edit a scenario's `expect`/request here and
//      re-run the spec.
//
// Each scenario is ONE request with a known-correct expected verdict. `path`
// tags whether it exercises the allow ("positive") or block ("negative") side of
// the policy; `expect` is the actual engine verdict (Rekey counts as positive).
//
// Op-name convention (see classical.yaml): asymmetric CreateKeyPair is
// canonicalised to a purpose-suffixed op by usage mask —
// `CreateKeyPair:Sign` / `CreateKeyPair:KeyAgreement` / `CreateKeyPair:Encrypt`.
// Scenarios pass the canonical op the policy's rules are written against.

export type ScenarioVerdict = 'Allow' | 'Deny' | 'Rekey'

export interface ScenarioRequest {
  op: string
  /** Algorithm the request carries. Omit to let an algorithm_default resolve it. */
  algorithm?: string
  /** Key length in bits — drives min_key_length. */
  length?: number
  /** Lifecycle state of the target key — drives lifecycle_state_gate. */
  state?: string
  /** Simulated request date (YYYY-MM-DD) — drives temporal rules. */
  date?: string
  /** Custom x-attributes ({name: value}) — drives require_custom_attribute etc. */
  attrs?: Record<string, string>
  /** Usage-mask flags — drives require_usage_mask (absent → None → fail closed). */
  usageMask?: string[]
  /** Activation date of the key (YYYY-MM-DD) — drives max_key_age_days. */
  activationDate?: string
  /** Mechanism dimension — drives hash/mode/padding/CKM/deterministic rules. */
  mechanism?: {
    hash?: string
    blockMode?: string
    padding?: string
    deterministic?: boolean
    mech?: string
  }
}

export interface PolicyTestScenario {
  id: string
  /** Ties the scenario to a policy — matches PolicyPreset.file (or the built-in). */
  policyFile: string
  title: string
  /** One-line explanation shown in the picker: what this proves & which rule fires. */
  description: string
  path: 'positive' | 'negative'
  request: ScenarioRequest
  expect: ScenarioVerdict
}

export const POLICY_SCENARIOS: PolicyTestScenario[] = [
  // ── training-permissive — no rules, everything allowed ──────────────────
  {
    id: 'perm-sign-mldsa',
    policyFile: 'training-permissive.yaml',
    title: 'Sign with ML-DSA-87',
    description: 'No rules → every op is allowed at Plane 1.',
    path: 'positive',
    request: { op: 'Sign', algorithm: 'ML-DSA-87', state: 'Active' },
    expect: 'Allow',
  },
  {
    id: 'perm-weak-des',
    policyFile: 'training-permissive.yaml',
    title: 'Create a weak DES key',
    description: 'Even legacy/weak algorithms pass — this policy is for lab work only.',
    path: 'positive',
    request: { op: 'Create', algorithm: 'DES' },
    expect: 'Allow',
  },

  // ── classical — classical defaults, PQC explicitly denied ───────────────
  {
    id: 'classical-sign-default',
    policyFile: 'classical.yaml',
    title: 'New signing key (no algorithm)',
    description: 'algorithm_default resolves the signing key to ECDSA-P256.',
    path: 'positive',
    request: { op: 'CreateKeyPair:Sign' },
    expect: 'Allow',
  },
  {
    id: 'classical-kem-default',
    policyFile: 'classical.yaml',
    title: 'New key-agreement key (no algorithm)',
    description: 'algorithm_default resolves the KEM key to ECDH-P256.',
    path: 'positive',
    request: { op: 'CreateKeyPair:KeyAgreement' },
    expect: 'Allow',
  },
  {
    id: 'classical-deny-mldsa',
    policyFile: 'classical.yaml',
    title: 'Ask for ML-DSA-65 directly',
    description: 'PQC is gated off under the classical "before" policy — flip to pqc.yaml.',
    path: 'negative',
    request: { op: 'CreateKeyPair:Sign', algorithm: 'ML-DSA-65' },
    expect: 'Deny',
  },

  // ── pqc — PQC defaults, auto-rekey, classical asymmetric denied ─────────
  {
    id: 'pqc-sign-default',
    policyFile: 'pqc.yaml',
    title: 'New signing key (no algorithm)',
    description: 'algorithm_default resolves to ML-DSA-87 (FIPS 204).',
    path: 'positive',
    request: { op: 'CreateKeyPair:Sign' },
    expect: 'Allow',
  },
  {
    id: 'pqc-rekey-ecdsa',
    policyFile: 'pqc.yaml',
    title: 'Sign with a legacy ECDSA-P256 key',
    description: 'algorithm_substitution auto-rekeys ECDSA-P256 → ML-DSA-87 (RekeyAndProceed).',
    path: 'positive',
    request: { op: 'Sign', algorithm: 'ECDSA-P256', state: 'Active' },
    expect: 'Rekey',
  },
  {
    id: 'pqc-deny-rsa-create',
    policyFile: 'pqc.yaml',
    title: 'Create a new RSA-3072 key pair',
    description: 'No new classical asymmetric keys under the PQC policy (denylist).',
    path: 'negative',
    request: { op: 'CreateKeyPair:Sign', algorithm: 'RSA-3072' },
    expect: 'Deny',
  },

  // ── auto-migrate-on-use — new keys PQC, legacy rekeys on use ────────────
  {
    id: 'auto-sign-default',
    policyFile: 'auto-migrate-on-use.yaml',
    title: 'New signing key (no algorithm)',
    description: 'New signing keys default to ML-DSA-65 (FIPS 204).',
    path: 'positive',
    request: { op: 'CreateKeyPair:Sign' },
    expect: 'Allow',
  },
  {
    id: 'auto-rekey-ecdsa',
    policyFile: 'auto-migrate-on-use.yaml',
    title: 'Sign with a legacy ECDSA-P256 key',
    description: 'Lazy migration: ECDSA-P256 rekeys to ML-DSA-65 at first Sign.',
    path: 'positive',
    request: { op: 'Sign', algorithm: 'ECDSA-P256', state: 'Active' },
    expect: 'Rekey',
  },
  {
    id: 'auto-deny-rsa-create',
    policyFile: 'auto-migrate-on-use.yaml',
    title: 'Create a new RSA key pair',
    description: 'Migration in progress — no NEW classical asymmetric keys (RSA family denied).',
    path: 'negative',
    request: { op: 'CreateKeyPair:Sign', algorithm: 'RSA', length: 3072 },
    expect: 'Deny',
  },

  // ── fips-only — strict FIPS 203/204/205 + classical allowlist ───────────
  {
    id: 'fips-allow-mlkem',
    policyFile: 'fips-only.yaml',
    title: 'ML-KEM-768 key (KeyAgreement)',
    description: 'On the FIPS 203 allowlist; usage mask declares KeyAgreement as required.',
    path: 'positive',
    request: { op: 'CreateKeyPair', algorithm: 'ML-KEM-768', usageMask: ['KeyAgreement'] },
    expect: 'Allow',
  },
  {
    id: 'fips-allow-mldsa',
    policyFile: 'fips-only.yaml',
    title: 'ML-DSA-65 key (Sign+Verify)',
    description: 'On the FIPS 204 allowlist; usage mask declares Sign+Verify as required.',
    path: 'positive',
    request: { op: 'CreateKeyPair', algorithm: 'ML-DSA-65', usageMask: ['Sign', 'Verify'] },
    expect: 'Allow',
  },
  {
    id: 'fips-deny-frodo',
    policyFile: 'fips-only.yaml',
    title: 'FrodoKEM-1344 key',
    description: 'Round-4 / alternate KEM — not FIPS-approved, denied by allowlist + denylist.',
    path: 'negative',
    request: { op: 'CreateKeyPair', algorithm: 'FrodoKEM-1344', usageMask: ['KeyAgreement'] },
    expect: 'Deny',
  },
  {
    id: 'fips-deny-falcon',
    policyFile: 'fips-only.yaml',
    title: 'Falcon-512 key',
    description: 'Falcon is not FIPS-approved — off the allowlist.',
    path: 'negative',
    request: { op: 'CreateKeyPair', algorithm: 'Falcon-512', usageMask: ['Sign', 'Verify'] },
    expect: 'Deny',
  },
  {
    id: 'fips-deny-rsa-short',
    policyFile: 'fips-only.yaml',
    title: 'RSA-2048 key',
    description: 'RSA is allowed but must be ≥ 3072 bits (min_key_length).',
    path: 'negative',
    request: { op: 'CreateKeyPair', algorithm: 'RSA', length: 2048 },
    expect: 'Deny',
  },
  {
    id: 'fips-deny-mldsa-nomask',
    policyFile: 'fips-only.yaml',
    title: 'ML-DSA-65 without a usage mask',
    description: 'require_usage_mask fails closed — a sig key must declare Sign+Verify.',
    path: 'negative',
    request: { op: 'CreateKeyPair', algorithm: 'ML-DSA-65' },
    expect: 'Deny',
  },

  // ── cnsa-2.0 — Level-5 only, classification attr required ────────────────
  {
    id: 'cnsa-allow-mldsa87',
    policyFile: 'cnsa-2.0.yaml',
    title: 'ML-DSA-87 key (classified + Sign+Verify)',
    description: 'CNSA 2.0 Level-5 signature; carries x-pqctoday-cnsa-classification.',
    path: 'positive',
    request: {
      op: 'CreateKeyPair',
      algorithm: 'ML-DSA-87',
      usageMask: ['Sign', 'Verify'],
      attrs: { 'pqctoday-cnsa-classification': 'Secret' },
    },
    expect: 'Allow',
  },
  {
    id: 'cnsa-deny-mldsa65',
    policyFile: 'cnsa-2.0.yaml',
    title: 'ML-DSA-65 key (sub-Level-5)',
    description: 'CNSA 2.0 requires Level 5 — ML-DSA-65 is below strength, denied.',
    path: 'negative',
    request: {
      op: 'CreateKeyPair',
      algorithm: 'ML-DSA-65',
      usageMask: ['Sign', 'Verify'],
      attrs: { 'pqctoday-cnsa-classification': 'Secret' },
    },
    expect: 'Deny',
  },
  {
    id: 'cnsa-deny-aes128',
    policyFile: 'cnsa-2.0.yaml',
    title: 'AES-128 key',
    description: 'CNSA 2.0 mandates AES-256 — AES-128 denied.',
    path: 'negative',
    request: { op: 'Create', algorithm: 'AES-128' },
    expect: 'Deny',
  },
  {
    id: 'cnsa-deny-rsa',
    policyFile: 'cnsa-2.0.yaml',
    title: 'RSA key pair',
    description: 'Classical asymmetric is not in the CNSA 2.0 suite — denied.',
    path: 'negative',
    request: { op: 'CreateKeyPair', algorithm: 'RSA', length: 3072 },
    expect: 'Deny',
  },

  // ── bsi-tr-02102 — allows FrodoKEM/McEliece; hybrid partner required ─────
  {
    id: 'bsi-allow-frodo',
    policyFile: 'bsi-tr-02102.yaml',
    title: 'FrodoKEM-1344 key (with hybrid partner)',
    description: 'BSI recognises FrodoKEM for long-term confidentiality — the opposite of FIPS.',
    path: 'positive',
    request: {
      op: 'CreateKeyPair:KeyAgreement',
      algorithm: 'FrodoKEM-1344',
      attrs: { 'pqctoday-hybrid-partner': 'X25519' },
    },
    expect: 'Allow',
  },
  {
    id: 'bsi-deny-frodo-nopartner',
    policyFile: 'bsi-tr-02102.yaml',
    title: 'FrodoKEM-1344 without a hybrid partner',
    description: 'BSI mandates HYBRID — a standalone PQC KEM (no classical partner) is rejected.',
    path: 'negative',
    request: { op: 'CreateKeyPair:KeyAgreement', algorithm: 'FrodoKEM-1344' },
    expect: 'Deny',
  },
  {
    id: 'bsi-deny-mlkem512',
    policyFile: 'bsi-tr-02102.yaml',
    title: 'ML-KEM-512 key',
    description: 'BSI KEM allowlist starts at ML-KEM-768 — 512 is off the list.',
    path: 'negative',
    request: {
      op: 'CreateKeyPair:KeyAgreement',
      algorithm: 'ML-KEM-512',
      attrs: { 'pqctoday-hybrid-partner': 'X25519' },
    },
    expect: 'Deny',
  },

  // ── pqc-migration-2030 — temporal cutoffs ───────────────────────────────
  {
    id: 'mig2030-allow-classical-pre',
    policyFile: 'pqc-migration-2030.yaml',
    title: 'Classical Sign before the 2030 cutoff',
    description: 'ECDSA signing is allowed pre-2030 for legacy interop.',
    path: 'positive',
    request: { op: 'Sign', algorithm: 'ECDSA-P256', state: 'Active', date: '2029-06-01' },
    expect: 'Allow',
  },
  {
    id: 'mig2030-deny-classical-post',
    policyFile: 'pqc-migration-2030.yaml',
    title: 'Classical Sign after the 2030 cutoff',
    description: 'temporal_cutoff bans classical signing from 2030-01-01.',
    path: 'negative',
    request: { op: 'Sign', algorithm: 'ECDSA-P256', state: 'Active', date: '2030-06-01' },
    expect: 'Deny',
  },
  {
    id: 'mig2030-deny-rsa-short',
    policyFile: 'pqc-migration-2030.yaml',
    title: 'Create an RSA-2048 key',
    description: 'min_key_length requires RSA ≥ 3072 bits.',
    path: 'negative',
    request: { op: 'CreateKeyPair:Sign', algorithm: 'RSA', length: 2048, date: '2026-06-01' },
    expect: 'Deny',
  },

  // ── hybrid-migration-window — composite required 2026–2029 ──────────────
  {
    id: 'hybrid-deny-classical',
    policyFile: 'hybrid-migration-window.yaml',
    title: 'Pure-classical Sign inside the window',
    description: 'In 2026–2029 signing must be the ML-DSA-65+Ed25519 composite — classical denied.',
    path: 'negative',
    request: { op: 'Sign', algorithm: 'ECDSA-P256', state: 'Active', date: '2027-06-01' },
    expect: 'Deny',
  },
  {
    id: 'hybrid-deny-pure-pqc',
    policyFile: 'hybrid-migration-window.yaml',
    title: 'Pure-PQC Sign inside the window',
    description: 'Even pure PQC is denied in the window — the composite is mandatory.',
    path: 'negative',
    request: { op: 'Sign', algorithm: 'ML-DSA-87', state: 'Active', date: '2027-06-01' },
    expect: 'Deny',
  },
  {
    id: 'hybrid-allow-verify',
    policyFile: 'hybrid-migration-window.yaml',
    title: 'Verify a legacy classical signature',
    description: 'SignatureVerify is never restricted — legacy artefacts stay verifiable.',
    path: 'positive',
    request: { op: 'SignatureVerify', algorithm: 'ECDSA-P256', date: '2027-06-01' },
    expect: 'Allow',
  },

  // ── aead-only — authenticated modes / OAEP only ─────────────────────────
  {
    id: 'aead-deny-cbc',
    policyFile: 'aead-only.yaml',
    title: 'AES Encrypt in CBC mode',
    description: 'mechanism_parameter_constraint requires an authenticated mode (GCM/CCM).',
    path: 'negative',
    request: { op: 'Encrypt', algorithm: 'AES-256', mechanism: { blockMode: 'CBC' } },
    expect: 'Deny',
  },
  {
    id: 'aead-allow-gcm',
    policyFile: 'aead-only.yaml',
    title: 'AES Encrypt in GCM mode',
    description: 'GCM is an authenticated mode — allowed.',
    path: 'positive',
    request: { op: 'Encrypt', algorithm: 'AES-256', mechanism: { blockMode: 'GCM' } },
    expect: 'Allow',
  },

  // ── deterministic-signing — forces a param, never denies ────────────────
  {
    id: 'det-allow-sign',
    policyFile: 'deterministic-signing.yaml',
    title: 'Sign with ML-DSA-87',
    description: 'mechanism_parameter_default forces deterministic=true; the op is allowed.',
    path: 'positive',
    request: { op: 'Sign', algorithm: 'ML-DSA-87', state: 'Active' },
    expect: 'Allow',
  },

  // ── fips-hashing — SHA-2/SHA-3 signing hashes only ──────────────────────
  {
    id: 'fipshash-deny-sha1',
    policyFile: 'fips-hashing.yaml',
    title: 'Sign with a SHA-1 hash',
    description: 'hash_algorithm_allowlist rejects SHA-1.',
    path: 'negative',
    request: { op: 'Sign', algorithm: 'ML-DSA-87', state: 'Active', mechanism: { hash: 'SHA-1' } },
    expect: 'Deny',
  },
  {
    id: 'fipshash-allow-sha256',
    policyFile: 'fips-hashing.yaml',
    title: 'Sign with a SHA-256 hash',
    description: 'SHA-256 is FIPS-approved — allowed.',
    path: 'positive',
    request: {
      op: 'Sign',
      algorithm: 'ML-DSA-87',
      state: 'Active',
      mechanism: { hash: 'SHA-256' },
    },
    expect: 'Allow',
  },

  // ── pkcs11-mechanism-lockdown — CKM_* allow/deny ────────────────────────
  {
    id: 'ckm-deny-aescbc',
    policyFile: 'pkcs11-mechanism-lockdown.yaml',
    title: 'Encrypt with CKM_AES_CBC',
    description: 'Unauthenticated AES-CBC is on the mechanism denylist.',
    path: 'negative',
    request: { op: 'Encrypt', algorithm: 'AES-256', mechanism: { mech: 'CKM_AES_CBC' } },
    expect: 'Deny',
  },
  {
    id: 'ckm-allow-aesgcm',
    policyFile: 'pkcs11-mechanism-lockdown.yaml',
    title: 'Encrypt with CKM_AES_GCM',
    description: 'AES-GCM is on the vetted mechanism allowlist.',
    path: 'positive',
    request: { op: 'Encrypt', algorithm: 'AES-256', mechanism: { mech: 'CKM_AES_GCM' } },
    expect: 'Allow',
  },
  {
    id: 'ckm-deny-rsapkcs',
    policyFile: 'pkcs11-mechanism-lockdown.yaml',
    title: 'Sign with CKM_RSA_PKCS (v1.5)',
    description: 'RSA PKCS#1 v1.5 is denied — use PSS/OAEP.',
    path: 'negative',
    request: {
      op: 'Sign',
      algorithm: 'RSA-3072',
      state: 'Active',
      mechanism: { mech: 'CKM_RSA_PKCS' },
    },
    expect: 'Deny',
  },

  // ════════════════════════════════════════════════════════════════════════
  //  EXTENDED COVERAGE — additional rule types + both paths per policy.
  // ════════════════════════════════════════════════════════════════════════

  // ── training-permissive ─────────────────────────────────────────────────
  {
    id: 'perm-encrypt-aes-cbc',
    policyFile: 'training-permissive.yaml',
    title: 'Encrypt with unauthenticated AES-CBC',
    description: 'No mechanism constraints — even CBC is allowed in the lab policy.',
    path: 'positive',
    request: { op: 'Encrypt', algorithm: 'AES-128', mechanism: { blockMode: 'CBC' } },
    expect: 'Allow',
  },

  // ── classical ───────────────────────────────────────────────────────────
  {
    id: 'classical-enc-default',
    policyFile: 'classical.yaml',
    title: 'New asymmetric-encrypt key (no algorithm)',
    description: 'algorithm_default resolves the encrypt key to RSA-3072.',
    path: 'positive',
    request: { op: 'CreateKeyPair:Encrypt' },
    expect: 'Allow',
  },
  {
    id: 'classical-sym-default',
    policyFile: 'classical.yaml',
    title: 'New symmetric key (no algorithm)',
    description: 'algorithm_default resolves the symmetric key to AES-256.',
    path: 'positive',
    request: { op: 'Create' },
    expect: 'Allow',
  },
  {
    id: 'classical-deny-mlkem-sign',
    policyFile: 'classical.yaml',
    title: 'Sign with an ML-KEM key',
    description: 'PQC denylist covers Sign too — ML-KEM is gated off under classical.',
    path: 'negative',
    request: { op: 'Sign', algorithm: 'ML-KEM-768', state: 'Active' },
    expect: 'Deny',
  },

  // ── pqc ─────────────────────────────────────────────────────────────────
  {
    id: 'pqc-kem-default',
    policyFile: 'pqc.yaml',
    title: 'New key-agreement key (no algorithm)',
    description: 'algorithm_default resolves the KEM key to ML-KEM-1024 (FIPS 203).',
    path: 'positive',
    request: { op: 'CreateKeyPair:KeyAgreement' },
    expect: 'Allow',
  },
  {
    id: 'pqc-deny-ecdh-create',
    policyFile: 'pqc.yaml',
    title: 'Create a classical ECDH-P256 KEM key',
    description: 'No new classical asymmetric keys under the PQC policy (denylist).',
    path: 'negative',
    request: { op: 'CreateKeyPair:KeyAgreement', algorithm: 'ECDH-P256' },
    expect: 'Deny',
  },

  // ── auto-migrate-on-use ─────────────────────────────────────────────────
  {
    id: 'auto-kem-default',
    policyFile: 'auto-migrate-on-use.yaml',
    title: 'New key-agreement key (no algorithm)',
    description: 'New KEM keys default to ML-KEM-768 (FIPS 203).',
    path: 'positive',
    request: { op: 'CreateKeyPair:KeyAgreement' },
    expect: 'Allow',
  },
  {
    id: 'auto-rekey-rsa',
    policyFile: 'auto-migrate-on-use.yaml',
    title: 'Sign with a legacy RSA-3072 key',
    description: 'algorithm_substitution rekeys RSA-3072 → ML-DSA-65 at first Sign.',
    path: 'positive',
    request: { op: 'Sign', algorithm: 'RSA-3072', state: 'Active' },
    expect: 'Rekey',
  },
  {
    id: 'auto-lifecycle-active',
    policyFile: 'auto-migrate-on-use.yaml',
    title: 'Sign with an Active ML-DSA-65 key',
    description: 'lifecycle_state_gate allows Active keys to sign.',
    path: 'positive',
    request: { op: 'Sign', algorithm: 'ML-DSA-65', state: 'Active' },
    expect: 'Allow',
  },
  {
    id: 'auto-lifecycle-deactivated',
    policyFile: 'auto-migrate-on-use.yaml',
    title: 'Sign with a Deactivated ML-DSA-65 key',
    description: 'lifecycle_state_gate denies Sign with a non-Active key.',
    path: 'negative',
    request: { op: 'Sign', algorithm: 'ML-DSA-65', state: 'Deactivated' },
    expect: 'Deny',
  },

  // ── fips-only ────────────────────────────────────────────────────────────
  {
    id: 'fips-allow-slhdsa',
    policyFile: 'fips-only.yaml',
    title: 'SLH-DSA-SHA2-128f key (Sign+Verify)',
    description: 'FIPS 205 hash-based signature — on the allowlist.',
    path: 'positive',
    request: { op: 'CreateKeyPair', algorithm: 'SLH-DSA-SHA2-128f', usageMask: ['Sign', 'Verify'] },
    expect: 'Allow',
  },
  {
    id: 'fips-deny-mlkem-nomask',
    policyFile: 'fips-only.yaml',
    title: 'ML-KEM-768 without a usage mask',
    description: 'require_usage_mask fails closed — a KEM key must declare KeyAgreement.',
    path: 'negative',
    request: { op: 'CreateKeyPair', algorithm: 'ML-KEM-768' },
    expect: 'Deny',
  },

  // ── cnsa-2.0 ─────────────────────────────────────────────────────────────
  {
    id: 'cnsa-allow-mlkem',
    policyFile: 'cnsa-2.0.yaml',
    title: 'ML-KEM-1024 key (classified)',
    description: 'CNSA 2.0 Level-5 KEM; carries the classification attribute.',
    path: 'positive',
    request: {
      op: 'CreateKeyPair',
      algorithm: 'ML-KEM-1024',
      usageMask: ['KeyAgreement'],
      attrs: { 'pqctoday-cnsa-classification': 'Secret' },
    },
    expect: 'Allow',
  },
  {
    id: 'cnsa-allow-lms',
    policyFile: 'cnsa-2.0.yaml',
    title: 'LMS stateful hash-based key',
    description:
      'CNSA 2.0 approves single-tree LMS for firmware signing (Sign+Verify + classified).',
    path: 'positive',
    request: {
      op: 'CreateKeyPair',
      algorithm: 'LMS',
      usageMask: ['Sign', 'Verify'],
      attrs: { 'pqctoday-cnsa-classification': 'Secret' },
    },
    expect: 'Allow',
  },
  {
    id: 'cnsa-deny-slhdsa',
    policyFile: 'cnsa-2.0.yaml',
    title: 'SLH-DSA-SHA2-128f key',
    description: 'SLH-DSA is FIPS 205 but NOT in the CNSA 2.0 suite — denied.',
    path: 'negative',
    request: { op: 'CreateKeyPair', algorithm: 'SLH-DSA-SHA2-128f', usageMask: ['Sign', 'Verify'] },
    expect: 'Deny',
  },
  {
    id: 'cnsa-deny-noattr',
    policyFile: 'cnsa-2.0.yaml',
    title: 'ML-DSA-87 without a classification attribute',
    description:
      'require_custom_attribute — CNSA keys must declare x-pqctoday-cnsa-classification.',
    path: 'negative',
    request: { op: 'CreateKeyPair', algorithm: 'ML-DSA-87', usageMask: ['Sign', 'Verify'] },
    expect: 'Deny',
  },

  // ── bsi-tr-02102 ─────────────────────────────────────────────────────────
  {
    id: 'bsi-allow-mlkem',
    policyFile: 'bsi-tr-02102.yaml',
    title: 'ML-KEM-1024 key (with hybrid partner)',
    description: 'On the BSI KEM allowlist; declares its classical hybrid partner.',
    path: 'positive',
    request: {
      op: 'CreateKeyPair:KeyAgreement',
      algorithm: 'ML-KEM-1024',
      attrs: { 'pqctoday-hybrid-partner': 'X25519' },
    },
    expect: 'Allow',
  },
  {
    id: 'bsi-allow-composite-sign',
    policyFile: 'bsi-tr-02102.yaml',
    title: 'Sign with the ML-DSA-65+ECDSA-P384 composite',
    description: 'BSI policy mandates the hybrid composite for signing — this one satisfies it.',
    path: 'positive',
    request: { op: 'Sign', algorithm: 'ML-DSA-65-ECDSA-P384', state: 'Active', date: '2027-06-01' },
    expect: 'Allow',
  },
  {
    id: 'bsi-deny-des',
    policyFile: 'bsi-tr-02102.yaml',
    title: 'Encrypt with DES',
    description: 'Broken primitive — on the outright denylist.',
    path: 'negative',
    request: { op: 'Encrypt', algorithm: 'DES' },
    expect: 'Deny',
  },

  // ── pqc-migration-2030 ───────────────────────────────────────────────────
  {
    id: 'mig2030-allow-kem-mask',
    policyFile: 'pqc-migration-2030.yaml',
    title: 'ML-KEM-768 KEM key (KeyAgreement)',
    description: 'PQC KEM with the required KeyAgreement usage mask — allowed.',
    path: 'positive',
    request: {
      op: 'CreateKeyPair:KeyAgreement',
      algorithm: 'ML-KEM-768',
      usageMask: ['KeyAgreement'],
      date: '2027-06-01',
    },
    expect: 'Allow',
  },
  {
    id: 'mig2030-deny-kem-nomask',
    policyFile: 'pqc-migration-2030.yaml',
    title: 'ML-KEM-768 without a usage mask',
    description: 'require_usage_mask fails closed — a KEM key must declare KeyAgreement.',
    path: 'negative',
    request: { op: 'CreateKeyPair:KeyAgreement', algorithm: 'ML-KEM-768', date: '2027-06-01' },
    expect: 'Deny',
  },
  {
    id: 'mig2030-deny-md5',
    policyFile: 'pqc-migration-2030.yaml',
    title: 'Sign with MD5',
    description: 'Weak/legacy algorithms are banned at all times, regardless of date.',
    path: 'negative',
    request: { op: 'Sign', algorithm: 'MD5', state: 'Active', date: '2027-06-01' },
    expect: 'Deny',
  },

  // ── hybrid-migration-window ──────────────────────────────────────────────
  {
    id: 'hybrid-allow-composite',
    policyFile: 'hybrid-migration-window.yaml',
    title: 'Sign with the ML-DSA-65+Ed25519 composite',
    description: 'The mandated composite inside the window — allowed (Sign+Verify mask).',
    path: 'positive',
    request: {
      // KMIP 3.0 CryptographicAlgorithm spelling — components keep their spec
      // casing (Ed25519, per OASIS KMIP 3.0 §11 / RFC 8032). The engine matches
      // the composite case-insensitively.
      op: 'Sign',
      algorithm: 'ML-DSA-65-Ed25519',
      state: 'Active',
      date: '2027-06-01',
      usageMask: ['Sign', 'Verify'],
    },
    expect: 'Allow',
  },
  {
    id: 'hybrid-allow-kem-inwindow',
    policyFile: 'hybrid-migration-window.yaml',
    title: 'Create an ML-KEM-1024 KEM key in the window',
    description:
      'The signing mandate is scoped to CreateKeyPair:Sign — KEM key-agreement is not swept in.',
    path: 'positive',
    request: { op: 'CreateKeyPair:KeyAgreement', algorithm: 'ML-KEM-1024', date: '2027-06-01' },
    expect: 'Allow',
  },
  {
    id: 'hybrid-allow-legacy-pre',
    policyFile: 'hybrid-migration-window.yaml',
    title: 'Classical Sign before the window opens',
    description: 'Before 2026, classical-only signing is permitted (legacy).',
    path: 'positive',
    request: { op: 'Sign', algorithm: 'ECDSA-P256', state: 'Active', date: '2025-06-01' },
    expect: 'Allow',
  },
  {
    id: 'hybrid-deny-classical-post',
    policyFile: 'hybrid-migration-window.yaml',
    title: 'Create a classical signing key after the window',
    description: 'Post-2030, classical signing-key creation is denied — PQC/composite only.',
    path: 'negative',
    request: { op: 'CreateKeyPair:Sign', algorithm: 'ECDSA-P256', date: '2031-06-01' },
    expect: 'Deny',
  },

  // ── aead-only ────────────────────────────────────────────────────────────
  {
    id: 'aead-allow-oaep',
    policyFile: 'aead-only.yaml',
    title: 'RSA Encrypt with OAEP padding',
    description: 'OAEP is the required padding for RSA encryption — allowed.',
    path: 'positive',
    request: { op: 'Encrypt', algorithm: 'RSA-3072', mechanism: { padding: 'OAEP' } },
    expect: 'Allow',
  },
  {
    id: 'aead-deny-pkcs1',
    policyFile: 'aead-only.yaml',
    title: 'RSA Encrypt with PKCS#1 v1.5 padding',
    description: 'mechanism_parameter_constraint forbids PKCS#1 v1.5 — OAEP only.',
    path: 'negative',
    request: { op: 'Encrypt', algorithm: 'RSA-3072', mechanism: { padding: 'PKCS1 v1.5' } },
    expect: 'Deny',
  },
  {
    id: 'aead-allow-sign',
    policyFile: 'aead-only.yaml',
    title: 'Sign with ML-DSA-87',
    description: 'This policy only constrains Encrypt/Decrypt — signing is untouched.',
    path: 'positive',
    request: { op: 'Sign', algorithm: 'ML-DSA-87', state: 'Active' },
    expect: 'Allow',
  },

  // ── deterministic-signing ────────────────────────────────────────────────
  {
    id: 'det-allow-create',
    policyFile: 'deterministic-signing.yaml',
    title: 'Create an AES-256 key',
    description: 'Only Sign carries the forced deterministic param — Create is unaffected.',
    path: 'positive',
    request: { op: 'Create', algorithm: 'AES-256' },
    expect: 'Allow',
  },

  // ── fips-hashing ─────────────────────────────────────────────────────────
  {
    id: 'fipshash-allow-sha384',
    policyFile: 'fips-hashing.yaml',
    title: 'Sign with a SHA-384 hash',
    description: 'SHA-384 is FIPS-approved — allowed.',
    path: 'positive',
    request: {
      op: 'Sign',
      algorithm: 'ML-DSA-87',
      state: 'Active',
      mechanism: { hash: 'SHA-384' },
    },
    expect: 'Allow',
  },
  {
    id: 'fipshash-deny-verify-sha1',
    policyFile: 'fips-hashing.yaml',
    title: 'Verify a SHA-1 signature',
    description: 'The hash allowlist also gates SignatureVerify — SHA-1 is rejected.',
    path: 'negative',
    request: { op: 'SignatureVerify', algorithm: 'ML-DSA-87', mechanism: { hash: 'SHA-1' } },
    expect: 'Deny',
  },

  // ── pkcs11-mechanism-lockdown ────────────────────────────────────────────
  {
    id: 'ckm-deny-aesecb',
    policyFile: 'pkcs11-mechanism-lockdown.yaml',
    title: 'Encrypt with CKM_AES_ECB',
    description: 'AES-ECB leaks structure — off the allowlist and on the denylist.',
    path: 'negative',
    request: { op: 'Encrypt', algorithm: 'AES-256', mechanism: { mech: 'CKM_AES_ECB' } },
    expect: 'Deny',
  },
  {
    id: 'ckm-allow-rsapss',
    policyFile: 'pkcs11-mechanism-lockdown.yaml',
    title: 'Sign with CKM_RSA_PKCS_PSS',
    description: 'RSA-PSS is on the vetted mechanism allowlist.',
    path: 'positive',
    request: {
      op: 'Sign',
      algorithm: 'RSA-3072',
      state: 'Active',
      mechanism: { mech: 'CKM_RSA_PKCS_PSS' },
    },
    expect: 'Allow',
  },
  {
    id: 'ckm-allow-mldsa-gen',
    policyFile: 'pkcs11-mechanism-lockdown.yaml',
    title: 'Create an ML-DSA key with CKM_ML_DSA_KEY_PAIR_GEN',
    description: 'The ML-DSA key-pair-gen mechanism is allowlisted.',
    path: 'positive',
    request: {
      op: 'CreateKeyPair',
      algorithm: 'ML-DSA-87',
      mechanism: { mech: 'CKM_ML_DSA_KEY_PAIR_GEN' },
    },
    expect: 'Allow',
  },
]

/** Scenarios tied to a given policy file (for the workbench picker). */
export const scenariosForPolicy = (policyFile: string | null): PolicyTestScenario[] =>
  POLICY_SCENARIOS.filter((s) => s.policyFile === (policyFile ?? 'training-permissive.yaml'))

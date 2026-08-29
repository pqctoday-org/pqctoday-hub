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
  /** Key label — drives `name_pattern` rules (the Migration estate's
   * label-only contract: the app passes only a business key name and the
   * policy decides every crypto parameter). */
  name?: string
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
  /**
   * Optional real-execution companion to `request`/`expect`. `request` above
   * only ever feeds `dryRun`/`evaluatePolicy` (policy-decision simulations) —
   * it can carry a bare family name like "FrodoKEM-1344" because policy rules
   * match on the canonical (AES/SHAKE-collapsed) name. `runOp`'s CreateKeyPair
   * path resolves an exact algorithm variant, so real execution needs a
   * fully-qualified name instead (e.g. "FrodoKEM-1344-AES").
   *
   * `outcome: 'roundtrip'` — the policy allows this, so prove the engine can
   * actually DO it: CreateKeyPair -> Activate x2 -> Encapsulate -> Decapsulate
   * must all report `ok: true` and the two sides' shared secrets must match.
   * `outcome: 'refused'` — the policy denies this; a *real* CreateKeyPair
   * attempt (not just the dry-run simulation) must also come back `ok: false`,
   * proving enforcement isn't dry-run-only.
   */
  realExecution?: {
    algorithm: string
    attrs?: Record<string, string>
    outcome: 'roundtrip' | 'refused'
  }
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

  // ── migration-classical — label-pattern defaults, PQC gated off ─────────
  // The Migration tab's "before" estate: the request carries ONLY a business
  // key name; every algorithm below is the policy's decision (name_pattern
  // defaults, most-specific-wins).
  {
    id: 'mig-classical-payments-label',
    policyFile: 'migration-classical.yaml',
    title: 'Label-only create: payments-db-cipher',
    description:
      'The app names the KEY, not the algorithm — the payments-* name_pattern rule resolves it to AES-128 (deliberately at-risk, to migrate later).',
    path: 'positive',
    request: { op: 'Create', name: 'payments-db-cipher' },
    expect: 'Allow',
  },
  {
    id: 'mig-classical-firmware-label',
    policyFile: 'migration-classical.yaml',
    title: 'Label-only create: firmware-release-signing',
    description: 'The firmware-* name_pattern rule resolves the signing key to RSA-2048.',
    path: 'positive',
    request: { op: 'CreateKeyPair:Sign', name: 'firmware-release-signing' },
    expect: 'Allow',
  },
  {
    id: 'mig-classical-unlabelled',
    policyFile: 'migration-classical.yaml',
    title: 'Unlabelled signing key',
    description:
      'No label match → the generic fallback default (ECDSA-P256) resolves it; name-patterned rules beat generic ones only when they match.',
    path: 'positive',
    request: { op: 'CreateKeyPair:Sign' },
    expect: 'Allow',
  },
  {
    id: 'mig-classical-deny-pqc',
    policyFile: 'migration-classical.yaml',
    title: 'Ask for ML-DSA-65 directly',
    description:
      'This policy IS the pre-migration baseline — PQC is explicitly gated off until the estate flips policy.',
    path: 'negative',
    request: { op: 'CreateKeyPair:Sign', algorithm: 'ML-DSA-65' },
    expect: 'Deny',
  },

  // ── migration-hybrid — hybrid KEM + PQC signing, rekey-on-use ───────────
  {
    id: 'mig-hybrid-kex-default',
    policyFile: 'migration-hybrid.yaml',
    title: 'New key-agreement key (no algorithm)',
    description:
      'Key establishment defaults to X25519MLKEM768 — classical + PQC in ONE key, secure if either half survives.',
    path: 'positive',
    request: { op: 'CreateKeyPair:KeyAgreement' },
    expect: 'Allow',
    realExecution: { algorithm: 'X25519MLKEM768', outcome: 'roundtrip' },
  },
  {
    id: 'mig-hybrid-rekey-x25519',
    policyFile: 'migration-hybrid.yaml',
    title: 'Encapsulate with a legacy X25519 key',
    description:
      'Rekey-on-use: the classical key gains an ML-KEM half (X25519 → X25519MLKEM768) the moment it is used.',
    path: 'positive',
    request: { op: 'Encapsulate', algorithm: 'X25519', state: 'Active' },
    expect: 'Rekey',
  },
  {
    id: 'mig-hybrid-deny-classical',
    policyFile: 'migration-hybrid.yaml',
    title: 'Create a new ECDSA-P256 key pair',
    description: 'No NEW pure-classical asymmetric keys during the hybrid window.',
    path: 'negative',
    request: { op: 'CreateKeyPair:Sign', algorithm: 'ECDSA-P256' },
    expect: 'Deny',
    realExecution: { algorithm: 'ECDSA', outcome: 'refused' },
  },
  {
    id: 'mig-hybrid-deny-aes128',
    policyFile: 'migration-hybrid.yaml',
    title: 'Create a new AES-128 key',
    description: 'No new sub-256-bit symmetric keys — the Grover margin rule.',
    path: 'negative',
    request: { op: 'Create', algorithm: 'AES-128' },
    expect: 'Deny',
  },

  // ── migration-pqc — full-PQC target, label-mapped security levels ────────
  {
    id: 'mig-pqc-interbank-label',
    policyFile: 'migration-pqc.yaml',
    title: 'Label-only create: interbank-vpn-kex',
    description:
      'The interbank-* name_pattern rule resolves to ML-KEM-1024 — the label carries the SECURITY LEVEL (X448 successor keeps L5), not just the algorithm family.',
    path: 'positive',
    request: { op: 'CreateKeyPair:KeyAgreement', name: 'interbank-vpn-kex' },
    expect: 'Allow',
  },
  {
    id: 'mig-pqc-rekey-ed25519',
    policyFile: 'migration-pqc.yaml',
    title: 'Sign with a legacy Ed25519 key',
    description: 'Rekey-on-use per the Hub transitions dataset: Ed25519 → ML-DSA-44 at first Sign.',
    path: 'positive',
    request: { op: 'Sign', algorithm: 'Ed25519', state: 'Active' },
    expect: 'Rekey',
  },
  {
    id: 'mig-pqc-rekey-x448',
    policyFile: 'migration-pqc.yaml',
    title: 'Encapsulate with a legacy X448 key',
    description: 'X448 → ML-KEM-1024 (keeps Level 5) on first use or via the ReKey sweep.',
    path: 'positive',
    request: { op: 'Encapsulate', algorithm: 'X448', state: 'Active' },
    expect: 'Rekey',
  },
  {
    id: 'mig-pqc-verify-legacy',
    policyFile: 'migration-pqc.yaml',
    title: 'Verify a legacy ECDSA-P256 signature',
    description:
      'Verify/Decrypt of existing artefacts stays open — only the producing ops (Sign/Encrypt/Encapsulate) drive the migration.',
    path: 'positive',
    request: { op: 'SignatureVerify', algorithm: 'ECDSA-P256', state: 'Active' },
    expect: 'Allow',
  },
  {
    id: 'mig-pqc-deny-rsa',
    policyFile: 'migration-pqc.yaml',
    title: 'Create a new RSA-2048 key pair',
    description: 'No new classical asymmetric keys under the full-PQC target policy.',
    path: 'negative',
    request: { op: 'CreateKeyPair:Sign', algorithm: 'RSA-2048' },
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
    realExecution: { algorithm: 'FrodoKEM-1344-AES', outcome: 'refused' },
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
    realExecution: {
      algorithm: 'FrodoKEM-1344-AES',
      attrs: { 'pqctoday-hybrid-partner': 'X25519' },
      outcome: 'roundtrip',
    },
  },
  {
    id: 'bsi-deny-frodo-nopartner',
    policyFile: 'bsi-tr-02102.yaml',
    title: 'FrodoKEM-1344 without a hybrid partner',
    description: 'BSI mandates HYBRID — a standalone PQC KEM (no classical partner) is rejected.',
    path: 'negative',
    request: { op: 'CreateKeyPair:KeyAgreement', algorithm: 'FrodoKEM-1344' },
    expect: 'Deny',
    realExecution: { algorithm: 'FrodoKEM-1344-AES', outcome: 'refused' },
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
    id: 'hybrid-allow-pure-pqc',
    policyFile: 'hybrid-migration-window.yaml',
    title: 'Pure-PQC Sign inside the window (untagged)',
    description:
      'Pure PQC is allowed untagged — Plane 2 cannot instantiate composite keys yet, so the composite mandate is opt-in (2026-07-04 remediation).',
    path: 'positive',
    request: { op: 'Sign', algorithm: 'ML-DSA-87', state: 'Active', date: '2027-06-01' },
    expect: 'Allow',
  },
  {
    id: 'hybrid-deny-pure-pqc-optin',
    policyFile: 'hybrid-migration-window.yaml',
    title: 'Opted-in dual-sign with pure PQC',
    description:
      'A request tagged x-pqctoday-dual-sign=required is held to the ML-DSA-65+Ed25519 composite — pure PQC is denied for it.',
    path: 'negative',
    request: {
      op: 'Sign',
      algorithm: 'ML-DSA-87',
      state: 'Active',
      date: '2027-06-01',
      attrs: { 'pqctoday-dual-sign': 'required' },
    },
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
    id: 'mig2030-deny-3des',
    policyFile: 'pqc-migration-2030.yaml',
    title: 'Sign with 3DES',
    description:
      'Single/Triple-DES are banned at all times, regardless of date. (Was "MD5" — not a KMIP algorithm name; weak hashes are now gated on the mechanism dimension.)',
    path: 'negative',
    request: { op: 'Sign', algorithm: '3DES', state: 'Active', date: '2027-06-01' },
    expect: 'Deny',
  },
  {
    id: 'mig2030-deny-sha1-hash',
    policyFile: 'pqc-migration-2030.yaml',
    title: 'Sign hashed with SHA-1',
    description:
      'Weak hashes are gated on the KMIP Hashing Algorithm mechanism — the old "MD5/SHA1 algorithm" denylist entries could never fire (2026-07-04 remediation).',
    path: 'negative',
    request: {
      op: 'Sign',
      algorithm: 'ECDSA-P256',
      state: 'Active',
      date: '2027-06-01',
      mechanism: { hash: 'SHA-1' },
    },
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
    id: 'hybrid-deny-legacy-pre',
    policyFile: 'hybrid-migration-window.yaml',
    title: 'Classical Sign before the policy takes effect',
    description:
      'A policy is inert before its own effective date — fail-closed denies by default rather than falling through to some other implicit allow (2026-08-28 audit, A2).',
    path: 'negative',
    request: { op: 'Sign', algorithm: 'ECDSA-P256', state: 'Active', date: '2025-06-01' },
    expect: 'Deny',
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

  // ── 2026-07-04 gap-audit regression net ─────────────────────────────────
  // Each of these encodes a bug found (and fixed) in the policy-library gap
  // audit — if any regresses, the validation gate goes red.

  // cnsa-2.0: the original user-reported bug — AES-256 allowed but every use
  // op denied for the missing classification tag. Governance tags are
  // creation-scoped now; use/recover ops on untagged (legacy) keys stay open.
  {
    id: 'cnsa-allow-encrypt-untagged',
    policyFile: 'cnsa-2.0.yaml',
    title: 'Encrypt with an untagged AES-256 key',
    description:
      'THE reported bug: the classification tag is required at key creation only — Encrypt with an existing (e.g. legacy) untagged key is allowed.',
    path: 'positive',
    request: {
      op: 'Encrypt',
      algorithm: 'AES-256',
      state: 'Active',
      mechanism: { blockMode: 'GCM' },
    },
    expect: 'Allow',
  },
  {
    id: 'cnsa-allow-decrypt-legacy',
    policyFile: 'cnsa-2.0.yaml',
    title: 'Decrypt with a legacy AES-256 key',
    description:
      'Decrypt stays open so legacy artefacts remain recoverable — exactly what the policy description promises.',
    path: 'positive',
    request: { op: 'Decrypt', algorithm: 'AES-256', state: 'Active' },
    expect: 'Allow',
  },
  {
    id: 'cnsa-allow-verify-legacy',
    policyFile: 'cnsa-2.0.yaml',
    title: 'Verify a signature from an untagged ML-DSA-87 key',
    description: 'SignatureVerify is never gated by the governance tag.',
    path: 'positive',
    request: { op: 'SignatureVerify', algorithm: 'ML-DSA-87' },
    expect: 'Allow',
  },
  {
    id: 'cnsa-deny-sha256-hash',
    policyFile: 'cnsa-2.0.yaml',
    title: 'Sign hashed with SHA-256',
    description:
      'CNSA 2.0 mandates SHA-384/512 for all hashing (NSA CNSA 2.0 FAQ) — SHA-256-hashed signing was silently allowed before the audit.',
    path: 'negative',
    request: {
      op: 'Sign',
      algorithm: 'ML-DSA-87',
      state: 'Active',
      mechanism: { hash: 'SHA-256' },
    },
    expect: 'Deny',
  },
  {
    id: 'cnsa-allow-sha384-hash',
    policyFile: 'cnsa-2.0.yaml',
    title: 'Sign hashed with SHA-384',
    description: 'SHA-384 is in the CNSA 2.0 suite.',
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
    id: 'cnsa-deny-hss',
    policyFile: 'cnsa-2.0.yaml',
    title: 'Create an HSS key',
    description:
      'Only the SINGLE-tree stateful HBS schemes (LMS, XMSS) are CNSA 2.0-approved; multi-tree HSS/XMSS-MT are explicitly not (NSA CNSA 2.0 FAQ).',
    path: 'negative',
    request: {
      op: 'CreateKeyPair',
      algorithm: 'HSS',
      usageMask: ['Sign', 'Verify'],
      attrs: { 'pqctoday-cnsa-classification': 'Secret' },
    },
    expect: 'Deny',
  },

  // fips-only: ECDH restored; mechanism-dimension fail-opens closed.
  {
    id: 'fips-allow-ecdh',
    policyFile: 'fips-only.yaml',
    title: 'Create an ECDH-P256 key-agreement pair',
    description:
      'SP 800-56A ECDH over the P-curves is FIPS-approved — its omission from the allowlist made every classical key agreement impossible (gap audit).',
    path: 'positive',
    request: { op: 'CreateKeyPair:KeyAgreement', algorithm: 'ECDH-P256', length: 256 },
    expect: 'Allow',
  },
  // Ed25519 — runnable at the engine as of 2026-07-05 (P1). FIPS 186-5
  // approves it (fips-only allows); CNSA 2.0 does not (cnsa-2.0 denies as
  // classical asymmetric). These are also the first scenarios where the
  // Allow verdict is backed by a key the workbench can now actually create.
  {
    id: 'fips-allow-ed25519',
    policyFile: 'fips-only.yaml',
    title: 'Create an Ed25519 signing key',
    description: 'Ed25519 (EdDSA) is FIPS 186-5-approved — fips-only allowlists it.',
    path: 'positive',
    request: {
      op: 'CreateKeyPair:Sign',
      algorithm: 'Ed25519',
      usageMask: ['Sign', 'Verify'],
    },
    expect: 'Allow',
  },
  {
    id: 'cnsa-deny-ed25519',
    policyFile: 'cnsa-2.0.yaml',
    title: 'Create an Ed25519 signing key',
    description:
      'CNSA 2.0 mandates ML-DSA-87 for signatures — classical EdDSA is denied like RSA/ECDSA.',
    path: 'negative',
    request: {
      op: 'CreateKeyPair:Sign',
      algorithm: 'Ed25519',
      usageMask: ['Sign', 'Verify'],
      attrs: { 'pqctoday-cnsa-classification': 'Secret' },
    },
    expect: 'Deny',
  },
  {
    id: 'fips-deny-pkcs1v15-encrypt',
    policyFile: 'fips-only.yaml',
    title: 'RSA Encrypt with PKCS#1 v1.5 padding',
    description:
      'SP 800-131A r2 disallows v1.5 encryption after 2023 — OAEP only (legacy Decrypt stays open).',
    path: 'negative',
    request: {
      op: 'Encrypt',
      algorithm: 'RSA-3072',
      state: 'Active',
      mechanism: { padding: 'PKCS1 v1.5' },
    },
    expect: 'Deny',
  },
  {
    id: 'fips-deny-sha1-sign',
    policyFile: 'fips-only.yaml',
    title: 'Sign hashed with SHA-1',
    description:
      'The old "SHA1 algorithm" denylist entry could never fire; SHA-1 is now denied on the hashing mechanism.',
    path: 'negative',
    request: {
      op: 'Sign',
      algorithm: 'ECDSA-P256',
      state: 'Active',
      mechanism: { hash: 'SHA-1' },
    },
    expect: 'Deny',
  },

  // bsi-tr-02102: every advertised signature scheme is actually signable now;
  // the composite is an opt-in, and the real hybrid KEM is allowlisted.
  {
    id: 'bsi-allow-pure-mldsa',
    policyFile: 'bsi-tr-02102.yaml',
    title: 'Sign with pure ML-DSA-87',
    description:
      'BSI recommends (not mandates) hybrid signatures — before the audit the unconditional composite mandate denied every signature scheme, including this one.',
    path: 'positive',
    request: { op: 'Sign', algorithm: 'ML-DSA-87', state: 'Active', date: '2027-06-01' },
    expect: 'Allow',
  },
  {
    id: 'bsi-allow-hybrid-kem',
    policyFile: 'bsi-tr-02102.yaml',
    title: 'Create an X25519MLKEM768 hybrid key pair',
    description:
      'The combined hybrid KEM is hybrid by construction — no partner attribute needed. It was DENIED by the hybrid-mandating policy before the audit.',
    path: 'positive',
    request: { op: 'CreateKeyPair:KeyAgreement', algorithm: 'X25519MLKEM768' },
    expect: 'Allow',
  },
  {
    id: 'bsi-deny-composite-optin-pure',
    policyFile: 'bsi-tr-02102.yaml',
    title: 'Opted-in hybrid signing with a pure algorithm',
    description:
      'A request tagged x-pqctoday-hybrid-sign=required must carry the ML-DSA-65+ECDSA-P384 composite.',
    path: 'negative',
    request: {
      op: 'CreateKeyPair:Sign',
      algorithm: 'ML-DSA-87',
      date: '2027-06-01',
      attrs: { 'pqctoday-hybrid-sign': 'required' },
    },
    expect: 'Deny',
  },
  {
    id: 'bsi-allow-decap-untagged',
    policyFile: 'bsi-tr-02102.yaml',
    title: 'Decapsulate with an untagged ML-KEM key',
    description:
      'The hybrid-partner tag is a creation-time requirement — using an existing KEM key is not re-gated (gap audit).',
    path: 'positive',
    request: { op: 'Decapsulate', algorithm: 'ML-KEM-1024', state: 'Active' },
    expect: 'Allow',
  },

  // pqc-migration-2030: pure PQC creatable in the window, post-2030 creation
  // banned, verify never gated by the purpose tag.
  {
    id: 'mig2030-allow-mldsa-create-2028',
    policyFile: 'pqc-migration-2030.yaml',
    title: 'Create a pure ML-DSA-65 signing key in 2028',
    description:
      'The old unconditional composite mandate made pure-PQC signing keys uncreatable 2027–2029 — with composites not instantiable, NO signing key could be created at all.',
    path: 'positive',
    request: {
      op: 'CreateKeyPair:Sign',
      algorithm: 'ML-DSA-65',
      usageMask: ['Sign', 'Verify'],
      date: '2028-06-01',
      attrs: { 'pqctoday-purpose': 'production' },
    },
    expect: 'Allow',
  },
  {
    id: 'mig2030-deny-classical-create-2031',
    policyFile: 'pqc-migration-2030.yaml',
    title: 'Create an RSA-3072 encryption pair in 2031',
    description:
      'Post-2030 the roadmap bans classical key CREATION for every purpose — before the audit only classical USE was cut off.',
    path: 'negative',
    request: {
      op: 'CreateKeyPair:Encrypt',
      algorithm: 'RSA-3072',
      length: 3072,
      date: '2031-06-01',
    },
    expect: 'Deny',
  },
  {
    id: 'mig2030-allow-verify-untagged',
    policyFile: 'pqc-migration-2030.yaml',
    title: 'Verify with an untagged ML-DSA-87 key',
    description:
      'The purpose tag is required at key creation only — verification of legacy artefacts is never gated (gap audit).',
    path: 'positive',
    request: { op: 'SignatureVerify', algorithm: 'ML-DSA-87', date: '2031-06-01' },
    expect: 'Allow',
  },

  // classical: the PQC boundary is class-based now — the old hand list let
  // LMS/XMSS/HSS/XMSS-MT, most SLH-DSA sets and the hybrid KEMs through.
  {
    id: 'classical-deny-lms',
    policyFile: 'classical.yaml',
    title: 'Create an LMS key under the classical policy',
    description:
      'The PQC boundary is class-based — stateful HBS schemes no longer leak through the "before" policy (gap audit).',
    path: 'negative',
    request: { op: 'CreateKeyPair:Sign', algorithm: 'LMS' },
    expect: 'Deny',
  },
  {
    id: 'classical-deny-hybrid-kem',
    policyFile: 'classical.yaml',
    title: 'Create an X25519MLKEM768 pair under the classical policy',
    description:
      'Hybrid KEMs carry a PQC component and are caught by the class-based boundary (they classified as "classical" before the audit).',
    path: 'negative',
    request: { op: 'CreateKeyPair:KeyAgreement', algorithm: 'X25519MLKEM768' },
    expect: 'Deny',
  },

  // pqc: X25519 joined the classical denylist; RSA signing keys now rekey.
  {
    id: 'pqc-deny-x25519',
    policyFile: 'pqc.yaml',
    title: 'Create an X25519 key under the PQC policy',
    description:
      'X25519/X448 were missing from the classical denylist — new classical key-agreement keys were creatable under the "after" policy (gap audit).',
    path: 'negative',
    request: { op: 'CreateKeyPair:KeyAgreement', algorithm: 'X25519' },
    expect: 'Deny',
  },
  {
    id: 'pqc-rekey-rsa-sign',
    policyFile: 'pqc.yaml',
    title: 'Sign with a legacy RSA-3072 key',
    description:
      'Legacy RSA signing keys now auto-rekey to ML-DSA-87 at first use — only ECDSA-P256 did before the audit.',
    path: 'positive',
    request: { op: 'Sign', algorithm: 'RSA-3072', state: 'Active' },
    expect: 'Rekey',
  },

  // pkcs11-mechanism-lockdown: ML-KEM keys can be CREATED, not just used.
  {
    id: 'ckm-allow-mlkem-gen',
    policyFile: 'pkcs11-mechanism-lockdown.yaml',
    title: 'Create an ML-KEM key with CKM_ML_KEM_KEY_PAIR_GEN',
    description:
      'CKM_ML_KEM_KEY_PAIR_GEN was missing from the allowlist — ML-KEM could be used but never created under this lockdown (gap audit).',
    path: 'positive',
    request: {
      op: 'CreateKeyPair',
      algorithm: 'ML-KEM-768',
      mechanism: { mech: 'CKM_ML_KEM_KEY_PAIR_GEN' },
    },
    expect: 'Allow',
  },
]

/** Scenarios tied to a given policy file (for the workbench picker). */
export const scenariosForPolicy = (policyFile: string | null): PolicyTestScenario[] =>
  POLICY_SCENARIOS.filter((s) => s.policyFile === (policyFile ?? 'training-permissive.yaml'))

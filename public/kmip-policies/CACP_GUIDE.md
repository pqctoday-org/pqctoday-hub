# CACP Guide — the policy language, and how to test it in the Agility Workbench

*Crypto-Agility Control Plane (CACP) · 2026-07-04 · covers the post-gap-audit
policy library (engine `ops:`-scoped governance rules), the hub workbench at
`/playground/cacp`, and the verified KMIP 3.0 status for hybrid KEMs and
hybrid signatures.*

---

## 1. What CACP is

Every KMIP request passes through three planes:

| Plane | What it does | Where |
|---|---|---|
| **1 — Agility policy engine** | Evaluates the request against the active YAML policy: default, substitute, allow, deny, or rekey | `kmip/src/policy/` |
| **2 — KMIP 3.0 dispatcher** | Executes the op (Create, Sign, Encapsulate…) against managed objects | `kmip/src/ops/` |
| **3 — PKCS#11 engine** | The actual crypto (softhsmrustv3; WASM build in the browser) | `rust/`, `wasm/` |

Policies are YAML files. The **canonical source is
`pqctoday-hsm/kmip/policies/*.yaml`**; the hub's copies in
`public/kmip-policies/` are staged verbatim by
`scripts/build-kmip-wasm.sh` and byte-checked by
`policyCatalogSync.local.test.ts` — never hand-edit the hub copies.

With **no policy loaded, every request is denied** (`PolicyNotLoaded`) — the
sandbox explicitly loads `training-permissive.yaml`.

## 2. The policy language

### 2.1 File anatomy

```yaml
schema_version: 1
metadata:
  name: my-policy
  description: |            # honest prose — the gap audit's biggest lesson:
    ...                      # descriptions MUST match what the rules do
  authority: <owner>
  effective: "2026-01-01"    # or "always"
  compliance_mapping:        # optional, for reporting tools
    - { framework: "NSA CNSA-2.0", status: aligned }
rules:                       # ordered list — order matters (see 2.2)
  - type: <rule type>
    <fields>
    reason: "audit-log text shown to the caller on Deny"
    clause: "BSI TR-02102-1 §2.1"   # optional provenance, shown in the UI
```

### 2.2 Two-pass evaluation

1. **Pass 1 — resolution.** `algorithm_default` (fills a missing algorithm)
   and `algorithm_substitution` (rewrites one algorithm to another). **Last
   match wins**, so write "general default, then specific exception".
   A substitution firing against an *existing* stored key becomes
   **`RekeyAndProceed`** — the transparent-migration decision KMIP alone
   cannot express. Implemented for `Sign` (RSA/ECDSA → ML-DSA) and, since
   2026-07-05, `Encapsulate` (classical ECDH/X25519/X448 → ML-KEM/hybrid,
   `encapsulate.rs::rekey_and_encapsulate`) — both **originator** ops that
   produce fresh output each call, so there's nothing yet to contradict.
   **Engine invariant:** `algorithm_substitution` can never fire for
   `Decapsulate`, `DeriveKey`, or `Decrypt` — these **consumer ops**
   (`policy::rule::is_consumer_op`) operate on material a peer already
   fixed to a specific algorithm at an earlier call, so there is no
   "instead use algorithm X" available; a rule naming one of them is
   rejected at policy-load time, not silently ignored at request time.
2. **Pass 2 — gating.** All other rules, in file order. **First Deny wins**;
   no Deny ⇒ Allow. A substitution that points at a banned algorithm is
   caught here (no rekey to a forbidden algorithm).

### 2.3 Operation names

Rule `ops:` lists match the canonical KMIP op names (`Create`,
`CreateKeyPair`, `Register`, `Import`, `Sign`, `SignatureVerify`, `Encrypt`,
`Decrypt`, `Encapsulate`, `Decapsulate`, `MAC`, `Get`, …). Because one
`CreateKeyPair` op must default differently per purpose, the dispatcher
canonicalises it from the usage mask:

| Usage mask contains | Canonical op |
|---|---|
| `KeyAgreement` | `CreateKeyPair:KeyAgreement` |
| `Sign`/`Verify` | `CreateKeyPair:Sign` |
| `Encrypt`/`Decrypt` | `CreateKeyPair:Encrypt` |

Matching: exact, or the rule op is a **colon-prefix** of the request op
(`CreateKeyPair` matches every `CreateKeyPair:*`; `Create` matches neither).

### 2.4 Algorithm names and matching

- Requests always carry **qualified** names (`AES-256`, `ECDSA-P384`,
  `ML-DSA-87`). A policy entry may be a **family** (`AES`, `RSA`, `ECDSA`,
  `SLH-DSA`) which covers every hyphen-qualified member. Matching is
  case-insensitive; never reversed (`AES-128` does not cover `AES-256`).
- **Pitfall (found by the gap audit):** `MD5`, `SHA1`, `RSA-PKCS1-v1_5`,
  `ECDSA-SHA1` are **not algorithm names** — hashes and paddings are
  *mechanism parameters*. A denylist naming them never fires. Gate them with
  `hash_algorithm_allowlist` / `mechanism_parameter_constraint` instead.
  `DES`/`3DES` **are** real KMIP algorithm names and may be denylisted.
- **Classes** (`temporal_cutoff`): `pqc` (ML-KEM/ML-DSA/SLH-DSA/HBS/…,
  composites, and hybrid KEMs like `X25519MLKEM768`), `symmetric`
  (AES/ChaCha20/HMAC/KMAC — quantum-safe, never swept by a classical
  cutoff), `classical` (RSA/EC/Ed/X — the deprecation target; unknown names
  fall here, fail-closed).

### 2.5 Rule types (18)

**Resolution:** `algorithm_default`, `algorithm_substitution`.

**Algorithm gating:** `algorithm_allowlist`, `algorithm_denylist` (both take
`ops`, optional `effective_from/until`; denylist takes an optional
`exception_custom_attribute`), `min_key_length`, `temporal_cutoff` (single
`op`, `algorithm_class`, `after:` date or `"always"` for an unconditional
class ban), `lifecycle_state_gate`, `max_key_age_days`.

**Governance (creation-scoped by default — 2026-07-04):**
- `require_usage_mask { algorithm, flags, ops? }`
- `require_custom_attribute { attribute_name, algorithms, ops? }`

  When `ops:` is omitted these gate **only** `Create`, `CreateKeyPair`,
  `Register`, `Import`. They are key-*provenance* rules: the tag/mask is
  established at creation and persisted; use ops read the stored values.
  (Before this fix they fired on *every* op — the "CNSA 2.0 allows AES-256
  but denies Encrypt/Decrypt" bug.)

**Hybrid:** `hybrid_dual_sign_requirement { primary, secondary,
effective_from/until, ops_affected, triggered_by_custom_attribute?,
composite_oid? }` — requires the composite name `<primary>-<secondary>`
during the window. Use `triggered_by_custom_attribute` to make it an
**opt-in** (see §4: composites are not instantiable yet, so an unconditional
mandate bricks signing). Skips symmetric algorithms by class.

**Mechanism dimension:** `hash_algorithm_allowlist` (KMIP `Hashing
Algorithm`), `mechanism_parameter_constraint` (block-cipher mode / padding /
deterministic flag), `mechanism_parameter_default` (a *forcing* rule — sets
parameters the client omitted), `mechanism_allowlist` / `mechanism_denylist`
(canonical PKCS#11 `CKM_*` — bypass-proof across KMIP and the PKCS#11
passthrough), `mac_mechanism_policy`.

**Documentation-only:** `compliance_profile_gate` (a profile label for
reporting; never denies).

### 2.6 Fail-open edges to remember

- Mechanism rules gate parameters that are **present**; a request that omits
  the mode/padding/hash is not denied by a constraint rule (the op handler's
  resolver applies its own defaults). State it in the description.
- `require_usage_mask` **fails closed** at creation when no mask is supplied.
- Unknown algorithm names in *allow* position are strict-lint **errors**; in
  *deny* position they are advisory (a denylist may name a
  real-but-unimplemented algorithm — but check §2.4's pitfall first).

### 2.7 Authoring workflow

1. Edit the YAML in `pqctoday-hsm/kmip/policies/`.
2. Validate: `PolicyStore::validate_draft_strict` (the loader's strict lint
   rejects unknown names/values — a typo can never silently disable a rule).
3. Dry-run against sample requests (workbench Simulate tab, or
   `pqctoday-kmip-compliance`).
4. Stage to the hub: `bash scripts/build-kmip-wasm.sh` (copies YAML + WASM).
5. Add positive **and** negative scenarios in
   `hub src/components/Playground/kmip/policyScenarios.ts` (§3.5) — the gap
   audit existed because broken paths had no scenario.

## 3. Testing in the Agility Workbench (`/playground/cacp`)

Three tabs; a **Guided/Expert** toggle gates the advanced controls.

### 3.1 Agility & Workbench tab

- **Plane 1 strip** — activate any of the 13 policies; shows what an
  unspecified key currently resolves to (the "flip the policy, same code"
  demo) and an inline mini dry-run.
- **Manual workbench** — numbered lifecycle: **Create → Activate → Sign /
  Verify** (signature kinds), **Encapsulate / Decapsulate** (KEMs, incl. the
  hybrid `X25519MLKEM768` / `SecP256r1MLKEM768`), **Encrypt / Decrypt**
  (AES-GCM). Expert adds Query/Locate/Get/Revoke/Destroy and the
  "Revoke, then Sign again" lifecycle demo.
- **Key tags** — free-text governance attributes attached at creation
  (`x-` prefix optional): e.g. `pqctoday-cnsa-classification=Secret` under
  CNSA 2.0, `pqctoday-hybrid-partner=ECDH-P384` for a standalone PQC KEM
  under BSI. Tag-gated policies are untestable without this.
- **Spec-only algorithms** (LMS, HSS, XMSS, XMSS-MT, Ed25519, X25519,
  FrodoKEM, Classic-McEliece): the policy verdict is real, the keygen is
  not — the in-browser engine can't instantiate them; picking one shows the
  policy decision without running crypto. Use them to prove e.g. "CNSA
  allows LMS but denies HSS".

### 3.2 Policy tab

- **List** — catalog cards, the algorithm **disposition matrix**, and the
  **coverage sweep** with three columns per algorithm: **Create** (new key),
  **Protect** (Sign/Encrypt/Encapsulate on an existing key), **Recover**
  (Verify/Decrypt/Decapsulate). "Recover = denied" on an otherwise-allowed
  algorithm is a red flag — transition policies promise recovery stays open.
  Sweeps supply the governance tags, so cells show the *algorithm* verdict,
  not a missing-tag artefact.
- **Visual** — node-graph editor (palette of all 18 rule types, per-rule
  inspector, drag/reorder/disable), **Simulate** (full dry-run: op, key
  state, algorithm, date, key bits; Expert adds custom attributes, usage
  mask, hash, CKM mechanism, block mode, padding, deterministic flag,
  activation date — with a two-pass rule-by-rule trace), **Check**
  (validation findings), and an editable **YAML drawer** (edits auto-apply
  to the in-browser engine only; nothing is written to disk).
- **Compare / Timeline** — side-by-side policy diffs and the dated-cutoff
  view.

### 3.3 Batch & Macros tab

A batch is **one** KMIP Request Message carrying N operations:

- **Recipes** (macros): provision-and-sign, provision-KEM, atomic-undo,
  inventory. Load one, then edit the sequence.
- **`$IDPlaceholder`** (KMIP §6.4): an item's `uid` referencing the object
  the previous item created — `CreateKeyPair → Activate($IDPlaceholder) →
  Sign($IDPlaceholder)` with no copy-pasted UIDs.
- **Error continuation** (KMIP §9.5): `Continue` (run everything), `Stop`
  (halt at first failure), `Undo` (halt AND roll back earlier successes —
  watch `OperationUndone` under a denying policy: atomicity in action).
- Builder ops now cover the full round trip: Create/CreateKeyPair, Activate,
  Sign, **SignatureVerify**, Encapsulate, **Decapsulate**, **Encrypt**,
  **Decrypt**, Query, Locate, Get, Revoke, Destroy.
- Expert shows the shared request/response TTLV wire hex.

### 3.4 Testing recipes

| To prove… | Do |
|---|---|
| CNSA 2.0 needs the classification tag at creation | Activate CNSA 2.0 → Create AES-256 with no tags → **Deny**; add `pqctoday-cnsa-classification=Secret` → **Allow** |
| …but legacy decrypt stays open | Simulate: op `Decrypt`, algorithm `AES-256`, no attributes → **Allow** |
| CNSA 2.0 hash gating | Simulate: `Sign`, `ML-DSA-87`, hash `SHA-256` → **Deny**; `SHA-384` → **Allow** |
| A temporal cutoff | Simulate the same request at two dates (e.g. `Sign` ECDSA-P256 under the 2030 roadmap at 2029 vs 2031) |
| Rekey-on-use (signing) | Activate `pqc` or `auto-migrate-on-use` → workbench `Sign` with an ECDSA/RSA key created under `classical` → watch `RekeyAndProceed` |
| Rekey-on-use (key establishment) | Activate `pqc` or `auto-migrate-on-use` → workbench `Encapsulate` with an ECDH-P256/P384 key created under `classical` → watch `RekeyAndProceed`, both new-pair halves land Active, both old-pair halves Deactivated + `x-pqctoday-supersedes`-linked (2026-07-05) |
| Hybrid opt-in | Simulate `Sign` `ML-DSA-87` with attribute `pqctoday-dual-sign=required` under the hybrid window → **Deny** (composite required); untagged → **Allow** |
| Batch atomicity | Batch tab → atomic-undo recipe under the `pqc` policy → RSA item fails, earlier AES create is **undone** |

### 3.5 The validation gate

`policyScenarios.ts` (~95 scenarios) is the single source of truth consumed
by the workbench scenario picker AND asserted end-to-end by
`e2e/cacp-policy-scenarios.local.spec.ts` against **both** the real WASM
engine and the visual simulator. Every policy change needs matching
positive/negative scenarios — the 2026-07-04 audit block at the end of the
file encodes each fixed gap as a regression test.

## 4. KMIP 3.0 status — hybrid KEMs and hybrid signatures (verified 2026-07-04)

**Status.** The newest published OASIS *Standard* is **KMIP 2.1** (Dec 2020).
KMIP 3.0 is in committee: CSD01/WD16 (Aug 2024) → public review → **WD19
(Feb 2025)**, the draft vendored in `kmip/spec/oasis-kmip-3.0/` and
implemented here. **KMIP Test Cases 3.0 / Profiles 3.0 are work-in-progress —
there are no official 3.0 test vectors yet**; this repo's KATs and
conformance evidence are vendored-draft-based by necessity.

**PQC.** The 3.0 line adds ML-KEM, ML-DSA, SLH-DSA (all 12 sets) plus the
`Encapsulate`/`Decapsulate` operations. The public-review snapshot's
algorithm enum ends at `SLH-DSA-SHAKE-256f` (0x4A); **WD19 extends it to
0x5D**, adding among others the pre-hash `HASH-SLH-DSA-…` variants and the
hybrid KEMs. (Note: `kmip-spec-3.0-tags-enums.json` in this repo was
extracted from the older snapshot and stops at 0x4A while the code
implements WD19 values — regenerate it from WD19.)

**Hybrid KEM — a pure hybrid key type; batches are NOT involved.**
`X25519MLKEM768` (0x5C) and `SecP256r1MLKEM768` (0x5D) are first-class
Cryptographic Algorithm values in WD19 (per `draft-ietf-tls-ecdhe-mlkem`):
one managed object, standard Encapsulate/Decapsulate, combiner inside the
engine (`hybrid_kem.rs`). These are draft-track codepoints — if the final
OASIS Standard renumbers, it's a one-line constant swap.

**Hybrid (composite) signature — KMIP has no native answer.** No KMIP
version or draft defines classical+PQC composite signature algorithms, a
hybrid key object type, or a dual-sign operation (the WD19
`HASH-SLH-DSA-…-with-SHA256` names are FIPS 205 pre-hash modes, not
composites; KMIP's Split Key is n-of-m custody of one key, unrelated). Two
compliant patterns:

1. **Extension codepoint (recommended, planned):** every KMIP enum reserves
   `8XXXXXXX` for extensions. Register e.g. `ML-DSA-65-Ed25519` =
   `0x80000101`: one key object, one Sign returning the LAMPS composite
   value, mirroring `hybrid_kem.rs`. The policy plane then gates the
   composite as a first-class name (`hybrid_dual_sign_requirement` already
   matches it), and the opt-in mandates in `bsi-tr-02102` /
   `hybrid-migration-window` / `pqc-migration-2030` can become unconditional.
   Swap to official codepoints when OASIS assigns them.
2. **Two linked keys + one batch (pure-standard fallback, works today):**
   ML-DSA key + Ed25519 key linked via Link/custom attributes, signed in one
   batched request (`$IDPlaceholder`, continuation `Undo` for atomicity),
   LAMPS encoding assembled client-side. No extensions — but the server sees
   two independent signatures, so policy cannot attest "this was dual-signed".

Sources: [KMIP 3.0 CSD01](https://docs.oasis-open.org/kmip/kmip-spec/v3.0/csd01/kmip-spec-v3.0-csd01.pdf) ·
[P6R KMIP 2.1↔3.0 diff (WD19)](https://www.p6r.com/articles/2024/06/16/detailed-differences-between-kmip-2-1-and-3-0/) ·
[OASIS KMIP TC](https://www.oasis-open.org/committees/tc_home.php?wg_abbrev=kmip) ·
[KMIP 2.1 OS announcement](https://www.oasis-open.org/2020/12/18/key-management-interoperability-protocol-specification-and-key-management-interoperability-protocol-profiles-oasis-standards-published/) ·
vendored `kmip-spec-v3.0-wd19-clean.pdf` (Table 552) + `kmip-spec-v3.0.html`.

## 5. Engine 0.12/0.13 — the "honest maximum" additions (verified 2026-07-09)

Two engine releases closed the gap between what the server *advertises* and
what it *does*. Everything below is real in the in-browser playground too,
and each has a hands-on surface:

- **Split keys (§6.1.12 / §6.1.31).** `Create Split Key` divides a key into
  N share objects where any M (the threshold) reconstruct it via
  `Join Split Key`; below-threshold joins are refused with the shortfall
  named. All four §11.54 methods are implemented (XOR requires N == M;
  the three polynomial methods are true Shamir M-of-N). Try it: Learn
  walkthrough 7, or the Commands tab's Object Lifecycle category.
- **Asynchronous processing (§8.1.2, §6.1.43/5/44/46).** A request carrying
  `Asynchronous Indicator = Mandatory` is enqueued as a real job — the
  response is `OperationPending` + a correlation value; `Poll` returns the
  identical payload the synchronous op would have; `Cancel` handles its
  race honestly; `Query Asynchronous Requests` lists what's in flight. Try
  it: Learn walkthrough 8, or the Commands tab's Asynchronous Processing
  category (enqueue via Hash's "Run asynchronously" toggle).
- **Honest Query.** The advertised-operations list is audited down to
  what genuinely runs: 62 of the 66 KMIP 3.0 operations. The four that
  don't (Notify/Put — server-to-client scope boundary; DelegatedLogin/
  Re-Provision — no handler) are no longer advertised at all.
- **13 honesty fixes (0.13.0).** Destroy zeroizes material and securely
  deletes it from storage; Set/Modify/Delete/AdjustAttribute never again
  answer Success while persisting nothing (read-only sets are refused);
  Locate really filters by length/usage-mask/UID; batch `Undo` and
  `$IDPlaceholder` now cover the UID-minting Encapsulate/Decapsulate/
  split-key ops; Register refuses malformed keys at registration; a
  granted usage allocation can't be silently re-budgeted (§4.69). Try it:
  Learn walkthrough 9, and the Batch tab's "Rollback reaches Encapsulate"
  recipe.
- **Conformance baseline.** The native CI gate pins an exact 97 PASS /
  5 deprecated-skip on the 102 OASIS tests. The playground's Corpus Replay
  matches it except three honestly-labelled wasm-seam skips — the native
  TLS listener's MaximumResponseSize enforcement, which `KmipPlayground::
  submit`'s direct `dispatch()` call has no seam for (94 PASS / 5 deprecated
  / 3 transport-skip, still summing to the same 97 the native gate pins).
  The RNG-seed-mode gap this used to also list is closed: the three
  per-test-RngSeedMode corpus tests now pass by booting the wasm engine
  pinned to each test's mode via its constructor. Re-verified 2026-07-10
  against the cert-ops port's Certify/Re-certify/Validate change to
  `classify.ts` (`runner.local.test.ts`'s full-corpus breakdown test) —
  unaffected, still exactly this baseline.

## 6. Certificate Services — pure-Rust cert-ops port (0.14, verified 2026-07-09)

Through 0.13, §6.1.6 Certify, §6.1.50 Re-certify, and §6.1.62 Validate were
real, spec'd operations with real NATIVE handlers — but this in-browser
playground answered all three with `OperationNotSupported`, because their
crypto backends (`rcgen` for Certify's CSR check, `ring`-backed
`x509-parser` for Validate's chain-signature check) are C-backed and don't
cross-compile to `wasm32-unknown-unknown`.

The 0.14 cert-ops port replaced both with a single pure-Rust primitive —
`ops::spki_verify::verify_with_spki` — built on RustCrypto's `x509-cert`/
`der`/`spki` crates plus the SAME engine every other operation drives (no
second crypto stack). Certify's CSR self-signature check and Validate's
chain-link signature check both call it now. The identical source compiles
for native and `wasm32-unknown-unknown`; the `native` Cargo feature no
longer gates either module.

**What's real here now:**
- **Certify (§6.1.6).** Issues a certificate over a stored PublicKey UID or
  a PKCS#10 CSR, signed by a designated CA key in the engine. Every
  algorithm the engine signs with is issuable — RSA, ECDSA, Ed25519,
  ML-DSA (all 3 parameter sets), and SLH-DSA (all 12 FIPS 205 parameter
  sets, RFC 9909 OIDs). The stored-PublicKey-UID path needs that key's
  real `SubjectPublicKeyInfo` on record (true for a `Register`'d key; NOT
  true for a bare `CreateKeyPair` output, whose material lives only in the
  engine) — use "Set up demo CA" (below) or a CSR to sidestep this.
- **Re-certify (§6.1.50).** Renews an existing certificate with a fresh
  validity window (`Offset` seconds from now), or re-keys it with a new
  CSR. Links `Replaced`/`Replacement` back to the original.
- **Validate (§6.1.62).** Checks a supplied/stored certificate chain:
  `Valid` only when every certificate parses, is within its validity
  window, every non-root signature verifies against its issuer, and the
  chain reaches a self-signed trust anchor present in the set. Anything
  that can't be affirmatively checked degrades to `Unknown`; anything that
  affirmatively fails is `Invalid`. **A negative result is not a KMIP
  error** — `ResultStatus` stays `Success`; only the `ValidityIndicator`
  field carries the answer.
- **NEW capability this unlocks — real PQC chains.** `rcgen`/`aws_lc_rs`
  has no ML-DSA entry in its `SignatureAlgorithm` table at all, so a
  genuinely valid, self-signed ML-DSA CSR was rejected as `Invalid CSR`
  purely because the OLD checker couldn't evaluate it — not because
  anything was wrong with it. Likewise, `ring` had no ML-DSA/SLH-DSA
  verify path, so an all-PQC certificate chain could only ever come back
  `Unknown` from Validate, never `Valid`. Both are fixed: PQC CSRs are
  now acceptable, and PQC chains now genuinely validate.
- **"Set up demo CA"** (Commands tab, Certificate Services category): a
  one-click convenience — generate a fresh keypair (`RSA-2048 | ECDSA-P256
  | ML-DSA-65 | SLH-DSA-SHA2-128f`) and self-sign it into a root CA via
  the SAME `certify::bootstrap_ca_certificate` path the native server's
  `--ca-key` bootstrap uses, then designate it. Not a KMIP wire operation
  (there's no request/response for "become a CA") — a `KmipEngine`
  convenience method (`setupDemoCa`) that reads the real SPKI straight off
  the engine, sidestepping the stored-PublicKey-UID limitation above. Try
  it: Learn walkthrough 10, or the Commands tab directly.

## 7. FAQ / pitfalls

- **"The policy allows the algorithm but the workbench says Deny."** Check
  the deny *reason* first (rule index + reason string are shown). Most
  often: a governance tag is required **at creation** (add it in Key tags),
  or the mechanism dimension fired (hash/mode/padding), or the request date
  sits past a cutoff.
- **"An algorithm is allowed by policy but Create fails at Plane 2."**
  Spec-only: the policy plane can reference algorithms the engine can't
  instantiate (LMS/XMSS/HSS/XMSS-MT, Ed25519 standalone, composites,
  FrodoKEM, McEliece). The picker marks these; the deny/allow verdict is
  still meaningful.
- **A rule you wrote "doesn't fire."** Run strict validation. If it names an
  algorithm the vocabulary doesn't know, strict lint flags it; if it names a
  hash/padding as an algorithm (§2.4), rewrite it as a mechanism rule.
- **Editing policies in the browser doesn't persist.** The YAML drawer
  applies to the in-browser engine only. Durable changes go through
  `pqctoday-hsm/kmip/policies/` + the staging script.

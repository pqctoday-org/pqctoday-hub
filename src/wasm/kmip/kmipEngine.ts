// SPDX-License-Identifier: GPL-3.0-only
//
// kmipEngine.ts — thin async wrapper around the in-browser crypto-agile KMIP 3.0
// control plane (pqctoday-kmip-wasm: the pqctoday-kmip library core bundled with
// the softhsmrustv3 PKCS#11 engine, compiled to WebAssembly).
//
// The wasm module exposes a single `KmipPlayground` class plus a free
// `decode_ttlv`. We dynamically import the wasm-bindgen *bundler* shim (Vite's
// vite-plugin-wasm + top-level-await handle the .wasm instantiation, exactly as
// for the standalone softhsmrustv3 engine) and keep ONE instance per tab.
//
// Calls are synchronous wasm invocations (ML-DSA/ML-KEM keygen + sign run in a
// few ms); the loader is the only async surface. A Web-Worker offload can wrap
// this later without changing call sites.

/** A decoded TTLV node — the "wire view" tree. */
export interface TtlvNode {
  tag: string // raw 0x42xxxx codepoint hex
  type: string // Structure | Integer | Enumeration | TextString | ByteString | …
  value?: string | number | boolean
  children?: TtlvNode[]
}

/** One cross-plane audit event (serde-serialized from the Rust ring). */
export interface AuditEvent {
  ts: string
  plane: 'p1' | 'p2' | 'p3'
  correlation_id: string
  event: { type?: string; [k: string]: unknown }
}

/** The rich result of a high-level `run_op` call. `Skip` is synthesized
 * entirely client-side (never returned by the wasm engine) for an algorithm
 * `kmipMeta.isRunnable` marks non-runnable — a policy may still reference it,
 * but no lifecycle op is even attempted, so it must read as distinct from
 * `OperationFailed` (a real request the engine refused). */
export interface OpResult {
  ok: boolean
  operation: string | null
  status: 'Success' | 'OperationFailed' | 'OperationPending' | 'OperationUndone' | 'Error' | 'Skip'
  resultReason: number | null
  message: string | null
  summary: Record<string, unknown>
  responseWireHex: string
  responseWireLen: number
  responseTree: TtlvNode
  audit: AuditEvent[]
}

export interface PolicyStatus {
  active: boolean
  name?: string
  fingerprint?: string
  source?: string
  rules?: number
}

export interface LoadPolicyResult {
  ok: boolean
  warnings?: string[]
  error?: string
}

/** Modular-policy plan (2026-08-28) — one scoped module file activated
 * alongside others (see {@link KmipEngine.activatePolicyModule}). */
export interface PolicyModuleInfo {
  name: string
  fingerprint: string
  scopes: string[]
  rules: number
  enabled: boolean
}

export interface PolicyModulesStatus {
  modules: PolicyModuleInfo[]
  uncoveredOps: 'deny' | 'allow'
}

/** Shape shared by every module-management call that just reports success. */
export interface OkResult {
  ok: boolean
  error?: string
}

/** Result of {@link KmipEngine.rawPkcs11EncryptProbe} — a raw, KMIP/CACP-bypassing
 * PKCS#11 Encrypt attempt against a KMIP-created key's own engine object. */
export interface RawPkcs11EncryptProbeResult {
  blocked: boolean
  mechanism: string
  message: string
  rv?: string
  rvName?: string
  ciphertextLen?: number
  error?: string
}

/** Result of {@link KmipEngine.registerCertificateDemo}. */
export interface RegisterCertificateResult {
  ok: boolean
  uid?: string
  error?: string
}

/** Result of {@link KmipEngine.engineCertificateAttributes} — the REAL engine-side
 * PKCS#11 attributes of a projected `CKO_CERTIFICATE` object (not the KMIP store record). */
export interface EngineCertificateAttributes {
  ckaId?: string
  ckaValueLen?: number
  ckaSubjectDerLen?: number
  ckaIssuerDerLen?: number
  ckaSerialNumberHex?: string
  subjectCn?: string | null
  error?: string
}

export interface KmipObject {
  uid: string
  objectType: string
  algorithm: string
  length: number
  state: string
  name: string | null
  usageMask: number
  quantumSafe: boolean | null
  /** On a superseded (Deactivated) key, the UID of the replacement it was
   * rekeyed to (KMIP `x-pqctoday-supersedes`). `null` if never rekeyed. */
  supersedes?: string | null
}

/** A KMIP op spec the UI builds from friendly controls. */
export interface OpSpec {
  op:
    | 'Query'
    | 'Create'
    | 'CreateKeyPair'
    | 'Activate'
    | 'Sign'
    | 'SignatureVerify'
    | 'Encapsulate'
    | 'Decapsulate'
    | 'Encrypt'
    | 'Decrypt'
    | 'Locate'
    | 'Get'
    | 'Revoke'
    | 'Destroy'
  /** Omit `algorithm` and pass an `intent` to let the active policy choose the
   * algorithm (the agility path: flip policy → same op, different algorithm). */
  intent?: 'sign' | 'kem' | 'encrypt'
  algorithm?: string
  length?: number
  /** KMIP `Name` to attach at Create/CreateKeyPair — the Migration estate's
   * label-only contract: with `name_pattern` rules in the active policy, the
   * label alone decides the algorithm. Ignored by non-creation ops. */
  name?: string
  uid?: string
  text?: string
  data?: string // hex
  signature?: string // hex
  /** Encrypt/Decrypt IV, hex — the engine doesn't auto-generate one for a
   * plain `Create`d symmetric key, so the caller carries it from Encrypt's
   * `ivHex` response back into Decrypt's `ivHex` request. */
  ivHex?: string
  /** Custom x-attributes to attach at Create/CreateKeyPair ({name: value},
   * `x-` prefix optional). Governance-tagged policies (CNSA classification,
   * BSI hybrid-partner, 2030 purpose) require these at key creation — they
   * were previously dry-run-only, which made those policies unusable from
   * the workbench (2026-07-04). Ignored by non-creation ops. */
  attrs?: Record<string, string>
}

/** The ID-Placeholder sentinel (KMIP 3.0 §6.1 preamble). Use it as a batch item's `uid`
 * to reference the object the previous UID-producing item created — e.g.
 * CreateKeyPair → Activate(`$IDPlaceholder`) → Sign(`$IDPlaceholder`). The engine
 * substitutes the live UID before each item runs. */
export const ID_PLACEHOLDER = '$IDPlaceholder'

/** KMIP 3.0 §9.5 Batch Error Continuation Option: how a batch handles a failed
 * item. `Continue` runs every item; `Stop` halts after the first failure (later
 * items are not run/returned); `Undo` halts AND rolls back earlier successes
 * (reported as `OperationUndone`). Absent ≡ `Stop`. */
export type BatchErrorContinuation = 'Stop' | 'Continue' | 'Undo'

/** KMIP 3.0 §8.1.2 Asynchronous Indicator — one header-level setting for the
 * WHOLE batch (no per-item async flag exists on the wire). `Mandatory` queues
 * every async-eligible item as a real background job (`OperationPending` + a
 * correlation value each); an ineligible item (Poll/Cancel/Process/
 * QueryAsynchronousRequests/Query/DiscoverVersions/Ping) fails just that item
 * with `OperationNotSupported`. */
export type BatchAsynchronousIndicator = 'Mandatory' | 'Optional' | 'Prohibited'

/** A batch request: an ordered list of op specs run as ONE KMIP request. */
export interface BatchSpec {
  errorContinuation?: BatchErrorContinuation
  asynchronous?: BatchAsynchronousIndicator
  items: OpSpec[]
}

/** One batch item's result — a `run_op` result minus the wire (the wire is the
 * single shared Response Message on the parent [`BatchResult`]). */
export interface BatchItemResult {
  ok: boolean
  operation: string | null
  status: OpResult['status']
  resultReason: number | null
  message: string | null
  summary: Record<string, unknown>
  /** §9.1 claim ticket — set only when `status === 'OperationPending'`. Feed
   * it to a follow-up Poll/Cancel/Process request to redeem the job. */
  asynchronousCorrelationValueHex: string | null
}

/** The result of a `runBatch` call: per-item results + the one shared wire. */
export interface BatchResult {
  ok: boolean
  errorContinuation: BatchErrorContinuation
  /** Items submitted. */
  requested: number
  /** Items returned — fewer than `requested` when `Stop`/`Undo` halted the batch. */
  returned: number
  items: BatchItemResult[]
  /** The single Request Message that carried every item — the actual "N
   * operations, ONE request" proof (A-grade review C7). */
  requestWireHex: string
  requestWireLen: number
  responseWireHex: string
  responseWireLen: number
  responseTree: TtlvNode
  audit: AuditEvent[]
}

/** The Plane-1 decision the engine reached for an op, extracted from its audit. */
export interface PolicyDecision {
  kind: 'Allow' | 'Deny' | 'Rekey' | 'Unknown'
  /** Algorithm the policy resolved/substituted to, if any. */
  algorithm?: string
}

const readDecision = (e: AuditEvent): PolicyDecision => {
  const outcome = (e.event.outcome ?? {}) as {
    type?: string
    algorithm_override?: string
    new_algorithm?: string
  }
  const kind = (outcome.type as PolicyDecision['kind']) ?? 'Unknown'
  return { kind, algorithm: outcome.algorithm_override ?? outcome.new_algorithm }
}

/** Pull the Plane-1 policy decision out of an op result's audit events. */
export const decisionOf = (r: OpResult): PolicyDecision => {
  const p1 = r.audit.find((e) => e.plane === 'p1' && e.event.type === 'PolicyDecided')
  return p1 ? readDecision(p1) : { kind: 'Unknown' }
}

/** The MOST significant policy decision across a batch's audit (Deny > Rekey >
 * Allow). A single batch can hold several `PolicyDecided` events — e.g. a
 * lifecycle where Create is allowed but a later Sign triggers rekey-on-use — and
 * the headline outcome is the strongest of them. */
const DECISION_RANK: Record<PolicyDecision['kind'], number> = {
  Deny: 3,
  Rekey: 2,
  Allow: 1,
  Unknown: 0,
}
export const strongestDecision = (audit: AuditEvent[]): PolicyDecision => {
  let best: PolicyDecision = { kind: 'Unknown' }
  for (const e of audit) {
    if (e.plane !== 'p1' || e.event.type !== 'PolicyDecided') continue
    const cand = readDecision(e)
    if (DECISION_RANK[cand.kind] > DECISION_RANK[best.kind]) best = cand
  }
  return best
}

/** What the active policy WOULD decide for an op (no execution). */
/** One per-rule step of the engine's actual evaluation (1-based `index`). */
export interface DryRunTraceStep {
  index: number
  /** 'resolve' | 'deny' | 'pass' | 'skip' */
  effect: string
  note: string
}

/** Mechanism parameters a `mechanism_parameter_default` rule forced onto the
 * request (C4, 2026-08-28 gaps-remediation plan) — every field is `null`
 * unless a forcing rule actually set it. Names are already resolved from the
 * raw KMIP codepoint, not the codepoint itself. */
export interface CpOverrideResult {
  hashingAlgorithm: string | null
  blockCipherMode: string | null
  paddingMethod: string | null
  deterministic: boolean | null
  tagLength: number | null
  saltLength: number | null
}

export interface DryRunResult {
  kind: 'Allow' | 'Deny' | 'Rekey'
  algorithm?: string | null
  from?: string
  to?: string
  rule?: number | null
  reason?: string
  denyReason?: string
  /** Per-rule engine trace — drives the visual simulator's node highlighting. */
  trace?: DryRunTraceStep[]
  /** Set only on an `Allow` a forcing rule touched — was silently dropped
   * before C4, so a mechanism-forcing rule's rewrite was invisible here. */
  cpOverride?: CpOverrideResult | null
}

/** One value-level lint finding (C3, 2026-08-28 gaps-remediation plan) —
 * mirrors the Rust engine's `policy::lint::Finding` exactly. `ruleIndex` is
 * 1-based, matching policy file line order and `Decision::Deny`'s own
 * `fired_rule_index` convention. */
export interface PolicyLintFinding {
  ruleIndex: number
  field: string
  value: string
  fatal: boolean
  message: string
}

export interface PolicyLintResult {
  ok: boolean
  findings?: PolicyLintFinding[]
  /** Set only when `ok:false` — a structural failure, not a rule-level one. */
  error?: string
}

export interface DryRunSpec {
  op: string
  algorithm?: string
  currentAlgorithm?: string
  length?: number
  state?: string
  /** Key label — drives `name_pattern` rules (label-only agility: the
   * Migration estate's policies map business key names to algorithms). */
  name?: string
  /** Simulated request date (YYYY-MM-DD) — drives temporal rules (WP4b).
   * Absent → the engine evaluates at "now". */
  date?: string
  /** Custom x-attributes ({name: value}, x- prefix optional) — drives
   * require_custom_attribute and denylist/trigger exceptions. */
  attrs?: Record<string, string>
  /** Usage-mask flag names (Sign, Verify, …). Absent → None, so
   * require_usage_mask fails closed exactly like an undeclared Create. */
  usageMask?: string[]
  /** Activation date of the targeted key (YYYY-MM-DD) — drives
   * max_key_age_days. */
  activationDate?: string
  /** Mechanism dimension; names resolve through the engine's own tables. */
  mechanism?: {
    hash?: string
    blockMode?: string
    padding?: string
    deterministic?: boolean
    mech?: string
  }
}

interface WasmKmipPlayground {
  run_op(specJson: string): string
  run_batch(specJson: string): string
  submit(ttlv: Uint8Array): Uint8Array
  load_policy(yaml: string): string
  policy_status(): string
  release_legacy_policy(): void
  activate_policy_module(yaml: string): string
  deactivate_policy_module(name: string): string
  set_policy_module_enabled(name: string, enabled: boolean): string
  clear_policy_modules(): void
  policy_modules_status(): string
  set_uncovered_ops(mode: string): string
  lint_policy_draft(yaml: string): string
  dry_run(specJson: string): string
  list_objects(): string
  audit_snapshot(limit: number): string
  clear_audit(): void
  setup_demo_ca(algorithm: string, subjectCn: string): string
  raw_pkcs11_encrypt_probe(public_key_uid: string): string
  register_certificate_demo(linked_public_key_uid: string, cert_der_hex: string): string
  engine_certificate_attributes(certificate_uid: string): string
}

/** `KmipEngine.setupDemoCa`'s result. Mirrors the wasm binding's
 * `{ ok: true, privateKeyUid, certificateUid, certificateDerHex, algorithm }`
 * / `{ ok: false, error }` shape exactly — no reshaping in this layer. */
export interface SetupDemoCaResult {
  ok: boolean
  privateKeyUid?: string
  certificateUid?: string
  certificateDerHex?: string
  algorithm?: string
  error?: string
}

/** The server's §6.1.57 RNG Seed policy choice — server-chosen and mutually
 * exclusive per the spec (a constructor-time config, not per-request). The
 * OASIS CS-RNG-O-1..4 optional-profile tests each pin one of these. */
export type RngSeedMode = 'full-consume' | 'partial-consume' | 'ignore' | 'deny'

interface WasmModule {
  KmipPlayground: { new (slot?: number, rngSeedMode?: RngSeedMode): WasmKmipPlayground }
  decode_ttlv(bytes: Uint8Array): string
  encode_ttlv(treeJson: string): Uint8Array
}

/** Async, JSON-friendly facade over the wasm `KmipPlayground`. */
export class KmipEngine {
  private readonly pg: WasmKmipPlayground
  private readonly mod: WasmModule
  /** Modular-policy plan — the engine itself has no notion of a "preset"
   * (only individual scoped modules), so the label a multi-file preset
   * activated under is tracked here purely for {@link policyStatus} to
   * report a `name` the UI's `isActive`/catalog-highlight checks recognise.
   * Cleared whenever a legacy {@link loadPolicy} policy is loaded or the
   * modules are cleared. */
  private activeModulePreset: string | null = null

  private constructor(pg: WasmKmipPlayground, mod: WasmModule) {
    this.pg = pg
    this.mod = mod
  }

  /** `slot` — which PKCS#11 slot to bootstrap the engine token on. Omit for
   * the single-tab default (slot 0); pass a distinct value per instance
   * when booting more than one `KmipEngine` in the same page load (e.g.
   * the OASIS corpus replay, one engine per test) — the engine's token
   * storage is keyed by slot, and reusing one with a still-open session
   * from an earlier instance fails bootstrap.
   *
   * `rngSeedMode` — pin the server's §6.1.57 RNG Seed behavior for this
   * engine (default full-consume). The corpus replay uses it to boot each
   * CS-RNG-O variant test on an engine configured the way that test
   * expects, mirroring the native harness's per-test Deps. */
  static async boot(slot?: number, rngSeedMode?: RngSeedMode): Promise<KmipEngine> {
    // Bundler-target shim; Vite instantiates the .wasm at import time.
    const mod = (await import('./pqctoday_kmip_wasm.js')) as unknown as WasmModule
    return new KmipEngine(new mod.KmipPlayground(slot, rngSeedMode), mod)
  }

  /** Build a real KMIP request, dispatch it, and return the rich result. */
  runOp(spec: OpSpec): OpResult {
    return JSON.parse(this.pg.run_op(JSON.stringify(spec))) as OpResult
  }

  /** Build ONE KMIP request carrying every item in `spec` and dispatch it as a
   * real on-the-wire batch (not N separate requests). Returns per-item results
   * plus the single shared Response Message. */
  runBatch(spec: BatchSpec): BatchResult {
    return JSON.parse(this.pg.run_batch(JSON.stringify(spec))) as BatchResult
  }

  /** Raw wire entry: TTLV bytes in → TTLV bytes out. */
  submit(ttlv: Uint8Array): Uint8Array {
    return this.pg.submit(ttlv)
  }

  /** Certificate Services "Set up demo CA": generate a fresh keypair,
   * self-sign it into a CA certificate via the SAME production
   * `certify::bootstrap_ca_certificate` path the native server's
   * `--ca-key` bootstrap uses, and designate it so subsequent Certify /
   * Re-certify calls have a signer. `algorithm` ∈ `RSA-2048 | ECDSA-P256 |
   * ML-DSA-65 | SLH-DSA-SHA2-128f`. Safe to call more than once (e.g. to
   * try a different algorithm) — each call mints a fresh, independently
   * UID'd CA and re-designates it as the active one. */
  setupDemoCa(algorithm: string, subjectCn = ''): SetupDemoCaResult {
    return JSON.parse(this.pg.setup_demo_ca(algorithm, subjectCn)) as SetupDemoCaResult
  }

  /** Activate a crypto-agility policy from YAML (Plane 1) — replaces
   * whatever else is active (legacy policy AND any modules). */
  loadPolicy(yaml: string): LoadPolicyResult {
    const res = JSON.parse(this.pg.load_policy(yaml)) as LoadPolicyResult
    if (res.ok) this.activeModulePreset = null
    return res
  }

  /** The currently-active policy, `{ active: false }` if none. Transparently
   * reports a multi-file modular preset too — see {@link activateModulePreset}
   * — synthesizing the same shape a legacy {@link loadPolicy} policy reports
   * (`name` = the preset name every module was activated under; `fingerprint`/
   * `source` = every module's fingerprint/name joined; `rules` = summed). */
  policyStatus(): PolicyStatus {
    const legacy = JSON.parse(this.pg.policy_status()) as PolicyStatus
    if (legacy.active || !this.activeModulePreset) return legacy
    const { modules } = this.policyModulesStatus()
    if (modules.length === 0) {
      this.activeModulePreset = null
      return legacy
    }
    return {
      active: true,
      name: this.activeModulePreset,
      fingerprint: modules.map((m) => m.fingerprint).join('+'),
      source: modules.map((m) => m.name).join('+'),
      rules: modules.reduce((sum, m) => sum + m.rules, 0),
    }
  }

  /** Release the legacy single-policy slot without loading a replacement —
   * needed before {@link activatePolicyModule} the first time (the
   * playground boots with a legacy permissive policy active). */
  releaseLegacyPolicy(): void {
    this.pg.release_legacy_policy()
  }

  /** Modular-policy plan — activate ONE scoped module (e.g. one file from a
   * policy split into `-signing`/`-key-establishment`/`-encryption`/
   * `-global`) alongside whatever else is already active, instead of
   * replacing the whole engine state like {@link loadPolicy}. Prefer
   * {@link activateModulePreset} for loading a whole preset's file set. */
  activatePolicyModule(yaml: string): LoadPolicyResult {
    return JSON.parse(this.pg.activate_policy_module(yaml)) as LoadPolicyResult
  }

  /** Deactivate one named module. `ok:false` means no module by that name
   * was active. */
  deactivatePolicyModule(name: string): OkResult {
    return JSON.parse(this.pg.deactivate_policy_module(name)) as OkResult
  }

  /** Enable/disable one active module without unloading it — a disabled
   * module's rules are skipped during evaluation but its scope stays
   * claimed. `ok:false` means no module by that name was active. */
  setPolicyModuleEnabled(name: string, enabled: boolean): OkResult {
    return JSON.parse(this.pg.set_policy_module_enabled(name, enabled)) as OkResult
  }

  /** Deactivate every module (does not touch a legacy {@link loadPolicy}
   * policy). Call before activating a different multi-file preset — or just
   * use {@link activateModulePreset}, which does this for you. */
  clearPolicyModules(): void {
    this.pg.clear_policy_modules()
    this.activeModulePreset = null
  }

  /** Every currently-active module plus the uncovered-ops fallback mode. */
  policyModulesStatus(): PolicyModulesStatus {
    return JSON.parse(this.pg.policy_modules_status()) as PolicyModulesStatus
  }

  /** What the engine does with a request whose op no active module's scope
   * covers (modular mode only) — `'deny'` (fail closed, the default) or
   * `'allow'` (fail open; playground/incremental adoption only). */
  setUncoveredOps(mode: 'deny' | 'allow'): OkResult {
    return JSON.parse(this.pg.set_uncovered_ops(mode)) as OkResult
  }

  /** Swap in a whole multi-file preset atomically: releases the legacy slot,
   * clears any previously-active modules, then activates every YAML in
   * `yamls` (already-fetched file contents, in any order — scopes don't
   * overlap within one preset) as a module. On the first failure, the
   * modules already activated in this call are torn back down (so a bad
   * preset can't leave a half-activated mix behind) and `{ ok: false,
   * error }` is returned without touching {@link policyStatus}'s preset
   * label. Warnings from every file are concatenated. */
  activateModulePreset(name: string, yamls: string[]): LoadPolicyResult {
    this.releaseLegacyPolicy()
    this.clearPolicyModules()
    const warnings: string[] = []
    for (const yaml of yamls) {
      const res = this.activatePolicyModule(yaml)
      if (!res.ok) {
        this.clearPolicyModules()
        return { ok: false, error: res.error }
      }
      if (res.warnings) warnings.push(...res.warnings)
    }
    this.activeModulePreset = name
    return { ok: true, warnings }
  }

  /** Evaluate what the active policy would decide — without executing anything. */
  dryRun(spec: DryRunSpec): DryRunResult {
    return JSON.parse(this.pg.dry_run(JSON.stringify(spec))) as DryRunResult
  }

  /** C3 (2026-08-28 gaps-remediation plan) — every value-level lint finding
   * for a draft, fatal and advisory alike, unlike `loadPolicy`'s `ok:false`
   * which reports only the first fatal one. `ok:false` here means a
   * STRUCTURAL failure (bad YAML, unknown top-level field, bad schema
   * version) — the visual editor's own generator never produces one. */
  lintPolicyDraft(yaml: string): PolicyLintResult {
    return JSON.parse(this.pg.lint_policy_draft(yaml)) as PolicyLintResult
  }

  listObjects(): KmipObject[] {
    return JSON.parse(this.pg.list_objects()) as KmipObject[]
  }

  auditSnapshot(limit = 200): AuditEvent[] {
    return JSON.parse(this.pg.audit_snapshot(limit)) as AuditEvent[]
  }

  clearAudit(): void {
    this.pg.clear_audit()
  }

  /** WP-4 showcase — bypass the KMIP dispatcher and CACP policy plane
   * entirely, calling straight into the engine's native PKCS#11 Encrypt
   * path against `publicKeyUid`'s own engine object with `CKM_RSA_PKCS_OAEP`.
   * Demonstrates that PKCS#11 v3.2 §4.8 Table 13 (`CKA_ALLOWED_MECHANISMS`)
   * — derived from the key's `CryptographicUsageMask` at `CreateKeyPair`
   * time — is enforced by the engine itself, not just by KMIP/CACP policy,
   * which this call never touches. Only meaningful against an RSA public
   * key; other algorithms/object types return an `error`. */
  rawPkcs11EncryptProbe(publicKeyUid: string): RawPkcs11EncryptProbeResult {
    return JSON.parse(this.pg.raw_pkcs11_encrypt_probe(publicKeyUid)) as RawPkcs11EncryptProbeResult
  }

  /** WP-3 showcase — register a caller-supplied X.509 certificate (DER,
   * hex-encoded) linked to an existing KMIP public key, projecting it onto
   * the engine as a real `CKO_CERTIFICATE` object sharing that key's
   * `CKA_ID`. Native CA issuance (`Certify`) isn't reachable in wasm, so
   * this exercises `Register`'s wasm-reachable certificate projection on a
   * certificate the caller already holds — the strongSwan cert-to-key
   * pattern, not a full in-browser CA workflow. */
  registerCertificateDemo(
    linkedPublicKeyUid: string,
    certDerHex: string
  ): RegisterCertificateResult {
    return JSON.parse(
      this.pg.register_certificate_demo(linkedPublicKeyUid, certDerHex)
    ) as RegisterCertificateResult
  }

  /** WP-3 showcase — read back a Certificate object's real engine-side
   * PKCS#11 attributes (CKA_ID, CKA_VALUE, CKA_SUBJECT, CKA_ISSUER,
   * CKA_SERIAL_NUMBER) by its KMIP uid. */
  engineCertificateAttributes(certificateUid: string): EngineCertificateAttributes {
    return JSON.parse(
      this.pg.engine_certificate_attributes(certificateUid)
    ) as EngineCertificateAttributes
  }

  /** Decode any KMIP TTLV frame (request or response) to a wire-view tree. */
  decodeTtlv(bytes: Uint8Array): TtlvNode {
    return JSON.parse(this.mod.decode_ttlv(bytes)) as TtlvNode
  }

  /** Encode a wire-view tree (the same `{tag,type,value,children}` shape
   * `decodeTtlv` produces) to KMIP TTLV wire bytes — the inverse of
   * `decodeTtlv`. Lets a caller build ANY of the 66 KMIP 3.0 operations (not
   * just the ones `OpSpec`/`runOp` cover) and hand the bytes to `submit`.
   * Throws (a thrown `JsError` from the wasm side) on a malformed tree. */
  encodeTtlv(tree: TtlvNode): Uint8Array {
    return this.mod.encode_ttlv(JSON.stringify(tree))
  }
}

// ── Per-tab singleton ────────────────────────────────────────────────────────
let enginePromise: Promise<KmipEngine> | null = null

/** Get (booting on first call) the shared in-browser KMIP control plane. */
export const getKmipEngine = (): Promise<KmipEngine> => {
  if (!enginePromise) {
    enginePromise = KmipEngine.boot().catch((e) => {
      enginePromise = null
      throw e
    })
  }
  return enginePromise
}

export const hexToBytes = (hex: string): Uint8Array =>
  Uint8Array.from((hex.match(/../g) ?? []).map((h) => parseInt(h, 16)))

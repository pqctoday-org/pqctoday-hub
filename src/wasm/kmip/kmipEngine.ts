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

/** The rich result of a high-level `run_op` call. */
export interface OpResult {
  ok: boolean
  operation: string | null
  status: 'Success' | 'OperationFailed' | 'OperationPending' | 'OperationUndone' | 'Error'
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

export interface KmipObject {
  uid: string
  objectType: string
  algorithm: string
  length: number
  state: string
  name: string | null
  usageMask: number
  quantumSafe: boolean | null
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
  uid?: string
  text?: string
  data?: string // hex
  signature?: string // hex
}

/** The ID-Placeholder sentinel (KMIP 3.0 §6.4). Use it as a batch item's `uid`
 * to reference the object the previous UID-producing item created — e.g.
 * CreateKeyPair → Activate(`$IDPlaceholder`) → Sign(`$IDPlaceholder`). The engine
 * substitutes the live UID before each item runs. */
export const ID_PLACEHOLDER = '$IDPlaceholder'

/** KMIP 3.0 §9.5 Batch Error Continuation Option: how a batch handles a failed
 * item. `Continue` runs every item; `Stop` halts after the first failure (later
 * items are not run/returned); `Undo` halts AND rolls back earlier successes
 * (reported as `OperationUndone`). Absent ≡ `Stop`. */
export type BatchErrorContinuation = 'Stop' | 'Continue' | 'Undo'

/** A batch request: an ordered list of op specs run as ONE KMIP request. */
export interface BatchSpec {
  errorContinuation?: BatchErrorContinuation
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
}

export interface DryRunSpec {
  op: string
  algorithm?: string
  currentAlgorithm?: string
  length?: number
  state?: string
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
  dry_run(specJson: string): string
  list_objects(): string
  audit_snapshot(limit: number): string
  clear_audit(): void
}

interface WasmModule {
  KmipPlayground: { new (): WasmKmipPlayground }
  decode_ttlv(bytes: Uint8Array): string
}

/** Async, JSON-friendly facade over the wasm `KmipPlayground`. */
export class KmipEngine {
  private readonly pg: WasmKmipPlayground
  private readonly mod: WasmModule

  private constructor(pg: WasmKmipPlayground, mod: WasmModule) {
    this.pg = pg
    this.mod = mod
  }

  static async boot(): Promise<KmipEngine> {
    // Bundler-target shim; Vite instantiates the .wasm at import time.
    const mod = (await import('./pqctoday_kmip_wasm.js')) as unknown as WasmModule
    return new KmipEngine(new mod.KmipPlayground(), mod)
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

  /** Activate a crypto-agility policy from YAML (Plane 1). */
  loadPolicy(yaml: string): LoadPolicyResult {
    return JSON.parse(this.pg.load_policy(yaml)) as LoadPolicyResult
  }

  policyStatus(): PolicyStatus {
    return JSON.parse(this.pg.policy_status()) as PolicyStatus
  }

  /** Evaluate what the active policy would decide — without executing anything. */
  dryRun(spec: DryRunSpec): DryRunResult {
    return JSON.parse(this.pg.dry_run(JSON.stringify(spec))) as DryRunResult
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

  /** Decode any KMIP TTLV frame (request or response) to a wire-view tree. */
  decodeTtlv(bytes: Uint8Array): TtlvNode {
    return JSON.parse(this.mod.decode_ttlv(bytes)) as TtlvNode
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

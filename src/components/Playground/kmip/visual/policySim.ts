// SPDX-License-Identifier: GPL-3.0-only
//
// policySim.ts — an ILLUSTRATIVE client-side re-implementation of the policy
// engine's precedence walk, used ONLY to drive the graph visualisation (which
// node matched, the flow path, the animated token). The AUTHORITATIVE verdict
// always comes from the WASM engine's `dryRun` — this trace is self-checked
// against it and flagged "approximated" on divergence. When the engine grows a
// per-rule trace (implementation plan WP4b), this is replaced behind the same
// TraceStep interface.
//
// Fidelity contract: every rule type either evaluates with the SAME semantics
// as the Rust engine (`pqctoday-hsm/kmip/src/policy/rule.rs::check_pass2`) or
// emits an explicit 'skip' note naming the missing input. Silent fall-through
// to ALLOW is forbidden — that is exactly the drift this file used to have.
import type { EditableRule, EditablePolicy } from './policyEditModel'

export interface SimRequest {
  op: string
  algorithm: string
  /** Key label (KMIP `Name`) — drives `name_pattern` rules: the Migration
   * estate's label-only contract, where the request carries only a business
   * key name and the policy resolves every crypto parameter from it. */
  keyName: string
  keyState: string
  bits: string
  date: string
  /** Custom x-attributes, each "name" or "name=value" (x- prefix optional). */
  attrs: string[]
  /** Usage-mask flags on the key (Sign, Verify, KeyAgreement, …). */
  usageFlags: string[]
  /** Mechanism dimension (hash / mode / padding / CKM / deterministic). */
  hash: string
  blockMode: string
  padding: string
  mechanism: string
  deterministic: '' | 'true' | 'false'
  /** Activation date of the targeted key — drives max_key_age_days. */
  keyActivatedOn: string
}

export type SimVerdictKind = 'allow' | 'rekey' | 'deny'

export interface SimVerdict {
  kind: SimVerdictKind
  algorithm?: string
  from?: string
  to?: string
  reason?: string
}

export interface TraceStep {
  ruleId: string
  matched: boolean
  effect: 'pass' | 'deny' | 'resolve' | 'skip' | 'off'
  note: string
}

export interface SimResult {
  verdict: SimVerdict
  trace: TraceStep[]
  /** id of the rule that produced the terminal decision (for highlight). */
  deciderId: string | null
}

const lc = (s: string): string => (s || '').toLowerCase()

/** rule.rs::is_ml_dsa_composite_tail — the classical half of an
 * `ML-DSA-<level>-<tail>` LAMPS composite name. Mirrors the Rust tail set
 * exactly (A6.1, 2026-08-28 gaps-remediation plan) so this simulator's
 * composite exclusion below can't drift from the engine's. */
const isMlDsaCompositeTail = (tail: string): boolean =>
  [
    'ED25519',
    'ED448',
    'ECDSA-P256',
    'ECDSA-P384',
    'ECDSA-P521',
    'RSA2048-PSS',
    'RSA3072-PSS',
    'RSA4096-PSS',
  ].includes(tail.toUpperCase())

/** rule.rs::is_composite_algorithm_name — `true` for `ML-DSA-<level>-<tail>`.
 * ML-DSA-specific, not a generic "any two known halves" check — every real
 * composite this engine can produce is `CompositeMlDsa*`; see the Rust
 * function's doc comment for why the generic version was tried and
 * rejected (it missed RSA-PSS tails and flagged `ECDSA-SHA1`). */
const isCompositeAlgorithmName = (name: string): boolean => {
  const m = /^ML-DSA-(\d+)-(.+)$/i.exec(name)
  if (!m) return false
  return ['44', '65', '87'].includes(m[1]) && isMlDsaCompositeTail(m[2])
}

/** rule.rs::algo_matches (Y3) — a policy entry covers a request algorithm when
 * it equals it or is a family prefix of a hyphen-suffixed member (`AES` covers
 * `AES-256`; `AES-128` never covers `AES-256`) THAT IS NOT ITSELF A COMPOSITE
 * (A6.1, 2026-08-28) — a composite is matched/denied only by its own full name. */
const algoMatches = (policyEntry: string, requestAlgo: string): boolean => {
  const e = lc(policyEntry)
  const a = lc(requestAlgo)
  if (!e) return false
  if (e === a) return true
  if (isCompositeAlgorithmName(requestAlgo)) return false
  return a.startsWith(`${e}-`)
}
const inAlgoList = (list: string[] | undefined, a: string): boolean =>
  (list ?? []).some((x) => algoMatches(x, a))
const inNameList = (list: string[] | undefined, a: string): boolean =>
  (list ?? []).some((x) => lc(x) === lc(a))

/** rule.rs::matches_class — three-way pqc / symmetric / classical. Symmetric
 * primitives are quantum-safe and must NOT be swept up by a `classical`
 * cutoff; unknown names fall to classical (fail-closed for cutoffs). */
const isPqc = (a: string): boolean =>
  /^(ML-KEM|ML-DSA|SLH-DSA|HSS|LMS|XMSS|Falcon|HQC|BIKE|FrodoKEM|Classic-McEliece)/i.test(a) ||
  // composite names carry a PQC primary; hybrid KEMs spell it without the
  // hyphen (X25519MLKEM768) — rule.rs matches_class, 2026-07-04 parity.
  /ML-DSA|ML-KEM|MLKEM/i.test(a)
const isSymmetric = (a: string): boolean => /^(AES|ChaCha20|HMAC|KMAC|SHA)/i.test(a) && !isPqc(a)
const matchesClass = (algo: string, cls: string | undefined): boolean => {
  if (!cls) return true // no class on the rule → class dimension unconstrained
  if (cls === 'pqc') return isPqc(algo)
  if (cls === 'symmetric') return isSymmetric(algo)
  if (cls === 'classical') return !isPqc(algo) && !isSymmetric(algo)
  return false
}

/** rule.rs::op_matches (Y2) — exact, or the request op is a colon-suffixed
 * refinement of the rule op (`CreateKeyPair` matches `CreateKeyPair:Sign`;
 * `Create` does NOT match `CreateKeyPair:Sign`). */
const opMatch1 = (ruleOp: string, reqOp: string): boolean =>
  ruleOp === reqOp || reqOp.startsWith(`${ruleOp}:`)
const opMatches = (ruleOps: string[], reqOp: string): boolean => {
  if (!ruleOps.length) return true
  return ruleOps.some((o) => opMatch1(o, reqOp))
}

const opsOf = (r: EditableRule): string[] =>
  r.lists.ops ?? r.lists.ops_affected ?? (r.scalars.op ? [r.scalars.op] : [])

/** rule.rs::name_pattern_matches — case-insensitive glob (`*` = any run
 * including empty, `?` = any single char, everything else literal). A rule
 * WITH a pattern only fires when the request HAS a name that matches — an
 * unnamed request never satisfies a patterned rule. */
export const namePatternMatches = (pattern: string, name: string): boolean => {
  if (!name) return false
  const glob = (p: string, s: string): boolean => {
    if (p === '') return s === ''
    if (p[0] === '*') return glob(p.slice(1), s) || (s !== '' && glob(p, s.slice(1)))
    if (s === '') return false
    if (p[0] === '?' || lc(p[0]) === lc(s[0])) return glob(p.slice(1), s.slice(1))
    return false
  }
  return glob(pattern, name)
}

/** `true` when this resolution rule carries a `name_pattern` and the request
 * satisfies it; `false` when it carries one the request doesn't satisfy;
 * `null` when the rule has no pattern at all (unconstrained). */
const namePatternGate = (r: EditableRule, keyName: string): boolean | null => {
  const pattern = r.scalars.name_pattern
  if (!pattern) return null
  return namePatternMatches(pattern, keyName)
}

/** rule.rs::DEFAULT_PROVENANCE_OPS + scoped_op_matches (2026-07-04): the
 * require_* provenance rules gate the creation/ingress surface when the
 * policy writes no `ops:` — never the use ops policies leave open. */
const DEFAULT_PROVENANCE_OPS = ['Create', 'CreateKeyPair', 'Register', 'Import']
const scopedOpMatches = (ruleOps: string[] | undefined, reqOp: string): boolean =>
  (ruleOps?.length ? ruleOps : DEFAULT_PROVENANCE_OPS).some((o) => opMatch1(o, reqOp))

const parseDate = (s: string | undefined): Date | null =>
  s && /^\d{4}-\d{2}-\d{2}/.test(s) ? new Date(s.slice(0, 10)) : null

/** rule.rs::window_active — ts within [effective_from, effective_until],
 * either bound optional. A null request date passes (nothing to compare). */
const windowActive = (r: EditableRule, reqDate: Date | null): boolean => {
  if (!reqDate) return true
  const from = parseDate(r.scalars.effective_from)
  const until = parseDate(r.scalars.effective_until)
  if (from && reqDate < from) return false
  if (until && reqDate > until) return false
  return true
}

/** engine.rs::policy_is_live (A2, 2026-08-28) — a policy outside
 * `[metadata.effective, metadata.expires]` is INERT for this request, same
 * fail-closed posture as no policy loaded at all. This simulator never
 * implemented that check at all — the exact gap `hybrid-deny-legacy-pre`
 * surfaced (SIM said Allow, engine said Deny, for a pre-`effective`-date
 * request). `parseDate` already treats any non-`YYYY-MM-DD` string
 * (`"always"`/`"immediate"`/`"never"`/empty) as an unbounded side, so this
 * reuses it directly rather than special-casing those keywords again. */
const metadataWindowActive = (policy: EditablePolicy, reqDate: Date | null): boolean => {
  if (!reqDate) return true
  const from = parseDate(policy.metadata.effective)
  const until = parseDate(policy.metadata.expires)
  if (from && reqDate < from) return false
  if (until && reqDate > until) return false
  return true
}

/** A request attr entry "name", "x-name", "name=value" → {name, value}. */
const parseAttr = (s: string): { name: string; value: string | null } => {
  const [rawName, ...rest] = s.split('=')
  const name = lc(rawName).replace(/^x-/, '')
  return { name, value: rest.length ? rest.join('=') : null }
}

/** Engine custom-attr predicate: name must be present AND value must equal
 * when the predicate carries a value. A bare request attr (no value) does not
 * satisfy a valued predicate. */
const attrPredicateMatches = (
  attrs: { name: string; value: string | null }[],
  pred: { name: string; value: string } | undefined
): boolean => {
  if (!pred) return false
  const wantName = lc(pred.name).replace(/^x-/, '')
  return attrs.some(
    (a) => a.name === wantName && (pred.value === '' || lc(a.value ?? '') === lc(pred.value))
  )
}

interface ResolvedAlgorithm {
  algorithm: string
  /** Rule ids that actually changed the running value — the winning
   * default (if any) plus every substitution that matched in the chain.
   * Drives the 'resolve' trace effect at each rule's own file position. */
  resolvedByIds: Set<string>
  /** Set only when a SUBSTITUTION changed the value (a default alone is
   * never a rekey candidate) — the LAST link in the chain if more than one
   * substitution fired. */
  rekey: { from: string; to: string } | null
}

/** Pass 0 (defaults) + Pass 1 (substitutions) as ONE independent, complete
 * resolution step, computed before any gating rule runs — mirrors
 * `engine.rs:421-456` exactly. Fixes a real divergence (2026-08-28
 * gaps-remediation plan WS-5b): the previous design resolved the algorithm
 * INLINE as the main loop reached each resolution rule, so a gating rule
 * listed BEFORE a later substitution in file order gated the
 * pre-substitution value — the engine always gates against the FULLY
 * resolved value regardless of where in the file the substitution sits. */
const resolveAlgorithm = (
  policy: EditablePolicy,
  req: SimRequest,
  winningDefaultId: string | null
): ResolvedAlgorithm => {
  let carried = req.algorithm
  const resolvedByIds = new Set<string>()

  if (winningDefaultId) {
    const r = policy.rules.find((x) => x.id === winningDefaultId)
    if (r) {
      carried = r.scalars.default_algorithm ?? carried
      resolvedByIds.add(r.id)
    }
  }

  let rekey: { from: string; to: string } | null = null
  for (const r of policy.rules) {
    if (!r.enabled || r.type !== 'algorithm_substitution') continue
    if (!opMatches(opsOf(r), req.op)) continue
    if (lc(carried) !== lc(r.scalars.from ?? '')) continue
    if (namePatternGate(r, req.keyName) === false) continue
    const to = r.scalars.to ?? carried
    rekey = { from: carried, to }
    carried = to
    resolvedByIds.add(r.id)
  }

  return { algorithm: carried, resolvedByIds, rekey }
}

/**
 * Walk the enabled rules in precedence order, mirroring the Rust engine's
 * three-pass semantics (defaults, then substitutions, THEN gating —
 * `resolveAlgorithm` above computes the first two as one independent step
 * before this function's main loop, which gates against the result;
 * corrected 2026-08-28, see `resolveAlgorithm`'s doc comment). Produces a
 * per-rule trace and a terminal verdict. Deterministic single path.
 */
export function evaluatePolicy(policy: EditablePolicy, req: SimRequest): SimResult {
  const reqDate = parseDate(req.date)

  // A2 pre-check — runs before Pass 0/1/2 even start, mirroring
  // engine.rs:390-414 exactly: an out-of-window policy is treated like no
  // policy loaded at all (empty trace, same `PolicyNotLoaded`-class deny).
  if (!metadataWindowActive(policy, reqDate)) {
    return {
      verdict: {
        kind: 'deny',
        reason: `Active policy ${JSON.stringify(policy.metadata.name)} is outside its validity window (effective: ${policy.metadata.effective || 'always'}, expires: ${policy.metadata.expires || 'never'}) for this request; denying by default.`,
      },
      trace: [],
      deciderId: null,
    }
  }

  const trace: TraceStep[] = []
  let verdict: SimVerdict | null = null
  let deciderId: string | null = null
  const attrs = req.attrs.map(parseAttr)
  const flags = req.usageFlags.map(lc)
  const bits = req.bits === '' ? null : Number(req.bits)

  // engine.rs Pass 0 two-phase defaults (most-specific-wins): NAME-PATTERNED
  // defaults are evaluated before generic ones regardless of YAML order, so a
  // `name_pattern: "payments-*"` → AES-128 rule beats the policy's generic
  // AES-256 default. Resolve the winning default rule id up front; the
  // sequential walk below then fires only that one.
  const winningDefaultId = ((): string | null => {
    if (req.algorithm) return null // defaults only fill an unspecified algorithm
    for (const patternedPhase of [true, false]) {
      for (const r of policy.rules) {
        if (!r.enabled || r.type !== 'algorithm_default') continue
        const gate = namePatternGate(r, req.keyName)
        if ((gate !== null) !== patternedPhase) continue
        if (gate === false) continue
        if (opMatches(opsOf(r), req.op)) return r.id
      }
    }
    return null
  })()

  // WS-5b: fully resolved BEFORE any gating rule runs, independent of file
  // order — see `resolveAlgorithm`'s doc comment. `carried` is a read-only
  // reference to this result for the rest of the function; only the
  // `algorithm_default`/`algorithm_substitution` cases below need to know
  // whether THEY were the one that produced it (for the trace), never to
  // mutate it themselves.
  const resolved = resolveAlgorithm(policy, req, winningDefaultId)
  const carried = resolved.algorithm

  for (const r of policy.rules) {
    if (verdict) {
      trace.push({ ruleId: r.id, matched: false, effect: 'skip', note: 'after decision' })
      continue
    }
    if (!r.enabled) {
      trace.push({ ruleId: r.id, matched: false, effect: 'off', note: 'disabled' })
      continue
    }
    const ops = opsOf(r)
    let matched = false
    let effect: TraceStep['effect'] = 'pass'
    let note = ''

    const deny = (reason: string, fallback: string) => {
      matched = true
      effect = 'deny'
      verdict = { kind: 'deny', reason: reason || fallback }
      deciderId = r.id
    }
    const skip = (why: string) => {
      matched = false
      effect = 'skip'
      note = why
    }

    switch (r.type) {
      case 'algorithm_default':
        // WS-5b: `carried` is now the precomputed FINAL value (read-only) —
        // whether THIS rule is the one that produced it is `resolvedByIds`,
        // not a `!carried` check (which no longer means "nothing has
        // resolved yet" once `carried` is always already-final).
        if (opMatches(ops, req.op) && !req.algorithm) {
          if (winningDefaultId !== null && r.id !== winningDefaultId) {
            skip(
              r.scalars.name_pattern
                ? `name_pattern "${r.scalars.name_pattern}" doesn't match "${req.keyName || '(unnamed)'}"`
                : 'a name-patterned default takes precedence (most-specific-wins)'
            )
            break
          }
          if (winningDefaultId === null && namePatternGate(r, req.keyName) === false) {
            skip(
              `name_pattern "${r.scalars.name_pattern}" doesn't match "${req.keyName || '(unnamed)'}"`
            )
            break
          }
          matched = true
          effect = 'resolve'
          note = r.scalars.name_pattern
            ? `"${req.keyName}" matches ${r.scalars.name_pattern} → ${carried}`
            : `default → ${carried}`
        }
        break
      case 'algorithm_substitution':
        // WS-5b: `resolveAlgorithm` already ran the whole chain up front;
        // `resolvedByIds` says definitively whether THIS rule was a link in
        // it. A rule that didn't fire shows a plain pass here rather than
        // trying to reconstruct which specific reason (op/from/name_pattern)
        // — that would need re-deriving this rule's chain-position-specific
        // intermediate value, which is exactly the per-position coupling
        // this fix removes; a cosmetic "why not" detail isn't worth
        // reintroducing it.
        if (opMatches(ops, req.op) && resolved.resolvedByIds.has(r.id)) {
          matched = true
          effect = 'resolve'
          note = `${r.scalars.from ?? ''} → ${r.scalars.to ?? carried}`
        }
        break
      case 'algorithm_denylist': {
        if (!opMatches(ops, req.op) || !inAlgoList(r.lists.algorithms, carried)) break
        if (!windowActive(r, reqDate)) {
          skip(`outside ${r.scalars.effective_from ?? '…'}–${r.scalars.effective_until ?? '…'}`)
          break
        }
        const exception = r.maps.exception_custom_attribute
        if (exception && attrPredicateMatches(attrs, exception)) {
          matched = true
          note = `excepted: x-${exception.name}=${exception.value}`
          break
        }
        deny(r.scalars.reason ?? '', `${carried} denied`)
        note = `${carried} denied`
        break
      }
      case 'algorithm_allowlist': {
        if (!opMatches(ops, req.op)) break
        if (!windowActive(r, reqDate)) {
          skip(`outside ${r.scalars.effective_from ?? '…'}–${r.scalars.effective_until ?? '…'}`)
          break
        }
        if (!carried) {
          skip('no algorithm to check')
          break
        }
        matched = true
        if (!inAlgoList(r.lists.algorithms, carried)) {
          deny(r.scalars.reason ?? '', 'not on allowlist')
          note = `${carried} not allowed`
        } else {
          note = `${carried} allowed`
        }
        break
      }
      case 'min_key_length':
        if (algoMatches(r.scalars.algorithm ?? '', carried)) {
          if (bits == null) {
            skip('no key bits in request — not evaluated')
            break
          }
          const min = Number(r.scalars.min_bits ?? '0')
          if (bits < min) {
            deny(r.scalars.reason ?? '', 'key too short')
            note = `${bits} < ${min} bits`
          } else {
            matched = true
            note = `${bits} ≥ ${min} bits`
          }
        }
        break
      case 'max_key_age_days': {
        if (!opMatches(ops, req.op)) break
        const activated = parseDate(req.keyActivatedOn)
        if (!activated || !reqDate) {
          skip('no key activation date in request — not evaluated')
          break
        }
        const ageDays = Math.floor((reqDate.getTime() - activated.getTime()) / 86_400_000)
        const max = Number(r.scalars.days ?? r.scalars.max_days ?? '0')
        if (max > 0 && ageDays > max) {
          deny(r.scalars.reason ?? '', 'key too old')
          note = `${ageDays}d > ${max}d`
        } else {
          matched = true
          note = `${ageDays}d ≤ ${max}d`
        }
        break
      }
      case 'temporal_cutoff': {
        if (!opMatches(ops, req.op)) break
        const after = r.scalars.after
        if (!after) break
        // Engine parity (TimeBound::Always, 2026-07-04): `after: "always"`
        // means the cutoff ALWAYS bites — it is an unconditional class ban
        // (classical.yaml uses this), not a rule to skip.
        const always = after === 'always'
        if (!always && !reqDate) {
          skip('no request date — not evaluated')
          break
        }
        if (!carried) break
        // Engine order: date bites → algorithms list (if any) → class. Both
        // the list AND the class must hold (rule.rs L597-622).
        const bites = always || (reqDate !== null && reqDate >= new Date(after))
        const listOk = !r.lists.algorithms?.length || inAlgoList(r.lists.algorithms, carried)
        const classOk = matchesClass(carried, r.scalars.algorithm_class)
        if (bites && listOk && classOk) {
          deny(r.scalars.reason ?? '', `past cutoff ${after}`)
          note = `after ${after}`
        } else if (listOk && classOk) {
          matched = true
          note = `before ${after}`
        }
        break
      }
      case 'require_custom_attribute':
        // Creation-scoped by default (rule.rs scoped_op_matches, 2026-07-04)
        // — an untagged key's Encrypt/Decrypt/Verify is not this rule's business.
        if (!scopedOpMatches(r.lists.ops, req.op)) break
        if (inAlgoList(r.lists.algorithms, carried)) {
          matched = true
          const name = lc(r.scalars.attribute_name ?? '').replace(/^x-/, '')
          const has = attrs.some((a) => a.name === name)
          if (!has) {
            deny(r.scalars.reason ?? '', `missing x-${name}`)
            note = `needs x-${name}`
          } else {
            note = `x-${name} present`
          }
        }
        break
      case 'require_usage_mask':
        // Creation-scoped by default, mirroring require_custom_attribute.
        if (!scopedOpMatches(r.lists.ops, req.op)) break
        if (algoMatches(r.scalars.algorithm ?? '', carried)) {
          matched = true
          const ok = (r.lists.flags ?? []).every((f) => flags.includes(lc(f)))
          if (!ok) {
            deny(r.scalars.reason ?? '', 'usage mask missing')
            note = `needs ${(r.lists.flags ?? []).join('+')}`
          } else {
            note = (r.lists.flags ?? []).join('+')
          }
        }
        break
      case 'lifecycle_state_gate':
        if (opMatches(ops, req.op)) {
          matched = true
          if (req.keyState && !inNameList(r.lists.allowed_states, req.keyState)) {
            deny(r.scalars.reason ?? '', `${req.keyState} not allowed`)
            note = `${req.keyState} not allowed`
          } else {
            note = req.keyState || 'state ok'
          }
        }
        break
      case 'hybrid_dual_sign_requirement': {
        // rule.rs L641-687: window → ops → trigger attr → skip symmetric /
        // no-algo → require the composite {primary}-{SECONDARY}.
        if (!windowActive(r, reqDate)) {
          skip(
            `outside window ${r.scalars.effective_from ?? '…'}–${r.scalars.effective_until ?? '…'}`
          )
          break
        }
        if (!opMatches(ops, req.op)) break
        const trigger = r.maps.triggered_by_custom_attribute
        if (trigger && !attrPredicateMatches(attrs, trigger)) {
          skip(`only when x-${trigger.name}=${trigger.value}`)
          break
        }
        if (!carried) {
          skip('no algorithm to check')
          break
        }
        if (isSymmetric(carried)) {
          matched = true
          note = 'symmetric — dual-sign not applicable'
          break
        }
        const composite = `${r.scalars.primary ?? ''}-${r.scalars.secondary ?? ''}`
        matched = true
        if (lc(carried) === lc(composite)) {
          note = `composite ${composite} ok`
        } else {
          deny(r.scalars.reason ?? '', `composite ${composite} required`)
          note = `needs ${composite}`
        }
        break
      }
      case 'hash_algorithm_allowlist':
        if (!windowActive(r, reqDate)) {
          skip('outside effective window')
          break
        }
        if (!opMatches(ops, req.op)) break
        if (!req.hash) {
          skip('no hash in request — not evaluated')
          break
        }
        matched = true
        if (!inNameList(r.lists.hashing_algorithms, req.hash)) {
          deny(r.scalars.reason ?? '', `${req.hash} not permitted`)
          note = `${req.hash} not allowed`
        } else {
          note = `${req.hash} allowed`
        }
        break
      case 'mechanism_parameter_constraint': {
        if (!opMatches(ops, req.op)) break
        const scope = r.scalars.algorithm
        if (scope && !algoMatches(scope, carried)) break
        const modes = r.lists.allowed_block_cipher_modes ?? []
        const pads = r.lists.allowed_padding_methods ?? []
        const wantDet = r.scalars.require_deterministic
        if (!req.blockMode && !req.padding && !wantDet) {
          skip('no mechanism params in request — not evaluated')
          break
        }
        matched = true
        if (modes.length && req.blockMode && !inNameList(modes, req.blockMode)) {
          deny(r.scalars.reason ?? '', `${req.blockMode} mode not allowed`)
          note = `${req.blockMode} not in [${modes.join(', ')}]`
          break
        }
        if (pads.length && req.padding && !inNameList(pads, req.padding)) {
          deny(r.scalars.reason ?? '', `${req.padding} padding not allowed`)
          note = `${req.padding} not in [${pads.join(', ')}]`
          break
        }
        // Fail-closed like the engine: required flag absent on request → deny.
        if (wantDet === 'true' || wantDet === 'false') {
          if (req.deterministic !== wantDet) {
            deny(r.scalars.reason ?? '', `deterministic=${wantDet} required`)
            note = `deterministic must be ${wantDet}`
            break
          }
        }
        note = 'params ok'
        break
      }
      case 'mac_mechanism_policy':
        if (!opMatches(ops, req.op)) break
        if (!carried) {
          skip('no algorithm to check')
          break
        }
        matched = true
        if (!inAlgoList(r.lists.mac_algorithms, carried)) {
          deny(r.scalars.reason ?? '', `${carried} MAC not permitted`)
          note = `${carried} not a permitted MAC`
        } else {
          note = `${carried} allowed`
        }
        break
      case 'mechanism_allowlist':
        if (!opMatches(ops, req.op)) break
        if (!req.mechanism) {
          skip('no CKM mechanism in request — not evaluated')
          break
        }
        matched = true
        if (!inNameList(r.lists.mechanisms, req.mechanism)) {
          deny(r.scalars.reason ?? '', `${req.mechanism} not on allowlist`)
          note = `${req.mechanism} not allowed`
        } else {
          note = `${req.mechanism} allowed`
        }
        break
      case 'mechanism_denylist':
        if (!opMatches(ops, req.op)) break
        if (!req.mechanism) {
          skip('no CKM mechanism in request — not evaluated')
          break
        }
        if (inNameList(r.lists.mechanisms, req.mechanism)) {
          deny(r.scalars.reason ?? '', `${req.mechanism} denied`)
          note = `${req.mechanism} denied`
        } else {
          matched = true
          note = `${req.mechanism} not denylisted`
        }
        break
      case 'mechanism_parameter_default': {
        // Pass-1b resolve: forces params, never denies (rule.rs resolve_cp).
        if (!opMatches(ops, req.op)) break
        matched = true
        effect = 'resolve'
        const forced = Object.entries(r.scalars)
          .filter(([k]) => !['reason', 'algorithm'].includes(k))
          .map(([k, v]) => `${k}=${v}`)
          .join(', ')
        note = forced ? `forces ${forced}` : 'forces mechanism defaults'
        break
      }
      case 'compliance_profile_gate':
        // Mirror of rule.rs L689: documentational, never denies — the
        // composing allow/denylist rules carry the enforcement.
        if (opMatches(ops, req.op)) {
          matched = true
          note = 'documentational — no gate (allow/deny rules enforce)'
        }
        break
      default:
        skip('unknown rule type — not evaluated')
        break
    }

    trace.push({ ruleId: r.id, matched, effect, note })
  }

  if (!verdict) {
    // A substitution match on a create-family op has no existing object to
    // rekey — the engine allows with an algorithm override instead (see
    // `toDrySpec`'s `newObject` check, reused verbatim here so the two stay
    // in lockstep). Only a "use" op (an existing object, per KMIP semantics)
    // produces a genuine rekey verdict.
    const isNewObject = /^(Create|CreateKeyPair|Register|Import)/.test(req.op)
    verdict =
      resolved.rekey && !isNewObject
        ? { kind: 'rekey', from: resolved.rekey.from, to: resolved.rekey.to, algorithm: carried }
        : { kind: 'allow', algorithm: carried || req.algorithm }
  }

  return { verdict, trace, deciderId }
}

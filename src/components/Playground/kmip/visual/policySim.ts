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

/** rule.rs::algo_matches (Y3) — a policy entry covers a request algorithm when
 * it equals it or is a family prefix of a hyphen-suffixed member (`AES` covers
 * `AES-256`; `AES-128` never covers `AES-256`). */
const algoMatches = (policyEntry: string, requestAlgo: string): boolean => {
  const e = lc(policyEntry)
  const a = lc(requestAlgo)
  return !!e && (e === a || a.startsWith(`${e}-`))
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

/**
 * Walk the enabled rules in precedence order, mirroring the Rust engine's
 * two-pass semantics (resolve then gate). Produces a per-rule trace and a
 * terminal verdict. Deterministic single path.
 */
export function evaluatePolicy(policy: EditablePolicy, req: SimRequest): SimResult {
  const trace: TraceStep[] = []
  let carried = req.algorithm
  let rekey: { from: string; to: string } | null = null
  let verdict: SimVerdict | null = null
  let deciderId: string | null = null
  const reqDate = parseDate(req.date)
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
        if (opMatches(ops, req.op) && !carried) {
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
          carried = r.scalars.default_algorithm ?? carried
          note = r.scalars.name_pattern
            ? `"${req.keyName}" matches ${r.scalars.name_pattern} → ${carried}`
            : `default → ${carried}`
        }
        break
      case 'algorithm_substitution':
        if (opMatches(ops, req.op) && lc(carried) === lc(r.scalars.from ?? '')) {
          if (namePatternGate(r, req.keyName) === false) {
            skip(
              `name_pattern "${r.scalars.name_pattern}" doesn't match "${req.keyName || '(unnamed)'}"`
            )
            break
          }
          matched = true
          effect = 'resolve'
          rekey = { from: carried, to: r.scalars.to ?? '' }
          carried = r.scalars.to ?? carried
          note = `${rekey.from} → ${rekey.to}`
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
    verdict = rekey
      ? { kind: 'rekey', from: rekey.from, to: rekey.to, algorithm: carried }
      : { kind: 'allow', algorithm: carried || req.algorithm }
  }

  return { verdict, trace, deciderId }
}

// SPDX-License-Identifier: GPL-3.0-only
//
// policySim.ts — an ILLUSTRATIVE client-side re-implementation of the policy
// engine's precedence walk, used ONLY to drive the graph visualisation (which
// node matched, the flow path, the animated token). The AUTHORITATIVE verdict
// always comes from the WASM engine's `dryRun` — this trace is self-checked
// against it and flagged "approximated" on divergence. When the engine grows a
// per-rule trace (implementation plan WP4b), this is replaced behind the same
// TraceStep interface.
import type { EditableRule, EditablePolicy } from './policyEditModel'

export interface SimRequest {
  op: string
  algorithm: string
  keyState: string
  bits: string
  date: string
  attrs: string[]
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
const inList = (list: string[] | undefined, a: string): boolean =>
  (list ?? []).some((x) => lc(x) === lc(a))

const PQC_RE = /^(ML-|SLH-|FN-|Falcon|HQC|BIKE|Frodo|Classic|LMS|HSS|XMSS)/i
const CLASSICAL_RE = /^(RSA|ECDSA|ECDH|Ed25519|Ed448|X25519|X448|DSA|DH|3DES|DES)/i
const isPqc = (a: string): boolean => PQC_RE.test(a || '')
const isClassical = (a: string): boolean => CLASSICAL_RE.test(a || '')

const opMatches = (ruleOps: string[], reqOp: string): boolean => {
  if (!ruleOps.length) return true
  const base = (o: string): string => o.split(':')[0]
  return ruleOps.some((o) => o === reqOp || base(o) === reqOp || base(o) === base(reqOp))
}

const opsOf = (r: EditableRule): string[] =>
  r.lists.ops ?? r.lists.ops_affected ?? (r.scalars.op ? [r.scalars.op] : [])

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
  const reqDate = /^\d{4}-\d{2}-\d{2}$/.test(req.date) ? new Date(req.date) : null
  const attrs = req.attrs.map(lc)
  const bits = req.bits === '' ? null : Number(req.bits)

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

    switch (r.type) {
      case 'algorithm_default':
        if (opMatches(ops, req.op) && !carried) {
          matched = true
          effect = 'resolve'
          carried = r.scalars.default_algorithm ?? carried
          note = `default → ${carried}`
        }
        break
      case 'algorithm_substitution':
        if (opMatches(ops, req.op) && lc(carried) === lc(r.scalars.from ?? '')) {
          matched = true
          effect = 'resolve'
          rekey = { from: carried, to: r.scalars.to ?? '' }
          carried = r.scalars.to ?? carried
          note = `${rekey.from} → ${rekey.to}`
        }
        break
      case 'algorithm_denylist':
        if (opMatches(ops, req.op) && inList(r.lists.algorithms, carried)) {
          matched = true
          effect = 'deny'
          verdict = { kind: 'deny', reason: r.scalars.reason || `${carried} denied` }
          deciderId = r.id
          note = `${carried} denied`
        }
        break
      case 'algorithm_allowlist':
        if (opMatches(ops, req.op)) {
          matched = true
          if (!inList(r.lists.algorithms, carried)) {
            effect = 'deny'
            verdict = { kind: 'deny', reason: r.scalars.reason || 'not on allowlist' }
            deciderId = r.id
            note = `${carried} not allowed`
          } else {
            note = `${carried} allowed`
          }
        }
        break
      case 'min_key_length':
        if (lc(carried).startsWith(lc(r.scalars.algorithm ?? '')) && bits != null) {
          const min = Number(r.scalars.min_bits ?? '0')
          if (bits < min) {
            matched = true
            effect = 'deny'
            verdict = { kind: 'deny', reason: r.scalars.reason || 'key too short' }
            deciderId = r.id
            note = `${bits} < ${min} bits`
          }
        }
        break
      case 'temporal_cutoff': {
        const cls = r.scalars.algorithm_class
        const classHit =
          cls === 'classical'
            ? isClassical(carried)
            : cls === 'pqc'
              ? isPqc(carried)
              : r.lists.algorithms?.length
                ? inList(r.lists.algorithms, carried)
                : true
        const after = r.scalars.after
        const bites = after && after !== 'always' && reqDate && reqDate >= new Date(after)
        if (opMatches(ops, req.op) && classHit && bites) {
          matched = true
          effect = 'deny'
          verdict = { kind: 'deny', reason: r.scalars.reason || `past cutoff ${after}` }
          deciderId = r.id
          note = `after ${after}`
        } else if (classHit && after) {
          matched = true
          note = `before ${after}`
        }
        break
      }
      case 'require_custom_attribute':
        if (inList(r.lists.algorithms, carried)) {
          matched = true
          const name = lc(r.scalars.attribute_name ?? '')
          const has = attrs.includes(`x-${name}`) || attrs.includes(name)
          if (!has) {
            effect = 'deny'
            verdict = { kind: 'deny', reason: r.scalars.reason || `missing x-${name}` }
            deciderId = r.id
            note = `needs x-${name}`
          } else {
            note = `x-${name} present`
          }
        }
        break
      case 'require_usage_mask':
        if (lc(carried) === lc(r.scalars.algorithm ?? '')) {
          matched = true
          const ok = (r.lists.flags ?? []).every((f) => attrs.includes(lc(f)))
          if (!ok) {
            effect = 'deny'
            verdict = { kind: 'deny', reason: r.scalars.reason || 'usage mask missing' }
            deciderId = r.id
            note = `needs ${(r.lists.flags ?? []).join('+')}`
          } else {
            note = (r.lists.flags ?? []).join('+')
          }
        }
        break
      case 'lifecycle_state_gate':
        if (opMatches(ops, req.op)) {
          matched = true
          if (req.keyState && !inList(r.lists.allowed_states, req.keyState)) {
            effect = 'deny'
            verdict = { kind: 'deny', reason: r.scalars.reason || `${req.keyState} not allowed` }
            deciderId = r.id
            note = `${req.keyState} not allowed`
          } else {
            note = req.keyState || 'state ok'
          }
        }
        break
      case 'mechanism_denylist':
        if (opMatches(ops, req.op) && inList(r.lists.mechanisms, carried)) {
          matched = true
          effect = 'deny'
          verdict = { kind: 'deny', reason: r.scalars.reason || 'mechanism denied' }
          deciderId = r.id
          note = 'mechanism denied'
        }
        break
      default:
        // compliance_profile_gate + mechanism_* params are advisory in this
        // illustrative walk (the engine is authoritative for them).
        if (opMatches(ops, req.op)) {
          matched = true
          note = 'checked'
        }
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

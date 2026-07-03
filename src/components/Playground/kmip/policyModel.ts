// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection, security/detect-non-literal-regexp --
   trusted-input parser: all object keys are known string literals or numeric loop
   counters, and the only data is locally-served policy YAML (no user-controlled
   keys); the one RegExp is built from a hard-coded field name. */
//
// policyModel.ts — parse a crypto-agility policy YAML into a structured model the
// Policy view renders visually. Dependency-free (no YAML lib, matching the rest
// of the playground): the preset policies share one small, regular grammar
// (`pqctoday-hsm/kmip/src/policy/rule.rs` is the source of truth), and the raw
// text is always one click away. Handles ALL ~18 rule variants — scalars, inline
// `[a, b]` / block `- x` lists, and inline `{ name: x, value: y }` flow-maps.

/** Visual family a rule belongs to — drives icon + colour grouping. */
export type RuleTone =
  | 'default'
  | 'substitution'
  | 'allow'
  | 'deny'
  | 'require'
  | 'temporal'
  | 'lifecycle'
  | 'mechanism'
  | 'hybrid'
  | 'compliance'
  | 'other'

/** One key fact about a rule, shown as a labelled chip. */
export interface RuleChip {
  label: string
  value: string
}

/** A parsed `rules:` entry, normalised for display. */
export interface ParsedRule {
  /** Raw snake_case `type:` (e.g. `algorithm_denylist`). */
  type: string
  tone: RuleTone
  /** Short human label (e.g. "Deny", "Default", "Rekey", "Allowlist"). */
  title: string
  /** Operations the rule scopes to (`ops` / `ops_affected` / `[op]`). */
  ops: string[]
  /** The rule's central algorithm/mechanism list (for the posture matrix). */
  algorithms: string[]
  /** Structured key facts (everything not captured by ops/algorithms/reason). */
  chips: RuleChip[]
  /** Raw scalar fields (default_algorithm, from, to, min_bits, …) for derivations. */
  values: Record<string, string>
  reason?: string
  /** Temporal bounds, if any — feed the timeline. */
  effectiveFrom?: string
  effectiveUntil?: string
  /** `temporal_cutoff.after` — a hard one-sided cutoff. */
  after?: string
}

/** One `metadata.compliance_mapping` row. */
export interface ComplianceRow {
  framework: string
  tag?: string
}

/** The whole policy, parsed. */
export interface PolicyModel {
  name?: string
  description?: string
  authority?: string
  effective?: string
  compliance: ComplianceRow[]
  rules: ParsedRule[]
}

const unquote = (s: string): string => s.trim().replace(/^["']|["']$/g, '')

/** Read a YAML list that is either inline (`[a, b]`) or a block of `- item`
 * lines following `key:` (stops at the next rule or a dedent). */
function readList(lines: string[], idx: number, inlineAfterColon: string): string[] {
  const inline = inlineAfterColon.trim()
  if (inline.startsWith('[')) {
    return inline
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map(unquote)
      .filter(Boolean)
  }
  if (inline !== '' && !inline.startsWith('{')) return [] // a scalar, not a list
  const items: string[] = []
  for (let i = idx + 1; i < lines.length; i++) {
    if (lines[i].trim() === '' || /^\s*#/.test(lines[i])) continue // comments interleave in block lists
    if (/^\s*-\s*type\s*:/.test(lines[i])) break
    const m = lines[i].match(/^\s*-\s*(.+)$/)
    if (m)
      items.push(unquote(m[1].replace(/\s+#.*$/, ''))) // drop trailing same-line comments
    else break
  }
  return items
}

/** Pull `name` / `value` out of an inline predicate map `{ name: x, value: y }`. */
function parseInlineMap(s: string): Record<string, string> {
  const out: Record<string, string> = {}
  const body = s.trim().replace(/^\{|\}$/g, '')
  for (const part of body.split(',')) {
    const c = part.indexOf(':')
    if (c === -1) continue
    out[part.slice(0, c).trim()] = unquote(part.slice(c + 1))
  }
  return out
}

/** Extract `metadata.compliance_mapping` — a list of inline flow-maps. */
function parseCompliance(lines: string[]): ComplianceRow[] {
  const start = lines.findIndex((l) => /^\s*compliance_mapping\s*:/.test(l))
  if (start === -1) return []
  const rows: ComplianceRow[] = []
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trim() === '' || /^\s*#/.test(lines[i])) continue // comments interleave
    const m = lines[i].match(/^\s*-\s*\{(.+)\}\s*$/)
    if (!m) break
    const pairs = parseInlineMap(`{${m[1]}}`)
    if (!pairs.framework) continue
    const tag = pairs.status ?? (pairs.level ? `L${pairs.level}` : undefined)
    rows.push({ framework: pairs.framework, tag })
  }
  return rows
}

/** Capture the `description: |` block scalar as one collapsed paragraph. */
function parseDescription(lines: string[]): string | undefined {
  const start = lines.findIndex((l) => /^\s*description\s*:/.test(l))
  if (start === -1) return undefined
  const inline = lines[start].split(':').slice(1).join(':').trim()
  if (inline && inline !== '|' && inline !== '>') return unquote(inline)
  const indent = (lines[start].match(/^\s*/)?.[0].length ?? 0) + 1
  const out: string[] = []
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trim() === '') {
      out.push('')
      continue
    }
    const lead = lines[i].match(/^\s*/)?.[0].length ?? 0
    if (lead < indent) break
    out.push(lines[i].trim())
  }
  return out.join(' ').replace(/\s+/g, ' ').trim() || undefined
}

const scalar = (lines: string[], key: string): string | undefined => {
  const l = lines.find((x) => new RegExp(`^\\s*${key}\\s*:`).test(x))
  if (!l) return undefined
  const v = unquote(l.split(':').slice(1).join(':'))
  return v || undefined
}

interface RuleDescriptor {
  tone: RuleTone
  title: string
}

/** type → tone + human title. */
const RULE_META: Record<string, RuleDescriptor> = {
  algorithm_default: { tone: 'default', title: 'Default' },
  algorithm_substitution: { tone: 'substitution', title: 'Rekey' },
  algorithm_allowlist: { tone: 'allow', title: 'Allowlist' },
  algorithm_denylist: { tone: 'deny', title: 'Deny' },
  min_key_length: { tone: 'require', title: 'Min key length' },
  max_key_age_days: { tone: 'lifecycle', title: 'Max key age' },
  require_usage_mask: { tone: 'require', title: 'Usage mask' },
  require_custom_attribute: { tone: 'require', title: 'Require attribute' },
  temporal_cutoff: { tone: 'temporal', title: 'Time cutoff' },
  lifecycle_state_gate: { tone: 'lifecycle', title: 'Lifecycle gate' },
  hybrid_dual_sign_requirement: { tone: 'hybrid', title: 'Hybrid dual-sign' },
  compliance_profile_gate: { tone: 'compliance', title: 'Compliance gate' },
  hash_algorithm_allowlist: { tone: 'mechanism', title: 'Hash allowlist' },
  mechanism_parameter_constraint: { tone: 'mechanism', title: 'Mechanism constraint' },
  mac_mechanism_policy: { tone: 'mechanism', title: 'MAC policy' },
  mechanism_parameter_default: { tone: 'mechanism', title: 'Mechanism default' },
  mechanism_allowlist: { tone: 'allow', title: 'Mechanism allowlist' },
  mechanism_denylist: { tone: 'deny', title: 'Mechanism denylist' },
}

/** Per-type config: which field is the "central list" (for the matrix), which
 * fields become chips, and any inline-map fields to flatten. */
const LIST_FIELDS = new Set([
  'ops',
  'algorithms',
  'flags',
  'allowed_states',
  'allowed_block_cipher_modes',
  'allowed_padding_methods',
  'hashing_algorithms',
  'mac_algorithms',
  'mechanisms',
  'ops_affected',
])

const MAP_FIELDS = new Set(['exception_custom_attribute', 'triggered_by_custom_attribute'])

/** The field whose list is the rule's "algorithms" for the posture matrix. */
function centralList(type: string, lists: Record<string, string[]>): string[] {
  if (type === 'mechanism_allowlist' || type === 'mechanism_denylist') return lists.mechanisms ?? []
  if (type === 'mac_mechanism_policy') return lists.mac_algorithms ?? []
  if (type === 'hash_algorithm_allowlist') return lists.hashing_algorithms ?? []
  if (type === 'require_usage_mask') return lists.flags ?? []
  return lists.algorithms ?? []
}

/** Build the chip list for a rule from its scalar + map fields. */
function buildChips(
  type: string,
  scalars: Record<string, string>,
  lists: Record<string, string[]>,
  maps: Record<string, Record<string, string>>
): RuleChip[] {
  const chips: RuleChip[] = []
  const add = (label: string, value?: string) => value && chips.push({ label, value })

  add('→', scalars.default_algorithm)
  if (scalars.from || scalars.to)
    chips.push({ label: '', value: `${scalars.from ?? '?'} → ${scalars.to ?? '?'}` })
  add('min bits', scalars.min_bits)
  add('algorithm', scalars.algorithm)
  add('attribute', scalars.attribute_name ? `x-${scalars.attribute_name}` : undefined)
  add('profile', scalars.profile)
  add('primary', scalars.primary)
  add('secondary', scalars.secondary)
  add('composite OID', scalars.composite_oid)
  add('class', scalars.algorithm_class)
  if (scalars.deterministic === 'true') chips.push({ label: '', value: 'deterministic' })
  add('block mode', lists.allowed_block_cipher_modes?.join(', '))
  add('padding', lists.allowed_padding_methods?.join(', '))
  add('hashes', lists.hashing_algorithms?.join(', '))
  add('MAC', lists.mac_algorithms?.join(', '))
  add('states', lists.allowed_states?.join(', '))
  add('flags', type === 'require_usage_mask' ? lists.flags?.join('+') : undefined)
  if (maps.exception_custom_attribute)
    add(
      'except if',
      `x-${maps.exception_custom_attribute.name}=${maps.exception_custom_attribute.value}`
    )
  if (maps.triggered_by_custom_attribute)
    add(
      'when',
      `x-${maps.triggered_by_custom_attribute.name}=${maps.triggered_by_custom_attribute.value}`
    )
  return chips
}

/** Parse a policy YAML into the display model. */
export function parsePolicyModel(yaml: string): PolicyModel {
  const lines = yaml.split('\n')
  const name = scalar(lines, 'name')
  const authority = scalar(lines, 'authority')
  const effective = scalar(lines, 'effective')
  const description = parseDescription(lines)
  const compliance = parseCompliance(lines)

  const rules: ParsedRule[] = []
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].match(/^(\s*)-\s*type\s*:\s*(\S+)/)
    if (!t) continue
    const type = t[2]
    const scalars: Record<string, string> = {}
    const lists: Record<string, string[]> = {}
    const maps: Record<string, Record<string, string>> = {}

    for (let j = i + 1; j < lines.length; j++) {
      if (/^\s*-\s*type\s*:/.test(lines[j])) break
      if (/^\S/.test(lines[j]) && lines[j].trim() !== '') break // dedent to top-level key
      const kv = lines[j].match(/^\s*([a-z_]+)\s*:(.*)$/)
      if (!kv) continue
      const key = kv[1]
      const rest = kv[2].trim()
      if (LIST_FIELDS.has(key)) lists[key] = readList(lines, j, kv[2])
      else if (MAP_FIELDS.has(key) && rest.startsWith('{')) maps[key] = parseInlineMap(rest)
      else scalars[key] = unquote(kv[2])
    }

    const meta = RULE_META[type] ?? { tone: 'other' as RuleTone, title: type.replace(/_/g, ' ') }
    const ops = lists.ops ?? lists.ops_affected ?? (scalars.op ? [scalars.op] : [])
    rules.push({
      type,
      tone: meta.tone,
      title: meta.title,
      ops,
      algorithms: centralList(type, lists),
      chips: buildChips(type, scalars, lists, maps),
      values: scalars,
      reason: scalars.reason,
      effectiveFrom: scalars.effective_from,
      effectiveUntil: scalars.effective_until,
      after: scalars.after,
    })
  }

  return { name, description, authority, effective, compliance, rules }
}

/** Rules that carry a temporal bound — for the timeline view. */
export const temporalRules = (m: PolicyModel): ParsedRule[] =>
  m.rules.filter((r) => r.effectiveFrom || r.effectiveUntil || r.after)

/** Where one algorithm lands under a policy, derived from its rules. Heuristic —
 * ignores per-op scoping, time bounds, and custom-attribute exceptions, so it is
 * a "where does this appear" overview, not the engine's live decision (the
 * Plane-1 tester is authoritative for that). Precedence: default > rekeyed >
 * denied > allowed > neutral. */
export type Disposition = 'default' | 'rekey-from' | 'rekey-to' | 'denied' | 'allowed' | 'neutral'

export function dispositionOf(model: PolicyModel, algo: string): Disposition {
  const eq = (a?: string) => !!a && a.toLowerCase() === algo.toLowerCase()
  const has = (list: string[]) => list.some((a) => a.toLowerCase() === algo.toLowerCase())

  const defaults = model.rules.filter((r) => r.type === 'algorithm_default')
  if (defaults.some((r) => eq(r.values.default_algorithm))) return 'default'

  const subs = model.rules.filter((r) => r.type === 'algorithm_substitution')
  if (subs.some((r) => eq(r.values.to))) return 'rekey-to'
  if (subs.some((r) => eq(r.values.from))) return 'rekey-from'

  const denylists = model.rules.filter(
    (r) => r.type === 'algorithm_denylist' || r.type === 'mechanism_denylist'
  )
  if (denylists.some((r) => has(r.algorithms))) return 'denied'

  const allowlists = model.rules.filter(
    (r) => r.type === 'algorithm_allowlist' || r.type === 'mechanism_allowlist'
  )
  if (allowlists.length > 0) {
    return allowlists.some((r) => has(r.algorithms)) ? 'allowed' : 'denied'
  }
  return 'neutral'
}

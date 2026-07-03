// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection -- trusted-input model: keys
   come from the shipped policy grammar / the typed rule catalog, never from
   user-controlled property names. */
//
// policyEditModel.ts — the EDITABLE policy model behind the visual editor, and
// its YAML serializer. `parsePolicyModel` (../policyModel.ts) is a lossy display
// parser; this one is lossless for every field the grammar defines so a policy
// can round-trip parse → edit → serialize → parse without drift. Comments and
// formatting are NOT preserved (the generated YAML is a projection of the graph
// — the graph is the source of truth).
//
// The grammar is `pqctoday-hsm/kmip/src/policy/rule.rs` + the 13 fixtures in
// `public/kmip-policies/`. The round-trip test over those fixtures is the
// correctness bar for this file.
import { bucketOf, isRuleTypeId, RULE_CATALOG, centralListOf } from './ruleCatalog'

/** An `{ name, value }` custom-attribute predicate (AttrPredicate in rule.rs). */
export interface AttrPair {
  name: string
  value: string
}

/** One editable rule. Field values live in shape buckets so parsing and
 * serialization stay generic; the catalog's FieldSpec says which bucket a
 * field uses. Unknown fields (grammar drift) survive in their shape bucket. */
export interface EditableRule {
  /** Editor-only stable identity (selection, layout, trace) — never serialized. */
  id: string
  type: string
  enabled: boolean
  scalars: Record<string, string>
  lists: Record<string, string[]>
  maps: Record<string, AttrPair>
}

export interface EditablePolicy {
  schemaVersion: string
  metadata: {
    name: string
    /** Multi-line; serialized as a `description: |` block. */
    description: string
    authority: string
    /** TimeBound scalar: `always` or `YYYY-MM-DD`. */
    effective: string
    /** Ordered key→value rows of `compliance_mapping` (framework first). */
    complianceMapping: Record<string, string>[]
  }
  rules: EditableRule[]
}

export interface EditorIssue {
  level: 'error' | 'warn'
  /** The offending rule (click-to-select in the Check tab). */
  ruleId: string
  message: string
}

let idCounter = 0
export const newRuleId = (): string => `er-${++idCounter}-${Date.now().toString(36)}`

/** Deep-clone an editable policy (state updates, reset-to-preset). */
export const clonePolicy = (p: EditablePolicy): EditablePolicy =>
  JSON.parse(JSON.stringify(p)) as EditablePolicy

// ── Parse ───────────────────────────────────────────────────────────────────

const unquote = (s: string): string => s.trim().replace(/^["']|["']$/g, '')

const splitInlineList = (body: string): string[] =>
  body
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map(unquote)
    .filter(Boolean)

const parseInlineMap = (s: string): Record<string, string> => {
  const out: Record<string, string> = {}
  const body = s.trim().replace(/^\{|\}$/g, '')
  for (const part of body.split(',')) {
    const c = part.indexOf(':')
    if (c === -1) continue
    out[part.slice(0, c).trim()] = unquote(part.slice(c + 1))
  }
  return out
}

/** Strip a trailing same-line `# comment` from a scalar rest (quotes respected). */
const stripComment = (rest: string): string => {
  let inQuote: string | null = null
  for (let i = 0; i < rest.length; i++) {
    const ch = rest[i]
    if (inQuote) {
      if (ch === inQuote) inQuote = null
    } else if (ch === '"' || ch === "'") {
      inQuote = ch
    } else if (ch === '#' && (i === 0 || rest[i - 1] === ' ')) {
      return rest.slice(0, i)
    }
  }
  return rest
}

/**
 * Parse a policy YAML (the small closed grammar the engine reads — see the
 * fixtures) into the editable model. Line-based like `parsePolicyModel`, but
 * lossless: every rule field is kept in its shape bucket, description keeps
 * its line structure, compliance rows keep all their keys.
 */
export function toEditable(yaml: string): EditablePolicy {
  const lines = yaml.split('\n')
  const policy: EditablePolicy = {
    schemaVersion: '1',
    metadata: { name: '', description: '', authority: '', effective: '', complianceMapping: [] },
    rules: [],
  }

  const sv = lines.find((l) => /^schema_version\s*:/.test(l))
  if (sv) policy.schemaVersion = unquote(stripComment(sv.split(':').slice(1).join(':')))

  // ── metadata block ──
  const metaStart = lines.findIndex((l) => /^metadata\s*:/.test(l))
  if (metaStart !== -1) {
    for (let i = metaStart + 1; i < lines.length; i++) {
      const line = lines[i]
      if (/^\S/.test(line) && line.trim() !== '') break // top-level dedent (rules:)
      const kv = line.match(/^\s{2}([a-z_]+)\s*:(.*)$/)
      if (!kv) continue
      const key = kv[1]
      const rest = stripComment(kv[2]).trim()
      if (key === 'description') {
        if (rest === '|' || rest === '>' || rest === '') {
          const body: string[] = []
          for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].trim() === '') {
              body.push('')
              continue
            }
            const lead = lines[j].match(/^\s*/)?.[0].length ?? 0
            if (lead < 3) break
            body.push(lines[j].replace(/^\s{4}/, ''))
          }
          while (body.length && body[body.length - 1] === '') body.pop()
          policy.metadata.description = body.join('\n')
        } else {
          policy.metadata.description = unquote(rest)
        }
      } else if (key === 'compliance_mapping') {
        for (let j = i + 1; j < lines.length; j++) {
          if (/^\s*#/.test(lines[j])) continue
          const m = lines[j].match(/^\s*-\s*\{(.+)\}\s*$/)
          if (!m) break
          policy.metadata.complianceMapping.push(parseInlineMap(`{${m[1]}}`))
        }
      } else if (key === 'name') policy.metadata.name = unquote(rest)
      else if (key === 'authority') policy.metadata.authority = unquote(rest)
      else if (key === 'effective') policy.metadata.effective = unquote(rest)
    }
  }

  // ── rules ──
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].match(/^\s*-\s*type\s*:\s*(\S+)/)
    if (!t) continue
    const rule: EditableRule = {
      id: newRuleId(),
      type: t[1],
      enabled: true,
      scalars: {},
      lists: {},
      maps: {},
    }
    for (let j = i + 1; j < lines.length; j++) {
      if (/^\s*-\s*type\s*:/.test(lines[j])) break
      if (/^\S/.test(lines[j]) && lines[j].trim() !== '') break
      const kv = lines[j].match(/^\s*([a-z_]+)\s*:(.*)$/)
      if (!kv) continue
      const key = kv[1]
      const rest = stripComment(kv[2]).trim()
      if (rest.startsWith('[')) {
        rule.lists[key] = splitInlineList(rest)
      } else if (rest.startsWith('{')) {
        const m = parseInlineMap(rest)
        rule.maps[key] = { name: m.name ?? '', value: m.value ?? '' }
      } else if (rest === '') {
        // block list: `key:` followed by `- item` lines (comments interleave
        // freely — see fips-only.yaml's algorithms list)
        const items: string[] = []
        for (let k = j + 1; k < lines.length; k++) {
          if (lines[k].trim() === '' || /^\s*#/.test(lines[k])) continue
          if (/^\s*-\s*type\s*:/.test(lines[k])) break
          const m = lines[k].match(/^\s*-\s*(.+)$/)
          if (!m) break
          items.push(unquote(stripComment(m[1]).trim()))
        }
        rule.lists[key] = items
      } else {
        rule.scalars[key] = unquote(rest)
      }
    }
    policy.rules.push(rule)
  }

  return policy
}

// ── Serialize ───────────────────────────────────────────────────────────────

/** Quote a scalar when YAML would misread it bare. Dates / `always` are always
 * quoted (matches the shipped fixtures' TimeBound style); ints/bools stay bare
 * so serde reads them as u32/bool. */
const q = (v: string): string => {
  if (v === '') return '""'
  if (/^-?\d+$/.test(v) || v === 'true' || v === 'false') return v // typed scalars
  if (/^\d{4}-\d{2}-\d{2}$/.test(v) || v === 'always') return JSON.stringify(v)
  if (/^\d[\d.]*$/.test(v)) return JSON.stringify(v) // digit-leading (OIDs)
  if (/[,[\]{}#&*!|>'"%@`\\]/.test(v) || /:\s/.test(v) || /^\s|\s$/.test(v) || /\s/.test(v))
    return JSON.stringify(v)
  return v
}

const inlineList = (arr: string[]): string => `[${arr.map(q).join(', ')}]`

const emitField = (
  out: string[],
  indent: string,
  rule: EditableRule,
  key: string,
  bucket: 'scalars' | 'lists' | 'maps',
  required = false
): void => {
  // Required (non-serde-default) fields are ALWAYS emitted, even empty —
  // omitting them makes the Rust loader fail with "missing field".
  if (bucket === 'lists') {
    const v = rule.lists[key]
    if (v && v.length) out.push(`${indent}${key}: ${inlineList(v)}`)
    else if (required) out.push(`${indent}${key}: []`)
  } else if (bucket === 'maps') {
    const m = rule.maps[key]
    if (m && (m.name || m.value))
      out.push(`${indent}${key}: { name: ${q(m.name)}, value: ${q(m.value)} }`)
  } else {
    const v = rule.scalars[key]
    if (v != null && v !== '') out.push(`${indent}${key}: ${q(v)}`)
    else if (required) out.push(`${indent}${key}: ""`)
  }
}

/**
 * Serialize the editable model back to policy YAML in the exact grammar the
 * Rust loader and `parsePolicyModel` read. Disabled rules are emitted as
 * comment blocks (the engine skips them; re-parsing does not resurrect them —
 * disabled state lives in the editor session only).
 */
export function serialize(policy: EditablePolicy): string {
  const L: string[] = []
  L.push(`# ${policy.metadata.name || 'policy'} — generated by the CACP visual editor`)
  L.push(`schema_version: ${policy.schemaVersion || '1'}`)
  L.push('')
  L.push('metadata:')
  L.push(`  name: ${q(policy.metadata.name || 'untitled')}`)
  if (policy.metadata.description) {
    L.push('  description: |')
    for (const line of policy.metadata.description.split('\n')) L.push(line ? `    ${line}` : '')
  }
  if (policy.metadata.authority) L.push(`  authority: ${q(policy.metadata.authority)}`)
  if (policy.metadata.effective) L.push(`  effective: "${policy.metadata.effective}"`)
  if (policy.metadata.complianceMapping.length) {
    L.push('  compliance_mapping:')
    for (const row of policy.metadata.complianceMapping) {
      const keys = ['framework', ...Object.keys(row).filter((k) => k !== 'framework')]
      const pairs = keys.filter((k) => row[k] != null).map((k) => `${k}: ${q(row[k])}`)
      L.push(`    - { ${pairs.join(', ')} }`)
    }
  }
  L.push('')
  L.push('rules:')
  for (const rule of policy.rules) {
    L.push('')
    const body: string[] = []
    body.push(`  - type: ${rule.type}`)
    const spec = isRuleTypeId(rule.type) ? RULE_CATALOG[rule.type] : undefined
    const emitted = new Set<string>()
    // Catalog fields first, in spec order.
    for (const f of spec?.fields ?? []) {
      emitted.add(f.key)
      emitField(body, '    ', rule, f.key, bucketOf(f.kind), !f.optional)
    }
    // Then anything the parse kept that the catalog doesn't know (forward-compat).
    for (const k of Object.keys(rule.scalars))
      if (!emitted.has(k)) emitField(body, '    ', rule, k, 'scalars')
    for (const k of Object.keys(rule.lists))
      if (!emitted.has(k)) emitField(body, '    ', rule, k, 'lists')
    for (const k of Object.keys(rule.maps))
      if (!emitted.has(k)) emitField(body, '    ', rule, k, 'maps')

    if (rule.enabled) {
      L.push(...body)
    } else {
      L.push('  # (disabled in editor)')
      L.push(...body.map((line) => `  # ${line.trim()}`))
    }
  }
  L.push('')
  return L.join('\n')
}

// ── Static validation ───────────────────────────────────────────────────────

const lower = (s: string): string => s.toLowerCase()
const opsOf = (r: EditableRule): string[] =>
  r.lists.ops ?? r.lists.ops_affected ?? (r.scalars.op ? [r.scalars.op] : [])

/** Two op scopes overlap when either is unscoped or they share a base op. */
const opsOverlap = (a: string[], b: string[]): boolean => {
  if (!a.length || !b.length) return true
  const base = (o: string): string => o.split(':')[0]
  const bs = new Set(b.map(base))
  return a.some((o) => bs.has(base(o)))
}

/**
 * Static policy lint — no engine needed. Four checks (per the implementation
 * plan §8): deny∩allow conflict, dead default, empty central list, disabled
 * substitution. The engine loader's own warnings are merged in by the caller.
 */
export function validate(policy: EditablePolicy): EditorIssue[] {
  const issues: EditorIssue[] = []
  const rules = policy.rules
  const enabled = rules.filter((r) => r.enabled)

  // (a) an algorithm both denied and allowlisted for overlapping ops
  for (const [i, deny] of rules.entries()) {
    if (deny.type !== 'algorithm_denylist' || !deny.enabled) continue
    for (const a of deny.lists.algorithms ?? []) {
      for (const [j, allow] of rules.entries()) {
        if (allow.type !== 'algorithm_allowlist' || !allow.enabled) continue
        if (!opsOverlap(opsOf(deny), opsOf(allow))) continue
        if ((allow.lists.algorithms ?? []).some((x) => lower(x) === lower(a))) {
          issues.push({
            level: 'error',
            ruleId: deny.id,
            message: `"${a}" is both denied (rule ${i + 1}) and allowlisted (rule ${j + 1}) — deny wins.`,
          })
        }
      }
    }
  }

  // (b) a default whose algorithm a later denylist denies (dead default)
  for (const [i, def] of rules.entries()) {
    if (def.type !== 'algorithm_default' || !def.enabled) continue
    const algo = def.scalars.default_algorithm ?? ''
    for (const [j, deny] of rules.entries()) {
      if (j <= i || deny.type !== 'algorithm_denylist' || !deny.enabled) continue
      if (!opsOverlap(opsOf(def), opsOf(deny))) continue
      if ((deny.lists.algorithms ?? []).some((x) => lower(x) === lower(algo))) {
        issues.push({
          level: 'error',
          ruleId: def.id,
          message: `Default "${algo}" (rule ${i + 1}) is denied by rule ${j + 1} — every defaulted request fails.`,
        })
      }
    }
  }

  // (c) an enabled rule whose central list is empty (matches nothing)
  for (const [i, r] of rules.entries()) {
    if (!r.enabled) continue
    const central = centralListOf(r)
    if (central && central.values.length === 0 && r.type !== 'temporal_cutoff') {
      const title = isRuleTypeId(r.type) ? RULE_CATALOG[r.type].title : r.type
      issues.push({
        level: 'warn',
        ruleId: r.id,
        message: `Rule ${i + 1} (${title}) has an empty ${central.key} list — it matches nothing.`,
      })
    }
  }

  // (d) a disabled substitution — matching keys will not migrate
  for (const [i, r] of rules.entries()) {
    if (r.type === 'algorithm_substitution' && !r.enabled) {
      issues.push({
        level: 'warn',
        ruleId: r.id,
        message: `Rekey rule ${i + 1} (${r.scalars.from ?? '?'} → ${r.scalars.to ?? '?'}) is off — matching keys will not migrate.`,
      })
    }
  }

  // Guard: a policy with no enabled rules at all
  if (rules.length > 0 && enabled.length === 0) {
    issues.push({
      level: 'warn',
      ruleId: rules[0].id,
      message: 'Every rule is disabled — the policy allows everything.',
    })
  }

  return issues
}

/** Normalized shape for structural comparison (round-trip tests): drops the
 * editor-only ids and the enabled flag (disabled rules serialize as comments). */
export const normalized = (p: EditablePolicy): unknown => ({
  schemaVersion: p.schemaVersion,
  metadata: p.metadata,
  rules: p.rules
    .filter((r) => r.enabled)
    .map((r) => ({ type: r.type, scalars: r.scalars, lists: r.lists, maps: r.maps })),
})

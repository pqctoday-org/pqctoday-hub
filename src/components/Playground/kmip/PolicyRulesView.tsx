// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection -- trusted-input parser: all
   indices are numeric loop counters and all object keys are known string
   literals; the only data is locally-served policy YAML, no user-controlled keys. */
//
// PolicyRulesView — makes a crypto-agility policy *visible*, not just selectable.
// Renders a friendly per-rule summary (defaults / denials / substitutions) parsed
// from the policy YAML the panel already fetched, with the raw YAML available as
// the source of truth. Dependency-free (no YAML lib): the preset policies have a
// small, regular rule grammar, and the raw text is always one click away.
import { useState, type ReactNode } from 'react'
import {
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Ban,
  Sparkles,
  FileCode,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RuleSummary {
  kind: string
  label: string
  ops: string[]
  detail: string
  reason?: string
  tone: 'default' | 'deny' | 'rekey' | 'other'
}

/** One `metadata.compliance_mapping` row: a framework + an optional short tag
 *  (its `status:`, or `L<n>` from `level:`). */
interface ComplianceRow {
  framework: string
  tag?: string
}

const unquote = (s: string) => s.trim().replace(/^["']|["']$/g, '')

/** Extract `metadata.compliance_mapping` — a block of inline flow-maps like
 *  `- { framework: "FIPS 140-3", level: 3 }` / `- { framework: "CNSA-2.0", status: aligned }`.
 *  Surfaces what frameworks a policy claims to satisfy (F-1). */
function parseCompliance(yaml: string): ComplianceRow[] {
  const lines = yaml.split('\n')
  const start = lines.findIndex((l) => /^\s*compliance_mapping\s*:/.test(l))
  if (start === -1) return []
  const rows: ComplianceRow[] = []
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue
    const m = lines[i].match(/^\s*-\s*\{(.+)\}\s*$/)
    if (!m) break // dedent out of the block / next key
    const pairs: Record<string, string> = {}
    for (const part of m[1].split(',')) {
      const c = part.indexOf(':')
      if (c === -1) continue
      pairs[part.slice(0, c).trim()] = unquote(part.slice(c + 1))
    }
    if (!pairs.framework) continue
    const tag = pairs.status ?? (pairs.level ? `L${pairs.level}` : undefined)
    rows.push({ framework: pairs.framework, tag })
  }
  return rows
}

/** Extract a YAML list that is either inline (`[a, b]`) or a block of `- item`
 * lines immediately following `key:` (more indented than the enclosing rule). */
function readList(lines: string[], idx: number, inlineAfterColon: string): string[] {
  const inline = inlineAfterColon.trim()
  if (inline.startsWith('[')) {
    return inline
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map(unquote)
      .filter(Boolean)
  }
  const items: string[] = []
  for (let i = idx + 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue
    const m = lines[i].match(/^\s*-\s*(.+)$/)
    if (m && !/^\s*-\s*type\s*:/.test(lines[i])) items.push(unquote(m[1]))
    else break
  }
  return items
}

function parsePolicy(yaml: string): { name?: string; rules: RuleSummary[] } {
  const lines = yaml.split('\n')
  const nameLine = lines.find((l) => /^\s*name\s*:/.test(l))
  const name = nameLine ? unquote(nameLine.split(':').slice(1).join(':')) : undefined

  const rules: RuleSummary[] = []
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].match(/^\s*-\s*type\s*:\s*(\S+)/)
    if (!t) continue
    const kind = t[1]
    // Scan this rule's fields until the next rule or a dedent out of `rules:`.
    const fields: Record<string, string> = {}
    let ops: string[] = []
    let algorithms: string[] = []
    for (let j = i + 1; j < lines.length; j++) {
      if (/^\s*-\s*type\s*:/.test(lines[j])) break
      if (/^\S/.test(lines[j]) && lines[j].trim() !== '') break // dedent to top-level key
      const kv = lines[j].match(/^\s*([a-z_]+)\s*:(.*)$/)
      if (!kv) continue
      const key = kv[1]
      if (key === 'ops') ops = readList(lines, j, kv[2])
      else if (key === 'algorithms') algorithms = readList(lines, j, kv[2])
      else fields[key] = unquote(kv[2])
    }

    let label = kind
    let detail = ''
    let tone: RuleSummary['tone'] = 'other'
    if (kind === 'algorithm_default') {
      label = 'Default'
      detail = `→ ${fields.default_algorithm ?? '?'}`
      tone = 'default'
    } else if (kind === 'algorithm_substitution') {
      label = 'Rekey'
      detail = `${fields.from ?? '?'} → ${fields.to ?? '?'}`
      tone = 'rekey'
    } else if (kind === 'algorithm_denylist') {
      label = 'Deny'
      detail = algorithms.length ? algorithms.join(', ') : '(listed algorithms)'
      tone = 'deny'
    } else {
      detail = Object.entries(fields)
        .filter(([k]) => k !== 'reason')
        .map(([k, v]) => `${k}=${v}`)
        .join(' ')
    }
    rules.push({ kind, label, ops, detail, reason: fields.reason, tone })
  }
  return { name, rules }
}

const toneClass: Record<RuleSummary['tone'], string> = {
  default: 'border-status-success/40 bg-status-success/5',
  rekey: 'border-status-warning/40 bg-status-warning/5',
  deny: 'border-destructive/40 bg-destructive/5',
  other: 'border-border bg-muted/20',
}
const toneIcon: Record<RuleSummary['tone'], ReactNode> = {
  default: <Sparkles size={12} className="text-status-success" />,
  rekey: <ArrowRight size={12} className="text-status-warning" />,
  deny: <Ban size={12} className="text-destructive" />,
  other: <FileCode size={12} className="text-muted-foreground" />,
}

/** Renders what a policy actually enforces. `yaml` is the raw policy text. */
export function PolicyRulesView({ yaml }: { yaml: string | null }) {
  const [showSource, setShowSource] = useState(false)
  if (!yaml) {
    return (
      <p className="text-[11px] text-muted-foreground italic mt-2">
        Built-in permissive — allows everything. Pick a policy above to see its rules.
      </p>
    )
  }
  const { rules } = parsePolicy(yaml)
  const compliance = parseCompliance(yaml)
  return (
    <div className="mt-3">
      {compliance.length > 0 && (
        <div className="mb-2.5">
          <p className="text-[11px] font-semibold text-muted-foreground mb-1">
            Maps to compliance frameworks
          </p>
          <div className="flex flex-wrap items-center gap-1">
            {compliance.map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded border border-border bg-muted/30 px-1.5 py-0.5 text-[10px] text-foreground"
              >
                <ShieldCheck size={10} className="text-status-info" />
                {c.framework}
                {c.tag && <span className="text-muted-foreground">· {c.tag}</span>}
              </span>
            ))}
          </div>
        </div>
      )}
      <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
        What this policy enforces
      </p>
      {rules.length === 0 ? (
        <p className="text-[11px] text-muted-foreground italic">No rules — allows everything.</p>
      ) : (
        <div className="space-y-1.5">
          {rules.map((r, i) => (
            <div key={i} className={`rounded-md border p-2 ${toneClass[r.tone]}`}>
              <div className="flex items-center gap-1.5 text-xs">
                {toneIcon[r.tone]}
                <span className="font-semibold text-foreground">{r.label}</span>
                {r.ops.length > 0 && (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {r.ops.join(', ')}
                  </span>
                )}
                <span className="text-foreground font-mono break-all">{r.detail}</span>
              </div>
              {r.reason && (
                <p className="text-[10px] text-muted-foreground mt-0.5 ml-5">{r.reason}</p>
              )}
            </div>
          ))}
        </div>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowSource((s) => !s)}
        className="mt-2 h-auto px-1 py-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
      >
        {showSource ? <ChevronDown size={12} /> : <ChevronRight size={12} />} policy source (YAML)
      </Button>
      {showSource && (
        <pre className="mt-1 text-[10px] font-mono bg-muted/40 border border-border rounded p-2 overflow-auto max-h-56 whitespace-pre-wrap">
          {yaml}
        </pre>
      )}
    </div>
  )
}

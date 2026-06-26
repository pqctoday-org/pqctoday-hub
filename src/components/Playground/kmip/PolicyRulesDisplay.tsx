// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection -- all index keys are typed
   `RuleTone` values from the parsed model, never user input. */
//
// PolicyRulesDisplay — renders a parsed [`PolicyModel`]'s rules as a visual,
// colour-coded list. Every rule variant gets a tone (icon + colour), the ops it
// scopes to, its structured key-fact chips, and its plain-English reason. This is
// the "what this policy actually enforces" surface, in policy order.
import type { ReactNode } from 'react'
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Ban,
  KeyRound,
  Clock,
  Activity,
  Settings2,
  GitMerge,
  BadgeCheck,
  FileCode,
} from 'lucide-react'
import type { ParsedRule, RuleTone } from './policyModel'

const TONE: Record<
  RuleTone,
  { ring: string; text: string; bg: string; icon: ReactNode; group: string }
> = {
  default: {
    ring: 'border-status-success/40',
    text: 'text-status-success',
    bg: 'bg-status-success/5',
    icon: <Sparkles size={13} />,
    group: 'Resolve',
  },
  substitution: {
    ring: 'border-status-warning/40',
    text: 'text-status-warning',
    bg: 'bg-status-warning/5',
    icon: <ArrowRight size={13} />,
    group: 'Resolve',
  },
  allow: {
    ring: 'border-status-info/40',
    text: 'text-status-info',
    bg: 'bg-status-info/5',
    icon: <ShieldCheck size={13} />,
    group: 'Gate',
  },
  deny: {
    ring: 'border-destructive/40',
    text: 'text-destructive',
    bg: 'bg-destructive/5',
    icon: <Ban size={13} />,
    group: 'Gate',
  },
  require: {
    ring: 'border-primary/40',
    text: 'text-primary',
    bg: 'bg-primary/5',
    icon: <KeyRound size={13} />,
    group: 'Gate',
  },
  temporal: {
    ring: 'border-status-warning/40',
    text: 'text-status-warning',
    bg: 'bg-status-warning/5',
    icon: <Clock size={13} />,
    group: 'Time',
  },
  lifecycle: {
    ring: 'border-status-info/40',
    text: 'text-status-info',
    bg: 'bg-status-info/5',
    icon: <Activity size={13} />,
    group: 'Gate',
  },
  mechanism: {
    ring: 'border-primary/40',
    text: 'text-primary',
    bg: 'bg-primary/5',
    icon: <Settings2 size={13} />,
    group: 'Mechanism',
  },
  hybrid: {
    ring: 'border-status-success/40',
    text: 'text-status-success',
    bg: 'bg-status-success/5',
    icon: <GitMerge size={13} />,
    group: 'Resolve',
  },
  compliance: {
    ring: 'border-status-info/40',
    text: 'text-status-info',
    bg: 'bg-status-info/5',
    icon: <BadgeCheck size={13} />,
    group: 'Gate',
  },
  other: {
    ring: 'border-border',
    text: 'text-muted-foreground',
    bg: 'bg-muted/20',
    icon: <FileCode size={13} />,
    group: 'Other',
  },
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-border bg-background/60 px-1.5 py-0.5 text-[10.5px]">
      {label && <span className="text-muted-foreground">{label}</span>}
      <span className="font-mono text-foreground">{value}</span>
    </span>
  )
}

function RuleCard({ rule }: { rule: ParsedRule }) {
  const t = TONE[rule.tone]
  return (
    <div className={`rounded-lg border p-2.5 ${t.ring} ${t.bg}`}>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={t.text}>{t.icon}</span>
        <span className={`text-xs font-bold ${t.text}`}>{rule.title}</span>
        {rule.ops.length > 0 && (
          <span className="text-[10px] font-mono text-muted-foreground">{rule.ops.join(', ')}</span>
        )}
        {rule.chips.map((c, i) => (
          <Chip key={i} label={c.label} value={c.value} />
        ))}
      </div>
      {rule.algorithms.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {rule.algorithms.map((a, i) => (
            <span
              key={i}
              className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-foreground"
            >
              {a}
            </span>
          ))}
        </div>
      )}
      {rule.reason && <p className="mt-1.5 text-[11px] text-muted-foreground">{rule.reason}</p>}
    </div>
  )
}

/** Render every rule in policy order, colour-coded by family. */
export function PolicyRulesDisplay({ rules }: { rules: ParsedRule[] }) {
  if (rules.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        No rules — this policy allows every algorithm and operation.
      </p>
    )
  }
  return (
    <div className="space-y-1.5">
      {rules.map((r, i) => (
        <RuleCard key={i} rule={r} />
      ))}
    </div>
  )
}

/** A compact legend of the tone families present in a rule set. */
export function PolicyRulesLegend({ rules }: { rules: ParsedRule[] }) {
  const tones = Array.from(new Set(rules.map((r) => r.tone)))
  if (tones.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      {tones.map((tone) => {
        const t = TONE[tone]
        const count = rules.filter((r) => r.tone === tone).length
        return (
          <span
            key={tone}
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"
          >
            <span className={t.text}>{t.icon}</span>
            <span className="capitalize">{tone}</span>
            <span className="font-mono">{count}</span>
          </span>
        )
      })}
    </div>
  )
}

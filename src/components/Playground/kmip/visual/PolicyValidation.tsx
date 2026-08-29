// SPDX-License-Identifier: GPL-3.0-only
//
// PolicyValidation — the Check tab. Static lint issues (from validate()) merged
// with the engine loader's own warnings from the last apply. Click an issue to
// select the offending node.
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { EditorIssue } from './policyEditModel'

/** One `PolicyLintFinding` pre-mapped to a graph `ruleId` (C3, 2026-08-28
 * gaps-remediation plan) — the engine's own strict-mode value lint (unknown
 * algorithm/mechanism/hash/op names), authoritative and independent of the
 * client-side heuristics `issues` above catches. Rendered as errors
 * regardless of `fatal`, matching the native loader's strict-mode
 * promotion: in an authoring context, an advisory here IS the thing to fix. */
export interface StrictFinding {
  ruleId: string
  fatal: boolean
  message: string
}

interface Props {
  issues: EditorIssue[]
  /** Warnings returned by the last engine.loadPolicy of the edited policy. */
  engineWarnings: string[]
  strictFindings: StrictFinding[]
  onSelect: (ruleId: string) => void
}

export function PolicyValidation({ issues, engineWarnings, strictFindings, onSelect }: Props) {
  const total = issues.length + engineWarnings.length + strictFindings.length
  return (
    <div className="p-3.5">
      <div className="mb-2.5 flex items-center gap-2">
        {total ? (
          <AlertTriangle size={15} className="text-status-warning" />
        ) : (
          <CheckCircle2 size={15} className="text-status-success" />
        )}
        <span className="text-[12.5px] font-semibold text-foreground">Validation</span>
        <span className="ml-auto text-[11px] text-muted-foreground">
          {total ? `${total} issue${total > 1 ? 's' : ''}` : 'no conflicts'}
        </span>
      </div>

      {total === 0 && (
        <p className="text-[11.5px] text-muted-foreground">
          No conflicting, dead, or empty rules detected, and the engine accepted the policy cleanly.
        </p>
      )}

      <div className="space-y-1.5">
        {issues.map((iss, i) => {
          const isError = iss.level === 'error'
          return (
            <Button
              key={`i${i}`}
              variant="ghost"
              type="button"
              onClick={() => onSelect(iss.ruleId)}
              className={cn(
                'flex h-auto w-full items-start justify-start gap-2 rounded-lg border p-2 text-left font-normal transition-colors',
                isError
                  ? 'border-destructive/40 bg-destructive/5 hover:bg-destructive/10'
                  : 'border-status-warning/40 bg-status-warning/5 hover:bg-status-warning/10'
              )}
            >
              <AlertTriangle
                size={13}
                className={cn(
                  'mt-0.5 shrink-0',
                  isError ? 'text-destructive' : 'text-status-warning'
                )}
              />
              <span className="whitespace-normal text-[11.5px] leading-snug text-foreground">
                {iss.message}
              </span>
            </Button>
          )
        })}

        {strictFindings.map((f, i) => (
          <Button
            key={`s${i}`}
            variant="ghost"
            type="button"
            onClick={() => f.ruleId && onSelect(f.ruleId)}
            className="flex h-auto w-full items-start justify-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-2 text-left font-normal transition-colors hover:bg-destructive/10"
          >
            <AlertTriangle size={13} className="mt-0.5 shrink-0 text-destructive" />
            <span className="whitespace-normal text-[11.5px] leading-snug text-foreground">
              <span className="font-semibold">Engine lint:</span> {f.message}
            </span>
          </Button>
        ))}

        {engineWarnings.map((w, i) => (
          <div
            key={`w${i}`}
            className="flex items-start gap-2 rounded-lg border border-status-info/40 bg-status-info/5 p-2"
          >
            <Info size={13} className="mt-0.5 shrink-0 text-status-info" />
            <span className="text-[11.5px] leading-snug text-foreground">
              <span className="font-semibold">Engine:</span> {w}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

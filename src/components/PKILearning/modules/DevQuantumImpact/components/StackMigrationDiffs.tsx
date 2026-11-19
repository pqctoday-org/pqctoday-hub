// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { Code2, Copy, Check, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { STACK_MIGRATION_DIFFS, type StackMigrationDiff } from '../stackMigrationDiffs'

export const StackMigrationDiffs: React.FC = () => {
  const [selectedId, setSelectedId] = useState<StackMigrationDiff['id']>('go')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const current =
    STACK_MIGRATION_DIFFS.find((stack) => stack.id === selectedId) ?? STACK_MIGRATION_DIFFS[0]

  const handleCopy = (key: string, code: string) => {
    void navigator.clipboard?.writeText(code)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 2000)
  }

  return (
    <section
      aria-label="Before and after code migration diffs"
      className="glass-panel p-6 space-y-5"
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Code2 size={18} className="text-primary shrink-0" />
          <h3 className="text-lg font-semibold text-foreground">
            Before → After Code Migration Diffs (Late-2026 Core Stacks)
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Compare classical calls against post-quantum and hybrid replacements across Go 1.24+,
          OpenSSL 3.5+, Node.js 24+, and Java 24+ JCA. Use these reference diffs to scope API
          changes, buffer resizing, and integration tests in your own codebase.
        </p>
      </div>

      {/* Stack selector */}
      <div
        role="tablist"
        aria-label="Developer runtime stacks"
        className="flex flex-wrap gap-1 bg-muted/50 rounded-lg p-1 w-fit max-w-full"
      >
        {STACK_MIGRATION_DIFFS.map((stack) => {
          const isSelected = stack.id === current.id
          return (
            <Button
              key={stack.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              variant="ghost"
              onClick={() => setSelectedId(stack.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isSelected
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {stack.stackLabel}
            </Button>
          )
        })}
      </div>

      {/* Active stack metadata */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold text-foreground">{current.stackLabel}</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded border border-border text-muted-foreground">
            {current.runtimeFloor}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{current.summary}</p>
        <p className="text-xs font-mono text-primary">{current.sizeImpact}</p>
      </div>

      {/* Side-by-side Before / After code diff */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-status-error/40 bg-card p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-sm text-status-error">{current.beforeTitle}</h4>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground">
                {current.language}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => handleCopy(`${current.id}-before`, current.beforeCode)}
                aria-label={`Copy before code for ${current.stackLabel}`}
              >
                {copiedKey === `${current.id}-before` ? (
                  <Check size={12} className="text-status-success" />
                ) : (
                  <Copy size={12} />
                )}
              </Button>
            </div>
          </div>
          <pre className="bg-muted/50 rounded-lg p-3 overflow-x-auto text-xs font-mono text-foreground leading-relaxed">
            <code>{current.beforeCode}</code>
          </pre>
        </div>

        <div className="rounded-lg border border-status-success/40 bg-card p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-sm text-status-success">{current.afterTitle}</h4>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground">
                {current.language}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => handleCopy(`${current.id}-after`, current.afterCode)}
                aria-label={`Copy after code for ${current.stackLabel}`}
              >
                {copiedKey === `${current.id}-after` ? (
                  <Check size={12} className="text-status-success" />
                ) : (
                  <Copy size={12} />
                )}
              </Button>
            </div>
          </div>
          <pre className="bg-muted/50 rounded-lg p-3 overflow-x-auto text-xs font-mono text-foreground leading-relaxed">
            <code>{current.afterCode}</code>
          </pre>
        </div>
      </div>

      {/* Decision & verification boundary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-3 space-y-1">
          <h5 className="text-xs font-semibold uppercase tracking-wide text-foreground">
            API Capability
          </h5>
          <p className="text-xs text-muted-foreground leading-relaxed">{current.apiCapability}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 space-y-1">
          <h5 className="text-xs font-semibold uppercase tracking-wide text-foreground">
            Interoperability &amp; Fallback
          </h5>
          <p className="text-xs text-muted-foreground leading-relaxed">{current.interopCaveats}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 space-y-1">
          <div className="flex items-center gap-1.5">
            <ShieldAlert size={13} className="text-status-warning shrink-0" />
            <h5 className="text-xs font-semibold uppercase tracking-wide text-foreground">
              What This Diff Proves vs. Production Checks
            </h5>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {current.verificationBoundary}
          </p>
        </div>
      </div>
    </section>
  )
}

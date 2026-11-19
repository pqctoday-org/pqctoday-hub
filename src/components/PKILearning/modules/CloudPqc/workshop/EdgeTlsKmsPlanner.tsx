// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { AlertTriangle, CheckCircle2, RotateCcw, Terminal, ListChecks, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CUTOVER_FAILURE_MODES, CUTOVER_PHASES } from '../data/cloudPqcData'

export const EdgeTlsKmsPlanner: React.FC = () => {
  const [selectedFailureId, setSelectedFailureId] = useState<string>(CUTOVER_FAILURE_MODES[0].id)
  const [completedGates, setCompletedGates] = useState<number[]>([1])

  const activeFailure =
    CUTOVER_FAILURE_MODES.find((f) => f.id === selectedFailureId) ?? CUTOVER_FAILURE_MODES[0]

  const toggleGate = (phase: number) => {
    setCompletedGates((prev) =>
      prev.includes(phase) ? prev.filter((p) => p !== phase) : [...prev, phase]
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground flex items-start gap-2.5">
        <Info size={15} className="text-primary shrink-0 mt-0.5" />
        <span>
          <strong>Educational Cutover &amp; Failure-Mode Lab:</strong> Inspect four high-frequency
          cloud PQC cutover failure modes and practice sequencing validation gates. Sample telemetry
          below illustrates what your own staging probes, CloudTrail, and CMVP checks must confirm.
        </span>
      </div>

      {/* Failure Mode Selector */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground">
          1. Select a Cloud Cutover Failure Mode to Diagnose
        </h3>
        <div
          role="group"
          aria-label="Select cloud PQC cutover failure mode"
          className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
        >
          {CUTOVER_FAILURE_MODES.map((mode) => {
            const isSelected = mode.id === activeFailure.id
            return (
              <Button
                key={mode.id}
                variant={isSelected ? 'gradient' : 'outline'}
                size="sm"
                aria-pressed={isSelected}
                onClick={() => setSelectedFailureId(mode.id)}
                className="h-auto py-3 px-3.5 justify-start text-left whitespace-normal"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-sm">{mode.title}</div>
                  <div className="text-[11px] opacity-80">{mode.layer}</div>
                </div>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Active Failure Mode Diagnostic Card */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div>
            <h4 className="text-base font-bold text-foreground">{activeFailure.title}</h4>
            <p className="text-xs text-muted-foreground">{activeFailure.layer}</p>
          </div>
          <span
            className={`text-xs font-semibold uppercase px-2.5 py-1 rounded border ${
              activeFailure.severity === 'high'
                ? 'bg-status-error/15 text-status-error border-status-error/40'
                : 'bg-status-warning/15 text-status-warning border-status-warning/40'
            }`}
          >
            Severity: {activeFailure.severity}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-1.5">
            <p className="font-semibold text-foreground">Observed Symptom</p>
            <p className="text-muted-foreground leading-relaxed">{activeFailure.symptom}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-1.5">
            <p className="font-semibold text-foreground">Root Cause</p>
            <p className="text-muted-foreground leading-relaxed">{activeFailure.rootCause}</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/40 p-3.5 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <Terminal size={13} className="text-primary" />
            <span>Sample Staging Telemetry</span>
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[11px] text-foreground/90 bg-background/60 p-2.5 rounded border border-border/60">
            {activeFailure.sampleTelemetry}
          </pre>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="rounded-lg border border-status-success/30 bg-status-success/5 p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <CheckCircle2 size={14} className="text-status-success" />
              <span>Mitigation</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">{activeFailure.mitigation}</p>
          </div>
          <div className="rounded-lg border border-status-error/30 bg-status-error/5 p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <RotateCcw size={14} className="text-status-error" />
              <span>Rollback Trigger</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">{activeFailure.rollbackTrigger}</p>
          </div>
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <AlertTriangle size={14} className="text-primary" />
              <span>Production Verification</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">{activeFailure.productionCheck}</p>
          </div>
        </div>
      </div>

      {/* 4-Phase Cutover Sequencer */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ListChecks size={17} className="text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              2. Staged Cutover Sequencer ({completedGates.length} / {CUTOVER_PHASES.length} sample
              gates reviewed)
            </h3>
          </div>
        </div>

        <div className="space-y-2.5">
          {CUTOVER_PHASES.map((phase) => {
            const isChecked = completedGates.includes(phase.phase)
            return (
              <div
                key={phase.phase}
                className={`rounded-lg border p-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                  isChecked
                    ? 'border-status-success/40 bg-status-success/5'
                    : 'border-border bg-muted/20'
                }`}
              >
                <div className="space-y-1 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-foreground">
                      Phase {phase.phase}: {phase.title}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {phase.ownerRoles}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{phase.goal}</p>
                  <p className="text-foreground/85">
                    <strong>Exit Gate:</strong> {phase.gateCriteria}
                  </p>
                </div>
                <Button
                  variant={isChecked ? 'secondary' : 'outline'}
                  size="sm"
                  aria-pressed={isChecked}
                  onClick={() => toggleGate(phase.phase)}
                  className="shrink-0 text-xs"
                >
                  {isChecked ? 'Gate Reviewed' : 'Mark Reviewed'}
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

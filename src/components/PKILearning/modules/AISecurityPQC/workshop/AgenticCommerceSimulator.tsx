// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { ShoppingCart, ArrowRight, AlertTriangle, ShieldCheck } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { COMMERCE_FLOWS } from '../data/agentAuthData'
import { COMMERCE_ACTOR_COLORS, COMMERCE_ACTOR_LABELS } from '../data/aiSecurityConstants'
import type { CommerceActor } from '../data/aiSecurityConstants'
import { Button } from '@/components/ui/button'

const FLOW_ITEMS = COMMERCE_FLOWS.map((f) => ({ id: f.id, label: f.name }))

export const AgenticCommerceSimulator: React.FC = () => {
  const [selectedFlow, setSelectedFlow] = useState(COMMERCE_FLOWS[0].id)
  const [quantumOverlay, setQuantumOverlay] = useState(false)
  const [expandedStep, setExpandedStep] = useState<string | null>(null)

  const flow = useMemo(
    () => COMMERCE_FLOWS.find((f) => f.id === selectedFlow) ?? COMMERCE_FLOWS[0],
    [selectedFlow]
  )

  const latencyStats = useMemo(() => {
    const classical = flow.steps.reduce((sum, s) => sum + s.latencyMs, 0)
    const pqc = flow.steps.reduce((sum, s) => sum + s.pqcLatencyMs, 0)
    const overhead = classical > 0 ? ((pqc - classical) / classical) * 100 : 0
    const vulnerable = flow.steps.filter((s) => s.quantumVulnerable).length
    return { classical, pqc, overhead, vulnerable }
  }, [flow])

  const latencyVerdict = useMemo(() => {
    if (latencyStats.overhead < 5) return { label: 'Acceptable', color: 'text-status-success' }
    if (latencyStats.overhead < 15) return { label: 'Moderate', color: 'text-status-warning' }
    return { label: 'Significant', color: 'text-status-error' }
  }, [latencyStats])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-1">Agentic Commerce Simulator</h3>
        <p className="text-sm text-muted-foreground">
          Step through agent-to-agent transaction flows. Toggle the quantum overlay to identify
          vulnerable cryptographic operations and measure PQC latency impact.
        </p>
      </div>

      {/* Controls */}
      <div className="glass-panel p-4 flex flex-wrap items-center gap-4">
        <FilterDropdown
          items={FLOW_ITEMS}
          selectedId={selectedFlow}
          onSelect={(id) => setSelectedFlow(id)}
          label="Scenario"
          defaultLabel="Select Scenario"
          noContainer
        />
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            type="button"
            role="switch"
            aria-checked={quantumOverlay}
            id="quantum-overlay-switch"
            className={`w-10 h-5 rounded-full transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              quantumOverlay ? 'bg-primary' : 'bg-muted'
            }`}
            onClick={() => setQuantumOverlay(!quantumOverlay)}
          >
            <div
              className={`w-4 h-4 rounded-full bg-foreground absolute top-0.5 transition-transform ${
                quantumOverlay ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </Button>
          <label
            htmlFor="quantum-overlay-switch"
            className="text-sm text-muted-foreground cursor-pointer"
          >
            Quantum Overlay
          </label>
        </div>
      </div>

      {/* Flow description */}
      <div className="glass-panel p-4">
        <p className="text-sm text-foreground/80">{flow.description}</p>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {flow.steps.map((step) => {
          const isExpanded = expandedStep === step.id
          const borderClass = quantumOverlay
            ? step.quantumVulnerable
              ? 'border-l-4 border-l-status-error'
              : 'border-l-4 border-l-status-success'
            : ''

          return (
            <div key={step.id} className={`glass-panel overflow-hidden ${borderClass}`}>
              <Button
                variant="ghost"
                onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm font-bold text-muted-foreground w-6 shrink-0">
                    {step.order}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold shrink-0 ${COMMERCE_ACTOR_COLORS[step.fromActor as CommerceActor]}`}
                  >
                    {COMMERCE_ACTOR_LABELS[step.fromActor as CommerceActor]}
                  </span>
                  <ArrowRight size={12} className="text-muted-foreground shrink-0" />
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold shrink-0 ${COMMERCE_ACTOR_COLORS[step.toActor as CommerceActor]}`}
                  >
                    {COMMERCE_ACTOR_LABELS[step.toActor as CommerceActor]}
                  </span>
                  <span className="text-sm text-foreground truncate ml-2">{step.label}</span>
                </div>
                {quantumOverlay && (
                  <span className="shrink-0 ml-2">
                    {step.quantumVulnerable ? (
                      <AlertTriangle size={16} className="text-status-error" />
                    ) : (
                      <ShieldCheck size={16} className="text-status-success" />
                    )}
                  </span>
                )}
              </Button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border pt-4 space-y-3">
                  <p className="text-sm text-foreground/80">{step.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {step.cryptoUsed.map((c, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded border font-mono bg-muted text-muted-foreground border-border"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  {step.pqcReplacement && (
                    <p className="text-xs">
                      <span className="text-muted-foreground">PQC Replacement: </span>
                      <span className="text-status-success font-mono">{step.pqcReplacement}</span>
                    </p>
                  )}
                  <div className="flex gap-6 text-xs">
                    <div>
                      <span className="text-muted-foreground">Classical: </span>
                      <span className="text-foreground font-mono">{step.latencyMs}ms</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">PQC: </span>
                      <span className="text-foreground font-mono">{step.pqcLatencyMs}ms</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Latency analysis */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <ShoppingCart size={16} className="text-primary" />
          Latency Analysis
        </h4>

        {/* Bar chart */}
        <div className="space-y-2 mb-4">
          {flow.steps.map((step) => {
            const maxLatency = Math.max(
              ...flow.steps.map((s) => Math.max(s.latencyMs, s.pqcLatencyMs))
            )
            return (
              <div key={step.id} className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground w-20 truncate shrink-0">
                  Step {step.order}
                </span>
                <div className="flex-1 space-y-0.5">
                  <div
                    className="h-2 rounded bg-muted-foreground/40"
                    style={{ width: `${(step.latencyMs / maxLatency) * 100}%` }}
                  />
                  <div
                    className="h-2 rounded bg-primary"
                    style={{ width: `${(step.pqcLatencyMs / maxLatency) * 100}%` }}
                  />
                </div>
                <span className="text-muted-foreground w-16 text-right shrink-0">
                  {step.latencyMs}/{step.pqcLatencyMs}ms
                </span>
              </div>
            )
          })}
          <div className="flex gap-4 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <div className="w-3 h-2 rounded bg-muted-foreground/40" /> Classical
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-2 rounded bg-primary" /> PQC
            </span>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold text-foreground">{latencyStats.classical}ms</p>
            <p className="text-xs text-muted-foreground">Classical Total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{latencyStats.pqc}ms</p>
            <p className="text-xs text-muted-foreground">PQC Total</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${latencyVerdict.color}`}>
              +{latencyStats.overhead.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Overhead</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${latencyVerdict.color}`}>{latencyVerdict.label}</p>
            <p className="text-xs text-muted-foreground">Verdict</p>
          </div>
        </div>
      </div>
    </div>
  )
}

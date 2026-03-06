// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState } from 'react'
import { ChevronRight, Eye, EyeOff } from 'lucide-react'
import { CHAIN_SCENARIOS } from '../data'
import type { ChainNode } from '../data'

// ChainAnswers: scenarioId → nodeId → revealed
export type ChainAnswers = Record<string, Record<string, boolean>>

interface StandardsCertChainProps {
  answers: ChainAnswers
  onAnswersChange: (answers: ChainAnswers) => void
}

function roleLabel(role: ChainNode['role']): string {
  switch (role) {
    case 'standard':
      return 'Standard'
    case 'certification':
      return 'Certification'
    case 'compliance':
      return 'Compliance'
  }
}

function roleBadgeClass(role: ChainNode['role']): string {
  switch (role) {
    case 'standard':
      return 'bg-primary/10 text-primary border-primary/30'
    case 'certification':
      return 'bg-status-info/10 text-status-info border-status-info/30'
    case 'compliance':
      return 'bg-status-warning/10 text-status-warning border-status-warning/30'
  }
}

export const StandardsCertChain: React.FC<StandardsCertChainProps> = ({
  answers,
  onAnswersChange,
}) => {
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0)

  const activeScenario = CHAIN_SCENARIOS[activeScenarioIdx]

  const toggleNode = (scenarioId: string, nodeId: string) => {
    const scenarioAnswers = answers[scenarioId] ?? {}
    const updated: ChainAnswers = {
      ...answers,
      [scenarioId]: {
        ...scenarioAnswers,
        [nodeId]: !scenarioAnswers[nodeId],
      },
    }
    onAnswersChange(updated)
  }

  const revealedCount = Object.values(answers[activeScenario.id] ?? {}).filter(Boolean).length
  const totalNodes = activeScenario.nodes.length

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Trace the chain from algorithm standard to certification program to compliance mandate.
        Click <strong>Reveal</strong> on each node to see the full explanation.
      </p>

      {/* Scenario tabs */}
      <div className="flex flex-wrap gap-2">
        {CHAIN_SCENARIOS.map((scenario, idx) => (
          <button
            key={scenario.id}
            onClick={() => setActiveScenarioIdx(idx)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors
              ${
                idx === activeScenarioIdx
                  ? 'bg-primary/10 border-primary/40 text-primary font-semibold'
                  : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
          >
            {idx + 1}. {scenario.title}
          </button>
        ))}
      </div>

      {/* Context */}
      <div className="bg-muted/40 rounded-lg p-4 border border-border">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          Scenario Context
        </div>
        <p className="text-sm text-foreground">{activeScenario.context}</p>
      </div>

      {/* Reveal progress */}
      <div className="text-xs text-muted-foreground text-right">
        {revealedCount} / {totalNodes} nodes revealed
      </div>

      {/* Chain nodes */}
      <div className="flex flex-col md:flex-row items-stretch gap-3 md:gap-0">
        {activeScenario.nodes.map((node, idx) => {
          const isRevealed = (answers[activeScenario.id] ?? {})[node.id] ?? false
          return (
            <React.Fragment key={node.id}>
              {/* Node card */}
              <div
                className={`flex-1 rounded-xl border p-4 space-y-3 transition-colors ${
                  isRevealed ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/20'
                }`}
              >
                {/* Role badge + step number */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${roleBadgeClass(node.role)}`}
                  >
                    {roleLabel(node.role)}
                  </span>
                  <span className="text-xs text-muted-foreground">Step {idx + 1}</span>
                </div>

                {/* Label and body */}
                <div>
                  <div className="font-bold text-foreground text-sm">{node.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">By: {node.body}</div>
                </div>

                {/* Revealed description */}
                {isRevealed && (
                  <div className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">
                    {node.description}
                  </div>
                )}

                {/* Reveal button */}
                <button
                  onClick={() => toggleNode(activeScenario.id, node.id)}
                  className={`w-full flex items-center justify-center gap-1.5 text-xs py-1.5 rounded border transition-colors
                    ${
                      isRevealed
                        ? 'border-primary/30 text-primary hover:bg-primary/5'
                        : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                    }`}
                >
                  {isRevealed ? (
                    <>
                      <EyeOff size={12} />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye size={12} />
                      Reveal
                    </>
                  )}
                </button>
              </div>

              {/* Arrow between nodes */}
              {idx < activeScenario.nodes.length - 1 && (
                <div className="flex items-center justify-center px-1 md:px-2 py-1 md:py-0">
                  <ChevronRight
                    size={20}
                    className="rotate-90 md:rotate-0 text-muted-foreground shrink-0"
                  />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* All revealed summary */}
      {revealedCount === totalNodes && (
        <div className="bg-status-success/10 border border-status-success/30 rounded-lg p-4 text-center">
          <p className="text-sm text-status-success font-semibold">
            Chain complete! You can see the full {activeScenario.title} compliance pipeline.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Try the next scenario tab above to explore another standards chain.
          </p>
        </div>
      )}
    </div>
  )
}

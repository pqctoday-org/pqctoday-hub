// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState } from 'react'
import { CheckCircle2, ChevronRight, Eye, EyeOff, XCircle } from 'lucide-react'
import { CHAIN_SCENARIOS } from '../data'
import type { ChainNode } from '../data'
import { Button } from '@/components/ui/button'

type ChainRole = ChainNode['role']

// What the learner has done on one node: the job they picked for it (right or wrong; the last
// pick counts) and whether they opened its explanation.
export interface ChainNodeState {
  guess?: ChainRole
  revealed?: boolean
}

// ChainAnswers: scenarioId → nodeId → state
export type ChainAnswers = Record<string, Record<string, ChainNodeState>>

interface StandardsCertChainProps {
  answers: ChainAnswers
  onAnswersChange: (answers: ChainAnswers) => void
}

const ROLES: ChainRole[] = ['standard', 'certification', 'compliance']

function roleLabel(role: ChainRole): string {
  switch (role) {
    case 'standard':
      return 'Standard'
    case 'certification':
      return 'Certification'
    case 'compliance':
      return 'Compliance'
  }
}

// The one-line meaning of each job, shown in the legend and in the feedback on a wrong pick.
function roleMeaning(role: ChainRole): string {
  switch (role) {
    case 'standard':
      return 'publishes the technical specification'
    case 'certification':
      return 'checks that a product or module meets the specification'
    case 'compliance':
      return 'makes the requirement binding on an organization or a purchase'
  }
}

function roleBadgeClass(role: ChainRole): string {
  switch (role) {
    case 'standard':
      return 'bg-primary/10 text-primary border-primary/30'
    case 'certification':
      return 'bg-status-info/10 text-status-info border-status-info/30'
    case 'compliance':
      return 'bg-status-warning/10 text-status-warning border-status-warning/30'
  }
}

// The three links are shown in this mixed order until each has been placed, so the position
// on screen does not give the job away: compliance, standard, certification.
const MIXED_ORDER = [2, 0, 1] as const

export const StandardsCertChain: React.FC<StandardsCertChainProps> = ({
  answers,
  onAnswersChange,
}) => {
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0)

  const activeScenario = CHAIN_SCENARIOS[activeScenarioIdx]
  const scenarioState = answers[activeScenario.id] ?? {}

  const updateNode = (scenarioId: string, nodeId: string, patch: Partial<ChainNodeState>) => {
    const current = answers[scenarioId] ?? {}
    onAnswersChange({
      ...answers,
      [scenarioId]: { ...current, [nodeId]: { ...current[nodeId], ...patch } },
    })
  }

  const isPlaced = (node: ChainNode) => scenarioState[node.id]?.guess === node.role
  const placedCount = activeScenario.nodes.filter(isPlaced).length
  const totalNodes = activeScenario.nodes.length
  const chainComplete = placedCount === totalNodes

  // Once every link is placed the chain falls into its real order; until then it is mixed.
  const shown = chainComplete
    ? activeScenario.nodes.map((node, idx) => ({ node, idx }))
    : MIXED_ORDER.map((i) => ({ node: activeScenario.nodes[i], idx: i }))

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Each scenario below is one chain from algorithm standard to certification programme to
        compliance mandate, with its three links shown in mixed order. For each link, decide which
        job it does. You get feedback straight away, and a link you place correctly can be opened to
        read why. When all three are placed, the chain falls into order.
      </p>

      <ul className="grid gap-1 text-xs text-muted-foreground md:grid-cols-3" aria-label="The jobs">
        {ROLES.map((role) => (
          <li key={role}>
            <span
              className={`mr-1.5 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${roleBadgeClass(role)}`}
            >
              {roleLabel(role)}
            </span>
            {roleMeaning(role)}
          </li>
        ))}
      </ul>

      {/* Scenario tabs */}
      <div className="flex flex-wrap gap-2">
        {CHAIN_SCENARIOS.map((scenario, idx) => (
          <Button
            variant="ghost"
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
          </Button>
        ))}
      </div>

      {/* Context */}
      <div className="bg-muted/40 rounded-lg p-4 border border-border">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          Scenario Context
        </div>
        <p className="text-sm text-foreground">{activeScenario.context}</p>
      </div>

      {/* Placement progress */}
      <div className="text-xs text-muted-foreground text-right" aria-live="polite">
        {placedCount} / {totalNodes} links placed correctly
      </div>

      {/* Chain nodes */}
      <div
        className={`flex flex-col md:flex-row items-stretch gap-3 ${chainComplete ? 'md:gap-0' : ''}`}
      >
        {shown.map(({ node, idx }, pos) => {
          const state = scenarioState[node.id] ?? {}
          const placed = isPlaced(node)
          const wrongGuess = state.guess && !placed ? state.guess : undefined
          const isRevealed = placed && (state.revealed ?? false)
          return (
            <React.Fragment key={node.id}>
              {/* Node card */}
              <div
                className={`flex-1 rounded-xl border p-4 space-y-3 transition-colors ${
                  placed ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/20'
                }`}
              >
                {/* Job badge + step number, only once the link is placed */}
                <div className="flex items-center justify-between min-h-6">
                  {placed ? (
                    <>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${roleBadgeClass(node.role)}`}
                      >
                        {roleLabel(node.role)}
                      </span>
                      <span className="text-xs text-muted-foreground">Step {idx + 1}</span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">Which job does it do?</span>
                  )}
                </div>

                {/* Label and body */}
                <div>
                  <div className="font-bold text-foreground text-sm">{node.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">By: {node.body}</div>
                </div>

                {/* The decision: pick the job */}
                {!placed && (
                  <div className="space-y-2">
                    <div
                      role="group"
                      aria-label={`Job of ${node.label}`}
                      className="flex flex-wrap gap-1.5"
                    >
                      {ROLES.map((role) => (
                        <Button
                          key={role}
                          variant="ghost"
                          aria-pressed={state.guess === role}
                          onClick={() => updateNode(activeScenario.id, node.id, { guess: role })}
                          className={`px-2 py-1 rounded border text-xs transition-colors ${
                            state.guess === role
                              ? 'border-status-error/40 text-status-error'
                              : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                          }`}
                        >
                          {roleLabel(role)}
                        </Button>
                      ))}
                    </div>
                    {wrongGuess && (
                      <p
                        role="status"
                        className="flex items-start gap-1.5 text-xs text-status-error"
                      >
                        <XCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                        <span>
                          Not quite. A {roleLabel(wrongGuess).toLowerCase()} link{' '}
                          {roleMeaning(wrongGuess)}; {node.label} does a different job. Try another.
                        </span>
                      </p>
                    )}
                  </div>
                )}

                {placed && (
                  <p
                    role="status"
                    className="flex items-center gap-1.5 text-xs text-status-success font-semibold"
                  >
                    <CheckCircle2 size={14} aria-hidden="true" />
                    Correct: it {roleMeaning(node.role)}.
                  </p>
                )}

                {/* Revealed description */}
                {isRevealed && (
                  <div className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">
                    {node.description}
                  </div>
                )}

                {/* Reveal button, once the link is placed */}
                {placed && (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      updateNode(activeScenario.id, node.id, { revealed: !state.revealed })
                    }
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
                  </Button>
                )}
              </div>

              {/* Arrow between nodes, once the chain is in order */}
              {chainComplete && pos < shown.length - 1 && (
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

      {/* All placed summary */}
      {chainComplete && (
        <div className="bg-status-success/10 border border-status-success/30 rounded-lg p-4 text-center">
          <p className="text-sm text-status-success font-semibold">
            Chain complete! You can see the full {activeScenario.title} compliance pipeline.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Open each link to read why, then try the next scenario tab above.
          </p>
        </div>
      )}
    </div>
  )
}

// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle, XCircle, Eye } from 'lucide-react'
import {
  CLASSIFICATION_SCENARIOS,
  SENSITIVITY_TIERS,
  type DataAsset,
  type SensitivityTier,
} from '../data/sensitivityConstants'

interface ClassificationChallengeProps {
  assets: DataAsset[]
}

const TIER_ORDER: SensitivityTier[] = ['low', 'medium', 'high', 'critical']

export const ClassificationChallenge: React.FC<ClassificationChallengeProps> = ({ assets }) => {
  const [answers, setAnswers] = useState<Record<string, SensitivityTier | null>>({})
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [referenceOpen, setReferenceOpen] = useState(false)

  const handleSelect = (scenarioId: string, tier: SensitivityTier) => {
    if (revealed.has(scenarioId)) return
    setAnswers((prev) => ({ ...prev, [scenarioId]: tier }))
    setRevealed((prev) => new Set([...prev, scenarioId]))
  }

  const revealAll = () => {
    setAnswers((prev) => {
      const next = { ...prev }
      for (const s of CLASSIFICATION_SCENARIOS) {
        if (!next[s.id]) next[s.id] = null
      }
      return next
    })
    setRevealed(new Set(CLASSIFICATION_SCENARIOS.map((s) => s.id)))
  }

  const answered = CLASSIFICATION_SCENARIOS.filter((s) => revealed.has(s.id))
  const correct = answered.filter(
    (s) => answers[s.id] !== null && answers[s.id] === s.correctTier
  ).length
  const scored = answered.filter((s) => answers[s.id] !== null).length

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="bg-status-info/10 border border-status-info/30 rounded-lg p-4">
        <p className="text-sm text-foreground">
          <span className="font-semibold text-status-info">Challenge:</span> Classify each data
          scenario using the four-tier sensitivity model (Low / Medium / High / Critical). Select
          your answer to reveal immediate feedback, the HNDL implication, and which compliance
          frameworks apply. Your Step 1 assets are available as a reference below.
        </p>
      </div>

      {/* Reference Panel — user's Step 1 assets */}
      <div className="border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => setReferenceOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-muted hover:bg-muted/80 transition-colors text-sm font-medium text-foreground"
        >
          <span>
            Your Asset Inventory (Step 1) — {assets.length} asset{assets.length !== 1 ? 's' : ''}
          </span>
          {referenceOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {referenceOpen && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-2 text-muted-foreground font-medium">Asset</th>
                  <th className="text-left px-4 py-2 text-muted-foreground font-medium">Type</th>
                  <th className="text-left px-4 py-2 text-muted-foreground font-medium">Tier</th>
                  <th className="text-left px-4 py-2 text-muted-foreground font-medium">
                    Retention
                  </th>
                  <th className="text-left px-4 py-2 text-muted-foreground font-medium">
                    Encryption
                  </th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => {
                  const tierCfg = SENSITIVITY_TIERS.find((t) => t.id === a.sensitivityTier)
                  return (
                    <tr key={a.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 font-medium text-foreground">{a.name}</td>
                      <td className="px-4 py-2 text-muted-foreground capitalize">
                        {a.assetType.replace('-', ' ')}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tierCfg?.bgClass ?? ''} ${tierCfg?.colorClass ?? ''}`}
                        >
                          {tierCfg?.label ?? a.sensitivityTier}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{a.retentionPeriod}</td>
                      <td className="px-4 py-2 text-muted-foreground text-xs">
                        {a.currentEncryption}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Score bar + Reveal All */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Answered:{' '}
            <span className="font-semibold text-foreground">
              {answered.length}/{CLASSIFICATION_SCENARIOS.length}
            </span>
          </span>
          {scored > 0 && (
            <span className="text-sm text-muted-foreground">
              Score:{' '}
              <span
                className={`font-semibold ${correct === scored ? 'text-status-success' : correct >= scored * 0.7 ? 'text-status-warning' : 'text-status-error'}`}
              >
                {correct}/{scored}
              </span>
            </span>
          )}
        </div>
        <button
          onClick={revealAll}
          disabled={revealed.size === CLASSIFICATION_SCENARIOS.length}
          className="flex items-center gap-2 text-sm px-3 py-1.5 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-40 text-foreground"
        >
          <Eye size={14} />
          Reveal All
        </button>
      </div>

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {CLASSIFICATION_SCENARIOS.map((scenario) => {
          const isRevealed = revealed.has(scenario.id)
          const userAnswer = answers[scenario.id]
          const isCorrect = userAnswer !== null && userAnswer === scenario.correctTier
          const correctCfg = SENSITIVITY_TIERS.find((t) => t.id === scenario.correctTier)

          return (
            <div
              key={scenario.id}
              className={`border rounded-lg overflow-hidden transition-all ${
                isRevealed
                  ? isCorrect
                    ? 'border-status-success/50'
                    : userAnswer === null
                      ? 'border-border'
                      : 'border-status-error/50'
                  : 'border-border'
              }`}
            >
              {/* Card header */}
              <div className="px-4 py-3 bg-muted/40 border-b border-border">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground leading-snug">
                    {scenario.title}
                  </h3>
                  {isRevealed && (
                    <span className="shrink-0">
                      {isCorrect ? (
                        <CheckCircle size={18} className="text-status-success" />
                      ) : userAnswer === null ? (
                        <Eye size={18} className="text-muted-foreground" />
                      ) : (
                        <XCircle size={18} className="text-status-error" />
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Card body */}
              <div className="px-4 py-3 space-y-3">
                <p className="text-sm text-foreground leading-relaxed">{scenario.description}</p>
                <p className="text-xs text-muted-foreground italic">{scenario.context}</p>

                {/* Tier buttons */}
                {!isRevealed && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {TIER_ORDER.map((tier) => {
                      const cfg = SENSITIVITY_TIERS.find((t) => t.id === tier)
                      return (
                        <button
                          key={tier}
                          onClick={() => handleSelect(scenario.id, tier)}
                          className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors min-w-[70px] ${cfg?.bgClass ?? ''} ${cfg?.colorClass ?? ''} ${cfg?.borderClass ?? ''} hover:opacity-80`}
                        >
                          {cfg?.label ?? tier}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Revealed feedback */}
                {isRevealed && (
                  <div className="space-y-2 pt-1">
                    {/* Result banner */}
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold ${correctCfg?.bgClass ?? ''} ${correctCfg?.colorClass ?? ''} border ${correctCfg?.borderClass ?? ''}`}
                    >
                      <span>Correct tier:</span>
                      <span className="font-bold">{correctCfg?.label ?? scenario.correctTier}</span>
                      {userAnswer !== null && !isCorrect && (
                        <span className="ml-auto text-status-error font-normal">
                          You answered:{' '}
                          <span className="font-semibold">
                            {SENSITIVITY_TIERS.find((t) => t.id === userAnswer)?.label ??
                              userAnswer}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Explanation */}
                    <div className="bg-muted/40 rounded-md px-3 py-2 space-y-1.5">
                      <p className="text-xs text-foreground leading-relaxed">
                        {scenario.explanation}
                      </p>
                      <p className="text-xs text-status-warning font-medium">
                        HNDL: {scenario.hndlImplication}
                      </p>
                      {userAnswer !== null && !isCorrect && (
                        <p className="text-xs text-muted-foreground italic">
                          Common mistake: {scenario.commonMistake}
                        </p>
                      )}
                    </div>

                    {/* Frameworks */}
                    {scenario.relevantFrameworks.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {scenario.relevantFrameworks.map((fw) => (
                          <span
                            key={fw}
                            className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                          >
                            {fw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Final score summary */}
      {answered.length === CLASSIFICATION_SCENARIOS.length && (
        <div
          className={`border rounded-lg p-4 text-center space-y-1 ${
            correct >= 8
              ? 'border-status-success/40 bg-status-success/10'
              : correct >= 5
                ? 'border-status-warning/40 bg-status-warning/10'
                : 'border-status-error/40 bg-status-error/10'
          }`}
        >
          <p
            className={`text-2xl font-bold ${
              correct >= 8
                ? 'text-status-success'
                : correct >= 5
                  ? 'text-status-warning'
                  : 'text-status-error'
            }`}
          >
            {scored > 0 ? `${correct} / ${scored}` : '— / —'}
          </p>
          <p className="text-sm text-muted-foreground">
            {scored === 0
              ? 'Answers revealed without scoring'
              : correct >= 8
                ? 'Excellent — strong grasp of sensitivity tier distinctions'
                : correct >= 5
                  ? 'Good — review the edge cases around key material and retention periods'
                  : 'Keep going — focus on how retention period and asset type interact with tier selection'}
          </p>
        </div>
      )}
    </div>
  )
}

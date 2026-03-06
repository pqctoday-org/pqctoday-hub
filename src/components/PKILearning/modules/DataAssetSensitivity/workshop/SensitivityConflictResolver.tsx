// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import {
  CONFLICT_SCENARIOS,
  SENSITIVITY_TIERS,
  type DataAsset,
  type SensitivityTier,
  type ConflictResolutionRule,
} from '../data/sensitivityConstants'

interface SensitivityConflictResolverProps {
  assets: DataAsset[]
}

const TIER_ORDER: SensitivityTier[] = ['low', 'medium', 'high', 'critical']

const RULE_LABELS: Record<
  ConflictResolutionRule,
  { label: string; description: string; color: string }
> = {
  'most-restrictive': {
    label: 'Most Restrictive Wins',
    description:
      'When multiple frameworks apply, always adopt the highest sensitivity tier prescribed by any single framework.',
    color: 'text-status-error',
  },
  'jurisdiction-priority': {
    label: 'Jurisdiction Priority',
    description:
      'When a jurisdiction-specific regulation designates a system as critical infrastructure or ICT service, that designation overrides narrower data-centric classifications.',
    color: 'text-status-warning',
  },
  'data-subject-location': {
    label: 'Data Subject Location',
    description:
      'Apply the requirements of the law governing the jurisdiction where each data subject resides — even if data processing happens elsewhere.',
    color: 'text-primary',
  },
  'asset-type-override': {
    label: 'Asset Type Override',
    description:
      'Key material and cryptographic assets are always classified at the highest applicable tier, independent of the sensitivity of the data they protect.',
    color: 'text-status-info',
  },
}

export const SensitivityConflictResolver: React.FC<SensitivityConflictResolverProps> = ({
  assets,
}) => {
  const [answers, setAnswers] = useState<Record<string, SensitivityTier | null>>({})
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [rulesOpen, setRulesOpen] = useState(true)

  const handleSelect = (scenarioId: string, tier: SensitivityTier) => {
    if (revealed.has(scenarioId)) return
    setAnswers((prev) => ({ ...prev, [scenarioId]: tier }))
    setRevealed((prev) => new Set([...prev, scenarioId]))
  }

  const answered = CONFLICT_SCENARIOS.filter((s) => revealed.has(s.id))
  const correct = answered.filter(
    (s) => answers[s.id] !== null && answers[s.id] === s.correctTier
  ).length
  const scored = answered.filter((s) => answers[s.id] !== null).length

  // Personalized analysis: find Step 1 assets with multi-framework compliance flags
  const conflictedAssets = useMemo(
    () =>
      assets
        .filter((a) => a.complianceFlags.length >= 2)
        .map((a) => {
          const tier = SENSITIVITY_TIERS.find((t) => t.id === a.sensitivityTier)
          // Check if any asset type is key material — escalation may apply
          const hasKeyMaterial = a.assetType === 'key-material'
          const hasHighUrgency = a.complianceFlags.some((f) =>
            ['CNSA-2.0', 'FIPS-140-3', 'DORA', 'NIS2'].includes(f)
          )
          return { asset: a, tier, hasKeyMaterial, hasHighUrgency }
        }),
    [assets]
  )

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="bg-status-info/10 border border-status-info/30 rounded-lg p-4">
        <p className="text-sm text-foreground">
          <span className="font-semibold text-status-info">Challenge:</span> Each scenario below
          involves a data asset subject to multiple overlapping compliance frameworks that prescribe
          different sensitivity tiers. Determine the correct governing classification using the four
          resolution rules. Select your answer to reveal the reasoning.
        </p>
      </div>

      {/* Resolution Rules */}
      <div className="border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => setRulesOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-muted hover:bg-muted/80 transition-colors text-sm font-semibold text-foreground"
        >
          <span>Four Resolution Rules</span>
          {rulesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {rulesOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-border">
            {(
              Object.entries(RULE_LABELS) as [
                ConflictResolutionRule,
                (typeof RULE_LABELS)[ConflictResolutionRule],
              ][]
            ).map(([rule, { label, description, color }]) => (
              <div key={rule} className="px-4 py-3 space-y-1">
                <p className={`text-xs font-bold ${color}`}>{label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Score bar */}
      {scored > 0 && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Score:{' '}
            <span
              className={`font-semibold ${correct === scored ? 'text-status-success' : correct >= scored * 0.7 ? 'text-status-warning' : 'text-status-error'}`}
            >
              {correct}/{scored}
            </span>
          </span>
          <span className="text-sm text-muted-foreground">
            Answered:{' '}
            <span className="font-semibold text-foreground">
              {answered.length}/{CONFLICT_SCENARIOS.length}
            </span>
          </span>
        </div>
      )}

      {/* Scenario Cards */}
      <div className="space-y-4">
        {CONFLICT_SCENARIOS.map((scenario) => {
          const isRevealed = revealed.has(scenario.id)
          const userAnswer = answers[scenario.id]
          const isCorrect = userAnswer !== null && userAnswer === scenario.correctTier
          const correctCfg = SENSITIVITY_TIERS.find((t) => t.id === scenario.correctTier)
          const ruleInfo = RULE_LABELS[scenario.resolutionRule]

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
                      ) : (
                        <XCircle size={18} className="text-status-error" />
                      )}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{scenario.assetDescription}</p>
              </div>

              {/* Card body */}
              <div className="px-4 py-3 space-y-3">
                {/* Conflicting requirements table */}
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">
                          Framework
                        </th>
                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">
                          Prescribed Tier
                        </th>
                        <th className="text-left px-3 py-2 text-muted-foreground font-medium hidden sm:table-cell">
                          Reason
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {scenario.conflictingRequirements.map((req, i) => {
                        const reqCfg = SENSITIVITY_TIERS.find((t) => t.id === req.prescribedTier)
                        return (
                          <tr key={i} className="border-b border-border last:border-0">
                            <td className="px-3 py-2 font-semibold text-foreground whitespace-nowrap">
                              {req.framework}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`font-semibold px-1.5 py-0.5 rounded ${reqCfg?.bgClass ?? ''} ${reqCfg?.colorClass ?? ''}`}
                              >
                                {reqCfg?.label ?? req.prescribedTier}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell leading-relaxed">
                              {req.reason}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Tier selection buttons */}
                {!isRevealed && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      What is the governing sensitivity tier for this asset?
                    </p>
                    <div className="flex flex-wrap gap-2">
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
                  </div>
                )}

                {/* Revealed feedback */}
                {isRevealed && (
                  <div className="space-y-2">
                    {/* Result banner */}
                    <div
                      className={`flex flex-wrap items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold ${correctCfg?.bgClass ?? ''} ${correctCfg?.colorClass ?? ''} border ${correctCfg?.borderClass ?? ''}`}
                    >
                      <span>Governing tier:</span>
                      <span className="font-bold">{correctCfg?.label ?? scenario.correctTier}</span>
                      <span className="text-muted-foreground font-normal">
                        via {scenario.governingFramework}
                      </span>
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

                    {/* Resolution rule badge */}
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${ruleInfo.color}`}>
                        Rule: {ruleInfo.label}
                      </span>
                    </div>

                    {/* Explanation */}
                    <div className="bg-muted/40 rounded-md px-3 py-2 space-y-1.5">
                      <p className="text-xs text-foreground leading-relaxed">
                        {scenario.explanation}
                      </p>
                      <p className="text-xs text-primary font-medium">
                        PQC: {scenario.pqcImplication}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Personalized Analysis */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-muted/40 border-b border-border flex items-center gap-2">
          <AlertTriangle size={16} className="text-status-warning" />
          <h3 className="text-sm font-semibold text-foreground">
            Your Asset Conflicts (from Step 1)
          </h3>
        </div>
        <div className="px-4 py-3">
          {conflictedAssets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              None of your Step 1 assets have multiple compliance flags — no multi-framework
              conflicts to resolve. Try adding more compliance flags in Step 1 (e.g., combine GDPR +
              HIPAA, or FIPS-140-3 + CNSA-2.0) to see how conflicts are resolved.
            </p>
          ) : (
            <ul className="space-y-3">
              {conflictedAssets.map(({ asset, tier, hasKeyMaterial, hasHighUrgency }) => (
                <li key={asset.id} className="border border-border rounded-md px-3 py-2 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{asset.name}</span>
                    <span
                      className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${tier?.bgClass ?? ''} ${tier?.colorClass ?? ''}`}
                    >
                      {tier?.label ?? asset.sensitivityTier} (current)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {asset.complianceFlags.map((f) => (
                      <span
                        key={f}
                        className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {hasKeyMaterial && (
                      <span className="text-status-warning font-medium">
                        Asset type is key material — apply asset-type-override rule.{' '}
                      </span>
                    )}
                    {hasHighUrgency && (
                      <span className="text-status-error font-medium">
                        Contains urgent framework (CNSA-2.0/FIPS-140-3/DORA/NIS2) — verify
                        most-restrictive rule has been applied.{' '}
                      </span>
                    )}
                    {!hasKeyMaterial && !hasHighUrgency && (
                      <span>
                        Multiple frameworks apply — confirm the most restrictive tier is selected.
                      </span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Final score */}
      {answered.length === CONFLICT_SCENARIOS.length && scored > 0 && (
        <div
          className={`border rounded-lg p-4 text-center space-y-1 ${
            correct >= 5
              ? 'border-status-success/40 bg-status-success/10'
              : correct >= 3
                ? 'border-status-warning/40 bg-status-warning/10'
                : 'border-status-error/40 bg-status-error/10'
          }`}
        >
          <p
            className={`text-2xl font-bold ${
              correct >= 5
                ? 'text-status-success'
                : correct >= 3
                  ? 'text-status-warning'
                  : 'text-status-error'
            }`}
          >
            {correct} / {scored}
          </p>
          <p className="text-sm text-muted-foreground">
            {correct >= 5
              ? 'Excellent — you can navigate multi-framework classification conflicts confidently'
              : correct >= 3
                ? 'Good — review the asset-type-override and jurisdiction-priority rules'
                : 'Keep going — focus on which rule applies in each scenario type'}
          </p>
        </div>
      )}
    </div>
  )
}

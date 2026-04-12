// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CLASSIFY_CARDS } from '../data'
import type { OrgType, OrgScope, OrgAuthority } from '../data'

export interface ClassifyResult {
  cardId: string
  selectedType: OrgType | null
  selectedScope: OrgScope | null
  selectedAuthority: OrgAuthority | null
  submitted: boolean
}

interface BodyClassifierProps {
  results: ClassifyResult[]
  onResultsChange: (results: ClassifyResult[]) => void
}

const TYPE_OPTIONS: { id: OrgType; label: string }[] = [
  { id: 'standards-body', label: 'Standards Body' },
  { id: 'certification-body', label: 'Certification Body' },
  { id: 'compliance-framework', label: 'Compliance Framework' },
  { id: 'regulatory-agency', label: 'Regulatory Agency' },
]

const SCOPE_OPTIONS: { id: OrgScope; label: string }[] = [
  { id: 'global', label: 'Global' },
  { id: 'regional', label: 'Regional' },
]

const AUTHORITY_OPTIONS: { id: OrgAuthority; label: string }[] = [
  { id: 'governmental', label: 'Governmental' },
  { id: 'non-governmental', label: 'Non-Governmental' },
]

function initResults(): ClassifyResult[] {
  return CLASSIFY_CARDS.map((card) => ({
    cardId: card.id,
    selectedType: null,
    selectedScope: null,
    selectedAuthority: null,
    submitted: false,
  }))
}

export const BodyClassifier: React.FC<BodyClassifierProps> = ({ results, onResultsChange }) => {
  // If no results yet, initialize
  const effectiveResults = results.length === CLASSIFY_CARDS.length ? results : initResults()

  const [localResults, setLocalResults] = useState<ClassifyResult[]>(effectiveResults)

  const updateResult = (cardId: string, patch: Partial<ClassifyResult>) => {
    const updated = localResults.map((r) => (r.cardId === cardId ? { ...r, ...patch } : r))
    setLocalResults(updated)
    onResultsChange(updated)
  }

  const submitCard = (cardId: string) => {
    updateResult(cardId, { submitted: true })
  }

  const resetCard = (cardId: string) => {
    updateResult(cardId, {
      selectedType: null,
      selectedScope: null,
      selectedAuthority: null,
      submitted: false,
    })
  }

  const correctCount = localResults.filter((r) => {
    const card = CLASSIFY_CARDS.find((c) => c.id === r.cardId)
    if (!card || !r.submitted) return false
    return (
      r.selectedType === card.correctType &&
      r.selectedScope === card.correctScope &&
      r.selectedAuthority === card.correctAuthority
    )
  }).length

  const submittedCount = localResults.filter((r) => r.submitted).length

  return (
    <div className="space-y-6">
      {/* Score */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Classify each organization by its type, scope, and authority, then click{' '}
          <strong>Check</strong>.
        </div>
        <div className="text-sm font-semibold text-foreground bg-muted/50 rounded-lg px-3 py-1.5 border border-border">
          {correctCount} / {CLASSIFY_CARDS.length} correct &bull; {submittedCount} checked
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CLASSIFY_CARDS.map((card) => {
          const result = localResults.find((r) => r.cardId === card.id)!
          const isSubmitted = result.submitted

          const typeCorrect = result.selectedType === card.correctType
          const scopeCorrect = result.selectedScope === card.correctScope
          const authorityCorrect = result.selectedAuthority === card.correctAuthority
          const allCorrect = typeCorrect && scopeCorrect && authorityCorrect

          return (
            <div
              key={card.id}
              className={`glass-panel p-4 space-y-4 transition-colors ${
                isSubmitted && allCorrect
                  ? 'border-status-success/40'
                  : isSubmitted
                    ? 'border-status-error/30'
                    : ''
              }`}
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-foreground text-sm">{card.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{card.acronym}</div>
                </div>
                {isSubmitted && (
                  <div className="shrink-0">
                    {allCorrect ? (
                      <CheckCircle2 size={18} className="text-status-success" />
                    ) : (
                      <XCircle size={18} className="text-status-error" />
                    )}
                  </div>
                )}
              </div>

              {/* Hint */}
              <div className="bg-muted/50 rounded p-2 border border-border">
                <div className="flex items-start gap-1.5">
                  <HelpCircle size={12} className="text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground italic">{card.hint}</p>
                </div>
              </div>

              {/* Type selector */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-foreground">Type:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {TYPE_OPTIONS.map((opt) => {
                    const isSelected = result.selectedType === opt.id
                    const showFeedback = isSubmitted
                    const isCorrectOption = card.correctType === opt.id
                    return (
                      <Button
                        variant="ghost"
                        key={opt.id}
                        disabled={isSubmitted}
                        onClick={() => updateResult(card.id, { selectedType: opt.id })}
                        className={`text-xs px-2 py-1.5 rounded border transition-colors text-left
                          ${
                            showFeedback && isCorrectOption
                              ? 'bg-status-success/10 border-status-success/40 text-status-success font-semibold'
                              : showFeedback && isSelected && !isCorrectOption
                                ? 'bg-status-error/10 border-status-error/40 text-status-error line-through'
                                : isSelected
                                  ? 'bg-primary/10 border-primary/40 text-primary'
                                  : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                          }`}
                      >
                        {opt.label}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Scope selector */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-foreground">Scope:</div>
                <div className="flex gap-1">
                  {SCOPE_OPTIONS.map((opt) => {
                    const isSelected = result.selectedScope === opt.id
                    const showFeedback = isSubmitted
                    const isCorrectOption = card.correctScope === opt.id
                    return (
                      <Button
                        variant="ghost"
                        key={opt.id}
                        disabled={isSubmitted}
                        onClick={() => updateResult(card.id, { selectedScope: opt.id })}
                        className={`flex-1 text-xs px-2 py-1.5 rounded border transition-colors
                          ${
                            showFeedback && isCorrectOption
                              ? 'bg-status-success/10 border-status-success/40 text-status-success font-semibold'
                              : showFeedback && isSelected && !isCorrectOption
                                ? 'bg-status-error/10 border-status-error/40 text-status-error line-through'
                                : isSelected
                                  ? 'bg-primary/10 border-primary/40 text-primary'
                                  : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                          }`}
                      >
                        {opt.label}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Authority selector */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-foreground">Authority:</div>
                <div className="flex gap-1">
                  {AUTHORITY_OPTIONS.map((opt) => {
                    const isSelected = result.selectedAuthority === opt.id
                    const showFeedback = isSubmitted
                    const isCorrectOption = card.correctAuthority === opt.id
                    return (
                      <Button
                        variant="ghost"
                        key={opt.id}
                        disabled={isSubmitted}
                        onClick={() => updateResult(card.id, { selectedAuthority: opt.id })}
                        className={`flex-1 text-xs px-2 py-1.5 rounded border transition-colors
                          ${
                            showFeedback && isCorrectOption
                              ? 'bg-status-success/10 border-status-success/40 text-status-success font-semibold'
                              : showFeedback && isSelected && !isCorrectOption
                                ? 'bg-status-error/10 border-status-error/40 text-status-error line-through'
                                : isSelected
                                  ? 'bg-primary/10 border-primary/40 text-primary'
                                  : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                          }`}
                      >
                        {opt.label}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Actions */}
              {!isSubmitted ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => submitCard(card.id)}
                  disabled={
                    !result.selectedType || !result.selectedScope || !result.selectedAuthority
                  }
                  className="w-full text-xs"
                >
                  Check Answer
                </Button>
              ) : (
                <div className="space-y-2">
                  {allCorrect ? (
                    <div className="text-xs text-status-success font-semibold text-center">
                      ✓ All correct!
                    </div>
                  ) : (
                    <div className="text-xs text-status-error text-center">
                      Correct answers shown in green
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    onClick={() => resetCard(card.id)}
                    className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                  >
                    Try again
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary */}
      {submittedCount > 0 && (
        <div
          className={`rounded-lg p-4 border text-center ${
            correctCount === CLASSIFY_CARDS.length
              ? 'bg-status-success/10 border-status-success/30'
              : 'bg-muted/50 border-border'
          }`}
        >
          <div className="text-lg font-bold text-foreground mb-1">
            {correctCount} / {CLASSIFY_CARDS.length} Correctly Classified
          </div>
          {correctCount === CLASSIFY_CARDS.length ? (
            <p className="text-sm text-status-success">
              Excellent! You understand how the three organization types differ. Proceed to Step 2
              to explore each organization in depth.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Review the highlighted corrections, then try the remaining cards. Remember: standards
              bodies create the rules; certification bodies verify implementations; regulatory
              agencies issue mandates.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

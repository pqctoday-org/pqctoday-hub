// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { ArrowRight, RotateCcw, CheckCircle2, GitBranch } from 'lucide-react'
import {
  DECISION_QUESTIONS,
  MIGRATION_PATHS,
  INTEROP_PATTERNS,
  type MigrationPath,
} from '../data/migrationData'
import { Button } from '@/components/ui/button'

const EFFORT_COLORS: Record<MigrationPath['effort'], string> = {
  low: 'bg-status-success/20 text-status-success border-status-success/50',
  medium: 'bg-status-warning/20 text-status-warning border-status-warning/50',
  high: 'bg-status-error/20 text-status-error border-status-error/50',
}

export const MigrationDecisionLab: React.FC = () => {
  const [currentQuestionId, setCurrentQuestionId] = useState<string>('current-language')
  const [history, setHistory] = useState<{ questionId: string; optionLabel: string }[]>([])
  const [recommendationId, setRecommendationId] = useState<string | null>(null)
  const [selectedPath, setSelectedPath] = useState<MigrationPath | null>(null)
  const [activeTab, setActiveTab] = useState<'wizard' | 'paths' | 'interop'>('wizard')

  const currentQuestion = DECISION_QUESTIONS.find((q) => q.id === currentQuestionId)

  const handleOption = (option: {
    label: string
    nextQuestion?: string
    recommendation?: string
  }) => {
    setHistory((prev) => [...prev, { questionId: currentQuestionId, optionLabel: option.label }])
    if (option.recommendation) {
      setRecommendationId(option.recommendation)
    } else if (option.nextQuestion) {
      setCurrentQuestionId(option.nextQuestion)
    }
  }

  const handleReset = () => {
    setCurrentQuestionId('current-language')
    setHistory([])
    setRecommendationId(null)
    setSelectedPath(null)
  }

  const recommendedPath = recommendationId
    ? MIGRATION_PATHS.find((p) => p.id === recommendationId)
    : null

  return (
    <div className="space-y-6">
      {/* Tab selector */}
      <div className="flex gap-1 bg-muted/50 rounded-lg p-1 w-fit">
        {(['wizard', 'paths', 'interop'] as const).map((tab) => (
          <Button
            variant="ghost"
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === tab ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {tab === 'wizard'
              ? 'Decision Wizard'
              : tab === 'paths'
                ? 'Migration Paths'
                : 'Interop Patterns'}
          </Button>
        ))}
      </div>

      {/* Decision Wizard */}
      {activeTab === 'wizard' && (
        <div className="space-y-4">
          {/* Breadcrumb */}
          {history.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {history.map((h, i) => (
                <React.Fragment key={i}>
                  <span className="text-xs text-muted-foreground">{h.optionLabel}</span>
                  {i < history.length - 1 && (
                    <ArrowRight size={12} className="text-muted-foreground" />
                  )}
                </React.Fragment>
              ))}
              <Button
                variant="ghost"
                onClick={handleReset}
                className="ml-2 text-xs text-primary flex items-center gap-1 hover:text-primary/80"
              >
                <RotateCcw size={12} /> Reset
              </Button>
            </div>
          )}

          {/* Recommendation result */}
          {recommendedPath && (
            <div className="glass-panel p-4 border-l-4 border-status-success">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={20} className="text-status-success" />
                <h3 className="font-bold text-foreground">Recommended Migration Path</h3>
              </div>
              <div className="font-semibold text-foreground">{recommendedPath.title}</div>
              <p className="text-sm text-muted-foreground mt-1">{recommendedPath.description}</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-sm font-mono text-primary">{recommendedPath.from}</span>
                <ArrowRight size={16} className="text-muted-foreground" />
                <span className="text-sm font-mono text-primary">{recommendedPath.to}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded border ${EFFORT_COLORS[recommendedPath.effort]}`}
                >
                  {recommendedPath.effort} effort
                </span>
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedPath(recommendedPath)
                  setActiveTab('paths')
                }}
                className="mt-3 text-sm text-primary hover:text-primary/80 flex items-center gap-1"
              >
                View full migration path <ArrowRight size={14} />
              </Button>
              <Button
                variant="ghost"
                onClick={handleReset}
                className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <RotateCcw size={12} /> Start over
              </Button>
            </div>
          )}

          {/* Current question */}
          {!recommendedPath && currentQuestion && (
            <div className="glass-panel p-4">
              <div className="flex items-center gap-2 mb-4">
                <GitBranch size={18} className="text-primary" />
                <h3 className="font-bold text-foreground">{currentQuestion.question}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentQuestion.options.map((opt) => (
                  <Button
                    variant="ghost"
                    key={opt.label}
                    onClick={() => handleOption(opt)}
                    className="text-left px-4 py-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors text-sm text-foreground"
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Progress hint */}
          {!recommendedPath && (
            <p className="text-xs text-muted-foreground">
              Answer {DECISION_QUESTIONS.length} questions to get your personalized migration
              recommendation.
              {history.length > 0 && ` (${history.length} answered)`}
            </p>
          )}
        </div>
      )}

      {/* Migration Paths */}
      {activeTab === 'paths' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {MIGRATION_PATHS.map((path) => (
              <Button
                variant="ghost"
                key={path.id}
                type="button"
                className={`glass-panel p-4 cursor-pointer transition-all text-left w-full ${selectedPath?.id === path.id ? 'ring-2 ring-primary' : 'hover:border-primary/50'}`}
                onClick={() => setSelectedPath(selectedPath?.id === path.id ? null : path)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-foreground">{path.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs font-mono text-muted-foreground">{path.from}</code>
                      <ArrowRight size={12} className="text-muted-foreground" />
                      <code className="text-xs font-mono text-primary">{path.to}</code>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded border shrink-0 ${EFFORT_COLORS[path.effort]}`}
                  >
                    {path.effort}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{path.description}</p>
              </Button>
            ))}
          </div>

          {/* Selected path detail */}
          {selectedPath && (
            <div className="glass-panel p-4 space-y-4">
              <h3 className="font-bold text-foreground">{selectedPath.title} — Migration Steps</h3>
              <ol className="space-y-2">
                {selectedPath.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-status-error mb-2">
                    Before (Classical)
                  </h4>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground">
                      {selectedPath.beforeCode.language}
                    </span>
                  </div>
                  <pre className="bg-muted/50 rounded-lg p-3 overflow-x-auto text-xs font-mono text-foreground leading-relaxed">
                    <code>{selectedPath.beforeCode.code}</code>
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-status-success mb-2">
                    After (PQC-Ready)
                  </h4>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground">
                      {selectedPath.afterCode.language}
                    </span>
                  </div>
                  <pre className="bg-muted/50 rounded-lg p-3 overflow-x-auto text-xs font-mono text-foreground leading-relaxed">
                    <code>{selectedPath.afterCode.code}</code>
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interop Patterns */}
      {activeTab === 'interop' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cross-API interoperability patterns for mixed-vendor environments.
          </p>
          {INTEROP_PATTERNS.map((p) => (
            <div key={p.id} className="glass-panel p-4">
              <h3 className="font-bold text-foreground mb-1">{p.title}</h3>
              <div className="flex flex-wrap gap-1 mb-2">
                {p.apis.map((api) => (
                  <span
                    key={api}
                    className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30"
                  >
                    {api}
                  </span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mb-3">{p.description}</p>
              <pre className="bg-muted/50 rounded-lg p-3 overflow-x-auto text-xs font-mono text-foreground leading-relaxed">
                <code>{p.example}</code>
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

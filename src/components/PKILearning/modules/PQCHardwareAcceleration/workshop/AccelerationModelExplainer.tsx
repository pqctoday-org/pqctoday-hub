// SPDX-License-Identifier: GPL-3.0-only
/**
 * Workshop step 1 — the seven acceleration models, each in plain English
 * first (analogy / what's different / the catch), then an animated diagram
 * of the mechanism, then a fit grid. Same shape as PQCCandidates'
 * FamilyMathExplainer so the two layman explainers read as one system.
 */
import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Lightbulb, FlaskConical, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MODELS, type AccelModel, type Fit, type ModelId } from '../data/models'
import { ModelVisual } from './ModelVisuals'

const FIT_STYLE: Record<Fit, { label: string; cls: string }> = {
  strong: { label: 'Strong', cls: 'bg-success/15 text-status-success border-success/40' },
  partial: { label: 'Partial', cls: 'bg-warning/15 text-status-warning border-warning/40' },
  weak: { label: 'Weak', cls: 'bg-muted/50 text-muted-foreground border-border' },
  none: { label: 'No', cls: 'bg-destructive/10 text-destructive border-destructive/40' },
}

const FIT_LABELS: { key: keyof AccelModel['fit']; label: string }[] = [
  { key: 'mldsa', label: 'ML-DSA (lattice)' },
  { key: 'slhdsa', label: 'SLH-DSA (hash)' },
  { key: 'singleOp', label: 'One op, low latency' },
  { key: 'batch', label: 'Big batch, throughput' },
]

interface AccelerationModelExplainerProps {
  initialModel?: ModelId
}

export const AccelerationModelExplainer: React.FC<AccelerationModelExplainerProps> = ({
  initialModel,
}) => {
  const [idx, setIdx] = useState(() => {
    const found = MODELS.findIndex((m) => m.id === initialModel)
    return found >= 0 ? found : 0
  })
  const model = MODELS[idx] // eslint-disable-line security/detect-object-injection

  return (
    <div className="space-y-6">
      <div className="glass-panel p-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {MODELS.map((m, i) => (
            <Button
              key={m.id}
              variant="ghost"
              size="tile"
              onClick={() => setIdx(i)}
              className={`rounded-md border p-2 text-left transition-colors h-auto block whitespace-normal ${
                i === idx
                  ? `${m.borderClass} ${m.bgClass}`
                  : 'border-border bg-card/40 hover:bg-card'
              }`}
            >
              <div className={`text-sm font-bold ${i === idx ? m.colorClass : 'text-foreground'}`}>
                {m.label}
              </div>
            </Button>
          ))}
        </div>
      </div>

      <div className={`glass-panel p-5 space-y-4 border ${model.borderClass}`}>
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h3 className={`text-xl font-bold ${model.colorClass}`}>{model.label}</h3>
          <span className="text-xs text-muted-foreground italic">{model.tagline}</span>
        </div>

        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb size={16} className="text-warning shrink-0" />
            <h4 className="text-sm font-bold text-warning">In plain English</h4>
          </div>
          <p className="text-sm text-foreground/85 leading-relaxed">{model.layman.analogy}</p>
          <p className="text-sm text-foreground/85 leading-relaxed">
            {model.layman.whatsDifferent}
          </p>
          <p className="text-sm text-foreground/85 leading-relaxed">
            <span className="font-semibold text-foreground">The catch — </span>
            {model.layman.catch}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card/40 p-4 overflow-hidden">
          <ModelVisual id={model.id} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {FIT_LABELS.map((f) => {
            const style = FIT_STYLE[model.fit[f.key]]
            return (
              <div key={f.key} className={`rounded-md border p-2 text-center ${style.cls}`}>
                <div className="text-[10px] uppercase tracking-wider font-bold opacity-80">
                  {f.label}
                </div>
                <div className="text-sm font-bold">{style.label}</div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-md border border-border bg-card/40 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
              Examples
            </div>
            <p className="text-xs text-foreground/85 leading-snug">{model.examples}</p>
          </div>
          <div
            className={`rounded-md border p-3 ${
              model.ourEvidence ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold mb-1">
              {model.ourEvidence ? (
                <>
                  <FlaskConical size={12} className="text-primary" />
                  <span className="text-primary">Our own evidence</span>
                </>
              ) : (
                <>
                  <BookOpen size={12} className="text-muted-foreground" />
                  <span className="text-muted-foreground">Published, not measured by us</span>
                </>
              )}
            </div>
            <p className="text-xs text-foreground/85 leading-snug">
              {model.ourEvidence ??
                'We have no ASIC of our own to measure. The ASIC content in this module is cited from public sources (Learn → “GPU, ASIC and NPU”).'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => setIdx(Math.max(0, idx - 1))}
          disabled={idx === 0}
          className="gap-2"
        >
          <ChevronLeft size={14} /> Previous model
        </Button>
        <Button
          variant="gradient"
          onClick={() => setIdx(Math.min(MODELS.length - 1, idx + 1))}
          disabled={idx === MODELS.length - 1}
          className="gap-2"
        >
          Next model <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  )
}

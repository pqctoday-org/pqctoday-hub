// SPDX-License-Identifier: GPL-3.0-only
// OWNER: CC/EU author
/**
 * Workshop step `eidas-trace` (EUCC & eIDAS path). The learner traces a
 * requirement layer by layer — law → service vs product → scheme/level → PP →
 * state-of-the-art → algorithms → validity → change — for two scenarios built
 * on the anchor product (remote signing at an EU QTSP; a signatory-held card
 * from the secure-element customer). Each layer is a concept question with
 * feedback; the artifact is the exported trace, with its sources.
 */
import { useState, type FC } from 'react'
import { ArrowDown, CheckCircle2, Circle, Scale, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CodeBlock } from '@/components/ui/code-block'
import { CopyButton } from '@/components/ui/CopyButton'
import { getStandard } from '@/data/standardsRegistry'
import type { CertWorkshopStepProps } from '../data/types'
import { ANCHOR_SCENARIO } from '../data/anchorScenario'
import {
  CC_EU_AS_OF,
  EIDAS_TRACE_SCENARIOS,
  findTraceScenario,
  type TraceLayer,
  type TraceScenario,
} from '../data/ccEuData'
import { OpenQuestion, PlainSource, SourceCite } from '../components/sections/CcEuSections'

const key = (scenarioId: string, layerId: string) => `${scenarioId}:${layerId}`

function traceText(
  s: TraceScenario,
  picks: ReadonlyMap<string, string>,
  firstTry: ReadonlyMap<string, boolean>
): string {
  const solved = s.layers.filter((l) => isSolved(s, l, picks)).length
  const lines: string[] = [
    `REGULATION-TO-CERTIFICATE TRACE — ${s.title}`,
    `Product: ${ANCHOR_SCENARIO.name} (${ANCHOR_SCENARIO.fictionalLabel}); customer: ${s.customer}`,
    `Layers traced: ${solved} of ${s.layers.length}`,
    '',
  ]
  s.layers.forEach((l, i) => {
    const k = key(s.id, l.id)
    const done = isSolved(s, l, picks)
    const first = firstTry.get(k)
    const status = !done ? '[ open ]' : first ? '[ ✓ first try ]' : '[ ✓ after a retry ]'
    lines.push(`${i + 1}. ${l.title} ${status}`)
    lines.push(`   ${done ? l.link : '(not yet traced)'}`)
    if (done) {
      const refs = [
        ...l.sourceIds.map((id) => {
          const ref = getStandard(id)
          return `${ref.id} — ${ref.title}`
        }),
        ...(l.plainSources ?? []),
      ]
      for (const r of refs) lines.push(`   source: ${r}`)
      if (l.openQuestion) lines.push(`   OPEN QUESTION: ${l.openQuestion}`)
    }
    if (i < s.layers.length - 1) lines.push('   ↓')
  })
  lines.push(
    '',
    `Sources read ${CC_EU_AS_OF}. eIDAS is a regulation, not a Protection Profile. Practitioner orientation — not laboratory training.`
  )
  return lines.join('\n')
}

function isSolved(s: TraceScenario, l: TraceLayer, picks: ReadonlyMap<string, string>): boolean {
  const pick = picks.get(key(s.id, l.id))
  return l.options.some((o) => o.id === pick && o.correct)
}

export const EidasTrace: FC<CertWorkshopStepProps> = ({ config }) => {
  const initialScenario = findTraceScenario(config?.scenario) ?? EIDAS_TRACE_SCENARIOS[0]
  const initialLayer = Math.max(
    0,
    initialScenario.layers.findIndex((l) => l.id === config?.layer)
  )

  const [scenarioId, setScenarioId] = useState<string>(initialScenario.id)
  const [layerIndex, setLayerIndex] = useState(initialLayer)
  const [picks, setPicks] = useState<ReadonlyMap<string, string>>(new Map())
  const [firstTry, setFirstTry] = useState<ReadonlyMap<string, boolean>>(new Map())

  const scenario = findTraceScenario(scenarioId) ?? EIDAS_TRACE_SCENARIOS[0]
  const layer = scenario.layers.at(layerIndex) ?? scenario.layers[0]
  const layerKey = key(scenario.id, layer.id)
  const picked = layer.options.find((o) => o.id === picks.get(layerKey))
  const solved = isSolved(scenario, layer, picks)
  const solvedCount = scenario.layers.filter((l) => isSolved(scenario, l, picks)).length

  const choose = (optionId: string, correct: boolean) => {
    if (solved) return
    setPicks((prev) => new Map(prev).set(layerKey, optionId))
    setFirstTry((prev) => (prev.has(layerKey) ? prev : new Map(prev).set(layerKey, correct)))
  }

  const switchScenario = (id: string) => {
    setScenarioId(id)
    setLayerIndex(0)
  }

  const artifact = traceText(scenario, picks, firstTry)

  return (
    <div className="space-y-6">
      <div className="glass-panel space-y-3 p-5">
        <div className="flex items-start gap-3">
          <Scale size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <div className="space-y-2 text-sm text-foreground/90">
            <p>{scenario.setup}</p>
            <p className="text-xs text-muted-foreground">
              {ANCHOR_SCENARIO.name} is {ANCHOR_SCENARIO.fictionalLabel}. The regulations,
              Protection Profiles and guidance are real (read {CC_EU_AS_OF}).
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Scenario">
          {EIDAS_TRACE_SCENARIOS.map((s) => (
            <Button
              key={s.id}
              size="sm"
              variant={s.id === scenario.id ? 'gradient' : 'outline'}
              aria-pressed={s.id === scenario.id}
              onClick={() => switchScenario(s.id)}
            >
              {s.title}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        {/* The chain */}
        <nav aria-label="Trace layers" className="glass-panel p-4">
          <p className="mb-2 text-xs text-muted-foreground">
            {solvedCount} of {scenario.layers.length} layers traced
          </p>
          <ol className="space-y-1">
            {scenario.layers.map((l, i) => {
              const done = isSolved(scenario, l, picks)
              const tried = picks.has(key(scenario.id, l.id))
              return (
                <li key={l.id}>
                  <Button
                    variant={i === layerIndex ? 'secondary' : 'ghost'}
                    size="sm"
                    aria-current={i === layerIndex ? 'step' : undefined}
                    className="w-full justify-start"
                    onClick={() => setLayerIndex(i)}
                  >
                    {done ? (
                      <CheckCircle2
                        size={14}
                        className="mr-2 shrink-0 text-status-success"
                        aria-label="traced"
                      />
                    ) : tried ? (
                      <XCircle
                        size={14}
                        className="mr-2 shrink-0 text-status-warning"
                        aria-label="tried"
                      />
                    ) : (
                      <Circle
                        size={14}
                        className="mr-2 shrink-0 text-muted-foreground"
                        aria-label="open"
                      />
                    )}
                    <span className="truncate">
                      {i + 1}. {l.title}
                    </span>
                  </Button>
                </li>
              )
            })}
          </ol>
        </nav>

        {/* The current layer */}
        <div className="glass-panel space-y-4 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Layer {layerIndex + 1} — {layer.title}
          </p>
          <h3 className="text-base font-semibold text-foreground">{layer.question}</h3>
          <div className="grid gap-2" role="group" aria-label="Answer options">
            {layer.options.map((o) => {
              const isPicked = picked?.id === o.id
              return (
                <Button
                  key={o.id}
                  variant={isPicked ? 'secondary' : 'outline'}
                  aria-pressed={isPicked}
                  disabled={solved && !isPicked}
                  className="h-auto justify-start whitespace-normal py-2 text-left"
                  onClick={() => choose(o.id, o.correct)}
                >
                  {o.label}
                </Button>
              )
            })}
          </div>

          {picked ? (
            <div
              role="status"
              className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${picked.correct ? 'border-status-success/30 bg-status-success/10' : 'border-status-error/30 bg-status-error/10'}`}
            >
              {picked.correct ? (
                <CheckCircle2
                  size={16}
                  className="mt-0.5 shrink-0 text-status-success"
                  aria-hidden="true"
                />
              ) : (
                <XCircle
                  size={16}
                  className="mt-0.5 shrink-0 text-status-error"
                  aria-hidden="true"
                />
              )}
              <p className="text-foreground">
                {picked.feedback}
                {picked.correct ? null : ' Try another option.'}
              </p>
            </div>
          ) : null}

          {solved ? (
            <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
              <p className="text-foreground">
                <strong>Link in the chain:</strong> {layer.link}
              </p>
              <p className="text-xs text-muted-foreground">
                Sources:{' '}
                {layer.sourceIds.map((id, i) => (
                  <span key={id}>
                    {i > 0 ? ', ' : ''}
                    <SourceCite id={id} />
                  </span>
                ))}
                {(layer.plainSources ?? []).map((p) => (
                  <span key={p}>
                    ; <PlainSource>{p}</PlainSource>
                  </span>
                ))}
              </p>
              {layer.openQuestion ? <OpenQuestion>{layer.openQuestion}</OpenQuestion> : null}
            </div>
          ) : null}

          <div className="flex flex-wrap justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={layerIndex === 0}
              onClick={() => setLayerIndex((i) => Math.max(0, i - 1))}
            >
              Previous layer
            </Button>
            <Button
              variant={solved ? 'gradient' : 'outline'}
              size="sm"
              disabled={layerIndex >= scenario.layers.length - 1}
              onClick={() => setLayerIndex((i) => Math.min(scenario.layers.length - 1, i + 1))}
            >
              Next layer <ArrowDown size={14} className="ml-1.5 -rotate-90" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>

      <div className="glass-panel space-y-2 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-foreground">Your trace</h3>
          <CopyButton text={artifact} label="Copy trace" />
        </div>
        <CodeBlock code={artifact} language="text" className="mt-2 whitespace-pre-wrap" />
      </div>
    </div>
  )
}

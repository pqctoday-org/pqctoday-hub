// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  SAMPLE_INVENTORY,
  LOOP_STAGES,
  LOOP_STAGE_LABELS,
  type LoopStage,
  type InventoryAsset,
} from '../data/sampleInventory'
import { CLM_SCENARIOS } from '../data/clmScenarios'
import { ASSET_CLASS_LABELS, type AssetClass } from '../data/maturityModel'

const stageIndex = (s: LoopStage) => LOOP_STAGES.indexOf(s)

const riskColor = (score: number) => {
  if (score >= 4) return 'bg-status-error/15 text-status-error border-status-error/30'
  if (score === 3) return 'bg-status-warning/15 text-status-warning border-status-warning/30'
  return 'bg-status-success/15 text-status-success border-status-success/30'
}

export const InventoryLifecycleSimulator: React.FC = () => {
  const [stages, setStages] = useState<Record<string, LoopStage>>(() =>
    SAMPLE_INVENTORY.reduce(
      (acc, a) => ({ ...acc, [a.id]: a.initialStage }),
      {} as Record<string, LoopStage>
    )
  )
  const [iteration, setIteration] = useState(1)
  const [filter, setFilter] = useState<AssetClass | 'all'>('all')

  const filtered = useMemo(
    () =>
      filter === 'all' ? SAMPLE_INVENTORY : SAMPLE_INVENTORY.filter((a) => a.class === filter),
    [filter]
  )

  const advance = (asset: InventoryAsset) => {
    const cur = stages[asset.id]
    const idx = stageIndex(cur)
    if (idx < LOOP_STAGES.length - 1) {
      setStages((s) => ({ ...s, [asset.id]: LOOP_STAGES[idx + 1] }))
    }
  }

  const rewind = (asset: InventoryAsset) => {
    const cur = stages[asset.id]
    const idx = stageIndex(cur)
    if (idx > 0) {
      setStages((s) => ({ ...s, [asset.id]: LOOP_STAGES[idx - 1] }))
    }
  }

  const advanceAll = () => {
    setStages((prev) => {
      const next = { ...prev }
      SAMPLE_INVENTORY.forEach((a) => {
        const idx = stageIndex(next[a.id])
        if (idx < LOOP_STAGES.length - 1) next[a.id] = LOOP_STAGES[idx + 1]
      })
      return next
    })
  }

  const nextIteration = () => {
    setStages(
      SAMPLE_INVENTORY.reduce(
        (acc, a) => ({ ...acc, [a.id]: 'discover' as LoopStage }),
        {} as Record<string, LoopStage>
      )
    )
    setIteration((i) => i + 1)
  }

  const simulatedMTTR = useMemo(() => {
    const base = 9.5
    return Math.max(0.25, base / iteration).toFixed(1)
  }, [iteration])

  const stageBuckets = useMemo(() => {
    const buckets: Record<LoopStage, InventoryAsset[]> = {
      discover: [],
      classify: [],
      score: [],
      remediate: [],
      attest: [],
      reassess: [],
    }
    filtered.forEach((a) => buckets[stages[a.id]].push(a))
    return buckets
  }, [filtered, stages])

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Walk a sample enterprise inventory through the six-stage operational loop. Every iteration
        reduces cert MTTR as discovery, remediation, and attestation automation compound.
      </p>

      <div className="flex flex-wrap items-center gap-3 bg-muted/40 rounded-lg p-3 border border-border">
        <div className="text-sm">
          <span className="font-bold text-primary">Iteration {iteration}</span>{' '}
          <span className="text-muted-foreground">
            · Simulated Cert MTTR{' '}
            <span className="font-bold text-foreground">{simulatedMTTR} h</span>
          </span>
        </div>
        <div className="flex-1" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as AssetClass | 'all')}
          className="bg-background border border-input rounded px-2 py-1 text-xs text-foreground"
        >
          <option value="all">All asset classes</option>
          {(Object.keys(ASSET_CLASS_LABELS) as AssetClass[]).map((k) => (
            <option key={k} value={k}>
              {ASSET_CLASS_LABELS[k]}
            </option>
          ))}
        </select>
        <Button variant="outline" onClick={advanceAll} className="text-xs">
          Advance all →
        </Button>
        <Button variant="gradient" onClick={nextIteration} className="text-xs">
          Reassess · next iteration
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {LOOP_STAGES.map((stage) => (
          <div
            key={stage}
            className="bg-muted/30 rounded-lg p-2 border border-border min-h-[200px]"
          >
            <div className="font-bold text-xs text-primary uppercase tracking-wide mb-2">
              {LOOP_STAGE_LABELS[stage]}
            </div>
            <div className="space-y-2">
              {stageBuckets[stage].map((a) => (
                <div
                  key={a.id}
                  className={`rounded border p-2 text-[11px] ${riskColor(a.riskScore)}`}
                >
                  <div className="font-bold text-foreground text-[11px] leading-tight">
                    {a.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {ASSET_CLASS_LABELS[a.class]} · risk {a.riskScore}/5
                  </div>
                  <div className="flex gap-1 mt-2">
                    <Button
                      variant="ghost"
                      onClick={() => rewind(a)}
                      className="px-1 py-0.5 text-[10px] h-auto border border-border"
                    >
                      ←
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => advance(a)}
                      className="flex-1 px-1 py-0.5 text-[10px] h-auto border border-border"
                    >
                      {stage === 'reassess' ? '✓' : '→'}
                    </Button>
                  </div>
                </div>
              ))}
              {stageBuckets[stage].length === 0 && (
                <div className="text-[10px] text-muted-foreground italic p-1">empty</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div>
        <div className="font-bold text-sm text-foreground mb-2">
          Canonical CLM scenarios — the loop in action
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CLM_SCENARIOS.map((s) => (
            <div key={s.id} className="bg-muted/40 rounded-lg p-3 border border-border">
              <div className="flex justify-between items-start gap-2 mb-1">
                <div className="font-bold text-xs text-foreground">{s.title}</div>
                <div className="text-[10px] text-muted-foreground uppercase whitespace-nowrap">
                  {LOOP_STAGE_LABELS[s.triggerStage]}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mb-2">{s.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                <div className="bg-status-error/10 rounded p-2 border border-status-error/20">
                  <div className="font-bold text-status-error mb-0.5">Failure mode</div>
                  <div className="text-muted-foreground">{s.canonicalFailure}</div>
                </div>
                <div className="bg-status-success/10 rounded p-2 border border-status-success/20">
                  <div className="font-bold text-status-success mb-0.5">Good practice</div>
                  <div className="text-muted-foreground">{s.goodPractice}</div>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground italic mt-2">
                KPI impact: {s.kpiImpact}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

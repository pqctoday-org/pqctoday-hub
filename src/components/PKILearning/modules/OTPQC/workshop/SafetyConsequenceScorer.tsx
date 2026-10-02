// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Shield, Users, Zap, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { CompleteStepAction } from '../../../common/CompleteStepAction'
import {
  CONSEQUENCE_SCENARIOS,
  SAFETY_LAYER_LABEL,
  defaultInputs,
  scoreScenario,
  type ConsequenceResult,
  type ScenarioInputs,
  type Severity,
  type CommandAuth,
  type FirmwareSigning,
  type SafetyLayer,
  type RiskLevel,
} from '../data/consequenceData'
import { SECTOR_LABEL } from '../data/roadmapData'

interface SafetyConsequenceScorerProps {
  results: ConsequenceResult[]
  onResultsChange: (r: ConsequenceResult[]) => void
  onComplete: () => void
  initialScenarioId?: string
}

const SEVERITY_OPTIONS: { id: Severity; label: string }[] = [
  { id: 'catastrophic', label: 'Catastrophic (multiple fatalities possible)' },
  { id: 'critical', label: 'Critical (serious injury / public health)' },
  { id: 'major', label: 'Major (injury possible, large loss)' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'minor', label: 'Minor' },
]

const COMMAND_OPTIONS: { id: CommandAuth; label: string }[] = [
  { id: 'none', label: 'None (unauthenticated)' },
  { id: 'symmetric', label: 'Symmetric MAC (e.g. DNP3 SAv5)' },
  { id: 'classical-pk', label: 'RSA / ECDSA certificates (TLS, OPC UA, CIP Security)' },
  { id: 'pqc', label: 'PQC / hybrid' },
]

const FIRMWARE_OPTIONS: { id: FirmwareSigning; label: string }[] = [
  { id: 'none', label: 'Unsigned' },
  { id: 'classical', label: 'RSA / ECDSA signed' },
  { id: 'pqc', label: 'LMS / ML-DSA signed' },
]

const SAFETY_OPTIONS: { id: SafetyLayer; label: string }[] = (
  Object.keys(SAFETY_LAYER_LABEL) as SafetyLayer[]
).map((id) => ({ id, label: SAFETY_LAYER_LABEL[id] }))

function levelColor(level: RiskLevel) {
  switch (level) {
    case 'critical':
      return 'text-status-error bg-status-error/10 border-status-error/30'
    case 'high':
      return 'text-status-warning bg-status-warning/10 border-status-warning/30'
    case 'medium':
      return 'text-status-info bg-status-info/10 border-status-info/30'
    default:
      return 'text-status-success bg-status-success/10 border-status-success/30'
  }
}

const THREAT_BADGE: Record<string, { label: string; cls: string }> = {
  forgery: { label: 'Quantum forgery', cls: 'bg-status-error/20 text-status-error' },
  hndl: { label: 'HNDL', cls: 'bg-status-warning/20 text-status-warning' },
  today: { label: 'Exploitable today / not quantum', cls: 'bg-muted text-muted-foreground' },
}

function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { id: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div>
      <span className="block text-xs text-muted-foreground mb-1">{label}</span>
      <FilterDropdown
        noContainer
        selectedId={value}
        onSelect={(id) => onChange(id as T)}
        items={options}
      />
    </div>
  )
}

export const SafetyConsequenceScorer: React.FC<SafetyConsequenceScorerProps> = ({
  results,
  onResultsChange,
  onComplete,
  initialScenarioId,
}) => {
  const [selectedId, setSelectedId] = useState<string>(
    initialScenarioId ?? CONSEQUENCE_SCENARIOS[0].id
  )
  const [overrides, setOverrides] = useState<Record<string, ScenarioInputs>>({})

  const scenario =
    CONSEQUENCE_SCENARIOS.find((s) => s.id === selectedId) ?? CONSEQUENCE_SCENARIOS[0]
  // Memoised so `result` keeps its identity between renders — the effect below
  // lifts it to the workshop and must not fire on every parent re-render.
  const inputs = useMemo(
    () => overrides[scenario.id] ?? defaultInputs(scenario),
    [overrides, scenario]
  )
  const result = useMemo(() => scoreScenario(scenario, inputs), [scenario, inputs])

  const setInput = <K extends keyof ScenarioInputs>(key: K, value: ScenarioInputs[K]) =>
    setOverrides((prev) => ({ ...prev, [scenario.id]: { ...inputs, [key]: value } }))

  useEffect(() => {
    const others = results.filter((r) => r.scenarioId !== result.scenarioId)
    onResultsChange([...others, result])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result])

  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/80">
        Score what happens if a quantum computer lets an attacker forge commands or firmware, across
        all five OT sectors. The score asks the questions a process-safety review asks: how bad is
        the worst outcome, and does an independent safety layer still stop it if the control path is
        forged? It is a teaching model, not a SIL determination.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {CONSEQUENCE_SCENARIOS.map((s) => {
          const r = scoreScenario(s)
          return (
            <Button
              key={s.id}
              variant="ghost"
              onClick={() => setSelectedId(s.id)}
              className={`h-auto text-left rounded-lg border p-3 flex flex-col items-start whitespace-normal ${
                s.id === selectedId ? 'border-primary ring-1 ring-primary/40' : 'border-border'
              } bg-card`}
            >
              <span className="text-[10px] text-muted-foreground">{SECTOR_LABEL[s.sector]}</span>
              <span className="text-sm font-bold text-foreground leading-tight">{s.name}</span>
              <span className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold font-mono">{r.compound}</span>
                <span
                  className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${levelColor(r.riskLevel)}`}
                >
                  {r.riskLevel}
                </span>
              </span>
              <span className="text-[10px] text-muted-foreground">default inputs</span>
            </Button>
          )
        })}
      </div>

      <div className="glass-panel p-4 space-y-3">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Zap size={16} className="text-status-warning" /> {scenario.name} — attack paths
        </h4>
        <p className="text-xs text-muted-foreground">{scenario.description}</p>
        {scenario.attackPaths.map((ap) => (
          <div key={ap.name} className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-sm font-bold text-foreground">{ap.name}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${THREAT_BADGE[ap.threat].cls}`}
              >
                {THREAT_BADGE[ap.threat].label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground">Precondition:</span> {ap.precondition}
            </p>
          </div>
        ))}
        <div className="space-y-1.5 pt-1">
          {scenario.consequenceChain.map((step, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="shrink-0 w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] font-bold">
                {idx + 1}
              </div>
              <p className="text-sm text-foreground/80 pt-0.5">{step}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Shield size={16} className="text-primary" /> Inputs
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Worst credible consequence"
            value={inputs.severity}
            options={SEVERITY_OPTIONS}
            onChange={(v) => setInput('severity', v)}
          />
          <Select
            label="Independent safety layer (IEC 61511)"
            value={inputs.safetyLayer}
            options={SAFETY_OPTIONS}
            onChange={(v) => setInput('safetyLayer', v)}
          />
          <Select
            label="Command path authenticated by"
            value={inputs.commandAuth}
            options={COMMAND_OPTIONS}
            onChange={(v) => setInput('commandAuth', v)}
          />
          <Select
            label="Controller firmware / logic"
            value={inputs.firmwareSigning}
            options={FIRMWARE_OPTIONS}
            onChange={(v) => setInput('firmwareSigning', v)}
          />
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="ot-population"
              className="text-xs text-muted-foreground flex items-center gap-1.5"
            >
              <Users size={12} /> People affected
            </label>
            <span className="text-xs font-mono">{inputs.population.toLocaleString()}</span>
          </div>
          <input
            id="ot-population"
            type="range"
            min={1000}
            max={10_000_000}
            step={1000}
            value={inputs.population}
            onChange={(e) => setInput('population', Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
      </div>

      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">Score (model estimate)</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-muted-foreground">Consequence</div>
            <div className="text-lg font-mono font-bold">{result.consequence}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-muted-foreground">Quantum exposure</div>
            <div className="text-lg font-mono font-bold">×{result.exposure}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-muted-foreground">Safety layer</div>
            <div className="text-lg font-mono font-bold">×{result.safetyLayerFactor}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-muted-foreground">Asset life</div>
            <div className="text-lg font-mono font-bold">×{result.lifeFactor}</div>
          </div>
        </div>
        <div className="mt-4 flex justify-center">
          <div className={`rounded-xl p-5 text-center border ${levelColor(result.riskLevel)}`}>
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Compound score</p>
            <p className="text-4xl font-bold font-mono">{result.compound}</p>
            <p className="text-[10px] font-bold uppercase mt-1">{result.riskLevel}</p>
          </div>
        </div>
        {result.exploitableToday && (
          <p className="mt-3 text-xs flex items-start gap-2 text-muted-foreground">
            <AlertTriangle size={14} className="text-status-warning shrink-0 mt-0.5" />
            Part of this path is unauthenticated: it is exploitable today, with no quantum computer.
            Fixing that comes before PQC.
          </p>
        )}
      </div>

      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-status-success" /> Recommended actions
        </h4>
        <ul className="space-y-2">
          {result.actions.map((a) => (
            <li key={a} className="text-sm text-foreground/80">
              • {a}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {scenario.regimes.map((r) => (
            <span
              key={r}
              className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted border border-border"
            >
              {r}
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-center pt-2">
        <CompleteStepAction recordsArtifact={false} onClick={onComplete} />
      </div>
    </div>
  )
}

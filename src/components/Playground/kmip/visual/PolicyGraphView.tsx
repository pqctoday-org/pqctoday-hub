// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection -- rule/field keys are typed
   catalog values, never user input. */
//
// PolicyGraphView — orchestrator for the CACP visual policy editor. Owns the
// editable policy (the graph is the source of truth), regenerates YAML on every
// edit, applies the edited policy to the engine (debounced), and drives the
// palette / inspector / simulator / validation panels.
//
// WP2: the centre column is an ordered rule list (placeholder). WP3 replaces it
// with the pan/zoom decision-pipeline canvas behind the same props.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Code2, ChevronRight, Grip, FlaskConical, ShieldAlert, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { KmipEngine, DryRunResult } from '@/wasm/kmip/kmipEngine'
import type { PolicyPreset } from '@/wasm/kmip/kmipMeta'
import {
  toEditable,
  serialize,
  validate,
  newRuleId,
  clonePolicy,
  type EditablePolicy,
  type EditableRule,
} from './policyEditModel'
import {
  RULE_CATALOG,
  FAMILY_META,
  summarizeRule,
  isRuleTypeId,
  type RuleTypeId,
} from './ruleCatalog'
import { RulePalette } from './RulePalette'
import { RuleInspector } from './RuleInspector'
import { RequestSimulator } from './RequestSimulator'
import { PolicyValidation } from './PolicyValidation'
import { evaluatePolicy, type SimRequest, type SimResult } from './policySim'

interface Props {
  engine: KmipEngine
  /** Active policy YAML (pristine preset text) — reseeds when presetFile flips. */
  initialYaml: string | null
  /** File name of the active preset (null = built-in permissive). Reseed key. */
  presetFile: string | null
  guided: boolean
  /** Switch preset — parent fetches + loads it and updates initialYaml. */
  onLoadPreset: (preset: PolicyPreset) => void
  /** Apply edited YAML to the engine + surface it site-wide; returns warnings. */
  onApplyYaml: (yaml: string) => { ok: boolean; warnings?: string[]; error?: string } | undefined
}

const EMPTY_POLICY: EditablePolicy = {
  schemaVersion: '1',
  metadata: {
    name: 'built-in-permissive',
    description: '',
    authority: '',
    effective: 'always',
    complianceMapping: [],
  },
  rules: [],
}

type RightTab = 'inspect' | 'simulate' | 'check'

export function PolicyGraphView({
  engine,
  initialYaml,
  presetFile,
  guided,
  onLoadPreset,
  onApplyYaml,
}: Props) {
  // State initialises from the seeded policy; the parent gives this component a
  // `key` of the preset file, so switching preset remounts with a fresh seed
  // (no synchronous-setState-in-effect reseed needed).
  const seeded = useMemo(
    () => (initialYaml ? toEditable(initialYaml) : clonePolicy(EMPTY_POLICY)),
    // initialYaml is the pristine preset text at mount; our own applied edits
    // don't change the mounted instance's seed (key stays the same).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )
  const [baseline] = useState(() => serialize(seeded))
  const [policy, setPolicy] = useState<EditablePolicy>(seeded)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [rightTab, setRightTab] = useState<RightTab>('simulate')
  const [yamlOpen, setYamlOpen] = useState(false)
  const [req, setReq] = useState<SimRequest>({
    op: 'Sign',
    algorithm: 'ECDSA-P256',
    keyState: 'Active',
    bits: '',
    date: '2026-06-01',
    attrs: ['x-pqctoday-purpose'],
  })
  const [sim, setSim] = useState<SimResult | null>(null)
  const [engineVerdict, setEngineVerdict] = useState<DryRunResult | null>(null)
  const [running, setRunning] = useState(false)
  const [engineWarnings, setEngineWarnings] = useState<string[]>([])

  const yaml = useMemo(() => serialize(policy), [policy])
  const issues = useMemo(() => validate(policy), [policy])
  const modified = yaml !== baseline
  const selectedRule = policy.rules.find((r) => r.id === selectedId) ?? null
  const selectedIndex = policy.rules.findIndex((r) => r.id === selectedId)

  // Debounced apply of the edited policy to the engine (graph = source of truth).
  const applyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!modified) return
    if (applyTimer.current) clearTimeout(applyTimer.current)
    applyTimer.current = setTimeout(() => {
      const res = onApplyYaml(yaml)
      if (res && !res.ok) setEngineWarnings([res.error ?? 'engine rejected the edited policy'])
      else setEngineWarnings(res?.warnings ?? [])
      setSim(null) // last sim is stale after an edit
    }, 400)
    return () => {
      if (applyTimer.current) clearTimeout(applyTimer.current)
    }
  }, [yaml, modified, onApplyYaml])

  // ── mutations ──
  const patchRule = (id: string, mutate: (r: EditableRule) => EditableRule) =>
    setPolicy((p) => ({ ...p, rules: p.rules.map((r) => (r.id === id ? mutate(r) : r)) }))
  const patchScalar = (id: string, key: string, value: string) =>
    patchRule(id, (r) => ({ ...r, scalars: { ...r.scalars, [key]: value } }))
  const patchList = (id: string, key: string, value: string[]) =>
    patchRule(id, (r) => ({ ...r, lists: { ...r.lists, [key]: value } }))
  const patchMap = (id: string, key: string, value: { name: string; value: string }) =>
    patchRule(id, (r) => ({ ...r, maps: { ...r.maps, [key]: value } }))
  const toggleRule = (id: string) => patchRule(id, (r) => ({ ...r, enabled: !r.enabled }))
  const deleteRule = (id: string) => {
    setPolicy((p) => ({ ...p, rules: p.rules.filter((r) => r.id !== id) }))
    if (selectedId === id) setSelectedId(null)
  }
  const addRule = (type: RuleTypeId) => {
    const made = RULE_CATALOG[type].make()
    const rule: EditableRule = { id: newRuleId(), type, enabled: true, ...made }
    setPolicy((p) => ({ ...p, rules: [...p.rules, rule] }))
    setSelectedId(rule.id)
    setRightTab('inspect')
  }
  const moveRule = (id: string, dir: -1 | 1) =>
    setPolicy((p) => {
      const i = p.rules.findIndex((r) => r.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= p.rules.length) return p
      const rules = p.rules.slice()
      const [x] = rules.splice(i, 1)
      rules.splice(j, 0, x)
      return { ...p, rules }
    })

  const reset = () => {
    const seeded = toEditable(baseline)
    setPolicy(seeded)
    setSelectedId(null)
    setSim(null)
    onApplyYaml(baseline)
    setEngineWarnings([])
  }

  const select = (id: string | null) => {
    setSelectedId(id)
    if (id) setRightTab('inspect')
  }

  // ── run simulation: engine verdict (authoritative) + illustrative trace ──
  const run = useCallback(() => {
    setRunning(true)
    const result = evaluatePolicy(policy, req)
    setSim(result)
    const newObject = /^(Create|CreateKeyPair|Register|Import)/.test(req.op)
    try {
      const verdict = engine.dryRun({
        op: req.op,
        algorithm: req.algorithm || undefined,
        currentAlgorithm: newObject ? undefined : req.algorithm || undefined,
        length: req.bits === '' ? undefined : Number(req.bits),
        state: req.keyState || undefined,
      })
      setEngineVerdict(verdict)
    } catch {
      setEngineVerdict(null)
    }
    setRunning(false)
  }, [engine, policy, req])

  // Illustrative-vs-engine divergence (date/attrs the engine can't yet see).
  const approximated = useMemo(() => {
    if (!sim || !engineVerdict) return false
    const engineKind =
      engineVerdict.kind === 'Allow' ? 'allow' : engineVerdict.kind === 'Rekey' ? 'rekey' : 'deny'
    return sim.verdict.kind !== engineKind
  }, [sim, engineVerdict])

  const rightTabs: { id: RightTab; label: string; icon: typeof Grip; badge?: number }[] = [
    { id: 'inspect', label: 'Inspect', icon: Grip },
    { id: 'simulate', label: 'Simulate', icon: FlaskConical },
    { id: 'check', label: 'Check', icon: ShieldAlert, badge: issues.length },
  ]

  return (
    <div className="flex min-h-0 flex-col">
      <div className="grid min-h-[540px] grid-cols-1 lg:grid-cols-[248px_1fr_368px]">
        {/* Left: palette */}
        <aside className="min-h-0 overflow-hidden border-b border-border lg:border-b-0 lg:border-r">
          <RulePalette
            guided={guided}
            activePresetFile={presetFile}
            onSelectPreset={onLoadPreset}
            onAddRule={addRule}
          />
        </aside>

        {/* Center: WP2 placeholder rule list (WP3 → GraphCanvas) */}
        <main className="relative min-h-0 overflow-y-auto bg-background/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Decision pipeline · {policy.rules.length} rule{policy.rules.length === 1 ? '' : 's'}
            </span>
            {modified && (
              <span className="inline-flex items-center gap-1.5 rounded border border-status-warning/40 bg-status-warning/10 px-1.5 py-0.5 text-[10px] font-semibold text-status-warning">
                modified
                <Button
                  variant="ghost"
                  onClick={reset}
                  title="Reset to preset"
                  className="inline-flex h-auto items-center gap-0.5 p-0 text-[10px] font-semibold text-status-warning hover:bg-transparent hover:underline"
                >
                  <RotateCcw size={10} /> reset
                </Button>
              </span>
            )}
          </div>
          {policy.rules.length === 0 ? (
            <p className="mt-8 text-center text-[12px] text-muted-foreground">
              No rules yet — add one from the palette. An empty policy allows everything.
            </p>
          ) : (
            <ol className="space-y-1.5">
              {policy.rules.map((r, i) => {
                const spec = isRuleTypeId(r.type) ? RULE_CATALOG[r.type] : undefined
                const fam = spec ? FAMILY_META[spec.family] : undefined
                const Icon = spec?.icon
                const decided = sim?.deciderId === r.id
                const step = sim?.trace.find((t) => t.ruleId === r.id)
                return (
                  <li key={r.id}>
                    <Button
                      variant="ghost"
                      onClick={() => select(r.id)}
                      className={cn(
                        'flex h-auto w-full items-center justify-start gap-2 rounded-lg border-l-4 bg-card p-2 text-left font-normal transition-all hover:bg-card',
                        fam?.border ?? 'border-l-border',
                        selectedId === r.id
                          ? 'ring-2 ring-primary'
                          : 'border-y border-r border-border',
                        !r.enabled && 'opacity-50',
                        decided && 'ring-2 ring-destructive',
                        step && !step.matched && step.effect !== 'off' && sim && 'opacity-60'
                      )}
                    >
                      {Icon && fam && (
                        <span
                          className={cn(
                            'grid h-7 w-7 shrink-0 place-items-center rounded-md',
                            fam.bg
                          )}
                        >
                          <Icon size={14} className={fam.text} />
                        </span>
                      )}
                      <span className="flex min-w-0 flex-col">
                        <span className="flex items-center gap-1.5">
                          <span className="text-[12.5px] font-semibold text-foreground">
                            {spec?.title ?? r.type}
                          </span>
                          <span className="font-mono text-[9.5px] text-muted-foreground">
                            #{i + 1}
                          </span>
                        </span>
                        <span className="truncate font-mono text-[11px] text-muted-foreground">
                          {summarizeRule(r)}
                        </span>
                      </span>
                      {step?.matched && (
                        <span
                          className={cn(
                            'ml-auto text-[9px] font-bold uppercase',
                            step.effect === 'deny' ? 'text-destructive' : 'text-status-success'
                          )}
                        >
                          {step.effect}
                        </span>
                      )}
                    </Button>
                  </li>
                )
              })}
            </ol>
          )}
        </main>

        {/* Right: inspect / simulate / check */}
        <aside className="flex min-h-0 flex-col border-t border-border lg:border-l lg:border-t-0">
          <div className="flex gap-1 border-b border-border px-2 pt-2">
            {rightTabs.map((rt) => {
              const Icon = rt.icon
              return (
                <Button
                  key={rt.id}
                  variant="ghost"
                  onClick={() => setRightTab(rt.id)}
                  className={cn(
                    '-mb-px inline-flex h-auto items-center gap-1.5 rounded-none border-b-2 px-2.5 py-1.5 text-[12px] font-medium transition-colors hover:bg-transparent',
                    rightTab === rt.id
                      ? 'border-primary font-semibold text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon size={13} />
                  {rt.label}
                  {rt.badge ? (
                    <span className="rounded-full bg-destructive px-1.5 text-[9px] font-bold text-destructive-foreground">
                      {rt.badge}
                    </span>
                  ) : null}
                </Button>
              )
            })}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {rightTab === 'inspect' && (
              <RuleInspector
                rule={selectedRule}
                index={selectedIndex}
                count={policy.rules.length}
                onPatchScalar={(k, v) => selectedId && patchScalar(selectedId, k, v)}
                onPatchList={(k, v) => selectedId && patchList(selectedId, k, v)}
                onPatchMap={(k, v) => selectedId && patchMap(selectedId, k, v)}
                onToggle={() => selectedId && toggleRule(selectedId)}
                onDelete={() => selectedId && deleteRule(selectedId)}
                onMove={(dir) => selectedId && moveRule(selectedId, dir)}
              />
            )}
            {rightTab === 'simulate' && (
              <RequestSimulator
                req={req}
                onChange={setReq}
                onRun={run}
                running={running}
                guided={guided}
                engineVerdict={engineVerdict}
                approximated={approximated}
              />
            )}
            {rightTab === 'check' && (
              <PolicyValidation issues={issues} engineWarnings={engineWarnings} onSelect={select} />
            )}
          </div>
        </aside>
      </div>

      {/* YAML drawer */}
      <div className="border-t border-border bg-card">
        <Button
          variant="ghost"
          onClick={() => setYamlOpen((o) => !o)}
          className="flex h-auto w-full items-center justify-start gap-2 rounded-none px-4 py-2 text-left font-normal hover:bg-muted/20"
        >
          <Code2 size={14} className="text-primary" />
          <span className="text-[12px] font-semibold text-foreground">policy source (YAML)</span>
          <span className="text-[10.5px] text-muted-foreground">· generated from the graph</span>
          <ChevronRight
            size={14}
            className={cn(
              'ml-auto text-muted-foreground transition-transform',
              yamlOpen && 'rotate-90'
            )}
          />
        </Button>
        {yamlOpen && (
          <pre className="max-h-56 overflow-auto whitespace-pre border-t border-border bg-muted/40 px-4 py-2.5 font-mono text-[10.5px] leading-relaxed text-foreground">
            {yaml}
          </pre>
        )}
      </div>
    </div>
  )
}

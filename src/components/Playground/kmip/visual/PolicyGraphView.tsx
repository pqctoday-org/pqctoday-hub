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
import { RULE_CATALOG, type RuleTypeId } from './ruleCatalog'
import { RulePalette } from './RulePalette'
import { RuleInspector } from './RuleInspector'
import { RequestSimulator } from './RequestSimulator'
import { PolicyValidation } from './PolicyValidation'
import {
  evaluatePolicy,
  type SimRequest,
  type SimResult,
  type SimVerdict,
  type TraceStep,
} from './policySim'
import { GraphCanvas, type FlowToken } from './GraphCanvas'
import {
  defaultLayout,
  relayout,
  nodeW,
  portOf,
  sinkInPort,
  NODE_H,
  REQ,
  SINK,
  type Dir,
  type Layout,
  type TerminalKind,
} from './graphGeometry'

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

/**
 * Build the graph's SimResult from the ENGINE's own per-rule trace, so node
 * highlighting reflects exactly what the engine did — not a re-derived guess.
 * Disabled editor rules are serialized as comments, so the engine only sees
 * ENABLED rules; map its 1-based `index` to the i-th enabled rule. Returns null
 * when the engine build predates trace support (caller falls back to the
 * illustrative evaluatePolicy).
 */
function engineTraceToSim(policy: EditablePolicy, dr: DryRunResult | null): SimResult | null {
  if (!dr?.trace || dr.trace.length === 0) return null
  const enabledIds = policy.rules.filter((r) => r.enabled).map((r) => r.id)
  const byId = new Map<string, TraceStep>()
  let deciderId: string | null = null
  for (const step of dr.trace) {
    const ruleId = enabledIds[step.index - 1]
    if (!ruleId) continue
    const effect = (
      ['resolve', 'deny', 'pass', 'skip'].includes(step.effect) ? step.effect : 'pass'
    ) as TraceStep['effect']
    byId.set(ruleId, {
      ruleId,
      matched: effect === 'resolve' || effect === 'deny',
      effect,
      note: step.note,
    })
    if (effect === 'deny') deciderId = ruleId
  }
  // Every editor node gets a step; disabled ones the engine never saw → 'off'.
  const trace: TraceStep[] = policy.rules.map(
    (r) =>
      byId.get(r.id) ?? {
        ruleId: r.id,
        matched: false,
        effect: r.enabled ? 'skip' : 'off',
        note: r.enabled ? '' : 'disabled',
      }
  )
  const kind: SimVerdict['kind'] =
    dr.kind === 'Allow' ? 'allow' : dr.kind === 'Rekey' ? 'rekey' : 'deny'
  const verdict: SimVerdict = {
    kind,
    algorithm: dr.algorithm ?? undefined,
    from: dr.from,
    to: dr.to,
    reason: dr.reason ?? dr.denyReason,
  }
  return { verdict, trace, deciderId }
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
  const [dir, setDir] = useState<Dir>('tb')
  const [layout, setLayout] = useState<Layout>(() => defaultLayout(seeded, 'tb'))
  const [token, setToken] = useState<FlowToken | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [rightTab, setRightTab] = useState<RightTab>('simulate')
  const [yamlOpen, setYamlOpen] = useState(false)
  const [req, setReq] = useState<SimRequest>({
    op: 'Sign',
    algorithm: 'ECDSA-P256',
    keyState: 'Active',
    bits: '',
    date: '2026-06-01',
    attrs: ['x-pqctoday-purpose=research'],
    usageFlags: ['Sign', 'Verify'],
    hash: '',
    blockMode: '',
    padding: '',
    mechanism: '',
    deterministic: '',
    keyActivatedOn: '',
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
      setToken(null)
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

  // Rebuild layout after a structural change (add/delete/reorder), preserving
  // manual drag positions for surviving nodes. Kept in the event handler (not an
  // effect) so it never triggers a synchronous-setState-in-effect cascade.
  const relayoutFor = (next: EditablePolicy) => setLayout((prev) => relayout(next, dir, prev))

  const deleteRule = (id: string) => {
    setPolicy((p) => {
      const next = { ...p, rules: p.rules.filter((r) => r.id !== id) }
      relayoutFor(next)
      return next
    })
    if (selectedId === id) setSelectedId(null)
  }
  const addRule = (type: RuleTypeId) => {
    const made = RULE_CATALOG[type].make()
    const rule: EditableRule = { id: newRuleId(), type, enabled: true, ...made }
    setPolicy((p) => {
      const next = { ...p, rules: [...p.rules, rule] }
      relayoutFor(next)
      return next
    })
    setSelectedId(rule.id)
    setRightTab('inspect')
  }
  const moveRule = (id: string, delta: -1 | 1) =>
    setPolicy((p) => {
      const i = p.rules.findIndex((r) => r.id === id)
      const j = i + delta
      if (i < 0 || j < 0 || j >= p.rules.length) return p
      const rules = p.rules.slice()
      const [x] = rules.splice(i, 1)
      rules.splice(j, 0, x)
      const next = { ...p, rules }
      relayoutFor(next)
      return next
    })
  const moveNode = (id: string, xy: { x: number; y: number }) =>
    setLayout((l) => ({ ...l, pos: { ...l.pos, [id]: xy } }))

  const setOrientation = (next: Dir) => {
    if (next === dir) return
    setDir(next)
    setLayout(relayout(policy, next, null))
    setToken(null)
    setSim(null)
  }

  const reset = () => {
    const reseed = toEditable(baseline)
    setPolicy(reseed)
    setLayout(relayout(reseed, dir, null))
    setSelectedId(null)
    setSim(null)
    setToken(null)
    onApplyYaml(baseline)
    setEngineWarnings([])
  }

  const select = (id: string | null) => {
    setSelectedId(id)
    if (id) setRightTab('inspect')
  }

  // ── run simulation: engine verdict (authoritative) + illustrative trace ──
  const rafRef = useRef<number | null>(null)
  const run = useCallback(() => {
    const newObject = /^(Create|CreateKeyPair|Register|Import)/.test(req.op)
    // Authoritative verdict + per-rule trace from the engine FIRST, so the graph
    // can be driven by what the engine actually did (WP4b: dry_run sees the full
    // request dimensions — date/attrs/mask/mechanism).
    let engineDR: DryRunResult | null = null
    try {
      const attrs: Record<string, string> = {}
      for (const a of req.attrs) {
        const [name, ...rest] = a.split('=')
        if (name) attrs[name] = rest.join('=')
      }
      const mechanism = {
        hash: req.hash || undefined,
        blockMode: req.blockMode || undefined,
        padding: req.padding || undefined,
        deterministic: req.deterministic === '' ? undefined : req.deterministic === 'true',
        mech: req.mechanism || undefined,
      }
      engineDR = engine.dryRun({
        op: req.op,
        algorithm: req.algorithm || undefined,
        currentAlgorithm: newObject ? undefined : req.algorithm || undefined,
        length: req.bits === '' ? undefined : Number(req.bits),
        state: req.keyState || undefined,
        date: req.date || undefined,
        attrs: Object.keys(attrs).length ? attrs : undefined,
        usageMask: req.usageFlags.length ? req.usageFlags : undefined,
        activationDate: req.keyActivatedOn || undefined,
        mechanism: Object.values(mechanism).some((v) => v !== undefined) ? mechanism : undefined,
      })
      setEngineVerdict(engineDR)
    } catch {
      setEngineVerdict(null)
    }

    // Drive the graph from the ENGINE's own trace when available; fall back to
    // the illustrative evaluatePolicy only if the wasm predates trace support.
    const result = engineTraceToSim(policy, engineDR) ?? evaluatePolicy(policy, req)
    setSim(result)

    // Build the flow path points (request → matched nodes → terminal) and the
    // per-hop token labels (morphs across resolve nodes).
    const flowIds: string[] = []
    for (const r of policy.rules) {
      flowIds.push(r.id)
      if (result.deciderId && r.id === result.deciderId) break
    }
    const nw = nodeW(dir)
    const reqRect = { x: layout.reqPos.x, y: layout.reqPos.y, w: REQ.w, h: REQ.h }
    const pts = [portOf(reqRect, 'out', dir)]
    let label = req.algorithm
    const labels = [label]
    for (const id of flowIds) {
      const p = layout.pos[id]
      if (!p) continue
      pts.push({ x: p.x + nw / 2, y: p.y + NODE_H / 2 })
      const r = policy.rules.find((x) => x.id === id)
      if (
        r?.type === 'algorithm_substitution' &&
        label.toLowerCase() === (r.scalars.from ?? '').toLowerCase()
      )
        label = r.scalars.to ?? label
      if (r?.type === 'algorithm_default' && !label) label = r.scalars.default_algorithm ?? label
      labels.push(label)
    }
    const sinkKey: TerminalKind = result.verdict.kind
    const skRect = { x: layout.sinks[sinkKey].x, y: layout.sinks[sinkKey].y, w: SINK.w, h: SINK.h }
    pts.push(sinkInPort(sinkKey, skRect, dir))
    labels.push(result.verdict.kind === 'deny' ? '✕' : label)
    const color =
      result.verdict.kind === 'allow'
        ? 'hsl(var(--success))'
        : result.verdict.kind === 'rekey'
          ? 'hsl(var(--warning))'
          : 'hsl(var(--destructive))'

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced || pts.length < 2) {
      const last = pts[pts.length - 1]
      setToken({ x: last.x, y: last.y, label: labels[labels.length - 1], color })
      return
    }

    setRunning(true)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const segMs = 620
    const total = (pts.length - 1) * segMs
    const start = performance.now()
    const tick = (now: number) => {
      const el = now - start
      const gp = Math.min(el / segMs, pts.length - 1)
      const seg = Math.max(0, Math.min(Math.floor(gp), pts.length - 2))
      const f = gp - seg
      const a = pts[seg]
      const b = pts[seg + 1]
      // Defensive: the point pair should always exist (pts is dense, length ≥ 2
      // is guaranteed above), but never let a stale/edge frame deref undefined —
      // an uncaught throw here surfaces as a global error. Snap to the terminal.
      if (!a || !b) {
        const last = pts[pts.length - 1]
        if (last) setToken({ x: last.x, y: last.y, label: labels[labels.length - 1], color })
        setRunning(false)
        return
      }
      const ease = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2
      setToken({
        x: a.x + (b.x - a.x) * ease,
        y: a.y + (b.y - a.y) * ease,
        label: labels[Math.min(seg + (f > 0.6 ? 1 : 0), labels.length - 1)],
        color,
      })
      if (el < total) rafRef.current = requestAnimationFrame(tick)
      else {
        const last = pts[pts.length - 1]
        setToken({ x: last.x, y: last.y, label: labels[labels.length - 1], color })
        setRunning(false)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [engine, policy, req, dir, layout])

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    },
    []
  )

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

        {/* Center: the decision-pipeline canvas */}
        <main className="relative min-h-0">
          {modified && (
            <span className="absolute left-3 top-3 z-20 inline-flex items-center gap-1.5 rounded border border-status-warning/40 bg-status-warning/10 px-1.5 py-0.5 text-[10px] font-semibold text-status-warning">
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
          <GraphCanvas
            policy={policy}
            layout={layout}
            sim={sim}
            selectedId={selectedId}
            request={req}
            token={token}
            onSelect={select}
            onMoveNode={moveNode}
            onToggle={toggleRule}
            onOrientation={setOrientation}
          />
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

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
import {
  Code2,
  ChevronRight,
  Grip,
  FlaskConical,
  ShieldAlert,
  RotateCcw,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { KmipEngine, DryRunResult, PolicyLintFinding } from '@/wasm/kmip/kmipEngine'
import { POLICY_PRESETS, type PolicyPreset } from '@/wasm/kmip/kmipMeta'
import { saveCacpDraft, clearCacpDraft } from '../cacpSessionStorage'
import {
  toEditable,
  serialize,
  validate,
  newRuleId,
  clonePolicy,
  type EditablePolicy,
  type EditableRule,
} from './policyEditModel'
import { RULE_CATALOG, SCOPES, type RuleTypeId } from './ruleCatalog'
import { TextField, TimeBoundField, ChipToggleGroup } from './editorControls'
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
  /** True for a preset split into multiple scoped module files (modular-policy
   * plan, 2026-08-28) — `initialYaml` is then a concatenation of all of them
   * for DISPLAY only. The graph still renders (merging every module's rules,
   * since the parser just scans for `- type:` lines regardless of file
   * boundary), but editing is disabled: re-serializing the merge as ONE
   * policy would declare only the first module's `scopes:` while keeping
   * every other module's rules, which the engine's scope-containment check
   * correctly rejects. Fixing that needs multi-file-aware editing, not
   * built yet — see the modular-policy plan's wave 5. */
  readOnly?: boolean
}

const EMPTY_POLICY: EditablePolicy = {
  schemaVersion: '1',
  metadata: {
    name: 'built-in-permissive',
    description: '',
    authority: '',
    effective: 'always',
    expires: '',
    scopes: [],
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

/**
 * WS-5c (2026-08-28 gaps-remediation plan) — for a multi-module preset
 * (`readOnly`), `dr.trace`'s rule index is local to whichever module fired
 * in the engine's own modular evaluation; `engineTraceToSim`'s
 * `enabledIds[step.index - 1]` assumes one flat file's numbering, so reusing
 * it here would silently highlight the wrong node. Show the engine's real
 * verdict (still authoritative) with an inert, clearly-labeled trace instead
 * of a mismapped one.
 */
function engineVerdictOnlyMultiModule(
  policy: EditablePolicy,
  dr: DryRunResult | null
): SimResult | null {
  if (!dr) return null
  const trace: TraceStep[] = policy.rules.map((r) => ({
    ruleId: r.id,
    matched: false,
    effect: r.enabled ? 'skip' : 'off',
    note: r.enabled ? 'per-rule trace unavailable for multi-module presets' : 'disabled',
  }))
  const kind: SimVerdict['kind'] =
    dr.kind === 'Allow' ? 'allow' : dr.kind === 'Rekey' ? 'rekey' : 'deny'
  const verdict: SimVerdict = {
    kind,
    algorithm: dr.algorithm ?? undefined,
    from: dr.from,
    to: dr.to,
    reason: dr.reason ?? dr.denyReason,
  }
  return { verdict, trace, deciderId: null }
}

type RightTab = 'inspect' | 'simulate' | 'check'

export function PolicyGraphView({
  engine,
  initialYaml,
  presetFile,
  guided,
  onLoadPreset,
  onApplyYaml,
  readOnly = false,
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
  const [metaOpen, setMetaOpen] = useState(false)
  // A-grade review item #13 — the YAML drawer is editable + importable, round-
  // tripping back to the graph. `null` = mirror the graph's generated `yaml`;
  // once the user types, this holds their draft until they Apply or discard it.
  const [yamlDraft, setYamlDraft] = useState<string | null>(null)
  const [req, setReq] = useState<SimRequest>({
    op: 'Sign',
    algorithm: 'ECDSA-P256',
    keyName: '',
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
  const [strictFindings, setStrictFindings] = useState<PolicyLintFinding[]>([])

  const yaml = useMemo(() => serialize(policy), [policy])
  const issues = useMemo(() => validate(policy), [policy])
  const modified = yaml !== baseline
  const selectedRule = policy.rules.find((r) => r.id === selectedId) ?? null
  const selectedIndex = policy.rules.findIndex((r) => r.id === selectedId)

  const yamlText = yamlDraft ?? yaml
  const yamlDirty = yamlDraft !== null && yamlDraft !== yaml
  // "Parsed N of M" (A-grade review A5) — count `- type:` entries in the raw
  // text (M) vs how many `toEditable` actually recognised (N), so a grammar
  // gap the closed parser doesn't model (an unusual list form, an unknown
  // rule type) is visible immediately instead of silently dropping rules.
  const yamlParsedCount = useMemo(() => {
    if (!yamlDirty) return null
    const raw = (yamlText.match(/^\s*-\s*type\s*:/gm) ?? []).length
    const parsed = toEditable(yamlText).rules.length
    return { raw, parsed }
  }, [yamlText, yamlDirty])

  const applyYamlDraft = () => {
    if (!yamlDraft) return
    const next = toEditable(yamlDraft)
    setPolicy(next)
    setLayout(relayout(next, dir, null))
    setSelectedId(null)
    setSim(null)
    setToken(null)
    setYamlDraft(null)
  }
  const discardYamlDraft = () => setYamlDraft(null)

  // Debounced apply of the edited policy to the engine (graph = source of truth).
  // Skipped entirely in `readOnly` mode (a multi-file preset) — see the prop's
  // doc comment for why re-serializing the merge would be actively wrong, not
  // just unsupported.
  const applyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (readOnly) {
      setEngineWarnings([
        'This policy is split into multiple module files — editing the merged view here is not supported yet. Load an individual module from the Policy catalog to edit it.',
      ])
      return
    }
    if (!modified) return
    if (applyTimer.current) clearTimeout(applyTimer.current)
    applyTimer.current = setTimeout(() => {
      const res = onApplyYaml(yaml)
      if (res && !res.ok) setEngineWarnings([res.error ?? 'engine rejected the edited policy'])
      else setEngineWarnings(res?.warnings ?? [])
      setSim(null) // last sim is stale after an edit
      setToken(null)
      // WS-4c — the one global draft slot tracks what's in the EDITOR, not
      // just what the engine accepted, so a syntax error mid-fix is still
      // there to resume on reload.
      saveCacpDraft(presetFile, yaml)
    }, 400)
    return () => {
      if (applyTimer.current) clearTimeout(applyTimer.current)
    }
  }, [yaml, modified, onApplyYaml, readOnly, presetFile])

  // C3 (2026-08-28 gaps-remediation plan) — every strict-lint finding, not
  // just the first fatal one `onApplyYaml`'s `ok:false` surfaces. Runs
  // independently of the apply effect above (pure read, no engine mutation,
  // so it's safe in `readOnly` mode too — a multi-file preset's merged YAML
  // isn't valid single-document YAML, and seeing that as a structural
  // finding here is more informative than staying silent about it).
  const lintTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (lintTimer.current) clearTimeout(lintTimer.current)
    lintTimer.current = setTimeout(() => {
      const res = engine.lintPolicyDraft(yaml)
      setStrictFindings(res.ok ? (res.findings ?? []) : [])
    }, 400)
    return () => {
      if (lintTimer.current) clearTimeout(lintTimer.current)
    }
  }, [engine, yaml])

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

  // WS-6 (2026-08-28 gaps-remediation plan) — metadata form mutations. No
  // relayout needed: metadata never affects the rule graph's node positions.
  const patchMetadata = <K extends keyof EditablePolicy['metadata']>(
    key: K,
    value: EditablePolicy['metadata'][K]
  ) => setPolicy((p) => ({ ...p, metadata: { ...p.metadata, [key]: value } }))

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
    setYamlDraft(null)
    onApplyYaml(baseline)
    setEngineWarnings([])
    clearCacpDraft() // WS-4c — back to the pristine preset, nothing unsaved left to restore
  }

  const select = (id: string | null) => {
    setSelectedId(id)
    if (id) setRightTab('inspect')
  }

  // ── run simulation: engine verdict (authoritative) + illustrative trace ──
  const rafRef = useRef<number | null>(null)
  const run = useCallback(
    (reqOverride?: SimRequest) => {
      const activeReq = reqOverride ?? req
      const newObject = /^(Create|CreateKeyPair|Register|Import)/.test(activeReq.op)
      // Authoritative verdict + per-rule trace from the engine FIRST, so the graph
      // can be driven by what the engine actually did (WP4b: dry_run sees the full
      // request dimensions — date/attrs/mask/mechanism).
      let engineDR: DryRunResult | null = null
      try {
        const attrs: Record<string, string> = {}
        for (const a of activeReq.attrs) {
          const [name, ...rest] = a.split('=')
          if (name) attrs[name] = rest.join('=')
        }
        const mechanism = {
          hash: activeReq.hash || undefined,
          blockMode: activeReq.blockMode || undefined,
          padding: activeReq.padding || undefined,
          deterministic:
            activeReq.deterministic === '' ? undefined : activeReq.deterministic === 'true',
          mech: activeReq.mechanism || undefined,
        }
        engineDR = engine.dryRun({
          op: activeReq.op,
          algorithm: activeReq.algorithm || undefined,
          currentAlgorithm: newObject ? undefined : activeReq.algorithm || undefined,
          length: activeReq.bits === '' ? undefined : Number(activeReq.bits),
          state: activeReq.keyState || undefined,
          name: activeReq.keyName || undefined,
          date: activeReq.date || undefined,
          attrs: Object.keys(attrs).length ? attrs : undefined,
          usageMask: activeReq.usageFlags.length ? activeReq.usageFlags : undefined,
          activationDate: activeReq.keyActivatedOn || undefined,
          mechanism: Object.values(mechanism).some((v) => v !== undefined) ? mechanism : undefined,
        })
        setEngineVerdict(engineDR)
      } catch {
        setEngineVerdict(null)
      }

      // Drive the graph from the ENGINE's own trace when available; fall back to
      // the illustrative evaluatePolicy only if the wasm predates trace support.
      // Multi-module presets (WS-5c) skip the trace mapping entirely — see
      // `engineVerdictOnlyMultiModule`'s doc comment — but still prefer the
      // engine's own verdict over the illustrative one.
      const result = readOnly
        ? (engineVerdictOnlyMultiModule(policy, engineDR) ?? evaluatePolicy(policy, activeReq))
        : (engineTraceToSim(policy, engineDR) ?? evaluatePolicy(policy, activeReq))
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
      let label = activeReq.algorithm
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
      const skRect = {
        x: layout.sinks[sinkKey].x,
        y: layout.sinks[sinkKey].y,
        w: SINK.w,
        h: SINK.h,
      }
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
    },
    [engine, policy, req, dir, layout, readOnly]
  )

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

  // A-grade review item #16 — "Load this policy's example": seed + run the
  // one request that demonstrates the preset's `illustrates` line, so a
  // learner doesn't have to reverse-engineer a probe from the rule list.
  const example = POLICY_PRESETS.find((p) => p.file === presetFile)?.example
  const onLoadExample = () => {
    if (!example) return
    // PolicyExample mirrors SimRequest except its `name` field, which maps
    // to the simulator's `keyName` (the label name_pattern rules match on).
    const { name, ...rest } = example
    const merged: SimRequest = { ...req, ...rest, keyName: name ?? '' }
    setReq(merged)
    run(merged)
  }

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
                // NOT `onRun={run}` — `run` takes an optional `reqOverride:
                // SimRequest`, and wiring it straight to a DOM `onClick`
                // hands it the click's SyntheticEvent as that argument.
                // `activeReq = reqOverride ?? req` then treats the event as
                // the request, and `activeReq.attrs.map(...)` throws on
                // every plain click of "Run through the pipeline".
                onRun={() => run()}
                running={running}
                guided={guided}
                engineVerdict={engineVerdict}
                approximated={approximated}
                policy={policy}
                example={example}
                onLoadExample={onLoadExample}
              />
            )}
            {rightTab === 'check' && (
              <PolicyValidation
                issues={issues}
                engineWarnings={engineWarnings}
                strictFindings={strictFindings.map((f) => ({
                  ruleId: policy.rules[f.ruleIndex - 1]?.id ?? '',
                  fatal: f.fatal,
                  message: f.message,
                }))}
                onSelect={select}
              />
            )}
          </div>
        </aside>
      </div>

      {/* Metadata drawer (WS-6, 2026-08-28 gaps-remediation plan) — real
          inputs for the fields `serialize`/`toEditable` have always round-
          tripped but the graph never let anyone see or edit. Disabled (not
          hidden) in `readOnly` mode: a multi-module preset has no single
          coherent metadata block to edit — same reasoning as rule editing. */}
      <div className="border-t border-border bg-card">
        <Button
          variant="ghost"
          onClick={() => setMetaOpen((o) => !o)}
          className="flex h-auto w-full items-center justify-start gap-2 rounded-none px-4 py-2 text-left font-normal hover:bg-muted/20"
        >
          <FileText size={14} className="text-primary" />
          <span className="text-[12px] font-semibold text-foreground">policy metadata</span>
          <span className="text-[10.5px] text-muted-foreground">
            · name, authority, validity window, scopes
          </span>
          <ChevronRight
            size={14}
            className={cn(
              'ml-auto text-muted-foreground transition-transform',
              metaOpen && 'rotate-90'
            )}
          />
        </Button>
        {metaOpen && (
          <div className="grid gap-3 border-t border-border bg-muted/40 px-4 py-3 sm:grid-cols-2">
            {readOnly && (
              <p className="col-span-full text-[10.5px] text-status-warning">
                Multi-module preset — metadata is per-module; editing here is disabled.
              </p>
            )}
            <div className="flex flex-col gap-1">
              <span className="text-[10.5px] font-medium text-muted-foreground">name</span>
              <TextField
                value={policy.metadata.name}
                onChange={(v) => patchMetadata('name', v)}
                disabled={readOnly}
                ariaLabel="Policy name"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10.5px] font-medium text-muted-foreground">authority</span>
              <TextField
                value={policy.metadata.authority}
                onChange={(v) => patchMetadata('authority', v)}
                disabled={readOnly}
                ariaLabel="Policy authority"
              />
            </div>
            <label className="col-span-full flex flex-col gap-1">
              <span className="text-[10.5px] font-medium text-muted-foreground">description</span>
              <textarea
                value={policy.metadata.description}
                onChange={(e) => patchMetadata('description', e.target.value)}
                disabled={readOnly}
                aria-label="Policy description"
                rows={2}
                className="w-full resize-y rounded-lg border border-input bg-background/40 px-2 py-1.5 text-[12px] text-foreground outline-none focus:border-primary disabled:opacity-50"
              />
            </label>
            <div className="flex flex-col gap-1">
              <span className="text-[10.5px] font-medium text-muted-foreground">effective</span>
              <TimeBoundField
                value={policy.metadata.effective}
                onChange={(v) => patchMetadata('effective', v)}
                disabled={readOnly}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10.5px] font-medium text-muted-foreground">expires</span>
              <TimeBoundField
                value={policy.metadata.expires}
                onChange={(v) => patchMetadata('expires', v)}
                unsetValue="never"
                unsetLabel="never"
                disabled={readOnly}
              />
            </div>
            <div className="col-span-full flex flex-col gap-1">
              <span className="text-[10.5px] font-medium text-muted-foreground">scopes</span>
              <ChipToggleGroup
                value={policy.metadata.scopes}
                options={SCOPES.map((s) => s.id)}
                onChange={(next) => patchMetadata('scopes', next)}
                disabled={readOnly}
              />
            </div>
          </div>
        )}
      </div>

      {/* YAML drawer — editable + importable (A-grade review item #13) */}
      <div className="border-t border-border bg-card">
        <Button
          variant="ghost"
          onClick={() => setYamlOpen((o) => !o)}
          className="flex h-auto w-full items-center justify-start gap-2 rounded-none px-4 py-2 text-left font-normal hover:bg-muted/20"
        >
          <Code2 size={14} className="text-primary" />
          <span className="text-[12px] font-semibold text-foreground">policy source (YAML)</span>
          <span className="text-[10.5px] text-muted-foreground">
            · edit, or paste a whole policy to import it
          </span>
          {yamlDirty && yamlParsedCount && (
            <span
              className={cn(
                'rounded px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide',
                yamlParsedCount.parsed < yamlParsedCount.raw
                  ? 'bg-status-warning/15 text-status-warning'
                  : 'bg-status-success/15 text-status-success'
              )}
            >
              parsed {yamlParsedCount.parsed} of {yamlParsedCount.raw} rules
            </span>
          )}
          <ChevronRight
            size={14}
            className={cn(
              'ml-auto text-muted-foreground transition-transform',
              yamlOpen && 'rotate-90'
            )}
          />
        </Button>
        {yamlOpen && (
          <div className="border-t border-border bg-muted/40 px-4 py-2.5">
            <textarea
              value={yamlText}
              onChange={(e) => setYamlDraft(e.target.value)}
              spellCheck={false}
              aria-label="Policy YAML source"
              className="max-h-56 min-h-[10rem] w-full resize-y overflow-auto whitespace-pre rounded border border-transparent bg-transparent font-mono text-[10.5px] leading-relaxed text-foreground outline-none focus:border-primary/40"
            />
            {yamlDirty && (
              <div className="mt-2 flex items-center gap-2">
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={applyYamlDraft}
                  className="h-7 gap-1.5 px-2.5 text-[11px]"
                >
                  Apply to graph
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={discardYamlDraft}
                  className="h-7 px-2.5 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Discard
                </Button>
                {yamlParsedCount && yamlParsedCount.parsed < yamlParsedCount.raw && (
                  <span className="text-[10.5px] text-status-warning">
                    {yamlParsedCount.raw - yamlParsedCount.parsed} rule(s) in this text won't
                    survive the round trip — check the grammar against the shipped fixtures.
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection -- index keys are typed
   `PolicyTone` / `Disposition` enum values and known preset file names, never
   user input. */
//
// PolicyView — the dedicated Policy screen. Left: the full catalog of crypto
// policies grouped by what they illustrate (selecting one activates it in the
// engine). Right: a visual breakdown of the active policy — resolved defaults
// (authoritative, from the engine's dry-run), an algorithm-disposition matrix,
// every rule colour-coded by family, a temporal timeline, and the raw YAML.
import { useEffect, useMemo, useState } from 'react'
import {
  Library,
  ShieldCheck,
  FlaskConical,
  CalendarClock,
  Grid3x3,
  List as ListIcon,
  Workflow,
  Code2,
  GitCompare,
  ChevronRight,
  LayoutGrid,
  Landmark,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { cn } from '@/lib/utils'
import type { DryRunResult, KmipEngine, PolicyStatus } from '@/wasm/kmip/kmipEngine'
import { ModuleStatusPanel } from './ModuleStatusPanel'
import {
  POLICY_PRESETS,
  POLICY_CATEGORIES,
  REGULATORS,
  isRunnable,
  type PolicyPreset,
  type PolicyTone,
} from '@/wasm/kmip/kmipMeta'
import {
  parsePolicyModel,
  temporalRules,
  dispositionOf,
  type PolicyModel,
  type Disposition,
} from './policyModel'
import { Pkcs11BypassDemo } from './Pkcs11BypassDemo'
import { Pkcs11CertificateDemo } from './Pkcs11CertificateDemo'
import { PolicyRulesDisplay, PolicyRulesLegend } from './PolicyRulesDisplay'
import { PolicyTimeline } from './PolicyTimeline'
import { PolicyGraphView } from './visual/PolicyGraphView'

/** Tone → dot colour for catalog chips. */
const TONE_DOT: Record<PolicyTone, string> = {
  permissive: 'bg-muted-foreground',
  classical: 'bg-status-info',
  pqc: 'bg-status-success',
  compliance: 'bg-primary',
  regional: 'bg-status-warning',
  hybrid: 'bg-status-success',
  migration: 'bg-status-warning',
  mechanism: 'bg-primary',
}

/** Match the active engine policy to a preset (built-in permissive aliases the
 * training-permissive preset). */
const isActive = (p: PolicyPreset, policy: PolicyStatus): boolean =>
  policy.name === p.name ||
  (p.name === 'training-permissive' && policy.name === 'built-in-permissive')

/** Algorithms shown in the disposition matrix — PQC + classical, for contrast.
 * `op` is the CREATE-time operation a per-cell `dryRun` exercises (A-grade
 * review A1/A3 — the matrix used to be a pure static-YAML heuristic with no
 * notion of time/scope; every entry with an `op` is now a real engine
 * verdict "would creating this algorithm be allowed right now"). Three
 * entries have `op: null` — SHA-256/SHA-1/3DES are hashing/legacy-cipher
 * *mechanism* names, not `CryptographicAlgorithm` values, so they're gated
 * by a separate `hash_algorithm_allowlist`/MAC rule keyed on the request's
 * `mechanism` field, not `algorithm`; a single dry-run can't represent that
 * dimension without inventing an arbitrary carrier key, so these three stay
 * on the static rule-text heuristic (`dispositionOf`), same as before. */
const MATRIX_ALGOS: { algo: string; op: string | null }[] = [
  { algo: 'ML-DSA-87', op: 'CreateKeyPair:Sign' },
  { algo: 'ML-DSA-65', op: 'CreateKeyPair:Sign' },
  { algo: 'ML-KEM-1024', op: 'CreateKeyPair:KeyAgreement' },
  { algo: 'ML-KEM-768', op: 'CreateKeyPair:KeyAgreement' },
  { algo: 'SLH-DSA-SHA2-256s', op: 'CreateKeyPair:Sign' },
  // Stateful HBS (SP 800-208) + the CSD02 hybrid KEM — CNSA 2.0 allows
  // LMS/XMSS and denies HSS; BSI mandates hybrid establishment. None of
  // these were visible anywhere in the UI (2026-07-04 gap audit).
  { algo: 'LMS', op: 'CreateKeyPair:Sign' },
  { algo: 'HSS', op: 'CreateKeyPair:Sign' },
  { algo: 'X25519MLKEM768', op: 'CreateKeyPair:KeyAgreement' },
  { algo: 'FrodoKEM-1344', op: 'CreateKeyPair:KeyAgreement' },
  { algo: 'Classic-McEliece-6688128', op: 'CreateKeyPair:KeyAgreement' },
  { algo: 'AES-256', op: 'Create' },
  { algo: 'RSA', op: 'CreateKeyPair:Sign' },
  { algo: 'ECDSA-P256', op: 'CreateKeyPair:Sign' },
  { algo: 'ECDSA-P384', op: 'CreateKeyPair:Sign' },
  { algo: 'Ed25519', op: 'CreateKeyPair:Sign' },
  { algo: 'ECDH-P256', op: 'CreateKeyPair:KeyAgreement' },
  { algo: 'SHA-256', op: null },
  { algo: 'SHA-1', op: null },
  { algo: '3DES', op: null },
]

const DISPOSITION_STYLE: Record<Disposition, { cls: string; label: string }> = {
  default: {
    cls: 'border-status-success/60 bg-status-success/15 text-status-success',
    label: 'default',
  },
  'rekey-to': {
    cls: 'border-status-success/50 bg-status-success/10 text-status-success',
    label: 'rekey →',
  },
  allowed: { cls: 'border-status-info/50 bg-status-info/10 text-status-info', label: 'allowed' },
  'rekey-from': {
    cls: 'border-status-warning/50 bg-status-warning/10 text-status-warning',
    label: '→ migrated',
  },
  denied: { cls: 'border-destructive/50 bg-destructive/10 text-destructive', label: 'denied' },
  neutral: { cls: 'border-border bg-muted/30 text-muted-foreground', label: '—' },
}

/** Engine-computed cells only ever come back Allow/Deny (a `CreateKeyPair`
 * dry-run with an explicit `algorithm` has no existing object to migrate, so
 * `Decision::RekeyAndProceed` can't fire) — map straight onto the existing
 * disposition styling. */
const dryRunDisposition = (r: DryRunResult): Disposition =>
  r.kind === 'Deny' ? 'denied' : 'allowed'

/** Governance tags supplied on every sweep dry-run (2026-07-04). The matrix
 * answers "what does this policy say about the ALGORITHM" — without these,
 * attribute-gated policies (cnsa-2.0 classification, bsi hybrid-partner,
 * 2030 purpose) denied every creation cell for the missing tag and the whole
 * matrix read as "everything denied", contradicting the preset blurb next to
 * it. `require_custom_attribute` checks presence, not value, so a superset
 * is safe and never changes an algorithm verdict. */
const SWEEP_GOV_ATTRS: Record<string, string> = {
  'pqctoday-cnsa-classification': 'Secret',
  'pqctoday-hybrid-partner': 'ECDH-P384',
  'pqctoday-purpose': 'production',
}

/** Sweep every engine-computed MATRIX_ALGOS entry against the CURRENTLY
 * ACTIVE engine policy at the given as-of date — shared by the List-tab
 * matrix and the Compare tab (which loads each side in turn before sweeping,
 * then restores). `date` (YYYY-MM-DD) drives temporal rules; omitted → now. */
function sweepDispositions(engine: KmipEngine, date?: string): Record<string, Disposition> {
  const out: Record<string, Disposition> = {}
  for (const { algo, op } of MATRIX_ALGOS) {
    if (!op) continue
    try {
      out[algo] = dryRunDisposition(
        engine.dryRun({ op, algorithm: algo, date, attrs: SWEEP_GOV_ATTRS })
      )
    } catch {
      out[algo] = 'neutral'
    }
  }
  return out
}

/** The USE-time counterpart of each MATRIX_ALGOS creation op — an existing
 * key of that algorithm being actually used, not just created. A single
 * disposition cell can only test one dimension; the coverage sweep (A-grade
 * review item #10/C2) tests BOTH, since "can I create this" and "can I use
 * one I already have" are genuinely different questions (e.g. rekey-on-use
 * policies allow creating a legacy algorithm but rewrite it at first Sign). */
const USE_OPS: Record<string, [string, string]> = {
  // [protect-side use, recover-side use]. The recover column (Verify /
  // Decrypt / Decapsulate) was missing entirely (2026-07-04) — exactly the
  // ops transition policies promise to keep open for legacy artefacts, so
  // their openness must be visible, and a policy that accidentally closes
  // them must show up here.
  'CreateKeyPair:Sign': ['Sign', 'SignatureVerify'],
  'CreateKeyPair:KeyAgreement': ['Encapsulate', 'Decapsulate'],
  Create: ['Encrypt', 'Decrypt'],
}

/** Op × algorithm coverage sweep — three ops per MATRIX_ALGOS entry (creation
 * + protect-use + recover-use), each a real dry-run at the shared as-of date.
 * Keyed `${algo}|${op}`. Use-side dry-runs model an EXISTING key: it carries
 * the governance tags (a compliant creation stored them) and an Active state. */
function sweepCoverage(engine: KmipEngine, date?: string): Record<string, Disposition> {
  const out: Record<string, Disposition> = {}
  for (const { algo, op: createOp } of MATRIX_ALGOS) {
    if (!createOp) continue
    for (const op of [createOp, ...USE_OPS[createOp]]) {
      const key = `${algo}|${op}`
      try {
        out[key] = dryRunDisposition(
          engine.dryRun({
            op,
            algorithm: algo,
            currentAlgorithm: op === createOp ? undefined : algo,
            date,
            attrs: SWEEP_GOV_ATTRS,
          })
        )
      } catch {
        out[key] = 'neutral'
      }
    }
  }
  return out
}

function DefaultPill({ label, algo }: { label: string; algo: string | null }) {
  const pqc = !!algo && /^(ML-|SLH-|FN-|Falcon|HQC|BIKE|Frodo|Classic)/i.test(algo)
  return (
    <div className="rounded-lg border border-border bg-background/60 px-3 py-2">
      <p className="text-[9.5px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label} →
      </p>
      <p
        className={cn(
          'mt-0.5 font-mono text-sm font-semibold',
          algo ? (pqc ? 'text-status-success' : 'text-status-info') : 'text-muted-foreground'
        )}
      >
        {algo ?? 'denied'}
      </p>
    </div>
  )
}

type DetailTab = 'list' | 'visual' | 'compare' | 'timeline' | 'yaml'

export function PolicyView({
  engine,
  policy,
  policyYaml,
  busy,
  expert,
  onLoadPolicy,
  onApplyYaml,
}: {
  engine: KmipEngine
  policy: PolicyStatus
  policyYaml: string | null
  busy: boolean
  expert: boolean
  onLoadPolicy: (preset: PolicyPreset) => void
  onApplyYaml: (yaml: string) => { ok: boolean; warnings?: string[]; error?: string } | undefined
}) {
  const [models, setModels] = useState<Record<string, PolicyModel>>({})
  const [rawYaml, setRawYaml] = useState<Record<string, string>>({})
  const [detailTab, setDetailTab] = useState<DetailTab>('list')
  // Shared "as-of" date (A-grade review item #15) — one slider the matrix,
  // Compare, and Timeline all evaluate at, so a temporal cutoff (e.g. the
  // 2030 classical-Sign ban) visibly flips as you scrub instead of only
  // ever being described in prose. Defaults to today.
  const todayIso = new Date().toISOString().slice(0, 10)
  const [asOfDate, setAsOfDate] = useState(todayIso)

  // Fetch + parse every preset once, so each catalog card can show a rule count
  // and the detail panel can render without a per-selection round trip. Also
  // keeps the raw YAML text (not just the parsed display model) so Compare
  // (item #14) can temporarily load either side into the engine for a real
  // per-algorithm dry-run diff.
  useEffect(() => {
    let alive = true
    Promise.all(
      POLICY_PRESETS.map((p) => {
        // Modular-policy plan (2026-08-28) — a split preset's `files` are
        // fetched and concatenated under the SAME `p.file` key every other
        // consumer (Compare, YAML tab, rule counts) already reads from, so
        // this is the only place that needs to know about the split.
        const sources = p.files && p.files.length > 0 ? p.files : [p.file]
        return Promise.all(
          sources.map((f) =>
            fetch(`/kmip-policies/${f}`)
              .then((r) => (r.ok ? r.text() : ''))
              .catch(() => '')
          )
        ).then(
          (texts) =>
            [
              p.file,
              texts.every((t) => t) ? texts.join('\n\n# ── next module ──\n\n') : '',
            ] as const
        )
      })
    ).then((entries) => {
      if (!alive) return
      const nextModels: Record<string, PolicyModel> = {}
      const nextRaw: Record<string, string> = {}
      for (const [file, txt] of entries) {
        if (!txt) continue
        nextModels[file] = parsePolicyModel(txt)
        nextRaw[file] = txt
      }
      setModels(nextModels)
      setRawYaml(nextRaw)
    })
    return () => {
      alive = false
    }
  }, [])

  const activePreset = POLICY_PRESETS.find((p) => isActive(p, policy))
  const activeModel = useMemo<PolicyModel | undefined>(() => {
    if (activePreset && models[activePreset.file]) return models[activePreset.file]
    return policyYaml ? parsePolicyModel(policyYaml) : undefined
  }, [activePreset, models, policyYaml])

  // Authoritative resolved defaults — a cheap dry-run of the live engine policy.
  const resolveDefault = (op: string): string | null => {
    void policy.fingerprint
    try {
      const r = engine.dryRun({ op, date: asOfDate })
      return r.kind === 'Deny' ? null : (r.algorithm ?? null)
    } catch {
      return null
    }
  }
  const signDefault = resolveDefault('CreateKeyPair:Sign')
  const kemDefault = resolveDefault('CreateKeyPair:KeyAgreement')

  // Engine-computed disposition matrix (A-grade review A1/A3) — a real
  // per-cell dry-run against the LIVE active policy at the shared as-of date,
  // not a static YAML heuristic. Re-runs whenever the policy or date changes.
  const matrixDispositions = useMemo(() => {
    // `dryRun` implicitly reads the engine's active-policy state, keyed by this
    // fingerprint — not visible to the dep analyzer otherwise (same idiom as
    // `resolveDefault` above).
    void policy.fingerprint
    return sweepDispositions(engine, asOfDate)
  }, [engine, policy.fingerprint, asOfDate])

  // Op × algorithm coverage sweep (A-grade review C2) — collapsed by default
  // (26 extra dry-runs); only computed once expanded.
  const [coverageOpen, setCoverageOpen] = useState(false)
  const coverageDispositions = useMemo(() => {
    if (!coverageOpen) return null
    void policy.fingerprint
    return sweepCoverage(engine, asOfDate)
  }, [engine, policy.fingerprint, asOfDate, coverageOpen])

  // ── Compare (A-grade review item #14) ─────────────────────────────────
  // Two presets, side by side, with a real per-algorithm verdict diff. Each
  // side is loaded into the engine in turn (`rawYaml` from the fetch above),
  // swept, then the engine is restored to whatever was actually active. This
  // MUST run as an effect, not a memo: it mutates the shared engine (each
  // `loadPolicy` records a Plane-1 `PolicyActivated` audit event — real,
  // honest side effects React must not run/discard/replay during render).
  const [compareAFile, setCompareAFile] = useState('classical.yaml')
  const [compareBFile, setCompareBFile] = useState('pqc.yaml')
  const [compareResult, setCompareResult] = useState<{
    a: Record<string, Disposition>
    b: Record<string, Disposition>
  } | null>(null)
  useEffect(() => {
    if (detailTab !== 'compare') return
    const presetA = POLICY_PRESETS.find((p) => p.file === compareAFile)
    const presetB = POLICY_PRESETS.find((p) => p.file === compareBFile)
    const yamlA = rawYaml[compareAFile]
    const yamlB = rawYaml[compareBFile]
    if (!presetA || !presetB || !yamlA || !yamlB) {
      setCompareResult(null)
      return
    }
    let cancelled = false
    // Modular-policy plan (2026-08-28) — a split preset's `rawYaml` entry is
    // the CONCATENATION of its module files (fine for display, but not valid
    // single-document YAML), so comparing it must go through the real
    // multi-file activation path, not `engine.loadPolicy`. Async because that
    // path re-fetches each module file.
    const activateSide = async (preset: PolicyPreset, mergedYaml: string) => {
      if (preset.files && preset.files.length > 0) {
        const yamls = await Promise.all(
          preset.files.map((f) => fetch(`/kmip-policies/${f}`).then((r) => r.text()))
        )
        engine.activateModulePreset(preset.name, yamls)
      } else {
        engine.loadPolicy(mergedYaml)
      }
    }
    void (async () => {
      await activateSide(presetA, yamlA)
      const a = sweepDispositions(engine, asOfDate)
      await activateSide(presetB, yamlB)
      const b = sweepDispositions(engine, asOfDate)
      // Restore whatever was actually active before Compare ran.
      if (activePreset?.files && activePreset.files.length > 0) {
        await activateSide(activePreset, '')
      } else {
        const restoreTo = policyYaml ?? rawYaml['training-permissive.yaml']
        if (restoreTo) onApplyYaml(restoreTo)
      }
      if (!cancelled) setCompareResult({ a, b })
    })()
    return () => {
      cancelled = true
    }
    // `onApplyYaml`/`activePreset` are fresh references every parent render
    // (not memoized) — depending on them would re-run this (and re-mutate the
    // shared engine, re-emitting audit events) on every unrelated re-render.
    // `engine` + the explicit file/tab/date deps already capture everything
    // that actually needs to retrigger the sweep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, detailTab, compareAFile, compareBFile, rawYaml, policyYaml, asOfDate])

  const temporal = activeModel ? temporalRules(activeModel) : []
  const visualActive = detailTab === 'visual'

  const tabs: { id: DetailTab; label: string; icon: typeof ListIcon }[] = [
    { id: 'list', label: 'List', icon: ListIcon },
    { id: 'visual', label: 'Visual', icon: Workflow },
    { id: 'compare', label: 'Compare', icon: GitCompare },
    { id: 'timeline', label: 'Timeline', icon: CalendarClock },
    { id: 'yaml', label: 'YAML', icon: Code2 },
  ]

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 items-start',
        !visualActive && 'lg:grid-cols-[300px_1fr]'
      )}
    >
      {/* ── Catalog (hidden in Visual mode — the palette has its own switcher) ─ */}
      <section
        data-tour="policy-library"
        className={cn('rounded-xl border border-border bg-card p-3', visualActive && 'hidden')}
      >
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Library size={15} className="text-primary" /> Policy library
          <span className="ml-auto text-[10px] font-mono text-muted-foreground">
            {POLICY_PRESETS.length}
          </span>
        </h3>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Selecting a policy activates it — every plane obeys it instantly.
        </p>

        {/* "Which regime governs you?" quick-pick (A-grade review item #18) —
            same onLoadPolicy handler as the catalog below, just entered by
            regulator name instead of by what the rule illustrates. */}
        <div className="mt-3 rounded-lg border border-border bg-background/40 p-2">
          <p className="flex items-center gap-1 text-[10px] font-semibold text-foreground">
            <Landmark size={11} className="text-primary" /> Which regime governs you?
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {REGULATORS.map((r) => {
              const preset = POLICY_PRESETS.find((p) => p.file === r.file)
              if (!preset) return null
              const on = isActive(preset, policy)
              return (
                <Button
                  key={r.file}
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => onLoadPolicy(preset)}
                  title={preset.blurb}
                  className={cn(
                    'h-auto rounded-full border px-2 py-0.5 text-[10.5px] font-medium',
                    on
                      ? 'border-primary/60 bg-primary/10 text-primary'
                      : 'border-border bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  )}
                >
                  {r.label}
                </Button>
              )
            })}
          </div>
        </div>

        <div className="mt-3 space-y-3">
          {POLICY_CATEGORIES.map((cat) => {
            const presets = POLICY_PRESETS.filter((p) => p.category === cat)
            if (presets.length === 0) return null
            return (
              <div key={cat}>
                <p className="mb-1 text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">
                  {cat}
                </p>
                <div className="space-y-1">
                  {presets.map((p) => {
                    const on = isActive(p, policy)
                    const ruleCount = models[p.file]?.rules.length
                    return (
                      <Button
                        key={p.file}
                        variant="ghost"
                        disabled={busy}
                        onClick={() => onLoadPolicy(p)}
                        title={p.blurb}
                        className={cn(
                          'h-auto w-full flex-col items-stretch gap-0.5 whitespace-normal rounded-lg border px-2.5 py-2 text-left',
                          on
                            ? 'border-primary/60 bg-primary/10'
                            : 'border-border bg-background/40 hover:border-primary/40'
                        )}
                      >
                        <div className="flex w-full items-center gap-2">
                          <span className={cn('h-2 w-2 shrink-0 rounded-full', TONE_DOT[p.tone])} />
                          <span className="text-[12.5px] font-semibold text-foreground">
                            {p.label}
                          </span>
                          {on && (
                            <span className="text-[8.5px] font-bold uppercase tracking-wide text-primary">
                              active
                            </span>
                          )}
                          {typeof ruleCount === 'number' && (
                            <span className="ml-auto text-[9px] font-mono text-muted-foreground">
                              {ruleCount} rule{ruleCount === 1 ? '' : 's'}
                            </span>
                          )}
                        </div>
                        <p className="text-[10.5px] font-normal leading-snug text-muted-foreground">
                          {p.illustrates}
                        </p>
                      </Button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Detail ──────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {/* Header */}
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-base font-bold text-foreground">
                {activePreset?.label ?? 'Built-in permissive'}
              </h3>
              <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
                {activeModel?.description ??
                  activePreset?.blurb ??
                  'Allows everything — pick a policy from the library to constrain the engine.'}
              </p>
            </div>
            <div className="text-right text-[10px] text-muted-foreground shrink-0">
              {activeModel?.authority && (
                <p>
                  authority{' '}
                  <span className="font-mono text-foreground">{activeModel.authority}</span>
                </p>
              )}
              {activeModel?.effective && (
                <p>
                  effective{' '}
                  <span className="font-mono text-foreground">{activeModel.effective}</span>
                </p>
              )}
            </div>
          </div>

          {/* Compliance chips */}
          {activeModel && activeModel.compliance.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {activeModel.compliance.map((c, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded border border-border bg-muted/30 px-1.5 py-0.5 text-[10px] text-foreground"
                >
                  <ShieldCheck size={10} className="text-status-info" />
                  {c.framework}
                  {c.tag && <span className="text-muted-foreground">· {c.tag}</span>}
                </span>
              ))}
            </div>
          )}

          {/* Shared as-of date (A-grade review item #15) — drives Resolved
              defaults above, the List matrix, and Compare; drag to watch a
              temporal cutoff flip live instead of only reading about it. */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <CalendarClock size={11} /> As of
            </span>
            <input
              type="range"
              min={Date.UTC(2025, 0, 1)}
              max={Date.UTC(2036, 0, 1)}
              step={24 * 3600 * 1000}
              value={new Date(`${asOfDate}T00:00:00Z`).getTime()}
              onChange={(e) =>
                setAsOfDate(new Date(Number(e.target.value)).toISOString().slice(0, 10))
              }
              className="w-36 accent-primary"
              aria-label="As-of date"
            />
            <span className="font-mono text-[11px] text-foreground">{asOfDate}</span>
            {asOfDate !== todayIso && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAsOfDate(todayIso)}
                className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
              >
                today
              </Button>
            )}
          </div>

          {/* Resolved defaults (authoritative) */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <FlaskConical size={11} /> Resolved defaults
            </span>
            <DefaultPill label="Signing" algo={signDefault} />
            <DefaultPill label="Key exchange" algo={kemDefault} />
            <div className="rounded-lg border border-border bg-background/60 px-3 py-2 text-center">
              <p className="text-[9.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                Rules
              </p>
              <p className="mt-0.5 text-sm font-bold text-foreground">
                {typeof policy.rules === 'number' ? policy.rules : (activeModel?.rules.length ?? 0)}
              </p>
            </div>
          </div>

          {/* Module status (WS-7A, 2026-08-28 gaps-remediation plan) — only
              renders when a multi-module preset is active. */}
          <ModuleStatusPanel engine={engine} />
        </section>

        {/* ── Sub-tab row ─────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-1 border-b border-border"
          role="tablist"
          data-tour="policy-subtabs"
        >
          {tabs.map((t) => {
            const Icon = t.icon
            const on = detailTab === t.id
            return (
              <Button
                key={t.id}
                variant="ghost"
                role="tab"
                aria-selected={on}
                onClick={() => setDetailTab(t.id)}
                className={cn(
                  '-mb-px inline-flex h-auto items-center gap-1.5 rounded-none border-b-2 px-3 py-2 text-[12.5px] font-medium transition-colors hover:bg-transparent',
                  on
                    ? 'border-primary font-semibold text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon size={13} />
                {t.label}
              </Button>
            )
          })}
          {visualActive && (
            <span className="ml-auto pr-2 text-[10.5px] text-muted-foreground">
              graph is the source of truth
            </span>
          )}
        </div>

        {/* ── List: disposition matrix + rule cards ─────────────────────── */}
        {detailTab === 'list' && (
          <>
            {activeModel && (
              <section className="rounded-xl border border-border bg-card p-4">
                <h4 className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Grid3x3 size={14} className="text-primary" /> Algorithm disposition
                </h4>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {MATRIX_ALGOS.map(({ algo, op }) => {
                    // 13 of 16 entries: a real per-cell dry-run against the live policy
                    // (matrixDispositions). The 3 mechanism-only entries (op === null)
                    // fall back to the static rule-text heuristic — see MATRIX_ALGOS' doc.
                    const d = op
                      ? (matrixDispositions[algo] ?? 'neutral')
                      : dispositionOf(activeModel, algo)
                    const s = DISPOSITION_STYLE[d]
                    const specOnly = !isRunnable(algo)
                    return (
                      <div
                        key={algo}
                        className={cn(
                          'rounded-md border px-2 py-1',
                          s.cls,
                          specOnly && 'opacity-70'
                        )}
                        title={
                          specOnly
                            ? `${algo}: ${s.label} (per policy) — spec-only, not runnable in this browser engine`
                            : `${algo}: ${s.label}${op ? ' (live engine verdict)' : ' (from rule text)'}`
                        }
                      >
                        <span className="font-mono text-[10.5px] text-foreground">{algo}</span>
                        <span className="ml-1.5 text-[9px] font-semibold">{s.label}</span>
                        {specOnly && (
                          <span className="ml-1.5 text-[8.5px] font-semibold uppercase tracking-wide text-status-warning">
                            spec-only
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
                <p className="mt-2 text-[9.5px] text-muted-foreground">
                  Most cells are a real per-cell dry-run against the active policy right now (not a
                  static heuristic). Three mechanism-only entries (SHA-256/SHA-1/3DES) are still
                  derived from rule text, and a "spec-only" cell means the policy names a real
                  algorithm this in-browser engine can't actually create — for the full op × date ×
                  attribute picture, use the Visual tab's simulator or the dry-run tester on the
                  Agility tab.
                </p>

                {/* Coverage sweep (A-grade review C2) — creation vs. use, not
                    just one representative op per algorithm. */}
                <div className="mt-3 border-t border-border pt-3">
                  <Button
                    variant="ghost"
                    onClick={() => setCoverageOpen((o) => !o)}
                    className="flex h-auto w-full items-center justify-start gap-1.5 p-0 text-left font-normal hover:bg-transparent"
                  >
                    <LayoutGrid size={12} className="text-primary" />
                    <span className="text-[11px] font-semibold text-foreground">
                      Coverage sweep — creation vs. use, every op
                    </span>
                    <ChevronRight
                      size={12}
                      className={cn(
                        'text-muted-foreground transition-transform',
                        coverageOpen && 'rotate-90'
                      )}
                    />
                  </Button>
                  {coverageOpen && coverageDispositions && (
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full text-[10.5px]">
                        <thead className="border-b border-border text-left text-muted-foreground">
                          <tr>
                            <th className="py-1 pr-3 font-semibold">Algorithm</th>
                            <th className="py-1 pr-3 font-semibold">Create</th>
                            <th className="py-1 pr-3 font-semibold">Protect</th>
                            <th className="py-1 font-semibold">Recover</th>
                          </tr>
                        </thead>
                        <tbody>
                          {MATRIX_ALGOS.filter(({ op }) => op).map(({ algo, op: createOp }) => {
                            const [protectOp, recoverOp] = USE_OPS[createOp!]
                            const dCreate = coverageDispositions[`${algo}|${createOp}`] ?? 'neutral'
                            const dProtect =
                              coverageDispositions[`${algo}|${protectOp}`] ?? 'neutral'
                            const dRecover =
                              coverageDispositions[`${algo}|${recoverOp}`] ?? 'neutral'
                            return (
                              <tr key={algo} className="border-b border-border/40">
                                <td className="py-1 pr-3 font-mono text-foreground">{algo}</td>
                                <td className="py-1 pr-3">
                                  <span title={createOp!}>{DISPOSITION_STYLE[dCreate].label}</span>
                                </td>
                                <td className="py-1 pr-3">
                                  <span title={protectOp}>{DISPOSITION_STYLE[dProtect].label}</span>
                                  {dCreate !== dProtect && (
                                    <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wide text-status-warning">
                                      differs
                                    </span>
                                  )}
                                </td>
                                <td className="py-1">
                                  <span title={recoverOp}>{DISPOSITION_STYLE[dRecover].label}</span>
                                  {dRecover === 'denied' && dProtect !== 'denied' && (
                                    <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wide text-destructive">
                                      legacy locked out
                                    </span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                      <p className="mt-1.5 text-[9.5px] text-muted-foreground">
                        "Create" = new key of this algorithm. "Protect" = Sign / Encrypt /
                        Encapsulate with an existing key. "Recover" = Verify / Decrypt / Decapsulate
                        — the ops transition policies keep open so legacy artefacts stay readable; a
                        denial here on an otherwise-allowed algorithm is a red flag. Sweeps run with
                        the governance tags supplied (classification, hybrid-partner, purpose), so
                        cells reflect the ALGORITHM verdict, not a missing tag.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            <section className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h4 className="text-xs font-semibold text-foreground">What this policy enforces</h4>
                {activeModel && <PolicyRulesLegend rules={activeModel.rules} />}
              </div>
              <div className="mt-3">
                <PolicyRulesDisplay rules={activeModel?.rules ?? []} />
              </div>
            </section>

            <Pkcs11BypassDemo engine={engine} />
            <Pkcs11CertificateDemo engine={engine} />
          </>
        )}

        {/* ── Visual: the node-graph editor ─────────────────────────────── */}
        {visualActive && (
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <PolicyGraphView
              key={activePreset?.file ?? '__builtin__'}
              engine={engine}
              initialYaml={policyYaml}
              presetFile={activePreset?.file ?? null}
              guided={!expert}
              onLoadPreset={onLoadPolicy}
              onApplyYaml={onApplyYaml}
              readOnly={Boolean(activePreset?.files)}
            />
          </section>
        )}

        {/* ── Compare: two policies, one per-algorithm verdict diff ───────── */}
        {detailTab === 'compare' && (
          <section className="rounded-xl border border-border bg-card p-4">
            <h4 className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <GitCompare size={14} className="text-primary" /> Compare two policies
            </h4>
            <p className="mt-1 text-[11px] text-muted-foreground">
              A real per-algorithm dry-run for each side — the same "flip the policy, watch it
              change" story, held side by side instead of one at a time. Comparing briefly loads
              each policy into the engine (you'll see it noted in the Activity trail), then restores
              whatever was actually active.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:max-w-md">
              <FilterDropdown
                items={POLICY_PRESETS.map((p) => ({ id: p.file, label: p.label }))}
                selectedId={compareAFile}
                onSelect={setCompareAFile}
                label="A"
                className="w-full"
              />
              <FilterDropdown
                items={POLICY_PRESETS.map((p) => ({ id: p.file, label: p.label }))}
                selectedId={compareBFile}
                onSelect={setCompareBFile}
                label="B"
                className="w-full"
              />
            </div>
            {!compareResult ? (
              <p className="mt-4 text-[12px] text-muted-foreground italic">Loading…</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead className="border-b border-border text-left text-muted-foreground">
                    <tr>
                      <th className="py-1 pr-3 font-semibold">Algorithm</th>
                      <th className="py-1 pr-3 font-semibold">
                        A · {POLICY_PRESETS.find((p) => p.file === compareAFile)?.label}
                      </th>
                      <th className="py-1 font-semibold">
                        B · {POLICY_PRESETS.find((p) => p.file === compareBFile)?.label}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {MATRIX_ALGOS.filter(({ op }) => op).map(({ algo }) => {
                      const dA = compareResult.a[algo] ?? 'neutral'
                      const dB = compareResult.b[algo] ?? 'neutral'
                      const differs = dA !== dB
                      return (
                        <tr
                          key={algo}
                          className={cn('border-b border-border/40', differs && 'bg-primary/5')}
                        >
                          <td className="py-1 pr-3 font-mono text-foreground">
                            {algo}
                            {!isRunnable(algo) && (
                              <span className="ml-1 text-[8.5px] font-semibold uppercase text-status-warning">
                                spec-only
                              </span>
                            )}
                          </td>
                          <td
                            className={cn(
                              'py-1 pr-3',
                              DISPOSITION_STYLE[dA].cls
                                .split(' ')
                                .find((c) => c.startsWith('text-'))
                            )}
                          >
                            {DISPOSITION_STYLE[dA].label}
                          </td>
                          <td
                            className={cn(
                              'py-1',
                              DISPOSITION_STYLE[dB].cls
                                .split(' ')
                                .find((c) => c.startsWith('text-'))
                            )}
                          >
                            {DISPOSITION_STYLE[dB].label}
                            {differs && (
                              <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wide text-primary">
                                differs
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ── Timeline ──────────────────────────────────────────────────── */}
        {detailTab === 'timeline' && (
          <section className="rounded-xl border border-border bg-card p-4">
            <h4 className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <CalendarClock size={14} className="text-status-warning" /> Timeline — time-bounded
              rules
            </h4>
            <div className="mt-3">
              {temporal.length > 0 ? (
                <PolicyTimeline
                  rules={temporal}
                  asOf={new Date(`${asOfDate}T00:00:00Z`).getTime()}
                />
              ) : (
                <p className="text-[12px] text-muted-foreground">
                  This policy has no time-bounded rules (temporal cutoffs or effective windows).
                </p>
              )}
            </div>
          </section>
        )}

        {/* ── YAML ──────────────────────────────────────────────────────── */}
        {detailTab === 'yaml' && (
          <section className="rounded-xl border border-border bg-card p-4">
            <h4 className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Code2 size={14} className="text-primary" /> Policy source (YAML)
            </h4>
            {policyYaml ? (
              <pre className="mt-2 max-h-[32rem] overflow-auto whitespace-pre rounded border border-border bg-muted/40 p-2 font-mono text-[10.5px] leading-relaxed">
                {policyYaml}
              </pre>
            ) : (
              <p className="mt-2 text-[12px] text-muted-foreground">
                Built-in permissive policy — no source file. Pick a policy from the library.
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

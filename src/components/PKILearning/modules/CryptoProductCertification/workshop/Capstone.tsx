// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Shared author
/**
 * Workshop step `capstone` — One product, four markets (plan r2 §6).
 *
 * Timed (20 min) artifacts: 1 (boundaries), 2 (applicability matrix), the
 * chosen path's artifact from 3–6, 10 (safe claims) and 12 (baseline vs PQC
 * candidate release matrix). The full 13-artifact version is an optional
 * extended section. The learner's work is inspectable on the page and
 * exportable (markdown / PDF via ExportableArtifact, plus a JSON download).
 * The rubric's minimum pass conditions are enforced as explicit checks.
 */
import { useEffect, useMemo, useState, type FC, type ReactNode } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDashed,
  Download,
  Timer,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea, type TextareaProps } from '@/components/ui/textarea'
import { ExportableArtifact } from '@/components/PKILearning/common/executive/ExportableArtifact'
import { useActiveLearnPathId } from '@/components/PKILearning/common/useLearnPath'
import manifest from '../manifest'
import type { CertWorkshopStepProps } from '../data/types'
import {
  ANCHOR_CUSTOMER_PROFILES,
  ANCHOR_RELEASES,
  ANCHOR_SCENARIO,
  type AnchorComponentId,
  type AnchorCustomerId,
} from '../data/anchorScenario'
import { evaluateBoundary, type Applicability, type BoundaryLens } from '../data/coreData'
import {
  COVERAGE_LABEL,
  EIDAS_LINKS,
  EXTENDED_ARTIFACTS,
  MANDATE_LABEL,
  MATRIX_SCHEMES,
  PASS_CONDITIONS,
  PATH_ARTIFACT,
  PATH_LABEL,
  PCI_CLOUD_MODULES,
  PCI_ENTITY_ASSESSMENTS,
  RELEASE_SCHEMES,
  RUBRIC,
  TIMED_ARTIFACT_MINUTES,
  capstoneJson,
  capstoneMarkdown,
  checkCapstone,
  emptyCapstone,
  lintClaims,
  marketDeadlineRows,
  type CapstoneCheck,
  type CapstoneState,
  type CertPathId,
  type CheckStatus,
  type Coverage,
  type MatrixScheme,
} from '../data/sharedData'
import { Callout, FictionalBadge } from '../components/sections/CoreSections'

const PATH_IDS: CertPathId[] = ['fips', 'cc', 'eucc-eidas', 'pci']
const isPath = (v: unknown): v is CertPathId =>
  typeof v === 'string' && (PATH_IDS as string[]).includes(v)

const LENSES: { id: BoundaryLens; label: string }[] = [
  { id: 'fips', label: 'FIPS 140-3 module' },
  { id: 'cc', label: 'CC / EUCC TOE' },
  { id: 'pci', label: 'PCI PTS HSM device' },
]

const APPL_CYCLE: (Applicability | undefined)[] = [
  undefined,
  'applies',
  'may-apply',
  'does-not-answer',
]
const APPL_SHORT: Record<Applicability, string> = {
  applies: 'Applies',
  'may-apply': 'May apply',
  'does-not-answer': 'Does not answer',
}

/** Label + textarea, associated by id (jsx-a11y). */
const TextField = ({ id, label, ...props }: { id: string; label: ReactNode } & TextareaProps) => (
  <div className="space-y-1">
    <label htmlFor={id} className="block text-xs font-semibold text-foreground">
      {label}
    </label>
    <Textarea id={id} {...props} />
  </div>
)

const minutesFor = (key: string) => TIMED_ARTIFACT_MINUTES.find((t) => t.key === key)?.minutes

/** Button group used for every single-choice field. */
function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T | ''
  options: { id: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-foreground">{label}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((o) => (
          <Button
            key={o.id}
            size="sm"
            variant={value === o.id ? 'gradient' : 'outline'}
            aria-pressed={value === o.id}
            onClick={() => onChange(o.id)}
          >
            {o.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

const Artifact = ({
  id,
  n,
  title,
  minutes,
  children,
}: {
  id: string
  n: number | string
  title: string
  minutes?: number
  children: ReactNode
}) => (
  <section id={id} className="glass-panel space-y-4 p-5 scroll-mt-24" aria-labelledby={`${id}-h`}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h4 id={`${id}-h`} className="font-semibold text-foreground">
        Artifact {n} — {title}
      </h4>
      {minutes ? (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Timer size={12} aria-hidden="true" /> ~{minutes} min
        </span>
      ) : null}
    </div>
    {children}
  </section>
)

const STATUS_ICON: Record<CheckStatus, ReactNode> = {
  pass: <CheckCircle2 size={14} className="text-status-success" aria-hidden="true" />,
  fail: <XCircle size={14} className="text-status-error" aria-hidden="true" />,
  warn: <AlertTriangle size={14} className="text-status-warning" aria-hidden="true" />,
  todo: <CircleDashed size={14} className="text-muted-foreground" aria-hidden="true" />,
}

const CheckRow = ({ c }: { c: CapstoneCheck }) => (
  <li className="flex items-start gap-2 text-xs">
    <span className="mt-0.5 shrink-0">{STATUS_ICON[c.status]}</span>
    <span>
      <span className="font-medium text-foreground">{c.label}</span>{' '}
      <span className="text-muted-foreground">
        [{c.status}] {c.detail}
      </span>
    </span>
  </li>
)

export const Capstone: FC<CertWorkshopStepProps> = ({ config }) => {
  const activePath = useActiveLearnPathId(manifest.id, manifest)
  const cfgPath = config?.path
  const initialPath: CertPathId = isPath(cfgPath)
    ? cfgPath
    : isPath(activePath)
      ? activePath
      : 'fips'
  const [s, setS] = useState<CapstoneState>(() => emptyCapstone(initialPath))
  const [showExtended, setShowExtended] = useState(false)
  const focus = typeof config?.focus === 'string' ? config.focus : undefined

  useEffect(() => {
    if (!focus) return
    const el = document.getElementById(focus === 'release' ? 'capstone-a12' : 'capstone-a10')
    el?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }, [focus])

  const update = (patch: Partial<CapstoneState>) => setS((prev) => ({ ...prev, ...patch }))
  const checks = useMemo(() => checkCapstone(s), [s])
  const passConditions = checks.filter((c) => c.kind === 'pass-condition')
  const quality = checks.filter((c) => c.kind === 'quality')
  const failedPass = passConditions.filter((c) => c.status === 'fail')
  const qualityDone = quality.every((c) => c.status === 'pass' || c.status === 'warn')
  const claimFlags = useMemo(() => lintClaims(s.claims), [s.claims])
  const deadlines = useMemo(() => marketDeadlineRows().filter((m) => m.customers.length), [])
  const generatedAt = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const markdown = useMemo(() => capstoneMarkdown(s, generatedAt), [s, generatedAt])

  const componentLabel = (id: AnchorComponentId) =>
    ANCHOR_SCENARIO.components.find((c) => c.id === id)?.label ?? id

  const toggleBoundary = (lens: BoundaryLens, id: AnchorComponentId) =>
    setS((prev) => {
      const cur = prev.boundaries[lens]
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
      return { ...prev, boundaries: { ...prev.boundaries, [lens]: next } }
    })

  const cycleCell = (customer: AnchorCustomerId, scheme: MatrixScheme) =>
    setS((prev) => {
      const cur = prev.matrix[customer][scheme]
      const next = APPL_CYCLE[(APPL_CYCLE.indexOf(cur) + 1) % APPL_CYCLE.length]
      return {
        ...prev,
        matrix: { ...prev.matrix, [customer]: { ...prev.matrix[customer], [scheme]: next } },
      }
    })

  const downloadJson = () => {
    const blob = new Blob([capstoneJson(s, generatedAt)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `orrin-n7-capstone-${s.path}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const baseline = ANCHOR_RELEASES[0]
  const candidate = ANCHOR_RELEASES[1]
  const pathArtifact = PATH_ARTIFACT[s.path]

  return (
    <div className="space-y-6">
      <div className="glass-panel space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-foreground">One product, four markets</h3>
          <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
            <Timer size={12} aria-hidden="true" /> Timed: 20 min
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          A vendor is adding ML-KEM and ML-DSA to the {ANCHOR_SCENARIO.name}
          <FictionalBadge />, a network-attached HSM sold as an appliance and as a multi-tenant
          cloud service. Its customers: {ANCHOR_SCENARIO.customers.map((c) => c.label).join('; ')}.
          You are the vendor’s product-assurance lead. Work your chosen path at full depth and the
          other three schemes at applicability level.
        </p>
        <Choice<CertPathId>
          label="Chosen path"
          value={s.path}
          options={PATH_IDS.map((id) => ({ id, label: PATH_LABEL[id] }))}
          onChange={(path) => update({ path })}
        />
        <Callout tone="info">
          <p>
            Practitioner orientation — not laboratory training. The checks below are heuristics that
            enforce the minimum pass conditions; a reviewer grades the rubric. The product and its
            versions are fictional.
          </p>
        </Callout>
        {focus ? (
          <Callout tone="success">
            <p>
              This exercise focuses on artifact {focus === 'release' ? '12' : '10'}; the rest of the
              capstone is available below it.
            </p>
          </Callout>
        ) : null}
      </div>

      {/* Artifact 1 */}
      <Artifact
        id="capstone-a1"
        n={1}
        title="Module, TOE and device boundaries"
        minutes={minutesFor('a1')}
      >
        <p className="text-xs text-muted-foreground">
          Mark what each scheme’s object contains. The boundary is checked against the cloud
          offering, the harder case.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {LENSES.map((l) => {
            const errors = evaluateBoundary(l.id, 'cloud', new Set(s.boundaries[l.id])).filter(
              (f) => f.severity === 'error'
            )
            return (
              <div key={l.id} className="rounded-lg border border-border p-3">
                <p className="text-xs font-semibold text-foreground">{l.label}</p>
                <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={l.label}>
                  {ANCHOR_SCENARIO.components.map((c) => {
                    const on = s.boundaries[l.id].includes(c.id)
                    return (
                      <Button
                        key={c.id}
                        size="sm"
                        variant={on ? 'gradient' : 'outline'}
                        aria-pressed={on}
                        onClick={() => toggleBoundary(l.id, c.id)}
                      >
                        {c.label}
                      </Button>
                    )
                  })}
                </div>
                {s.boundaries[l.id].length > 0 && errors.length > 0 ? (
                  <p className="mt-2 text-[11px] text-status-error">
                    {errors.map((e) => `${componentLabel(e.component)}: ${e.text}`).join(' ')}
                  </p>
                ) : null}
              </div>
            )
          })}
        </div>
      </Artifact>

      {/* Artifact 2 */}
      <Artifact
        id="capstone-a2"
        n={2}
        title="Scheme applicability matrix"
        minutes={minutesFor('a2')}
      >
        <p className="text-xs text-muted-foreground">
          Click a cell to cycle: Applies → May apply → Does not answer. “Applies” means the scheme’s
          record answers that customer’s question.
        </p>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                <th className="p-2 font-semibold">Customer</th>
                {MATRIX_SCHEMES.map((m) => (
                  <th key={m.id} className="p-2 font-semibold">
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ANCHOR_SCENARIO.customers.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="p-2 text-foreground">{c.label}</td>
                  {MATRIX_SCHEMES.map((m) => {
                    const v = s.matrix[c.id][m.id]
                    return (
                      <td key={m.id} className="p-2">
                        <Button
                          size="sm"
                          variant={v ? 'secondary' : 'outline'}
                          aria-label={`${c.label} × ${m.label}: ${v ? APPL_SHORT[v] : 'not set'}`}
                          onClick={() => cycleCell(c.id, m.id)}
                        >
                          {v ? APPL_SHORT[v] : 'Set…'}
                        </Button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Artifact>

      {/* Chosen-path artifact */}
      <Artifact
        id="capstone-path"
        n={pathArtifact.n}
        title={`${pathArtifact.title} (${PATH_LABEL[s.path]}, full depth)`}
        minutes={minutesFor('path')}
      >
        {s.path === 'fips' ? (
          <div className="space-y-3">
            <Choice
              label="Target security level for the appliance module"
              value={s.fips.level}
              options={(['1', '2', '3', '4'] as const).map((l) => ({ id: l, label: `Level ${l}` }))}
              onChange={(level) => update({ fips: { ...s.fips, level } })}
            />
            <TextField
              id="capstone-field-1"
              label={
                <>
                  Justification — from the threat, the environment and the customers, not “highest
                  available”
                </>
              }

              rows={3}
              value={s.fips.justification}
              onChange={(e) => update({ fips: { ...s.fips, justification: e.target.value } })}
            />
            <Choice
              label="Candidate CMVP route for firmware 5.0.0 (the lab proposes, the CMVP decides)"
              value={s.fips.route}
              options={(['UPDT', 'FS', 'ALG', 'CVE', 'TRNS'] as const).map((r) => ({
                id: r,
                label: r,
              }))}
              onChange={(route) => update({ fips: { ...s.fips, route } })}
            />
            <TextField
              id="capstone-field-2"
              label={
                <>Evidence that changes (algorithm testing, SSPs, self-tests, Security Policy…)</>
              }

              rows={3}
              value={s.fips.evidence}
              onChange={(e) => update({ fips: { ...s.fips, evidence: e.target.value } })}
            />
          </div>
        ) : null}

        {s.path === 'cc' ? (
          <div className="space-y-3">
            <Choice
              label="Protection Profile strategy for the HSM"
              value={s.cc.ppClaim}
              options={[
                { id: 'pp-en' as const, label: 'Claim EN 419221-5' },
                { id: 'pp-ic' as const, label: 'Claim the Security IC Platform PP' },
                { id: 'none' as const, label: 'No PP claim (ST only)' },
              ]}
              onChange={(ppClaim) => update({ cc: { ...s.cc, ppClaim } })}
            />
            <TextField
              id="capstone-field-3"
              label={<>Assurance package — name every augmentation</>}

              rows={2}
              placeholder="e.g. EAL4 augmented with …"
              value={s.cc.assurance}
              onChange={(e) => update({ cc: { ...s.cc, assurance: e.target.value } })}
            />
            <Choice
              label="Assurance-continuity route for the PQC change (the certification body classifies)"
              value={s.cc.route}
              options={[
                { id: 'maintenance' as const, label: 'Maintenance' },
                { id: 're-evaluation' as const, label: 'Re-evaluation' },
                { id: 're-assessment' as const, label: 'Re-assessment' },
              ]}
              onChange={(route) => update({ cc: { ...s.cc, route } })}
            />
            <TextField
              id="capstone-field-4"
              label={<>Security Target changes and notes (cryptographic SFRs, TOE, CC version)</>}

              rows={3}
              value={s.cc.notes}
              onChange={(e) => update({ cc: { ...s.cc, notes: e.target.value } })}
            />
          </div>
        ) : null}

        {s.path === 'eucc-eidas' ? (
          <div className="space-y-3">
            {EIDAS_LINKS.map((l) => (
              <Choice
                key={l.id}
                label={l.label}
                value={s.eidas.links[l.id] ?? ''}
                options={l.options}
                onChange={(v) =>
                  update({ eidas: { ...s.eidas, links: { ...s.eidas.links, [l.id]: v } } })
                }
              />
            ))}
            <Choice
              label="Proposed classification of the PQC change (the certification body decides)"
              value={s.eidas.change}
              options={[
                { id: 'minor' as const, label: 'Minor' },
                { id: 'major' as const, label: 'Major' },
              ]}
              onChange={(change) => update({ eidas: { ...s.eidas, change } })}
            />
            <TextField
              id="capstone-field-5"
              label={<>Notes (QSCD cycle, ACM v2 hybridisation, PP version)</>}

              rows={3}
              value={s.eidas.notes}
              onChange={(e) => update({ eidas: { ...s.eidas, notes: e.target.value } })}
            />
          </div>
        ) : null}

        {s.path === 'pci' ? (
          <div className="space-y-3">
            <TextField
              id="capstone-field-6"
              label={<>Device approval scope (model, hardware version, firmware version)</>}

              rows={2}
              value={s.pci.scope}
              onChange={(e) => update({ pci: { ...s.pci, scope: e.target.value } })}
            />
            <Choice
              label="Requirements version for the new approval"
              value={s.pci.requirements}
              options={[
                { id: 'v4' as const, label: 'PTS HSM v4 (new approvals until 30 June 2027)' },
                { id: 'v5' as const, label: 'PTS HSM v5.0' },
              ]}
              onChange={(requirements) => update({ pci: { ...s.pci, requirements } })}
            />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-foreground">
                v5.0 modules relevant to the cloud offering
              </p>
              <div className="flex flex-wrap gap-2">
                {PCI_CLOUD_MODULES.map((m) => {
                  const on = s.pci.cloudModules.includes(m)
                  return (
                    <Button
                      key={m}
                      size="sm"
                      variant={on ? 'gradient' : 'outline'}
                      aria-pressed={on}
                      onClick={() =>
                        update({
                          pci: {
                            ...s.pci,
                            cloudModules: on
                              ? s.pci.cloudModules.filter((x) => x !== m)
                              : [...s.pci.cloudModules, m],
                          },
                        })
                      }
                    >
                      {m}
                    </Button>
                  )
                })}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-foreground">
                Entity assessments the payment processor needs (its own operations)
              </p>
              <div className="flex flex-wrap gap-2">
                {PCI_ENTITY_ASSESSMENTS.map((m) => {
                  const on = s.pci.entity.includes(m)
                  return (
                    <Button
                      key={m}
                      size="sm"
                      variant={on ? 'gradient' : 'outline'}
                      aria-pressed={on}
                      onClick={() =>
                        update({
                          pci: {
                            ...s.pci,
                            entity: on ? s.pci.entity.filter((x) => x !== m) : [...s.pci.entity, m],
                          },
                        })
                      }
                    >
                      {m}
                    </Button>
                  )
                })}
              </div>
            </div>
            <Choice
              label="The listing’s PQC notation means…"
              value={s.pci.pqcFlag}
              options={[
                {
                  id: 'exists' as const,
                  label: 'PQC support exists (details in the Security Policy)',
                },
                { id: 'algorithm-approved' as const, label: 'PCI has approved the PQC algorithms' },
              ]}
              onChange={(pqcFlag) => update({ pci: { ...s.pci, pqcFlag } })}
            />
            <Choice
              label="Route for firmware 5.0.0"
              value={s.pci.route}
              options={[
                {
                  id: 'lab-scoping' as const,
                  label: 'Recognized-lab scoping under the current Program Guide',
                },
                { id: 'delta-assumed' as const, label: 'A delta — assumed' },
                { id: 'none' as const, label: 'None needed' },
              ]}
              onChange={(route) => update({ pci: { ...s.pci, route } })}
            />
          </div>
        ) : null}
      </Artifact>

      {/* Artifact 10 */}
      <Artifact
        id="capstone-a10"
        n={10}
        title="Safe procurement and marketing claims"
        minutes={minutesFor('a10')}
      >
        <p className="text-xs text-muted-foreground">
          One claim per line. A safe claim names the record, the version and the mode — for example:
          “Orrin N7 firmware {baseline?.firmware} is validated under FIPS 140-3 certificate #…
          (Level 3); PQC is available only in firmware {candidate?.firmware}, which is not yet
          covered.”
        </p>
        <Textarea
          rows={5}
          aria-label="Safe claims, one per line"
          value={s.claims}
          onChange={(e) => update({ claims: e.target.value })}
        />
        {claimFlags.length ? (
          <ul className="space-y-1" aria-live="polite">
            {claimFlags.map((f) => (
              <li
                key={`${f.condition}-${f.sentence}`}
                className="flex items-start gap-2 text-xs text-status-error"
              >
                <XCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  {PASS_CONDITIONS.find((p) => p.id === f.condition)?.label}: “{f.sentence}”
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </Artifact>

      {/* Artifact 12 */}
      <Artifact
        id="capstone-a12"
        n={12}
        title="Certified baseline versus PQC candidate"
        minutes={minutesFor('a12')}
      >
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs">
          <p className="font-semibold text-foreground">
            Market deadlines for the anchor customers (read from the Hub timeline)
          </p>
          <ul className="mt-1 space-y-0.5">
            {deadlines.map((d) => (
              <li key={d.market}>
                {d.market}: <strong>{d.year}</strong> — {MANDATE_LABEL[d.mandate]} (
                {d.customers
                  .map((id) => ANCHOR_SCENARIO.customers.find((c) => c.id === id)?.label ?? id)
                  .join(', ')}
                )
              </li>
            ))}
          </ul>
          <p className="mt-1 text-muted-foreground">
            {ANCHOR_CUSTOMER_PROFILES['payment-processor'].deadlineNote}
          </p>
        </div>
        <div className="space-y-4">
          {RELEASE_SCHEMES.map((r) => {
            const row = s.release[r.id]
            const setRow = (patch: Partial<typeof row>) =>
              update({ release: { ...s.release, [r.id]: { ...row, ...patch } } })
            const opts = (Object.keys(COVERAGE_LABEL) as Coverage[]).map((c) => ({
              id: c,
              label: COVERAGE_LABEL[c],
            }))
            return (
              <div key={r.id} className="space-y-2 rounded-lg border border-border p-3">
                <p className="text-sm font-semibold text-foreground">{r.label}</p>
                <Choice
                  label={`Baseline — firmware ${baseline?.firmware}`}
                  value={row.baseline}
                  options={opts}
                  onChange={(baselineV) => setRow({ baseline: baselineV })}
                />
                <Choice
                  label={`PQC candidate — firmware ${candidate?.firmware}`}
                  value={row.candidate}
                  options={opts}
                  onChange={(candidateV) => setRow({ candidate: candidateV })}
                />
                <TextField
                  id="capstone-field-7"
                  label={<>Planned route and timing (against the deadlines above)</>}

                  rows={2}
                  value={row.route}
                  onChange={(e) => setRow({ route: e.target.value })}
                />
              </div>
            )
          })}
        </div>
      </Artifact>

      {/* Extended (optional) */}
      <section className="glass-panel p-5">
        <Button
          variant="ghost"
          onClick={() => setShowExtended((v) => !v)}
          aria-expanded={showExtended}
          className="w-full justify-between"
        >
          <span>Extended capstone — the full 13 artifacts (optional, not timed)</span>
          {showExtended ? (
            <ChevronUp size={16} aria-hidden="true" />
          ) : (
            <ChevronDown size={16} aria-hidden="true" />
          )}
        </Button>
        {showExtended ? (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Artifacts 3–6 for the other three paths are written at applicability depth; 7, 8, 9,
              11 and 13 complete the dossier. Everything you write here is included in the export.
            </p>
            {EXTENDED_ARTIFACTS.filter((a) => a.n !== pathArtifact.n).map((a) => (
              <TextField
                key={a.key}
                id={`capstone-ext-${a.key}`}
                label={
                  <>
                    Artifact {a.n} — {a.title}
                  </>
                }

                rows={3}
                value={s.extended[a.key] ?? ''}
                onChange={(e) => update({ extended: { ...s.extended, [a.key]: e.target.value } })}
              />
            ))}
          </div>
        ) : null}
      </section>

      {/* Checks and rubric */}
      <section className="glass-panel space-y-4 p-5" aria-labelledby="capstone-checks">
        <h4 id="capstone-checks" className="font-semibold text-foreground">
          Checks and rubric
        </h4>
        <div
          className={`rounded-lg border p-3 text-sm ${
            failedPass.length
              ? 'border-status-error/30 bg-status-error/10'
              : qualityDone
                ? 'border-status-success/30 bg-status-success/10'
                : 'border-border bg-muted/30'
          }`}
          aria-live="polite"
          data-testid="capstone-verdict"
        >
          {failedPass.length
            ? `Does not pass: ${failedPass.length} minimum pass condition(s) failed.`
            : qualityDone
              ? 'All minimum pass conditions met and the timed artifacts are complete — ready for review.'
              : 'Minimum pass conditions met so far; complete the timed artifacts.'}
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground">Minimum pass conditions</p>
          <ul className="mt-1 space-y-1">
            {passConditions.map((c) => (
              <CheckRow key={c.id} c={c} />
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground">Timed artifacts</p>
          <ul className="mt-1 space-y-1">
            {quality.map((c) => (
              <CheckRow key={c.id} c={c} />
            ))}
          </ul>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                <th className="p-2 font-semibold">Rubric dimension</th>
                <th className="p-2 text-right font-semibold">Weight</th>
                <th className="p-2 font-semibold">Evidence</th>
                <th className="p-2 font-semibold">Evidence present</th>
              </tr>
            </thead>
            <tbody>
              {RUBRIC.map((r) => {
                const related = checks.filter((c) => r.checkIds.includes(c.id))
                const present = related.length
                  ? related.every((c) => c.status === 'pass' || c.status === 'warn')
                    ? 'Yes'
                    : 'Not yet'
                  : 'Reviewer'
                return (
                  <tr key={r.dimension} className="border-t border-border">
                    <td className="p-2 text-foreground">{r.dimension}</td>
                    <td className="p-2 text-right">{r.weight}%</td>
                    <td className="p-2">{r.evidence}</td>
                    <td className="p-2">{present}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <ExportableArtifact
        title="Capstone artifact"
        exportData={markdown}
        filename={`orrin-n7-capstone-${s.path}`}
        formats={['markdown', 'pdf']}
      >
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Copy or download your capstone — every artifact, the checks and the rubric — as markdown
            or PDF, or as structured JSON for a reviewer’s tooling.
          </p>
          <Button variant="outline" size="sm" onClick={downloadJson}>
            <Download size={14} className="mr-1.5" aria-hidden="true" /> .json
          </Button>
          <pre
            className="max-h-64 overflow-auto rounded-lg border border-border bg-muted p-3 text-[11px] text-foreground"
            data-testid="capstone-preview"
          >
            {markdown}
          </pre>
        </div>
      </ExportableArtifact>
    </div>
  )
}

// SPDX-License-Identifier: GPL-3.0-only
/**
 * Skills & Team Plan — Foundations Command Center gap-closer
 * (PHASE-OVERLAY-SPEC.md §6.5 / §7.4).
 *
 * Renders the framework core-role / FTE table directly from `ROLE_CROSSWALK`,
 * applies the two-tier 1-FTE-per-500-then-1000-cryptographic-instances heuristic
 * (`FTE_PER_CRYPTO_INSTANCES` / `FTE_PER_CRYPTO_INSTANCES_PRODUCTION`, selected by
 * a program-stage toggle) against an estate-size estimate, and scales the
 * non-fixed-overhead roles in the table to match so the headline number and the
 * table agree. Lets the user mark each role build / borrow / buy. The estate
 * size is seedable from the user's /migrate selection. Emits a downloadable
 * markdown artifact saved under the Risk-Management (KPI / maturity) zone.
 */
import React, { useMemo, useState } from 'react'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ExportableArtifact } from '@/components/PKILearning/common/executive/ExportableArtifact'
import { useModuleStore } from '@/store/useModuleStore'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { useSavedArtifactInputs } from '@/hooks/useSavedArtifactInputs'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'
import {
  ROLE_CROSSWALK,
  FTE_PER_CRYPTO_INSTANCES,
  FTE_PER_CRYPTO_INSTANCES_PRODUCTION,
  sizingSanityCheck,
  FIXED_OVERHEAD_ROLE_IDS,
  INSTANCES_PER_PRODUCT_ESTIMATE,
  type FrameworkRoleId,
} from '@/data/roleCrosswalk'
import { NICE_WORK_ROLES } from '@/data/niceFramework'
import { FRAMEWORK_NAME, FRAMEWORK_URL } from '@/data/frameworkPhases'

const SOURCING_OPTIONS = ['build', 'borrow', 'buy'] as const
type Sourcing = (typeof SOURCING_OPTIONS)[number]

const SOURCING_LABEL: Record<Sourcing, string> = {
  build: 'Build (hire / train internally)',
  borrow: 'Borrow (contractors / partners)',
  buy: 'Buy (managed service / outsource)',
}

/** Canonical role order for the table — leadership first, then build roles. */
export const ROLE_ORDER: FrameworkRoleId[] = [
  'qrpm',
  'exec-sponsor',
  'crypto-architect',
  'security-eng',
  'appsec-lead',
  'ot-specialist',
  'vendor-lead',
  'pmo-analyst',
]

/** The heuristic ratio tightens for the first two years of the program (discovery,
 *  CBOM, risk scoring, pilot), then loosens once the program reaches production
 *  rollout — framework-2.1.yaml `skills_team.sizing_heuristic`. */
type SizingPhase = 'early' | 'production'

const SIZING_PHASE_OPTIONS: { value: SizingPhase; label: string; ratio: number }[] = [
  {
    value: 'early',
    label: 'Year 1–2 (discovery, CBOM, risk scoring, pilot)',
    ratio: FTE_PER_CRYPTO_INSTANCES,
  },
  { value: 'production', label: 'Production rollout', ratio: FTE_PER_CRYPTO_INSTANCES_PRODUCTION },
]

function ratioForPhase(phase: SizingPhase): number {
  return phase === 'production' ? FTE_PER_CRYPTO_INSTANCES_PRODUCTION : FTE_PER_CRYPTO_INSTANCES
}

/** "1-FTE-per-500-then-1000" — kept off multiple JSX lines so the JSX
 *  whitespace collapse rule can't inject a stray space mid-hyphenated word. */
const RATIO_PAIR_LABEL = `1-FTE-per-${FTE_PER_CRYPTO_INSTANCES}-then-${FTE_PER_CRYPTO_INSTANCES_PRODUCTION}`

/** Roles that scale with estate size — every role except the framework's fixed
 *  overhead trio (`FIXED_OVERHEAD_ROLE_IDS`). */
const SCALABLE_ROLE_IDS = ROLE_ORDER.filter((id) => !FIXED_OVERHEAD_ROLE_IDS.includes(id))

/** Midpoint of a typicalFte band string ("2–4" -> 3, "0.5–1.0 (if OT)" -> 0.75). */
function parseFteMidpoint(typicalFte: string): number {
  const nums = typicalFte.match(/\d+(\.\d+)?/g)?.map(Number) ?? [0]
  return nums.reduce((sum, n) => sum + n, 0) / nums.length
}

/** Each scalable role's share of the heuristic FTE total, weighted by its
 *  baseline band midpoint — so the table's proportions still track the
 *  framework's illustrative bands (e.g. Security Engineers stay the largest
 *  slice) while the row values sum to the headline number. */
const SCALABLE_ROLE_WEIGHT: Partial<Record<FrameworkRoleId, number>> = (() => {
  const baseline = SCALABLE_ROLE_IDS.map(
    (id) => [id, parseFteMidpoint(ROLE_CROSSWALK[id].typicalFte)] as const
  )
  const total = baseline.reduce((sum, [, midpoint]) => sum + midpoint, 0)
  return Object.fromEntries(
    baseline.map(([id, midpoint]) => [id, total > 0 ? midpoint / total : 0])
  )
})()

export interface PlanState {
  estateInstances: string
  sizingPhase: SizingPhase
  sourcing: Record<FrameworkRoleId, Sourcing>
}

function niceTitles(id: FrameworkRoleId): string {
  return ROLE_CROSSWALK[id].niceRoles.map((nid) => NICE_WORK_ROLES[nid]?.title ?? nid).join(', ')
}

/** Heuristic FTE from the estate size (1 dedicated FTE per N instances, N set by
 *  the sizing phase). Returns null when no valid estate number has been entered. */
function computeHeuristicFte(estateInstances: string, phase: SizingPhase): number | null {
  const n = Number.parseInt(estateInstances, 10)
  if (!Number.isFinite(n) || n <= 0) return null
  return n / ratioForPhase(phase)
}

/** Per-role FTE for display. The framework's fixed-overhead trio (QRPM,
 *  Cryptographic Architect, PMO Analyst) always shows its static band; every
 *  other role scales against the heuristic total once an estate size is
 *  entered, so the table and the headline number agree instead of drifting
 *  apart as the audit found. */
function roleFteDisplay(id: FrameworkRoleId, heuristicFte: number | null): string {
  const role = ROLE_CROSSWALK[id]
  if (heuristicFte === null || FIXED_OVERHEAD_ROLE_IDS.includes(id)) return role.typicalFte
  const weight = SCALABLE_ROLE_WEIGHT[id] ?? 0
  const suffix = role.typicalFte.match(/\(.*\)/)?.[0]
  return suffix
    ? `${(heuristicFte * weight).toFixed(1)} ${suffix}`
    : (heuristicFte * weight).toFixed(1)
}

export function buildMarkdown(s: PlanState): string {
  const lines: string[] = []
  lines.push('# Skills & Team Plan')
  lines.push('')
  lines.push('*Foundations — staffing the migration program.*')
  lines.push('')

  const heuristicFte = computeHeuristicFte(s.estateInstances, s.sizingPhase)
  const ratio = ratioForPhase(s.sizingPhase)
  const phaseLabel = SIZING_PHASE_OPTIONS.find((o) => o.value === s.sizingPhase)?.label ?? ''
  lines.push('## Sizing heuristic')
  lines.push('')
  lines.push(
    `Rule of thumb: **1 dedicated FTE per ${FTE_PER_CRYPTO_INSTANCES} cryptographic instances** ` +
      `in the CBOM for the first two years, loosening to 1 per ` +
      `${FTE_PER_CRYPTO_INSTANCES_PRODUCTION} during production rollout.`
  )
  if (heuristicFte !== null) {
    lines.push('')
    lines.push(
      `- Estate estimate: **${Number.parseInt(s.estateInstances, 10).toLocaleString()}** instances`
    )
    lines.push(`- Program stage: **${phaseLabel}**`)
    lines.push(
      `- Heuristic dedicated FTE: **≈ ${heuristicFte.toFixed(1)}** ` +
        `(${Number.parseInt(s.estateInstances, 10).toLocaleString()} ÷ ${ratio})`
    )
    const sanity = sizingSanityCheck(Number.parseInt(s.estateInstances, 10), heuristicFte)
    if (sanity) {
      lines.push(`- ${sanity.diverges ? '**Diverges from the framework:** ' : ''}${sanity.note}`)
    }
  } else {
    lines.push('')
    lines.push('- _No estate-size estimate entered; enter one to size dedicated FTE._')
  }
  lines.push('')

  lines.push('## Core roles & FTE')
  lines.push('')
  lines.push('| Role | FTE | NICE work role(s) | Build / Borrow / Buy |')
  lines.push('|---|---|---|---|')
  for (const id of ROLE_ORDER) {
    const role = ROLE_CROSSWALK[id]
    const fixed = FIXED_OVERHEAD_ROLE_IDS.includes(id)
    const fteCell = fixed
      ? role.typicalFte
      : `${roleFteDisplay(id, heuristicFte)}${heuristicFte !== null ? '*' : ''}`
    lines.push(
      `| ${role.label} | ${fteCell} | ${niceTitles(id)} | ${SOURCING_LABEL[s.sourcing[id]]} |`
    )
  }
  lines.push('')
  lines.push(
    '_QRPM, Cryptographic Architect, and PMO Analyst are dedicated overhead regardless of ' +
      'estate size.' +
      (heuristicFte !== null
        ? ' * Remaining roles are scaled from the heuristic dedicated FTE total above, split ' +
          'by their typical relative weight.'
        : ' Remaining roles show illustrative baseline bands from the framework; enter an ' +
          'estate-size estimate above to scale them to your program.') +
      '_'
  )
  lines.push('')

  lines.push('## Build / borrow / buy summary')
  lines.push('')
  for (const opt of SOURCING_OPTIONS) {
    const roles = ROLE_ORDER.filter((id) => s.sourcing[id] === opt).map(
      (id) => ROLE_CROSSWALK[id].label
    )
    lines.push(`- **${SOURCING_LABEL[opt]}:** ${roles.length ? roles.join(', ') : '_(none)_'}`)
  }
  lines.push('')

  lines.push('---')
  lines.push('')
  lines.push(
    `*Aligned to the ${FRAMEWORK_NAME} §5 Team & Skills model (core roles, ` +
      `1-FTE-per-${FTE_PER_CRYPTO_INSTANCES}-then-${FTE_PER_CRYPTO_INSTANCES_PRODUCTION}-instances ` +
      `sizing, build/borrow/buy — ${FRAMEWORK_URL}) and NIST CSWP 39 §5 governance. ` +
      'https://doi.org/10.6028/NIST.CSWP.39-upd1*'
  )
  return lines.join('\n')
}

export const SkillsTeamPlan: React.FC = () => {
  const addExecutiveDocument = useModuleStore((s) => s.addExecutiveDocument)
  const savedInputs = useSavedArtifactInputs<PlanState>('skills-team-plan')
  const { myProducts } = useExecutiveModuleData()

  // Seed an estate-size order of magnitude from the /migrate selection
  // (~INSTANCES_PER_PRODUCT_ESTIMATE cryptographic instances per selected product).
  const seedInstances = useMemo(
    () => (myProducts.length > 0 ? String(myProducts.length * INSTANCES_PER_PRODUCT_ESTIMATE) : ''),
    [myProducts.length]
  )

  const defaultSourcing: Record<FrameworkRoleId, Sourcing> = {
    qrpm: 'build',
    'exec-sponsor': 'build',
    'crypto-architect': 'build',
    'security-eng': 'borrow',
    'appsec-lead': 'build',
    'ot-specialist': 'borrow',
    'vendor-lead': 'build',
    'pmo-analyst': 'build',
  }

  // A previously-saved plan takes priority over re-seeding from /migrate, so
  // the user's own sizing-phase and sourcing choices round-trip across visits.
  const [state, setState] = useState<PlanState>(() => {
    if (savedInputs) {
      return {
        estateInstances: savedInputs.estateInstances ?? seedInstances,
        sizingPhase: savedInputs.sizingPhase ?? 'early',
        sourcing: { ...defaultSourcing, ...savedInputs.sourcing },
      }
    }
    return {
      estateInstances: seedInstances,
      sizingPhase: 'early',
      sourcing: defaultSourcing,
    }
  })

  const setSourcing = (id: FrameworkRoleId, value: Sourcing) =>
    setState((prev) => ({ ...prev, sourcing: { ...prev.sourcing, [id]: value } }))

  const heuristicFte = useMemo(
    () => computeHeuristicFte(state.estateInstances, state.sizingPhase),
    [state.estateInstances, state.sizingPhase]
  )
  const sanity = useMemo(() => {
    const n = Number.parseInt(state.estateInstances, 10)
    if (!Number.isFinite(n) || heuristicFte === null) return null
    return sizingSanityCheck(n, heuristicFte)
  }, [state.estateInstances, heuristicFte])

  const exportMarkdown = useMemo(() => buildMarkdown(state), [state])

  return (
    <div className="space-y-4">
      {seedInstances !== '' && (
        <PreFilledBanner
          summary={`Estate size seeded from ${myProducts.length} product${
            myProducts.length !== 1 ? 's' : ''
          } in your /migrate selection.`}
          onClear={() => setState((prev) => ({ ...prev, estateInstances: '' }))}
        />
      )}
      <header className="flex items-start gap-3">
        <Users size={24} className="text-primary shrink-0 mt-0.5" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">Skills &amp; Team Plan</h2>
          <p className="text-sm text-muted-foreground">
            Foundations — size and source the migration team. Core roles and FTE come from the
            framework role model; the {RATIO_PAIR_LABEL}-instances heuristic sizes dedicated effort
            against your estate.
          </p>
        </div>
      </header>

      <section className="glass-panel border border-border rounded-lg p-4 space-y-2">
        <label
          htmlFor="skills-estate-instances"
          className="text-sm font-semibold text-foreground block"
        >
          Estate-size estimate
        </label>
        <p className="text-xs text-muted-foreground mb-1.5">
          Cryptographic instances in the CBOM (keys, certificates, library call-sites, protocol
          endpoints).
        </p>
        <Input
          id="skills-estate-instances"
          type="number"
          min={0}
          value={state.estateInstances}
          onChange={(e) => setState((prev) => ({ ...prev, estateInstances: e.target.value }))}
          placeholder="e.g. 2400"
          className="max-w-[12rem]"
        />

        <span className="text-sm font-semibold text-foreground block pt-1">Program stage</span>
        <p className="text-xs text-muted-foreground mb-1.5">
          The heuristic ratio tightens early in the program and loosens once migration reaches
          production rollout.
        </p>
        <div className="flex flex-wrap gap-1">
          {SIZING_PHASE_OPTIONS.map((opt) => {
            const on = state.sizingPhase === opt.value
            return (
              <Button
                key={opt.value}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setState((prev) => ({ ...prev, sizingPhase: opt.value }))}
                aria-pressed={on}
                className={`h-7 px-2.5 rounded-full border text-xs font-medium transition-all ${
                  on
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted/50'
                }`}
              >
                {opt.label} (1:{opt.ratio})
              </Button>
            )
          })}
        </div>

        <div className="text-sm text-foreground pt-1">
          {heuristicFte !== null ? (
            <span>
              Heuristic dedicated FTE:{' '}
              <strong className="text-primary">≈ {heuristicFte.toFixed(1)}</strong> (
              {Number.parseInt(state.estateInstances, 10).toLocaleString()} ÷{' '}
              {ratioForPhase(state.sizingPhase)})
            </span>
          ) : (
            <span className="text-muted-foreground">
              Enter an estate-size estimate to compute dedicated FTE.
            </span>
          )}
        </div>
        {/* The ratio and the framework's own narrative guidance disagree at
            scale — at 10,000 instances the ratio gives ~20 FTE against the
            same section's stated 8-12 peak. Show both rather than trusting
            the arithmetic silently. (Audit 2026-08-10, W2-4.) */}
        {sanity && (
          <div
            className={`text-xs mt-2 leading-relaxed ${
              sanity.diverges ? 'text-status-warning' : 'text-muted-foreground'
            }`}
          >
            {sanity.diverges && <strong>Diverges from the framework: </strong>}
            {sanity.note}
          </div>
        )}
      </section>

      <section className="glass-panel border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">Core roles &amp; FTE</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-[10px] uppercase tracking-wide text-muted-foreground font-semibold pb-1.5 pr-3">
                  Role
                </th>
                <th className="text-left text-[10px] uppercase tracking-wide text-muted-foreground font-semibold pb-1.5 pr-3 w-[80px]">
                  FTE
                </th>
                <th className="text-left text-[10px] uppercase tracking-wide text-muted-foreground font-semibold pb-1.5 pr-3">
                  NICE work role(s)
                </th>
                <th className="text-left text-[10px] uppercase tracking-wide text-muted-foreground font-semibold pb-1.5">
                  Build / Borrow / Buy
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {ROLE_ORDER.map((id) => {
                const role = ROLE_CROSSWALK[id]
                const fixed = FIXED_OVERHEAD_ROLE_IDS.includes(id)
                const fteTitle = fixed
                  ? 'Dedicated overhead — fixed regardless of estate size.'
                  : heuristicFte !== null
                    ? 'Scaled from the heuristic dedicated FTE estimate above.'
                    : 'Framework baseline band — enter an estate-size estimate above to scale it.'
                return (
                  <tr key={id} className="align-top">
                    <td className="py-2 pr-3 align-top font-medium text-foreground">
                      {role.label}
                    </td>
                    <td
                      className="py-2 pr-3 align-top tabular-nums text-muted-foreground"
                      title={fteTitle}
                    >
                      {fixed ? role.typicalFte : roleFteDisplay(id, heuristicFte)}
                    </td>
                    <td className="py-2 pr-3 align-top text-muted-foreground text-xs">
                      {niceTitles(id)}
                    </td>
                    <td className="py-2 align-top">
                      <div className="flex flex-wrap gap-1">
                        {SOURCING_OPTIONS.map((opt) => {
                          const on = state.sourcing[id] === opt
                          return (
                            <Button
                              key={opt}
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setSourcing(id, opt)}
                              aria-pressed={on}
                              title={SOURCING_LABEL[opt]}
                              className={`h-6 px-2 rounded-full border text-[10px] font-semibold capitalize transition-all ${
                                on
                                  ? 'border-primary/40 bg-primary/10 text-primary'
                                  : 'border-border text-muted-foreground hover:bg-muted/50'
                              }`}
                            >
                              {opt}
                            </Button>
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          QRPM, Cryptographic Architect, and PMO Analyst are dedicated overhead regardless of estate
          size.{' '}
          {heuristicFte !== null
            ? 'The remaining roles are scaled from the heuristic dedicated FTE estimate above, so this table and the headline number agree.'
            : 'The remaining roles show the framework’s illustrative baseline bands until you enter an estate-size estimate above.'}
        </p>
      </section>

      <section className="glass-panel border border-border rounded-lg p-4 space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Where this sizing comes from</h3>
        <p className="text-xs text-muted-foreground">
          Sizing heuristic and role model: {FRAMEWORK_NAME} §5 (Team &amp; Skills),{' '}
          <a
            href={FRAMEWORK_URL}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            {FRAMEWORK_URL}
          </a>
          . One dedicated FTE per {FTE_PER_CRYPTO_INSTANCES} cryptographic instances for the
          program's first two years (discovery, CBOM, risk scoring, pilot); the ratio loosens to one
          per {FTE_PER_CRYPTO_INSTANCES_PRODUCTION} once the program reaches production rollout. The
          Quantum-Readiness Program Manager, Cryptographic Architect, and PMO Analyst are dedicated
          overhead regardless of estate size.
        </p>
        <p className="text-xs text-muted-foreground">
          Governance cadence: NIST CSWP 39 §5 (Strategic Plan) —{' '}
          <a
            href="https://doi.org/10.6028/NIST.CSWP.39-upd1"
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            https://doi.org/10.6028/NIST.CSWP.39-upd1
          </a>
          .
        </p>
      </section>

      <ExportableArtifact
        title="Skills & Team Plan — Export"
        exportData={exportMarkdown}
        filename="skills-team-plan"
        formats={['markdown', 'pdf', 'docx']}
        wideTable
        onExport={() => {
          addExecutiveDocument({
            id: `skills-team-plan-${Date.now()}`,
            moduleId: 'pqc-governance',
            type: 'skills-team-plan',
            title: `Skills & Team Plan — ${new Date().toLocaleDateString()}`,
            data: exportMarkdown,
            inputs: {
              estateInstances: state.estateInstances,
              sizingPhase: state.sizingPhase,
              heuristicFte: heuristicFte ?? undefined,
              sourcing: state.sourcing,
            },
            createdAt: Date.now(),
          })
        }}
      >
        <p className="text-sm text-muted-foreground">
          Save this plan to your Command Center, or export as markdown / PDF / Word. Roles, FTE, and
          the 1-per-{FTE_PER_CRYPTO_INSTANCES}-then-{FTE_PER_CRYPTO_INSTANCES_PRODUCTION} sizing all
          derive from the framework role model.
        </p>
      </ExportableArtifact>
    </div>
  )
}

export default SkillsTeamPlan

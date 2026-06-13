// SPDX-License-Identifier: GPL-3.0-only
/**
 * Skills & Team Plan — Foundations Command Center gap-closer
 * (PHASE-OVERLAY-SPEC.md §6.5 / §7.4).
 *
 * Renders the framework core-role / FTE table directly from `ROLE_CROSSWALK`,
 * applies the 1-FTE-per-500-cryptographic-instances heuristic
 * (`FTE_PER_CRYPTO_INSTANCES`) against an estate-size estimate, and lets the
 * user mark each role build / borrow / buy. The estate size is seedable from
 * the user's /migrate selection. Emits a downloadable markdown artifact saved
 * under the Risk-Management (KPI / maturity) zone.
 */
import React, { useMemo, useState } from 'react'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ExportableArtifact } from '@/components/PKILearning/common/executive/ExportableArtifact'
import { useModuleStore } from '@/store/useModuleStore'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'
import {
  ROLE_CROSSWALK,
  FTE_PER_CRYPTO_INSTANCES,
  type FrameworkRoleId,
} from '@/data/roleCrosswalk'
import { NICE_WORK_ROLES } from '@/data/niceFramework'

const SOURCING_OPTIONS = ['build', 'borrow', 'buy'] as const
type Sourcing = (typeof SOURCING_OPTIONS)[number]

const SOURCING_LABEL: Record<Sourcing, string> = {
  build: 'Build (hire / train internally)',
  borrow: 'Borrow (contractors / partners)',
  buy: 'Buy (managed service / outsource)',
}

/** Canonical role order for the table — leadership first, then build roles. */
const ROLE_ORDER: FrameworkRoleId[] = [
  'qrpm',
  'exec-sponsor',
  'crypto-architect',
  'security-eng',
  'appsec-lead',
  'ot-specialist',
  'vendor-lead',
  'pmo-analyst',
]

interface PlanState {
  estateInstances: string
  sourcing: Record<FrameworkRoleId, Sourcing>
}

function niceTitles(id: FrameworkRoleId): string {
  return ROLE_CROSSWALK[id].niceRoles.map((nid) => NICE_WORK_ROLES[nid]?.title ?? nid).join(', ')
}

/** Heuristic FTE from the estate size (1 dedicated FTE per N instances). Returns
 *  null when no valid estate number has been entered. */
function computeHeuristicFte(estateInstances: string): number | null {
  const n = Number.parseInt(estateInstances, 10)
  if (!Number.isFinite(n) || n <= 0) return null
  return n / FTE_PER_CRYPTO_INSTANCES
}

function buildMarkdown(s: PlanState): string {
  const lines: string[] = []
  lines.push('# Skills & Team Plan')
  lines.push('')
  lines.push('*Foundations — staffing the migration program.*')
  lines.push('')

  const heuristicFte = computeHeuristicFte(s.estateInstances)
  lines.push('## Sizing heuristic')
  lines.push('')
  lines.push(
    `Rule of thumb: **1 dedicated FTE per ${FTE_PER_CRYPTO_INSTANCES} cryptographic instances** ` +
      'in the CBOM.'
  )
  if (heuristicFte !== null) {
    lines.push('')
    lines.push(
      `- Estate estimate: **${Number.parseInt(s.estateInstances, 10).toLocaleString()}** instances`
    )
    lines.push(
      `- Heuristic dedicated FTE: **≈ ${heuristicFte.toFixed(1)}** ` +
        `(${Number.parseInt(s.estateInstances, 10).toLocaleString()} ÷ ${FTE_PER_CRYPTO_INSTANCES})`
    )
  } else {
    lines.push('')
    lines.push('- _No estate-size estimate entered; enter one to size dedicated FTE._')
  }
  lines.push('')

  lines.push('## Core roles & FTE')
  lines.push('')
  lines.push('| Role | Typical FTE | NICE work role(s) | Build / Borrow / Buy |')
  lines.push('|---|---|---|---|')
  for (const id of ROLE_ORDER) {
    const role = ROLE_CROSSWALK[id]
    lines.push(
      `| ${role.label} | ${role.typicalFte} | ${niceTitles(id)} | ${SOURCING_LABEL[s.sourcing[id]]} |`
    )
  }
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
    '*Aligned to the Applied Quantum Skills & Team model (core roles, 1-FTE-per-500-instances ' +
      'sizing, build/borrow/buy) and NIST CSWP 39 §5 governance. ' +
      'https://doi.org/10.6028/NIST.CSWP.39*'
  )
  return lines.join('\n')
}

export const SkillsTeamPlan: React.FC = () => {
  const addExecutiveDocument = useModuleStore((s) => s.addExecutiveDocument)
  const { myProducts } = useExecutiveModuleData()

  // Seed an estate-size order of magnitude from the /migrate selection
  // (~12 cryptographic instances per selected product).
  const seedInstances = useMemo(
    () => (myProducts.length > 0 ? String(myProducts.length * 12) : ''),
    [myProducts.length]
  )

  const [state, setState] = useState<PlanState>(() => ({
    estateInstances: seedInstances,
    sourcing: {
      qrpm: 'build',
      'exec-sponsor': 'build',
      'crypto-architect': 'build',
      'security-eng': 'borrow',
      'appsec-lead': 'build',
      'ot-specialist': 'borrow',
      'vendor-lead': 'build',
      'pmo-analyst': 'build',
    },
  }))

  const setSourcing = (id: FrameworkRoleId, value: Sourcing) =>
    setState((prev) => ({ ...prev, sourcing: { ...prev.sourcing, [id]: value } }))

  const heuristicFte = useMemo(
    () => computeHeuristicFte(state.estateInstances),
    [state.estateInstances]
  )

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
            framework role model; the 1-FTE-per-{FTE_PER_CRYPTO_INSTANCES}-instances heuristic sizes
            dedicated effort against your estate.
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
        <div className="text-sm text-foreground">
          {heuristicFte !== null ? (
            <span>
              Heuristic dedicated FTE:{' '}
              <strong className="text-primary">≈ {heuristicFte.toFixed(1)}</strong> (
              {Number.parseInt(state.estateInstances, 10).toLocaleString()} ÷{' '}
              {FTE_PER_CRYPTO_INSTANCES})
            </span>
          ) : (
            <span className="text-muted-foreground">
              Enter an estate-size estimate to compute dedicated FTE.
            </span>
          )}
        </div>
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
                return (
                  <tr key={id} className="align-top">
                    <td className="py-2 pr-3 align-top font-medium text-foreground">
                      {role.label}
                    </td>
                    <td className="py-2 pr-3 align-top tabular-nums text-muted-foreground">
                      {role.typicalFte}
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
              heuristicFte: heuristicFte ?? undefined,
              sourcing: state.sourcing,
            },
            createdAt: Date.now(),
          })
        }}
      >
        <p className="text-sm text-muted-foreground">
          Save this plan to your Command Center, or export as markdown / PDF / Word. Roles, FTE, and
          the 1-per-{FTE_PER_CRYPTO_INSTANCES} sizing all derive from the framework role model.
        </p>
      </ExportableArtifact>
    </div>
  )
}

export default SkillsTeamPlan

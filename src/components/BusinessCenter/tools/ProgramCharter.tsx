// SPDX-License-Identifier: GPL-3.0-only
/**
 * Program Charter — Phase 0 (Executive Mandate) Command Center gap-closer.
 *
 * Captures the program-establishment decisions the framework's Phase 0 expects
 * (PHASE-OVERLAY-SPEC.md §6.3): executive sponsor sign-off, Steering Committee
 * (SteerCo) membership, the Quantum-Readiness Program Manager (QRPM)
 * appointment, governance cadence, and the multi-year budget commitment.
 *
 * The SteerCo / QRPM role pickers are seeded from `ROLE_CROSSWALK` (the framework
 * core-role model) so the charter speaks the same role language as the Skills &
 * Team plan and the RACI Builder. Emits a downloadable markdown artifact and
 * saves it to the Command Center under the Governance zone, like the other
 * Phase-0 tools.
 */
import React, { useMemo, useState } from 'react'
import { ScrollText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ExportableArtifact } from '@/components/PKILearning/common/executive/ExportableArtifact'
import { useModuleStore } from '@/store/useModuleStore'
import { ROLE_CROSSWALK, type FrameworkRoleId } from '@/data/roleCrosswalk'
import { FRAMEWORK_PHASES } from '@/data/frameworkPhases'

/** Governance review cadences offered for the SteerCo. */
const CADENCE_OPTIONS = ['Weekly', 'Bi-weekly', 'Monthly', 'Quarterly'] as const
type Cadence = (typeof CADENCE_OPTIONS)[number]

/** Phase-0 owning roles, surfaced as the suggested SteerCo seat list. The
 *  framework names QRPM + Executive Sponsor as the Phase-0 leads; the broader
 *  set lets the user staff a full committee from one source of truth. */
const STEERCO_ROLE_IDS: FrameworkRoleId[] = [
  'exec-sponsor',
  'qrpm',
  'crypto-architect',
  'vendor-lead',
  'pmo-analyst',
]

interface CharterState {
  programName: string
  sponsorName: string
  sponsorTitle: string
  qrpmName: string
  cadence: Cadence
  budgetYear1: string
  budgetMultiYear: string
  budgetHorizonYears: string
  steerCo: Record<FrameworkRoleId, boolean>
  signOffDate: string
}

const todayIso = (): string => new Date().toISOString().slice(0, 10)

function buildMarkdown(s: CharterState): string {
  const lines: string[] = []
  const programName = s.programName.trim() || 'Post-Quantum Cryptography Migration Program'
  lines.push(`# Program Charter — ${programName}`)
  lines.push('')
  lines.push(
    `*Phase 0 — ${FRAMEWORK_PHASES.p0.name} (${FRAMEWORK_PHASES.p0.tagline}). ` +
      `Gate ${FRAMEWORK_PHASES.p0.gate?.id ?? 'G0'}: ${FRAMEWORK_PHASES.p0.gate?.criterion ?? 'Mandate signed'}.*`
  )
  lines.push('')

  lines.push('## 1. Executive sponsorship')
  lines.push('')
  lines.push(`- **Sponsor:** ${s.sponsorName.trim() || '_(unassigned)_'}`)
  lines.push(`- **Title:** ${s.sponsorTitle.trim() || '_(unassigned)_'}`)
  lines.push(`- **Mandate sign-off date:** ${s.signOffDate || '_(pending)_'}`)
  lines.push('')

  lines.push('## 2. Program leadership')
  lines.push('')
  lines.push(
    `- **Quantum-Readiness Program Manager (QRPM):** ${s.qrpmName.trim() || '_(unassigned)_'}`
  )
  lines.push(
    `- **Authority to advance Gate ${FRAMEWORK_PHASES.p0.gate?.id ?? 'G0'}:** ${FRAMEWORK_PHASES.p0.gate?.authority ?? 'Executive Sponsor'}`
  )
  lines.push('')

  lines.push('## 3. Steering Committee (SteerCo)')
  lines.push('')
  const seats = STEERCO_ROLE_IDS.filter((id) => s.steerCo[id])
  if (seats.length === 0) {
    lines.push('_No SteerCo seats selected._')
  } else {
    lines.push('| Seat | Typical FTE |')
    lines.push('|---|---|')
    for (const id of seats) {
      const role = ROLE_CROSSWALK[id]
      lines.push(`| ${role.label} | ${role.typicalFte} |`)
    }
  }
  lines.push('')
  lines.push(`- **Governance cadence:** ${s.cadence}`)
  lines.push('')

  lines.push('## 4. Budget commitment')
  lines.push('')
  lines.push(`- **Year 1 budget:** ${s.budgetYear1.trim() || '_(TBD)_'}`)
  lines.push(`- **Multi-year commitment:** ${s.budgetMultiYear.trim() || '_(TBD)_'}`)
  lines.push(`- **Planning horizon:** ${s.budgetHorizonYears.trim() || '_(TBD)_'} years`)
  lines.push('')

  lines.push('---')
  lines.push('')
  lines.push(
    '*Aligned to NIST CSWP 39 §5 (Crypto Agility Strategic Plan — governance) and the ' +
      'Applied Quantum Phase 0 Executive Mandate. https://doi.org/10.6028/NIST.CSWP.39*'
  )
  return lines.join('\n')
}

export const ProgramCharter: React.FC = () => {
  const addExecutiveDocument = useModuleStore((s) => s.addExecutiveDocument)
  const [state, setState] = useState<CharterState>(() => ({
    programName: '',
    sponsorName: '',
    sponsorTitle: '',
    qrpmName: '',
    cadence: 'Monthly',
    budgetYear1: '',
    budgetMultiYear: '',
    budgetHorizonYears: '3',
    steerCo: {
      'exec-sponsor': true,
      qrpm: true,
      'crypto-architect': true,
      'vendor-lead': false,
      'pmo-analyst': true,
      'security-eng': false,
      'appsec-lead': false,
      'ot-specialist': false,
    },
    signOffDate: todayIso(),
  }))

  const set = <K extends keyof CharterState>(key: K, value: CharterState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }))

  const toggleSeat = (id: FrameworkRoleId) =>
    setState((prev) => ({
      ...prev,
      steerCo: { ...prev.steerCo, [id]: !prev.steerCo[id] },
    }))

  const exportMarkdown = useMemo(() => buildMarkdown(state), [state])

  const seatCount = STEERCO_ROLE_IDS.filter((id) => state.steerCo[id]).length

  return (
    <div className="space-y-4">
      <header className="flex items-start gap-3">
        <ScrollText size={24} className="text-primary shrink-0 mt-0.5" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">Program Charter</h2>
          <p className="text-sm text-muted-foreground">
            Phase 0 — Executive Mandate. Record sponsor sign-off, the SteerCo, the QRPM appointment,
            governance cadence, and the multi-year budget commitment.
          </p>
        </div>
      </header>

      <section className="glass-panel border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Program</h3>
        <div className="block">
          <label
            htmlFor="charter-program-name"
            className="text-xs font-medium text-muted-foreground"
          >
            Program name
          </label>
          <Input
            id="charter-program-name"
            className="mt-1"
            value={state.programName}
            onChange={(e) => set('programName', e.target.value)}
            placeholder="Post-Quantum Cryptography Migration Program"
          />
        </div>
      </section>

      <section className="glass-panel border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Executive sponsorship</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="block">
            <label
              htmlFor="charter-sponsor-name"
              className="text-xs font-medium text-muted-foreground"
            >
              Sponsor name
            </label>
            <Input
              id="charter-sponsor-name"
              className="mt-1"
              value={state.sponsorName}
              onChange={(e) => set('sponsorName', e.target.value)}
              placeholder="e.g. Jane Doe"
            />
          </div>
          <div className="block">
            <label
              htmlFor="charter-sponsor-title"
              className="text-xs font-medium text-muted-foreground"
            >
              Sponsor title
            </label>
            <Input
              id="charter-sponsor-title"
              className="mt-1"
              value={state.sponsorTitle}
              onChange={(e) => set('sponsorTitle', e.target.value)}
              placeholder="e.g. CISO"
            />
          </div>
          <div className="block">
            <label
              htmlFor="charter-signoff-date"
              className="text-xs font-medium text-muted-foreground"
            >
              Mandate sign-off date
            </label>
            <Input
              id="charter-signoff-date"
              type="date"
              className="mt-1"
              value={state.signOffDate}
              onChange={(e) => set('signOffDate', e.target.value)}
            />
          </div>
          <div className="block">
            <label htmlFor="charter-qrpm" className="text-xs font-medium text-muted-foreground">
              QRPM (program manager)
            </label>
            <Input
              id="charter-qrpm"
              className="mt-1"
              value={state.qrpmName}
              onChange={(e) => set('qrpmName', e.target.value)}
              placeholder="e.g. Sam Lee"
            />
          </div>
        </div>
      </section>

      <section className="glass-panel border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Steering Committee · {seatCount} seat{seatCount === 1 ? '' : 's'}
        </h3>
        <p className="text-xs text-muted-foreground">
          Seats are drawn from the framework core-role model so the charter stays consistent with
          the Skills &amp; Team plan and the RACI Builder.
        </p>
        <div className="flex flex-wrap gap-2">
          {STEERCO_ROLE_IDS.map((id) => {
            const role = ROLE_CROSSWALK[id]
            const on = state.steerCo[id]
            return (
              <Button
                key={id}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => toggleSeat(id)}
                aria-pressed={on}
                className={`h-7 px-3 rounded-full border text-[11px] font-semibold transition-all ${
                  on
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted/50'
                }`}
              >
                {role.label}
              </Button>
            )
          })}
        </div>
        <div className="block" role="group" aria-label="Governance cadence">
          <span className="text-xs font-medium text-muted-foreground">Governance cadence</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {CADENCE_OPTIONS.map((c) => (
              <Button
                key={c}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => set('cadence', c)}
                aria-pressed={state.cadence === c}
                className={`h-7 px-3 rounded-full border text-[11px] font-semibold transition-all ${
                  state.cadence === c
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted/50'
                }`}
              >
                {c}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className="glass-panel border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Budget commitment</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="block">
            <label
              htmlFor="charter-budget-year1"
              className="text-xs font-medium text-muted-foreground"
            >
              Year 1 budget
            </label>
            <Input
              id="charter-budget-year1"
              className="mt-1"
              value={state.budgetYear1}
              onChange={(e) => set('budgetYear1', e.target.value)}
              placeholder="e.g. $1.2M"
            />
          </div>
          <div className="block">
            <label
              htmlFor="charter-budget-multiyear"
              className="text-xs font-medium text-muted-foreground"
            >
              Multi-year commitment
            </label>
            <Input
              id="charter-budget-multiyear"
              className="mt-1"
              value={state.budgetMultiYear}
              onChange={(e) => set('budgetMultiYear', e.target.value)}
              placeholder="e.g. $4.5M over 3 yrs"
            />
          </div>
          <div className="block">
            <label
              htmlFor="charter-budget-horizon"
              className="text-xs font-medium text-muted-foreground"
            >
              Horizon (years)
            </label>
            <Input
              id="charter-budget-horizon"
              type="number"
              min={1}
              className="mt-1"
              value={state.budgetHorizonYears}
              onChange={(e) => set('budgetHorizonYears', e.target.value)}
            />
          </div>
        </div>
      </section>

      <ExportableArtifact
        title="Program Charter — Export"
        exportData={exportMarkdown}
        filename="program-charter"
        formats={['markdown', 'pdf', 'docx']}
        onExport={() => {
          addExecutiveDocument({
            id: `program-charter-${Date.now()}`,
            moduleId: 'pqc-governance',
            type: 'program-charter',
            title: `Program Charter — ${new Date().toLocaleDateString()}`,
            data: exportMarkdown,
            inputs: {
              sponsorName: state.sponsorName,
              qrpmName: state.qrpmName,
              cadence: state.cadence,
              seatCount,
            },
            createdAt: Date.now(),
          })
        }}
      >
        <p className="text-sm text-muted-foreground">
          Save this charter to your Command Center under the Governance zone, or export as markdown
          / PDF / Word. This is the Phase-0 mandate artifact (Gate {FRAMEWORK_PHASES.p0.gate?.id}).
        </p>
      </ExportableArtifact>
    </div>
  )
}

export default ProgramCharter

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
import { isAutoRunFillActive } from '@/components/Simulation/autorun/autoRunFill'
import { useSavedArtifactInputs } from '@/hooks/useSavedArtifactInputs'
import { ScrollText, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ExportableArtifact } from '@/components/PKILearning/common/executive/ExportableArtifact'
import { useModuleStore } from '@/store/useModuleStore'
import { ROLE_CROSSWALK, type FrameworkRoleId } from '@/data/roleCrosswalk'
import { FRAMEWORK_PHASES } from '@/data/frameworkPhases'

/** Governance review cadences offered for the SteerCo. */
const CADENCE_OPTIONS = ['Weekly', 'Bi-weekly', 'Monthly', 'Quarterly'] as const
type Cadence = (typeof CADENCE_OPTIONS)[number]

/** The framework's eight Phase-0 workstreams (Applied Quantum Framework v2.1,
 *  Activity 0.3 — Establish Governance Structure). One lead per workstream,
 *  reporting weekly to the QRPM. */
interface Workstream {
  id: string
  label: string
  detail: string
}

export const WORKSTREAMS: Workstream[] = [
  { id: 'inventory-discovery', label: 'Inventory & Discovery', detail: 'Crypto-BOM ownership' },
  { id: 'network-tls-vpn', label: 'Network & TLS/VPN', detail: 'Hybrid rollouts' },
  { id: 'pki-code-signing', label: 'PKI & Code Signing', detail: 'Roots, issuers, toolchains' },
  {
    id: 'apps-platforms',
    label: 'Applications & Platforms',
    detail: 'Libraries, service mesh, cloud',
  },
  {
    id: 'embedded-iot-ot',
    label: 'Embedded / IoT / OT',
    detail: 'Gateways, compensating controls',
  },
  {
    id: 'policy-compliance-procurement',
    label: 'Policy / Compliance / Procurement',
    detail: 'Standards, contract clauses',
  },
  { id: 'vendor-orchestration', label: 'Vendor Orchestration', detail: 'Roadmaps, SLAs' },
  {
    id: 'education-change-mgmt',
    label: 'Education & Change Management',
    detail: 'Training, communications',
  },
]

/** Phase-0 owning roles, surfaced as the suggested SteerCo seat list. The
 *  framework names QRPM + Executive Sponsor as the Phase-0 leads; the broader
 *  set lets the user staff a full committee from one source of truth. */
export const STEERCO_ROLE_IDS: FrameworkRoleId[] = [
  'exec-sponsor',
  'qrpm',
  'crypto-architect',
  'security-eng',
  'appsec-lead',
  'ot-specialist',
  'vendor-lead',
  'pmo-analyst',
]

export interface CharterState {
  programName: string
  purpose: string
  scopeInclude: string
  scopeExclude: string
  sponsorName: string
  sponsorTitle: string
  qrpmName: string
  cadencePmo: Cadence
  cadenceSteerCo: Cadence
  cadenceBoard: Cadence
  budgetYear1: string
  budgetMultiYear: string
  budgetHorizonYears: string
  steerCo: Record<FrameworkRoleId, boolean>
  signOffDate: string
  workstreams: Record<string, boolean>
  successCriteria: string
  riskAppetiteStatement: string
  escalationTriggers: string
}

const todayIso = (): string => new Date().toISOString().slice(0, 10)

export function buildMarkdown(s: CharterState): string {
  const lines: string[] = []
  const programName = s.programName.trim() || 'Post-Quantum Cryptography Migration Program'
  lines.push(`# Program Charter — ${programName}`)
  lines.push('')
  lines.push(
    `*Phase 0 — ${FRAMEWORK_PHASES.p0.name} (${FRAMEWORK_PHASES.p0.tagline}). ` +
      `Gate ${FRAMEWORK_PHASES.p0.gate?.id ?? 'G0'}: ${FRAMEWORK_PHASES.p0.gate?.criterion ?? 'Mandate signed'}.*`
  )
  lines.push('')

  lines.push('## 1. Purpose & objectives')
  lines.push('')
  lines.push(s.purpose.trim() || '_(not yet drafted)_')
  lines.push('')

  lines.push('## 2. Scope')
  lines.push('')
  lines.push(`- **In scope:** ${s.scopeInclude.trim() || '_(TBD)_'}`)
  lines.push(`- **Out of scope:** ${s.scopeExclude.trim() || '_(TBD)_'}`)
  lines.push('')

  lines.push('## 3. Executive sponsorship')
  lines.push('')
  lines.push(`- **Sponsor:** ${s.sponsorName.trim() || '_(unassigned)_'}`)
  lines.push(`- **Title:** ${s.sponsorTitle.trim() || '_(unassigned)_'}`)
  lines.push(`- **Mandate sign-off date:** ${s.signOffDate || '_(pending)_'}`)
  lines.push('')

  lines.push('## 4. Program leadership')
  lines.push('')
  lines.push(
    `- **Quantum-Readiness Program Manager (QRPM):** ${s.qrpmName.trim() || '_(unassigned)_'}`
  )
  lines.push(
    `- **Authority to advance Gate ${FRAMEWORK_PHASES.p0.gate?.id ?? 'G0'}:** ${FRAMEWORK_PHASES.p0.gate?.authority ?? 'Executive Sponsor'}`
  )
  lines.push('')

  lines.push('## 5. Steering Committee (SteerCo)')
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
  lines.push('**Decision cadence:**')
  lines.push('')
  lines.push(`- PMO: ${s.cadencePmo}`)
  lines.push(`- SteerCo: ${s.cadenceSteerCo}`)
  lines.push(`- Board / Risk Committee: ${s.cadenceBoard}`)
  lines.push('')

  lines.push('## 6. Budget commitment')
  lines.push('')
  lines.push(`- **Year 1 budget:** ${s.budgetYear1.trim() || '_(TBD)_'}`)
  lines.push(`- **Multi-year commitment:** ${s.budgetMultiYear.trim() || '_(TBD)_'}`)
  lines.push(`- **Planning horizon:** ${s.budgetHorizonYears.trim() || '_(TBD)_'} years`)
  lines.push('')

  lines.push('## 7. Workstreams')
  lines.push('')
  const activeWorkstreams = WORKSTREAMS.filter((w) => s.workstreams[w.id])
  if (activeWorkstreams.length === 0) {
    lines.push('_No workstreams selected._')
  } else {
    lines.push('| Workstream | Focus |')
    lines.push('|---|---|')
    for (const w of activeWorkstreams) {
      lines.push(`| ${w.label} | ${w.detail} |`)
    }
  }
  lines.push('')

  lines.push('## 8. Success criteria')
  lines.push('')
  lines.push(s.successCriteria.trim() || '_(not yet drafted)_')
  lines.push('')

  lines.push('## 9. Risk appetite statement')
  lines.push('')
  lines.push(s.riskAppetiteStatement.trim() || '_(not yet drafted)_')
  lines.push('')

  lines.push('## 10. Escalation triggers')
  lines.push('')
  lines.push(s.escalationTriggers.trim() || '_(not yet drafted)_')
  lines.push('')

  lines.push('---')
  lines.push('')
  lines.push(
    '*Aligned to NIST CSWP 39 §5 (Crypto Agility Strategic Plan — governance) and the ' +
      'Applied Quantum Phase 0 Executive Mandate. https://doi.org/10.6028/NIST.CSWP.39-upd1*'
  )
  return lines.join('\n')
}

export const ProgramCharter: React.FC = () => {
  const addExecutiveDocument = useModuleStore((s) => s.addExecutiveDocument)
  const savedInputs = useSavedArtifactInputs<CharterState>('program-charter')
  const [state, setState] = useState<CharterState>(() => {
    const base: CharterState = {
      programName: '',
      purpose: '',
      scopeInclude: '',
      scopeExclude: '',
      sponsorName: '',
      sponsorTitle: '',
      qrpmName: '',
      cadencePmo: 'Weekly',
      cadenceSteerCo: 'Monthly',
      cadenceBoard: 'Quarterly',
      budgetYear1: '',
      budgetMultiYear: '',
      budgetHorizonYears: '3',
      steerCo: {
        'exec-sponsor': true,
        qrpm: true,
        'crypto-architect': true,
        'security-eng': true,
        'appsec-lead': false,
        'ot-specialist': false,
        'vendor-lead': false,
        'pmo-analyst': true,
      },
      signOffDate: todayIso(),
      workstreams: Object.fromEntries(WORKSTREAMS.map((w) => [w.id, false])),
      successCriteria: '',
      riskAppetiteStatement: '',
      escalationTriggers: '',
    }
    // Auto-run demo fill: role titles (no invented names) + framework-anchored
    // illustrative content (Phase 0 activities 0.2c economics / 0.3 governance).
    if (isAutoRunFillActive()) {
      return {
        ...base,
        programName: 'Post-Quantum Cryptography Migration Program',
        purpose:
          'Migrate the enterprise to NIST-standardized post-quantum cryptography ahead of mandate deadlines — protecting harvest-now-decrypt-later data and long-lived trust anchors — and establish durable crypto-agility.',
        scopeInclude:
          'Internet-exposed key exchange (TLS, VPN), >10-year secrecy data, and signature/PKI trust anchors across Tier-1 systems (Two-Track: HNDL + TNFL).',
        scopeExclude:
          'Systems past their confidentiality horizon or slated for retirement — addressed via crypto-shred / decommission rather than migration.',
        sponsorName: 'Chief Information Security Officer',
        sponsorTitle: 'Executive Sponsor',
        qrpmName: 'Head of Cryptographic Engineering',
        budgetYear1: '$1.5M–$4M — discovery, tooling, 2–3 hybrid pilots, training',
        budgetMultiYear: 'Phased multi-year program aligned to infrastructure refresh cycles',
        successCriteria:
          'Phase-0 gate passed; board KPI pack baselined (Coverage, Trust, Inventory, Vendors, Agility) with Year-1 targets; CBOM v1 at ≥70% Tier-1 coverage; two hybrid pilots (TLS, VPN) live.',
        escalationTriggers:
          'Escalate to SteerCo/Board on: a material change in CRQC timeline estimates; the program running >6 months behind the regulatory buffer; a confirmed vulnerability in a deployed PQC algorithm; a Tier-1 vendor abandoning PQC without an alternative.',
      }
    }
    // Restore the user's last-saved charter so it round-trips across visits.
    if (savedInputs) {
      return {
        ...base,
        ...savedInputs,
        steerCo: { ...base.steerCo, ...savedInputs.steerCo },
        workstreams: { ...base.workstreams, ...savedInputs.workstreams },
      }
    }
    return base
  })

  const set = <K extends keyof CharterState>(key: K, value: CharterState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }))

  const toggleSeat = (id: FrameworkRoleId) =>
    setState((prev) => ({
      ...prev,
      steerCo: { ...prev.steerCo, [id]: !prev.steerCo[id] },
    }))

  const toggleWorkstream = (id: string) =>
    setState((prev) => ({
      ...prev,
      workstreams: { ...prev.workstreams, [id]: !prev.workstreams[id] },
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

      <section className="glass-panel border border-border rounded-lg p-3">
        <div className="flex items-start gap-2 text-xs text-foreground/80">
          <Info size={14} className="text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p>
              <span className="font-semibold text-foreground">
                Gate {FRAMEWORK_PHASES.p0.gate?.id ?? 'G0'}:
              </span>{' '}
              {FRAMEWORK_PHASES.p0.gate?.criterion ?? 'Mandate signed'} — sign-off authority:{' '}
              {FRAMEWORK_PHASES.p0.gate?.authority ?? 'Executive Sponsor'}.
            </p>
            <p>
              Aligned to{' '}
              <a
                href="https://doi.org/10.6028/NIST.CSWP.39-upd1"
                target="_blank"
                rel="noopener noreferrer"
                // `underline`, not `hover:underline`: this link sits inside a
                // paragraph, so colour alone is not a sufficient affordance
                // (axe link-in-text-block / WCAG 1.4.1).
                className="text-primary underline"
              >
                NIST CSWP 39
              </a>{' '}
              §5 (Crypto Agility Strategic Plan — governance) and the Applied Quantum Phase 0
              Executive Mandate.
            </p>
          </div>
        </div>
      </section>

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
        <h3 className="text-sm font-semibold text-foreground">Purpose &amp; scope</h3>
        <div className="block">
          <label htmlFor="charter-purpose" className="text-xs font-medium text-muted-foreground">
            Purpose &amp; objectives
          </label>
          <Textarea
            id="charter-purpose"
            className="mt-1 min-h-[64px] resize-y"
            value={state.purpose}
            onChange={(e) => set('purpose', e.target.value)}
            placeholder="e.g. Migrate the enterprise to NIST-standardized PQC ahead of mandate deadlines — protecting harvest-now-decrypt-later data and long-lived trust anchors — and establish durable crypto-agility."
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="block">
            <label htmlFor="charter-scope-in" className="text-xs font-medium text-muted-foreground">
              In scope
            </label>
            <Textarea
              id="charter-scope-in"
              className="mt-1 min-h-[64px] resize-y"
              value={state.scopeInclude}
              onChange={(e) => set('scopeInclude', e.target.value)}
              placeholder="e.g. Internet-exposed key exchange (TLS, VPN), >10-year secrecy data, signature/PKI trust anchors on Tier-1 systems."
            />
          </div>
          <div className="block">
            <label
              htmlFor="charter-scope-out"
              className="text-xs font-medium text-muted-foreground"
            >
              Out of scope
            </label>
            <Textarea
              id="charter-scope-out"
              className="mt-1 min-h-[64px] resize-y"
              value={state.scopeExclude}
              onChange={(e) => set('scopeExclude', e.target.value)}
              placeholder="e.g. Systems past their confidentiality horizon or slated for retirement (crypto-shred / decommission instead of migrate)."
            />
          </div>
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
        <p className="text-[11px] text-muted-foreground">
          The framework&apos;s full SteerCo is broader than the role model&apos;s seats — it also
          includes Compliance/Legal, PKI/Identity, Infrastructure/NetSec, and Business-Unit
          representatives. Add them as named members when you formalize the committee.
        </p>
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Decision cadence</span>
          {(
            [
              ['PMO', 'cadencePmo'],
              ['SteerCo', 'cadenceSteerCo'],
              ['Board / Risk Committee', 'cadenceBoard'],
            ] as const
          ).map(([label, key]) => (
            <div key={key} className="block" role="group" aria-label={`${label} cadence`}>
              <span className="text-[11px] text-muted-foreground">{label}</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {CADENCE_OPTIONS.map((c) => (
                  <Button
                    key={c}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => set(key, c)}
                    aria-pressed={state[key] === c}
                    className={`h-7 px-3 rounded-full border text-[11px] font-semibold transition-all ${
                      state[key] === c
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    {c}
                  </Button>
                ))}
              </div>
            </div>
          ))}
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
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded p-2.5">
          <Info size={12} className="text-primary shrink-0 mt-0.5" />
          <p>
            <span className="font-medium text-foreground">
              Cost-driver taxonomy (Framework Activity 0.2c):
            </span>{' '}
            discovery &amp; inventory tooling; cryptographic engineering labor (typically the
            largest line); vendor PQC licensing &amp; upgrades; HSM/hardware refresh (firmware
            upgrades alone $50K&ndash;$500K+ depending on module count); PKI modernization;
            performance &amp; capacity uplift; testing environments; program management overhead.{' '}
            <span className="font-medium text-foreground">Reference program economics:</span> a
            large-enterprise Year 1 foundation typically runs $1.5M&ndash;$4M (varies by estate
            complexity); a major global telco&apos;s decade-scale program has run on the order of
            $300M&ndash;$500M, peaking around 50 FTEs (illustrative anchors, not a quote for your
            organization).
          </p>
        </div>
      </section>

      <section className="glass-panel border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Workstreams (optional) · {WORKSTREAMS.filter((w) => state.workstreams[w.id]).length}{' '}
          selected
        </h3>
        <p className="text-xs text-muted-foreground">
          The framework's eight Phase-0 workstreams (Activity 0.3). Select the ones this charter
          stands up leads for now — the rest can be added as the program scales.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {WORKSTREAMS.map((w) => {
            const on = state.workstreams[w.id]
            return (
              <Button
                key={w.id}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => toggleWorkstream(w.id)}
                aria-pressed={on}
                className={`h-auto justify-start px-3 py-1.5 rounded-md border text-left text-[11px] font-normal transition-all ${
                  on
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <span className="font-semibold">{w.label}</span>
                <span className="block text-muted-foreground">{w.detail}</span>
              </Button>
            )
          })}
        </div>
        <div className="block">
          <label htmlFor="charter-success" className="text-xs font-medium text-muted-foreground">
            Success criteria
          </label>
          <Textarea
            id="charter-success"
            className="mt-1 min-h-[64px] resize-y"
            value={state.successCriteria}
            onChange={(e) => set('successCriteria', e.target.value)}
            placeholder="e.g. Phase-0 gate passed; board KPI pack baselined (Coverage, Trust, Inventory, Vendors, Agility) with Year-1 targets; CBOM v1 at ≥70% Tier-1 coverage; two hybrid pilots (TLS, VPN) live."
          />
        </div>
        <div className="block">
          <label
            htmlFor="charter-risk-appetite"
            className="text-xs font-medium text-muted-foreground"
          >
            Risk appetite statement (optional)
          </label>
          <Textarea
            id="charter-risk-appetite"
            className="mt-1 min-h-[80px] resize-y"
            value={state.riskAppetiteStatement}
            onChange={(e) => set('riskAppetiteStatement', e.target.value)}
            placeholder="e.g. HNDL: ≤20% of >10-year secrecy data quantum-vulnerable by end of 2027, 0% by end of 2029. TNFL: all production software/firmware signing on NIST-approved quantum-resistant signatures by end of 2027, all CA signing keys PQC-capable by end of 2029."
          />
        </div>
        <div className="block">
          <label htmlFor="charter-escalation" className="text-xs font-medium text-muted-foreground">
            Escalation triggers
          </label>
          <Textarea
            id="charter-escalation"
            className="mt-1 min-h-[64px] resize-y"
            value={state.escalationTriggers}
            onChange={(e) => set('escalationTriggers', e.target.value)}
            placeholder="e.g. Escalate to SteerCo/Board on: a material change in CRQC timeline estimates; the program running >6 months behind the regulatory buffer; a confirmed vulnerability in a deployed PQC algorithm; a Tier-1 vendor abandoning PQC without an alternative."
          />
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
            inputs: state,
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

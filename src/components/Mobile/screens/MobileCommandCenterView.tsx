// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ChevronDown, LayoutDashboard, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  useBusinessMetrics,
  type BusinessMetrics,
} from '@/components/BusinessCenter/hooks/useBusinessMetrics'
import { ActionItemsSection } from '@/components/BusinessCenter/sections/ActionItemsSection'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'
import {
  computeZoneTiers,
  computeStepTiers,
  TIER_LABELS,
  primaryStepForZone,
  type CSWP39StepId,
  type MaturityTier,
} from '@/components/BusinessCenter/lib/cswp39Tier'
import { CSWP39_ZONE_DETAILS, type ZoneId } from '@/data/cswp39ZoneData'
import type { ExecutiveDocument, ExecutiveDocumentType } from '@/services/storage/types'

const TIER_STYLES: Record<MaturityTier, string> = {
  1: 'bg-muted text-muted-foreground border-border',
  2: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  3: 'bg-status-info/15 text-status-info border-status-info/30',
  4: 'bg-status-success/15 text-status-success border-status-success/30',
}

// Same 4 board-level questions BusinessCenterView.tsx's own private
// BOARD_QUESTIONS/TOP_TOOL_IDS literals carry — replicated (module-local
// consts, not exported) rather than imported, matching this session's
// precedent for small real literals living alongside desktop-only JSX.
const BOARD_QUESTIONS: { q: string; desc: string; to: string; cta: string }[] = [
  {
    q: "What's at risk?",
    desc: 'Size your quantum exposure by system and data sensitivity.',
    to: '/assess',
    cta: 'Run risk assessment',
  },
  {
    q: "What's the deadline?",
    desc: 'See the mandates and dates that apply to your sector and region.',
    to: '/compliance?tab=compliance',
    cta: 'Compliance deadlines',
  },
  {
    q: 'What will it cost?',
    desc: 'Model the budget, ROI, and the cost of waiting.',
    to: '/business/tools/roi-calculator',
    cta: 'ROI calculator',
  },
  {
    q: 'Who owns it?',
    desc: 'Assign accountability and set the governance model.',
    to: '/business/tools/raci-builder',
    cta: 'RACI builder',
  },
]
const TOP_TOOL_IDS = ['roi-calculator', 'board-pitch', 'risk-register']

// ── "Missing for next tier" — README §13 claims this exists on desktop; it
// doesn't (verified: TierBadge.tsx only ever renders reasons FOR the tier
// already achieved, never an absence/next-tier message — confirmed via grep,
// zero hits). Built here as genuinely new UI, per the user's explicit
// decision, from the SAME real threshold constants and boolean gates
// cswp39Tier.ts's own governTier/inventoryTier/identifyGapsTier/
// prioritiseTier/implementTier use — copied verbatim from that file's real
// conditions (2026-08-23), not invented. hasArtifact/hasSection below
// replicate that file's own private (non-exported) helpers of the same
// name, over the same public metrics.artifactsByPillar field.
function allArtifacts(metrics: BusinessMetrics): ExecutiveDocument[] {
  const { risk, compliance, governance, vendor, inventory, architecture } =
    metrics.artifactsByPillar
  return [...risk, ...compliance, ...governance, ...vendor, ...inventory, ...architecture]
}
function hasArtifact(metrics: BusinessMetrics, type: ExecutiveDocumentType): boolean {
  return allArtifacts(metrics).some((d) => d.type === type)
}
function hasSection(
  metrics: BusinessMetrics,
  type: ExecutiveDocumentType,
  heading: string
): boolean {
  const needle = `## ${heading.toLowerCase()}`
  return allArtifacts(metrics).some(
    (d) => d.type === type && (d.data || '').toLowerCase().includes(needle)
  )
}

const LABEL: Record<string, string> = {
  'policy-draft': 'a policy draft',
  'raci-matrix': 'a RACI matrix',
  'audit-checklist': 'an audit checklist',
  'compliance-checklist': 'a compliance checklist',
  'contract-clause': 'a contract clause',
  'supply-chain-matrix': 'a supply-chain matrix',
  'risk-register': 'a risk register',
  'vendor-scorecard': 'a vendor scorecard',
  'compliance-timeline': 'a compliance timeline',
  'kpi-dashboard': 'a KPI dashboard',
  'kpi-tracker': 'a KPI tracker',
  'crqc-scenario': 'a CRQC scenario',
  'migration-roadmap': 'a migration roadmap',
  'risk-treatment-plan': 'a risk treatment plan',
  'deployment-playbook': 'a deployment playbook',
}

function missingForNextTier(
  stepId: CSWP39StepId,
  metrics: BusinessMetrics,
  tier: MaturityTier
): string | null {
  if (tier >= 4) return null
  const policy = hasArtifact(metrics, 'policy-draft')
  const raci = hasArtifact(metrics, 'raci-matrix')
  const checklist =
    hasArtifact(metrics, 'audit-checklist') || hasArtifact(metrics, 'compliance-checklist')
  const contract = hasArtifact(metrics, 'contract-clause')
  const allGovDone =
    metrics.governanceModules.length > 0 &&
    metrics.governanceModules.every((m) => m.status === 'completed')
  const exceptionsDocumented = hasSection(metrics, 'audit-checklist', 'Exceptions')

  const assessedLayers = metrics.infraLayerCoverage.filter((l) => l.assessed).length
  const products = metrics.bookmarkedProducts.length
  const supplyMatrix = hasArtifact(metrics, 'supply-chain-matrix')
  const cbomDocumented = hasSection(metrics, 'supply-chain-matrix', 'CBOM')
  const pipelineDocumented = hasSection(metrics, 'supply-chain-matrix', 'Pipeline Sources')

  const register = hasArtifact(metrics, 'risk-register')
  const scorecard = hasArtifact(metrics, 'vendor-scorecard')
  const tracked = metrics.trackedFrameworks.length >= 1
  const observabilityDocumented = hasSection(
    metrics,
    'vendor-scorecard',
    'Observability Tooling Notes'
  )

  const timeline = hasArtifact(metrics, 'compliance-timeline')
  const anyKpi = hasArtifact(metrics, 'kpi-dashboard') || hasArtifact(metrics, 'kpi-tracker')
  const crqc = hasArtifact(metrics, 'crqc-scenario')
  const methodologyDocumented = hasSection(metrics, 'kpi-dashboard', 'How this score is computed')

  const roadmap = hasArtifact(metrics, 'migration-roadmap')
  const treatment = hasArtifact(metrics, 'risk-treatment-plan')
  const playbook = hasArtifact(metrics, 'deployment-playbook')
  const mitigationDocumented = hasSection(metrics, 'migration-roadmap', 'Mitigation Gateway')
  const decommissionDocumented = hasSection(metrics, 'deployment-playbook', 'Decommission')
  const evidenceDocumented = hasSection(metrics, 'audit-checklist', 'Evidence')

  switch (stepId) {
    case 'govern':
      if (tier === 1)
        return `Add ${LABEL['policy-draft']}, ${LABEL['raci-matrix']}, or track a compliance framework.`
      if (tier === 2) {
        const need = [
          !policy && LABEL['policy-draft'],
          !raci && LABEL['raci-matrix'],
          !checklist && LABEL['audit-checklist'],
        ].filter(Boolean)
        return need.length ? `Still need: ${need.join(', ')}.` : null
      }
      return (
        [
          !allGovDone && 'complete every governance learning module',
          !contract && LABEL['contract-clause'],
          !exceptionsDocumented && 'document exceptions in your audit checklist',
        ]
          .filter(Boolean)
          .join(', ') || null
      )
    case 'inventory':
      if (tier === 1)
        return `Bookmark a product, complete your risk assessment, or add ${LABEL['supply-chain-matrix']}.`
      if (tier === 2) {
        const need: string[] = []
        if (assessedLayers < 6)
          need.push(
            `assess ${6 - assessedLayers} more infra layer${6 - assessedLayers === 1 ? '' : 's'}`
          )
        if (products < 5)
          need.push(`bookmark ${5 - products} more product${5 - products === 1 ? '' : 's'}`)
        return need.length ? `Still need: ${need.join(', ')}.` : null
      }
      return (
        [
          assessedLayers < 8 && `assess ${8 - assessedLayers} more infra layer(s)`,
          !supplyMatrix && LABEL['supply-chain-matrix'],
          !cbomDocumented && 'document CBOM asset classes',
          !pipelineDocumented && 'document pipeline sources',
        ]
          .filter(Boolean)
          .join(', ') || null
      )
    case 'identify-gaps':
      if (tier === 1) return `Add ${LABEL['risk-register']} or complete your risk assessment.`
      if (tier === 2) {
        const need = [
          !register && LABEL['risk-register'],
          !scorecard && LABEL['vendor-scorecard'],
          !tracked && 'track a compliance framework',
        ].filter(Boolean)
        return need.length ? `Still need: ${need.join(', ')}.` : null
      }
      return (
        [
          metrics.assessmentHistory.length < 2 && 'complete a second assessment',
          !observabilityDocumented && 'document observability tooling notes',
        ]
          .filter(Boolean)
          .join(', ') || null
      )
    case 'prioritise':
      if (tier === 1) return `Add ${LABEL['compliance-timeline']} or a KPI dashboard.`
      if (tier === 2)
        return !anyKpi
          ? 'Still need: a KPI dashboard or tracker.'
          : !timeline
            ? `Still need: ${LABEL['compliance-timeline']}.`
            : null
      return (
        [
          !crqc && LABEL['crqc-scenario'],
          metrics.assessmentHistory.length < 3 && 'complete a third assessment',
          !methodologyDocumented && 'document your KPI scoring methodology',
        ]
          .filter(Boolean)
          .join(', ') || null
      )
    case 'implement':
      if (tier === 1) return `Add ${LABEL['migration-roadmap']} or start a migration.`
      if (tier === 2) {
        const need = [
          !roadmap && LABEL['migration-roadmap'],
          !treatment && LABEL['risk-treatment-plan'],
          !playbook && LABEL['deployment-playbook'],
        ].filter(Boolean)
        return need.length ? `Still need: ${need.join(', ')}.` : null
      }
      return (
        [
          !metrics.workflowActive && 'start an active migration workflow',
          metrics.completedPhases.length < 3 && 'complete 3+ migration phases',
          !mitigationDocumented && 'document your mitigation gateway',
          !decommissionDocumented && 'document a decommission plan',
          !evidenceDocumented && 'document evidence (CMVP/ACVP/ESV/CVE-scan)',
        ]
          .filter(Boolean)
          .join(', ') || null
      )
  }
}

const ZONE_ORDER: ZoneId[] = [
  'governance',
  'assets',
  'management-tools',
  'risk-management',
  'mitigation',
  'migration',
]

/**
 * Mobile Command Center (handoff Phase 8 — Workflow set, design handoff
 * §13). The mockup's framing — 5 CSWP.39 steps with badges, an "N open ·
 * nearest is X" action-items strip, a live Cyber Insurance Lens — doesn't
 * match live code (verified before writing any UI). Real bare `/business`
 * renders 6 Fig-3 zones (Governance/Assets/Management Tools/Data-Centric
 * Risk Management/Mitigation/Migration via computeZoneTiers()), not 5
 * step-badges (that UI exists only on /business/tools/:id). The real action
 * items heading is "Your next steps" with real generated titles — none is
 * "Q3 board update". The Cyber Insurance Lens is real, honestly-caveated
 * code, but was explicitly REMOVED from /business (git: "component file
 * retained") — resurrecting it here would show mobile readers something
 * desktop itself dropped, so it's omitted, per the user's explicit choice.
 * "34 planning tools" is stale — real count is 37 (BUSINESS_TOOLS.length).
 *
 * Scope confirmed with the user: 6 real zones (not a forced 5-step
 * reframing), no insurance lens. "What's missing for the next tier" doesn't
 * exist on desktop at all (TierBadge.tsx only ever shows reasons FOR the
 * achieved tier) — built here as genuinely new UI from the same real
 * threshold constants/boolean gates cswp39Tier.ts's own tier functions use,
 * not invented text (see missingForNextTier above).
 *
 * Reuses real desktop logic/components verbatim: useBusinessMetrics() (the
 * same real hook driving every Command Center panel), ActionItemsSection
 * (explicitly generic — already `max-md:flex-col`, no baked-in desktop-only
 * layout — imported directly), computeZoneTiers/computeStepTiers/
 * TIER_LABELS/ZONE_STEP_CONTRIBUTORS/primaryStepForZone (the real tier
 * computation, so a zone's maturity can never drift from desktop's), and
 * CSWP39_ZONE_DETAILS (the real 6 zone titles/descriptions/CSWP.39 refs).
 * BUSINESS_TOOLS is the real registry (37 tools, corrected from the
 * mockup's stale 34).
 */
export function MobileCommandCenterView() {
  const metrics = useBusinessMetrics()
  const [openZone, setOpenZone] = useState<ZoneId | null>(null)

  const zoneTiers = useMemo(() => computeZoneTiers(metrics), [metrics])
  const stepTiers = useMemo(() => computeStepTiers(metrics), [metrics])

  if (metrics.isFullyEmpty) {
    const topTools = TOP_TOOL_IDS.map((id) => BUSINESS_TOOLS.find((t) => t.id === id)).filter(
      (t): t is (typeof BUSINESS_TOOLS)[number] => Boolean(t)
    )
    return (
      <div className="px-4 pb-24 pt-4">
        <h1 className="mb-1 text-[17px] font-extrabold leading-tight text-foreground">
          Command Center
        </h1>
        <div className="mt-3 glass-panel p-4 text-center">
          <LayoutDashboard
            size={32}
            className="mx-auto mb-3 text-muted-foreground"
            aria-hidden="true"
          />
          <h2 className="text-[14px] font-bold text-foreground">
            Welcome to your PQC Command Center
          </h2>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
            A post-quantum migration is a program, and every program answers the same four
            board-level questions.
          </p>
          <Link
            to="/simulation?run=exec"
            className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-secondary to-primary px-4 text-[11.5px] font-bold text-primary-foreground"
          >
            <PlayCircle size={13} aria-hidden="true" />
            New here? Watch the guided overview
          </Link>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {BOARD_QUESTIONS.map((item) => (
            <Link key={item.q} to={item.to} className="glass-panel p-3">
              <p className="text-[12.5px] font-bold text-foreground">{item.q}</p>
              <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted-foreground">
                {item.desc}
              </p>
              <span className="mt-1 block text-[10.5px] font-semibold text-primary">
                {item.cta} →
              </span>
            </Link>
          ))}
        </div>
        {topTools.length > 0 && (
          <>
            <p className="mb-2 mt-4 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Start with these tools
            </p>
            <div className="flex flex-col gap-2">
              {topTools.map((tool) => (
                <Link
                  key={tool.id}
                  to={`/business/tools/${tool.id}`}
                  className="glass-panel flex items-center gap-2.5 p-3"
                >
                  <tool.icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <p className="text-[12px] font-semibold text-foreground">{tool.name}</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="px-4 pb-24 pt-4">
      <h1 className="mb-3 text-[17px] font-extrabold leading-tight text-foreground">
        Command Center
      </h1>

      <ActionItemsSection metrics={metrics} cap={3} />

      <p className="mb-2 mt-4 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        CSWP.39 posture — 6 zones
      </p>
      <p className="mb-3 text-[10.5px] leading-relaxed text-muted-foreground">
        Each zone's tier is computed from the artifacts you have on file, not self-declared.
      </p>
      <div className="flex flex-col gap-2">
        {ZONE_ORDER.map((zoneId) => {
          const zone = CSWP39_ZONE_DETAILS[zoneId]
          const result = zoneTiers[zoneId]
          const isOpen = openZone === zoneId
          const step = primaryStepForZone(zoneId)
          const missing = missingForNextTier(step, metrics, stepTiers[step].tier)
          return (
            <div key={zoneId} className="glass-panel overflow-hidden">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpenZone((cur) => (cur === zoneId ? null : zoneId))}
                aria-expanded={isOpen}
                className="flex h-auto w-full items-center justify-start gap-2 rounded-none px-3.5 py-2.5 text-left"
              >
                <span className="flex-1 text-[12.5px] font-bold text-foreground">{zone.title}</span>
                <span
                  className={cn(
                    'rounded border px-1.5 py-0.5 text-[9.5px] font-semibold',
                    TIER_STYLES[result.tier]
                  )}
                >
                  Tier {result.tier} · {TIER_LABELS[result.tier]}
                </span>
                <ChevronDown
                  size={14}
                  className={cn(
                    'shrink-0 text-muted-foreground transition-transform',
                    isOpen && 'rotate-180'
                  )}
                  aria-hidden="true"
                />
              </Button>
              {isOpen && (
                <div className="flex flex-col gap-2 border-t border-border px-3.5 pb-3 pt-2.5">
                  <p className="text-[10.5px] leading-relaxed text-muted-foreground">{zone.what}</p>
                  {result.reasons.length > 0 && (
                    <ul className="list-disc space-y-0.5 pl-4 text-[10.5px] text-muted-foreground">
                      {result.reasons.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  )}
                  {missing && (
                    <p className="rounded-lg border border-primary/20 bg-primary/5 p-2 text-[10.5px] leading-relaxed text-foreground/80">
                      For {TIER_LABELS[Math.min(4, stepTiers[step].tier + 1) as MaturityTier]}:{' '}
                      {missing}
                    </p>
                  )}
                  <p className="font-mono text-[9.5px] text-muted-foreground">{zone.cswpRef}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="mt-4 border-t border-border pt-3 text-[10.5px] leading-relaxed text-muted-foreground">
        Read your maturity here. The {BUSINESS_TOOLS.length} planning tools, the CBOM builder, and
        the artifact drawer that produce these artifacts are on a laptop.
      </p>
    </div>
  )
}
